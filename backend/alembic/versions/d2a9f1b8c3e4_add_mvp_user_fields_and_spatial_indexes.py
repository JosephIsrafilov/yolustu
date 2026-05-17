"""Add MVP user fields and ride spatial indexes

Revision ID: d2a9f1b8c3e4
Revises: 4b916a12c616
Create Date: 2026-05-17 19:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d2a9f1b8c3e4"
down_revision: Union[str, None] = "4b916a12c616"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("role", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("is_blocked", sa.Boolean(), nullable=True))

    op.execute("UPDATE users SET role = 'passenger' WHERE role IS NULL")
    op.execute("UPDATE users SET is_blocked = false WHERE is_blocked IS NULL")

    op.alter_column("users", "role", nullable=False)
    op.alter_column("users", "is_blocked", nullable=False)

    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_rides_origin_location "
        "ON rides USING gist (origin_location)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_rides_destination_location "
        "ON rides USING gist (destination_location)"
    )


def downgrade() -> None:
    op.drop_index("idx_rides_destination_location", table_name="rides")
    op.drop_index("idx_rides_origin_location", table_name="rides")

    op.drop_column("users", "is_blocked")
    op.drop_column("users", "bio")
    op.drop_column("users", "city")
    op.drop_column("users", "role")
