from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from ..core.settings import settings
from ..models.user import UserRole


bearer_scheme = HTTPBearer(auto_error=True)


def get_current_claims(credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)]) -> dict:
	try:
		token = credentials.credentials
		claims = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
		return claims
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def require_role(required):
	def _role_guard(claims: Annotated[dict, Depends(get_current_claims)]) -> dict:
		role: Optional[str] = claims.get("role")
		print(f"🔍 Role check: required={required}, actual_role={role}, claims={claims}")
		if isinstance(required, list):
			if role not in required:
				print(f"🔍 Access denied: role {role} not in {required}")
				raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden for this role")
		else:
			if role != required:
				print(f"🔍 Access denied: role {role} != {required}")
				raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden for this role")
		print(f"🔍 Access granted for role {role}")
		return claims

	return _role_guard
