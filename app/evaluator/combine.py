from typing import List, Tuple, Dict, Optional
import asyncio

from .ast_similarity import get_ast_similarity
from .execute import judge0_execute, local_python_execute
from .llm_evaluator import get_llm_evaluator


async def evaluate_code_async(
	language: str, 
	student_code: str, 
	ideal_code: str, 
	test_cases: List[dict],
	question_text: str = ""
) -> tuple[float, str, float, float, float, List[bool], Dict[str, str], List[dict]]:
	"""
	New evaluation system with LLM integration.
	
	Scoring: 20% effort + 40% logic + 40% test cases
	
	Returns:
		(score, feedback, correctness, logic_similarity, effort, public_results, llm_feedback, detailed_results)
	"""
	public_results: List[bool] = []
	detailed_results: List[dict] = []

	def run_case(inp: str) -> tuple[str, str, int, float]:
		import time
		start_time = time.time()
		try:
			# Normalize stdin so all languages get at least one newline-terminated line
			safe_stdin = inp if isinstance(inp, str) else str(inp)
			if safe_stdin == '':
				safe_stdin = '\n'
			elif not safe_stdin.endswith('\n'):
				safe_stdin = safe_stdin + '\n'
			if language == 'python' and not _has_judge0():
				out, err, code = local_python_execute(student_code, safe_stdin)
			else:
				out, err, code = judge0_execute(language, student_code, safe_stdin)
				# If Judge0 fails with runtime error but we have output, use it
				if code == 11 and out.strip():
					code = 0  # Treat as success if we got valid output
			exec_time = time.time() - start_time
			return out, err, code, exec_time
		except Exception as e:
			exec_time = time.time() - start_time
			return '', f'exec_failed: {str(e)}', 1, exec_time

	# Run test cases (only public test cases - no private ones)
	for tc in test_cases:
		# Only evaluate public test cases
		if not tc.get('is_public', True):
			continue
			
		out, err, code, exec_time = run_case(tc['input'])
		
		# Debug logging
		print(f"DEBUG: Input='{tc['input']}'")
		print(f"DEBUG: Expected='{tc['expected_output']}' (repr: {repr(tc['expected_output'])})")
		print(f"DEBUG: Actual='{out}' (repr: {repr(out)})")
		
		# More robust comparison - handle various whitespace issues
		expected_clean = tc['expected_output'].strip()
		actual_clean = out.strip()
		
		# Also try without any whitespace
		expected_no_ws = ''.join(tc['expected_output'].split())
		actual_no_ws = ''.join(out.split())
		
		# Judge0 status codes: 0 = Success, 3 = Accepted
		success = (code == 0 or code == 3) and out.strip()
		if not success and out.strip():
			# If we got output but wrong status code, still consider it successful
			success = True
		
		passed = success and (
			actual_clean == expected_clean or 
			actual_no_ws == expected_no_ws
		)
		
		# Store detailed result
		detailed_results.append({
			'input': tc['input'],
			'expected_output': tc['expected_output'],
			'actual_output': out,
			'passed': passed,
			'error': err if not success else None,
			'execution_time': exec_time
		})
		
		public_results.append(passed)
	
	# Test case score (40% weight) - only public test cases
	test_case_score = (sum(public_results) / len(public_results)) if public_results else 0.0
	
	# Prepare test results for LLM
	test_results_summary = {
		'results': detailed_results,
		'passed': sum(public_results),
		'total': len(public_results)
	}
	
	# Get LLM evaluator
	llm_evaluator = get_llm_evaluator()
	
	# Evaluate effort using LLM (20% weight)
	effort_score, effort_breakdown, effort_reasoning = await llm_evaluator.evaluate_effort(
		student_code, ideal_code, language, question_text, test_results_summary
	)
	
	# Evaluate logic similarity - hybrid approach: AST when available, LLM as fallback
	ast_sim = get_ast_similarity(language, student_code, ideal_code)
	
	if ast_sim is not None and ast_sim > 0.0:
		# AST comparison succeeded - combine with LLM for reliability
		try:
			llm_sim, logic_breakdown, logic_notes = await llm_evaluator.evaluate_logic_similarity(
				student_code, ideal_code, language, question_text
			)
			# Weighted average: AST gives structural similarity, LLM gives semantic
			# For languages with AST: 60% AST, 40% LLM
			# However, if LLM detects low relevance, prioritize LLM's strict assessment
			if logic_breakdown.get('relevance', 1.0) < 0.3:
				# Very low relevance - use LLM score directly (more strict)
				logic_similarity = llm_sim * 0.5  # Further penalize for irrelevance
				print(f"⚠️ Low relevance detected (relevance={logic_breakdown.get('relevance', 0):.2f}), applying strict penalty")
			else:
				logic_similarity = (ast_sim * 0.6) + (llm_sim * 0.4)
			print(f"🔍 Hybrid logic similarity ({language}): AST={ast_sim:.3f}, LLM={llm_sim:.3f}, Final={logic_similarity:.3f}")
		except Exception as e:
			# LLM failed, use AST only
			print(f"⚠️ LLM evaluation failed, using AST only: {e}")
			logic_similarity = ast_sim
			logic_breakdown = {}
			logic_notes = f"AST-only evaluation (LLM failed: {str(e)})"
	else:
		# No AST support or AST failed - use LLM only (works for all languages)
		logic_similarity, logic_breakdown, logic_notes = await llm_evaluator.evaluate_logic_similarity(
			student_code, ideal_code, language, question_text
		)
		# Apply strict penalty if LLM detects low relevance
		if logic_breakdown.get('relevance', 1.0) < 0.3:
			logic_similarity = logic_similarity * 0.5  # Further penalize for irrelevance
			print(f"⚠️ Low relevance detected (relevance={logic_breakdown.get('relevance', 0):.2f}), applying strict penalty: {logic_similarity:.3f}")
		if ast_sim is None:
			print(f"🔍 No AST parser for {language}, using LLM only: {logic_similarity:.3f}")
		else:
			print(f"🔍 AST failed for {language}, using LLM only: {logic_similarity:.3f}")
	
	# Calculate final score: 20% effort + 40% logic + 40% test cases
	# If all test cases pass, award full marks (100%)
	if test_case_score >= 1.0 and public_results and all(public_results):
		final_score = 100.0
		print(f"✅ All test cases passed - awarding full marks (100%)")
	else:
		final_score = (effort_score * 0.2 + logic_similarity * 0.4 + test_case_score * 0.4) * 100.0
	
	# Generate comprehensive feedback using LLM
	llm_feedback = await llm_evaluator.generate_feedback(
		student_code, ideal_code, language, question_text,
		test_results_summary, effort_score, logic_similarity, test_case_score
	)
	
	# Create summary feedback string
	feedback_parts: List[str] = []
	feedback_parts.append(f"Test Cases: {round(test_case_score*100)}% ({sum(public_results)}/{len(public_results)} passed)")
	feedback_parts.append(f"Logic Similarity: {round(logic_similarity*100)}%")
	feedback_parts.append(f"Effort: {round(effort_score*100)}%")
	feedback_parts.append(f"Final Score: {round(final_score, 2)}/100")
	
	if public_results and not all(public_results):
		idxes = [str(i+1) for i, ok in enumerate(public_results) if not ok]
		feedback_parts.append(f"Failing test cases: {', '.join(idxes)}")
	
	summary_feedback = " | ".join(feedback_parts)
	
	return (
		final_score, 
		summary_feedback, 
		test_case_score, 
		logic_similarity, 
		effort_score, 
		public_results, 
		llm_feedback, 
		detailed_results
	)


# Synchronous wrapper for backward compatibility
def evaluate_code(
	language: str, 
	student_code: str, 
	ideal_code: str, 
	test_cases: List[dict],
	question_text: str = ""
) -> tuple[float, str, float, float, float, List[bool], Dict[str, str], List[dict]]:
	"""
	Synchronous wrapper for async evaluation.
	Maintains backward compatibility with existing code.
	"""
	try:
		# Try to get existing event loop
		loop = asyncio.get_event_loop()
		if loop.is_running():
			# If loop is already running, we need to use a thread
			import concurrent.futures
			with concurrent.futures.ThreadPoolExecutor() as executor:
				future = executor.submit(
					asyncio.run,
					evaluate_code_async(language, student_code, ideal_code, test_cases, question_text)
				)
				return future.result()
		else:
			return loop.run_until_complete(
				evaluate_code_async(language, student_code, ideal_code, test_cases, question_text)
			)
	except RuntimeError:
		# No event loop, create new one
		return asyncio.run(
			evaluate_code_async(language, student_code, ideal_code, test_cases, question_text)
		)


def _has_judge0() -> bool:
	import os
	return bool(os.environ.get('LABSENSE_JUDGE0_URL'))
