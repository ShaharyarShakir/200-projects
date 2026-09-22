from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict


class UserRead(BaseModel):
    """Public user profile schema excluding sensitive credentials."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    github_user_id: int
    github_username: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
