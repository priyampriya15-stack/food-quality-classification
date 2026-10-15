"""Authentication and Request Dependencies.

Provides FastAPI dependencies for extracting authenticated users from JWT tokens
and securing sensitive endpoints.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import decode_token
from backend.app.models.user import User

# Optional bearer schema so unauthenticated requests don't automatically trigger 403
security_bearer_required = HTTPBearer(auto_error=True)
security_bearer_optional = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer_required),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that requires a valid JWT Bearer token and returns the authenticated User.

    Raises:
        HTTPException 401: If token is missing, invalid, expired, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials
    try:
        payload = decode_token(token)
        token_type = payload.get("type")
        if token_type != "access":
            raise credentials_exception

        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated.",
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer_optional),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Dependency that returns authenticated User if a valid token is provided, or None."""
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None

        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
    except Exception:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.is_active:
        return user
    return None
