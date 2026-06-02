from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, LoginResponse,
    TokenResponse, RefreshRequest, UserResponse
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.

    - **email**: must be unique
    - **password**: min 8 chars, 1 uppercase, 1 digit
    - **full_name**: optional display name
    """
    user = await auth_service.register_user(db, data)
    return user


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login and get JWT tokens",
)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate and receive access + refresh tokens.

    - Access token expires in **15 minutes**
    - Refresh token expires in **7 days**
    """
    user, access_token, refresh_token = await auth_service.login_user(db, data)
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Get a new access token",
)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    Use a valid refresh token to get a new access token without re-login.
    """
    access_token = await auth_service.refresh_access_token(db, data.refresh_token)
    return TokenResponse(access_token=access_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout and revoke refresh token",
)
async def logout(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    Revoke the provided refresh token. The access token will naturally expire.
    """
    await auth_service.revoke_refresh_token(db, data.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.
    Requires a valid Bearer token.
    """
    return current_user