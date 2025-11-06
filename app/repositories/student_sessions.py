from typing import Dict, List, Optional, Set, Tuple
from time import time
import threading

# Import exam_repo from registry after it's defined
from ..schemas.exams import ExamCreate
from ..algorithms.question_assignment import QuestionAssignmentAlgorithm
from ..storage.persistent import PersistentStorage


SERIAL_WINDOW_SECONDS = 0


class StudentSession:
	def __init__(self, user_id: str, exam: ExamCreate) -> None:
		self.user_id = user_id
		self.exam_id = exam.exam_id
		self.joined_at = time()
		self.serial_deadline = self.joined_at + SERIAL_WINDOW_SECONDS
		self.serial_number: int | None = None
		self.assigned_question: Optional[str] = None
		self.finished: bool = False
		# Snapshot student's org data at session creation
		self.department_id_snapshot: Optional[str] = None
		self.department_name_snapshot: Optional[str] = None
		self.section_id_snapshot: Optional[str] = None
		self.section_name_snapshot: Optional[str] = None
		self.year_snapshot: Optional[int] = None
		# Timer fields
		self.exam_start_time: Optional[float] = None  # When student actually starts the exam (after serial entry)
		self.exam_duration_minutes: int = exam.duration_minutes
		self.exam_end_time: Optional[float] = None  # Calculated end time
		# Auto-save fields
		self.current_code: str = ""  # Current student code
		self.last_save_time: float = time()  # Last auto-save time
		# Per-question buffered code map
		self.per_question_code: Dict[str, str] = {}
		# Submissions history: list of dicts {question_id, code, score, passed, public_case_results, submitted_at, is_final}
		self.submissions: List[dict] = []


class ExamRuntime:
	def __init__(self, exam: ExamCreate, college_id: Optional[str] = None) -> None:
		self.exam_id = exam.exam_id
		self.college_id = college_id  # Store college_id for isolation
		self.serial_to_user: Dict[int, str] = {}
		self.user_to_serial: Dict[str, int] = {}
		self.serial_to_question: Dict[int, List[str]] = {}


class StudentSessionRepository:
	def __init__(self) -> None:
		self._sessions: Dict[Tuple[str, str], StudentSession] = {}  # (user_id, exam_id)
		self._exam_runtime: Dict[Tuple[str, str], ExamRuntime] = {}  # Key: (college_id, exam_id)
		self.storage = PersistentStorage()
		self._load_from_storage()
		self._load_exam_runtime_data()
	
	def _get_exam_repo(self):
		"""Get exam repository to avoid circular import"""
		from .registry import exam_repo
		return exam_repo

	def _load_from_storage(self) -> None:
		"""Load sessions from persistent storage"""
		data = self.storage.load_sessions()
		for session_key, session_data in data.items():
			user_id, exam_id = session_key.split('|')
			exam_repo = self._get_exam_repo()
			exam = exam_repo._exams.get(exam_id)
			
			# Skip sessions for exams that no longer exist
			if exam is None:
				continue
				
			session = StudentSession(user_id, exam)
			session.serial_number = session_data.get('serial_number')
			session.assigned_question = session_data.get('assigned_question')
			session.finished = session_data.get('finished', False)
			session.joined_at = session_data.get('joined_at', time())
			# Handle serial_deadline calculation properly
			if 'serial_deadline' in session_data:
				session.serial_deadline = session_data['serial_deadline']
			else:
				# Calculate deadline from joined_at
				if isinstance(session.joined_at, str):
					from datetime import datetime
					joined_dt = datetime.fromisoformat(session.joined_at)
					session.serial_deadline = joined_dt.timestamp() + SERIAL_WINDOW_SECONDS
				else:
					session.serial_deadline = session.joined_at + SERIAL_WINDOW_SECONDS
			
			# Load timer and auto-save fields
			session.exam_start_time = session_data.get('exam_start_time')
			session.exam_duration_minutes = session_data.get('exam_duration_minutes', exam.duration_minutes)
			session.exam_end_time = session_data.get('exam_end_time')
			session.current_code = session_data.get('current_code', "")
			session.last_save_time = session_data.get('last_save_time', time())
			# Load per-question buffered code map
			session.per_question_code = session_data.get('per_question_code', {}) or {}
			# Load submissions history
			session.submissions = session_data.get('submissions', [])
			# Load snapshot org fields
			session.department_id_snapshot = session_data.get('department_id_snapshot')
			session.department_name_snapshot = session_data.get('department_name_snapshot')
			session.section_id_snapshot = session_data.get('section_id_snapshot')
			session.section_name_snapshot = session_data.get('section_name_snapshot')
			session.year_snapshot = session_data.get('year_snapshot')
			self._sessions[(user_id, exam_id)] = session
			
			# Note: Runtime data will be reconstructed lazily when needed via _get_exam_runtime()
			# We don't reconstruct it here to avoid circular imports during initialization
		

	def _save_to_storage(self) -> None:
		"""Save sessions to persistent storage"""
		data = {}
		for (user_id, exam_id), session in self._sessions.items():
			data[f"{user_id}|{exam_id}"] = {
				'serial_number': session.serial_number,
				'assigned_question': session.assigned_question,
				'finished': session.finished,
				'joined_at': session.joined_at,
				'serial_deadline': session.serial_deadline,
				# Timer and auto-save fields
				'exam_start_time': session.exam_start_time,
				'exam_duration_minutes': session.exam_duration_minutes,
				'exam_end_time': session.exam_end_time,
				'current_code': session.current_code,
				'last_save_time': session.last_save_time,
				'per_question_code': session.per_question_code,
				'submissions': session.submissions,
				# Snapshot org fields
				'department_id_snapshot': session.department_id_snapshot,
				'department_name_snapshot': session.department_name_snapshot,
				'section_id_snapshot': session.section_id_snapshot,
				'section_name_snapshot': session.section_name_snapshot,
				'year_snapshot': session.year_snapshot
			}
		self.storage.save_sessions(data)
		
		# Also save exam runtime data
		self._save_exam_runtime_data()

	def _save_exam_runtime_data(self) -> None:
		"""Save exam runtime data to persistent storage - college-scoped"""
		runtime_data = {}
		for (college_id, exam_id), runtime in self._exam_runtime.items():
			# Use composite key for storage: "college_id|exam_id"
			storage_key = f"{college_id}|{exam_id}"
			runtime_data[storage_key] = {
				'college_id': college_id,
				'exam_id': exam_id,
				'serial_to_user': runtime.serial_to_user,
				'user_to_serial': runtime.user_to_serial,
				'serial_to_question': runtime.serial_to_question
			}
		self.storage.save_data('exam_runtime', runtime_data)

	def _load_exam_runtime_data(self) -> None:
		"""Load exam runtime data from persistent storage - college-scoped"""
		try:
			runtime_data = self.storage.load_data('exam_runtime')
			for storage_key, data in runtime_data.items():
				# Handle both old format (just exam_id) and new format (college_id|exam_id)
				if '|' in storage_key:
					college_id, exam_id = storage_key.split('|', 1)
				else:
					# Old format - try to get college_id from data or exam
					exam_id = storage_key
					college_id = data.get('college_id') or None
					exam = self._get_exam_repo()._exams.get(exam_id)
					if exam and not college_id:
						college_id = getattr(exam, 'college_id', None)
				
				exam = self._get_exam_repo()._exams.get(exam_id)
				if exam:
					runtime = ExamRuntime(exam, college_id)
					runtime.serial_to_user = data.get('serial_to_user', {})
					runtime.user_to_serial = data.get('user_to_serial', {})
					runtime.serial_to_question = data.get('serial_to_question', {})
					# Use tuple key for college-scoped storage
					self._exam_runtime[(college_id or 'unknown', exam_id)] = runtime
		except Exception as e:
			# If there's an error loading runtime data, continue without it
			# The runtime data will be reconstructed from session data
			print(f"Warning: Could not load exam runtime data: {e}")
			pass
		
		# Reconstruct missing session data from submissions
		# Disabled to prevent overwriting existing session data
		# self._reconstruct_missing_sessions()

	def _reconstruct_missing_sessions(self) -> None:
		"""Reconstruct missing session data from submissions"""
		try:
			from .registry import submission_repo
			submissions = submission_repo.list()
			
			# Only reconstruct if we have no existing sessions
			if not self._sessions:
				for submission in submissions:
					user_id = submission.student_id
					exam_id = submission.exam_id
					session_key = (user_id, exam_id)
					
					# If session doesn't exist but submission does, create a session
					if session_key not in self._sessions and exam_id:
						exam_repo = self._get_exam_repo()
						exam = exam_repo._exams.get(exam_id)
						if exam:
							# Create a session for this student
							session = StudentSession(user_id, exam)
							session.finished = True  # They have a submission, so they finished
							session.serial_number = 1  # Default serial number
							session.assigned_question = [submission.question_id] if submission.question_id else []
							self._sessions[session_key] = session
							
							# Create exam runtime if it doesn't exist - college-scoped
							exam_college_id = getattr(exam, 'college_id', None) if exam else None
							rt = self._get_exam_runtime(exam_id, exam_college_id)
							rt.serial_to_user[1] = user_id
							rt.user_to_serial[user_id] = 1
							if session.assigned_question:
								rt.serial_to_question[1] = session.assigned_question
				
				# Save the reconstructed sessions
				if self._sessions:
					self._save_to_storage()
		except Exception as e:
			# If there's an error reconstructing sessions, continue without it
			pass

	def _get_current_exam_version(self, exam_id: str) -> int:
		"""Get the current version number of an exam (always 1 since we removed versioning)"""
		return 1

	def _get_exam_runtime(self, exam_id: str, college_id: Optional[str] = None) -> ExamRuntime:
		"""Get exam runtime - college-scoped"""
		# Use college_id in the key for proper isolation
		runtime_key = (college_id or 'unknown', exam_id)
		
		if runtime_key not in self._exam_runtime:
			exam_repo = self._get_exam_repo()
			exam = exam_repo._exams.get(exam_id)
			if not exam:
				raise ValueError('exam not found')
			# Get college_id from exam if not provided
			if not college_id:
				college_id = getattr(exam, 'college_id', None)
				runtime_key = (college_id or 'unknown', exam_id)
			self._exam_runtime[runtime_key] = ExamRuntime(exam, college_id)
		
		# Always reconstruct runtime data from existing sessions to ensure it's up-to-date
		# BUT only include sessions from the same college
		rt = self._exam_runtime[runtime_key]
		rt.serial_to_user.clear()
		rt.user_to_serial.clear()
		rt.serial_to_question.clear()
		
		# Lazy import to avoid circular import issues during initialization
		try:
			from .registry import shared_user_repo
		except ImportError:
			# If import fails (circular import during initialization), skip college filtering
			# This is safe because runtime will be reconstructed properly when actually used
			shared_user_repo = None
		
		for (user_id, session_exam_id), session in self._sessions.items():
			if session_exam_id == exam_id and session.serial_number is not None:
				# College isolation: Only include sessions from students in the same college
				if college_id and shared_user_repo:
					try:
						student_user = shared_user_repo.find_by_id(user_id)
						student_college_id = getattr(student_user, 'college_id', None) if student_user else None
						if student_college_id != college_id:
							continue  # Skip students from different colleges
					except Exception:
						# If lookup fails, include it anyway (shouldn't happen in normal operation)
						pass
				
				rt.serial_to_user[session.serial_number] = user_id
				rt.user_to_serial[user_id] = session.serial_number
				if session.assigned_question:
					rt.serial_to_question[session.serial_number] = session.assigned_question
		
		return rt

	def join_exam(self, user_id: str, exam_id: str, start_code: str) -> dict:
		exam_repo = self._get_exam_repo()
		exam = exam_repo._exams.get(exam_id)
		if not exam:
			raise ValueError('exam not found')
		if not exam.is_live:
			raise ValueError('exam is not live')
		if exam.start_code != start_code:
			raise ValueError('invalid start code')
		
		# College isolation: Verify student belongs to the same college as the exam
		# Lazy import to avoid circular import
		try:
			from .registry import shared_user_repo
			student_user = shared_user_repo.find_by_id(user_id)
			student_college_id = getattr(student_user, 'college_id', None) if student_user else None
			exam_college_id = getattr(exam, 'college_id', None)
			
			if exam_college_id and student_college_id != exam_college_id:
				raise ValueError('you do not have access to this exam')
		except ImportError:
			# Skip validation during initialization - will be enforced on actual use
			exam_college_id = getattr(exam, 'college_id', None)
		
		# Check if already joined - rejoin disabled: end previous session and block
		if (user_id, exam_id) in self._sessions:
			existing_session = self._sessions[(user_id, exam_id)]
			if not existing_session.finished:
				# End the current session to prevent rejoin
				existing_session.finished = True
				self._save_to_storage()
			raise ValueError('Rejoin disabled. Your previous session has been ended.')
		
		# Do NOT create a session yet. Only validate access; session is created when serial is submitted.
		return {
			'exam_id': exam_id,
			'message': 'validated - enter system number',
			'has_serial': False
		}

	def start_session(self, user_id: str, exam_id: str) -> StudentSession:
		exam_repo = self._get_exam_repo()
		exam = exam_repo._exams.get(exam_id)
		if not exam:
			raise ValueError('exam not found')
		sess = self._sessions.get((user_id, exam_id))
		if not sess:
			sess = StudentSession(user_id, exam)
			self._sessions[(user_id, exam_id)] = sess
		return sess

	def set_serial(self, user_id: str, exam_id: str, serial_number: int) -> StudentSession:
		sess = self._sessions.get((user_id, exam_id))
		if not sess:
			# Create session on first serial submission (considered joined now)
			exam_repo = self._get_exam_repo()
			exam = exam_repo._exams.get(exam_id)
			if not exam:
				raise ValueError('exam not found')
			sess = StudentSession(user_id, exam)
			# Snapshot student org data
			try:
				from .registry import user_repo, dept_mgmt_repo
				user = user_repo.find_by_id(user_id)
				if user:
					sess.department_id_snapshot = getattr(user, 'department_id', None)
					sess.section_id_snapshot = getattr(user, 'section_id', None)
					sess.year_snapshot = getattr(user, 'year', None)
					if sess.department_id_snapshot:
						dept = dept_mgmt_repo.get_department(sess.department_id_snapshot)
						sess.department_name_snapshot = getattr(dept, 'name', None) if dept else None
					if sess.section_id_snapshot:
						sec = dept_mgmt_repo.get_section(sess.section_id_snapshot)
						sess.section_name_snapshot = getattr(sec, 'name', None) if sec else None
			except Exception:
				pass
			self._sessions[(user_id, exam_id)] = sess
		if sess.finished:
			raise ValueError('exam already finished')
		# Removed serial deadline validation - students can enter serial number anytime

		# Get the actual layout data from the exam - college-scoped
		exam_repo = self._get_exam_repo()
		exam = exam_repo._exams.get(exam_id)
		if not exam:
			raise ValueError('exam not found')
		
		# College isolation: Verify student belongs to the same college as the exam
		# Lazy import to avoid circular import
		try:
			from .registry import shared_user_repo
			student_user = shared_user_repo.find_by_id(user_id)
			student_college_id = getattr(student_user, 'college_id', None) if student_user else None
			exam_college_id = getattr(exam, 'college_id', None)
			
			if exam_college_id and student_college_id != exam_college_id:
				raise ValueError('you do not have access to this exam')
		except ImportError:
			# Skip validation during initialization - will be enforced on actual use
			exam_college_id = getattr(exam, 'college_id', None)
		
		# Get college-scoped runtime
		rt = self._get_exam_runtime(exam_id, exam_college_id)
		
		# Get layout data from exam (this should be stored when layout is created)
		layout_data = getattr(exam, 'layout_data', None)
		if layout_data:
			working_systems = [s for s in layout_data.get('systems', []) if s.get('isWorking', True)]
			max_serial = len(working_systems)
		else:
			# Fallback: use a reasonable range
			max_serial = 50
		
		if serial_number < 1 or serial_number > max_serial:
			raise ValueError(f'serial number must be between 1 and {max_serial}')
		
		# FCFS: serial must be unique per exam
		if serial_number in rt.serial_to_user and rt.serial_to_user[serial_number] != user_id:
			raise ValueError('serial already taken')
		
		# Check if user already has a serial number (any serial number)
		if user_id in rt.user_to_serial:
			# If user already has a serial number, they can't change it
			raise ValueError('you have already submitted a serial number')

		# record serial
		rt.serial_to_user[serial_number] = user_id
		rt.user_to_serial[user_id] = serial_number
		sess.serial_number = serial_number
		
		# Start the exam timer
		sess.exam_start_time = time()
		sess.exam_end_time = sess.exam_start_time + (sess.exam_duration_minutes * 60)

		# Use layout data for question assignment if available
		layout_data = getattr(exam, 'layout_data', None)
		if layout_data:
			# Find the system with this serial number in the layout
			system = None
			for s in layout_data.get('systems', []):
				if s.get('serialNumber') == serial_number:
					system = s
					break
			
			if system and system.get('assignedQuestions'):
				# Use the questions assigned in the layout
				assigned_questions = system.get('assignedQuestions', [])
				rt.serial_to_question[serial_number] = assigned_questions
				sess.assigned_question = assigned_questions
			else:
				# Fallback to adjacency-based assignment
				self._assign_questions_by_adjacency(exam, rt, serial_number, sess)
				# Update the layout data to reflect the actual assignment
				self._update_layout_assignment(exam, serial_number, sess.assigned_question)
		else:
			# Fallback to adjacency-based assignment
			self._assign_questions_by_adjacency(exam, rt, serial_number, sess)
		self._save_to_storage()
		return sess
	
	def auto_save_code(self, user_id: str, exam_id: str, code: str) -> None:
		"""Auto-save student code"""
		print(f"💾 Backend auto-save called: user_id={user_id}, exam_id={exam_id}, code_length={len(code)}")
		session = self._sessions.get((user_id, exam_id))
		if not session:
			print(f"💾 No session found for user_id={user_id}, exam_id={exam_id}")
			return
		
		session.current_code = code
		session.last_save_time = time()
		self._save_to_storage()
		print(f"💾 Code auto-saved successfully for user_id={user_id}, exam_id={exam_id}")
	
	def get_remaining_time(self, user_id: str, exam_id: str) -> Optional[int]:
		"""Get remaining time in seconds, returns None if exam not started or finished"""
		session = self._sessions.get((user_id, exam_id))
		if not session or not session.exam_start_time or session.finished:
			return None
		
		current_time = time()
		remaining = int(session.exam_end_time - current_time)
		return max(0, remaining)
	
	def is_exam_time_up(self, user_id: str, exam_id: str) -> bool:
		"""Check if exam time has ended"""
		remaining = self.get_remaining_time(user_id, exam_id)
		return remaining is not None and remaining <= 0
	
	def auto_finish_exam(self, user_id: str, exam_id: str) -> bool:
		"""Auto-finish exam if time is up, returns True if exam was finished"""
		if self.is_exam_time_up(user_id, exam_id):
			session = self._sessions.get((user_id, exam_id))
			if session and not session.finished:
				# Auto-submit current code before finishing
				try:
					if session.current_code is not None:
						assigned = []
						if isinstance(session.assigned_question, list):
							assigned = session.assigned_question
						elif isinstance(session.assigned_question, str) and session.assigned_question:
							assigned = [session.assigned_question]
						if assigned:
							self.submit(user_id, exam_id, assigned[0], session.current_code)
				except Exception:
					pass
				session.finished = True
				# Mark last submission as final
				if session.submissions:
					for s in session.submissions:
						s['is_final'] = False
					session.submissions[-1]['is_final'] = True
				self._save_to_storage()
				return True
		return False

	def get_submissions(self, user_id: str, exam_id: str, exam_version: int = None) -> List[dict]:
		"""Return all submissions for a user's exam"""
		# Get submissions from current session (no versioning)
		sess = self._sessions.get((user_id, exam_id))
		if not sess:
			return []
		
		return sess.submissions or []
	
	def auto_finish_all_exam_sessions(self, exam_id: str) -> int:
		"""Auto-finish all active sessions for an exam (when faculty disables it), returns count of finished sessions"""
		finished_count = 0
		for (user_id, session_exam_id), session in self._sessions.items():
			if session_exam_id == exam_id and not session.finished:
				# Auto-submit current code before finishing
				try:
					if session.current_code is not None:
						assigned = []
						if isinstance(session.assigned_question, list):
							assigned = session.assigned_question
						elif isinstance(session.assigned_question, str) and session.assigned_question:
							assigned = [session.assigned_question]
						if assigned:
							self.submit(user_id, exam_id, assigned[0], session.current_code)
				except Exception:
					pass
				session.finished = True
				# Mark last submission as final
				if session.submissions:
					for s in session.submissions:
						s['is_final'] = False
					session.submissions[-1]['is_final'] = True
				finished_count += 1
		
		if finished_count > 0:
			self._save_to_storage()
		
		return finished_count

	def _assign_questions_by_adjacency(self, exam, rt, serial_number, sess):
		"""Fallback method for adjacency-based question assignment"""
		question_ids = [q.question_id for q in exam.questions]
		if not question_ids:
			raise ValueError('no questions configured')
		
		# Get questions per student from exam configuration
		questions_per_student = getattr(exam, 'questions_per_student', 1)
		
		# Generate all possible combinations
		from itertools import combinations
		all_combinations = list(combinations(question_ids, questions_per_student))
		
		if not all_combinations:
			raise ValueError('no valid question combinations')
		
		# Find a combination that doesn't conflict with adjacent systems
		best_combination = None
		for combination in all_combinations:
			has_conflict = False
			
			# Check conflict with previous system
			prev_assignment = rt.serial_to_question.get(serial_number - 1)
			if prev_assignment and set(combination).intersection(set(prev_assignment)):
				has_conflict = True
			
			# Check conflict with next system
			next_assignment = rt.serial_to_question.get(serial_number + 1)
			if next_assignment and set(combination).intersection(set(next_assignment)):
				has_conflict = True
			
			if not has_conflict:
				best_combination = list(combination)
				break
		
		# If no perfect combination found, use the first one
		if not best_combination:
			best_combination = list(all_combinations[0])
		
		rt.serial_to_question[serial_number] = best_combination
		sess.assigned_question = best_combination

	def _update_layout_assignment(self, exam, serial_number, assigned_questions):
		"""Update the layout data to reflect the actual question assignment"""
		try:
			layout_data = getattr(exam, 'layout_data', None)
			if layout_data:
				# Find the system with this serial number and update its assignment
				for system in layout_data.get('systems', []):
					if system.get('serialNumber') == serial_number:
						system['assignedQuestions'] = assigned_questions
						break
				
				# Save the updated exam data
				exam_repo = self._get_exam_repo()
				exam_repo._save_to_storage()
		except Exception as e:
			# If there's an error updating layout, continue without it
			pass

	def get_assignment(self, user_id: str, exam_id: str) -> List[str]:
		sess = self._sessions.get((user_id, exam_id))
		if not sess:
			raise ValueError('no session found - student may not have joined the exam')
		if not sess.assigned_question:
			raise ValueError('no assignment - student may not have entered serial number yet')
		
		# Return the assigned questions (could be single or multiple)
		if isinstance(sess.assigned_question, list):
			return sess.assigned_question
		else:
			return [sess.assigned_question]

	def submit(self, user_id: str, exam_id: str, question_id: str, code: str) -> dict:
		sess = self._sessions.get((user_id, exam_id))
		if not sess or sess.finished:
			raise ValueError('session not active')
		exam_repo = self._get_exam_repo()
		exam = exam_repo._exams.get(exam_id)
		question = next((q for q in exam.questions if q.question_id == question_id), None)
		if not question:
			raise ValueError('question not found')

		# Snapshot student org data
		from datetime import datetime, timezone
		dept_id_snapshot = None
		section_id_snapshot = None
		year_snapshot = None
		dept_name_snapshot = None
		section_name_snapshot = None
		try:
			from .registry import user_repo, dept_mgmt_repo
			user = user_repo.find_by_id(user_id)
			if user:
				dept_id_snapshot = getattr(user, 'department_id', None)
				section_id_snapshot = getattr(user, 'section_id', None)
				year_snapshot = getattr(user, 'year', None)
				if dept_id_snapshot:
					dept_obj = dept_mgmt_repo.get_department(dept_id_snapshot)
					dept_name_snapshot = getattr(dept_obj, 'name', None) if dept_obj else None
				if section_id_snapshot:
					sec_obj = dept_mgmt_repo.get_section(section_id_snapshot)
					section_name_snapshot = getattr(sec_obj, 'name', None) if sec_obj else None
		except Exception:
			pass

		# 1) Append processing stub immediately so UI can render
		stub = {
			'question_id': question_id,
			'code': code,
			'score': None,
			'passed': False,
			'public_case_results': [],
			'detailed_results': [],
			'submitted_at': datetime.now(timezone.utc).isoformat(),
			'is_final': False,
			'status': 'processing',
			'ideal_solution': question.ideal_solution or '',
			'department_id_snapshot': dept_id_snapshot,
			'department_name_snapshot': dept_name_snapshot,
			'section_id_snapshot': section_id_snapshot,
			'section_name_snapshot': section_name_snapshot,
			'year_snapshot': year_snapshot,
		}
		sess.submissions.append(stub)
		try:
			sess.per_question_code[question_id] = code
		except Exception:
			pass
		self._save_to_storage()

		# 2) Process evaluation asynchronously and update the stub in place
		def _worker():
			try:
				from ..evaluator.combine import evaluate_code
				test_cases = [tc.model_dump() for tc in question.test_cases]
				score, feedback, correctness, logic_similarity, effort, public_results, llm_feedback, detailed_results = evaluate_code(
					exam.language,
					code,
					question.ideal_solution or '',
					test_cases,
					question.text or ''
				)
				ai_score = round(score, 2)
				ai_passed = ai_score >= 50.0
				llm_feedback_data = llm_feedback if isinstance(llm_feedback, dict) else {}
				# Update last submission (the stub we just appended)
				if sess.submissions:
					ref = sess.submissions[-1]
					ref.update({
						'score': ai_score,
						'passed': ai_passed,
						'public_case_results': public_results or [],
						'detailed_results': detailed_results or [],
						'effort_score': round(effort, 4),
						'logic_similarity': round(logic_similarity, 4),
						'correctness': round(correctness, 4),
						'llm_feedback': llm_feedback_data,
						'status': 'done'
					})
				self._save_to_storage()
			except Exception:
				# Leave stub as processing/partial if evaluation fails
				try:
					ref = sess.submissions[-1]
					ref['status'] = 'failed'
					self._save_to_storage()
				except Exception:
					pass
		threading.Thread(target=_worker, daemon=True).start()

		# 3) Return placeholder response so UI can show immediate state
		return {
			'passed': False,
			'score': None,
			'public_case_results': [],
			'detailed_results': []
		}

	def finish(self, user_id: str, exam_id: str) -> None:
		sess = self._sessions.get((user_id, exam_id))
		if not sess:
			raise ValueError('no session')
		sess.finished = True
		# Mark the last submission as final, if any
		if sess.submissions:
			for s in sess.submissions:
				s['is_final'] = False
			sess.submissions[-1]['is_final'] = True
		self._save_to_storage()

	def set_per_question_code(self, user_id: str, exam_id: str, question_id: str, code: str) -> None:
		sess = self._sessions.get((user_id, exam_id))
		if not sess:
			return
		sess.per_question_code[question_id] = code
		self._save_to_storage()

	def submit_all_buffered(self, user_id: str, exam_id: str) -> int:
		"""Submit buffered code for all known questions in the session.
		Returns number of submissions created."""
		sess = self._sessions.get((user_id, exam_id))
		if not sess:
			return 0
		# Build last submitted code per question to avoid duplicates
		last_submitted_by_qid: dict[str, str] = {}
		for s in sess.submissions:
			qid = s.get('question_id')
			code = s.get('code')
			if qid:
				last_submitted_by_qid[qid] = code

		submitted = 0
		# Determine assigned questions list
		assigned: list[str] = []
		if isinstance(sess.assigned_question, list):
			assigned = sess.assigned_question
		elif isinstance(sess.assigned_question, str) and sess.assigned_question:
			assigned = [sess.assigned_question]

		per_q: dict[str, str] = dict(getattr(sess, 'per_question_code', {}) or {})
		# Submit only for assigned questions, using their last autosaved code
		for qid in assigned:
			code = per_q.get(qid)
			try:
				# Skip empty or whitespace-only code
				if not code or not str(code).strip():
					continue
				# Allow re-submit to create a fresh stub if identical; avoids missing finalization
				self.submit(user_id, exam_id, qid, code)
				submitted += 1
			except Exception:
				# Continue with other questions even if one fails
				pass

		# IMPORTANT: Do NOT submit any global current_code fallback here.
		# This prevents accidental reuse of a single buffer for all questions.
		return submitted
	
	def get_active_sessions_for_exam(self, exam_id: str) -> List[StudentSession]:
		"""Get all active (non-finished) sessions for a specific exam"""
		active_sessions = []
		for (user_id, session_exam_id), session in self._sessions.items():
			if session_exam_id == exam_id and not session.finished:
				active_sessions.append(session)
		return active_sessions
	
	def get_all_sessions_for_exam(self, exam_id: str) -> List[StudentSession]:
		"""Get all sessions (both active and completed) for a specific exam"""
		all_sessions = []
		for (user_id, session_exam_id), session in self._sessions.items():
			if session_exam_id == exam_id:
				all_sessions.append(session)
		return all_sessions
	
	def delete_by_exam_id(self, exam_id: str, college_id: Optional[str] = None) -> int:
		"""Delete all sessions for a specific exam (college-scoped) and return count of deleted items"""
		# Get exam to determine college_id if not provided
		if not college_id:
			exam_repo = self._get_exam_repo()
			exam = exam_repo._exams.get(exam_id)
			if exam:
				college_id = getattr(exam, 'college_id', None)
		
		# Filter sessions by college when deleting
		sessions_to_delete = []
		# Lazy import to avoid circular import
		shared_user_repo = None
		if college_id:
			try:
				from .registry import shared_user_repo
			except ImportError:
				pass  # Skip college filtering if import fails
		
		for (user_id, session_exam_id), session in self._sessions.items():
			if session_exam_id == exam_id:
				# College isolation: Only delete sessions from same college
				if college_id and shared_user_repo:
					try:
						student_user = shared_user_repo.find_by_id(user_id)
						student_college_id = getattr(student_user, 'college_id', None) if student_user else None
						if student_college_id != college_id:
							continue  # Skip students from different colleges
					except Exception:
						pass  # If lookup fails, include it
				sessions_to_delete.append((user_id, session_exam_id))
		
		for session_key in sessions_to_delete:
			del self._sessions[session_key]
		
		# Also delete exam runtime data - college-scoped
		runtime_deleted = False
		runtime_key = (college_id or 'unknown', exam_id)
		if runtime_key in self._exam_runtime:
			del self._exam_runtime[runtime_key]
			runtime_deleted = True
		
		# Save changes if we deleted anything
		if sessions_to_delete or runtime_deleted:
			self._save_to_storage()
			self._save_exam_runtime_data()
		
		return len(sessions_to_delete)

	def delete_by_user_id(self, user_id: str) -> int:
		"""Delete all sessions for a specific student and return count of deleted sessions"""
		sessions_to_delete = [key for key in list(self._sessions.keys()) if key[0] == user_id]
		for session_key in sessions_to_delete:
			del self._sessions[session_key]
		if sessions_to_delete:
			self._save_to_storage()
		return len(sessions_to_delete)

	def delete_by_user_and_exam(self, user_id: str, exam_id: str) -> bool:
		"""Delete the session for a specific student within a specific exam and detach runtime mappings."""
		deleted = False
		key = (user_id, exam_id)
		if key in self._sessions:
			# Remove runtime serial mappings if present (college-scoped)
			try:
				exam_repo = self._get_exam_repo()
				exam = exam_repo._exams.get(exam_id)
				college_id = getattr(exam, 'college_id', None) if exam else None
				rt = self._get_exam_runtime(exam_id, college_id)
				serial = rt.user_to_serial.get(user_id)
				if serial is not None:
					try: del rt.serial_to_user[serial]
					except Exception: pass
					try: del rt.serial_to_question[serial]
					except Exception: pass
					try: del rt.user_to_serial[user_id]
					except Exception: pass
			except Exception:
				pass
			# Delete the session
			del self._sessions[key]
			deleted = True
			self._save_to_storage()
		return deleted
	
	def calculate_minimum_questions_needed(self, exam_id: str, questions_per_student: int) -> dict:
		"""Calculate minimum questions needed for adjacency-free assignment."""
		exam_repo = self._get_exam_repo()
		exam = exam_repo._exams.get(exam_id)
		if not exam:
			return {"error": "Exam not found"}
		
		algorithm = QuestionAssignmentAlgorithm(len(exam.questions))
		min_needed = algorithm.calculate_minimum_questions_needed(questions_per_student)
		
		# Check if it's mathematically possible
		mathematically_possible = questions_per_student <= len(exam.questions)
		
		if not mathematically_possible:
			return {
				"current_questions": len(exam.questions),
				"questions_per_student": questions_per_student,
				"minimum_needed": len(exam.questions),
				"sufficient": False,
				"recommendation": f"❌ IMPOSSIBLE: Cannot assign {questions_per_student} questions when only {len(exam.questions)} available. You need at least {questions_per_student} questions."
			}
		
		return {
			"current_questions": len(exam.questions),
			"questions_per_student": questions_per_student,
			"minimum_needed": min_needed,
			"sufficient": len(exam.questions) >= min_needed,
			"recommendation": f"You need at least {min_needed} questions to assign {questions_per_student} questions per student without adjacency conflicts."
		}
	
	def get_all_sessions_for_user(self, user_id: str) -> List[StudentSession]:
		"""Get all sessions for a specific user"""
		sessions = []
		
		# Get current sessions only (no historical data since we removed versioning)
		for (session_user_id, exam_id), session in self._sessions.items():
			if session_user_id == user_id:
				sessions.append(session)
		
		return sessions
