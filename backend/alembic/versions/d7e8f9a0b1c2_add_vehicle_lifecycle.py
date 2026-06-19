"""Add vehicle lifecycle, normalized plates, and capacity constraints.

Revision ID: d7e8f9a0b1c2
Revises: c6d7e8f9a0b1
Create Date: 2026-06-19 20:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, None] = "c6d7e8f9a0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vehicles",
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.add_column(
        "vehicles",
        sa.Column(
            "is_default", sa.Boolean(), server_default=sa.false(), nullable=False
        ),
    )
    op.add_column(
        "vehicles", sa.Column("normalized_plate", sa.String(length=20), nullable=True)
    )

    op.execute(
        """
        UPDATE vehicles
        SET normalized_plate = upper(regexp_replace(plate_number, '[^[:alnum:]]', '', 'g'))
        """
    )

    bind = op.get_bind()
    invalid = (
        bind.execute(
            sa.text(
                """
            SELECT id, plate_number, seats_count, year
            FROM vehicles
            WHERE normalized_plate IS NULL
               OR normalized_plate = ''
               OR seats_count NOT BETWEEN 1 AND 4
               OR year NOT BETWEEN 1886 AND 2100
            ORDER BY id
            LIMIT 1
            """
            )
        )
        .mappings()
        .first()
    )
    if invalid is not None:
        raise RuntimeError(
            "Vehicle lifecycle migration found invalid legacy vehicle "
            f"{invalid['id']}; fix plate_number, seats_count, and year before retrying"
        )

    duplicate = bind.execute(
        sa.text(
            """
            SELECT normalized_plate
            FROM vehicles
            GROUP BY normalized_plate
            HAVING count(*) > 1
            ORDER BY normalized_plate
            LIMIT 1
            """
        )
    ).scalar()
    if duplicate is not None:
        raise RuntimeError(
            "Vehicle lifecycle migration found duplicate normalized plate "
            f"{duplicate}; resolve duplicate vehicle records before retrying"
        )

    op.alter_column("vehicles", "normalized_plate", nullable=False)
    op.create_check_constraint(
        "ck_vehicles_seats_count", "vehicles", "seats_count BETWEEN 1 AND 4"
    )
    op.create_check_constraint(
        "ck_vehicles_year", "vehicles", "year BETWEEN 1886 AND 2100"
    )

    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   row_number() OVER (
                       PARTITION BY user_id
                       ORDER BY created_at NULLS LAST, id
                   ) AS owner_rank
            FROM vehicles
            WHERE is_active = true
        )
        UPDATE vehicles
        SET is_default = (ranked.owner_rank = 1)
        FROM ranked
        WHERE vehicles.id = ranked.id
        """
    )

    op.create_index(
        "uq_vehicles_active_normalized_plate",
        "vehicles",
        ["normalized_plate"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )
    op.create_index(
        "uq_vehicles_owner_active_default",
        "vehicles",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_active = true AND is_default = true"),
    )


def downgrade() -> None:
    op.drop_index("uq_vehicles_owner_active_default", table_name="vehicles")
    op.drop_index("uq_vehicles_active_normalized_plate", table_name="vehicles")
    op.drop_constraint("ck_vehicles_year", "vehicles", type_="check")
    op.drop_constraint("ck_vehicles_seats_count", "vehicles", type_="check")
    op.drop_column("vehicles", "normalized_plate")
    op.drop_column("vehicles", "is_default")
    op.drop_column("vehicles", "is_active")
