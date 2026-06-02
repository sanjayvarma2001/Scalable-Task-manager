from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, require_admin
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.user import RoleUpdateRequest, UserListResponse
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="[Admin] List all users",
)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all registered users. Admin only."""
    users, total = await admin_service.list_users(db, page, page_size)
    return UserListResponse(users=users, total=total)


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="[Admin] Change a user's role",
)
async def update_role(
    user_id: int,
    data: RoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Promote or demote a user. Cannot change your own role."""
    return await admin_service.update_user_role(db, user_id, data.role, current_admin)


@router.patch(
    "/users/{user_id}/toggle-active",
    response_model=UserResponse,
    summary="[Admin] Activate or deactivate a user",
)
async def toggle_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Toggle user active status. Deactivated users cannot login."""
    return await admin_service.toggle_user_active(db, user_id, current_admin)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete a user and their data",
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Permanently delete a user and all their tasks."""
    await admin_service.delete_user(db, user_id, current_admin)