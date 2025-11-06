from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import jwt
from passlib.context import CryptContext

from .settings import settings


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
	return password_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return password_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, data: Optional[Dict[str, Any]] = None, expires_minutes: Optional[int] = None) -> str:
	to_encode: Dict[str, Any] = {"sub": subject}
	if data:
		to_encode.update(data)

	expires_delta = timedelta(minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
	exp = datetime.now(timezone.utc) + expires_delta
	to_encode.update({"exp": exp})

	encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
	return encoded_jwt
