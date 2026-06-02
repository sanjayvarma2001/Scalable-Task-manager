from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.task import Task
from app.models.user import User, UserRole
from app.schemas.task import TaskCreate, TaskUpdate
from app.core.exceptions import NotFoundException, ForbiddenException


async def create_task(db: AsyncSession, data: TaskCreate, owner_id: int) -> Task:
    task = Task(**data.model_dump(), owner_id=owner_id)
    db.add(task)
    await db.flush()
    return task


async def get_tasks(
    db: AsyncSession,
    user: User,
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    priority: str | None = None,
) -> tuple[list[Task], int]:
    query = select(Task)

    if user.role != UserRole.ADMIN:
        query = query.where(Task.owner_id == user.id)

    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all(), total


async def get_task_by_id(db: AsyncSession, task_id: int, user: User) -> Task:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise NotFoundException("Task not found")
    if user.role != UserRole.ADMIN and task.owner_id != user.id:
        raise ForbiddenException("You don't own this task")

    return task


async def update_task(db: AsyncSession, task_id: int, data: TaskUpdate, user: User) -> Task:
    task = await get_task_by_id(db, task_id, user)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    await db.flush()
    return task


async def delete_task(db: AsyncSession, task_id: int, user: User) -> None:
    task = await get_task_by_id(db, task_id, user)
    await db.delete(task)
    await db.flush()