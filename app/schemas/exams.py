from pydantic import BaseModel, Field
from typing import List, Literal, Optional


ProgrammingLanguage = Literal['python', 'javascript', 'java', 'c', 'cpp', 'go']


class TestCase(BaseModel):
	input: str = Field('', description='stdin or input parameters as string')
	expected_output: str = Field('', description='expected stdout or return value')
	is_public: bool = Field(True, description='whether visible to students before/after submission')


class Question(BaseModel):
	question_id: str
	text: str
	ideal_solution: str
	test_cases: List[TestCase] = Field(default_factory=list, min_items=1)


class ExamCreate(BaseModel):
	exam_id: str
	start_code: str
	subject_name: str
	language: ProgrammingLanguage
	duration_minutes: int = Field(gt=0)
	num_questions: int = Field(gt=0, le=50)
	questions_per_student: int = Field(default=1, ge=1, le=10)
	questions: List[Question]
	is_live: bool = False
	college_id: Optional[str] = None
	# Department/Year/Section filters
	allowed_departments: List[str] = Field(default_factory=list, description="List of department IDs allowed to take this exam")
	allowed_years: List[int] = Field(default_factory=list, description="List of academic years allowed to take this exam")
	allowed_sections: List[str] = Field(default_factory=list, description="List of section IDs allowed to take this exam")
	layout_data: Optional[dict] = None
	question_assignments: Optional[dict] = None


class ExamPublic(BaseModel):
	exam_id: str
	subject_name: str
	language: ProgrammingLanguage
	duration_minutes: int
	num_questions: int
	questions_per_student: int
	is_live: bool
	allowed_departments: List[str] = Field(default_factory=list)
	allowed_years: List[int] = Field(default_factory=list)
	allowed_sections: List[str] = Field(default_factory=list)


class ExamResultSummary(BaseModel):
	exam_id: str
	num_submissions: int
	avg_score: float
	high_score: float
	low_score: float
	live_takers: int = 0
	already_taken: int = 0
	is_live: bool = False
	subject_name: str = ""
	language: ProgrammingLanguage = "python"
	duration_minutes: int = 60
	layout: Optional[dict] = None
	students: Optional[list] = None
	timestamp: Optional[float] = None
	allowed_departments: List[str] = Field(default_factory=list)
	allowed_years: List[int] = Field(default_factory=list)
	allowed_sections: List[str] = Field(default_factory=list)
