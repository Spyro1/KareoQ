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
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/docs` for interactive OpenAPI docs.

## API overview

- `GET /health` – Basic readiness check.
- `GET /requests?include_played=false` – List queued requests (pending by default).
- `POST /requests` – Submit a new request (body: song_title, performer, singers, notes?). Stores client IP and enforces the 2 pending requests/IP rule.
- `PATCH /requests/{id}/play` – Mark a request as played, unlocking another submission slot for that IP.

## Development tips

- The SQLite database file lives in `backend/app/app.db`. Delete it if you need a clean slate.
- `backend/app/database.py` exposes `reset_db()` for local testing to rebuild the schema.
