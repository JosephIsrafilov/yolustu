"""Initial migration

Revision ID: a18f0b3882e4
Revises: 
Create Date: 2026-05-15 13:01:53.325455

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a18f0b3882e4'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_phone'), 'users', ['phone'], unique=True)

    # Create vehicles table
    op.create_table('vehicles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('brand', sa.String(length=50), nullable=False),
        sa.Column('model', sa.String(length=50), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('color', sa.String(length=30), nullable=False),
        sa.Column('plate_number', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create rides table
    op.create_table('rides',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('driver_id', sa.UUID(), nullable=False),
        sa.Column('vehicle_id', sa.UUID(), nullable=False),
        sa.Column('origin_location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, dimension=2, from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False),
        sa.Column('origin_city', sa.String(length=100), nullable=False),
        sa.Column('destination_location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, dimension=2, from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False),
        sa.Column('destination_city', sa.String(length=100), nullable=False),
        sa.Column('departure_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_seats', sa.Integer(), nullable=False),
        sa.Column('available_seats', sa.Integer(), nullable=False),
        sa.Column('price_per_seat', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['driver_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    # Redundant indexes removed - GeoAlchemy2 handles them

    # Create bookings table
    op.create_table('bookings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('ride_id', sa.UUID(), nullable=False),
        sa.Column('passenger_id', sa.UUID(), nullable=False),
        sa.Column('seats_booked', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['passenger_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['ride_id'], ['rides.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('ride_id', sa.UUID(), nullable=False),
        sa.Column('sender_id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['ride_id'], ['rides.id'], ),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create reviews table
    op.create_table('reviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('target_id', sa.UUID(), nullable=False),
        sa.Column('ride_id', sa.UUID(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['ride_id'], ['rides.id'], ),
        sa.ForeignKeyConstraint(['target_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('reviews')
    op.drop_table('messages')
    op.drop_table('bookings')
    op.drop_table('rides')
    op.drop_table('vehicles')
    op.drop_table('users')
