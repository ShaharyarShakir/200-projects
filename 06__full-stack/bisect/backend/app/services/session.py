"""Persistence and owner-scoped access for agent sessions and their event feed.

This module is the only place that converts between the two session
representations that exist in the codebase:

* ``app.schemas.session.AgentSession`` -- the in-memory lifecycle model that
  owns the validated state machine, used by the agent loop.
* ``app.models.agent_session.AgentSessionRow`` -- the durable table row.

Keeping the conversion in one service means the redaction applied on the way
out cannot be forgotten on one read path and remembered on another: every
response the API returns is built by :meth:`SessionService.to_read_model` or
:meth:`SessionService.event_to_read_model`.
"""

from typing import Any, Dict, List, Optional, Tuple
import uuid

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.errors import NotFoundError
from app.core.logging import sanitize_log_data
from app.models.agent_session import AgentSessionRow, AgentSessionStatus
from app.models.agent_session_bisect_commit import AgentSessionBisectCommitRow
from app.models.agent_session_event import AgentSessionEventRow, SessionEventCategory
from app.models.agent_session_patch import AgentSessionPatchRow
from app.models.repository import Repository
from app.models.user import utc_now
from app.schemas.actions import ActionResult, BisectActionResult, BisectCommit, LoopStep, PatchActionResult
from app.schemas.session import (
    AgentSession,
    BisectCommitRead,
    SessionEventListResponse,
    SessionEventRead,
    SessionListResponse,
    SessionPatchRead,
    SessionRead,
    SessionTimelineRead,
)

# Maps an agent loop ``event_type`` onto the category the UI groups it under.
#
# The category is always derived here rather than supplied by the call site, so
# a client cannot mislabel a recorded event and the frontend can branch on a
# value from a closed set. Level stays a separate field because the two answer
# different questions: ``warning`` on ``max_iterations_reached`` says the event
# was not escalated in the log, while ``warning`` as its category says the
# session ended on a bound rather than on a fault.
#
# A type not listed here falls back to ``system`` so an unrecognized event is
# still visible in the feed instead of being dropped.
_EVENT_TYPE_TO_CATEGORY: Dict[str, str] = {
    # Lifecycle of the loop itself.
    "session_created": SessionEventCategory.SYSTEM,
    "loop_started": SessionEventCategory.SYSTEM,
    "sandbox_cleanup_success": SessionEventCategory.SYSTEM,
    # What the agent itself is doing.
    "iteration_started": SessionEventCategory.AGENT,
    "llm_completion_received": SessionEventCategory.AGENT,
    # Actions dispatched into the sandbox.
    "action_dispatched": SessionEventCategory.EXECUTION,
    "action_executed": SessionEventCategory.EXECUTION,
    # Reviewable artifacts the agent produced.
    "patch_generated": SessionEventCategory.EXECUTION,
    "bisect_verdict": SessionEventCategory.EXECUTION,
    "bisect_completed": SessionEventCategory.EXECUTION,
    # The agent produced something the validator rejected.
    "action_parse_error": SessionEventCategory.VALIDATION,
    "action_validation_error": SessionEventCategory.VALIDATION,
    # The task succeeded.
    "loop_completed": SessionEventCategory.SUCCESS,
    # The session stopped on a bound rather than on a fault.
    "max_iterations_reached": SessionEventCategory.WARNING,
    "max_commands_exceeded": SessionEventCategory.WARNING,
    "sandbox_cleanup_error": SessionEventCategory.WARNING,
    # Unrecoverable failures.
    "loop_timeout": SessionEventCategory.ERROR,
    "provider_failure": SessionEventCategory.ERROR,
    "unhandled_loop_exception": SessionEventCategory.ERROR,
    "session_terminal": SessionEventCategory.ERROR,
    # An artifact the agent asked for could not be produced. The run continues.
    "patch_generation_failed": SessionEventCategory.ERROR,
    "bisect_failed": SessionEventCategory.ERROR,
}

# Terminal statuses, used to decide when a session has finished and to describe
# it in the terminal event summary.
_TERMINAL_STATUSES = frozenset(
    {
        AgentSessionStatus.COMPLETED,
        AgentSessionStatus.FAILED,
        AgentSessionStatus.TERMINATED,
        AgentSessionStatus.TIMED_OUT,
    }
)


def categorize_event(event_type: str) -> str:
    """Derive an event's category from what happened.

    Pure and total: any string maps to a valid category, so recording an event
    can never fail because of an unrecognized type.
    """
    return _EVENT_TYPE_TO_CATEGORY.get(event_type, SessionEventCategory.SYSTEM)


def _short(value: Any, limit: int = 200) -> str:
    """Render a value for a human-readable summary, bounded in length.

    Summaries are built from known scalar fields rather than from free-form
    provider text, and truncated here as a second line of defence so a long
    command or path cannot bloat every event row.
    """
    text = str(value)
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def _describe_action(action: Optional[Dict[str, Any]]) -> str:
    """Name the action an execution event refers to, without echoing its output."""
    if not isinstance(action, dict):
        return "action"
    name = action.get("action")
    if name == "run_command":
        return f"ran command: {_short(action.get('command', ''))}"
    if name == "inspect_file":
        return f"inspected file: {_short(action.get('path', ''))}"
    if name == "generate_patch":
        return "generated a patch"
    if name == "run_bisect":
        return f"bisected {_short(action.get('good', ''))}..{_short(action.get('bad', ''))}"
    if name == "finish":
        return "finished the task"
    return f"performed {name}" if name else "performed an action"


class SessionService:
    """Owner-scoped persistence and reads for agent sessions and their events."""

    # ------------------------------------------------------------------
    # Redaction boundary
    # ------------------------------------------------------------------

    @staticmethod
    def to_read_model(row: AgentSessionRow) -> SessionRead:
        """Project a session row into its API representation, redacting secrets.

        The single place sessions are turned into responses. Redaction is applied
        to the full step content rather than to fields explicitly labelled
        sensitive, because a credential most often arrives embedded in command
        output or inspected file content.
        """
        sanitized_steps = sanitize_log_data(row.steps or [])
        return SessionRead(
            id=row.id,
            owner_id=row.owner_id,
            repository_id=row.repository_id,
            # The prompt is user-authored and echoed in the UI, but sanitize it
            # anyway: a user can paste a token into a prompt.
            task_prompt=sanitize_log_data(row.task_prompt),
            status=row.status,
            iteration_count=row.iteration_count,
            executed_action_count=row.executed_action_count,
            created_at=row.created_at,
            started_at=row.started_at,
            completed_at=row.completed_at,
            termination_reason=(
                sanitize_log_data(row.termination_reason)
                if row.termination_reason
                else None
            ),
            prompt_tokens=row.prompt_tokens,
            completion_tokens=row.completion_tokens,
            total_tokens=row.total_tokens,
            steps=[LoopStep.model_validate(step) for step in sanitized_steps],
        )

    @staticmethod
    def event_to_read_model(row: AgentSessionEventRow) -> SessionEventRead:
        """Project an event row into its API representation, redacting secrets."""
        return SessionEventRead(
            id=row.id,
            session_id=row.session_id,
            sequence=row.sequence,
            category=row.category,
            event_type=row.event_type,
            level=row.level,
            summary=sanitize_log_data(row.summary),
            payload=sanitize_log_data(row.payload) if row.payload else None,
            created_at=row.created_at,
        )

    # ------------------------------------------------------------------
    # Writes
    # ------------------------------------------------------------------

    @classmethod
    async def create_session(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        task_prompt: str,
        repository_id: Optional[uuid.UUID] = None,
    ) -> AgentSessionRow:
        """Insert a new session owned by ``owner_id`` in ``created`` status."""
        row = AgentSessionRow(
            id=uuid.uuid4().hex,
            owner_id=owner_id,
            repository_id=repository_id,
            task_prompt=task_prompt,
            status=AgentSessionStatus.CREATED,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return row

    @classmethod
    async def persist_session(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        agent_session: AgentSession,
        repository_id: Optional[uuid.UUID] = None,
    ) -> AgentSessionRow:
        """Write the current state of an in-memory session to its durable row.

        This is the target of the agent loop's progress callback, so it runs
        while the session is still executing. Status, counters, timestamps, token
        accounting, and steps are all written in one statement: holding the steps
        in the session row rather than in a child table is what makes that
        possible, and it means a reader can never observe a status that disagrees
        with the step list it belongs to.

        The steps list is replaced wholesale rather than merged, because the
        in-memory session is the authority on what it has recorded.
        """
        row = await cls._get_row_for_update(session, agent_session.id)
        if row is None:
            row = AgentSessionRow(
                id=agent_session.id,
                owner_id=owner_id,
                repository_id=repository_id,
                task_prompt=agent_session.task_prompt,
            )
            session.add(row)

        row.status = agent_session.status.value
        row.iteration_count = agent_session.iteration_count
        row.executed_action_count = agent_session.executed_action_count
        row.started_at = agent_session.started_at
        row.completed_at = agent_session.completed_at
        row.termination_reason = agent_session.termination_reason
        row.prompt_tokens = agent_session.prompt_tokens
        row.completion_tokens = agent_session.completion_tokens
        row.total_tokens = agent_session.total_tokens
        row.steps = [step.model_dump(mode="json") for step in agent_session.steps]

        await session.commit()

        if agent_session.is_terminal:
            await cls.record_event(
                session=session,
                session_id=agent_session.id,
                event_type="session_terminal",
                level="info",
                summary=(
                    f"Session {agent_session.status.value}"
                    + (
                        f": {_short(agent_session.termination_reason)}"
                        if agent_session.termination_reason
                        else ""
                    )
                ),
                payload={
                    "status": agent_session.status.value,
                    "termination_reason": agent_session.termination_reason,
                    "iteration_count": agent_session.iteration_count,
                    "executed_action_count": agent_session.executed_action_count,
                    "total_tokens": agent_session.total_tokens,
                },
                # The session's own reason already carries this outcome; a
                # repeated terminal event on every later persist would make the
                # feed lie about how many times it ended.
                only_if_absent=True,
            )

        return row

    @classmethod
    async def record_event(
        cls,
        session: AsyncSession,
        session_id: str,
        event_type: str,
        level: str = "info",
        summary: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        only_if_absent: bool = False,
    ) -> Optional[AgentSessionEventRow]:
        """Append one event to a session's feed and return the stored row.

        The category is derived from ``event_type`` rather than accepted as an
        argument, so no caller can label an event with a category that does not
        match what occurred. ``summary`` is a human-readable line; the machine
        readable fields are ``category``, ``level``, and ``sequence``.
        """
        if only_if_absent and await cls._event_type_exists(session, session_id, event_type):
            return None

        next_sequence = await cls._next_sequence(session, session_id)
        row = AgentSessionEventRow(
            session_id=session_id,
            sequence=next_sequence,
            category=categorize_event(event_type),
            event_type=event_type,
            level=level,
            summary=summary or event_type,
            payload=payload,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return row

    @classmethod
    async def record_loop_event(
        cls,
        session: AsyncSession,
        session_id: str,
        event_type: str,
        details: Optional[Dict[str, Any]] = None,
        level: str = "info",
    ) -> Optional[AgentSessionEventRow]:
        """Record an event originating from an agent loop ``log_agent_event`` call.

        Sits beside ``log_agent_event`` so the same occurrence feeds both the log
        and the feed. Returns ``None`` when the session is not persisted, because
        a loop running without a session store must not fail on its way to the
        log.
        """
        details = details or {}
        return await cls.record_event(
            session=session,
            session_id=session_id,
            event_type=event_type,
            level=level,
            summary=cls._summarize(event_type, details),
            payload=details,
        )

    @staticmethod
    def _summarize(event_type: str, details: Dict[str, Any]) -> str:
        """Build a short human-readable line from known-safe fields.

        Only enumerated scalars are interpolated. Raw provider responses, stack
        traces, and command output stay in the redacted payload and never reach
        the summary.
        """
        if event_type in ("action_dispatched", "action_executed"):
            return _describe_action(details.get("action"))
        if event_type in ("loop_started", "session_created"):
            if event_type == "session_created":
                return "Session created"
            return f"Agent loop started for: {_short(details.get('task_prompt', ''))}"
        if event_type == "iteration_started":
            iteration = details.get("iteration")
            return f"Started iteration {iteration}" if iteration is not None else "Started iteration"
        if event_type == "llm_completion_received":
            return "Received a completion from the agent provider"
        if event_type in ("action_parse_error", "action_validation_error"):
            reason = details.get("error") or details.get("message") or "rejected by the validator"
            return f"Agent action rejected: {_short(reason)}"
        if event_type == "loop_completed":
            message = details.get("final_message")
            return f"Agent loop completed: {_short(message)}" if message else "Agent loop completed"
        if event_type in ("max_iterations_reached", "max_commands_exceeded"):
            return f"Agent loop stopped: {event_type.replace('_', ' ')}"
        if event_type == "loop_timeout":
            return "Agent loop exceeded its maximum duration"
        if event_type == "provider_failure":
            provider = details.get("provider")
            return f"Agent provider call failed{f' for {provider}' if provider else ''}"
        if event_type == "unhandled_loop_exception":
            return "Agent loop ended with an unhandled exception"
        if event_type == "sandbox_cleanup_success":
            return "Sandbox cleaned up"
        if event_type == "sandbox_cleanup_error":
            return "Sandbox cleanup reported an error"
        if event_type == "patch_generated":
            if details.get("is_empty"):
                return "Collected an empty patch; the working tree was unmodified"
            return f"Collected a patch of {details.get('diff_bytes', 0)} bytes"
        if event_type == "patch_generation_failed":
            reason = details.get("error") or "the diff could not be collected"
            return f"Patch generation failed: {_short(reason)}"
        if event_type == "bisect_verdict":
            short_sha = _short(details.get("short_sha") or details.get("sha") or "unknown", 12)
            if details.get("is_culprit"):
                return f"Bisect marked {short_sha} as the first bad commit"
            return f"Bisect tested {short_sha} as {details.get('verdict', 'unknown')}"
        if event_type == "bisect_completed":
            culprit = details.get("culprit")
            if culprit:
                return f"Bisect isolated a culprit after {details.get('commits_evaluated', 0)} evaluations"
            if details.get("truncated"):
                return f"Bisect stopped at its commit budget after {details.get('commits_evaluated', 0)} evaluations"
            return f"Bisect evaluated {details.get('commits_evaluated', 0)} commits without isolating a culprit"
        if event_type == "bisect_failed":
            reason = details.get("error") or "the bisect could not run"
            return f"Bisect failed: {_short(reason)}"
        return event_type.replace("_", " ")

    # ------------------------------------------------------------------
    # Owner-scoped reads
    # ------------------------------------------------------------------

    @classmethod
    async def _get_row_for_update(
        cls, session: AsyncSession, session_id: str
    ) -> Optional[AgentSessionRow]:
        """Fetch a session row by id with no owner filter, for internal writes."""
        stmt = select(AgentSessionRow).where(AgentSessionRow.id == session_id)
        res = await session.execute(stmt)
        return res.scalars().first()

    @classmethod
    async def get_session(
        cls,
        session: AsyncSession,
        session_id: str,
        owner_id: uuid.UUID,
    ) -> Optional[AgentSessionRow]:
        """Fetch one session scoped to its owner.

        Returns ``None`` both when the session does not exist and when it belongs
        to somebody else, so the caller cannot tell the two apart.
        """
        stmt = select(AgentSessionRow).where(
            AgentSessionRow.id == session_id,
            AgentSessionRow.owner_id == owner_id,
        )
        res = await session.execute(stmt)
        return res.scalars().first()

    @classmethod
    async def require_session(
        cls,
        session: AsyncSession,
        session_id: str,
        owner_id: uuid.UUID,
    ) -> AgentSessionRow:
        """Fetch one session or raise a 404 that does not disclose ownership."""
        row = await cls.get_session(session, session_id, owner_id)
        if row is None:
            raise NotFoundError(
                "Session not found",
                resource="agent_session",
                resource_id=session_id,
            )
        return row

    @classmethod
    async def list_sessions(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None,
        repository_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[AgentSessionRow], int]:
        """List the caller's sessions with optional filters and pagination.

        Returns the page and the total count of *matching* rows, so a client can
        tell whether more pages exist. The total honours the same filters as the
        page; reporting an unfiltered count would make filtered pagination
        impossible to reason about.
        """
        conditions = [AgentSessionRow.owner_id == owner_id]
        if status is not None:
            conditions.append(AgentSessionRow.status == status)
        if repository_id is not None:
            conditions.append(AgentSessionRow.repository_id == repository_id)

        count_stmt = select(func.count(AgentSessionRow.id)).where(*conditions)
        total = (await session.execute(count_stmt)).scalar() or 0

        stmt = (
            select(AgentSessionRow)
            .where(*conditions)
            .order_by(AgentSessionRow.created_at.desc(), AgentSessionRow.id.desc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await session.execute(stmt)).scalars().all())
        return items, total

    # ------------------------------------------------------------------
    # Event feed
    # ------------------------------------------------------------------

    @classmethod
    async def _next_sequence(cls, session: AsyncSession, session_id: str) -> int:
        """Return the next per-session sequence number.

        Derived from the current maximum rather than held in a counter row, so a
        lost or rolled back write cannot leave the counter ahead of the events
        that actually exist.
        """
        stmt = select(func.max(AgentSessionEventRow.sequence)).where(
            AgentSessionEventRow.session_id == session_id
        )
        current = (await session.execute(stmt)).scalar()
        return (current or 0) + 1

    @classmethod
    async def _event_type_exists(
        cls, session: AsyncSession, session_id: str, event_type: str
    ) -> bool:
        """Check whether an event of this type is already recorded for a session."""
        stmt = (
            select(func.count(AgentSessionEventRow.id))
            .where(
                AgentSessionEventRow.session_id == session_id,
                AgentSessionEventRow.event_type == event_type,
            )
        )
        return bool((await session.execute(stmt)).scalar() or 0)

    @classmethod
    async def list_events(
        cls,
        session: AsyncSession,
        session_id: str,
        after_sequence: int = 0,
        limit: int = 100,
    ) -> SessionEventListResponse:
        """Read a page of a session's feed in ascending sequence order.

        ``after_sequence`` is exclusive, which is what lets a polling client ask
        only for what it has not seen. Ordering is by sequence rather than by
        timestamp because two events recorded in the same clock tick would
        otherwise come back in an arbitrary order.
        """
        conditions = [
            AgentSessionEventRow.session_id == session_id,
            AgentSessionEventRow.sequence > after_sequence,
        ]

        count_stmt = select(func.count(AgentSessionEventRow.id)).where(*conditions)
        total = (await session.execute(count_stmt)).scalar() or 0

        stmt = (
            select(AgentSessionEventRow)
            .where(*conditions)
            .order_by(AgentSessionEventRow.sequence.asc())
            .limit(limit)
        )
        rows = list((await session.execute(stmt)).scalars().all())

        return SessionEventListResponse(
            items=[cls.event_to_read_model(row) for row in rows],
            total=total,
            limit=limit,
            after_sequence=after_sequence,
            last_sequence=rows[-1].sequence if rows else None,
        )

    # ------------------------------------------------------------------
    # Repository ownership
    # ------------------------------------------------------------------

    @classmethod
    async def repository_is_owned(
        cls,
        session: AsyncSession,
        repository_id: uuid.UUID,
        owner_id: uuid.UUID,
    ) -> bool:
        """Report whether a repository exists and belongs to the given owner."""
        stmt = (
            select(func.count(Repository.id))
            .where(Repository.id == repository_id, Repository.owner_id == owner_id)
        )
        return bool((await session.execute(stmt)).scalar() or 0)

    # ------------------------------------------------------------------
    # Response assembly
    # ------------------------------------------------------------------

    @classmethod
    def to_list_response(
        cls,
        rows: List[AgentSessionRow],
        total: int,
        limit: int,
        offset: int,
    ) -> SessionListResponse:
        """Assemble a paginated session listing response."""
        return SessionListResponse(
            items=[cls.to_read_model(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    @classmethod
    async def load_session_read(
        cls,
        session: AsyncSession,
        session_id: str,
        owner_id: uuid.UUID,
    ) -> SessionRead:
        """Fetch a session and project it, raising 404 when it is not the caller's."""
        return cls.to_read_model(await cls.require_session(session, session_id, owner_id))

    @classmethod
    async def load_sessions_read(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None,
        repository_id: Optional[uuid.UUID] = None,
    ) -> SessionListResponse:
        """Fetch a page of the caller's sessions and project it."""
        rows, total = await cls.list_sessions(
            session,
            owner_id=owner_id,
            limit=limit,
            offset=offset,
            status=status,
            repository_id=repository_id,
        )
        return cls.to_list_response(rows, total=total, limit=limit, offset=offset)

    @classmethod
    async def load_events_read(
        cls,
        session: AsyncSession,
        session_id: str,
        owner_id: uuid.UUID,
        after_sequence: int = 0,
        limit: int = 100,
    ) -> SessionEventListResponse:
        """Read a session's feed, enforcing the same ownership check as the session."""
        await cls.require_session(session, session_id, owner_id)
        return await cls.list_events(
            session,
            session_id=session_id,
            after_sequence=after_sequence,
            limit=limit,
        )

    @classmethod
    async def list_events_for_owner(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        session_id: Optional[str] = None,
        limit: int = 100,
    ) -> SessionEventListResponse:
        """Read the caller's newest events across every session they own.

        Ordering is by wall clock rather than by sequence, because sequence is a
        per-session counter: two events from different sessions can share one, so
        it cannot order a combined feed. The page is the newest ``limit`` events
        returned in ascending order, which is the order a feed displays them in.
        Selecting newest-first and reversing avoids paging in from the oldest
        event in the account's history.

        ``last_sequence`` is reported as null: there is no single per-session
        cursor for a combined feed, and returning a number that cannot be
        meaningfully resumed from would invite a client to trust it.
        """
        conditions = [AgentSessionRow.owner_id == owner_id]
        if session_id is not None:
            conditions.append(AgentSessionEventRow.session_id == session_id)

        joined = AgentSessionEventRow.__table__.join(
            AgentSessionRow.__table__,
            AgentSessionRow.id == AgentSessionEventRow.session_id,
        )

        count_stmt = select(func.count(AgentSessionEventRow.id)).select_from(joined).where(
            *conditions
        )
        total = (await session.execute(count_stmt)).scalar() or 0

        stmt = (
            select(AgentSessionEventRow)
            .select_from(joined)
            .where(*conditions)
            .order_by(
                AgentSessionEventRow.created_at.desc(),
                AgentSessionEventRow.session_id.desc(),
                AgentSessionEventRow.sequence.desc(),
            )
            .limit(limit)
        )
        rows = list((await session.execute(stmt)).scalars().all())
        rows.reverse()

        return SessionEventListResponse(
            items=[cls.event_to_read_model(row) for row in rows],
            total=total,
            limit=limit,
            after_sequence=0,
            last_sequence=None,
        )

    @classmethod
    async def load_events_for_owner_read(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        session_id: Optional[str] = None,
        limit: int = 100,
        after_sequence: int = 0,
    ) -> SessionEventListResponse:
        """Read events across the caller's sessions, or within one of them.

        Naming a session delegates to the single-session read so that view keeps
        its exact existing behaviour, including the ``after_sequence`` cursor
        that a polling client resumes from. Only the unnamed case takes the
        combined path, where that cursor does not apply.
        """
        if session_id is not None:
            return await cls.load_events_read(
                session,
                session_id=session_id,
                owner_id=owner_id,
                after_sequence=after_sequence,
                limit=limit,
            )
        return await cls.list_events_for_owner(
            session,
            owner_id=owner_id,
            limit=limit,
        )

    # ------------------------------------------------------------------
    # Session artifacts
    # ------------------------------------------------------------------

    @classmethod
    async def record_patch(
        cls,
        session: AsyncSession,
        session_id: str,
        diff: str,
        is_empty: bool,
    ) -> None:
        """Store a session's unified diff, replacing any patch it already had.

        A session has at most one patch, so a second request overwrites rather
        than accumulating. Redaction is deliberately not applied here: it happens
        on read, which means the stored value stays a faithful record of what the
        sandbox produced and every read path is redacted by construction.
        """
        row = (
            (
                await session.execute(
                    select(AgentSessionPatchRow).where(
                        AgentSessionPatchRow.session_id == session_id
                    )
                )
            )
            .scalars()
            .first()
        )
        if row is None:
            session.add(
                AgentSessionPatchRow(session_id=session_id, diff=diff, is_empty=is_empty)
            )
        else:
            row.diff = diff
            row.is_empty = is_empty
            row.updated_at = utc_now()
        await session.flush()

    @classmethod
    async def record_bisect_timeline(
        cls,
        session: AsyncSession,
        session_id: str,
        commits: List[BisectCommit],
    ) -> None:
        """Store a session's bisect timeline, replacing any timeline it had.

        Evaluation order is assigned here, by position in the list the search
        produced. No caller-supplied ordering is accepted, and the unique
        constraint on ``(session_id, evaluation_index)`` means two rows cannot
        claim the same slot.

        A second bisect in the same session replaces the first because the read
        model reports a single culprit; the earlier run's verdicts are not lost,
        they remain in the session's event feed.
        """
        existing = list(
            (
                await session.execute(
                    select(AgentSessionBisectCommitRow).where(
                        AgentSessionBisectCommitRow.session_id == session_id
                    )
                )
            )
            .scalars()
            .all()
        )
        for row in existing:
            await session.delete(row)
        # Flushed before the replacements are added: a new timeline reuses the
        # same evaluation indexes, and the uniqueness constraint would reject
        # them while the deletes are still pending.
        await session.flush()

        for evaluation_index, commit in enumerate(commits):
            session.add(
                AgentSessionBisectCommitRow(
                    session_id=session_id,
                    evaluation_index=evaluation_index,
                    sha=commit.sha,
                    short_sha=commit.short_sha,
                    author=commit.author,
                    authored_at=commit.authored_at,
                    message=commit.message,
                    verdict=commit.verdict,
                    is_culprit=commit.is_culprit,
                    exit_code=commit.exit_code,
                    test_output=commit.test_output,
                    duration_seconds=commit.duration_seconds,
                    timed_out=commit.timed_out,
                )
            )
        await session.flush()

    @classmethod
    def patch_to_read_model(
        cls, session_id: str, row: Optional[AgentSessionPatchRow]
    ) -> SessionPatchRead:
        """Project a stored patch into its API shape, redacting secrets.

        A session with no patch reads as ``exists=False`` with an empty diff
        rather than a 404, so a panel can tell "nothing was produced" from
        "nothing was asked for yet" without treating either as an error.
        """
        if row is None:
            return SessionPatchRead(session_id=session_id, exists=False, diff="", is_empty=True)
        return SessionPatchRead(
            session_id=session_id,
            exists=True,
            # A diff can carry a credential in an added line exactly as readily
            # as command output can, so it goes through the same projection.
            diff=sanitize_log_data(row.diff),
            is_empty=row.is_empty,
        )

    @classmethod
    def timeline_to_read_model(
        cls, session_id: str, rows: List[AgentSessionBisectCommitRow]
    ) -> SessionTimelineRead:
        """Project stored timeline rows into their API shape, redacting secrets.

        Rows are returned in evaluation order. ``culprit`` is mapped to its own
        outcome so the commit the search proved is distinguishable on the wire
        from one that merely tested bad.
        """
        commits = [
            BisectCommitRead(
                hash=row.sha,
                short_hash=row.short_sha,
                message=sanitize_log_data(row.message),
                author=sanitize_log_data(row.author),
                timestamp=row.authored_at,
                outcome="culprit" if row.is_culprit else row.verdict,
                test_output=sanitize_log_data(row.test_output) if row.test_output else None,
                duration_seconds=row.duration_seconds,
            )
            for row in rows
        ]
        culprit = next((row.sha for row in rows if row.is_culprit), None)
        return SessionTimelineRead(
            session_id=session_id,
            exists=bool(rows),
            commits=commits,
            culprit_hash=culprit,
        )

    @classmethod
    async def load_patch_read(
        cls,
        session: AsyncSession,
        session_id: str,
        owner_id: uuid.UUID,
    ) -> SessionPatchRead:
        """Read a session's patch, enforcing the same ownership check as the session.

        An unowned or absent session raises the same not-found error as the
        session read, so this endpoint cannot be used to probe for the existence
        of another user's session.
        """
        await cls.require_session(session, session_id, owner_id)
        row = (
            (
                await session.execute(
                    select(AgentSessionPatchRow).where(
                        AgentSessionPatchRow.session_id == session_id
                    )
                )
            )
            .scalars()
            .first()
        )
        return cls.patch_to_read_model(session_id, row)

    @classmethod
    async def load_timeline_read(
        cls,
        session: AsyncSession,
        session_id: str,
        owner_id: uuid.UUID,
    ) -> SessionTimelineRead:
        """Read a session's bisect timeline in evaluation order, owner-scoped."""
        await cls.require_session(session, session_id, owner_id)
        rows = list(
            (
                await session.execute(
                    select(AgentSessionBisectCommitRow)
                    .where(AgentSessionBisectCommitRow.session_id == session_id)
                    .order_by(AgentSessionBisectCommitRow.evaluation_index.asc())
                )
            )
            .scalars()
            .all()
        )
        return cls.timeline_to_read_model(session_id, rows)

    # ------------------------------------------------------------------
    # Agent loop sinks
    # ------------------------------------------------------------------

    @classmethod
    def make_session_sink(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        repository_id: Optional[uuid.UUID] = None,
    ):
        """Build the callback the agent loop uses to persist its progress.

        The returned callable matches the loop's ``SessionSink`` signature. It
        writes the session's whole current state in one statement, so a reader
        polling mid-run sees a status that agrees with the steps recorded so far.
        """

        async def sink(agent_session: AgentSession) -> None:
            await cls.persist_session(
                session,
                owner_id=owner_id,
                agent_session=agent_session,
                repository_id=repository_id,
            )

        return sink

    @classmethod
    def make_event_sink(cls, session: AsyncSession, session_id: str):
        """Build the callback the agent loop uses to append to a session's feed.

        The returned callable matches the loop's ``EventSink`` signature, so the
        same occurrence that is logged also becomes a durable event, classified
        and summarized by this service rather than by the loop.
        """

        async def sink(
            event_type: str, details: Dict[str, Any], level: str = "info"
        ) -> None:
            await cls.record_loop_event(
                session,
                session_id=session_id,
                event_type=event_type,
                details=details,
                level=level,
            )

        return sink

    @classmethod
    def make_artifact_sink(cls, session: AsyncSession, session_id: str):
        """Build the callback the agent loop uses to store produced artifacts.

        The returned callable matches the loop's ``ArtifactSink`` signature. Only
        the two artifact-producing results are handled here; the loop already
        filters out everything else before calling, so a new result type cannot
        be persisted by accident.
        """

        async def sink(session_id: str, result: ActionResult) -> None:
            if isinstance(result, PatchActionResult):
                await cls.record_patch(
                    session,
                    session_id=session_id,
                    diff=result.diff,
                    is_empty=result.is_empty,
                )
            elif isinstance(result, BisectActionResult):
                await cls.record_bisect_timeline(
                    session,
                    session_id=session_id,
                    commits=result.commits,
                )

        return sink
