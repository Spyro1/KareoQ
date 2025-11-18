from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class SongRequestBase(SQLModel):
    song_title: str = Field(index=True, max_length=200)
    performer: str = Field(max_length=200)
    singers: str = Field(max_length=200)
    notes: Optional[str] = Field(default=None, max_length=500)


class SongRequest(SongRequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    played_at: Optional[datetime] = Field(default=None, nullable=True)
    ip_address: str = Field(index=True, max_length=64)
    is_played: bool = Field(default=False, index=True)


class SongRequestCreate(SongRequestBase):
    pass


class SongRequestRead(SongRequestBase):
    id: int
    created_at: datetime
    played_at: Optional[datetime]
    ip_address: str
    is_played: bool
