"""add_verification_ai_review

Revision ID: f7b2e9c4d8a1
Revises: 0de909ad39c1
Create Date: 2026-06-14 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7b2e9c4d8a1"
down_revision: Union[str, None] = "0de909ad39c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("verification_ai_review", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "verification_ai_review")
