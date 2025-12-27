from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class SongRequestBase(SQLModel):
    song_title: str = Field(index=True, max_length=200)
    performer: str = Field(max_length=200)
    singers: str = Field(max_length=200)
    notes: Optional[str] = Field(default=None, max_length=500)


class SongRequestCreate(SongRequestBase):
    pass


class SongRequestRead(SongRequestBase):
    id: int
    created_at: datetime
    played_at: Optional[datetime]
    ip_address: str
    is_played: bool
    sort_order: Optional[int]


class OrderUpdate(BaseModel):
    ordered_ids: list[int]
