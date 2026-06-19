"""Add provider_events table for webhook idempotency

Revision ID: b4e9d3f2a1c7
Revises: a3f8c2d1e9b0
Create Date: 2026-06-19 17:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4e9d3f2a1c7"
down_revision: Union[str, None] = "a3f8c2d1e9b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "provider_events",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("event_key", sa.String(length=255), nullable=False),
        sa.Column(
            "payment_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True
        ),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("raw", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_provider_events_payment_id", "provider_events", ["payment_id"])
    op.create_index(
        "ix_provider_events_provider_event_key",
        "provider_events",
        ["provider", "event_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_provider_events_provider_event_key", table_name="provider_events")
    op.drop_index("ix_provider_events_payment_id", table_name="provider_events")
    op.drop_table("provider_events")
