from .exams import ExamRepository
from .submissions import SubmissionRepository
from .student_sessions import StudentSessionRepository
from .users import UserRepository
from .department_management import DepartmentManagementRepository
from .colleges import CollegeRepository

exam_repo = ExamRepository()
submission_repo = SubmissionRepository()
session_repo = StudentSessionRepository()
user_repo = UserRepository()
dept_mgmt_repo = DepartmentManagementRepository()
college_repo = CollegeRepository()

# Aliases for convenience
department_repo = dept_mgmt_repo
shared_user_repo = user_repo  # Alias for shared_user_repo (used in exams.py and student_sessions.py)
