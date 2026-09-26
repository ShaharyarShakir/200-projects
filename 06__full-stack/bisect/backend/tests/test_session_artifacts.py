"""Session artifacts: what a run produced, stored against the session it belongs to.

The redaction cases matter most here. A diff can carry a credential in an added
line and a commit message can carry one in its body, so both go through the same
projection the event feed uses. These tests assert that on the way *out*, which
is the boundary a reader actually sees.
"""

from typing import List

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.agent_session_bisect_commit import AgentSessionBisectCommitRow
from app.models.agent_session_patch import AgentSessionPatchRow
from app.models.user import User
from app.schemas.actions import (
    BisectActionResult,
    BisectCommit,
    PatchActionResult,
)
from app.schemas.session import AgentSession
from app.services.session import SessionService

REDACTED = "[REDACTED]"


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


async def _make_session(db_session: AsyncSession, owner: User, prompt: str = "fix the bug") -> str:
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt=prompt
    )
    return row.id


def _commit(sha: str, verdict: str = "good", is_culprit: bool = False, **kw) -> BisectCommit:
    fields = {
        "short_sha": sha[:7],
        "author": "Dev",
        "authored_at": "2026-01-01T00:00:00+00:00",
        "message": f"commit {sha}",
        "verdict": verdict,
        "is_culprit": is_culprit,
    }
    fields.update(kw)
    return BisectCommit(sha=sha, **fields)


# ==============================================================================
# Patch storage
# ==============================================================================


@pytest.mark.asyncio
async def test_patch_is_stored_and_read_back(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)

    await SessionService.record_patch(
        db_session, session_id=session_id, diff="diff --git a/x b/x\n+hi\n", is_empty=False
    )

    read = await SessionService.load_patch_read(db_session, session_id, owner.id)
    assert read.exists is True
    assert read.is_empty is False
    assert "+hi" in read.diff


@pytest.mark.asyncio
async def test_empty_patch_is_stored_as_present_but_empty(db_session: AsyncSession):
    """"The agent produced a patch and it was empty" is not the same as "none"."""
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)

    await SessionService.record_patch(db_session, session_id=session_id, diff="", is_empty=True)

    read = await SessionService.load_patch_read(db_session, session_id, owner.id)
    assert read.exists is True
    assert read.is_empty is True
    assert read.diff == ""


@pytest.mark.asyncio
async def test_missing_patch_reads_as_an_empty_artifact_not_an_error(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)

    read = await SessionService.load_patch_read(db_session, session_id, owner.id)

    assert read.exists is False
    assert read.diff == ""
    assert read.is_empty is True


@pytest.mark.asyncio
async def test_a_second_patch_replaces_the_first(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)

    await SessionService.record_patch(db_session, session_id=session_id, diff="first", is_empty=False)
    await SessionService.record_patch(db_session, session_id=session_id, diff="second", is_empty=False)

    read = await SessionService.load_patch_read(db_session, session_id, owner.id)
    assert read.diff == "second"

    rows = list(
        (await db_session.execute(select(AgentSessionPatchRow))).scalars().all()
    )
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_patch_is_redacted_on_read(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)

    await SessionService.record_patch(
        db_session,
        session_id=session_id,
        diff='diff --git a/.env b/.env\n+GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz0123456789\n',
        is_empty=False,
    )

    read = await SessionService.load_patch_read(db_session, session_id, owner.id)
    assert "ghp_abcdefghijklmnopqrstuvwxyz0123456789" not in read.diff
    assert REDACTED in read.diff


# ==============================================================================
# Bisect timeline storage
# ==============================================================================


@pytest.mark.asyncio
async def test_timeline_is_stored_in_evaluation_order(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    commits = [_commit("aaa"), _commit("bbb", "bad"), _commit("ccc", is_culprit=True)]

    await SessionService.record_bisect_timeline(db_session, session_id=session_id, commits=commits)

    read = await SessionService.load_timeline_read(db_session, session_id, owner.id)
    assert [c.hash for c in read.commits] == ["aaa", "bbb", "ccc"]


@pytest.mark.asyncio
async def test_evaluation_index_is_assigned_by_the_backend(db_session: AsyncSession):
    """The store decides a commit's position; nothing supplies one."""
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)

    await SessionService.record_bisect_timeline(
        db_session,
        session_id=session_id,
        # Deliberately supplied out of order: position comes from the list, and
        # these commits carry no index of their own to disagree with.
        commits=[_commit("zzz"), _commit("aaa"), _commit("mmm")],
    )

    rows = list(
        (
            await db_session.execute(
                select(AgentSessionBisectCommitRow)
                .where(AgentSessionBisectCommitRow.session_id == session_id)
                .order_by(AgentSessionBisectCommitRow.evaluation_index)
            )
        )
        .scalars()
        .all()
    )
    assert [(r.evaluation_index, r.sha) for r in rows] == [(0, "zzz"), (1, "aaa"), (2, "mmm")]


@pytest.mark.asyncio
async def test_two_commits_cannot_claim_the_same_slot(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("aaa")]
    )

    db_session.add(
        AgentSessionBisectCommitRow(
            session_id=session_id,
            evaluation_index=0,
            sha="collide",
            verdict="good",
        )
    )
    with pytest.raises(Exception):
        await db_session.commit()


@pytest.mark.asyncio
async def test_culprit_is_distinguishable_from_a_commit_that_merely_tested_bad(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session,
        session_id=session_id,
        commits=[_commit("good1", "good"), _commit("bad1", "bad"), _commit("bad2", "bad", is_culprit=True)],
    )

    read = await SessionService.load_timeline_read(db_session, session_id, owner.id)
    outcomes = {c.hash: c.outcome for c in read.commits}
    assert outcomes["good1"] == "good"
    assert outcomes["bad1"] == "bad"
    assert outcomes["bad2"] == "culprit"
    assert read.culprit_hash == "bad2"


@pytest.mark.asyncio
async def test_inconclusive_timeline_has_no_culprit(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("a", "good"), _commit("b", "good")]
    )

    read = await SessionService.load_timeline_read(db_session, session_id, owner.id)
    assert read.exists is True
    assert read.culprit_hash is None
    assert all(c.outcome == "good" for c in read.commits)


@pytest.mark.asyncio
async def test_missing_timeline_reads_as_an_empty_artifact_not_an_error(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)

    read = await SessionService.load_timeline_read(db_session, session_id, owner.id)

    assert read.exists is False
    assert read.commits == []
    assert read.culprit_hash is None


@pytest.mark.asyncio
async def test_a_second_bisect_replaces_the_timeline(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("old1"), _commit("old2")]
    )

    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("new1", "bad", is_culprit=True)]
    )

    read = await SessionService.load_timeline_read(db_session, session_id, owner.id)
    assert [c.hash for c in read.commits] == ["new1"]
    assert read.culprit_hash == "new1"


@pytest.mark.asyncio
async def test_timeline_content_is_redacted_on_read(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session,
        session_id=session_id,
        commits=[
            _commit(
                "aaa",
                "good",
                message="oops my key is sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                test_output="FAILED: token=ghp_abcdefghijklmnopqrstuvwxyz0123456789",
            )
        ],
    )

    read = await SessionService.load_timeline_read(db_session, session_id, owner.id)
    assert "sk-ant-api03" not in read.commits[0].message
    assert "ghp_abcdefghijklmnopqrstuvwxyz0123456789" not in (read.commits[0].test_output or "")
    assert REDACTED in read.commits[0].message


# ==============================================================================
# Artifact sink
# ==============================================================================


@pytest.mark.asyncio
async def test_artifact_sink_persists_a_patch_result(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    sink = SessionService.make_artifact_sink(db_session, session_id)

    await sink(session_id, PatchActionResult(diff="diff --git a/x b/x\n+y\n", is_empty=False))

    read = await SessionService.load_patch_read(db_session, session_id, owner.id)
    assert read.exists is True
    assert "+y" in read.diff


@pytest.mark.asyncio
async def test_artifact_sink_persists_a_bisect_result(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    sink = SessionService.make_artifact_sink(db_session, session_id)

    await sink(
        session_id,
        BisectActionResult(
            commits=[_commit("a", "good"), _commit("b", "bad", is_culprit=True)],
            culprit="b",
        ),
    )

    read = await SessionService.load_timeline_read(db_session, session_id, owner.id)
    assert [c.hash for c in read.commits] == ["a", "b"]
    assert read.culprit_hash == "b"


@pytest.mark.asyncio
async def test_artifact_sink_ignores_results_that_produce_no_artifact(db_session: AsyncSession):
    owner = await _make_user(db_session)
    session_id = await _make_session(db_session, owner)
    sink = SessionService.make_artifact_sink(db_session, session_id)

    from app.schemas.actions import FinishActionResult

    await sink(session_id, FinishActionResult(message="done"))

    patch = await SessionService.load_patch_read(db_session, session_id, owner.id)
    timeline = await SessionService.load_timeline_read(db_session, session_id, owner.id)
    assert patch.exists is False
    assert timeline.exists is False


# ==============================================================================
# Ownership
# ==============================================================================


@pytest.mark.asyncio
async def test_another_user_cannot_read_a_patch(db_session: AsyncSession):
    from app.core.errors import NotFoundError

    owner = await _make_user(db_session, "alice")
    intruder = await _make_user(db_session, "mallory")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_patch(db_session, session_id=session_id, diff="secret work", is_empty=False)

    with pytest.raises(NotFoundError):
        await SessionService.load_patch_read(db_session, session_id, intruder.id)


@pytest.mark.asyncio
async def test_another_user_cannot_read_a_timeline(db_session: AsyncSession):
    from app.core.errors import NotFoundError

    owner = await _make_user(db_session, "alice")
    intruder = await _make_user(db_session, "mallory")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("a")]
    )

    with pytest.raises(NotFoundError):
        await SessionService.load_timeline_read(db_session, session_id, intruder.id)


@pytest.mark.asyncio
async def test_artifacts_for_an_unknown_session_are_not_found(db_session: AsyncSession):
    from app.core.errors import NotFoundError

    owner = await _make_user(db_session)

    with pytest.raises(NotFoundError):
        await SessionService.load_patch_read(db_session, "sess_nope", owner.id)
    with pytest.raises(NotFoundError):
        await SessionService.load_timeline_read(db_session, "sess_nope", owner.id)
