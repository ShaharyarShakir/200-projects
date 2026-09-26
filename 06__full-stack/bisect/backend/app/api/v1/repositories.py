from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_session
from app.models.user import User
from app.schemas.repository import (
    RepositoryListResponse,
    RepositoryRead,
    RepositorySyncResponse,
)
from app.services.repository import RepositoryService

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.get(
    "",
    summary="List synchronized repositories",
    response_model=RepositoryListResponse,
)
async def list_repositories(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=100, description="Page size limit")] = 20,
    offset: Annotated[int, Query(ge=0, description="Page offset")] = 0,
) -> RepositoryListResponse:
    """Retrieve a paginated list of synchronized repositories belonging to the authenticated user."""
    items, total = await RepositoryService.list_repositories(
        session=session,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )
    return RepositoryListResponse(
        items=[RepositoryRead.model_validate(r) for r in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/sync",
    summary="Sync user repositories from GitHub",
    response_model=RepositorySyncResponse,
)
async def sync_repositories(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RepositorySyncResponse:
    """Fetch accessible repositories from GitHub and synchronize them with the local database.

    Domain errors propagate to the global BisectError handler, which maps each
    error's own status code. The route deliberately does not re-map them, so a
    rate limit surfaces as 429 rather than being flattened into 400.
    """
    synced_repos = await RepositoryService.sync_repositories(
        session=session,
        user=current_user,
    )

    return RepositorySyncResponse(
        synced_count=len(synced_repos),
        repositories=[RepositoryRead.model_validate(r) for r in synced_repos],
    )


@router.get(
    "/{id}",
    summary="Get repository details",
    response_model=RepositoryRead,
)
async def get_repository(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RepositoryRead:
    """Retrieve details for a specific repository owned by the authenticated user."""
    repo = await RepositoryService.get_repository_by_id(
        session=session,
        repo_id=id,
        user_id=current_user.id,
    )
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )
    return RepositoryRead.model_validate(repo)
