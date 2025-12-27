from __future__ import annotations

from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, func, select
from sqlmodel import Session

from .database import get_session, init_db
from .models import SongRequest
from .schemas import OrderUpdate, SongRequestCreate, SongRequestRead

ADMIN_REQUEST_HEADER = "x-admin-request"
ADMIN_TRUE_VALUES = {"1", "true", "yes", "on"}
ADMIN_IP_PREFIX = "admin::"
ORDERING_PREFIX = 1


def _is_admin_request(request: Request) -> bool:
    header_flag = request.headers.get(ADMIN_REQUEST_HEADER, "").strip().lower()
    query_flag = request.query_params.get("admin", "").strip().lower()
    return header_flag in ADMIN_TRUE_VALUES or query_flag in ADMIN_TRUE_VALUES


def _require_admin(request: Request) -> None:
    if not _is_admin_request(request):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin jogosultság szükséges")


def _next_sort_order(session: Session) -> int:
    max_order = session.exec(
        select(func.max(SongRequest.sort_order)).where(SongRequest.is_played.is_(False))
    ).scalar_one()
    if max_order is None:
        return ORDERING_PREFIX
    return int(max_order) + 1



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
def list_requests(include_played: bool = False, session: Session = Depends(get_session)) -> list[SongRequest]:
    statement = select(SongRequest).order_by(
        SongRequest.sort_order.is_(None),
        SongRequest.sort_order.asc(),
        SongRequest.created_at.asc(),
    )
    if not include_played:
        statement = statement.where(SongRequest.is_played.is_(False))
    results = session.exec(statement).scalars().all()
    return results


@app.patch("/requests/order", status_code=status.HTTP_200_OK, tags=["Requests"])
def update_queue_order(
    payload: OrderUpdate,
    request: Request,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    _require_admin(request)

    ids = [int(value) for value in payload.ordered_ids if isinstance(value, (int, str))]
    if not ids:
        return {"status": "ok"}

    # Only apply ordering to currently pending entries.
    pending_ids = set(
        session.exec(select(SongRequest.id).where(SongRequest.is_played.is_(False))).scalars().all()
    )
    ids = [request_id for request_id in ids if request_id in pending_ids]

    for index, request_id in enumerate(ids, start=ORDERING_PREFIX):
        entry = session.get(SongRequest, request_id)
        if entry is None or entry.is_played:
            continue
        entry.sort_order = index
        session.add(entry)

    # Any other pending entries not in the list fall back to time ordering.
    missing = pending_ids.difference(ids)
    if missing:
        session.exec(
            select(SongRequest)
            .where(SongRequest.id.in_(list(missing)))
            .execution_options(populate_existing=True)
        )
        for request_id in missing:
            entry = session.get(SongRequest, request_id)
            if entry is not None and not entry.is_played:
                entry.sort_order = None
                session.add(entry)

    session.commit()
    return {"status": "ok"}


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
    is_admin_request = _is_admin_request(request)
    client_ip = request.client.host if request.client else "unknown"

    if not is_admin_request:
        last_created_at = session.exec(
            select(SongRequest.created_at)
            .where(SongRequest.ip_address == client_ip)
            .order_by(SongRequest.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()

        if last_created_at is not None:
            seconds_since_last = (datetime.utcnow() - last_created_at).total_seconds()
            if seconds_since_last < 60:
                retry_after_seconds = max(1, int(60 - seconds_since_last + 0.9999))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "message": "Túl gyorsan küldtél új kérést. Várj egy percet az előző után.",
                        "retry_after_seconds": retry_after_seconds,
                    },
                    headers={"Retry-After": str(retry_after_seconds)},
                )

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

    stored_ip = (
        f"{ADMIN_IP_PREFIX}{client_ip}" if is_admin_request else client_ip
    )

    new_request = SongRequest(
        song_title=payload.song_title,
        performer=payload.performer,
        singers=payload.singers,
        notes=payload.notes,
        ip_address=stored_ip,
    )

    # If the queue has been manually ordered, append new items to the end.
    any_manual = session.exec(
        select(func.count()).where(
            SongRequest.is_played.is_(False),
            SongRequest.sort_order.is_not(None),
        )
    ).scalar_one()
    if any_manual:
        new_request.sort_order = _next_sort_order(session)

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
        entry.sort_order = None
        session.add(entry)
        session.commit()
        session.refresh(entry)

    return entry


@app.patch(
    "/requests/{request_id}/restore",
    response_model=SongRequestRead,
    tags=["Requests"],
)
def restore_request(
    request_id: int,
    session: Session = Depends(get_session),
) -> SongRequest:
    entry = session.get(SongRequest, request_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kérés nem található")

    if entry.is_played:
        entry.is_played = False
        entry.played_at = None

        # Put restored items at the end if any manual ordering exists.
        any_manual = session.exec(
            select(func.count()).where(
                SongRequest.is_played.is_(False),
                SongRequest.sort_order.is_not(None),
            )
        ).scalar_one()
        entry.sort_order = _next_sort_order(session) if any_manual else None

        session.add(entry)
        session.commit()
        session.refresh(entry)

    return entry


@app.delete(
    "/requests",
    status_code=status.HTTP_200_OK,
    tags=["Requests"],
)
def reset_queue(
    session: Session = Depends(get_session),
) -> dict[str, str]:
    session.exec(delete(SongRequest))
    session.commit()
    return {"status": "reset"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", reload=True)
