"""Add authoritative relational seat reservations.

Revision ID: c6d7e8f9a0b1
Revises: 5e2bf617a145
Create Date: 2026-06-19 18:00:00.000000
"""

import json
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c6d7e8f9a0b1"
down_revision: Union[str, None] = "5e2bf617a145"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEAT_SPOTS = ("front_right", "back_left", "back_middle", "back_right")


def _json_list(value: object) -> list[str]:
    if isinstance(value, str):
        value = json.loads(value)
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str)]


def upgrade() -> None:
    op.create_table(
        "ride_seats",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "ride_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rides.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("spot", sa.String(length=20), nullable=False),
        sa.Column(
            "is_enabled",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("ride_id", "spot", name="uq_ride_seats_ride_spot"),
    )
    op.create_index("ix_ride_seats_ride_id", "ride_seats", ["ride_id"])

    op.create_table(
        "booking_seats",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "booking_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bookings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "ride_seat_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ride_seats.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_booking_seats_booking_id", "booking_seats", ["booking_id"])
    op.create_index(
        "uq_booking_seats_active_ride_seat",
        "booking_seats",
        ["ride_seat_id"],
        unique=True,
        postgresql_where=sa.text("released_at IS NULL"),
        sqlite_where=sa.text("released_at IS NULL"),
    )

    bind = op.get_bind()
    rides = bind.execute(
        sa.text(
            "SELECT id, total_seats, available_seats, available_spots "
            "FROM rides ORDER BY created_at, id"
        )
    ).mappings()
    seat_ids: dict[object, dict[str, uuid.UUID]] = {}
    enabled_by_ride: dict[object, set[str]] = {}
    for ride in rides:
        total_seats = int(ride["total_seats"])
        if total_seats < 0 or total_seats > len(SEAT_SPOTS):
            raise RuntimeError(
                f"Ride {ride['id']} has unsupported total_seats={total_seats}"
            )
        configured_spots = _json_list(ride["available_spots"])
        enabled_spots = set(
            configured_spots or SEAT_SPOTS[: int(ride["available_seats"])]
        )
        enabled_by_ride[ride["id"]] = enabled_spots
        seat_ids[ride["id"]] = {}
        for spot in SEAT_SPOTS[:total_seats]:
            seat_id = uuid.uuid4()
            seat_ids[ride["id"]][spot] = seat_id
            bind.execute(
                sa.text(
                    "INSERT INTO ride_seats "
                    "(id, ride_id, spot, is_enabled) "
                    "VALUES (:id, :ride_id, :spot, :is_enabled)"
                ),
                {
                    "id": seat_id,
                    "ride_id": ride["id"],
                    "spot": spot,
                    "is_enabled": spot in enabled_spots,
                },
            )

    bookings = bind.execute(
        sa.text(
            "SELECT id, ride_id, seats_booked, selected_spots "
            "FROM bookings "
            "WHERE status IN ('pending', 'accepted', 'paid', 'boarded') "
            "ORDER BY created_at, id"
        )
    ).mappings()
    occupied: dict[object, set[str]] = {}
    for booking in bookings:
        ride_id = booking["ride_id"]
        layout = seat_ids.get(ride_id, {})
        taken = occupied.setdefault(ride_id, set())
        requested = [
            spot
            for spot in _json_list(booking["selected_spots"])
            if spot in layout and spot not in taken
        ]
        selected = requested[: int(booking["seats_booked"])]
        # Legacy count-only bookings have no physical seat identity. Prefer
        # positions outside the stored free-seat projection so backfill
        # preserves the existing available_seats count.
        allocation_order = [
            spot for spot in layout if spot not in enabled_by_ride[ride_id]
        ] + [spot for spot in layout if spot in enabled_by_ride[ride_id]]
        for spot in allocation_order:
            if len(selected) == int(booking["seats_booked"]):
                break
            if spot not in taken and spot not in selected:
                selected.append(spot)
        if len(selected) != int(booking["seats_booked"]):
            print(
                f"Warning: Cannot backfill {booking['seats_booked']} seats for "
                f"booking {booking['id']}. Only {len(selected)} seats available."
            )
        for spot in selected:
            enabled_by_ride[ride_id].add(spot)
            bind.execute(
                sa.text("UPDATE ride_seats SET is_enabled = true WHERE id = :id"),
                {"id": layout[spot]},
            )
            bind.execute(
                sa.text(
                    "INSERT INTO booking_seats "
                    "(id, booking_id, ride_seat_id) "
                    "VALUES (:id, :booking_id, :ride_seat_id)"
                ),
                {
                    "id": uuid.uuid4(),
                    "booking_id": booking["id"],
                    "ride_seat_id": layout[spot],
                },
            )
        taken.update(selected)
        bind.execute(
            sa.text(
                "UPDATE bookings SET selected_spots = CAST(:spots AS JSON) "
                "WHERE id = :booking_id"
            ),
            {
                "spots": json.dumps(selected),
                "booking_id": booking["id"],
            },
        )

    for ride_id, layout in seat_ids.items():
        available = [
            spot
            for spot in layout
            if spot in enabled_by_ride[ride_id]
            and spot not in occupied.get(ride_id, set())
        ]
        bind.execute(
            sa.text(
                "UPDATE rides "
                "SET available_seats = :count, "
                "available_spots = CAST(:spots AS JSON) "
                "WHERE id = :ride_id"
            ),
            {
                "count": len(available),
                "spots": json.dumps(available),
                "ride_id": ride_id,
            },
        )


def downgrade() -> None:
    op.drop_index("uq_booking_seats_active_ride_seat", table_name="booking_seats")
    op.drop_index("ix_booking_seats_booking_id", table_name="booking_seats")
    op.drop_table("booking_seats")
    op.drop_index("ix_ride_seats_ride_id", table_name="ride_seats")
    op.drop_table("ride_seats")
