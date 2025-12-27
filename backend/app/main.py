from __future__ import annotations

from fastapi import Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from .database import get_session, init_db
from .manager import RequestsManager
from .models import SongRequest
from .schemas import OrderUpdate, SongRequestCreate, SongRequestRead



app = FastAPI(title="kareoQ Backend", version="0.1.0")

manager = RequestsManager()

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
    return manager.list_requests(session=session, include_played=include_played)


@app.patch("/requests/order", status_code=status.HTTP_200_OK, tags=["Requests"])
def update_queue_order(
    payload: OrderUpdate,
    request: Request,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    return manager.update_queue_order(payload=payload, request=request, session=session)


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
    return manager.submit_request(payload=payload, request=request, session=session)


@app.patch(
    "/requests/{request_id}/play",
    response_model=SongRequestRead,
    tags=["Requests"],
)
def mark_as_played(
    request_id: int,
    session: Session = Depends(get_session),
) -> SongRequest:
    return manager.mark_as_played(request_id=request_id, session=session)


@app.patch(
    "/requests/{request_id}/restore",
    response_model=SongRequestRead,
    tags=["Requests"],
)
def restore_request(
    request_id: int,
    session: Session = Depends(get_session),
) -> SongRequest:
    return manager.restore_request(request_id=request_id, session=session)


@app.delete(
    "/requests",
    status_code=status.HTTP_200_OK,
    tags=["Requests"],
)
def reset_queue(
    session: Session = Depends(get_session),
) -> dict[str, str]:
    return manager.reset_queue(session=session)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", reload=True)
