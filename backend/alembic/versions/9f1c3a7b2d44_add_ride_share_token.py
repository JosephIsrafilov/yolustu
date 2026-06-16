"""add_ride_share_token

Revision ID: 9f1c3a7b2d44
Revises: f7b2e9c4d8a1
Create Date: 2026-06-16 15:55:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f1c3a7b2d44"
down_revision: Union[str, None] = "f7b2e9c4d8a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("rides", sa.Column("share_token", sa.String(length=64), nullable=True))
    op.execute(
        """
        UPDATE rides
        SET share_token = md5(id::text || clock_timestamp()::text || random()::text)
        WHERE share_token IS NULL
        """
    )
    op.alter_column("rides", "share_token", existing_type=sa.String(length=64), nullable=False)
    op.create_index("ix_rides_share_token", "rides", ["share_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_rides_share_token", table_name="rides")
    op.drop_column("rides", "share_token")
