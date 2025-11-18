from __future__ import annotations

from fastapi.testclient import TestClient

from app.database import reset_db
from app.main import app


def run_smoke() -> None:
    reset_db()
    client = TestClient(app)

    assert client.get("/health").status_code == 200

    payload = {
        "song_title": "Song A",
        "performer": "Performer",
        "singers": "Team",
    }

    first = client.post("/requests", json=payload)
    assert first.status_code == 201

    second = client.post("/requests", json={**payload, "song_title": "Song B"})
    assert second.status_code == 201

    third = client.post("/requests", json={**payload, "song_title": "Song C"})
    assert third.status_code == 429

    request_id = first.json()["id"]
    played = client.patch(f"/requests/{request_id}/play")
    assert played.status_code == 200

    fourth = client.post("/requests", json={**payload, "song_title": "Song C"})
    assert fourth.status_code == 201


if __name__ == "__main__":
    run_smoke()
    print("Smoke test passed ✔")
