from fastapi import APIRouter, Depends

from ...models.user import UserRole
from ..deps import require_role

router = APIRouter()


@router.get("/faculty")
async def faculty_dashboard(_claims = Depends(require_role(UserRole.faculty))):
	return {"message": "Welcome to the faculty dashboard", "tools": ["evaluate_submissions", "create_exam", "review_scores"]}


@router.get("/student")
async def student_dashboard(_claims = Depends(require_role(UserRole.student))):
	return {"message": "Welcome to the student dashboard", "tools": ["take_exam", "view_scores", "practice_labs"]}
