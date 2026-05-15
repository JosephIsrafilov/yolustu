from core.database import engine
from sqlalchemy import text


def reset_db():
    print("Resetting database...")
    with engine.connect() as conn:
        # Drop tables
        tables = [
            "bookings",
            "messages",
            "reviews",
            "rides",
            "vehicles",
            "users",
            "alembic_version",
        ]
        for table in tables:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"Dropped table {table} (if it existed)")
            except Exception as e:
                print(f"Error dropping table {table}: {e}")
        # Drop index specifically if it lingers
        try:
            conn.execute(text("DROP INDEX IF EXISTS idx_rides_destination_location"))
            conn.execute(text("DROP INDEX IF EXISTS idx_rides_origin_location"))
            print("Dropped indexes (if they existed)")
        except Exception as e:
            print(f"Error dropping indexes: {e}")
        conn.commit()
    print("Database reset completed.")


if __name__ == "__main__":
    reset_db()
