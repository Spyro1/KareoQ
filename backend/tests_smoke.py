from __future__ import annotations

from fastapi.testclient import TestClient

from app.database import session_scope
from app.main import app
from app.models import SongRequest


def run_smoke() -> None:
    created_ids: list[int] = []
    client = TestClient(app)

    try:
        assert client.get("/health").status_code == 200

        payload = {
            "song_title": "Song A",
            "performer": "Performer",
            "singers": "Team",
        }

        first = client.post("/requests", json=payload)
        assert first.status_code == 201
        created_ids.append(first.json()["id"])

        second = client.post("/requests", json={**payload, "song_title": "Song B"})
        assert second.status_code == 201
        created_ids.append(second.json()["id"])

        third = client.post("/requests", json={**payload, "song_title": "Song C"})
        assert third.status_code == 429

        request_id = first.json()["id"]
        played = client.patch(f"/requests/{request_id}/play")
        assert played.status_code == 200

        fourth = client.post("/requests", json={**payload, "song_title": "Song C"})
        assert fourth.status_code == 201
        created_ids.append(fourth.json()["id"])
    finally:
        if created_ids:
            with session_scope() as session:
                for entry_id in created_ids:
                    entry = session.get(SongRequest, entry_id)
                    if entry is not None:
                        session.delete(entry)


if __name__ == "__main__":
    run_smoke()
    print("Smoke test passed ✔")
