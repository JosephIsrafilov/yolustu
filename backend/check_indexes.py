from core.database import engine
from sqlalchemy import text

def check_indexes():
    with engine.connect() as conn:
        query = text("SELECT schemaname, tablename, indexname FROM pg_indexes WHERE indexname LIKE 'idx_rides%'")
        result = conn.execute(query)
        rows = result.fetchall()
        print(f"Found {len(rows)} indexes:")
        for row in rows:
            print(row)

if __name__ == "__main__":
    check_indexes()
