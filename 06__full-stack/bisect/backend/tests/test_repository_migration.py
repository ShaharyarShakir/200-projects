"""Tests for the per-user repository uniqueness migration and model agreement.

The migration must agree with the SQLModel metadata, because the test suite
builds its schema with ``SQLModel.metadata.create_all`` on SQLite while the
local development database is built by Alembic. A divergence between the two
would let tests pass against a schema production cannot use.
"""

import pytest
from sqlalchemy import UniqueConstraint, inspect
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from app.models import Repository  # noqa: F401  (import registers the table)

TABLE_NAME = "repositories"
INDEX_NAME = "ix_repositories_github_repo_id"
CONSTRAINT_NAME = "uq_repositories_github_repo_id_owner_id"


@pytest.fixture(scope="function")
def repository_metadata():
    return Repository.__table__


def test_model_has_composite_unique_constraint() -> None:
    constraints = [
        c
        for c in Repository.__table__.constraints
        if isinstance(c, UniqueConstraint) and c.name == CONSTRAINT_NAME
    ]

    assert len(constraints) == 1
    assert [col.name for col in constraints[0].columns] == [
        "github_repo_id",
        "owner_id",
    ]


def test_model_does_not_make_github_repo_id_unique_alone() -> None:
    """The single column must stay indexed but not unique."""
    github_repo_id = Repository.__table__.c.github_repo_id

    assert github_repo_id.unique is not True
    assert github_repo_id.index is True


@pytest.mark.asyncio
async def test_created_schema_allows_two_users_to_share_a_repository() -> None:
    """The point of the migration: one repository, two owners, two rows."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)

            indexes = await conn.run_sync(
                lambda sync_conn: {
                    ix["name"]: ix for ix in inspect(sync_conn).get_indexes(TABLE_NAME)
                }
            )
            unique_constraints = await conn.run_sync(
                lambda sync_conn: inspect(sync_conn).get_unique_constraints(TABLE_NAME)
            )

        # The single-column index exists but is no longer unique. SQLite
        # reflection reports uniqueness as 0/1 rather than False/True, so
        # assert falsiness rather than identity.
        assert INDEX_NAME in indexes
        assert not indexes[INDEX_NAME]["unique"]

        # The composite constraint exists and is enforced.
        assert any(
            uc["name"] == CONSTRAINT_NAME
            and set(uc["column_names"]) == {"github_repo_id", "owner_id"}
            for uc in unique_constraints
        ), unique_constraints
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_composite_constraint_rejects_a_duplicate_for_one_owner() -> None:
    """Uniqueness is per (repo, user), so a repeat sync cannot duplicate."""
    import uuid

    from sqlalchemy import text

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)

            user_id = uuid.uuid4()
            await conn.execute(
                text(
                    "INSERT INTO users (id, github_user_id, github_username,"
                    " created_at, updated_at) VALUES (:id, 1, 'u',"
                    " '2026-01-01 00:00:00', '2026-01-01 00:00:00')"
                ),
                {"id": user_id.hex},
            )

            insert = text(
                "INSERT INTO repositories (github_repo_id, full_name, default_branch,"
                " clone_url, is_private, id, owner_id, created_at, updated_at)"
                " VALUES (42, 'a/b', 'main', 'https://x', 0, :id, :owner,"
                " '2026-01-01 00:00:00', '2026-01-01 00:00:00')"
            )
            await conn.execute(insert, {"id": uuid.uuid4().hex, "owner": user_id.hex})

            # Same user, same repository: rejected.
            with pytest.raises(Exception):
                await conn.execute(insert, {"id": uuid.uuid4().hex, "owner": user_id.hex})

            # Different user, same repository: allowed.
            other_id = uuid.uuid4()
            await conn.execute(
                text(
                    "INSERT INTO users (id, github_user_id, github_username,"
                    " created_at, updated_at) VALUES (:id, 2, 'v',"
                    " '2026-01-01 00:00:00', '2026-01-01 00:00:00')"
                ),
                {"id": other_id.hex},
            )
            await conn.execute(
                insert, {"id": uuid.uuid4().hex, "owner": other_id.hex}
            )

            count = (
                await conn.execute(
                    text("SELECT COUNT(*) FROM repositories WHERE github_repo_id = 42")
                )
            ).scalar()
            assert count == 2
    finally:
        await engine.dispose()


def test_migration_drops_index_before_adding_composite_constraint() -> None:
    """Ordering is load-bearing, so it is asserted on the migration source.

    The composite constraint is strictly weaker than the single-column unique
    index. Creating it while the stronger uniqueness still holds is rejected by
    the database, so the drop has to come first.
    """
    import pathlib

    source = (
        pathlib.Path(__file__).resolve().parents[1]
        / "alembic"
        / "versions"
        / "b7e2c4a91d38_repositories_per_user_unique.py"
    ).read_text()

    upgrade_body = source.split("def upgrade")[1].split("def downgrade")[0]

    drop_index_at = upgrade_body.index("batch_op.drop_index")
    create_composite_at = upgrade_body.index("batch_op.create_unique_constraint")

    assert drop_index_at < create_composite_at, (
        "the single-column unique index must be dropped before the composite "
        "constraint is created, or the migration fails"
    )
