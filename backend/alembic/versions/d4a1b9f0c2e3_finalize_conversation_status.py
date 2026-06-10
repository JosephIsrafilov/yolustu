"""finalize conversation status column

Revision ID: d4a1b9f0c2e3
Revises: b304d5168637
Create Date: 2026-06-10 04:12:00.000000

"""

from typing import Sequence, Union

from alembic import op


revision: str = "d4a1b9f0c2e3"
down_revision: Union[str, None] = "b304d5168637"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'conversations'
                  AND column_name = 'support_status'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'conversations'
                  AND column_name = 'status'
            ) THEN
                ALTER TABLE conversations RENAME COLUMN support_status TO status;
            END IF;
        END $$;
        """
    )
    op.execute("ALTER TABLE conversations ALTER COLUMN status SET DEFAULT 'open'")
    op.execute("UPDATE conversations SET status = 'open' WHERE status IS NULL")
    op.execute("ALTER TABLE conversations ALTER COLUMN status SET NOT NULL")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_conversations_booking_id "
        "ON conversations (booking_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_conversations_ride_id ON conversations (ride_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_conversations_type ON conversations (type)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_conversation_participants_user_id "
        "ON conversation_participants (user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_messages_conversation_id "
        "ON messages (conversation_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_messages_created_at ON messages (created_at)"
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'conversations'
                  AND column_name = 'status'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'conversations'
                  AND column_name = 'support_status'
            ) THEN
                ALTER TABLE conversations RENAME COLUMN status TO support_status;
            END IF;
        END $$;
        """
    )
