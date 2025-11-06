from typing import Dict, List, Optional

from ..schemas.exams import ExamCreate, ExamPublic, ExamResultSummary
from ..storage.persistent import PersistentStorage


class ExamRepository:
	def __init__(self) -> None:
		self._exams: Dict[str, ExamCreate] = {}
		self._exam_faculty: Dict[str, str] = {}  # exam_id -> faculty_user_id
		self.storage = PersistentStorage()
		self._load_from_storage()

	def _load_from_storage(self) -> None:
		"""Load exams from persistent storage"""
		data = self.storage.load_exams()
		faculty_data = self.storage.load_exam_faculty()
		
		for exam_id, exam_data in data.items():
			# Convert dict back to ExamCreate object
			exam = ExamCreate(**exam_data)
			self._exams[exam_id] = exam
			
		# Load faculty mapping
		self._exam_faculty = faculty_data

	def _save_to_storage(self) -> None:
		"""Save exams to persistent storage"""
		data = {exam_id: exam.model_dump() for exam_id, exam in self._exams.items()}
		self.storage.save_exams(data)
		self.storage.save_exam_faculty(self._exam_faculty)
	
	def get_related_data_count(self, exam_id: str) -> dict:
		"""Get count of related data for an exam before deletion"""
		from .registry import submission_repo, session_repo
		
		# Get session count
		sessions = session_repo.get_all_sessions_for_exam(exam_id)
		session_count = len(sessions)
		
		# Get submission count
		submissions = submission_repo.list(exam_id=exam_id)
		submission_count = len(submissions)
		
		return {
			"session_count": session_count,
			"submission_count": submission_count,
			"total_related_data": session_count + submission_count
		}

	def create_exam(self, exam: ExamCreate, faculty_user_id: str) -> None:
		if exam.exam_id in self._exams:
			raise ValueError("exam_id already exists")
		self._exams[exam.exam_id] = exam
		self._exam_faculty[exam.exam_id] = faculty_user_id
		self._save_to_storage()

	def list_exams(self, faculty_user_id: Optional[str] = None) -> List[ExamPublic]:
		"""List exams, optionally filtered by faculty user"""
		exams_to_show = []
		
		for exam_id, exam in self._exams.items():
			# If faculty_user_id is provided, only show exams created by that faculty
			if faculty_user_id is not None:
				if exam_id not in self._exam_faculty or self._exam_faculty[exam_id] != faculty_user_id:
					continue
			
			exams_to_show.append(ExamPublic(
				exam_id=exam.exam_id,
				subject_name=exam.subject_name,
				language=exam.language,
				duration_minutes=exam.duration_minutes,
				num_questions=exam.num_questions,
				questions_per_student=getattr(exam, 'questions_per_student', 1),
				is_live=exam.is_live,
			))
		
		return exams_to_show

	def get_results_summary(self, faculty_user_id: Optional[str] = None) -> List[ExamResultSummary]:
		"""Calculate real statistics from submissions and sessions, grouped by exam and version"""
		results = []
		
		# If no exams exist, return empty list
		if not self._exams:
			return results
		
		# Group sessions by exam and version
		exam_version_sessions = {}
		
		try:
			from .registry import submission_repo, session_repo
			
			# Force reload session data from storage to get latest sessions
			session_repo._load_from_storage()
			session_repo._load_exam_runtime_data()
			
			# Group sessions by exam and version
			if hasattr(session_repo, '_sessions'):
				sessions = session_repo._sessions
				for (user_id, exam_id), session in sessions.items():
					if exam_id not in exam_version_sessions:
						exam_version_sessions[exam_id] = {}
					
					version = getattr(session, 'exam_version', 1)
					if version not in exam_version_sessions[exam_id]:
						exam_version_sessions[exam_id][version] = []
					
					exam_version_sessions[exam_id][version].append(session)
		except Exception as e:
			print(f"Error loading sessions: {e}")
			return results
		
		# Create results for each exam and version combination
		for exam_id, exam in self._exams.items():
			# If faculty_user_id is provided, only show exams created by that faculty
			if faculty_user_id is not None:
				if exam_id not in self._exam_faculty or self._exam_faculty[exam_id] != faculty_user_id:
					continue
			
			# Get sessions for this exam
			exam_sessions = exam_version_sessions.get(exam_id, {})
			
			# If no sessions exist, show the exam without version info
			if not exam_sessions:
				results.append(self._create_exam_result(exam, exam_id, [], []))
				continue
			
			# Create a result for each version
			for version, version_sessions in exam_sessions.items():
				# Get submissions for this version (we'll need to filter by session)
				try:
					from .registry import submission_repo
					all_submissions = submission_repo.list(exam_id=exam_id)
					# For now, we'll use all submissions for the exam
					# In a more sophisticated system, we'd filter by version
					version_submissions = all_submissions
				except Exception:
					version_submissions = []
				
				# Create result with version info
				result = self._create_exam_result(exam, exam_id, version_sessions, version_submissions)
				result.exam_id = f"{exam_id} (Version {version})"
				results.append(result)
		
		return results
	
	def _create_exam_result(self, exam, exam_id: str, sessions: List, submissions: List) -> 'ExamResultSummary':
		"""Create a single exam result from sessions and submissions"""
		# Calculate statistics for this version
		live_takers = 0
		already_taken = 0
		
		for session in sessions:
			if hasattr(session, 'serial_number') and session.serial_number is not None and hasattr(session, 'finished') and not session.finished:
				live_takers += 1
			elif hasattr(session, 'finished') and session.finished:
				already_taken += 1
		
		# Calculate scores
		if submissions:
			scores = [s.score for s in submissions if hasattr(s, 'score')]
			if scores:
				avg_score = sum(scores) / len(scores)
				high_score = max(scores)
				low_score = min(scores)
			else:
				avg_score = high_score = low_score = 0
		else:
			avg_score = high_score = low_score = 0
		
		# Create result
		return ExamResultSummary(
			exam_id=exam_id,
			subject_name=exam.subject_name,
			language=exam.language,
			is_live=exam.is_live,
			num_submissions=len(submissions),
			live_takers=live_takers,
			already_taken=already_taken,
			avg_score=round(avg_score, 1),
			high_score=round(high_score, 1),
			low_score=round(low_score, 1)
		)

	def get_exams_for_student(self, department_id: str, year: int, section_id: str) -> List[ExamPublic]:
			
			# Get student data for layout visualization
			students_data = []
			if hasattr(session_repo, '_sessions'):
				exam_sessions = [s for (user_id, session_exam_id), s in session_repo._sessions.items() if session_exam_id == exam_id]
				for session in exam_sessions:
					if hasattr(session, 'serial_number') and session.serial_number is not None:
						# Get actual student info from user repository
						from .registry import user_repo
						student_user = user_repo.find_by_id(session.user_id)
						student_name = student_user.username if student_user else f"Student_{session.serial_number}"
						
						# Get student's score from submissions
						student_submission = next((s for s in submissions if s.student_id == session.user_id), None)
						student_score = student_submission.score if student_submission else 0
						
						student_info = {
							"serialNumber": session.serial_number,
							"studentName": student_name,
							"studentId": session.user_id,
							"score": student_score,
							"status": "completed" if hasattr(session, 'finished') and session.finished else "in progress"
						}
						students_data.append(student_info)
			
			# Handle both ExamCreate objects and dictionaries (from history restoration)
			if isinstance(exam, dict):
				# Exam was restored from history and is stored as dict
				is_live = exam.get('is_live', False)
				subject_name = exam.get('subject_name', 'Unknown')
				language = exam.get('language', 'unknown')
				duration_minutes = exam.get('duration_minutes', 0)
			else:
				# Normal ExamCreate object
				is_live = exam.is_live
				subject_name = exam.subject_name
				language = exam.language
				duration_minutes = exam.duration_minutes
			
			results.append(ExamResultSummary(
				exam_id=exam_id,
				num_submissions=len(submissions),
				avg_score=round(avg_score, 1),
				high_score=round(high_score, 1),
				low_score=round(low_score, 1),
				live_takers=live_takers,
				already_taken=already_taken,
				is_live=is_live,
				subject_name=subject_name,
				language=language,
				duration_minutes=duration_minutes,
				layout=layout_data,
				students=students_data
			))
		
		return results
	
	def get_exam(self, exam_id: str, faculty_user_id: Optional[str] = None) -> Optional[ExamCreate]:
		"""Get an exam by ID, optionally filtered by faculty user"""
		if exam_id not in self._exams:
			return None
		
		# If faculty_user_id is provided, check if the exam belongs to that faculty
		if faculty_user_id is not None:
			if exam_id not in self._exam_faculty or self._exam_faculty[exam_id] != faculty_user_id:
				return None
		
		return self._exams[exam_id]
	
	def update_exam(self, exam_id: str, exam: ExamCreate, faculty_user_id: Optional[str] = None) -> bool:
		"""Update an exam, optionally filtered by faculty user"""
		if exam_id not in self._exams:
			return False
		
		# If faculty_user_id is provided, check if the exam belongs to that faculty
		if faculty_user_id is not None:
			if exam_id not in self._exam_faculty or self._exam_faculty[exam_id] != faculty_user_id:
				return False
		
		self._exams[exam_id] = exam
		self._save_to_storage()
		return True
	
	def delete_exam(self, exam_id: str, faculty_user_id: Optional[str] = None) -> bool:
		"""Delete an exam, optionally filtered by faculty user"""
		if exam_id not in self._exams:
			return False
		
		# If faculty_user_id is provided, check if the exam belongs to that faculty
		if faculty_user_id is not None:
			if exam_id not in self._exam_faculty or self._exam_faculty[exam_id] != faculty_user_id:
				return False
		
		del self._exams[exam_id]
		if exam_id in self._exam_faculty:
			del self._exam_faculty[exam_id]
		self._save_to_storage()
		return True
	
	def is_exam_owner(self, exam_id: str, faculty_user_id: str) -> bool:
		"""Check if a faculty user owns an exam"""
		return exam_id in self._exam_faculty and self._exam_faculty[exam_id] == faculty_user_id
	
	def get_exams_for_student(self, department_id: str, year: int, section_id: str) -> List[ExamPublic]:
		"""Get exams available for a student based on their department, year, and section"""
		available_exams = []
		
		for exam_id, exam in self._exams.items():
			# Debug: Log exam status
			print(f"Exam {exam_id}: is_live={exam.is_live}, subject={exam.subject_name}")
			
			# Check if exam is live
			if not exam.is_live:
				print(f"  -> Skipping {exam_id} (not live)")
				continue
			
			# Check department filter
			if exam.allowed_departments and department_id not in exam.allowed_departments:
				print(f"  -> Skipping {exam_id} (department filter)")
				continue
			
			# Check year filter
			if exam.allowed_years and year not in exam.allowed_years:
				print(f"  -> Skipping {exam_id} (year filter)")
				continue
			
			# Check section filter
			if exam.allowed_sections and section_id not in exam.allowed_sections:
				print(f"  -> Skipping {exam_id} (section filter)")
				continue
			
			print(f"  -> Including {exam_id} (passed all filters)")
			
			# Convert to public format
			available_exams.append(ExamPublic(
				exam_id=exam.exam_id,
				subject_name=exam.subject_name,
				language=exam.language,
				duration_minutes=exam.duration_minutes,
				num_questions=exam.num_questions,
				questions_per_student=exam.questions_per_student,
				is_live=exam.is_live
			))
		
		print(f"Total available exams: {len(available_exams)}")
		return available_exams
