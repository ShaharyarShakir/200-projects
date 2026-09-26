"""Owner-scoped HTTP surface for agent sessions and their event feed."""

from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
# Aliased because this module also defines a route handler named get_session,
# which would otherwise shadow the dependency for every handler declared after it.
from app.core.db import get_session as get_db_session
from app.core.errors import InvalidRequestError
from app.models.user import User
from app.schemas.session import (
    AgentSession,
    SessionCreateRequest,
    SessionEventListResponse,
    SessionListResponse,
    SessionRead,
)
from app.services.session import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post(
    "",
    summary="Create an agent session",
    response_model=SessionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    payload: SessionCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SessionRead:
    """Create a session owned by the caller and record its first event.

    The session is persisted before this request returns, so a later request
    reads it back even though no agent loop has run yet. It is created in the
    ``created`` status; the loop's progress sink moves it to ``running`` when
    execution actually begins.

    A ``repository_id`` that belongs to somebody else is reported as an invalid
    field rather than as a 404, because a 404 here would confirm whether the
    repository exists at all.
    """
    if payload.repository_id is not None and not await SessionService.repository_is_owned(
        session, payload.repository_id, current_user.id
    ):
        raise InvalidRequestError(
            "repository_id does not identify a repository you own",
            field="repository_id",
        )

    # The agent session is the authority on its own state, and the sink is the
    # only thing that writes it. Creating through the sink means the row this
    # request returns is byte-for-byte the row an execution path would produce,
    # instead of a second, divergent write path that could drift from it.
    agent_session = AgentSession(id=uuid.uuid4().hex, task_prompt=payload.task_prompt)
    session_sink = SessionService.make_session_sink(
        session,
        owner_id=current_user.id,
        repository_id=payload.repository_id,
    )
    await session_sink(agent_session)

    event_sink = SessionService.make_event_sink(session, agent_session.id)
    await event_sink(
        "session_created",
        {
            "repository_id": str(payload.repository_id) if payload.repository_id else None
        },
    )

    row = await SessionService.require_session(
        session, agent_session.id, current_user.id
    )
    return SessionService.to_read_model(row)


@router.get(
    "",
    summary="List agent sessions",
    response_model=SessionListResponse,
)
async def list_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100, description="Page size limit")] = 20,
    offset: Annotated[int, Query(ge=0, description="Page offset")] = 0,
    status_filter: Annotated[
        str | None,
        Query(alias="status", description="Filter by lifecycle status"),
    ] = None,
    repository_id: Annotated[
        uuid.UUID | None,
        Query(description="Filter to sessions targeting one repository"),
    ] = None,
) -> SessionListResponse:
    """List the caller's sessions, newest first, with optional filters."""
    return await SessionService.load_sessions_read(
        session,
        owner_id=current_user.id,
        limit=limit,
        offset=offset,
        status=status_filter,
        repository_id=repository_id,
    )


@router.get(
    "/{session_id}",
    summary="Get an agent session",
    response_model=SessionRead,
)
async def get_session(
    session_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SessionRead:
    """Read one session the caller owns.

    An id belonging to another user raises the same 404 as an id that does not
    exist, so this endpoint cannot be used to probe for other users' sessions.
    """
    return await SessionService.load_session_read(session, session_id, owner_id=current_user.id)


@router.get(
    "/{session_id}/events",
    summary="List a session's events",
    response_model=SessionEventListResponse,
)
async def list_session_events(
    session_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    after_sequence: Annotated[
        int, Query(ge=0, description="Return only events after this sequence")
    ] = 0,
    limit: Annotated[int, Query(ge=1, le=500, description="Page size limit")] = 100,
) -> SessionEventListResponse:
    """Read a page of a session's chronological event feed.

    Ownership is checked through the session first, so this endpoint is scoped
    exactly like the session it belongs to. A session with no events returns an
    empty collection rather than a 404, because the session exists.
    """
    return await SessionService.load_events_read(
        session,
        session_id=session_id,
        owner_id=current_user.id,
        after_sequence=after_sequence,
        limit=limit,
    )
