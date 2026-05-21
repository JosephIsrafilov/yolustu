"""Add device_tokens table

Revision ID: 8bbf5c7af83f
Revises: e5c1a8d9b2f3
Create Date: 2026-05-21 13:57:09.192118

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '8bbf5c7af83f'
down_revision: Union[str, None] = 'e5c1a8d9b2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('device_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('token', sa.String(length=255), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_device_tokens_token'), 'device_tokens', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_device_tokens_token'), table_name='device_tokens')
    op.drop_table('device_tokens')
