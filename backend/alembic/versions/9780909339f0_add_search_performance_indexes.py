"""add_search_performance_indexes

Revision ID: 9780909339f0
Revises: d4a1b9f0c2e3
Create Date: 2026-06-11 15:10:44.732670

"""
from typing import Sequence, Union

from alembic import op


revision: str = '9780909339f0'
down_revision: Union[str, None] = 'd4a1b9f0c2e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Bookings - status filtering and sorting
    op.create_index('ix_bookings_status', 'bookings', ['status'], unique=False)
    op.create_index('ix_bookings_created_at', 'bookings', ['created_at'], unique=False)

    # Rides - city-based search (text search on origin/destination cities)
    op.create_index('ix_rides_origin_city', 'rides', ['origin_city'], unique=False)
    op.create_index('ix_rides_destination_city', 'rides', ['destination_city'], unique=False)

    # Rides - composite index for common search patterns
    op.create_index(
        'ix_rides_status_departure',
        'rides',
        ['status', 'departure_time'],
        unique=False
    )

    # Rides - available seats filtering
    op.create_index('ix_rides_available_seats', 'rides', ['available_seats'], unique=False)

    # Users - role-based queries
    op.create_index('ix_users_role', 'users', ['role'], unique=False)

    # Users - verification filtering
    op.create_index('ix_users_verification_status', 'users', ['verification_status'], unique=False)
    op.create_index('ix_users_is_blocked', 'users', ['is_blocked'], unique=False)

    # Reviews - target user lookups
    op.create_index('ix_reviews_target_id', 'reviews', ['target_id'], unique=False)
    op.create_index('ix_reviews_author_id', 'reviews', ['author_id'], unique=False)
    op.create_index('ix_reviews_ride_id', 'reviews', ['ride_id'], unique=False)

    # Payments - status filtering for admin queries
    op.create_index('ix_payments_status', 'payments', ['status'], unique=False)
    op.create_index('ix_payments_passenger_id', 'payments', ['passenger_id'], unique=False)
    op.create_index('ix_payments_driver_id', 'payments', ['driver_id'], unique=False)
    op.create_index('ix_payments_created_at', 'payments', ['created_at'], unique=False)

    # Wallet transactions - type and status filtering
    op.create_index('ix_wallet_transactions_type', 'wallet_transactions', ['type'], unique=False)
    op.create_index('ix_wallet_transactions_status', 'wallet_transactions', ['status'], unique=False)

    # Messages - sender lookups
    op.create_index('ix_messages_sender_id', 'messages', ['sender_id'], unique=False)
    op.create_index('ix_messages_ride_id', 'messages', ['ride_id'], unique=False)

    # Conversations - status filtering
    op.create_index('ix_conversations_status', 'conversations', ['status'], unique=False)
    op.create_index('ix_conversations_created_by_user_id', 'conversations', ['created_by_user_id'], unique=False)

    # User badges - user lookups
    op.create_index('ix_user_badges_user_id', 'user_badges', ['user_id'], unique=False)
    op.create_index('ix_user_badges_badge_id', 'user_badges', ['badge_id'], unique=False)


def downgrade() -> None:
    # Drop indexes in reverse order
    op.drop_index('ix_user_badges_badge_id', table_name='user_badges')
    op.drop_index('ix_user_badges_user_id', table_name='user_badges')
    op.drop_index('ix_conversations_created_by_user_id', table_name='conversations')
    op.drop_index('ix_conversations_status', table_name='conversations')
    op.drop_index('ix_messages_ride_id', table_name='messages')
    op.drop_index('ix_messages_sender_id', table_name='messages')
    op.drop_index('ix_wallet_transactions_status', table_name='wallet_transactions')
    op.drop_index('ix_wallet_transactions_type', table_name='wallet_transactions')
    op.drop_index('ix_payments_created_at', table_name='payments')
    op.drop_index('ix_payments_driver_id', table_name='payments')
    op.drop_index('ix_payments_passenger_id', table_name='payments')
    op.drop_index('ix_payments_status', table_name='payments')
    op.drop_index('ix_reviews_ride_id', table_name='reviews')
    op.drop_index('ix_reviews_author_id', table_name='reviews')
    op.drop_index('ix_reviews_target_id', table_name='reviews')
    op.drop_index('ix_users_is_blocked', table_name='users')
    op.drop_index('ix_users_verification_status', table_name='users')
    op.drop_index('ix_users_role', table_name='users')
    op.drop_index('ix_rides_available_seats', table_name='rides')
    op.drop_index('ix_rides_status_departure', table_name='rides')
    op.drop_index('ix_rides_destination_city', table_name='rides')
    op.drop_index('ix_rides_origin_city', table_name='rides')
    op.drop_index('ix_bookings_created_at', table_name='bookings')
    op.drop_index('ix_bookings_status', table_name='bookings')
