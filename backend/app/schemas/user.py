from pydantic import BaseModel
from app.models.user import UserRole
from app.schemas.auth import UserResponse


class RoleUpdateRequest(BaseModel):
    role: UserRole


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int