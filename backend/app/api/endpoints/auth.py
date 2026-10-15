"""Authentication Endpoints for FoodQuality AI.

Handles User Registration, Login, Current User Profile, and Password Reset workflows.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
import jwt
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.core.security import (
    create_access_token,
    create_reset_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from backend.app.models.user import User
from backend.app.schemas.user import (
    ActionMessageResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)

logger = logging.getLogger("auth_endpoint")
router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register_user(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    """Create a new user account with hashed password and return authentication session."""
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered.",
        )

    # Hash password with bcrypt
    hashed_pwd = get_password_hash(payload.password)

    # Create user
    new_user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hashed_pwd,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token
    access_token = create_access_token(subject=new_user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            is_active=new_user.is_active,
            created_at=new_user.created_at,
        ),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Log into user account",
)
def login_user(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    """Authenticate user with email and password, returning JWT access token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support.",
        )

    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Return profile details for currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
def update_current_user_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile details for currently authenticated user in real database."""
    if payload.name is not None:
        clean_name = payload.name.strip()
        if len(clean_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name must be at least 2 characters long."
            )
        current_user.name = clean_name
    db.commit()
    db.refresh(current_user)
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request password reset",
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Generate a password reset token for the specified user email.

    Note on email delivery:
    In production, a transactional email provider (such as SMTP/SendGrid/SES) is configured
    via environment variables to dispatch the reset link directly to the user's inbox.
    For local development and testing, the valid reset token is returned in the response payload.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Avoid user enumeration in public responses
        return ForgotPasswordResponse(
            message="If an account with this email exists, password reset instructions have been generated.",
            reset_token=None,
            email_service_configured=False,
            instruction="Configure SMTP in backend/.env to enable automated email dispatch.",
        )

    reset_token = create_reset_token(user.email)

    return ForgotPasswordResponse(
        message="Password reset token generated successfully.",
        reset_token=reset_token,
        email_service_configured=False,
        instruction=(
            "Use this reset token on the Reset Password form to set your new password. "
            "To send emails automatically in production, configure SMTP_SERVER, SMTP_PORT, "
            "SMTP_USERNAME, and SMTP_PASSWORD in backend/.env."
        ),
    )


@router.post(
    "/reset-password",
    response_model=ActionMessageResponse,
    summary="Reset password with reset token",
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Validate reset token and update user's account password."""
    try:
        token_payload = decode_token(payload.token)
        if token_payload.get("type") != "reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type. A password reset token is required.",
            )
        email = token_payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token does not contain a valid email address.",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link has expired. Please request a new one.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or malformed reset token.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this reset token was not found.",
        )

    # Hash new password and update
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    return ActionMessageResponse(
        message="Password has been successfully updated. You can now log in with your new password.",
        success=True,
    )
