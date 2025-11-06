from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Department name")
    code: str = Field(..., min_length=1, max_length=10, description="Department code")
    college_id: Optional[str] = Field(None, description="College ID (auto-assigned)")


class YearCreate(BaseModel):
    year: int = Field(..., ge=1, le=10, description="Academic year (1-10)")
    college_id: Optional[str] = Field(None, description="College ID (auto-assigned)")


class SectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=10, description="Section name (e.g., A, B, C)")
    college_id: Optional[str] = Field(None, description="College ID (auto-assigned)")


class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: str
    college_id: Optional[str] = None
    created_at: str


class YearResponse(BaseModel):
    id: str
    year: int
    college_id: Optional[str] = None
    created_at: str


class SectionResponse(BaseModel):
    id: str
    name: str
    college_id: Optional[str] = None
    created_at: str


class DepartmentListResponse(BaseModel):
    departments: List[DepartmentResponse]
    total: int


class YearListResponse(BaseModel):
    years: List[YearResponse]
    total: int


class SectionListResponse(BaseModel):
    sections: List[SectionResponse]
    total: int
