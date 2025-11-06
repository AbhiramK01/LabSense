from pydantic import BaseModel, EmailStr
from typing import Optional
from ..models.user import UserRole


class LoginRequest(BaseModel):
	username_or_email: str
	password: str


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
	role: UserRole


class UserPublic(BaseModel):
	id: str
	username: str
	email: EmailStr
	role: UserRole
	college_id: Optional[str] = None
	college_name: Optional[str] = None
	# Student-specific fields
	roll_number: Optional[str] = None
	department_id: Optional[str] = None
	department_name: Optional[str] = None
	year: Optional[int] = None
	section_id: Optional[str] = None
	section_name: Optional[str] = None
