"""Service-level tests for repository sync atomicity and concurrency handling.

These exercise the failure paths that the HTTP-level tests cannot reach: a
mid-loop failure, and the duplicate-key race between two concurrent syncs.
"""

from typing import List

import httpx
import pytest
import respx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import encrypt_token
from app.models.repository import Repository
from app.models.user import User
from app.services.repository import RepositoryService


def _gh_repo(repo_id: int, name: str, **overrides) -> dict:
    payload = {
        "id": repo_id,
        "name": name,
        "full_name": f"shared/{name}",
        "private": False,
        "default_branch": "main",
        "clone_url": f"https://github.com/shared/{name}.git",
    }
    payload.update(overrides)
    return payload


async def _make_user(session: AsyncSession, github_user_id: int, username: str) -> User:
    user = User(
        github_user_id=github_user_id,
        github_username=username,
        encrypted_token=encrypt_token(f"gho_token_{github_user_id}"),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    # refresh() re-opens a transaction; end it so the session starts idle.
    await session.commit()
    return user


async def _count_repositories(session: AsyncSession) -> int:
    result = await session.execute(select(Repository))
    return len(result.scalars().all())


# --- atomicity (6.3) ---


@pytest.mark.asyncio
@respx.mock
async def test_mid_loop_failure_commits_nothing(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
):
    """One bad repository must not leave a partial set behind."""
    user = await _make_user(db_session, 60001, "atomic_user")
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200,
        json=[_gh_repo(1, "one"), _gh_repo(2, "two"), _gh_repo(3, "three")],
    )

    calls = {"n": 0}
    real_upsert = RepositoryService._upsert_repository.__func__

    async def flaky_upsert(session, user, gh_repo):
        calls["n"] += 1
        if calls["n"] == 2:
            raise RuntimeError("simulated failure on the second repository")
        return await real_upsert(RepositoryService, session, user, gh_repo)

    monkeypatch.setattr(RepositoryService, "_upsert_repository", flaky_upsert)

    with pytest.raises(RuntimeError, match="simulated failure"):
        await RepositoryService.sync_repositories(session=db_session, user=user)

    assert calls["n"] == 2, "the loop should stop at the failure"
    assert await _count_repositories(db_session) == 0, (
        "the successfully upserted first repository must be rolled back"
    )


@pytest.mark.asyncio
@respx.mock
async def test_failed_sync_leaves_the_session_usable(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
):
    """After a rollback the session must accept new work, not stay poisoned."""
    user = await _make_user(db_session, 60002, "recover_user")

    async def always_fail(session, user, gh_repo):
        raise RuntimeError("boom")

    monkeypatch.setattr(RepositoryService, "_upsert_repository", always_fail)
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(1, "one")]
    )

    user_id = user.id  # captured before the rollback expires the instance
    with pytest.raises(RuntimeError):
        await RepositoryService.sync_repositories(session=db_session, user=user)

    # The rolled-back session can still commit.
    db_session.add(
        Repository(
            github_repo_id=999,
            full_name="later/work",
            default_branch="main",
            clone_url="https://github.com/later/work.git",
            owner_id=user_id,
        )
    )
    await db_session.commit()
    assert await _count_repositories(db_session) == 1


# --- duplicate-key race (6.4) ---


@pytest.mark.asyncio
@respx.mock
async def test_concurrent_sync_of_same_repo_by_different_users_both_succeed(
    db_session: AsyncSession,
):
    """Two users with access to one repository each keep their own row."""
    user_a = await _make_user(db_session, 70001, "race_a")
    user_b = await _make_user(db_session, 70002, "race_b")

    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(4242, "contended")]
    )

    result_a = await RepositoryService.sync_repositories(session=db_session, user=user_a)
    result_b = await RepositoryService.sync_repositories(session=db_session, user=user_b)

    assert len(result_a) == 1
    assert len(result_b) == 1
    assert result_a[0].id != result_b[0].id

    rows = (
        await db_session.execute(select(Repository).where(Repository.github_repo_id == 4242))
    ).scalars().all()
    assert len(rows) == 2
    assert {str(r.owner_id) for r in rows} == {str(user_a.id), str(user_b.id)}


@pytest.mark.asyncio
@respx.mock
async def test_duplicate_key_race_reselects_and_updates(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
):
    """A row that appears between SELECT and INSERT is recovered, not fatal.

    The lookup is made to miss, exactly as it would if another session inserted
    the same (repository, user) row a moment earlier. The INSERT then violates
    the composite constraint, and the savepoint must absorb it.
    """
    user = await _make_user(db_session, 70003, "racer")

    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(5150, "contended", full_name="shared/old-name")]
    )
    await RepositoryService.sync_repositories(session=db_session, user=user)

    real_find = RepositoryService._find_for_owner.__func__
    misses = {"remaining": 1}

    async def racing_find(session, owner_id, github_repo_id):
        # The first lookup misses, simulating the winner's row landing late.
        if misses["remaining"] > 0:
            misses["remaining"] -= 1
            return None
        return await real_find(RepositoryService, session, owner_id, github_repo_id)

    monkeypatch.setattr(RepositoryService, "_find_for_owner", racing_find)

    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(5150, "contended", full_name="shared/new-name")]
    )
    synced = await RepositoryService.sync_repositories(session=db_session, user=user)

    assert misses["remaining"] == 0, "the race must actually have been simulated"
    assert len(synced) == 1
    assert synced[0].full_name == "shared/new-name", "the winner's row must be updated"

    rows = (
        await db_session.execute(select(Repository).where(Repository.github_repo_id == 5150))
    ).scalars().all()
    assert len(rows) == 1, "no duplicate row may survive the race"
    assert rows[0].full_name == "shared/new-name"


# --- no session held across the network call (6.2) ---


@pytest.mark.asyncio
@respx.mock
async def test_no_database_session_is_held_while_fetching(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
):
    """The GitHub call must happen before any transaction is opened.

    Holding a pooled connection across a retry sleep would starve the pool, so
    the fetch is checked to happen while the session has no open transaction.
    """
    user = await _make_user(db_session, 80001, "pool_user")
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(1, "one")]
    )

    in_transaction_during_fetch: List[bool] = []

    from app.services.github import GitHubClient

    real_list_all = GitHubClient.list_all_repositories

    async def observing_list_all(self, *args, **kwargs):
        in_transaction_during_fetch.append(db_session.in_transaction())
        return await real_list_all(self, *args, **kwargs)

    monkeypatch.setattr(GitHubClient, "list_all_repositories", observing_list_all)

    await RepositoryService.sync_repositories(session=db_session, user=user)

    assert in_transaction_during_fetch == [False], (
        "the fetch ran inside a transaction, so the session was held open "
        "across the network call and its retry sleeps"
    )


@pytest.mark.asyncio
@respx.mock
async def test_github_client_is_closed_after_sync(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
):
    """The pooled client must not leak connections across syncs."""
    from app.services.github import GitHubClient

    user = await _make_user(db_session, 80002, "close_user")
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(1, "one")]
    )

    created = []
    real_client_cls = httpx.AsyncClient

    class TrackedClient(real_client_cls):
        def __init__(self, *args, **kwargs) -> None:
            super().__init__(*args, **kwargs)
            created.append(self)

    monkeypatch.setattr("app.services.github.httpx.AsyncClient", TrackedClient)

    await RepositoryService.sync_repositories(session=db_session, user=user)

    assert created, "the client should have been created"
    assert all(c.is_closed for c in created), "every owned client must be closed"
