from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlmodel import SQLModel, Session, create_engine

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "app.db"
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
