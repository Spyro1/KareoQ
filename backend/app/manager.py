from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, Request, status
from sqlalchemy import delete, func, select
from sqlmodel import Session

from .models import SongRequest
from .schemas import OrderUpdate, SongRequestCreate

ADMIN_REQUEST_HEADER = "x-admin-request"
ADMIN_TRUE_VALUES = {"1", "true", "yes", "on"}
ADMIN_IP_PREFIX = "admin::"
ORDERING_PREFIX = 1


def is_admin_request(request: Request) -> bool:
    header_flag = request.headers.get(ADMIN_REQUEST_HEADER, "").strip().lower()
    query_flag = request.query_params.get("admin", "").strip().lower()
    return header_flag in ADMIN_TRUE_VALUES or query_flag in ADMIN_TRUE_VALUES


def require_admin(request: Request) -> None:
    if not is_admin_request(request):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin jogosultság szükséges")


def next_sort_order(session: Session) -> int:
    max_order = session.exec(
        select(func.max(SongRequest.sort_order)).where(SongRequest.is_played.is_(False))
    ).scalar_one()
    if max_order is None:
        return ORDERING_PREFIX
    return int(max_order) + 1


class RequestsManager:
    def list_requests(self, session: Session, include_played: bool = False) -> list[SongRequest]:
        statement = select(SongRequest).order_by(
            SongRequest.sort_order.is_(None),
            SongRequest.sort_order.asc(),
            SongRequest.created_at.asc(),
        )
        if not include_played:
            statement = statement.where(SongRequest.is_played.is_(False))
        return session.exec(statement).scalars().all()

    def update_queue_order(self, *, payload: OrderUpdate, request: Request, session: Session) -> dict[str, str]:
        require_admin(request)

        ids = [int(value) for value in payload.ordered_ids if isinstance(value, (int, str))]
        if not ids:
            return {"status": "ok"}

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

    def submit_request(self, *, payload: SongRequestCreate, request: Request, session: Session) -> SongRequest:
        admin_flag = is_admin_request(request)
        client_ip = request.client.host if request.client else "unknown"

        if not admin_flag:
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

        stored_ip = f"{ADMIN_IP_PREFIX}{client_ip}" if admin_flag else client_ip

        new_request = SongRequest(
            song_title=payload.song_title,
            performer=payload.performer,
            singers=payload.singers,
            notes=payload.notes,
            ip_address=stored_ip,
        )

        any_manual = session.exec(
            select(func.count()).where(
                SongRequest.is_played.is_(False),
                SongRequest.sort_order.is_not(None),
            )
        ).scalar_one()
        if any_manual:
            new_request.sort_order = next_sort_order(session)

        session.add(new_request)
        session.commit()
        session.refresh(new_request)
        return new_request

    def mark_as_played(self, *, request_id: int, session: Session) -> SongRequest:
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

    def restore_request(self, *, request_id: int, session: Session) -> SongRequest:
        entry = session.get(SongRequest, request_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kérés nem található")

        if entry.is_played:
            entry.is_played = False
            entry.played_at = None

            any_manual = session.exec(
                select(func.count()).where(
                    SongRequest.is_played.is_(False),
                    SongRequest.sort_order.is_not(None),
                )
            ).scalar_one()
            entry.sort_order = next_sort_order(session) if any_manual else None

            session.add(entry)
            session.commit()
            session.refresh(entry)

        return entry

    def reset_queue(self, *, session: Session) -> dict[str, str]:
        session.exec(delete(SongRequest))
        session.commit()
        return {"status": "reset"}
