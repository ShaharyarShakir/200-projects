"""add video studio settings

Revision ID: c0c847bacd29
Revises: 82daa7bf779f
Create Date: 2026-08-12 07:53:35.084578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c0c847bacd29'
down_revision: Union[str, Sequence[str], None] = '82daa7bf779f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('scenes', sa.Column('dialogue', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('scenes', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')))
    op.add_column('videos', sa.Column('script', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('videos', sa.Column('aspect_ratio', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='9:16'))
    op.add_column('videos', sa.Column('width', sa.Integer(), nullable=False, server_default='1080'))
    op.add_column('videos', sa.Column('height', sa.Integer(), nullable=False, server_default='1920'))
    op.add_column('videos', sa.Column('fps', sa.Integer(), nullable=False, server_default='30'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('videos', 'fps')
    op.drop_column('videos', 'height')
    op.drop_column('videos', 'width')
    op.drop_column('videos', 'aspect_ratio')
    op.drop_column('videos', 'script')
    op.drop_column('scenes', 'updated_at')
    op.drop_column('scenes', 'dialogue')
