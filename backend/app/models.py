from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field

from .schemas import SongRequestBase


class SongRequest(SongRequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    played_at: Optional[datetime] = Field(default=None, nullable=True)
    ip_address: str = Field(index=True, max_length=64)
    is_played: bool = Field(default=False, index=True)
    sort_order: Optional[int] = Field(default=None, index=True)
