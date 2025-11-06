from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from .routes import auth, dashboards, exams, student, evaluate, instructor, user_management, department_management, admin
from ..models.user import UserRole
from .deps import require_role
from ..repositories.colleges import CollegeRepository
from ..repositories.shared_user_repo import shared_user_repo

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboards.router, prefix="/dashboards", tags=["dashboards"])
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])
api_router.include_router(student.router, prefix="/student", tags=["student"])
api_router.include_router(evaluate.router, prefix="/evaluate", tags=["evaluate"])
api_router.include_router(instructor.router, prefix="/instructor", tags=["instructor"])
api_router.include_router(user_management.router, tags=["user_management"])
api_router.include_router(department_management.router, prefix="/admin", tags=["department_management"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Super admin college management endpoints
@api_router.get("/colleges", tags=["super_admin"])
async def list_colleges(_claims = Depends(require_role(UserRole.super_admin))):
    repo = CollegeRepository()
    return {"colleges": repo.list()}

class CreateCollegeRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=4, max_length=200)
    code: str = Field(..., min_length=2, max_length=20, pattern=r'^[A-Z0-9_-]+$')
    logo_url: Optional[str] = None
    admin_username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=6, max_length=100)
    
    @validator('admin_password')
    def validate_password(cls, v):
        if not v or not v.strip():
            raise ValueError('Admin password cannot be empty')
        if len(v.strip()) < 6:
            raise ValueError('Admin password must be at least 6 characters long')
        return v.strip()
    
    @validator('admin_username')
    def validate_username(cls, v):
        if not v or not v.strip():
            raise ValueError('Admin username cannot be empty')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Admin username can only contain letters, numbers, underscores, and hyphens')
        return v.strip()
    
    @validator('code')
    def validate_code(cls, v):
        if not v or not v.strip():
            raise ValueError('College code cannot be empty')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('College code can only contain letters, numbers, underscores, and hyphens')
        return v.strip().upper()

@api_router.post("/colleges", tags=["super_admin"])
async def create_college(payload: CreateCollegeRequest, _claims = Depends(require_role(UserRole.super_admin))):
    try:
        # First validate admin credentials before creating college
        if shared_user_repo.find_by_username_or_email(payload.admin_username):
            raise HTTPException(status_code=400, detail=f'Admin username "{payload.admin_username}" already exists. Please choose a different username.')
        if shared_user_repo.find_by_username_or_email(payload.admin_email):
            raise HTTPException(status_code=400, detail=f'Admin email "{payload.admin_email}" already exists. Please choose a different email.')
        
        # Create college with uniqueness checks inside repo
        repo = CollegeRepository()
        cid = repo.create(payload.name, payload.address, payload.code, payload.logo_url or "")
        
        # Create college admin user
        from ..models.user import User, UserRole as UR
        from ..core.security import hash_password
        from uuid import uuid4
        admin_user = User(
            id=str(uuid4()),
            username=payload.admin_username,
            email=payload.admin_email,
            hashed_password=hash_password(payload.admin_password),
            role=UR.admin,
            college_id=cid
        )
        shared_user_repo.add_user(admin_user)
        return {"id": cid, "name": payload.name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create college: {str(e)}")

class UpdateCollegeRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = Field(None, min_length=4, max_length=200)
    code: Optional[str] = Field(None, min_length=2, max_length=20, pattern=r'^[A-Z0-9_-]+$')
    logo_url: Optional[str] = None
    admin_username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    admin_email: Optional[EmailStr] = None
    admin_password: Optional[str] = Field(None, min_length=6, max_length=100)
    
    @validator('admin_password')
    def validate_password(cls, v):
        if v is not None and v.strip():
            if len(v.strip()) < 6:
                raise ValueError('Admin password must be at least 6 characters long')
            return v.strip()
        return v
    
    @validator('admin_username')
    def validate_username(cls, v):
        if v is not None and v.strip():
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('Admin username can only contain letters, numbers, underscores, and hyphens')
            return v.strip()
        return v
    
    @validator('code')
    def validate_code(cls, v):
        if v is not None and v.strip():
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('College code can only contain letters, numbers, underscores, and hyphens')
            return v.strip().upper()
        return v

@api_router.get("/colleges/{college_id}/admin", tags=["super_admin"])
async def get_college_admin(college_id: str, _claims = Depends(require_role(UserRole.super_admin))):
    """Get admin user details for a college"""
    admin_users = [u for u in shared_user_repo._users_by_id.values() if u.college_id == college_id and u.role == UserRole.admin]
    
    if not admin_users:
        print(f"❌ No admin user found for college {college_id}")
        raise HTTPException(status_code=404, detail="No admin user found for this college")
    
    admin_user = admin_users[0]
    print(f"✅ Returning admin user: {admin_user.username} ({admin_user.email})")
    return {
        "id": admin_user.id,
        "username": admin_user.username,
        "email": admin_user.email,
        "role": admin_user.role.value
    }

@api_router.put("/colleges/{college_id}", tags=["super_admin"])
async def update_college(college_id: str, payload: UpdateCollegeRequest, _claims = Depends(require_role(UserRole.super_admin))):
    try:
        repo = CollegeRepository()
        ok = repo.update(college_id, name=payload.name, address=payload.address, code=payload.code, logo_url=payload.logo_url)
        if not ok:
            raise HTTPException(status_code=404, detail="College not found")
        
        # Update admin user if provided
        if payload.admin_username or payload.admin_email or payload.admin_password:
            # Find the admin user for this college
            admin_users = [u for u in shared_user_repo._users_by_id.values() if u.college_id == college_id and u.role == UserRole.admin]
            if not admin_users:
                raise HTTPException(status_code=404, detail="No admin user found for this college")
            
            admin_user = admin_users[0]  # Take the first admin
            
            # Check username/email uniqueness if changing with better error messages
            if payload.admin_username and payload.admin_username != admin_user.username:
                if shared_user_repo.find_by_username_or_email(payload.admin_username):
                    raise HTTPException(status_code=400, detail=f'Admin username "{payload.admin_username}" already exists. Please choose a different username.')
            
            if payload.admin_email and payload.admin_email != admin_user.email:
                if shared_user_repo.find_by_username_or_email(payload.admin_email):
                    raise HTTPException(status_code=400, detail=f'Admin email "{payload.admin_email}" already exists. Please choose a different email.')
            
            # Update admin user fields
            if payload.admin_username:
                # Remove old username from index
                del shared_user_repo._users_by_username[admin_user.username.lower()]
                admin_user.username = payload.admin_username
                shared_user_repo._users_by_username[admin_user.username.lower()] = admin_user
            
            if payload.admin_email:
                # Remove old email from index
                del shared_user_repo._users_by_email[admin_user.email.lower()]
                admin_user.email = payload.admin_email
                shared_user_repo._users_by_email[admin_user.email.lower()] = admin_user
            
            if payload.admin_password:
                from ..core.security import hash_password
                admin_user.hashed_password = hash_password(payload.admin_password)
            
            shared_user_repo._save_to_storage()
        
        # Return updated record
        updated = repo.get(college_id)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update college: {str(e)}")

@api_router.post("/colleges/{college_id}/assign-admin", tags=["super_admin"])
async def assign_admin(college_id: str, user_id: str, _claims = Depends(require_role(UserRole.super_admin))):
    user = shared_user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Only allow assigning admins
    if user.role != UserRole.admin:
        raise HTTPException(status_code=400, detail="User must have admin role")
    user.college_id = college_id
    shared_user_repo._save_to_storage()
    return {"message": "assigned"}

@api_router.delete("/colleges/{college_id}", tags=["super_admin"])
async def delete_college(college_id: str, _claims = Depends(require_role(UserRole.super_admin))):
    # Cascade delete: users, exams, sessions, submissions, dept/sections/years belonging to college
    from ..repositories.registry import exam_repo, submission_repo, session_repo, dept_mgmt_repo
    # Delete users of this college (including local admins)
    users = list(shared_user_repo._users_by_username.values())
    to_delete = [u for u in users if getattr(u, 'college_id', None) == college_id]
    for u in to_delete:
        # prevent deleting super admin
        if u.role == UserRole.super_admin:
            continue
        try:
            del shared_user_repo._users_by_username[u.username.lower()]
            del shared_user_repo._users_by_email[u.email.lower()]
        except Exception:
            pass
    shared_user_repo._save_to_storage()
    # Delete exams of this college
    exam_ids = [eid for eid, ex in exam_repo._exams.items() if getattr(ex, 'college_id', None) == college_id]
    for eid in exam_ids:
        try:
            session_repo.delete_by_exam_id(eid)
        except Exception:
            pass
        try:
            submission_repo.delete_by_exam_id(eid)
        except Exception:
            pass
        try:
            if eid in exam_repo._exams:
                del exam_repo._exams[eid]
            if eid in exam_repo._exam_faculty:
                del exam_repo._exam_faculty[eid]
        except Exception:
            pass
    exam_repo._save_to_storage()
    # Clear dept/year/section scoped to college if modeled; here we clear all (simple)
    try:
        dept_mgmt_repo._departments.clear()
        dept_mgmt_repo._years.clear()
        dept_mgmt_repo._sections.clear()
        dept_mgmt_repo._save_to_storage()
    except Exception:
        pass
    # Remove college record
    repo = CollegeRepository()
    ok = repo.delete(college_id)
    if not ok:
        raise HTTPException(status_code=404, detail="College not found")
    return {"message": "college deleted"}
