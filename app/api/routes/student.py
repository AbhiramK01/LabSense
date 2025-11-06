from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from ...schemas.student_flow import StudentJoinRequest, SerialSubmitRequest, Assignment, SubmissionRequest, SubmissionResult, QuestionDetails, PublicTestCase, AutoSaveRequest
from ...schemas.exams import ExamPublic
from ...models.user import UserRole
from ..deps import require_role
from ...repositories.registry import exam_repo, session_repo
from ...repositories.shared_user_repo import shared_user_repo

router = APIRouter()


@router.post("/join")
async def join_exam(claims = Depends(require_role(UserRole.student)), payload: StudentJoinRequest = None):
	user_id = claims.get('sub')
	try:
		result = session_repo.join_exam(user_id, payload.exam_id, payload.start_code)
		return result
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.post("/serial/{exam_id}")
async def set_serial_for_exam(exam_id: str, claims = Depends(require_role(UserRole.student)), payload: SerialSubmitRequest = None):
    user_id = claims.get('sub')
    try:
        sess = session_repo.set_serial(user_id, exam_id, payload.serial_number)
        # Return multiple question IDs if assigned
        assigned_questions = sess.assigned_question if isinstance(sess.assigned_question, list) else [sess.assigned_question]
        return { 'message': 'serial accepted', 'assigned_question_ids': assigned_questions }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/assignment/{exam_id}", response_model=Assignment)
async def get_assignment(exam_id: str, claims = Depends(require_role(UserRole.student))):
	user_id = claims.get('sub')
	try:
		qids = session_repo.get_assignment(user_id, exam_id)
		return Assignment(question_ids=qids)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.get("/question/{exam_id}/{question_id}", response_model=QuestionDetails)
async def get_question(exam_id: str, question_id: str, _claims = Depends(require_role(UserRole.student))):
	exam = exam_repo._exams.get(exam_id)
	if not exam:
		raise HTTPException(status_code=404, detail='exam not found')
	q = next((q for q in exam.questions if q.question_id == question_id), None)
	if not q:
		raise HTTPException(status_code=404, detail='question not found')
	public = [PublicTestCase(input=tc.input, expected_output=tc.expected_output) for tc in q.test_cases if tc.is_public]
	return QuestionDetails(question_id=q.question_id, text=q.text, ideal_solution=q.ideal_solution, public_test_cases=public)


@router.post("/submit/{exam_id}", response_model=SubmissionResult)
async def submit(exam_id: str, claims = Depends(require_role(UserRole.student)), payload: SubmissionRequest = None):
	user_id = claims.get('sub')
	try:
		result = session_repo.submit(user_id, exam_id, payload.question_id, payload.code)
		return SubmissionResult(**result)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.post("/finish/{exam_id}")
async def finish(exam_id: str, claims = Depends(require_role(UserRole.student))):
	user_id = claims.get('sub')
	try:
		session_repo.finish(user_id, exam_id)
		return { 'message': 'exam finished' }
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.get("/submissions/{exam_id}")
async def get_my_submissions(exam_id: str, version: int = None, claims = Depends(require_role(UserRole.student))):
	"""Get all submissions for the current student for an exam, with final/best markers"""
	user_id = claims.get('sub')
	try:
		# Determine exam version - use provided version or get from current session
		if version is not None:
			exam_version = version
			print(f"🔍 Getting submissions for exam {exam_id}, version {exam_version} (explicit)")
		else:
			# Get the session to determine exam version (even if finished)
			session = session_repo._sessions.get((user_id, exam_id))
			if session:
				exam_version = getattr(session, 'exam_version', 1)
				print(f"🔍 Getting submissions for exam {exam_id}, version {exam_version} (from session)")
			else:
				# No session found - try to get submissions from any finished session or default to version 1
				all_sessions = session_repo.get_all_sessions_for_user(user_id)
				exam_sessions = [s for s in all_sessions if s.exam_id == exam_id]
				if exam_sessions:
					# Use the most recent session's version
					latest_session = exam_sessions[-1]
					exam_version = getattr(latest_session, 'exam_version', 1)
					print(f"🔍 Getting submissions for exam {exam_id}, version {exam_version} (from finished session)")
				else:
					exam_version = 1
					print(f"🔍 Getting submissions for exam {exam_id}, version {exam_version} (default)")
		
		# Get submissions from both systems
		from ...repositories.registry import submission_repo
		
		# Get from new system (session repo) - filter by version (works even if session is finished)
		try:
			session_subs = session_repo.get_submissions(user_id, exam_id, exam_version)
			print(f"🔍 Session submissions: {len(session_subs)}")
		except Exception as e:
			print(f"⚠️ Error getting session submissions: {e}")
			session_subs = []
		
		try:
			all_sessions = session_repo.get_all_sessions_for_user(user_id)
			exam_sessions = [s for s in all_sessions if s.exam_id == exam_id]
		except Exception as e:
			print(f"⚠️ Error getting all sessions: {e}")
			exam_sessions = []
		
		# Get from old system (submission repo)
		try:
			old_subs = submission_repo.list(exam_id=exam_id, student_id=user_id)
			print(f"🔍 Old submissions: {len(old_subs)}")
		except Exception as e:
			print(f"⚠️ Error getting old submissions: {e}")
			old_subs = []
		
		# Convert old submissions to new format
		converted_subs = []
		for sub in old_subs:
			from datetime import datetime, timezone
			converted_sub = {
				'question_id': sub.question_id or '',
				'code': '',  # Old system doesn't store code
				'score': sub.score,
				'passed': sub.score >= 50,  # Assume 50% is passing
				'public_case_results': [],  # Old system doesn't store this
				'submitted_at': datetime.fromtimestamp(sub.timestamp, tz=timezone.utc).isoformat(),
				'is_final': False,  # Will be set below
				'is_best': False   # Will be set below
			}
			converted_subs.append(converted_sub)
		
		# Combine both systems (session subs first, then old subs)
		all_subs = session_subs + converted_subs
		print(f"🔍 Total submissions before dedup: {len(all_subs)}")
		
		# Deduplicate submissions based on timestamp and score
		seen_submissions = set()
		deduplicated_subs = []
		
		for sub in all_subs:
			# Create a unique key based on timestamp and score
			submitted_at = sub.get('submitted_at', '')
			score = sub.get('score', 0)
			key = f"{submitted_at}_{score}"
			
			if key not in seen_submissions:
				seen_submissions.add(key)
				deduplicated_subs.append(sub)
			else:
				print(f"🔍 Duplicate submission removed: {submitted_at}, score: {score}")
		
		all_subs = deduplicated_subs
		print(f"🔍 Total submissions after dedup: {len(all_subs)}")
		
		# Sort by submission time to ensure proper order
		all_subs.sort(key=lambda x: x.get('submitted_at', ''))

		# Compute per-question final and best
		from collections import defaultdict
		by_question = defaultdict(list)
		for idx, s in enumerate(all_subs):
			qid = s.get('question_id') or 'unknown'
			by_question[qid].append((idx, s))

		# Reset flags and recalculate passed field
		for s in all_subs:
			s['is_final'] = False
			s['is_best'] = False
			# Recalculate passed based on score (50% threshold)
			if 'score' in s and s['score'] is not None:
				s['passed'] = s['score'] >= 50.0
			else:
				# Score is None (still processing) - default to False
				s['passed'] = False

		for qid, items in by_question.items():
			# items: list of (index, submission) already in time order due to all_subs sort
			# Mark final = last for that question
			last_idx, last_sub = items[-1]
			last_sub['is_final'] = True
			# Mark best = max score within that question (only consider submissions with valid scores)
			best_idx, best_sub, best_score_val = None, None, None
			for idx, sub in items:
				score_val = sub.get('score')
				# Only consider submissions with valid numeric scores
				if isinstance(score_val, (int, float)):
					if best_score_val is None or score_val > best_score_val:
						best_score_val = score_val
						best_idx = idx
						best_sub = sub
			if best_sub is not None:
				best_sub['is_best'] = True
		
		return { 'submissions': all_subs }
	except Exception as e:
		print(f"❌ Error getting submissions: {e}")
		import traceback
		traceback.print_exc()
		# Return empty submissions instead of error - exam might be finished or session doesn't exist
		# This allows the frontend to handle gracefully
		return { 'submissions': [] }


@router.get("/available-exams", response_model=List[ExamPublic])
async def get_available_exams(claims = Depends(require_role(UserRole.student))):
	"""Get exams available for the current student based on their department, year, and section"""
	user_id = claims.get('sub')
	
	# Get student details
	user = shared_user_repo.find_by_id(user_id)
	if not user or not user.is_student():
		raise HTTPException(status_code=403, detail="Access denied")
	
	if not user.department_id or not user.year or not user.section_id:
		raise HTTPException(status_code=400, detail="Student profile incomplete - missing department, year, or section")
	
	# Get available exams - college-scoped
	student_college_id = getattr(user, 'college_id', None)
	available_exams = exam_repo.get_exams_for_student(
		user.department_id, 
		user.year, 
		user.section_id,
		student_college_id=student_college_id
	)
	
	return available_exams


@router.get("/exam-history")
async def get_student_exam_history(claims = Depends(require_role(UserRole.student))):
	"""Get student's exam history - completed, in-progress, and available exams"""
	user_id = claims.get('sub')
	print(f"🔍 Exam history request for user_id: {user_id}")
	
	# Get student details
	user = shared_user_repo.find_by_id(user_id)
	print(f"🔍 User found: {user is not None}")
	if user:
		print(f"🔍 User role: {user.role}")
		print(f"🔍 User is_student(): {user.is_student()}")
		print(f"🔍 User department_id: {user.department_id}")
		print(f"🔍 User year: {user.year}")
		print(f"🔍 User section_id: {user.section_id}")
	
	if not user or not user.is_student():
		print(f"🔍 Access denied: user={user is not None}, is_student={user.is_student() if user else False}")
		raise HTTPException(status_code=403, detail="Access denied")
	
	# Get all sessions for this student
	all_sessions = session_repo.get_all_sessions_for_user(user_id)
	
	# Categorize sessions (in-progress disabled -> we will auto-finish any active sessions)
	completed_exams = []
	in_progress_exams = []
	
	# Process each session
	for session in all_sessions:
		exam = exam_repo.get_exam(session.exam_id)
		if not exam:
			continue
		
		# Check if exam time has expired and auto-finish if needed
		if not session.finished:
			# End any active session immediately (disable in-progress/rejoin semantics)
			try:
				session_repo.finish(user_id, session.exam_id)
				session = session_repo._sessions.get((user_id, session.exam_id)) or session
			except Exception:
				pass
		
		exam_info = {
			"exam_id": session.exam_id,
			"subject_name": exam.subject_name,
			"language": exam.language,
			"duration_minutes": exam.duration_minutes,
			"joined_at": session.joined_at * 1000,  # Convert to milliseconds for JavaScript
			"serial_number": session.serial_number,
			"finished": session.finished
		}
		
		# Attach snapshot org data for student view
		if getattr(session, 'department_id_snapshot', None) is not None:
			exam_info['department_id'] = session.department_id_snapshot
			exam_info['department_name'] = getattr(session, 'department_name_snapshot', None)
		if getattr(session, 'section_id_snapshot', None) is not None:
			exam_info['section_id'] = session.section_id_snapshot
			exam_info['section_name'] = getattr(session, 'section_name_snapshot', None)
		if getattr(session, 'year_snapshot', None) is not None:
			exam_info['year'] = session.year_snapshot

		if session.finished:
			exam_info["status"] = "completed"
			completed_exams.append(exam_info)
		else:
			exam_info["status"] = "completed"
			completed_exams.append(exam_info)
	
	# Get available exams (not yet joined) - college-scoped
	available_exams = []
	if user.department_id and user.year and user.section_id:
		student_college_id = getattr(user, 'college_id', None)
		available_exams_data = exam_repo.get_exams_for_student(
			user.department_id, 
			user.year, 
			user.section_id,
			student_college_id=student_college_id
		)
		
		# Filter out exams the student has already joined
		joined_exam_ids = {session.exam_id for session in all_sessions}
		
		for exam in available_exams_data:
			if exam.exam_id not in joined_exam_ids:
				available_exams.append({
					"exam_id": exam.exam_id,
					"subject_name": exam.subject_name,
					"language": exam.language,
					"duration_minutes": exam.duration_minutes,
					"num_questions": exam.num_questions,
					"questions_per_student": exam.questions_per_student
				})
	
	return {
		"available_exams": available_exams,
		"in_progress_exams": [],
		"completed_exams": completed_exams
	}


@router.post("/auto-save/{exam_id}")
async def auto_save_code(exam_id: str, request: AutoSaveRequest, claims = Depends(require_role(UserRole.student))):
	"""Auto-save student code"""
	user_id = claims.get('sub')
	print(f"💾 API auto-save endpoint called: user_id={user_id}, exam_id={exam_id}, code_length={len(request.code)}")
	try:
		session_repo.auto_save_code(user_id, exam_id, request.code)
		# Save per-question buffer if question_id provided
		try:
			if getattr(request, 'question_id', None):
				session_repo.set_per_question_code(user_id, exam_id, request.question_id, request.code)
		except Exception:
			pass
		print(f"💾 API auto-save successful for user_id={user_id}, exam_id={exam_id}")
		return {"message": "Code auto-saved successfully"}
	except Exception as e:
		print(f"💾 API auto-save failed: {str(e)}")
		raise HTTPException(status_code=400, detail=str(e))


@router.get("/timer/{exam_id}")
async def get_exam_timer(exam_id: str, claims = Depends(require_role(UserRole.student))):
	"""Get remaining time for exam"""
	user_id = claims.get('sub')
	try:
		remaining_time = session_repo.get_remaining_time(user_id, exam_id)
		if remaining_time is None:
			return {"remaining_time": None, "message": "Exam not started or finished"}
		
		# Check if time is up and auto-finish if needed
		if session_repo.auto_finish_exam(user_id, exam_id):
			return {"remaining_time": 0, "message": "Exam time has ended", "auto_finished": True}
		
		return {"remaining_time": remaining_time, "auto_finished": False}
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.get("/code/{exam_id}")
async def get_saved_code(exam_id: str, claims = Depends(require_role(UserRole.student))):
	"""Get auto-saved code for student"""
	user_id = claims.get('sub')
	try:
		session = session_repo._sessions.get((user_id, exam_id))
		if not session:
			raise HTTPException(status_code=404, detail="Session not found")
		
		return {"code": session.current_code}
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.get("/session/{exam_id}")
async def get_session_data(exam_id: str, claims = Depends(require_role(UserRole.student))):
	"""Get current session data for student"""
	user_id = claims.get('sub')
	try:
		session = session_repo._sessions.get((user_id, exam_id))
		if not session:
			raise HTTPException(status_code=404, detail="Session not found")
		
		return {
			"serial_number": session.serial_number,
			"assigned_question": session.assigned_question,
			"finished": session.finished,
			"exam_start_time": session.exam_start_time,
			"exam_duration_minutes": session.exam_duration_minutes,
			"exam_end_time": session.exam_end_time,
			"current_code": session.current_code
		}
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))
