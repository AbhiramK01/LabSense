from pydantic import BaseModel
from typing import List, Optional


class EvalTestCase(BaseModel):
	input: str
	expected_output: str
	is_public: bool


class EvaluateRequest(BaseModel):
	language: str
	student_code: str
	ideal_code: str
	test_cases: List[EvalTestCase]
	exam_id: Optional[str] = None
	question_id: Optional[str] = None


class TestCaseResult(BaseModel):
	input: str
	expected_output: str
	actual_output: str
	passed: bool
	error: Optional[str] = None
	execution_time: Optional[float] = None


class EvaluateResponse(BaseModel):
	score: float
	feedback: str
	correctness: float
	logic_similarity: float
	effort: float
	public_case_results: List[bool]
	private_case_pass_rate: float  # Deprecated - kept for backward compatibility
	detailed_test_results: List[TestCaseResult]
	# New LLM feedback fields
	llm_feedback: Optional[dict] = None  # Contains: feedback, critic, improvements, scope_for_improvement
