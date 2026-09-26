"""repositories_per_user_unique

Replaces the unique index on ``repositories.github_repo_id`` with a composite
unique constraint on (``github_repo_id``, ``owner_id``).

A repository can be accessible to more than one Bisect user. With a unique
index on ``github_repo_id`` alone, a second user syncing a shared repository
cannot have their own row, which is why the sync service previously reassigned
``owner_id`` on the existing row and silently transferred ownership. The
composite constraint lets each user own a distinct record for the same
repository while still preventing a user from accumulating duplicates.

The single-column index is dropped before the composite constraint is created:
the composite is strictly weaker, so creating it first would fail on a database
that still has the stronger single-column uniqueness.

Batch mode is used throughout because the local development database is SQLite
(``sqlite+aiosqlite:///./bisect.db``) and SQLite cannot ALTER a table to add a
constraint. On PostgreSQL, batch mode issues ordinary ALTER statements.

Revision ID: b7e2c4a91d38
Revises: 461b70848be3
Create Date: 2026-09-25 22:20:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7e2c4a91d38"
down_revision: Union[str, Sequence[str], None] = "461b70848be3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_repositories_github_repo_id"
CONSTRAINT_NAME = "uq_repositories_github_repo_id_owner_id"
TABLE_NAME = "repositories"


def upgrade() -> None:
    with op.batch_alter_table(TABLE_NAME) as batch_op:
        # 1. Drop the single-column unique index. Dropping the index is what
        #    removes the uniqueness guarantee; the column keeps an index for
        #    lookups.
        batch_op.drop_index(INDEX_NAME)

        # 2. Recreate it non-uniquely under the same name so single-column
        #    lookups keep their index.
        batch_op.create_index(INDEX_NAME, ["github_repo_id"], unique=False)

        # 3. Only now add the composite constraint.
        batch_op.create_unique_constraint(
            CONSTRAINT_NAME, ["github_repo_id", "owner_id"]
        )


def downgrade() -> None:
    with op.batch_alter_table(TABLE_NAME) as batch_op:
        batch_op.drop_constraint(CONSTRAINT_NAME, type_="unique")
        batch_op.drop_index(INDEX_NAME)
        batch_op.create_index(INDEX_NAME, ["github_repo_id"], unique=True)
