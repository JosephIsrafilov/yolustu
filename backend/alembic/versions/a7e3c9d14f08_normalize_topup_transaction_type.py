"""normalize_topup_transaction_type

Revision ID: a7e3c9d14f08
Revises: 9780909339f0
Create Date: 2026-06-11 16:05:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7e3c9d14f08"
down_revision: Union[str, None] = "9780909339f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Standardize legacy wallet top-ups on the canonical "adjustment" type.
    op.execute(
        sa.text(
            "UPDATE wallet_transactions SET type = 'adjustment' "
            "WHERE type = 'topup'"
        )
    )


def downgrade() -> None:
    # Restore the legacy "topup" label for credit-direction adjustments.
    op.execute(
        sa.text(
            "UPDATE wallet_transactions SET type = 'topup' "
            "WHERE type = 'adjustment' AND direction = 'credit'"
        )
    )
