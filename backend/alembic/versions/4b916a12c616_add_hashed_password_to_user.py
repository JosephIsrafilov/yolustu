"""Add hashed_password to User

Revision ID: 4b916a12c616
Revises: b7c4d9f2a6e1
Create Date: 2026-05-16 21:18:36.131400

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '4b916a12c616'
down_revision: Union[str, None] = 'b7c4d9f2a6e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=True))
    


def downgrade() -> None:
    
    op.drop_column('users', 'hashed_password')
    
