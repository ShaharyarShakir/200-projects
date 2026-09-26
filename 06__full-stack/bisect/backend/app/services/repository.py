from typing import List, Optional, Tuple
import uuid
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.errors import BisectError, GitHubAccountNotConnectedError
from app.core.logging import logger
from app.core.security import decrypt_token
from app.models.repository import Repository
from app.models.user import User, utc_now
from app.services.github import GitHubClient, GitHubRepository


class RepositoryService:
    """Service handling repository synchronization and queries."""

    @classmethod
    async def _find_for_owner(
        cls,
        session: AsyncSession,
        owner_id: uuid.UUID,
        github_repo_id: int,
    ) -> Optional[Repository]:
        """Look up one repository scoped to its owner.

        Scoping by owner is what keeps two users who both have access to the
        same GitHub repository from colliding on a single row.
        """
        stmt = select(Repository).where(
            Repository.github_repo_id == github_repo_id,
            Repository.owner_id == owner_id,
        )
        res = await session.execute(stmt)
        return res.scalars().first()

    @staticmethod
    def _apply_github_fields(repo: Repository, gh_repo: GitHubRepository) -> Repository:
        """Copy mutable GitHub metadata onto a repository row."""
        repo.full_name = gh_repo.full_name
        repo.default_branch = gh_repo.default_branch
        repo.clone_url = gh_repo.clone_url
        repo.is_private = gh_repo.is_private
        repo.updated_at = utc_now()
        return repo

    @classmethod
    async def _upsert_repository(
        cls,
        session: AsyncSession,
        user: User,
        gh_repo: GitHubRepository,
    ) -> Repository:
        """Insert or update one repository inside its own savepoint.

        The savepoint confines a failure to a single row. Without it, one bad
        repository would poison the whole transaction and abort the sync.
        """
        try:
            async with session.begin_nested():
                existing = await cls._find_for_owner(session, user.id, gh_repo.id)
                if existing is not None:
                    repo = cls._apply_github_fields(existing, gh_repo)
                else:
                    repo = Repository(
                        github_repo_id=gh_repo.id,
                        full_name=gh_repo.full_name,
                        default_branch=gh_repo.default_branch,
                        clone_url=gh_repo.clone_url,
                        is_private=gh_repo.is_private,
                        owner_id=user.id,
                    )
                session.add(repo)
            return repo
        except IntegrityError:
            # A concurrent sync of the same (repository, user) won the race and
            # inserted the row between our SELECT and INSERT. The savepoint has
            # already been rolled back, so the session is usable again: re-select
            # the winner and update it instead of failing the whole sync.
            logger.warning(
                f"Concurrent sync detected for repository {gh_repo.id}, "
                f"re-selecting and updating"
            )
            existing = await cls._find_for_owner(session, user.id, gh_repo.id)
            if existing is None:
                # Not a duplicate-key race; let the original error surface.
                raise
            return cls._apply_github_fields(existing, gh_repo)

    @classmethod
    async def sync_repositories(
        cls,
        session: AsyncSession,
        user: User,
    ) -> List[Repository]:
        """Fetch all user repositories from GitHub and upsert into database."""
        if not user.encrypted_token:
            raise GitHubAccountNotConnectedError(
                "GitHub account is not connected: missing access token"
            )

        try:
            raw_token = decrypt_token(user.encrypted_token)
        except Exception as exc:
            logger.exception(f"Failed to decrypt GitHub token for user {user.id}")
            raise BisectError("Failed to decrypt stored GitHub credentials") from exc

        # Fetch from GitHub before touching the database. The retry loop can
        # sleep for seconds on a rate limit, and holding a pooled connection
        # open for that duration would starve every other request.
        async with GitHubClient(access_token=raw_token) as client:
            github_repos = await client.list_all_repositories()

        if not github_repos:
            # Nothing to write, so open no transaction at all.
            return []

        synced_records: List[Repository] = []
        try:
            # The savepoint held open across the loop is a barrier, not an
            # optimization. On SQLite, releasing the outermost savepoint commits
            # the transaction, so per-row savepoints without a barrier would
            # commit each row as it went and leave a partial set behind when a
            # later row failed. An explicit session.begin() is deliberately not
            # used: the auth dependency already opened a transaction on this
            # shared session, and begin() would reject it.
            async with session.begin_nested():
                for gh_repo in github_repos:
                    synced_records.append(
                        await cls._upsert_repository(session, user, gh_repo)
                    )
            await session.commit()
        except Exception:
            # All-or-nothing: a mid-loop failure must not leave a partial
            # repository set behind.
            await session.rollback()
            raise

        return synced_records

    @classmethod
    async def list_repositories(
        cls,
        session: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Repository], int]:
        """List synchronized repositories for a user with pagination and sorting."""
        # Total count query
        count_stmt = select(func.count(Repository.id)).where(Repository.owner_id == user_id)
        count_res = await session.execute(count_stmt)
        total = count_res.scalar() or 0

        # Query page records ordered by most recent updated_at
        stmt = (
            select(Repository)
            .where(Repository.owner_id == user_id)
            .order_by(Repository.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        res = await session.execute(stmt)
        items = list(res.scalars().all())

        return items, total

    @classmethod
    async def get_repository_by_id(
        cls,
        session: AsyncSession,
        repo_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Optional[Repository]:
        """Retrieve a specific repository owned by the authenticated user."""
        stmt = select(Repository).where(
            Repository.id == repo_id,
            Repository.owner_id == user_id,
        )
        res = await session.execute(stmt)
        return res.scalars().first()
