from enum import Enum
from typing import Optional


class UserRole(str, Enum):
	faculty = "faculty"
	student = "student"
	admin = "admin"
	super_admin = "super_admin"


class User:
	def __init__(self, id: str, username: str, email: str, hashed_password: str, role: UserRole, 
	             department_id: Optional[str] = None, year: Optional[int] = None, 
	             section_id: Optional[str] = None, roll_number: Optional[str] = None,
	             college_id: Optional[str] = None):
		self.id = id
		self.username = username
		self.email = email
		self.hashed_password = hashed_password
		self.role = role
		self.department_id = department_id
		self.year = year
		self.section_id = section_id
		self.roll_number = roll_number
		self.college_id = college_id

	def is_faculty(self) -> bool:
		return self.role == UserRole.faculty

	def is_student(self) -> bool:
		return self.role == UserRole.student

	def is_admin(self) -> bool:
		return self.role == UserRole.admin

	def is_super_admin(self) -> bool:
		return self.role == UserRole.super_admin
