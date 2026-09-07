from uuid import UUID, uuid4

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/api/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    idea: str


class ProjectResponse(BaseModel):
    id: UUID
    idea: str
    status: str


projects: dict[UUID, ProjectResponse] = {}


@router.post("", response_model=ProjectResponse)
def create_project(request: CreateProjectRequest):
    project = ProjectResponse(
        id=uuid4(),
        idea=request.idea,
        status="idea_submitted",
    )

    projects[project.id] = project

    return project