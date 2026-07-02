from typing import Optional

from pydantic import BaseModel


class StoryOptionsSchema(BaseModel):
    """Schema for story options."""

    text: str
    node_id: Optional[str] = None


class StoryNodeBase(BaseModel):
    """Base schema for story nodes."""

    content: str
    is_ending: bool = False
    is_winning_ending: bool = False
