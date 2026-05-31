import importlib

from fastapi.testclient import TestClient

from main import app

app_main = importlib.import_module("app.main")


client = TestClient(app)


class FakeDbConnection:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def execute(self, statement):
        return None


class FakeEngine:
    def connect(self):
        return FakeDbConnection()


class FakeRedis:
    def __init__(self, connection_pool):
        self.connection_pool = connection_pool

    def ping(self):
        return True


class FailingRedis(FakeRedis):
    def ping(self):
        raise RuntimeError("redis down")


def test_health_reports_dependency_checks(monkeypatch):
    monkeypatch.setattr(app_main, "engine", FakeEngine())
    monkeypatch.setattr(app_main, "Redis", FakeRedis)

    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["checks"]["api"]["status"] == "ok"
    assert data["checks"]["database"]["status"] == "ok"
    assert data["checks"]["redis"]["status"] == "ok"


def test_health_reports_degraded_redis(monkeypatch):
    monkeypatch.setattr(app_main, "engine", FakeEngine())
    monkeypatch.setattr(app_main, "Redis", FailingRedis)

    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["checks"]["redis"]["status"] == "error"
