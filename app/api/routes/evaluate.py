from fastapi import APIRouter, Depends

from ...schemas.evaluation import EvaluateRequest, EvaluateResponse
from ...models.user import UserRole
from ..deps import require_role, get_current_claims
from ...evaluator.combine import evaluate_code
from ...repositories.registry import submission_repo
from ...repositories.submissions import Submission
from time import time
from uuid import uuid4

router = APIRouter()


@router.post("/", response_model=EvaluateResponse)
async def evaluate(claims = Depends(require_role(UserRole.student)), payload: EvaluateRequest = None):
	# New evaluation system with LLM integration
	score, feedback, correctness, logic_similarity, effort, public_results, llm_feedback, detailed_results = evaluate_code(
		payload.language,
		payload.student_code,
		payload.ideal_code,
		[ tc.model_dump() for tc in payload.test_cases ],
		question_text=""  # Not available in EvaluateRequest, but evaluator handles it
	)
	
	# Convert detailed results to TestCaseResult objects
	from ...schemas.evaluation import TestCaseResult
	test_results = [
		TestCaseResult(
			input=result['input'],
			expected_output=result['expected_output'],
			actual_output=result['actual_output'],
			passed=result['passed'],
			error=result['error'],
			execution_time=result['execution_time']
		) for result in detailed_results
	]
	
	resp = EvaluateResponse(
		score=round(score, 2),
		feedback=feedback,
		correctness=round(correctness*100, 2),
		logic_similarity=round(logic_similarity*100, 2),
		effort=round(effort*100, 2),
		public_case_results=public_results,
		private_case_pass_rate=0.0,  # Deprecated - no private test cases
		detailed_test_results=test_results,
		llm_feedback=llm_feedback,
	)
	# store submission
	submission_repo.add(
		Submission(
			id=str(uuid4()),
			student_id=claims.get('sub'),
			exam_id=payload.exam_id,
			question_id=payload.question_id,
			language=payload.language,
			score=resp.score,
			feedback=resp.feedback,
			correctness=resp.correctness,
			logic_similarity=resp.logic_similarity,
			effort=resp.effort,
			timestamp=time(),
		)
	)
	return resp
