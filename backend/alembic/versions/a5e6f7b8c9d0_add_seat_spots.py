"""add seat spots

Revision ID: a5e6f7b8c9d0
Revises: a1b2c3d4e5f6
Create Date: 2026-06-19 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a5e6f7b8c9d0"
down_revision: Union[str, None] = "9f1c3a7b2d44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("rides", sa.Column("available_spots", sa.JSON(), nullable=True))
    op.add_column("bookings", sa.Column("selected_spots", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("bookings", "selected_spots")
    op.drop_column("rides", "available_spots")
