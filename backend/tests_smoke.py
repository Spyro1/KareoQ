from __future__ import annotations

import os
from contextlib import suppress
from pathlib import Path

TEST_DB_PATH = Path(__file__).resolve().parent / "test.db"
os.environ["KAREOQ_DB_FILENAME"] = str(TEST_DB_PATH)

from fastapi.testclient import TestClient

from app.main import app
from app.database import get_engine


def cleanup_test_db() -> None:
    # Dispose the SQLAlchemy engine so SQLite releases file handles on Windows
    engine = get_engine()
    engine.dispose()

    with suppress(OSError):
        if TEST_DB_PATH.exists():
            TEST_DB_PATH.unlink()


def run_smoke() -> None:
    with TestClient(app) as client:
        assert client.get("/health").status_code == 200

        # Keep test deterministic regardless of leftover data
        client.delete("/requests")

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

        admin_headers = {"x-admin-request": "true"}
        admin = client.post(
            "/requests",
            json={**payload, "song_title": "Admin Song"},
            headers=admin_headers,
        )
        assert admin.status_code == 201

        admin_qs = client.post(
            "/requests?admin=1",
            json={**payload, "song_title": "Admin Song B"},
        )
        assert admin_qs.status_code == 201

        request_id = first.json()["id"]
        played = client.patch(f"/requests/{request_id}/play")
        assert played.status_code == 200

        fourth = client.post("/requests", json={**payload, "song_title": "Song C"})
        assert fourth.status_code == 201

        reset = client.delete("/requests")
        assert reset.status_code == 200


if __name__ == "__main__":
    try:
        run_smoke()
        print("Smoke test passed ✔")
    finally:
        cleanup_test_db()
