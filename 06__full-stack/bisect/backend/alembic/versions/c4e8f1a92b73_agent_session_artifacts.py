"""agent_session_artifacts

Creates the two tables that hold the reviewable artifacts a session produces:
``agent_session_patches`` for the unified diff and
``agent_session_bisect_commits`` for the bisect timeline.

Both tables are purely additive. No existing table is altered, no existing row is
rewritten, and ``runs`` / ``run_steps`` are untouched. Rollback is a plain drop of
the two new tables.

``agent_session_patches.session_id`` is the primary key rather than a surrogate
id with a uniqueness constraint alongside it. A session has at most one patch, so
making the session the key states that directly and lets a second patch for the
same session replace the first without a delete-then-insert.

``agent_session_bisect_commits`` is row-per-commit rather than a JSON blob on the
session row because a timeline is read as an ordered sequence and grows with the
run. ``evaluation_index`` is unique per session, so the ordering is a property of
the store and no client can claim or collide on a position. The composite index
serves that ordered read directly.

``diff`` and ``test_output`` are ``Text`` with no length cap. Truncating a patch
would silently misrepresent the change under review, and a response-size limit
is better chosen with evidence than assumed here.

Revision ID: c4e8f1a92b73
Revises: ba25c798a0aa
Create Date: 2026-09-26 16:20:11.402517

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c4e8f1a92b73'
down_revision: Union[str, Sequence[str], None] = 'ba25c798a0aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'agent_session_patches',
        sa.Column('session_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('diff', sa.Text(), nullable=False),
        sa.Column('is_empty', sa.Boolean(), nullable=False),
        sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.Column('updated_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['agent_sessions.id'], ),
        sa.PrimaryKeyConstraint('session_id')
    )
    op.create_table(
        'agent_session_bisect_commits',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('session_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('evaluation_index', sa.Integer(), nullable=False),
        sa.Column('sha', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('short_sha', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('author', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('authored_at', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('verdict', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('is_culprit', sa.Boolean(), nullable=False),
        sa.Column('exit_code', sa.Integer(), nullable=False),
        sa.Column('test_output', sa.Text(), nullable=False),
        sa.Column('duration_seconds', sa.Float(), nullable=False),
        sa.Column('timed_out', sa.Boolean(), nullable=False),
        sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['agent_sessions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'evaluation_index', name='uq_agent_session_bisect_commits_session_evaluation')
    )
    op.create_index(op.f('ix_agent_session_bisect_commits_session_id'), 'agent_session_bisect_commits', ['session_id'], unique=False)
    op.create_index(op.f('ix_agent_session_bisect_commits_verdict'), 'agent_session_bisect_commits', ['verdict'], unique=False)
    op.create_index('ix_agent_session_bisect_commits_session_id_evaluation_index', 'agent_session_bisect_commits', ['session_id', 'evaluation_index'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_agent_session_bisect_commits_session_id_evaluation_index', table_name='agent_session_bisect_commits')
    op.drop_index(op.f('ix_agent_session_bisect_commits_verdict'), table_name='agent_session_bisect_commits')
    op.drop_index(op.f('ix_agent_session_bisect_commits_session_id'), table_name='agent_session_bisect_commits')
    op.drop_table('agent_session_bisect_commits')
    op.drop_table('agent_session_patches')
