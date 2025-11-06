from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from ..models.user import UserRole


class UserCreate(BaseModel):
	username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")
	email: EmailStr = Field(..., description="Valid email address required")
	password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
	role: UserRole = Field(..., description="User role is required")
	college_id: Optional[str] = Field(None, description="College ID (auto-assigned for admins/faculty/students)")
	department_id: Optional[str] = Field(None, description="Department ID (required for students)")
	year: Optional[int] = Field(None, ge=1, le=10, description="Academic year (required for students)")
	section_id: Optional[str] = Field(None, description="Section ID (required for students)")
	roll_number: Optional[str] = Field(None, min_length=1, max_length=20, description="Roll number (required for students)")
	
	@validator('username')
	def validate_username(cls, v):
		if not v or not v.strip():
			raise ValueError('Username cannot be empty')
		if not v.replace('_', '').replace('-', '').isalnum():
			raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
		return v.strip()
	
	@validator('password')
	def validate_password(cls, v):
		if not v or not v.strip():
			raise ValueError('Password cannot be empty')
		if len(v.strip()) < 6:
			raise ValueError('Password must be at least 6 characters long')
		return v.strip()
	
	@validator('department_id', 'section_id', 'roll_number')
	def validate_student_fields(cls, v, values):
		role = values.get('role')
		if role == UserRole.student:
			if not v or not v.strip():
				field_name = 'Department' if 'department_id' in values else 'Section' if 'section_id' in values else 'Roll number'
				raise ValueError(f'{field_name} is required for students')
		return v.strip() if v else v
	
	@validator('year')
	def validate_year(cls, v, values):
		role = values.get('role')
		if role == UserRole.student:
			if v is None:
				raise ValueError('Academic year is required for students')
		return v


class UserUpdate(BaseModel):
	username: Optional[str] = None
	email: Optional[EmailStr] = None
	password: Optional[str] = None
	role: Optional[UserRole] = None
	college_id: Optional[str] = None
	department_id: Optional[str] = None
	year: Optional[int] = None
	section_id: Optional[str] = None
	roll_number: Optional[str] = None


class UserResponse(BaseModel):
	id: str
	username: str
	email: EmailStr
	role: UserRole
	college_id: Optional[str] = None
	department_id: Optional[str] = None
	year: Optional[int] = None
	section_id: Optional[str] = None
	roll_number: Optional[str] = None


class UserListResponse(BaseModel):
	users: list[UserResponse]
	total: int
