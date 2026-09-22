from pydantic import BaseModel
from app.schemas.user import UserRead


class TokenResponse(BaseModel):
    """Response returned upon successful OAuth authentication."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead
