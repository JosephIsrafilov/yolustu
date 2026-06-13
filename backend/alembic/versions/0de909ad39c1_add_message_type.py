"""add_message_type

Revision ID: 0de909ad39c1
Revises: 049a8aaaaa44
Create Date: 2026-06-14 01:22:27.361420

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0de909ad39c1'
down_revision: Union[str, None] = '049a8aaaaa44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("message_type", sa.String(length=50), nullable=False, server_default="text"))
    op.add_column("messages", sa.Column("attachments", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "attachments")
    op.drop_column("messages", "message_type")
