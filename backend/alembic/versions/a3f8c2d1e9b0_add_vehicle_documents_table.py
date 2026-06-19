"""Add vehicle_documents table

Revision ID: a3f8c2d1e9b0
Revises: 29713c6a61f9
Create Date: 2026-06-19 16:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3f8c2d1e9b0"
down_revision: Union[str, None] = "29713c6a61f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vehicle_documents",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "vehicle_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column("document_type", sa.String(length=50), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column(
            "status", sa.String(length=20), server_default="pending", nullable=False
        ),
        sa.Column(
            "processing_status",
            sa.String(length=20),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_recommendation", sa.String(length=20), nullable=True),
        sa.Column("ai_confidence", sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column("ai_issues", sa.JSON(), nullable=True),
        sa.Column("ai_metadata", sa.JSON(), nullable=True),
        sa.Column(
            "reviewed_by", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_current", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.CheckConstraint("version >= 1", name="ck_vehicle_documents_version"),
        sa.CheckConstraint(
            "document_type IN ('registration', 'insurance', 'inspection')",
            name="ck_vehicle_documents_type",
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_vehicle_documents_status",
        ),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_vehicle_documents_vehicle_id", "vehicle_documents", ["vehicle_id"]
    )
    op.create_index(
        "uq_vehicle_documents_current",
        "vehicle_documents",
        ["vehicle_id", "document_type"],
        unique=True,
        postgresql_where=sa.text("is_current = true"),
    )


def downgrade() -> None:
    op.drop_index("uq_vehicle_documents_current", table_name="vehicle_documents")
    op.drop_index("ix_vehicle_documents_vehicle_id", table_name="vehicle_documents")
    op.drop_table("vehicle_documents")
