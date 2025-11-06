from pydantic import BaseModel
from typing import List, Optional


class StudentJoinRequest(BaseModel):
	exam_id: str
	start_code: str


class SerialSubmitRequest(BaseModel):
	serial_number: int


class Assignment(BaseModel):
	question_ids: List[str]


class SubmissionRequest(BaseModel):
	question_id: str
	code: str


class AutoSaveRequest(BaseModel):
    code: str
    question_id: Optional[str] = None


class SubmissionResult(BaseModel):
	passed: bool
	score: Optional[float] = None  # None when processing, float when done
	public_case_results: List[bool]
	detailed_results: Optional[List[dict]] = None
	# New LLM evaluation fields
	effort_score: Optional[float] = None
	logic_similarity: Optional[float] = None
	correctness: Optional[float] = None
	llm_feedback: Optional[dict] = None  # Contains: feedback, critic, improvements, scope_for_improvement


class PublicTestCase(BaseModel):
	input: str
	expected_output: str


class QuestionDetails(BaseModel):
	question_id: str
	text: str
	ideal_solution: str
	public_test_cases: List[PublicTestCase]
