from app.core.database import engine
from sqlalchemy import text


def check_all_relations():
    with engine.connect() as conn:
        query = text("""
            SELECT n.nspname as schema, c.relname as name, c.relkind as kind
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE c.relname LIKE 'idx_rides%'
        """)
        result = conn.execute(query)
        rows = result.fetchall()
        print(f"Found {len(rows)} relations:")
        for row in rows:
            print(row)


if __name__ == "__main__":
    check_all_relations()
