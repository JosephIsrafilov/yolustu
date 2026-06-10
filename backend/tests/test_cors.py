from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_localhost_dev_port_preflight_is_allowed():
    response = client.options(
        "/api/v1/users/me",
        headers={
            "Origin": "http://localhost:3001",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3001"
