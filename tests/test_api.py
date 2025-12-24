import pytest
from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "testuser@example.com"

    # ensure clean state: remove if already present
    res = client.get("/activities")
    participants = res.json()[activity].get("participants", [])
    if email in participants:
        client.delete(f"/activities/{activity}/participants", params={"email": email})

    # signup
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200

    res = client.get("/activities")
    assert email in res.json()[activity].get("participants", [])

    # unregister
    res = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert res.status_code == 200

    res = client.get("/activities")
    assert email not in res.json()[activity].get("participants", [])
