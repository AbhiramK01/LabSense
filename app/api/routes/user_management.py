from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from ...models.user import UserRole
from ...schemas.user_management import UserCreate, UserUpdate, UserResponse, UserListResponse
from ...repositories.shared_user_repo import shared_user_repo
from ..deps import require_role

router = APIRouter(prefix="/admin", tags=["admin"])

# Use shared repository


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    claims = Depends(require_role([UserRole.admin, UserRole.super_admin]))
):
    """Create a new user (admin only)"""
    try:
        # Check if username or email already exists
        if shared_user_repo.find_by_username_or_email(user_data.username):
            raise ValueError(f'Username "{user_data.username}" already exists. Please choose a different username.')
        if shared_user_repo.find_by_username_or_email(user_data.email):
            raise ValueError(f'Email "{user_data.email}" already exists. Please choose a different email.')
        
        # Check for roll number uniqueness (only for students) - scoped to college
        if user_data.role == UserRole.student and user_data.roll_number:
            # Get the college_id for the user being created
            user_college_id = user_data.college_id if user_data.college_id else getattr(shared_user_repo.find_by_id(claims.get('sub')), 'college_id', None)
            if shared_user_repo.find_by_roll_number(user_data.roll_number, user_college_id):
                raise ValueError(f'Roll number "{user_data.roll_number}" already exists in this college. Please choose a different roll number.')
        
        # Create new user
        from uuid import uuid4
        from ...core.security import hash_password
        
        user_id = str(uuid4())
        hashed_password = hash_password(user_data.password)
        
        from ...models.user import User
        user = User(
            id=user_id,
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            role=user_data.role,
            college_id=user_data.college_id if user_data.college_id else getattr(shared_user_repo.find_by_id(claims.get('sub')), 'college_id', None),
            department_id=user_data.department_id,
            year=user_data.year,
            section_id=user_data.section_id,
            roll_number=user_data.roll_number
        )
        
        # Add to repository - properly index the user
        shared_user_repo._index_user(user)
        shared_user_repo._save_to_storage()
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            college_id=user.college_id,
            department_id=user.department_id,
            year=user.year,
            section_id=user.section_id,
            roll_number=user.roll_number
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.get("/users", response_model=UserListResponse)
async def list_users(
    role: Optional[UserRole] = None,
    claims = Depends(require_role([UserRole.admin, UserRole.super_admin]))
):
    """List all users with optional role filter (admin only)"""
    try:
        users = list(shared_user_repo._users_by_username.values())
        # Scope by college for normal admin
        if claims.get('role') == UserRole.admin:
            admin_user = shared_user_repo.find_by_id(claims.get('sub'))
            admin_college = getattr(admin_user, 'college_id', None)
            if admin_college:
                users = [u for u in users if getattr(u, 'college_id', None) == admin_college]
        
        if role:
            users = [user for user in users if user.role == role]
        
        user_responses = [
            UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                role=user.role,
                college_id=getattr(user, 'college_id', None),
                department_id=user.department_id,
                year=user.year,
                section_id=user.section_id,
                roll_number=user.roll_number
            )
            for user in users
        ]
        
        return UserListResponse(users=user_responses, total=len(user_responses))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    claims = Depends(require_role([UserRole.admin, UserRole.super_admin]))
):
    """Get user by ID (admin only)"""
    user = shared_user_repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        college_id=getattr(user, 'college_id', None),
        department_id=user.department_id,
        year=user.year,
        section_id=user.section_id,
        roll_number=user.roll_number
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    claims = Depends(require_role([UserRole.admin, UserRole.super_admin]))
):
    """Update user (admin only)"""
    try:
        user = shared_user_repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Local admins cannot edit admin users (including themselves)
        if claims.get('role') == UserRole.admin and user.role == UserRole.admin:
            raise HTTPException(status_code=403, detail="Admins cannot edit admin users")
        
        # Check for username conflicts
        if user_data.username and user_data.username != user.username:
            existing_user = shared_user_repo.find_by_username_or_email(user_data.username)
            if existing_user and existing_user.id != user_id:
                raise ValueError(f'Username "{user_data.username}" already exists. Please choose a different username.')
        
        # Check for email conflicts
        if user_data.email and user_data.email != user.email:
            existing_user = shared_user_repo.find_by_username_or_email(user_data.email)
            if existing_user and existing_user.id != user_id:
                raise ValueError(f'Email "{user_data.email}" already exists. Please choose a different email.')
        
        # Check for roll number conflicts (only for students) - scoped to college
        if user_data.roll_number and user_data.roll_number != user.roll_number:
            existing_user = shared_user_repo.find_by_roll_number(user_data.roll_number, user.college_id)
            if existing_user and existing_user.id != user_id:
                raise ValueError(f'Roll number "{user_data.roll_number}" already exists in this college. Please choose a different roll number.')
        
        # Update fields
        if user_data.username:
            # Remove old username from index
            del shared_user_repo._users_by_username[user.username.lower()]
            user.username = user_data.username
            shared_user_repo._users_by_username[user.username.lower()] = user
        
        if user_data.email:
            # Remove old email from index
            del shared_user_repo._users_by_email[user.email.lower()]
            user.email = user_data.email
            shared_user_repo._users_by_email[user.email.lower()] = user
        
        if user_data.password:
            from ...core.security import hash_password
            user.hashed_password = hash_password(user_data.password)
        
        if user_data.role:
            # Prevent normal admin from elevating to admin/super_admin
            if claims.get('role') == UserRole.admin and user_data.role in [UserRole.admin, UserRole.super_admin]:
                raise ValueError('Insufficient permissions to set role to admin/super_admin')
            user.role = user_data.role
        
        if user_data.department_id is not None:
            user.department_id = user_data.department_id
        
        if user_data.year is not None:
            user.year = user_data.year
        
        if user_data.section_id is not None:
            user.section_id = user_data.section_id
        
        if user_data.roll_number is not None:
            user.roll_number = user_data.roll_number

        if user_data.college_id is not None:
            # Only super_admin can change college
            if claims.get('role') != UserRole.super_admin:
                raise ValueError('Only super admin can change college assignment')
            user.college_id = user_data.college_id
        
        shared_user_repo._save_to_storage()
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            college_id=getattr(user, 'college_id', None),
            department_id=user.department_id,
            year=user.year,
            section_id=user.section_id,
            roll_number=user.roll_number
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    claims = Depends(require_role([UserRole.admin, UserRole.super_admin]))
):
    """Delete user (admin only)"""
    try:
        user = shared_user_repo.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent deleting super admin
        if user.role == UserRole.super_admin:
            raise ValueError("Cannot delete super admin user")
        # Local admins cannot delete admin users
        if claims.get('role') == UserRole.admin and user.role == UserRole.admin:
            raise HTTPException(status_code=403, detail="Admins cannot delete admin users")
        
        # Cascade delete student-related data
        try:
            from ...repositories.registry import submission_repo, session_repo
            # Remove sessions and submissions belonging to this user
            try:
                session_repo.delete_by_user_id(user.id)
            except Exception:
                pass
            try:
                submission_repo.delete_by_student_id(user.id)
            except Exception:
                pass
        except Exception:
            pass

        # Remove from all user indexes
        try:
            if user.username and user.username.lower() in shared_user_repo._users_by_username:
                del shared_user_repo._users_by_username[user.username.lower()]
        except Exception:
            pass
        try:
            if user.email and user.email.lower() in shared_user_repo._users_by_email:
                del shared_user_repo._users_by_email[user.email.lower()]
        except Exception:
            pass
        try:
            if user.roll_number:
                rn = user.roll_number.lower()
                if rn in getattr(shared_user_repo, '_users_by_roll_number', {}):
                    del shared_user_repo._users_by_roll_number[rn]
        except Exception:
            pass
        try:
            if user.id in getattr(shared_user_repo, '_users_by_id', {}):
                del shared_user_repo._users_by_id[user.id]
        except Exception:
            pass

        shared_user_repo._save_to_storage()
        
        return {"message": "User deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@router.get("/users/search/username/{username}", response_model=UserResponse)
async def get_user_by_username(
    username: str,
    _claims = Depends(require_role(UserRole.admin))
):
    """Get user by username (admin only)"""
    user = shared_user_repo.find_by_username_or_email(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role
    )


@router.get("/users/search/email/{email}", response_model=UserResponse)
async def get_user_by_email(
    email: str,
    _claims = Depends(require_role(UserRole.admin))
):
    """Get user by email (admin only)"""
    user = shared_user_repo.find_by_username_or_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role
    )
