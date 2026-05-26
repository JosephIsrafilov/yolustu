"""add gamification tables

Revision ID: c53c6572ad92
Revises: 085c1a369a91
Create Date: 2026-05-27 00:49:54.094906

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c53c6572ad92"
down_revision: Union[str, None] = "085c1a369a91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "badges",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon_url", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_badges_code"), "badges", ["code"], unique=True)
    op.create_table(
        "user_badges",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("badge_id", sa.UUID(), nullable=False),
        sa.Column(
            "awarded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["badge_id"], ["badges.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )


def downgrade() -> None:
    op.drop_table("user_badges")
    op.drop_index(op.f("ix_badges_code"), table_name="badges")
    op.drop_table("badges")
