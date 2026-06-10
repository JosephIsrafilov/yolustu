"""add conversations

Revision ID: b304d5168637
Revises: b36aff3634ba
Create Date: 2026-06-10 03:35:23.548487

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "b304d5168637"
down_revision: Union[str, None] = "b36aff3634ba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("ride_id", sa.UUID(), nullable=True),
        sa.Column("booking_id", sa.UUID(), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column(
            "support_status",
            sa.String(length=50),
            nullable=False,
            server_default="open",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["booking_id"], ["bookings.id"], name="fk_conversations_booking_id"
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
            name="fk_conversations_created_by_user_id",
        ),
        sa.ForeignKeyConstraint(
            ["ride_id"], ["rides.id"], name="fk_conversations_ride_id"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversations_booking_id", "conversations", ["booking_id"])
    op.create_index("ix_conversations_ride_id", "conversations", ["ride_id"])
    op.create_index("ix_conversations_type", "conversations", ["type"])

    op.create_table(
        "conversation_participants",
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            name="fk_conversation_participants_conversation_id",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_conversation_participants_user_id"
        ),
        sa.PrimaryKeyConstraint("conversation_id", "user_id"),
    )
    op.create_index(
        "ix_conversation_participants_user_id",
        "conversation_participants",
        ["user_id"],
    )

    op.add_column("messages", sa.Column("conversation_id", sa.UUID(), nullable=True))
    op.add_column(
        "messages", sa.Column("read_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.alter_column("messages", "ride_id", existing_type=sa.UUID(), nullable=True)
    op.create_foreign_key(
        "fk_messages_conversation_id",
        "messages",
        "conversations",
        ["conversation_id"],
        ["id"],
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])

    op.execute(
        """
        INSERT INTO conversations (
            id, type, ride_id, created_by_user_id, support_status, created_at, updated_at
        )
        SELECT
            gen_random_uuid(),
            'ride',
            m.ride_id,
            COALESCE(r.driver_id, (array_agg(m.sender_id ORDER BY m.created_at))[1]),
            'open',
            MIN(m.created_at),
            MAX(m.created_at)
        FROM messages m
        LEFT JOIN rides r ON r.id = m.ride_id
        WHERE m.ride_id IS NOT NULL AND m.conversation_id IS NULL
        GROUP BY m.ride_id, r.driver_id
        """
    )
    op.execute(
        """
        UPDATE messages AS m
        SET conversation_id = c.id
        FROM conversations AS c
        WHERE c.type = 'ride'
          AND c.ride_id = m.ride_id
          AND m.conversation_id IS NULL
        """
    )
    op.execute(
        """
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        SELECT DISTINCT c.id, r.driver_id, 'driver'
        FROM conversations c
        JOIN rides r ON r.id = c.ride_id
        WHERE c.type = 'ride' AND r.driver_id IS NOT NULL
        ON CONFLICT DO NOTHING
        """
    )
    op.execute(
        """
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        SELECT DISTINCT c.id, m.sender_id, 'participant'
        FROM conversations c
        JOIN messages m ON m.conversation_id = c.id
        WHERE c.type = 'ride'
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index("ix_messages_created_at", table_name="messages")
    op.drop_index("ix_messages_conversation_id", table_name="messages")
    op.drop_constraint("fk_messages_conversation_id", "messages", type_="foreignkey")
    op.alter_column("messages", "ride_id", existing_type=sa.UUID(), nullable=False)
    op.drop_column("messages", "read_at")
    op.drop_column("messages", "conversation_id")

    op.drop_index(
        "ix_conversation_participants_user_id", table_name="conversation_participants"
    )
    op.drop_table("conversation_participants")
    op.drop_index("ix_conversations_type", table_name="conversations")
    op.drop_index("ix_conversations_ride_id", table_name="conversations")
    op.drop_index("ix_conversations_booking_id", table_name="conversations")
    op.drop_table("conversations")
