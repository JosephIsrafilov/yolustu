import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found in .env!")
    exit(1)

HEAD_1 = "9f1c3a7b2d44"
HEAD_2 = "a1b2c3d4e5f6"
MY_NEW_MIGRATION = "a5e6f7b8c9d0"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT version_num FROM alembic_version")
    row = cur.fetchone()
    current_version = row[0] if row else None
    cur.close()
    conn.close()
    
    print(f"Current DB version is: {current_version}")
    
    if current_version == HEAD_1:
        surviving_head = HEAD_1
        dead_head = HEAD_2
    elif current_version == HEAD_2:
        surviving_head = HEAD_2
        dead_head = HEAD_1
    elif current_version == MY_NEW_MIGRATION:
        print("Your DB is already up to date!")
        exit(0)
    else:
        # If it's something else, let's just assume HEAD_1 is the correct one to keep, 
        # but warn the user. Actually if they haven't upgraded yet, it might be f7b2e9c4d8a1.
        if current_version == "f7b2e9c4d8a1":
            print(f"DB is at {current_version}. Keeping {HEAD_2} and removing {HEAD_1}.")
            surviving_head = HEAD_2
            dead_head = HEAD_1
        else:
            print(f"DB is at {current_version}. Assuming {HEAD_2} is the intended path.")
            surviving_head = HEAD_2
            dead_head = HEAD_1

    # Delete the dead head file
    versions_dir = os.path.join(os.path.dirname(__file__), "alembic", "versions")
    for file in os.listdir(versions_dir):
        if file.startswith(dead_head):
            dead_file_path = os.path.join(versions_dir, file)
            os.remove(dead_file_path)
            print(f"Deleted duplicate migration: {file}")
            
    # Update my new migration's down_revision to point to surviving head
    for file in os.listdir(versions_dir):
        if file.startswith(MY_NEW_MIGRATION):
            mig_path = os.path.join(versions_dir, file)
            with open(mig_path, "r") as f:
                content = f.read()
                
            content = content.replace(f'down_revision: Union[str, None] = "{HEAD_1}"', f'down_revision: Union[str, None] = "{surviving_head}"')
            content = content.replace(f'down_revision: Union[str, None] = "{HEAD_2}"', f'down_revision: Union[str, None] = "{surviving_head}"')
            
            with open(mig_path, "w") as f:
                f.write(content)
            print(f"Updated {file} to point to {surviving_head}")
            
    print("\nFixed! You can now run:")
    print("venv\\Scripts\\alembic.exe upgrade head")
    
except Exception as e:
    print(f"Error connecting to DB or fixing files: {e}")
