from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship


class Show(SQLModel, table=True):
    __tablename__ = "shows"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    characters: list["Character"] = Relationship(back_populates="show")


class Character(SQLModel, table=True):
    __tablename__ = "characters"

    id: str = Field(primary_key=True)  # e.g., 'peter', 'rick', 'stewie'
    name: str = Field(index=True)
    show_id: UUID | None = Field(default=None, foreign_key="shows.id")
    image_url: str = Field(default="")
    avatar: str = Field(default="👤")  # Fallback emoji icon
    tier: str = Field(default="FREE")  # FREE, LITE+, PRO

    show: Show | None = Relationship(back_populates="characters")
    assets: list["CharacterAsset"] = Relationship(back_populates="character")


class CharacterAsset(SQLModel, table=True):
    __tablename__ = "character_assets"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    character_id: str = Field(foreign_key="characters.id", index=True)
    asset_type: str = Field(default="portrait")  # portrait, idle, happy, angry, sad
    expression: str = Field(default="default")
    image_url: str = Field(default="")

    character: Character = Relationship(back_populates="assets")
