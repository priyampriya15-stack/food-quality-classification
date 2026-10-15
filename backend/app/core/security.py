"""Security, Password Hashing, and JWT Utilities.

Implements secure bcrypt password hashing and PyJWT token generation and verification.
"""

import datetime
from typing import Any, Dict, Optional, Union
import bcrypt
import jwt
from backend.app.core.config import settings


def get_password_hash(password: str) -> str:
    """Hash plain text password with strong bcrypt salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain text password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(
    subject: Union[str, int],
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """Generate signed JWT access token for authenticated session."""
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_reset_token(email: str) -> str:
    """Generate signed JWT password reset token with short expiration."""
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": email.lower().strip(),
        "iat": now,
        "exp": expire,
        "type": "reset",
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a signed JWT token.

    Raises:
        jwt.PyJWTError: If token is expired, invalid, or forged.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
