import os
import sys
import pytest
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.core.database import Base, get_db
from app.core.redis import get_redis

# Mock Database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    # We might need to handle PostGIS UUIDs for SQLite if they are used
    # But for identity tests, it should be okay if we use String for UUIDs or similar
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Mock Redis
mock_redis_client = MagicMock()
mock_redis_client.get.return_value = None
mock_redis_client.set.return_value = True
mock_redis_client.setex.return_value = True
mock_redis_client.delete.return_value = True

def override_get_redis():
    return mock_redis_client

# Apply overrides
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_redis] = override_get_redis

@pytest.fixture
def db():
    return TestingSessionLocal()

@pytest.fixture
def redis_mock():
    return mock_redis_client
