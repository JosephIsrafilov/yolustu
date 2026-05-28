import os
import sys
import pytest
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from main import app
from app.core.database import Base, get_db
from app.core.redis import get_redis
from app.core.security import get_password_hash
from app.domains.identity.models import User

# Mock Database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine, tables=[User.__table__])
    seed_user()
    yield
    User.__table__.drop(bind=engine)


def seed_user():
    db = TestingSessionLocal()
    try:
        db.add(
            User(
                phone="+994501234567",
                first_name="Elvin",
                last_name="Məmmədov",
                hashed_password=get_password_hash("password123"),
                is_verified=True,
                role="driver",
                rating=4.8,
            )
        )
        db.commit()
    finally:
        db.close()


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
