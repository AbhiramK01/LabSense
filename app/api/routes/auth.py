from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ...core.security import verify_password, create_access_token
from ...repositories.shared_user_repo import shared_user_repo
from ...schemas.auth import LoginRequest, TokenResponse, UserPublic
from ..deps import get_current_claims

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
	try:
		print(f"🔍 Login attempt for: {payload.username_or_email}")
		user = shared_user_repo.find_by_username_or_email(payload.username_or_email)
		print(f"🔍 User found: {user is not None}")
		if user:
			print(f"🔍 User role: {user.role}")
			print(f"🔍 User ID: {user.id}")
		
		if not user or not verify_password(payload.password, user.hashed_password):
			print(f"🔍 Authentication failed: user={user is not None}, password_match={user and verify_password(payload.password, user.hashed_password)}")
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED, 
				detail="Invalid username/email or password",
				headers={"WWW-Authenticate": "Bearer"}
			)

		token = create_access_token(subject=user.id, data={"username": user.username, "role": user.role})
		print(f"🔍 Token created for user {user.id} with role {user.role}")
		return TokenResponse(access_token=token, role=user.role)
		
	except HTTPException:
		# Re-raise HTTP exceptions as-is
		raise
	except Exception as e:
		# Log unexpected errors
		import logging
		logger = logging.getLogger(__name__)
		logger.error(f"Login error: {str(e)}")
		
		# Return generic error for security
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Login failed. Please try again."
		)


@router.get("/whoami", response_model=UserPublic)
async def whoami(claims = Depends(get_current_claims)) -> UserPublic:
    # enrich with college info if present
    try:
        user = shared_user_repo.find_by_id(claims.get("sub"))
        college_id = getattr(user, 'college_id', None) if user else None
        college_name = None
        if college_id:
            try:
                from ...repositories.colleges import CollegeRepository
                # Access shared instance if exists, otherwise temporary
                college_repo = CollegeRepository()
                college = college_repo.get(college_id)
                if college:
                    college_name = college.get('name')
            except Exception:
                pass
        
        # Get student-specific info if user is a student
        roll_number = None
        department_id = None
        department_name = None
        year = None
        section_id = None
        section_name = None
        
        if user and user.role.value == 'student':
            roll_number = getattr(user, 'roll_number', None)
            department_id = getattr(user, 'department_id', None)
            year = getattr(user, 'year', None)
            section_id = getattr(user, 'section_id', None)
            
            # Resolve department and section names
            if department_id:
                try:
                    from ...repositories.registry import dept_mgmt_repo
                    dept = dept_mgmt_repo.get_department_by_id(department_id)
                    if dept:
                        department_name = dept.name
                except Exception:
                    pass
            
            if section_id:
                try:
                    from ...repositories.registry import dept_mgmt_repo
                    section = dept_mgmt_repo.get_section_by_id(section_id)
                    if section:
                        section_name = section.name
                except Exception:
                    pass
        
        return UserPublic(
            id=claims.get("sub"), 
            username=claims.get("username"), 
            email="hidden@example.com", 
            role=claims.get("role"), 
            college_id=college_id, 
            college_name=college_name,
            roll_number=roll_number,
            department_id=department_id,
            department_name=department_name,
            year=year,
            section_id=section_id,
            section_name=section_name
        )
    except Exception:
        return UserPublic(id=claims.get("sub"), username=claims.get("username"), email="hidden@example.com", role=claims.get("role"))
