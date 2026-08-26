from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Caption(SQLModel, table=True):
    __tablename__ = "captions"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    video_id: UUID = Field(
        foreign_key="videos.id",
        index=True,
    )

    text: str

    start_ms: int

    end_ms: int

    style: str = "default"
