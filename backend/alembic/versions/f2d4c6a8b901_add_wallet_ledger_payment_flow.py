"""add wallet ledger payment flow

Revision ID: f2d4c6a8b901
Revises: 5cd61f94c01b
Create Date: 2026-06-09 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f2d4c6a8b901"
down_revision: Union[str, None] = "5cd61f94c01b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("payments", sa.Column("passenger_id", sa.UUID(), nullable=True))
    op.add_column("payments", sa.Column("driver_id", sa.UUID(), nullable=True))
    op.add_column(
        "payments",
        sa.Column("service_fee", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "payments",
        sa.Column("driver_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "payments",
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="AZN"),
    )
    op.add_column(
        "payments",
        sa.Column("provider", sa.String(length=50), nullable=False, server_default="mock"),
    )
    op.add_column(
        "payments", sa.Column("provider_payment_id", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "payments",
        sa.Column("provider_checkout_url", sa.String(length=1024), nullable=True),
    )
    op.add_column(
        "payments", sa.Column("idempotency_key", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "payments", sa.Column("failure_reason", sa.String(length=500), nullable=True)
    )
    op.add_column("payments", sa.Column("metadata", sa.JSON(), nullable=True))
    op.add_column("payments", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "payments", sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True)
    )

    op.alter_column(
        "payments",
        "amount",
        existing_type=sa.Float(),
        type_=sa.Numeric(12, 2),
        existing_nullable=False,
        postgresql_using="amount::numeric(12,2)",
    )
    op.alter_column(
        "rides",
        "price_per_seat",
        existing_type=sa.Float(),
        type_=sa.Numeric(12, 2),
        existing_nullable=False,
        postgresql_using="price_per_seat::numeric(12,2)",
    )
    op.alter_column(
        "bookings",
        "total_price",
        existing_type=sa.Float(),
        type_=sa.Numeric(12, 2),
        existing_nullable=True,
        postgresql_using="total_price::numeric(12,2)",
    )
    op.execute("UPDATE payments SET status = 'succeeded' WHERE status = 'completed'")
    op.execute(
        """
        UPDATE payments p
        SET passenger_id = b.passenger_id,
            driver_id = r.driver_id,
            provider_payment_id = COALESCE(p.provider_payment_id, p.transaction_id),
            idempotency_key = COALESCE(p.idempotency_key, 'legacy:' || p.id::text),
            service_fee = ROUND((p.amount * 0.10)::numeric, 2),
            driver_amount = ROUND((p.amount - (p.amount * 0.10))::numeric, 2),
            metadata = COALESCE(p.metadata, '{}'::json)
        FROM bookings b
        JOIN rides r ON r.id = b.ride_id
        WHERE p.booking_id = b.id
        """
    )

    op.create_foreign_key(
        "fk_payments_passenger_id_users", "payments", "users", ["passenger_id"], ["id"]
    )
    op.create_foreign_key(
        "fk_payments_driver_id_users", "payments", "users", ["driver_id"], ["id"]
    )
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"])
    op.create_index(
        "ix_payments_provider_payment_id",
        "payments",
        ["provider_payment_id"],
        unique=True,
    )
    op.create_index(
        "ix_payments_transaction_id", "payments", ["transaction_id"], unique=True
    )
    op.create_index(
        "ix_payments_idempotency_key", "payments", ["idempotency_key"], unique=True
    )
    op.create_index(
        "uq_payments_active_booking",
        "payments",
        ["booking_id"],
        unique=True,
        postgresql_where=sa.text("status in ('pending', 'succeeded')"),
    )

    op.create_table(
        "wallets",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "available_balance",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "pending_balance", sa.Numeric(12, 2), nullable=False, server_default="0"
        ),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="AZN"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.execute(
        """
        INSERT INTO wallets (user_id, available_balance, pending_balance, currency)
        SELECT id, 0, 0, 'AZN' FROM users
        ON CONFLICT (user_id) DO NOTHING
        """
    )

    op.create_table(
        "wallet_transactions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("payment_id", sa.UUID(), nullable=True),
        sa.Column("booking_id", sa.UUID(), nullable=True),
        sa.Column("ride_id", sa.UUID(), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("direction", sa.String(length=10), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="AZN"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="posted"),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("idempotency_key", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"]),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"]),
        sa.ForeignKeyConstraint(["ride_id"], ["rides.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_wallet_transactions_user_created",
        "wallet_transactions",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_wallet_transactions_idempotency_key",
        "wallet_transactions",
        ["idempotency_key"],
        unique=True,
    )

    op.create_table(
        "payout_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="AZN"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("method", sa.String(length=50), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("payout_requests")
    op.drop_index("ix_wallet_transactions_idempotency_key", table_name="wallet_transactions")
    op.drop_index("ix_wallet_transactions_user_created", table_name="wallet_transactions")
    op.drop_table("wallet_transactions")
    op.drop_table("wallets")

    op.drop_index("uq_payments_active_booking", table_name="payments")
    op.drop_index("ix_payments_idempotency_key", table_name="payments")
    op.drop_index("ix_payments_transaction_id", table_name="payments")
    op.drop_index("ix_payments_provider_payment_id", table_name="payments")
    op.drop_index("ix_payments_booking_id", table_name="payments")
    op.drop_constraint("fk_payments_driver_id_users", "payments", type_="foreignkey")
    op.drop_constraint("fk_payments_passenger_id_users", "payments", type_="foreignkey")
    op.execute("UPDATE payments SET status = 'completed' WHERE status = 'succeeded'")
    op.alter_column(
        "payments",
        "amount",
        existing_type=sa.Numeric(12, 2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="amount::float",
    )
    op.alter_column(
        "bookings",
        "total_price",
        existing_type=sa.Numeric(12, 2),
        type_=sa.Float(),
        existing_nullable=True,
        postgresql_using="total_price::float",
    )
    op.alter_column(
        "rides",
        "price_per_seat",
        existing_type=sa.Numeric(12, 2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="price_per_seat::float",
    )
    op.drop_column("payments", "refunded_at")
    op.drop_column("payments", "paid_at")
    op.drop_column("payments", "metadata")
    op.drop_column("payments", "failure_reason")
    op.drop_column("payments", "idempotency_key")
    op.drop_column("payments", "provider_checkout_url")
    op.drop_column("payments", "provider_payment_id")
    op.drop_column("payments", "provider")
    op.drop_column("payments", "currency")
    op.drop_column("payments", "driver_amount")
    op.drop_column("payments", "service_fee")
    op.drop_column("payments", "driver_id")
    op.drop_column("payments", "passenger_id")
