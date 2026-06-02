from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundException, BadRequestException


async def list_users(db: AsyncSession, page: int = 1, page_size: int = 20) -> tuple[list[User], int]:
    count_result = await db.execute(select(func.count()).select_from(User))
    total = count_result.scalar()

    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return result.scalars().all(), total


async def update_user_role(db: AsyncSession, user_id: int, role: UserRole, current_user: User) -> User:
    if user_id == current_user.id:
        raise BadRequestException("Cannot change your own role")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    user.role = role
    await db.flush()
    return user


async def toggle_user_active(db: AsyncSession, user_id: int, current_user: User) -> User:
    if user_id == current_user.id:
        raise BadRequestException("Cannot deactivate yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    user.is_active = not user.is_active
    await db.flush()
    return user


async def delete_user(db: AsyncSession, user_id: int, current_user: User) -> None:
    if user_id == current_user.id:
        raise BadRequestException("Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    await db.delete(user)
    await db.flush()