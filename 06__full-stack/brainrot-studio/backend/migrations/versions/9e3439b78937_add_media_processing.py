"""add media processing

Revision ID: 9e3439b78937
Revises: d7e6c3bbcfe5
Create Date: 2026-08-12 08:28:06.624406

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '9e3439b78937'
down_revision: Union[str, Sequence[str], None] = 'd7e6c3bbcfe5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create enum types explicitly first
    asset_processing_status_enum = sa.Enum(
        'PENDING', 'PROCESSING', 'READY', 'FAILED', name='assetprocessingstatus'
    )
    asset_processing_status_enum.create(op.get_bind(), checkfirst=True)

    asset_purpose_enum = sa.Enum(
        'ORIGINAL', 'THUMBNAIL', 'PREVIEW', 'PROXY', 'WAVEFORM', 'RENDER', name='assetpurpose'
    )
    asset_purpose_enum.create(op.get_bind(), checkfirst=True)

    op.create_table('media_jobs',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('asset_id', sa.Uuid(), nullable=False),
    sa.Column('job_type', sa.Enum('PROBE', 'THUMBNAIL', 'PREVIEW', 'WAVEFORM', name='mediajobtype'), nullable=False),
    sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='mediajobstatus'), nullable=False),
    sa.Column('attempts', sa.Integer(), nullable=False),
    sa.Column('error', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('started_at', sa.DateTime(), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_media_jobs_asset_id'), 'media_jobs', ['asset_id'], unique=False)
    op.create_index(op.f('ix_media_jobs_status'), 'media_jobs', ['status'], unique=False)

    op.add_column('assets', sa.Column('processing_status', asset_processing_status_enum, nullable=False, server_default='PENDING'))
    op.add_column('assets', sa.Column('processing_error', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('assets', sa.Column('purpose', asset_purpose_enum, nullable=False, server_default='ORIGINAL'))
    op.add_column('assets', sa.Column('parent_asset_id', sa.Uuid(), nullable=True))

    op.create_index(op.f('ix_assets_parent_asset_id'), 'assets', ['parent_asset_id'], unique=False)
    op.create_index(op.f('ix_assets_processing_status'), 'assets', ['processing_status'], unique=False)
    op.create_index(op.f('ix_assets_purpose'), 'assets', ['purpose'], unique=False)
    op.create_index(op.f('ix_assets_video_id'), 'assets', ['video_id'], unique=False)
    op.create_foreign_key('fk_assets_parent_asset_id', 'assets', 'assets', ['parent_asset_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_assets_parent_asset_id', 'assets', type_='foreignkey')
    op.drop_index(op.f('ix_assets_video_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_purpose'), table_name='assets')
    op.drop_index(op.f('ix_assets_processing_status'), table_name='assets')
    op.drop_index(op.f('ix_assets_parent_asset_id'), table_name='assets')
    op.drop_column('assets', 'parent_asset_id')
    op.drop_column('assets', 'purpose')
    op.drop_column('assets', 'processing_error')
    op.drop_column('assets', 'processing_status')
    op.drop_index(op.f('ix_media_jobs_status'), table_name='media_jobs')
    op.drop_index(op.f('ix_media_jobs_asset_id'), table_name='media_jobs')
    op.drop_table('media_jobs')
