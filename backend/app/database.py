from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
import os
from typing import Iterator

from sqlmodel import SQLModel, Session, create_engine

BASE_DIR = Path(__file__).resolve().parent

def _resolve_db_path() -> Path:
    override = os.environ.get("KAREOQ_DB_FILENAME")
    if override:
        candidate = Path(override)
        if candidate.is_absolute():
            return candidate
        return BASE_DIR / candidate
    return BASE_DIR / "app.db"

DB_PATH = _resolve_db_path()
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

_engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


def init_db() -> None:
    """Create database tables if they do not exist."""
    SQLModel.metadata.create_all(_engine)


def reset_db() -> None:
    """Drop and recreate all tables (mainly for local testing)."""
    SQLModel.metadata.drop_all(_engine)
    SQLModel.metadata.create_all(_engine)


def get_engine():
    return _engine


def get_session() -> Iterator[Session]:
    with Session(_engine) as session:
        yield session


@contextmanager
def session_scope() -> Iterator[Session]:
    session = Session(_engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
