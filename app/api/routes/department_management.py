from fastapi import APIRouter, Depends, HTTPException
from typing import List

from ...schemas.department_management import (
    DepartmentCreate, YearCreate, SectionCreate,
    DepartmentResponse, YearResponse, SectionResponse,
    DepartmentListResponse, YearListResponse, SectionListResponse
)
from ...models.user import UserRole
from ..deps import require_role
from ...repositories.registry import dept_mgmt_repo

router = APIRouter()


@router.get("/departments", response_model=DepartmentListResponse)
async def get_departments(claims = Depends(require_role(UserRole.admin))):
    """Get departments for the admin's college (admin only)"""
    # Get admin's college_id
    from ...repositories.shared_user_repo import shared_user_repo
    admin_user = shared_user_repo.find_by_id(claims.get('sub'))
    college_id = getattr(admin_user, 'college_id', None) if admin_user else None
    
    departments = dept_mgmt_repo.get_departments(college_id)
    return DepartmentListResponse(departments=departments, total=len(departments))


@router.post("/departments", response_model=DepartmentResponse)
async def create_department(department: DepartmentCreate, claims = Depends(require_role(UserRole.admin))):
    """Create a new department (admin only)"""
    try:
        # Auto-assign college_id based on admin's college
        from ...repositories.shared_user_repo import shared_user_repo
        admin_user = shared_user_repo.find_by_id(claims.get('sub'))
        if admin_user and getattr(admin_user, 'college_id', None):
            department.college_id = getattr(admin_user, 'college_id')
        
        dept_id = dept_mgmt_repo.create_department(department)
        return dept_mgmt_repo.get_department(dept_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/departments/{dept_id}", response_model=DepartmentResponse)
async def get_department(dept_id: str, _claims = Depends(require_role(UserRole.admin))):
    """Get department by ID (admin only)"""
    department = dept_mgmt_repo.get_department(dept_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.delete("/departments/{dept_id}")
async def delete_department(dept_id: str, _claims = Depends(require_role(UserRole.admin))):
    """Delete department by ID (admin only)"""
    if not dept_mgmt_repo.delete_department(dept_id):
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(dept_id: str, department: DepartmentCreate, claims = Depends(require_role(UserRole.admin))):
    """Update a department (admin only)"""
    try:
        # Ensure admin is modifying within their college
        from ...repositories.shared_user_repo import shared_user_repo
        admin_user = shared_user_repo.find_by_id(claims.get('sub'))
        admin_college_id = getattr(admin_user, 'college_id', None) if admin_user else None
        existing = dept_mgmt_repo.get_department(dept_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Department not found")
        if admin_college_id and getattr(existing, 'college_id', None) and existing.college_id != admin_college_id:
            raise HTTPException(status_code=403, detail="Cannot modify department from another college")
        dept_mgmt_repo.update_department(dept_id, name=department.name, code=department.code)
        return dept_mgmt_repo.get_department(dept_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/years", response_model=YearListResponse)
async def get_years(claims = Depends(require_role(UserRole.admin))):
    """Get academic years for the admin's college (admin only)"""
    # Get admin's college_id
    from ...repositories.shared_user_repo import shared_user_repo
    admin_user = shared_user_repo.find_by_id(claims.get('sub'))
    college_id = getattr(admin_user, 'college_id', None) if admin_user else None
    
    years = dept_mgmt_repo.get_years(college_id)
    return YearListResponse(years=years, total=len(years))


@router.post("/years", response_model=YearResponse)
async def create_year(year: YearCreate, claims = Depends(require_role(UserRole.admin))):
    """Create a new academic year (admin only)"""
    try:
        # Auto-assign college_id based on admin's college
        from ...repositories.shared_user_repo import shared_user_repo
        admin_user = shared_user_repo.find_by_id(claims.get('sub'))
        if admin_user and getattr(admin_user, 'college_id', None):
            year.college_id = getattr(admin_user, 'college_id')
        
        year_id = dept_mgmt_repo.create_year(year)
        return dept_mgmt_repo.get_year(year_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/years/{year_id}", response_model=YearResponse)
async def get_year(year_id: str, _claims = Depends(require_role(UserRole.admin))):
    """Get year by ID (admin only)"""
    year = dept_mgmt_repo.get_year(year_id)
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    return year


@router.delete("/years/{year_id}")
async def delete_year(year_id: str, _claims = Depends(require_role(UserRole.admin))):
    """Delete year by ID (admin only)"""
    if not dept_mgmt_repo.delete_year(year_id):
        raise HTTPException(status_code=404, detail="Academic year not found")
    return {"message": "Academic year deleted successfully"}


@router.put("/years/{year_id}", response_model=YearResponse)
async def update_year(year_id: str, year: YearCreate, claims = Depends(require_role(UserRole.admin))):
    """Update an academic year (admin only)"""
    try:
        from ...repositories.shared_user_repo import shared_user_repo
        admin_user = shared_user_repo.find_by_id(claims.get('sub'))
        admin_college_id = getattr(admin_user, 'college_id', None) if admin_user else None
        existing = dept_mgmt_repo.get_year(year_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Academic year not found")
        if admin_college_id and getattr(existing, 'college_id', None) and existing.college_id != admin_college_id:
            raise HTTPException(status_code=403, detail="Cannot modify year from another college")
        dept_mgmt_repo.update_year(year_id, year=year.year)
        return dept_mgmt_repo.get_year(year_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sections", response_model=SectionListResponse)
async def get_sections(claims = Depends(require_role(UserRole.admin))):
    """Get sections for the admin's college (admin only)"""
    # Get admin's college_id
    from ...repositories.shared_user_repo import shared_user_repo
    admin_user = shared_user_repo.find_by_id(claims.get('sub'))
    college_id = getattr(admin_user, 'college_id', None) if admin_user else None
    
    sections = dept_mgmt_repo.get_sections(college_id)
    return SectionListResponse(sections=sections, total=len(sections))


@router.post("/sections", response_model=SectionResponse)
async def create_section(section: SectionCreate, claims = Depends(require_role(UserRole.admin))):
    """Create a new section (admin only)"""
    try:
        # Auto-assign college_id based on admin's college
        from ...repositories.shared_user_repo import shared_user_repo
        admin_user = shared_user_repo.find_by_id(claims.get('sub'))
        if admin_user and getattr(admin_user, 'college_id', None):
            section.college_id = getattr(admin_user, 'college_id')
        
        section_id = dept_mgmt_repo.create_section(section)
        return dept_mgmt_repo.get_section(section_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sections/{section_id}", response_model=SectionResponse)
async def get_section(section_id: str, _claims = Depends(require_role(UserRole.admin))):
    """Get section by ID (admin only)"""
    section = dept_mgmt_repo.get_section(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.delete("/sections/{section_id}")
async def delete_section(section_id: str, _claims = Depends(require_role(UserRole.admin))):
    """Delete section by ID (admin only)"""
    if not dept_mgmt_repo.delete_section(section_id):
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}


@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(section_id: str, section: SectionCreate, claims = Depends(require_role(UserRole.admin))):
    """Update a section (admin only)"""
    try:
        from ...repositories.shared_user_repo import shared_user_repo
        admin_user = shared_user_repo.find_by_id(claims.get('sub'))
        admin_college_id = getattr(admin_user, 'college_id', None) if admin_user else None
        existing = dept_mgmt_repo.get_section(section_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Section not found")
        if admin_college_id and getattr(existing, 'college_id', None) and existing.college_id != admin_college_id:
            raise HTTPException(status_code=403, detail="Cannot modify section from another college")
        dept_mgmt_repo.update_section(section_id, name=section.name)
        return dept_mgmt_repo.get_section(section_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Public endpoints for faculty to get available options
@router.get("/public/departments", response_model=List[DepartmentResponse])
async def get_public_departments(claims = Depends(require_role([UserRole.faculty, UserRole.admin]))):
    """Get departments for the user's college (faculty and admin)"""
    # Get user's college_id
    from ...repositories.shared_user_repo import shared_user_repo
    user = shared_user_repo.find_by_id(claims.get('sub'))
    college_id = getattr(user, 'college_id', None) if user else None
    
    return dept_mgmt_repo.get_departments(college_id)


@router.get("/public/years", response_model=List[YearResponse])
async def get_public_years(claims = Depends(require_role([UserRole.faculty, UserRole.admin]))):
    """Get academic years for the user's college (faculty and admin)"""
    # Get user's college_id
    from ...repositories.shared_user_repo import shared_user_repo
    user = shared_user_repo.find_by_id(claims.get('sub'))
    college_id = getattr(user, 'college_id', None) if user else None
    
    return dept_mgmt_repo.get_years(college_id)


@router.get("/public/sections", response_model=List[SectionResponse])
async def get_public_sections(claims = Depends(require_role([UserRole.faculty, UserRole.admin]))):
    """Get sections for the user's college (faculty and admin)"""
    # Get user's college_id
    from ...repositories.shared_user_repo import shared_user_repo
    user = shared_user_repo.find_by_id(claims.get('sub'))
    college_id = getattr(user, 'college_id', None) if user else None
    
    return dept_mgmt_repo.get_sections(college_id)
