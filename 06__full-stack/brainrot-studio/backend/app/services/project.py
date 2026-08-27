from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project(
    session: Session,
    owner_id: UUID,
    data: ProjectCreate,
) -> Project:
    project = Project(
        owner_id=owner_id,
        name=data.name,
        description=data.description,
    )

    session.add(project)
    session.commit()
    session.refresh(project)

    return project


def get_projects(
    session: Session,
    owner_id: UUID,
) -> list[Project]:
    statement = (
        select(Project)
        .where(Project.owner_id == owner_id)
        .order_by(Project.created_at.desc())
    )

    return list(session.exec(statement).all())


def get_project(
    session: Session,
    project_id: UUID,
    owner_id: UUID,
) -> Project | None:
    statement = select(Project).where(
        Project.id == project_id,
        Project.owner_id == owner_id,
    )

    return session.exec(statement).first()


def update_project(
    session: Session,
    project: Project,
    data: ProjectUpdate,
) -> Project:
    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(project, key, value)

    project.updated_at = datetime.now(timezone.utc)

    session.add(project)
    session.commit()
    session.refresh(project)

    return project


def delete_project(
    session: Session,
    project: Project,
) -> None:
    session.delete(project)
    session.commit()
