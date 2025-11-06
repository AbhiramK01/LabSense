"""
LLM-based evaluation for code effort and logic similarity.
Supports both API (OpenAI/Anthropic) and local LLM (Ollama/vLLM).
"""

import os
import json
import asyncio
from typing import Dict, Optional, Tuple
from enum import Enum


class LLMProvider(str, Enum):
	"""Supported LLM providers"""
	OPENAI = "openai"
	ANTHROPIC = "anthropic"
	OLLAMA = "ollama"
	LOCAL = "local"
	GEMINI = "gemini"


class LLMEvaluator:
	"""
	Configurable LLM evaluator that supports multiple backends.
	
	Priority:
	1. Local LLM (if available)
	2. API (OpenAI/Anthropic) as fallback
	"""
	
	def __init__(self):
		self.provider = self._detect_provider()
		self.api_key = (
			os.environ.get('OPENAI_API_KEY')
			or os.environ.get('ANTHROPIC_API_KEY')
			or os.environ.get('GEMINI_API_KEY')
			or os.environ.get('GOOGLE_API_KEY')
		)
		self.local_url = os.environ.get('LABSENSE_LLM_URL', 'http://localhost:11434')  # Ollama default
		print(f"🔧 LLM provider selected: {self.provider}")
		
	def _detect_provider(self) -> LLMProvider:
		"""Detect which LLM provider to use"""
		# Check for local LLM first
		local_llm_url = os.environ.get('LABSENSE_LLM_URL')
		if local_llm_url:
			return LLMProvider.OLLAMA
		
		# Check for API keys
		if os.environ.get('OPENAI_API_KEY'):
			return LLMProvider.OPENAI
		if os.environ.get('ANTHROPIC_API_KEY'):
			return LLMProvider.ANTHROPIC
		if os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY'):
			return LLMProvider.GEMINI
		
		# Default: try local Ollama
		return LLMProvider.OLLAMA
	
	async def evaluate_effort(
		self, 
		student_code: str, 
		ideal_code: str, 
		language: str,
		question_text: str,
		test_results: Dict
	) -> Tuple[float, Dict, str]:
		"""
		Evaluate student code effort using LLM.
		
		Returns:
			(effort_score, breakdown, reasoning)
		"""
		prompt = self._create_effort_prompt(student_code, ideal_code, language, question_text, test_results)
		
		try:
			print(f"🤖 evaluate_effort using provider: {self.provider}")
			if self.provider == LLMProvider.OLLAMA or self.provider == LLMProvider.LOCAL:
				response = await self._call_ollama(prompt)
			elif self.provider == LLMProvider.OPENAI:
				response = await self._call_openai(prompt)
			elif self.provider == LLMProvider.ANTHROPIC:
				response = await self._call_anthropic(prompt)
			elif self.provider == LLMProvider.GEMINI:
				response = await self._call_gemini(prompt)
			else:
				# Fallback to heuristic if no LLM available
				return self._fallback_effort_score(student_code), {}, "Fallback heuristic used"
			
			return self._parse_effort_response(response)
		except Exception as e:
			print(f"❌ LLM effort evaluation failed: {e}")
			# Fallback to Gemini if available
			try:
				if os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY'):
					print("🔁 Falling back to Gemini for effort evaluation")
					gemini_resp = await self._call_gemini(prompt)
					return self._parse_effort_response(gemini_resp)
			except Exception as _:
				pass
			# Fallback to heuristic
			fallback_score = self._fallback_effort_score(student_code)
			return fallback_score, {}, f"LLM evaluation failed, using fallback: {str(e)}"
	
	async def evaluate_logic_similarity(
		self,
		student_code: str,
		ideal_code: str,
		language: str,
		question_text: str = ""
	) -> Tuple[float, Dict, str]:
		"""
		Evaluate logical similarity between student and ideal code.
		Works for all languages (not just Python).
		
		Returns:
			(logic_similarity, breakdown, notes)
		"""
		prompt = self._create_logic_prompt(student_code, ideal_code, language, question_text)
		
		try:
			print(f"🤖 evaluate_logic_similarity using provider: {self.provider}")
			if self.provider == LLMProvider.OLLAMA or self.provider == LLMProvider.LOCAL:
				response = await self._call_ollama(prompt)
			elif self.provider == LLMProvider.OPENAI:
				response = await self._call_openai(prompt)
			elif self.provider == LLMProvider.ANTHROPIC:
				response = await self._call_anthropic(prompt)
			elif self.provider == LLMProvider.GEMINI:
				response = await self._call_gemini(prompt)
			else:
				# Fallback: return medium similarity if no LLM
				return 0.5, {}, "No LLM available, using fallback"
			
			return self._parse_logic_response(response)
		except Exception as e:
			print(f"❌ LLM logic similarity evaluation failed: {e}")
			# Fallback to Gemini if available
			try:
				if os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY'):
					print("🔁 Falling back to Gemini for logic similarity")
					gemini_resp = await self._call_gemini(prompt)
					return self._parse_logic_response(gemini_resp)
			except Exception as _:
				pass
			# Fallback: return medium similarity
			return 0.5, {}, f"LLM evaluation failed, using fallback: {str(e)}"
	
	async def generate_feedback(
		self,
		student_code: str,
		ideal_code: str,
		language: str,
		question_text: str,
		test_results: Dict,
		effort_score: float,
		logic_similarity: float,
		test_case_score: float
	) -> Dict[str, str]:
		"""
		Generate comprehensive feedback and improvement insights.
		
		Returns:
			{
				"feedback": "General feedback text",
				"improvements": "Specific improvement suggestions",
				"strengths": "What student did well",
				"scope_for_improvement": "Detailed scope of improvement"
			}
		"""
		prompt = self._create_feedback_prompt(
			student_code, ideal_code, language, question_text,
			test_results, effort_score, logic_similarity, test_case_score
		)
		
		try:
			print(f"🤖 generate_feedback using provider: {self.provider}")
			if self.provider == LLMProvider.OLLAMA or self.provider == LLMProvider.LOCAL:
				response = await self._call_ollama(prompt)
			elif self.provider == LLMProvider.OPENAI:
				response = await self._call_openai(prompt)
			elif self.provider == LLMProvider.ANTHROPIC:
				response = await self._call_anthropic(prompt)
			elif self.provider == LLMProvider.GEMINI:
				response = await self._call_gemini(prompt)
			else:
				# Fallback feedback
				return self._fallback_feedback(effort_score, logic_similarity, test_case_score)
			
			return self._parse_feedback_response(response, effort_score, logic_similarity, test_case_score)
		except Exception as e:
			print(f"❌ LLM feedback generation failed: {e}")
			# Fallback to Gemini if available
			try:
				if os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY'):
					print("🔁 Falling back to Gemini for feedback generation")
					gemini_resp = await self._call_gemini(prompt)
					return self._parse_feedback_response(gemini_resp, effort_score, logic_similarity, test_case_score)
			except Exception as _:
				pass
			return self._fallback_feedback(effort_score, logic_similarity, test_case_score)
	
	# Prompt creation methods
	
	def _create_effort_prompt(self, student_code: str, ideal_code: str, language: str, question_text: str, test_results: Dict) -> str:
		passed = sum(1 for r in test_results.get('results', []) if r.get('passed', False))
		total = len(test_results.get('results', []))
		
		return f"""You are evaluating a student's programming solution for effort and code quality.

Problem Description:
{question_text}

Student Code (Language: {language}):
```
{student_code}
```

Ideal Solution (for reference):
```
{ideal_code}
```

Test Results: {passed}/{total} test cases passed

Evaluate the student's code on these dimensions (each 0.0 to 1.0):
1. Problem-solving approach: How well did they understand and approach the problem?
2. Code organization: Structure, readability, naming conventions
3. Algorithm/data structure choice: Appropriate choices for the problem
4. Attempt quality: Shows genuine effort to solve, not minimal/copy-paste code

Return ONLY valid JSON (no markdown, no explanation):
{{
  "effort_score": 0.85,
  "components": {{
    "approach": 0.9,
    "organization": 0.8,
    "algorithm_choice": 0.85,
    "attempt_quality": 0.85
  }},
  "reasoning": "Brief explanation of the evaluation"
}}"""
	
	def _create_logic_prompt(self, student_code: str, ideal_code: str, language: str, question_text: str = "") -> str:
		question_context = f"\nProblem Description:\n{question_text}\n" if question_text else ""
		
		return f"""Compare the student's code with the ideal solution for logical similarity. You MUST be STRICT about relevance to the problem.

{question_context}Student Code (Language: {language}):
```
{student_code}
```

Ideal Solution:
```
{ideal_code}
```

CRITICAL EVALUATION RULES:

1. **RELEVANCE CHECK (FIRST PRIORITY)**:
   - If the student code is COMPLETELY UNRELATED to the problem (e.g., solving a different problem, random code, placeholder code, or code that has no connection to the question), award VERY LOW scores (0.0-0.2).
   - If the student code at least ATTEMPTS to solve the problem (even if wrong approach), award MODERATE to HIGH scores (0.5-0.9).
   - If the student code mimics the problem structure or uses related concepts (even if implementation is wrong), award at least 0.4-0.6.
   - If the student code is completely unrelated or random, award 0.0-0.2.

2. **ALGORITHMIC APPROACH**:
   - Same algorithm? Different but equivalent approach? Award 0.7-1.0.
   - Similar problem-solving strategy but different implementation? Award 0.5-0.8.
   - Wrong algorithm but still attempting to solve the problem? Award 0.3-0.6.
   - Completely unrelated algorithm or random code? Award 0.0-0.2.

3. **LOGIC FLOW**:
   - Similar control flow and structure? Award 0.7-1.0.
   - Different structure but similar logic? Award 0.5-0.8.
   - Attempted structure but flawed logic? Award 0.3-0.6.
   - No logical connection to the problem? Award 0.0-0.2.

4. **PROBLEM-SOLVING STRATEGY**:
   - Similar way of thinking about the problem? Award 0.7-1.0.
   - Different approach but still relevant? Award 0.5-0.8.
   - Attempted approach but wrong direction? Award 0.3-0.6.
   - No strategy or unrelated to problem? Award 0.0-0.2.

**IMPORTANT**: Be GENEROUS if the code attempts to solve the problem (even if wrong), but be VERY STRICT if the code is unrelated to the question. The final logic_similarity should reflect whether the student understood and attempted to solve the problem, not just structural similarity.

Return ONLY valid JSON (no markdown, no explanation):
{{
  "logic_similarity": 0.75,
  "similarity_breakdown": {{
    "algorithm": 0.8,
    "logic_flow": 0.7,
    "strategy": 0.75,
    "relevance": 0.8
  }},
  "notes": "Brief explanation including relevance assessment"
}}"""
	
	def _create_feedback_prompt(
		self, student_code: str, ideal_code: str, language: str, question_text: str,
		test_results: Dict, effort_score: float, logic_similarity: float, test_case_score: float
	) -> str:
		passed = sum(1 for r in test_results.get('results', []) if r.get('passed', False))
		total = len(test_results.get('results', []))
		
		return f"""You are a code debugging expert. Analyze ONLY the actual mistakes in the student's code. Do NOT invent new logic or change the problem requirements.

Problem: {question_text}
Language: {language}

Student Code:
```
{student_code}
```

Test Results: {passed}/{total} passed ({test_case_score*100:.1f}%)
Failed Test Cases:
{self._format_test_results(test_results)}

CRITICAL REQUIREMENTS:
1. Only fix actual bugs in the student's code - do not add new features or change the problem
2. Use failed test cases to identify what's wrong - compare actual vs expected output
3. Quote exact code snippets from the student's code above
4. Be concise - one direct point per mistake, no repetition
5. Do not mention test case numbers
6. Do not invent fixes that change the problem or add new logic

Return JSON with these fields (all strings):
{{
  "feedback": "Brief summary ({test_case_score*100:.1f}% test cases, {logic_similarity*100:.1f}% logic similarity, {effort_score*100:.1f}% effort)",
  "critic": "Critical analysis of what went wrong (3-5 points). Focus on the root causes of failures, not what was done well",
  "improvements": "Exact mistakes (4-7 points). Format: 'MISTAKE: [what's wrong] - Change `[wrong code]` to `[correct code]` because [reason]'",
  "scope_for_improvement": "Exact fixes (4-6 points). Format: 'Fix [issue]: Change `[wrong code]` to `[correct code]` because [reason]'"
}}"""
	
	def _format_test_results(self, test_results: Dict) -> str:
		results = test_results.get('results', [])
		if not results:
			return "No test results available"
		
		formatted = []
		for i, r in enumerate(results, 1):
			status = "✅ PASSED" if r.get('passed') else "❌ FAILED"
			formatted.append(f"Test {i}: {status}")
			formatted.append(f"  Input: {r.get('input', 'N/A')}")
			formatted.append(f"  Expected Output: {r.get('expected_output', 'N/A')}")
			formatted.append(f"  Your Output: {r.get('actual_output', 'N/A')}")
			if not r.get('passed'):
				if r.get('error'):
					formatted.append(f"  ERROR: {r.get('error')}")
				else:
					formatted.append(f"  MISMATCH: Expected '{r.get('expected_output', 'N/A')}' but got '{r.get('actual_output', 'N/A')}'")
				formatted.append(f"  → This failure indicates a logic error in your code. Analyze why this specific input produces the wrong output.")
		
		return "\n".join(formatted)
	
	# API calling methods
	
	async def _call_ollama(self, prompt: str) -> str:
		"""Call Ollama or local LLM endpoint"""
		import aiohttp
		
		model = os.environ.get('LABSENSE_LLM_MODEL', 'llama3.1:8b')
		url = f"{self.local_url}/api/chat"
		print(f"🌐 Calling Ollama at {url} with model {model}")
		
		payload = {
			"model": model,
			"messages": [
				{
					"role": "system",
					"content": "You are an expert code evaluator. Always respond with valid JSON only, no markdown formatting."
				},
				{
					"role": "user",
					"content": prompt
				}
			],
			"stream": False,
			"options": {
				"temperature": 0.0,  # Deterministic outputs
			}
		}
		
		async with aiohttp.ClientSession() as session:
			async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
				if resp.status != 200:
					raise Exception(f"Ollama API error: {resp.status}")
				data = await resp.json()
				return data.get('message', {}).get('content', '{}')

	async def _call_gemini(self, prompt: str) -> str:
		"""Call Google Gemini API via REST"""
		import aiohttp
		api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
		if not api_key:
			raise Exception("GEMINI_API_KEY/GOOGLE_API_KEY not set")
		model = os.environ.get('LABSENSE_GEMINI_MODEL', 'gemini-2.5-flash')
		url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
		print(f"🌐 Calling Gemini model {model}")
		payload = {
			"contents": [
				{
					"role": "user",
					"parts": [{"text": "You are an expert code evaluator. Always respond with valid JSON only, no markdown formatting.\n\n" + prompt}]
				}
			]
		}
		async with aiohttp.ClientSession() as session:
			async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
				if resp.status != 200:
					raise Exception(f"Gemini API error: {resp.status}")
				data = await resp.json()
				# Extract text
				candidates = data.get('candidates') or []
				if not candidates:
					raise Exception("Gemini API returned no candidates")
				parts = candidates[0].get('content', {}).get('parts', [])
				if not parts:
					raise Exception("Gemini API returned empty parts")
				return parts[0].get('text', '{}')
	
	async def _call_openai(self, prompt: str) -> str:
		"""Call OpenAI API"""
		try:
			import openai
		except ImportError:
			raise ImportError("openai package required. Install with: pip install openai")
		
		model = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')  # Use cheaper model by default
		
		response = await openai.AsyncOpenAI(api_key=self.api_key).chat.completions.create(
			model=model,
			messages=[
				{
					"role": "system",
					"content": "You are an expert code evaluator. Always respond with valid JSON only, no markdown formatting."
				},
				{
					"role": "user",
					"content": prompt
				}
			],
			temperature=0.3,
			response_format={"type": "json_object"} if model.startswith('gpt-4') else None
		)
		
		return response.choices[0].message.content
	
	async def _call_anthropic(self, prompt: str) -> str:
		"""Call Anthropic Claude API"""
		try:
			import anthropic
		except ImportError:
			raise ImportError("anthropic package required. Install with: pip install anthropic")
		
		client = anthropic.AsyncAnthropic(api_key=self.api_key)
		
		response = await client.messages.create(
			model=os.environ.get('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022'),
			max_tokens=2000,
			temperature=0.3,
			messages=[
				{
					"role": "user",
					"content": f"""You are an expert code evaluator. Always respond with valid JSON only, no markdown formatting.

{prompt}"""
				}
			]
		)
		
		return response.content[0].text
	
	# Response parsing methods
	
	def _parse_effort_response(self, response: str) -> Tuple[float, Dict, str]:
		"""Parse LLM response for effort evaluation"""
		try:
			# Try to extract JSON from response (remove markdown if present)
			content = response.strip()
			if content.startswith('```'):
				# Remove markdown code blocks
				lines = content.split('\n')
				content = '\n'.join(lines[1:-1])
			
			data = json.loads(content)
			effort_score = float(data.get('effort_score', 0.5))
			components = data.get('components', {})
			reasoning = data.get('reasoning', '')
			
			return effort_score, components, reasoning
		except (json.JSONDecodeError, ValueError, KeyError) as e:
			print(f"⚠️ Failed to parse effort response: {e}")
			print(f"Response was: {response[:200]}")
			return 0.5, {}, f"Parse error: {str(e)}"
	
	def _parse_logic_response(self, response: str) -> Tuple[float, Dict, str]:
		"""Parse LLM response for logic similarity"""
		try:
			content = response.strip()
			if content.startswith('```'):
				lines = content.split('\n')
				content = '\n'.join(lines[1:-1])
			
			data = json.loads(content)
			similarity = float(data.get('logic_similarity', 0.5))
			breakdown = data.get('similarity_breakdown', {})
			notes = data.get('notes', '')
			
			return similarity, breakdown, notes
		except (json.JSONDecodeError, ValueError, KeyError) as e:
			print(f"⚠️ Failed to parse logic response: {e}")
			print(f"Response was: {response[:200]}")
			return 0.5, {}, f"Parse error: {str(e)}"
	
	def _parse_feedback_response(self, response: str, effort_score: float = 0.5, logic_similarity: float = 0.5, test_case_score: float = 0.5) -> Dict[str, str]:
		"""Parse LLM response for feedback"""
		try:
			content = response.strip()
			if content.startswith('```'):
				lines = content.split('\n')
				content = '\n'.join(lines[1:-1])
			
			data = json.loads(content)
			
			# Handle scope_for_improvement - convert object to formatted string if needed
			scope_for_improvement = data.get('scope_for_improvement', '')
			if isinstance(scope_for_improvement, dict):
				# Convert object to formatted string
				parts = []
				for key, value in scope_for_improvement.items():
					key_formatted = key.replace('_', ' ').title()
					if isinstance(value, str):
						parts.append(f"{key_formatted}: {value}")
					else:
						parts.append(f"{key_formatted}: {json.dumps(value, indent=2)}")
				scope_for_improvement = '\n\n'.join(parts)
			
			return {
				"feedback": data.get('feedback', ''),
				"critic": data.get('critic', ''),
				"improvements": data.get('improvements', ''),
				"scope_for_improvement": scope_for_improvement if isinstance(scope_for_improvement, str) else str(scope_for_improvement)
			}
		except (json.JSONDecodeError, ValueError, KeyError) as e:
			print(f"⚠️ Failed to parse feedback response: {e}")
			print(f"Response was: {response[:200]}")
			return self._fallback_feedback(effort_score, logic_similarity, test_case_score)
	
	# Fallback methods
	
	def _fallback_effort_score(self, student_code: str) -> float:
		"""Fallback effort score when LLM is unavailable"""
		from .effort import effort_score
		return effort_score(student_code)
	
	def _fallback_feedback(self, effort_score: float, logic_similarity: float, test_case_score: float) -> Dict[str, str]:
		"""Fallback feedback when LLM is unavailable - uses actual scores provided"""
		# Generate critical analysis based on actual scores
		critic = []
		improvements = []
		
		if test_case_score < 0.5:
			critic.append(f"Test cases are failing ({test_case_score*100:.1f}% pass rate) - core logic is incorrect")
		elif test_case_score < 0.8:
			critic.append(f"Some test cases are failing ({test_case_score*100:.1f}% pass rate) - logic has errors")
		
		if logic_similarity < 0.5:
			critic.append(f"Low logic similarity ({logic_similarity*100:.1f}%) - algorithm differs significantly from correct approach")
		elif logic_similarity < 0.8:
			critic.append(f"Moderate logic similarity ({logic_similarity*100:.1f}%) - approach needs improvement")
		
		if effort_score < 0.5:
			critic.append(f"Low effort score ({effort_score*100:.1f}%) - code structure and organization need improvement")
		elif effort_score < 0.8:
			critic.append(f"Moderate effort ({effort_score*100:.1f}%) - code quality could be better")
		
		if not critic:
			critic.append("Code evaluation completed")
		
		if test_case_score < 0.8:
			improvements.append(f"MISTAKE: Test cases failing - identify exact logic errors causing wrong outputs")
		if logic_similarity < 0.8:
			improvements.append(f"MISTAKE: Algorithm differs from ideal - review approach and logic flow")
		if effort_score < 0.8:
			improvements.append(f"MISTAKE: Code quality needs improvement - enhance structure and organization")
		
		if not improvements:
			improvements.append("Review code for potential improvements")
		
		scope_items = []
		if test_case_score < 0.8:
			scope_items.append("Fix test case failures - identify and correct logic errors")
		if logic_similarity < 0.8:
			scope_items.append("Align algorithm with correct approach")
		scope_items.append("Review each line of code for potential bugs: off-by-one errors, wrong conditions, missing edge case handling")
		scope_items.append("Test your code manually with the failing test case inputs to see where the output goes wrong")
		
		return {
			"feedback": f"Test Cases: {round(test_case_score*100)}% | Logic: {round(logic_similarity*100)}% | Effort: {round(effort_score*100)}%",
			"critic": "\n".join([f"• {c}" for c in critic]),
			"improvements": "\n".join([f"• {i}" for i in improvements]),
			"scope_for_improvement": "\n".join([f"• {item}" for item in scope_items])
		}


# Global instance
_llm_evaluator: Optional[LLMEvaluator] = None


def get_llm_evaluator() -> LLMEvaluator:
	"""Get or create global LLM evaluator instance"""
	global _llm_evaluator
	if _llm_evaluator is None:
		_llm_evaluator = LLMEvaluator()
	return _llm_evaluator

