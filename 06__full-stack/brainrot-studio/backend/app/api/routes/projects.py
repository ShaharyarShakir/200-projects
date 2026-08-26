from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from app.services.project import (
    create_project,
    delete_project,
    get_project,
    get_projects,
    update_project,
)


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.post(
    "",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
)
def create(
    data: ProjectCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_project(
        session,
        current_user.id,
        data,
    )


@router.get(
    "",
    response_model=list[ProjectRead],
)
def list_all(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_projects(
        session,
        current_user.id,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectRead,
)
def get(
    project_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.patch(
    "/{project_id}",
    response_model=ProjectRead,
)
def update(
    project_id: UUID,
    data: ProjectUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return update_project(session, project, data)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    project_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    delete_project(session, project)
