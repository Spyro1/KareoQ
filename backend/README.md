# kareoQ Backend

FastAPI service that stores karaoke song requests with IP-based throttling (maximum two pending requests per IP until a previous one is marked as played).

## Features

- REST API built with FastAPI
- SQLite/SQLModel persistence for song requests
- Automatic IP capture and per-IP pending request cap (2)
- Endpoints to submit, list, and mark requests as played
- CORS enabled (allow-all) so the React frontend can call the API during development

## Project structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── database.py
│   ├── main.py
│   └── models.py
├── README.md
└── requirements.txt
```

## Getting started

```bash
cd backend
python -m venv .venv # Virtuális environment létrehozása
.
# Windows PowerShell:
#   .venv\Scripts\Activate.ps1
# macOS/Linux:
#   source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/docs` for interactive OpenAPI docs.

## API overview

- `GET /health` – Basic readiness check.
- `GET /requests?include_played=false` – List queued requests (pending by default).
- `POST /requests` – Submit a new request (body: song_title, performer, singers, notes?). Stores client IP and enforces the 2 pending requests/IP rule.
- `PATCH /requests/{id}/play` – Mark a request as played, unlocking another submission slot for that IP.

Optional query flags:
- `GET /requests?include_played=true` – include played rows.
- `GET /requests?admin=1` – admin-formatted response (used by the dashboard).

## Development tips

- The SQLite database file lives in `backend/app/app.db`. Delete it if you need a clean slate (or after schema changes, e.g. adding new columns).
- `backend/app/database.py` exposes `reset_db()` for local testing to rebuild the schema.

## Smoke test

There is a lightweight smoke test script:

```bash
cd backend
python tests_smoke.py
```

## Seeding sample data

Seed the database with a small set of sample song requests:

```bash
cd backend

# Seed once (won't duplicate if data already exists)
python -m app.seed

# Drop + recreate tables, then seed
python -m app.seed --reset

# Insert even if the DB already has data
python -m app.seed --force
```

You can override the SQLite filename using `KAREOQ_DB_FILENAME` (relative to `backend/app/` or absolute).
