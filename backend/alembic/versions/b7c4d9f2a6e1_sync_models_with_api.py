"""Sync database schema with current API models

Revision ID: b7c4d9f2a6e1
Revises: a18f0b3882e4
Create Date: 2026-05-16 00:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c4d9f2a6e1"
down_revision: Union[str, None] = "a18f0b3882e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("language", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("total_rides", sa.Integer(), nullable=True))

    op.add_column("rides", sa.Column("intermediate_cities", sa.Text(), nullable=True))
    op.add_column("rides", sa.Column("smoking_allowed", sa.Boolean(), nullable=True))
    op.add_column("rides", sa.Column("pets_allowed", sa.Boolean(), nullable=True))
    op.add_column("rides", sa.Column("music_allowed", sa.Boolean(), nullable=True))
    op.add_column("rides", sa.Column("female_only", sa.Boolean(), nullable=True))

    op.add_column("bookings", sa.Column("total_price", sa.Float(), nullable=True))

    op.execute("UPDATE users SET language = 'az' WHERE language IS NULL")
    op.execute("UPDATE users SET total_rides = 0 WHERE total_rides IS NULL")
    op.execute("UPDATE rides SET smoking_allowed = false WHERE smoking_allowed IS NULL")
    op.execute("UPDATE rides SET pets_allowed = false WHERE pets_allowed IS NULL")
    op.execute("UPDATE rides SET music_allowed = true WHERE music_allowed IS NULL")
    op.execute("UPDATE rides SET female_only = false WHERE female_only IS NULL")


def downgrade() -> None:
    op.drop_column("bookings", "total_price")

    op.drop_column("rides", "female_only")
    op.drop_column("rides", "music_allowed")
    op.drop_column("rides", "pets_allowed")
    op.drop_column("rides", "smoking_allowed")
    op.drop_column("rides", "intermediate_cities")

    op.drop_column("users", "total_rides")
    op.drop_column("users", "language")
    op.drop_column("users", "avatar_url")
