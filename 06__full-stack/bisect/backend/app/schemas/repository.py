from datetime import datetime
from typing import List
import uuid
from pydantic import BaseModel, ConfigDict


class RepositoryRead(BaseModel):
    """Schema representing repository metadata returned to clients."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    github_repo_id: int
    full_name: str
    default_branch: str
    clone_url: str
    is_private: bool
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RepositoryListResponse(BaseModel):
    """Paginated list response for user repositories."""

    items: List[RepositoryRead]
    total: int
    limit: int
    offset: int


class RepositorySyncResponse(BaseModel):
    """Response returned upon completing repository synchronization."""

    synced_count: int
    repositories: List[RepositoryRead]
