"""Tests for SessionService: owner scoping, pagination, feed ordering, redaction."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.agent_session_event import SessionEventCategory
from app.models.user import User
from app.schemas.actions import LoopStep
from app.schemas.session import AgentSession, SessionStatus
from app.services.session import SessionService, categorize_event


async def _make_user(db_session: AsyncSession, username: str = "owner") -> User:
    user = User(
        github_user_id=abs(hash(username)) % 100000,
        github_username=username,
        avatar_url=f"https://avatar.com/{username}.png",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ----------------------------------------------------------------------
# Owner scoping
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_session_is_scoped_to_owner(db_session: AsyncSession):
    """A session belonging to another user is not returned."""
    owner = await _make_user(db_session, "alice")
    other = await _make_user(db_session, "mallory")

    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="fix the flaky test"
    )

    assert await SessionService.get_session(db_session, row.id, owner.id) is not None
    assert await SessionService.get_session(db_session, row.id, other.id) is None


@pytest.mark.asyncio
async def test_require_session_raises_404_for_unowned_session(db_session: AsyncSession):
    """An unowned session and a missing session are indistinguishable: both 404."""
    owner = await _make_user(db_session, "alice")
    other = await _make_user(db_session, "mallory")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="fix the flaky test"
    )

    with pytest.raises(NotFoundError) as unowned:
        await SessionService.require_session(db_session, row.id, other.id)
    with pytest.raises(NotFoundError) as missing:
        await SessionService.require_session(db_session, "does-not-exist", other.id)

    # Identical messages, so a caller cannot probe for which sessions exist.
    assert str(unowned.value) == str(missing.value)


@pytest.mark.asyncio
async def test_list_sessions_only_returns_callers_sessions(db_session: AsyncSession):
    """Listing never crosses an owner boundary."""
    owner = await _make_user(db_session, "alice")
    other = await _make_user(db_session, "mallory")

    for prompt in ("first", "second", "third"):
        await SessionService.create_session(
            db_session, owner_id=owner.id, task_prompt=prompt
        )
    await SessionService.create_session(
        db_session, owner_id=other.id, task_prompt="not yours"
    )

    rows, total = await SessionService.list_sessions(db_session, owner_id=owner.id)

    assert total == 3
    assert {row.task_prompt for row in rows} == {"first", "second", "third"}


# ----------------------------------------------------------------------
# Pagination and filtering
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_sessions_pagination_reports_filtered_total(db_session: AsyncSession):
    """Total counts rows matching the filters, not all rows for the owner."""
    owner = await _make_user(db_session, "alice")
    for index in range(5):
        await SessionService.create_session(
            db_session, owner_id=owner.id, task_prompt=f"task {index}"
        )

    page, total = await SessionService.list_sessions(db_session, owner_id=owner.id, limit=2, offset=0)
    assert total == 5
    assert len(page) == 2

    second, total_second = await SessionService.list_sessions(
        db_session, owner_id=owner.id, limit=2, offset=2
    )
    assert total_second == 5
    assert len(second) == 2

    # Pages must not overlap, otherwise a client loops forever.
    assert not {row.id for row in page} & {row.id for row in second}


@pytest.mark.asyncio
async def test_list_sessions_filters_by_status(db_session: AsyncSession):
    """A status filter narrows both the page and the total."""
    owner = await _make_user(db_session, "alice")
    pending = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="still going"
    )
    done_agent_session = AgentSession(task_prompt="already done")
    done_agent_session.start()
    done_agent_session.complete("finished the job")
    await SessionService.persist_session(db_session, owner_id=owner.id, agent_session=done_agent_session)

    rows, total = await SessionService.list_sessions(
        db_session, owner_id=owner.id, status=SessionStatus.COMPLETED.value
    )

    assert total == 1
    assert rows[0].id == done_agent_session.id
    assert rows[0].id != pending.id


@pytest.mark.asyncio
async def test_list_sessions_empty_for_user_with_no_sessions(db_session: AsyncSession):
    """A user who has never run a session gets an empty page, not a 404."""
    owner = await _make_user(db_session, "newcomer")

    response = await SessionService.load_sessions_read(db_session, owner_id=owner.id)

    assert response.items == []
    assert response.total == 0


@pytest.mark.asyncio
async def test_list_sessions_filters_by_repository(db_session: AsyncSession):
    """A repository filter narrows the page and the total."""
    from app.models.repository import Repository

    owner = await _make_user(db_session, "alice")
    first = Repository(
        github_repo_id=1,
        full_name="alice/one",
        default_branch="main",
        clone_url="https://github.com/alice/one.git",
        is_private=False,
        owner_id=owner.id,
    )
    second = Repository(
        github_repo_id=2,
        full_name="alice/two",
        default_branch="main",
        clone_url="https://github.com/alice/two.git",
        is_private=False,
        owner_id=owner.id,
    )
    db_session.add(first)
    db_session.add(second)
    await db_session.commit()
    await db_session.refresh(first)
    await db_session.refresh(second)

    await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="on one", repository_id=first.id
    )
    await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="on two", repository_id=second.id
    )
    await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="on no repository"
    )

    rows, total = await SessionService.list_sessions(
        db_session, owner_id=owner.id, repository_id=first.id
    )

    assert total == 1
    assert [row.task_prompt for row in rows] == ["on one"]


# ----------------------------------------------------------------------
# Session state projection
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_persist_session_writes_lifecycle_state_and_steps(db_session: AsyncSession):
    """A persist call carries status, counters, tokens, and steps to the row."""
    owner = await _make_user(db_session, "alice")
    agent_session = AgentSession(task_prompt="refactor the parser")
    agent_session.start()
    agent_session.record_step(
        LoopStep(
            iteration=1,
            raw_response="run_command ls",
            action={"action": "run_command", "command": "ls"},
        )
    )
    agent_session.iteration_count = 1
    agent_session.executed_action_count = 1
    agent_session.prompt_tokens = 120
    agent_session.completion_tokens = 45
    agent_session.total_tokens = 165

    row = await SessionService.persist_session(
        db_session, owner_id=owner.id, agent_session=agent_session
    )

    assert row.status == SessionStatus.RUNNING.value
    assert row.started_at is not None
    assert row.iteration_count == 1
    assert row.executed_action_count == 1
    assert row.total_tokens == 165
    assert len(row.steps) == 1
    assert row.steps[0]["action"]["command"] == "ls"


@pytest.mark.asyncio
async def test_persist_session_replaces_steps_rather_than_merging(db_session: AsyncSession):
    """The in-memory session is authoritative, so a shorter list truncates the row."""
    owner = await _make_user(db_session, "alice")
    agent_session = AgentSession(task_prompt="churn through steps")
    agent_session.start()
    agent_session.record_step(
        LoopStep(
            iteration=1,
            raw_response="finish a",
            action={"action": "finish", "summary": "a"},
        )
    )
    await SessionService.persist_session(db_session, owner_id=owner.id, agent_session=agent_session)

    agent_session.steps = []
    row = await SessionService.persist_session(
        db_session, owner_id=owner.id, agent_session=agent_session
    )

    assert row.steps == []


@pytest.mark.asyncio
async def test_read_model_exposes_typed_steps(db_session: AsyncSession):
    """Steps come back as LoopStep objects the frontend can rely on."""
    owner = await _make_user(db_session, "alice")
    agent_session = AgentSession(task_prompt="typed steps")
    agent_session.start()
    agent_session.record_step(
        LoopStep(
            iteration=1,
            raw_response="inspect_file a.py",
            action={"action": "inspect_file", "path": "a.py"},
        )
    )
    await SessionService.persist_session(db_session, owner_id=owner.id, agent_session=agent_session)

    read = await SessionService.load_session_read(
        db_session, agent_session.id, owner_id=owner.id
    )

    assert all(isinstance(step, LoopStep) for step in read.steps)
    assert read.steps[0].action["path"] == "a.py"


# ----------------------------------------------------------------------
# Redaction
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_session_response_redacts_secrets_in_step_output(db_session: AsyncSession):
    """A token echoed in command output never reaches the response."""
    owner = await _make_user(db_session, "alice")
    agent_session = AgentSession(task_prompt="redaction")
    agent_session.start()
    agent_session.record_step(
        LoopStep(
            iteration=1,
            raw_response="run_command cat .env",
            action={"action": "run_command", "command": "cat .env"},
            result={"stdout": "GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz012345"},
        )
    )
    await SessionService.persist_session(db_session, owner_id=owner.id, agent_session=agent_session)

    read = await SessionService.load_session_read(
        db_session, agent_session.id, owner_id=owner.id
    )

    serialized = read.model_dump_json()
    assert "ghp_abcdefghijklmnopqrstuvwxyz012345" not in serialized
    assert "[REDACTED]" in serialized


@pytest.mark.asyncio
async def test_event_response_redacts_secrets(db_session: AsyncSession):
    """Event summaries and payloads are redacted before they leave the service."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="event redaction"
    )
    await SessionService.record_event(
        db_session,
        session_id=row.id,
        event_type="action_executed",
        level="info",
        summary="ran command: export TOKEN=ghp_abcdefghijklmnopqrstuvwxyz012345",
        payload={"output": "api_key=sk-ant-abcdefghijklmnopqrstuvwxyz"},
    )

    feed = await SessionService.load_events_read(db_session, row.id, owner_id=owner.id)

    serialized = feed.model_dump_json()
    assert "ghp_abcdefghijklmnopqrstuvwxyz012345" not in serialized
    assert "sk-ant-abcdefghijklmnopqrstuvwxyz" not in serialized
    assert "[REDACTED]" in serialized


@pytest.mark.asyncio
async def test_step_token_is_masked_on_the_list_path_too(db_session: AsyncSession):
    """The list response is redacted the same way the single-read response is."""
    owner = await _make_user(db_session, "alice")
    agent_session = AgentSession(task_prompt="list path redaction")
    agent_session.start()
    agent_session.record_step(
        LoopStep(
            iteration=1,
            raw_response="run_command cat .env",
            action={"action": "run_command", "command": "cat .env"},
            result={"stdout": "TOKEN=ghp_abcdefghijklmnopqrstuvwxyz012345"},
        )
    )
    await SessionService.persist_session(db_session, owner_id=owner.id, agent_session=agent_session)

    single = await SessionService.load_session_read(
        db_session, agent_session.id, owner_id=owner.id
    )
    listed = await SessionService.load_sessions_read(db_session, owner_id=owner.id)

    assert "ghp_abcdefghijklmnopqrstuvwxyz012345" not in single.model_dump_json()
    assert "ghp_abcdefghijklmnopqrstuvwxyz012345" not in listed.model_dump_json()
    assert listed.items[0].steps[0].result == {"stdout": "TOKEN=[REDACTED]"}


@pytest.mark.asyncio
async def test_event_summary_carries_no_unmasked_secret(db_session: AsyncSession):
    """A summary built from a detail payload holds no unmasked credential."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="summary redaction"
    )
    await SessionService.record_loop_event(
        db_session,
        session_id=row.id,
        event_type="action_executed",
        details={
            "action": {"action": "run_command", "command": "curl -H 'ghp_abcdefghijklmnopqrstuvwxyz012345'"},
            "output": "ghp_abcdefghijklmnopqrstuvwxyz012345",
        },
    )

    feed = await SessionService.load_events_read(db_session, row.id, owner_id=owner.id)
    summary = feed.items[0].summary

    assert "ghp_abcdefghijklmnopqrstuvwxyz012345" not in summary
    assert "[REDACTED]" in summary


@pytest.mark.asyncio
async def test_session_prompt_with_embedded_token_is_redacted(db_session: AsyncSession):
    """A user pasting a credential into the prompt does not get it echoed back."""
    owner = await _make_user(db_session, "alice")
    await SessionService.create_session(
        db_session,
        owner_id=owner.id,
        task_prompt="debug this call: ghp_abcdefghijklmnopqrstuvwxyz012345",
    )

    read = await SessionService.load_sessions_read(db_session, owner_id=owner.id)

    assert "ghp_abcdefghijklmnopqrstuvwxyz012345" not in read.model_dump_json()


# ----------------------------------------------------------------------
# Event feed
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_event_sequence_starts_at_one_and_increments(db_session: AsyncSession):
    """Sequences are dense and monotonic per session."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="sequence"
    )

    for _ in range(3):
        await SessionService.record_event(
            db_session, session_id=row.id, event_type="iteration_started"
        )

    feed = await SessionService.load_events_read(db_session, row.id, owner_id=owner.id)
    assert [item.sequence for item in feed.items] == [1, 2, 3]
    assert feed.last_sequence == 3


@pytest.mark.asyncio
async def test_sequences_are_independent_per_session(db_session: AsyncSession):
    """One session's writes must not advance another session's numbering."""
    owner = await _make_user(db_session, "alice")
    first = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="first"
    )
    second = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="second"
    )

    await SessionService.record_event(db_session, session_id=first.id, event_type="loop_started")
    await SessionService.record_event(db_session, session_id=second.id, event_type="loop_started")

    feed = await SessionService.load_events_read(db_session, second.id, owner_id=owner.id)
    assert [item.sequence for item in feed.items] == [1]


@pytest.mark.asyncio
async def test_events_after_sequence_returns_only_newer_events(db_session: AsyncSession):
    """A polling client can resume from its last seen sequence."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="incremental"
    )
    for _ in range(5):
        await SessionService.record_event(
            db_session, session_id=row.id, event_type="iteration_started"
        )

    feed = await SessionService.load_events_read(
        db_session, row.id, owner_id=owner.id, after_sequence=3
    )

    assert [item.sequence for item in feed.items] == [4, 5]
    assert feed.after_sequence == 3
    assert feed.last_sequence == 5
    assert feed.total == 2


@pytest.mark.asyncio
async def test_event_feed_respects_limit(db_session: AsyncSession):
    """The page is bounded and reports the unmatched total so paging is possible."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="paged"
    )
    for _ in range(4):
        await SessionService.record_event(
            db_session, session_id=row.id, event_type="iteration_started"
        )

    feed = await SessionService.load_events_read(
        db_session, row.id, owner_id=owner.id, limit=2
    )

    assert len(feed.items) == 2
    assert feed.total == 4
    assert feed.limit == 2


@pytest.mark.asyncio
async def test_event_feed_is_empty_before_any_event(db_session: AsyncSession):
    """A fresh session has an empty feed rather than a missing one."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="quiet"
    )

    feed = await SessionService.load_events_read(db_session, row.id, owner_id=owner.id)

    assert feed.items == []
    assert feed.total == 0
    assert feed.last_sequence is None


@pytest.mark.asyncio
async def test_reading_events_of_unowned_session_is_404(db_session: AsyncSession):
    """The events endpoint enforces the same ownership check as the session."""
    owner = await _make_user(db_session, "alice")
    other = await _make_user(db_session, "mallory")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="private feed"
    )
    await SessionService.record_event(db_session, session_id=row.id, event_type="loop_started")

    with pytest.raises(NotFoundError):
        await SessionService.load_events_read(db_session, row.id, owner_id=other.id)


# ----------------------------------------------------------------------
# Event categorization
# ----------------------------------------------------------------------


def test_categorize_event_covers_every_loop_event_type():
    """Each event type the loop emits lands in a specific category."""
    assert categorize_event("loop_started") == SessionEventCategory.SYSTEM
    assert categorize_event("iteration_started") == SessionEventCategory.AGENT
    assert categorize_event("action_dispatched") == SessionEventCategory.EXECUTION
    assert categorize_event("action_executed") == SessionEventCategory.EXECUTION
    assert categorize_event("action_validation_error") == SessionEventCategory.VALIDATION
    assert categorize_event("action_parse_error") == SessionEventCategory.VALIDATION
    assert categorize_event("loop_completed") == SessionEventCategory.SUCCESS
    assert categorize_event("max_iterations_reached") == SessionEventCategory.WARNING
    assert categorize_event("max_commands_exceeded") == SessionEventCategory.WARNING
    assert categorize_event("loop_timeout") == SessionEventCategory.ERROR
    assert categorize_event("provider_failure") == SessionEventCategory.ERROR
    assert categorize_event("unhandled_loop_exception") == SessionEventCategory.ERROR
    # Artifact production reads as execution; a failure to produce one is an
    # error the run recovered from, not a fault that ended it.
    assert categorize_event("patch_generated") == SessionEventCategory.EXECUTION
    assert categorize_event("bisect_verdict") == SessionEventCategory.EXECUTION
    assert categorize_event("bisect_completed") == SessionEventCategory.EXECUTION
    assert categorize_event("patch_generation_failed") == SessionEventCategory.ERROR
    assert categorize_event("bisect_failed") == SessionEventCategory.ERROR


def test_categorize_event_falls_back_to_system():
    """An unknown type is still shown rather than dropped."""
    assert categorize_event("some_future_event") == SessionEventCategory.SYSTEM
    assert categorize_event("") == SessionEventCategory.SYSTEM


def test_every_category_is_reachable():
    """No category in the fixed set is dead weight."""
    from app.services.session import _EVENT_TYPE_TO_CATEGORY

    assert set(_EVENT_TYPE_TO_CATEGORY.values()) == set(SessionEventCategory.ALL)


@pytest.mark.asyncio
async def test_recorded_event_category_is_derived_not_supplied(db_session: AsyncSession):
    """The stored category comes from the event type."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="derived category"
    )

    event = await SessionService.record_event(
        db_session, session_id=row.id, event_type="loop_completed", summary="done"
    )

    assert event.category == SessionEventCategory.SUCCESS


def test_no_event_write_path_accepts_a_caller_supplied_category():
    """No recorder takes a category argument, so no caller can mislabel an event."""
    import inspect

    for method in (
        SessionService.record_event,
        SessionService.record_loop_event,
        SessionService.persist_session,
    ):
        assert "category" not in inspect.signature(method).parameters


@pytest.mark.asyncio
async def test_session_terminal_event_records_the_sessions_reason(db_session: AsyncSession):
    """Reaching a terminal status records one event quoting the session's reason."""
    owner = await _make_user(db_session, "alice")
    agent_session = AgentSession(task_prompt="fails eventually")
    agent_session.start()
    agent_session.fail("provider returned 500")
    await SessionService.persist_session(db_session, owner_id=owner.id, agent_session=agent_session)

    feed = await SessionService.load_events_read(
        db_session, agent_session.id, owner_id=owner.id
    )
    terminal = [item for item in feed.items if item.event_type == "session_terminal"]

    assert len(terminal) == 1
    assert terminal[0].category == SessionEventCategory.ERROR
    assert "provider returned 500" in terminal[0].summary


@pytest.mark.asyncio
async def test_terminal_event_is_not_repeated_on_later_persists(db_session: AsyncSession):
    """A finished session is not re-announced every time its state is written."""
    owner = await _make_user(db_session, "alice")
    agent_session = AgentSession(task_prompt="idempotent terminal event")
    agent_session.start()
    agent_session.fail("gave up")

    for _ in range(3):
        await SessionService.persist_session(
            db_session, owner_id=owner.id, agent_session=agent_session
        )

    feed = await SessionService.load_events_read(
        db_session, agent_session.id, owner_id=owner.id
    )
    assert len([item for item in feed.items if item.event_type == "session_terminal"]) == 1


# ----------------------------------------------------------------------
# Summaries
# ----------------------------------------------------------------------


def test_summarize_does_not_echo_command_output():
    """Summaries describe the action, not the result it produced."""
    from app.services.session import SessionService

    summary = SessionService._summarize(
        "action_executed",
        {
            "action": {"action": "run_command", "command": "cat .env"},
            "output": "SECRET_VALUE_HERE",
        },
    )

    assert "run_command" not in summary
    assert "cat .env" in summary
    assert "SECRET_VALUE_HERE" not in summary


def test_summarize_truncates_long_values():
    """A very long path cannot bloat the summary column."""
    from app.services.session import SessionService

    summary = SessionService._summarize(
        "action_dispatched", {"action": {"action": "inspect_file", "path": "x" * 5000}}
    )

    assert len(summary) < 300
    assert summary.endswith("…")


def test_summarize_names_the_new_actions():
    from app.services.session import SessionService

    assert SessionService._summarize(
        "action_dispatched", {"action": {"action": "generate_patch"}}
    ) == "generated a patch"
    assert "v1.0..HEAD" in SessionService._summarize(
        "action_dispatched", {"action": {"action": "run_bisect", "good": "v1.0", "bad": "HEAD"}}
    )


def test_summarize_distinguishes_an_empty_patch_from_a_collected_one():
    from app.services.session import SessionService

    assert "empty" in SessionService._summarize("patch_generated", {"is_empty": True})
    assert "bytes" in SessionService._summarize(
        "patch_generated", {"is_empty": False, "diff_bytes": 120}
    )


def test_summarize_distinguishes_a_culprit_from_an_inconclusive_bisect():
    from app.services.session import SessionService

    culprit = SessionService._summarize(
        "bisect_verdict", {"short_sha": "abc1234", "verdict": "bad", "is_culprit": True}
    )
    assert "first bad commit" in culprit
    assert SessionService._summarize(
        "bisect_verdict", {"short_sha": "abc1234", "verdict": "good", "is_culprit": False}
    ) == "Bisect tested abc1234 as good"

    assert "culprit" in SessionService._summarize(
        "bisect_completed", {"culprit": "abc1234", "commits_evaluated": 3}
    )
    assert "without isolating" in SessionService._summarize(
        "bisect_completed", {"culprit": None, "truncated": False, "commits_evaluated": 3}
    )
    assert "budget" in SessionService._summarize(
        "bisect_completed", {"culprit": None, "truncated": True, "commits_evaluated": 2}
    )


@pytest.mark.asyncio
async def test_loop_event_summary_and_payload_are_recorded(db_session: AsyncSession):
    """record_loop_event captures both a summary and the redacted detail payload."""
    owner = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="loop events"
    )

    await SessionService.record_loop_event(
        db_session,
        session_id=row.id,
        event_type="action_dispatched",
        details={"action": {"action": "run_command", "command": "pytest -q"}},
    )

    feed = await SessionService.load_events_read(db_session, row.id, owner_id=owner.id)
    assert feed.items[0].summary == "ran command: pytest -q"
    assert feed.items[0].payload == {"action": {"action": "run_command", "command": "pytest -q"}}


# ----------------------------------------------------------------------
# Repository ownership
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_repository_is_owned_is_false_for_another_users_repository(db_session: AsyncSession):
    """Attaching a session to a repository requires owning that repository."""
    from app.models.repository import Repository

    owner = await _make_user(db_session, "alice")
    other = await _make_user(db_session, "mallory")
    repo = Repository(
        github_repo_id=4242,
        full_name="alice/thing",
        default_branch="main",
        clone_url="https://github.com/alice/thing.git",
        is_private=False,
        owner_id=owner.id,
    )
    db_session.add(repo)
    await db_session.commit()
    await db_session.refresh(repo)

    assert await SessionService.repository_is_owned(db_session, repo.id, owner.id) is True
    assert await SessionService.repository_is_owned(db_session, repo.id, other.id) is False


@pytest.mark.asyncio
async def test_repository_is_owned_is_false_for_random_uuid(db_session: AsyncSession):
    """An unknown repository id is reported as not owned, not as an error."""
    owner = await _make_user(db_session, "alice")
    assert (
        await SessionService.repository_is_owned(db_session, uuid.uuid4(), owner.id) is False
    )


# ----------------------------------------------------------------------
# Create defaults
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_session_starts_in_created_status(db_session: AsyncSession):
    """A new session is created and immediately readable by its owner."""
    owner = await _make_user(db_session, "alice")

    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="brand new"
    )

    assert row.status == SessionStatus.CREATED.value
    assert row.created_at is not None
    read = await SessionService.load_session_read(db_session, row.id, owner_id=owner.id)
    assert read.steps == []
    assert read.total_tokens == 0
