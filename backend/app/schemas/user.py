"""Pydantic Request and Response Schemas for Authentication and User Profile."""

import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    """Payload for user registration."""
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=6, max_length=128, description="Secure user password (min 6 chars)")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        return clean

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserLogin(BaseModel):
    """Payload for user login."""
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    """Public user profile response."""
    id: int
    name: str
    email: str
    is_active: bool
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT Access Token response with user profile."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    """Payload to initiate password reset request."""
    email: EmailStr = Field(..., description="Registered account email")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    """Payload to complete password reset using signed reset token."""
    token: str = Field(..., min_length=10, description="Signed JWT password reset token")
    new_password: str = Field(..., min_length=6, max_length=128, description="New secure password")


class ForgotPasswordResponse(BaseModel):
    """Response returned upon initiating password reset."""
    message: str
    reset_token: Optional[str] = None
    email_service_configured: bool = False
    instruction: str


class ActionMessageResponse(BaseModel):
    """Generic status and action message response."""
    message: str
    success: bool = True


class UserUpdate(BaseModel):
    """Payload for updating user profile."""
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated full name")
