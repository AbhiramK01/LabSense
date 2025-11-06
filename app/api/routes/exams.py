from fastapi import APIRouter, Depends, HTTPException, status

from ...schemas.exams import ExamCreate, ExamPublic, ExamResultSummary
from ...repositories.registry import exam_repo, session_repo, submission_repo
from ...models.user import UserRole
from ..deps import require_role
from ...repositories.shared_user_repo import shared_user_repo

router = APIRouter()


@router.post("/", status_code=201)
async def create_exam(claims = Depends(require_role(UserRole.faculty)), payload: ExamCreate = None):
	try:
		# Auto-assign college_id based on faculty's college
		try:
			user = shared_user_repo.find_by_id(claims.get('sub'))
			if user and getattr(user, 'college_id', None):
				payload.college_id = getattr(user, 'college_id')
		except Exception:
			pass
		exam_id = exam_repo.create_exam(payload, claims["sub"])
		return {"exam_id": exam_id, "message": "exam created successfully"}
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/")
async def list_exams(claims = Depends(require_role(UserRole.faculty))):
	exams = exam_repo.list_exams(claims["sub"])
	return {"exams": exams}


@router.get("/results")
async def get_all_exam_results(claims = Depends(require_role(UserRole.faculty))):
	"""Get results summary for all exams created by the faculty member"""
	print(f"🔍 DEBUG: get_all_exam_results called with claims: {claims}")
	results = exam_repo.get_results_summary(claims["sub"])
	print(f"🔍 DEBUG: Returning {len(results)} results")
	return {"results": results}


@router.get("/{exam_id}")
async def get_exam(exam_id: str, claims = Depends(require_role(UserRole.faculty))):
	exam = exam_repo.get_exam(exam_id, claims["sub"])
	if not exam:
		raise HTTPException(status_code=404, detail='exam not found')
	return exam


@router.get("/{exam_id}/related-data")
async def get_exam_related_data(exam_id: str, _claims = Depends(require_role(UserRole.faculty))):
	related_data = exam_repo.get_related_data_count(exam_id)
	return {
		"related_data": related_data,
		"has_related_data": related_data["total_related_data"] > 0
	}


# Exam modification endpoint removed - use duplicate exam feature instead


@router.post("/duplicate/{exam_id}")
async def duplicate_exam(exam_id: str, new_exam_name: str = None, claims = Depends(require_role(UserRole.faculty))):
	"""Duplicate an existing exam with all its data except student submissions"""
	try:
		# Get the original exam
		original_exam = exam_repo.get_exam(exam_id, claims["sub"])
		if not original_exam:
			raise HTTPException(status_code=404, detail='Original exam not found')
		
		# Create new exam data based on original (copy allowed_* filters and assignments)
		new_exam_data = ExamCreate(
			exam_id="",  # Will be auto-generated
			subject_name=new_exam_name or f"{original_exam.subject_name} (Copy)",
			start_code=original_exam.start_code,
			language=original_exam.language,
			duration_minutes=original_exam.duration_minutes,
			questions_per_student=original_exam.questions_per_student,
			num_questions=original_exam.num_questions,
			questions=original_exam.questions,
			is_live=False,
			layout_data=getattr(original_exam, 'layout_data', None),
			question_assignments=getattr(original_exam, 'question_assignments', None),
			allowed_departments=getattr(original_exam, 'allowed_departments', []),
			allowed_years=getattr(original_exam, 'allowed_years', []),
			allowed_sections=getattr(original_exam, 'allowed_sections', [])
		)
		
		# Create the new exam
		new_exam_id = exam_repo.create_exam(new_exam_data, claims["sub"])
		
		return {
			"exam_id": new_exam_id,
			"message": "exam duplicated successfully",
			"original_exam_id": exam_id
		}
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/toggle/{exam_id}")
async def toggle_exam_status(exam_id: str, _claims = Depends(require_role(UserRole.faculty))):
	exam = exam_repo.get_exam(exam_id, _claims["sub"])
	if not exam:
		raise HTTPException(status_code=404, detail='exam not found')

	# Determine action (disabling vs enabling) before toggle
	was_live = getattr(exam, 'is_live', False)

	success = exam_repo.toggle_exam_status(exam_id, _claims["sub"])
	if not success:
		raise HTTPException(status_code=403, detail='You do not have permission to toggle this exam')

	# If disabling an exam, end all active sessions so students cannot continue - college-scoped
	if was_live:
		try:
			from ...repositories.registry import session_repo, shared_user_repo
			# Get exam to check college_id
			exam = exam_repo.get_exam(exam_id, _claims["sub"])
			exam_college_id = getattr(exam, 'college_id', None) if exam else None
			
			all_active = session_repo.get_active_sessions_for_exam(exam_id)
			# Filter by college to only end sessions from same college
			active = []
			for sess in all_active:
				if exam_college_id:
					student_user = shared_user_repo.find_by_id(sess.user_id)
					student_college_id = getattr(student_user, 'college_id', None) if student_user else None
					if student_college_id != exam_college_id:
						continue  # Skip students from different colleges
				active.append(sess)
			
			for sess in active:
				try:
					# Submit buffered code for all assigned questions (if available)
					session_repo.submit_all_buffered(sess.user_id, exam_id)
					# Now finish the session
					session_repo.finish(sess.user_id, exam_id)
				except Exception:
					pass
		except Exception:
			pass

	return {"message": "exam status toggled successfully", "ended_sessions": len(active) if was_live else 0}


@router.delete("/{exam_id}")
async def delete_exam(exam_id: str, _claims = Depends(require_role(UserRole.faculty))):
	exam = exam_repo.get_exam(exam_id, _claims["sub"])
	if not exam:
		raise HTTPException(status_code=404, detail='exam not found')
	
	# Check if exam is live
	if exam.is_live:
		raise HTTPException(status_code=400, detail='Cannot delete a live exam. Please disable it first.')
	
	# Delete all related data
	deleted_sessions = session_repo.delete_by_exam_id(exam_id)
	deleted_submissions = submission_repo.delete_by_exam_id(exam_id)
	
	success = exam_repo.delete_exam(exam_id, _claims["sub"])
	if not success:
		raise HTTPException(status_code=403, detail='You do not have permission to delete this exam')
	
	return {"message": "exam deleted successfully", "deleted_sessions": deleted_sessions, "deleted_submissions": deleted_submissions}


@router.get("/{exam_id}/results")
async def get_exam_results(exam_id: str, _claims = Depends(require_role(UserRole.faculty))):
	exam = exam_repo.get_exam(exam_id, _claims["sub"])
	if not exam:
		raise HTTPException(status_code=404, detail='exam not found')
	
	results = exam_repo.get_results_summary(exam_id)
	return results


@router.delete("/{exam_id}/students/{student_id}")
async def delete_student_attempt_for_exam(exam_id: str, student_id: str, claims = Depends(require_role(UserRole.faculty))):
    """Remove all traces of a student's attempt for a specific exam so they can retake it.
    Deletes session (including runtime serial mappings) and submissions for that exam/student.
    """
    # Validate exam ownership/visibility
    exam = exam_repo.get_exam(exam_id, claims["sub"])
    if not exam:
        raise HTTPException(status_code=404, detail='exam not found')

    try:
        # Delete session for this user and exam (also cleans runtime mappings)
        session_deleted = session_repo.delete_by_user_and_exam(student_id, exam_id)
        # Delete submissions for this user within this exam
        deleted_submissions = submission_repo.delete_by_exam_and_student(exam_id, student_id)
        return {
            "message": "student attempt cleared",
            "session_deleted": bool(session_deleted),
            "deleted_submissions": deleted_submissions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear student attempt: {e}")