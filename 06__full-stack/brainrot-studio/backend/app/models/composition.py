from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Composition(SQLModel, table=True):
    __tablename__ = "compositions"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    video_id: UUID = Field(
        foreign_key="videos.id",
        unique=True,
        index=True,
    )

    width: int = 1080
    height: int = 1920

    fps: int = 30

    duration_ms: int = 0
