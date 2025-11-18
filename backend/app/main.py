from __future__ import annotations

from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlmodel import Session

from .database import get_session, init_db
from .models import SongRequest, SongRequestCreate, SongRequestRead

app = FastAPI(title="kareoQ Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health", tags=["Meta"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/requests", response_model=list[SongRequestRead], tags=["Requests"])
def list_requests(
    include_played: bool = False,
    session: Session = Depends(get_session),
) -> list[SongRequest]:
    statement = select(SongRequest).order_by(SongRequest.created_at.asc())
    if not include_played:
        statement = statement.where(SongRequest.is_played.is_(False))
    results = session.exec(statement).scalars().all()
    return results


@app.post(
    "/requests",
    response_model=SongRequestRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Requests"],
)
def submit_request(
    payload: SongRequestCreate,
    request: Request,
    session: Session = Depends(get_session),
) -> SongRequest:
    client_ip = request.client.host if request.client else "unknown"

    pending_count = session.exec(
        select(func.count())
        .select_from(SongRequest)
        .where(SongRequest.ip_address == client_ip, SongRequest.is_played.is_(False))
    ).scalar_one()

    if pending_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum 2 aktív kérés engedélyezett ezen az IP címről, várj míg lejátsszuk az egyiket.",
        )

    new_request = SongRequest(
        song_title=payload.song_title,
        performer=payload.performer,
        singers=payload.singers,
        notes=payload.notes,
        ip_address=client_ip,
    )
    session.add(new_request)
    session.commit()
    session.refresh(new_request)
    return new_request


@app.patch(
    "/requests/{request_id}/play",
    response_model=SongRequestRead,
    tags=["Requests"],
)
def mark_as_played(
    request_id: int,
    session: Session = Depends(get_session),
) -> SongRequest:
    entry = session.get(SongRequest, request_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kérés nem található")

    if not entry.is_played:
        entry.is_played = True
        entry.played_at = datetime.utcnow()
        session.add(entry)
        session.commit()
        session.refresh(entry)

    return entry


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", reload=True)
