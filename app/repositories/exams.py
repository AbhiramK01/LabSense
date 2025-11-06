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
			# Handle missing language field (for old exam records)
			if 'language' not in exam_data:
				exam_data['language'] = 'python'  # Default to python for backward compatibility
			
			try:
				# Convert dict back to ExamCreate object
				exam = ExamCreate(**exam_data)
				self._exams[exam_id] = exam
			except Exception as e:
				print(f"⚠️ Failed to load exam {exam_id}: {e}")
				# Skip this exam if it can't be loaded
				continue
			
		# Load faculty mapping
		self._exam_faculty = faculty_data

	def _save_to_storage(self) -> None:
		"""Save exams to persistent storage"""
		data = {exam_id: exam.model_dump() for exam_id, exam in self._exams.items()}
		self.storage.save_exams(data)
		self.storage.save_exam_faculty(self._exam_faculty)
	
	def toggle_exam_status(self, exam_id: str, faculty_user_id: str) -> bool:
		"""Toggle exam live status"""
		exam = self._exams.get(exam_id)
		if not exam:
			return False
		
		# Check if faculty owns this exam
		if self._exam_faculty.get(exam_id) != faculty_user_id:
			return False
		
		# Toggle the status
		exam.is_live = not exam.is_live
		self._save_to_storage()
		return True

	def update_exam(self, exam_id: str, exam_data: ExamCreate, faculty_user_id: str) -> bool:
		"""Update an existing exam"""
		if exam_id not in self._exams:
			return False
		
		# Check if faculty owns this exam
		if self._exam_faculty.get(exam_id) != faculty_user_id:
			return False
		
		# Update the exam
		self._exams[exam_id] = exam_data
		self._save_to_storage()
		return True

	def get_related_data_count(self, exam_id: str) -> dict:
		"""Get count of related data for an exam before deletion - college-scoped"""
		from .registry import submission_repo, session_repo, shared_user_repo
		
		# Get exam to check college_id
		exam = self._exams.get(exam_id)
		exam_college_id = getattr(exam, 'college_id', None) if exam else None
		
		# Get session count - college-scoped
		all_sessions = session_repo.get_all_sessions_for_exam(exam_id)
		if exam_college_id:
			# Filter sessions by college
			sessions = []
			for session in all_sessions:
				student_user = shared_user_repo.find_by_id(session.user_id)
				student_college_id = getattr(student_user, 'college_id', None) if student_user else None
				if student_college_id == exam_college_id:
					sessions.append(session)
		else:
			sessions = all_sessions
		session_count = len(sessions)
		
		# Get submission count - college-scoped
		all_submissions = submission_repo.list(exam_id=exam_id)
		if exam_college_id:
			# Filter submissions by college
			submissions = []
			for sub in all_submissions:
				student_user = shared_user_repo.find_by_id(sub.student_id)
				student_college_id = getattr(student_user, 'college_id', None) if student_user else None
				if student_college_id == exam_college_id:
					submissions.append(sub)
		else:
			submissions = all_submissions
		submission_count = len(submissions)
		
		return {
			"session_count": session_count,
			"submission_count": submission_count,
			"total_related_data": session_count + submission_count
		}

	def create_exam(self, exam: ExamCreate, faculty_user_id: str) -> str:
		# Check if exam_id already exists within the same college (case-insensitive)
		exam_college_id = getattr(exam, 'college_id', None)
		if exam_college_id:
			# Check for conflicts within the same college
			for existing_exam_id, existing_exam in self._exams.items():
				existing_college_id = getattr(existing_exam, 'college_id', None)
				if existing_college_id == exam_college_id and existing_exam_id.lower() == exam.exam_id.lower():
					raise ValueError(f'Exam ID "{exam.exam_id}" already exists in this college. Please choose a different exam ID.')
		else:
			# Global uniqueness check if no college_id (fallback) - case-insensitive
			for existing_exam_id in self._exams.keys():
				if existing_exam_id.lower() == exam.exam_id.lower():
					raise ValueError(f'Exam ID "{exam.exam_id}" already exists. Please choose a different exam ID.')
		
		self._exams[exam.exam_id] = exam
		self._exam_faculty[exam.exam_id] = faculty_user_id
		self._save_to_storage()
		return exam.exam_id

	def list_exams(self, faculty_user_id: Optional[str] = None) -> List[ExamPublic]:
		"""List exams, optionally filtered by faculty user"""
		exams_to_show = []
		
		# Import department repository to resolve names
		from .registry import department_repo
		
		for exam_id, exam in self._exams.items():
			# If faculty_user_id is provided, only show exams created by that faculty
			if faculty_user_id is not None:
				if exam_id not in self._exam_faculty or self._exam_faculty[exam_id] != faculty_user_id:
					continue
			
			# Resolve department and section IDs to names
			dept_ids = getattr(exam, 'allowed_departments', [])
			section_ids = getattr(exam, 'allowed_sections', [])
			
			dept_names = []
			for dept_id in dept_ids:
				dept = department_repo.get_department(dept_id)
				if dept:
					dept_names.append(dept.name)
				else:
					dept_names.append(dept_id)
			
			section_names = []
			for section_id in section_ids:
				section = department_repo.get_section(section_id)
				if section:
					section_names.append(section.name)
				else:
					section_names.append(section_id)
			
			exams_to_show.append(ExamPublic(
				exam_id=exam.exam_id,
				subject_name=exam.subject_name,
				language=exam.language,
				duration_minutes=exam.duration_minutes,
				num_questions=exam.num_questions,
				questions_per_student=getattr(exam, 'questions_per_student', 1),
				is_live=exam.is_live,
				allowed_departments=dept_names,
				allowed_years=getattr(exam, 'allowed_years', []),
				allowed_sections=section_names,
			))
		
		return exams_to_show

	def get_results_summary(self, faculty_user_id: Optional[str] = None) -> List[ExamResultSummary]:
		"""Calculate real statistics from submissions and sessions"""
		results = []
		
		# Import department repository to resolve names
		from .registry import department_repo
		
		print(f"🔍 DEBUG: get_results_summary called with faculty_user_id: {faculty_user_id}")
		print(f"🔍 DEBUG: Total exams in system: {len(self._exams)}")
		print(f"🔍 DEBUG: Exam faculty mapping: {self._exam_faculty}")
		
		# If no exams exist, return empty list
		if not self._exams:
			print("🔍 DEBUG: No exams found, returning empty results")
			return results
		
		for exam_id, exam in self._exams.items():
			print(f"🔍 DEBUG: Processing exam {exam_id}: {exam.subject_name}")
			# Temporarily bypass faculty filter to debug
			print(f"🔍 DEBUG: Faculty user ID: {faculty_user_id}")
			print(f"🔍 DEBUG: Exam {exam_id} faculty: {self._exam_faculty.get(exam_id, 'No faculty')}")
			# If faculty_user_id is provided, only show exams created by that faculty
			if faculty_user_id is not None:
				if exam_id not in self._exam_faculty or self._exam_faculty[exam_id] != faculty_user_id:
					print(f"🔍 DEBUG: Skipping exam {exam_id} - not owned by faculty {faculty_user_id}")
					continue
				print(f"🔍 DEBUG: Exam {exam_id} is owned by faculty {faculty_user_id}")
			# Initialize default values
			submissions = []
			live_takers = 0
			already_taken = 0
			
			# Get exam's college_id for filtering (needed both inside and outside try block)
			exam_college_id = getattr(exam, 'college_id', None)
			
			# Try to get real data from repositories
			try:
				# Use global repositories from registry
				from .registry import submission_repo, session_repo, shared_user_repo
				
				# Force reload session data from storage to get latest sessions
				session_repo._load_from_storage()
				# Also reload exam runtime data
				session_repo._load_exam_runtime_data()
				
				# Get sessions and submissions from new system
				if hasattr(session_repo, '_sessions'):
					sessions = session_repo._sessions
					# Filter sessions for this exam AND same college - sessions are stored as (user_id, exam_id) -> session
					exam_sessions = []
					for (user_id, session_exam_id), session in sessions.items():
						if session_exam_id == exam_id:
							# College isolation: Only include sessions from students in the same college as the exam
							if exam_college_id:
								try:
									student_user = shared_user_repo.find_by_id(user_id)
									student_college_id = getattr(student_user, 'college_id', None) if student_user else None
									if student_college_id != exam_college_id:
										print(f"🔍 DEBUG: Skipping student {user_id} - college mismatch: student={student_college_id}, exam={exam_college_id}")
										continue  # Skip students from different colleges
								except Exception as e:
									print(f"⚠️ WARNING: Error checking college for student {user_id}: {e}")
									# On error, include the student to avoid data loss
									pass
							exam_sessions.append(session)
					
					print(f"🔍 DEBUG: Exam {exam_id} - exam_college_id={exam_college_id}, filtered_sessions={len(exam_sessions)}")
					
					# Live takers: have serial number but haven't finished
					live_takers = len([s for s in exam_sessions if hasattr(s, 'serial_number') and s.serial_number is not None and hasattr(s, 'finished') and not s.finished])
					# Already taken: have finished
					already_taken = len([s for s in exam_sessions if hasattr(s, 'finished') and s.finished])
					
					# Get submissions from session submissions (no versioning) - college-scoped
					all_submissions = []
					seen_submissions = set()  # Track unique submissions to avoid duplicates
					
					# Get from session submissions - only from sessions in the same college
					for (user_id, session_exam_id), session in sessions.items():
						if session_exam_id == exam_id:
							# College isolation: Only include submissions from students in the same college
							if exam_college_id:
								student_user = shared_user_repo.find_by_id(user_id)
								student_college_id = getattr(student_user, 'college_id', None) if student_user else None
								if student_college_id != exam_college_id:
									continue  # Skip students from different colleges
							
							if hasattr(session, 'submissions'):
								for submission in session.submissions:
									# Create unique key for deduplication
									sub_key = f"{user_id}_{submission.get('question_id', '')}_{submission.get('submitted_at', '')}"
									if sub_key not in seen_submissions:
										all_submissions.append(submission)
										seen_submissions.add(sub_key)
					
					# Use deduplicated submissions
					submissions = all_submissions
				else:
					# Fallback to old system - filter by college
					all_subs = submission_repo.list(exam_id=exam_id)
					if exam_college_id:
						# Filter submissions by college - check student's college_id
						submissions = []
						for sub in all_subs:
							student_user = shared_user_repo.find_by_id(sub.student_id)
							student_college_id = getattr(student_user, 'college_id', None) if student_user else None
							if student_college_id == exam_college_id:
								submissions.append(sub)
					else:
						submissions = all_subs
			except Exception as e:
				print(f"Error loading exam data: {e}")
				# If there's an error, use default values
				# Still need repositories for students_data section
				try:
					from .registry import session_repo, shared_user_repo
				except ImportError:
					session_repo = None
					shared_user_repo = None
				pass
			
			# Calculate scores from all submissions
			submission_count = len(submissions)
			if submissions:
				# Handle both old and new submission formats, ignoring None/NaN while processing
				scores: List[float] = []
				for sub in submissions:
					val = None
					if hasattr(sub, 'score'):
						val = getattr(sub, 'score', None)
					elif isinstance(sub, dict):
						val = sub.get('score', None)
					# Only include real numbers
					try:
						if val is not None:
							num = float(val)
							if not (num != num):  # exclude NaN
								scores.append(num)
					except Exception:
						pass
				
				if scores:
					avg_score = sum(scores) / len(scores)
					high_score = max(scores)
					low_score = min(scores)
				else:
					avg_score = 0.0
					high_score = 0.0
					low_score = 0.0
			else:
				avg_score = 0.0
				high_score = 0.0
				low_score = 0.0
			
			# Get layout data from exam
			layout_data = getattr(exam, 'layout_data', None)
			
			# Get student data for layout visualization - college-scoped
			students_data = []
			# Ensure repositories are available (import if not already done)
			try:
				if 'shared_user_repo' not in globals() and 'shared_user_repo' not in locals():
					from .registry import session_repo, shared_user_repo
			except (ImportError, NameError):
				pass
			
			if session_repo and hasattr(session_repo, '_sessions'):
				# College isolation: Only include sessions from students in the same college
				exam_sessions = []
				for (user_id, session_exam_id), session in session_repo._sessions.items():
					if session_exam_id == exam_id:
						# College isolation: Only include sessions from students in the same college as the exam
						if exam_college_id and shared_user_repo:
							try:
								student_user = shared_user_repo.find_by_id(user_id)
								student_college_id = getattr(student_user, 'college_id', None) if student_user else None
								if student_college_id != exam_college_id:
									print(f"🔍 DEBUG: Skipping student {user_id} from students_data - college mismatch: student={student_college_id}, exam={exam_college_id}")
									continue  # Skip students from different colleges
							except Exception as e:
								print(f"⚠️ WARNING: Error checking college for student {user_id} in students_data: {e}")
								# On error, include the student to avoid data loss
								pass
						exam_sessions.append(session)
				
				for session in exam_sessions:
					if hasattr(session, 'serial_number') and session.serial_number is not None:
						# Get actual student info from user repository (shared_user_repo already imported above)
						student_user = shared_user_repo.find_by_id(session.user_id)
						student_name = student_user.username if student_user else f"Student_{session.serial_number}"
						
						# Get student's score from submissions
						# The submissions list contains both old and new format submissions
						# We need to find the student's submissions
						student_score = 0
						
						# First, try to get score from session submissions (new format)
						if hasattr(session, 'submissions') and session.submissions:
							# Get the final submission score
							final_submission = None
							for sub in session.submissions:
								if sub.get('is_final', False):
									final_submission = sub
									break
							
							if final_submission:
								student_score = final_submission.get('score', 0)
							elif session.submissions:
								# If no final submission marked, use the last one
								student_score = session.submissions[-1].get('score', 0)
						
						# If no score from session, try old format submissions
						if student_score == 0:
							for s in submissions:
								if hasattr(s, 'student_id') and s.student_id == session.user_id:
									student_score = s.score
									break
						
					roll_number = student_user.roll_number if student_user and hasattr(student_user, 'roll_number') else None
					
					student_info = {
						"serialNumber": session.serial_number,
						"studentName": student_name,
						"studentId": session.user_id,
						"rollNumber": roll_number,
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
				dept_ids = exam.get('allowed_departments', [])
				allowed_years = exam.get('allowed_years', [])
				section_ids = exam.get('allowed_sections', [])
			else:
				# Normal ExamCreate object
				is_live = exam.is_live
				subject_name = exam.subject_name
				language = exam.language
				duration_minutes = exam.duration_minutes
				dept_ids = getattr(exam, 'allowed_departments', [])
				allowed_years = getattr(exam, 'allowed_years', [])
				section_ids = getattr(exam, 'allowed_sections', [])
			
			# Resolve department and section IDs to names
			dept_names = []
			for dept_id in dept_ids:
				dept = department_repo.get_department(dept_id)
				if dept:
					dept_names.append(dept.name)
				else:
					dept_names.append(dept_id)
			
			section_names = []
			for section_id in section_ids:
				section = department_repo.get_section(section_id)
				if section:
					section_names.append(section.name)
				else:
					section_names.append(section_id)
			
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
				students=students_data,
				allowed_departments=dept_names,
				allowed_years=allowed_years,
				allowed_sections=section_names
			))
		
		print(f"🔍 DEBUG: Returning {len(results)} results")
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
	
	def get_exams_for_student(self, department_id: str, year: int, section_id: str, student_college_id: Optional[str] = None) -> List[ExamPublic]:
		"""Get exams available for a student based on their department, year, section, and college"""
		available_exams = []
		
		for exam_id, exam in self._exams.items():
			# College isolation: Only show exams from the same college as the student
			if student_college_id:
				exam_college_id = getattr(exam, 'college_id', None)
				if exam_college_id != student_college_id:
					continue  # Skip exams from different colleges
			
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
