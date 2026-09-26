"""The agent loop's progress is durable: a reader can watch a session as it runs.

These tests wire the loop's optional sinks to the real SessionService and read
the session back through it *while the loop is still running*, which is the
behaviour the frontend's polling depends on.
"""

from typing import List, Optional

import pytest
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.agent_session import AgentSessionRow
from app.models.agent_session_event import AgentSessionEventRow, SessionEventCategory
from app.models.user import User
from app.schemas.actions import LoopConfig, LoopStep
from app.schemas.agent import CompletionRequest, CompletionResponse, TokenUsage
from app.schemas.session import AgentSession, SessionStatus
from app.services.agent.base import AgentProvider
from app.services.agent.loop import AgentExecutionLoop
from app.services.sandbox.base import CommandResult, Sandbox, SandboxConfig
from app.services.session import SessionService


class ObservingProvider(AgentProvider):
    """Provider that inspects persisted state from inside each completion call.

    Reading from inside ``complete`` is what makes this a mid-execution check
    rather than a post-hoc one: the loop has already recorded the previous
    iteration's step and emitted its events, but has not finished.
    """

    def __init__(self, responses: List[str]) -> None:
        self.responses = list(responses)
        self.observations: List[dict] = []
        self._session_id: Optional[str] = None
        self._db: Optional[AsyncSession] = None

    def observe(self, db: AsyncSession, session_id: str) -> None:
        self._db = db
        self._session_id = session_id

    @property
    def name(self) -> str:
        return "observing_provider"

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        if self._db is not None and self._session_id is not None:
            row = (
                await self._db.execute(
                    select(AgentSessionRow).where(AgentSessionRow.id == self._session_id)
                )
            ).scalars().first()
            events = list(
                (
                    await self._db.execute(
                        select(AgentSessionEventRow)
                        .where(AgentSessionEventRow.session_id == self._session_id)
                        .order_by(AgentSessionEventRow.sequence)
                    )
                ).scalars().all()
            )
            self.observations.append(
                {
                    "status": row.status if row else None,
                    "step_count": len(row.steps) if row else 0,
                    "event_types": [event.event_type for event in events],
                    "categories": [event.category for event in events],
                    "terminal": bool(
                        events and events[-1].event_type == "session_terminal"
                    ),
                }
            )

        content = self.responses.pop(0) if self.responses else (
            '{"action": "finish", "message": "done", "success": true}'
        )
        return CompletionResponse(
            content=content,
            model="observing-model",
            usage=TokenUsage(prompt_tokens=10, completion_tokens=5, total_tokens=15),
        )


class RecordingSandbox(Sandbox):
    """Sandbox that runs nothing and reports success."""

    def __init__(self) -> None:
        super().__init__(config=SandboxConfig())
        self._is_running = True

    @property
    def container_id(self) -> Optional[str]:
        return "recording-sandbox"

    @property
    def is_running(self) -> bool:
        return self._is_running

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    async def cleanup(self) -> None:
        self._is_running = False

    async def execute(
        self,
        command: str,
        timeout_seconds: int = 30,
        **kwargs,
    ) -> CommandResult:
        return CommandResult(exit_code=0, stdout="ok", stderr="", duration_seconds=0.01)


async def _make_user(db_session: AsyncSession) -> User:
    user = User(
        github_user_id=4242,
        github_username="loopuser",
        avatar_url="https://avatar.com/loopuser.png",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


def _build_loop(
    provider: AgentProvider,
    sandbox: Sandbox,
    db: AsyncSession,
    owner_id,
    session_id: str,
) -> AgentExecutionLoop:
    return AgentExecutionLoop(
        provider=provider,
        sandbox=sandbox,
        config=LoopConfig(max_iterations=5, max_commands=5, max_consecutive_errors=3),
        session_sink=SessionService.make_session_sink(db, owner_id=owner_id),
        event_sink=SessionService.make_event_sink(db, session_id),
    )


@pytest.mark.asyncio
async def test_mid_execution_read_sees_running_status_and_events(db_session: AsyncSession):
    """While the loop runs, a reader sees running status and accumulated events."""
    user = await _make_user(db_session)
    agent_session = AgentSession(task_prompt="run one command then finish")
    await SessionService.persist_session(db_session, owner_id=user.id, agent_session=agent_session)

    provider = ObservingProvider(
        [
            '{"action": "run_command", "command": "pytest -q"}',
            '{"action": "finish", "message": "all good", "success": true}',
        ]
    )
    provider.observe(db_session, agent_session.id)
    loop = _build_loop(provider, RecordingSandbox(), db_session, user.id, agent_session.id)

    result = await loop.run("run one command then finish", session=agent_session)

    assert result.status.value == "completed"

    # The first completion call happens before any step exists, so the row still
    # reads as created -- the session is persisted but not yet advanced.
    before_any_step = provider.observations[0]
    assert before_any_step["status"] == SessionStatus.CREATED.value
    assert before_any_step["step_count"] == 0
    # loop_started is already durable at that point.
    assert "loop_started" in before_any_step["event_types"]

    # The second call is the mid-run read: iteration 1's command has been
    # recorded and the loop has not finished.
    mid_run = provider.observations[1]
    assert mid_run["status"] == SessionStatus.RUNNING.value
    assert mid_run["step_count"] == 1
    assert "loop_started" in mid_run["event_types"]
    assert "iteration_started" in mid_run["event_types"]
    assert "action_executed" in mid_run["event_types"]
    assert SessionEventCategory.EXECUTION in mid_run["categories"]
    # Nothing terminal has been recorded yet.
    assert mid_run["terminal"] is False
    assert "session_terminal" not in mid_run["event_types"]
    assert "loop_completed" not in mid_run["event_types"]


@pytest.mark.asyncio
async def test_events_accumulate_before_termination(db_session: AsyncSession):
    """The terminal event is the last one, so earlier events are not lost."""
    user = await _make_user(db_session)
    agent_session = AgentSession(task_prompt="finish immediately")
    await SessionService.persist_session(db_session, owner_id=user.id, agent_session=agent_session)

    provider = ObservingProvider(['{"action": "finish", "message": "done", "success": true}'])
    loop = _build_loop(provider, RecordingSandbox(), db_session, user.id, agent_session.id)

    await loop.run("finish immediately", session=agent_session)

    feed = await SessionService.load_events_read(
        db_session, agent_session.id, owner_id=user.id
    )
    event_types = [item.event_type for item in feed.items]

    assert "loop_started" in event_types
    assert "loop_completed" in event_types
    assert event_types[-1] == "session_terminal"
    assert event_types.index("loop_completed") < event_types.index("session_terminal")


@pytest.mark.asyncio
async def test_running_session_is_readable_through_the_api_projection(db_session: AsyncSession):
    """The persisted running state projects cleanly into the API response."""
    user = await _make_user(db_session)
    agent_session = AgentSession(task_prompt="inspect me mid-run")
    agent_session.start()
    agent_session.record_step(
        LoopStep(
            iteration=1,
            raw_response="run_command ls",
            action={"action": "run_command", "command": "ls"},
        )
    )
    await SessionService.persist_session(db_session, owner_id=user.id, agent_session=agent_session)

    read = await SessionService.load_session_read(
        db_session, agent_session.id, owner_id=user.id
    )

    assert read.status == SessionStatus.RUNNING.value
    assert read.started_at is not None
    assert read.completed_at is None
    assert len(read.steps) == 1


@pytest.mark.asyncio
async def test_terminal_state_and_reason_are_persisted(db_session: AsyncSession):
    """After the loop ends, the session's outcome and reason are readable."""
    user = await _make_user(db_session)
    agent_session = AgentSession(task_prompt="fail on purpose")
    await SessionService.persist_session(db_session, owner_id=user.id, agent_session=agent_session)

    provider = ObservingProvider(['{"action": "finish", "message": "could not fix it", "success": false}'])
    loop = _build_loop(provider, RecordingSandbox(), db_session, user.id, agent_session.id)

    result = await loop.run("fail on purpose", session=agent_session)

    read = await SessionService.load_session_read(
        db_session, agent_session.id, owner_id=user.id
    )
    assert read.status == result.status.value
    assert read.status == SessionStatus.FAILED.value
    assert "could not fix it" in read.termination_reason
    assert read.completed_at is not None


@pytest.mark.asyncio
async def test_loop_without_sinks_still_works(db_session: AsyncSession):
    """A loop constructed without sinks behaves exactly as before."""
    user = await _make_user(db_session)
    loop = AgentExecutionLoop(
        provider=ObservingProvider(['{"action": "finish", "message": "ok", "success": true}']),
        sandbox=RecordingSandbox(),
        config=LoopConfig(max_iterations=2, max_commands=2),
    )

    result = await loop.run("no sinks here")

    assert result.status.value == "completed"
    assert result.session is not None
    # Nothing was persisted, because nothing asked it to be.
    total = (
        await db_session.execute(select(func.count(AgentSessionRow.id)))
    ).scalar()
    assert total == 0


@pytest.mark.asyncio
async def test_failing_sink_does_not_abort_the_loop(db_session: AsyncSession):
    """A broken persistence sink is logged and ignored, not fatal to the run."""
    user = await _make_user(db_session)
    calls: List[str] = []

    async def broken_sink(agent_session: AgentSession) -> None:
        calls.append(agent_session.id)
        raise RuntimeError("database is down")

    async def broken_event_sink(event_type: str, details: dict, level: str = "info") -> None:
        raise RuntimeError("database is down")

    loop = AgentExecutionLoop(
        provider=ObservingProvider(['{"action": "finish", "message": "ok", "success": true}']),
        sandbox=RecordingSandbox(),
        config=LoopConfig(max_iterations=2, max_commands=2),
        session_sink=broken_sink,
        event_sink=broken_event_sink,
    )

    result = await loop.run("sink is broken")

    assert result.status.value == "completed"
    # The sink was reached, so the loop did try, and did not die trying.
    assert calls


@pytest.mark.asyncio
async def test_loop_events_are_categorized_on_the_durable_feed(db_session: AsyncSession):
    """Events recorded by the loop carry server-derived categories."""
    user = await _make_user(db_session)
    agent_session = AgentSession(task_prompt="categorization check")
    await SessionService.persist_session(db_session, owner_id=user.id, agent_session=agent_session)

    provider = ObservingProvider(['{"action": "finish", "message": "done", "success": true}'])
    loop = _build_loop(provider, RecordingSandbox(), db_session, user.id, agent_session.id)

    await loop.run("categorization check", session=agent_session)

    feed = await SessionService.load_events_read(
        db_session, agent_session.id, owner_id=user.id
    )
    by_type = {item.event_type: item.category for item in feed.items}

    assert by_type["loop_started"] == SessionEventCategory.SYSTEM
    assert by_type["iteration_started"] == SessionEventCategory.AGENT
    assert by_type["loop_completed"] == SessionEventCategory.SUCCESS
    assert by_type["session_terminal"] == SessionEventCategory.ERROR
