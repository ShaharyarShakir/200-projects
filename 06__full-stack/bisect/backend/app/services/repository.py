from typing import List, Optional, Tuple
import uuid
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.errors import BisectError
from app.core.logging import logger
from app.core.security import decrypt_token
from app.models.repository import Repository
from app.models.user import User, utc_now
from app.services.github import GitHubClient


class RepositoryService:
    """Service handling repository synchronization and queries."""

    @classmethod
    async def sync_repositories(
        cls,
        session: AsyncSession,
        user: User,
    ) -> List[Repository]:
        """Fetch all user repositories from GitHub and upsert into database."""
        if not user.encrypted_token:
            raise BisectError("GitHub account is not connected: missing access token")

        try:
            raw_token = decrypt_token(user.encrypted_token)
        except Exception as exc:
            logger.error(f"Failed to decrypt GitHub token for user {user.id}: {exc}")
            raise BisectError("Failed to decrypt stored GitHub credentials") from exc

        client = GitHubClient(access_token=raw_token)
        github_repos = await client.list_all_repositories()

        synced_records: List[Repository] = []
        for gh_repo in github_repos:
            stmt = select(Repository).where(Repository.github_repo_id == gh_repo.id)
            res = await session.execute(stmt)
            existing_repo = res.scalars().first()

            if existing_repo:
                existing_repo.full_name = gh_repo.full_name
                existing_repo.default_branch = gh_repo.default_branch
                existing_repo.clone_url = gh_repo.clone_url
                existing_repo.is_private = gh_repo.is_private
                existing_repo.owner_id = user.id
                existing_repo.updated_at = utc_now()
                session.add(existing_repo)
                synced_records.append(existing_repo)
            else:
                new_repo = Repository(
                    github_repo_id=gh_repo.id,
                    full_name=gh_repo.full_name,
                    default_branch=gh_repo.default_branch,
                    clone_url=gh_repo.clone_url,
                    is_private=gh_repo.is_private,
                    owner_id=user.id,
                )
                session.add(new_repo)
                synced_records.append(new_repo)

        await session.commit()
        for repo in synced_records:
            await session.refresh(repo)

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
