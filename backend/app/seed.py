from __future__ import annotations

import argparse
from datetime import datetime, timedelta

from sqlalchemy import select

try:
    # Preferred: run from backend/ as a module: `python -m app.seed`
    from .database import init_db, reset_db, session_scope
    from .models import SongRequest
except ImportError:  # pragma: no cover
    # Support direct execution from backend/app: `py seed.py`
    import sys
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parents[1]
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    from app.database import init_db, reset_db, session_scope
    from app.models import SongRequest


def seed_song_requests(*, skip_if_any: bool = True) -> int:
    """Insert a small set of sample SongRequest rows.

    Returns the number of rows inserted.
    """

    init_db()

    with session_scope() as session:
        if skip_if_any:
            existing = session.exec(select(SongRequest.id).limit(1)).first()
            if existing is not None:
                return 0

        now = datetime.utcnow()

        samples: list[SongRequest] = [
            SongRequest(
                song_title="Don't Stop Believin'",
                performer="Journey",
                singers="Alex",
                notes="Classic closer",
                ip_address="127.0.0.1",
                created_at=now - timedelta(minutes=25),
                is_played=False,
            ),
            SongRequest(
                song_title="Mr. Brightside",
                performer="The Killers",
                singers="Sam & Jamie",
                notes=None,
                ip_address="127.0.0.1",
                created_at=now - timedelta(minutes=18),
                is_played=False,
            ),
            SongRequest(
                song_title="Valerie",
                performer="Amy Winehouse",
                singers="Taylor",
                notes="If possible, key down 1",
                ip_address="192.168.1.55",
                created_at=now - timedelta(minutes=12),
                is_played=False,
            ),
            SongRequest(
                song_title="Take On Me",
                performer="a-ha",
                singers="Jordan",
                notes="High notes incoming",
                ip_address="192.168.1.72",
                created_at=now - timedelta(minutes=9),
                is_played=False,
            ),
            SongRequest(
                song_title="I Wanna Dance with Somebody",
                performer="Whitney Houston",
                singers="Nora",
                notes="Dance floor time",
                ip_address="10.0.0.23",
                created_at=now - timedelta(minutes=7),
                is_played=False,
            ),
            SongRequest(
                song_title="Billie Jean",
                performer="Michael Jackson",
                singers="Pat",
                notes=None,
                ip_address="10.0.0.23",
                created_at=now - timedelta(minutes=6),
                is_played=False,
            ),
            SongRequest(
                song_title="Wonderwall",
                performer="Oasis",
                singers="Casey",
                notes="Sorry in advance",
                ip_address="172.16.0.8",
                created_at=now - timedelta(minutes=5),
                is_played=False,
            ),
            SongRequest(
                song_title="Uptown Funk",
                performer="Mark Ronson ft. Bruno Mars",
                singers="Riley",
                notes="Bring the energy",
                ip_address="172.16.0.8",
                created_at=now - timedelta(minutes=4),
                is_played=False,
            ),
            SongRequest(
                song_title="Shallow",
                performer="Lady Gaga & Bradley Cooper",
                singers="Avery",
                notes="Duo welcome",
                ip_address="192.168.1.99",
                created_at=now - timedelta(minutes=3),
                is_played=False,
            ),
            SongRequest(
                song_title="Toxic",
                performer="Britney Spears",
                singers="Quinn",
                notes=None,
                ip_address="192.168.1.101",
                created_at=now - timedelta(minutes=2),
                is_played=False,
            ),
            SongRequest(
                song_title="Lose Yourself",
                performer="Eminem",
                singers="Drew",
                notes="One shot",
                ip_address="192.168.1.101",
                created_at=now - timedelta(minutes=1),
                is_played=False,
            ),
            SongRequest(
                song_title="Bohemian Rhapsody",
                performer="Queen",
                singers="Chris",
                notes="Go big",
                ip_address="admin::127.0.0.1",
                created_at=now - timedelta(hours=1, minutes=5),
                played_at=now - timedelta(hours=1),
                is_played=True,
            ),
            SongRequest(
                song_title="Sweet Caroline",
                performer="Neil Diamond",
                singers="Morgan",
                notes="BA BA BAA",
                ip_address="admin::127.0.0.1",
                created_at=now - timedelta(hours=2, minutes=10),
                played_at=now - timedelta(hours=2),
                is_played=True,
            ),
            SongRequest(
                song_title="Dancing Queen",
                performer="ABBA",
                singers="Harper",
                notes=None,
                ip_address="admin::127.0.0.1",
                created_at=now - timedelta(hours=3, minutes=40),
                played_at=now - timedelta(hours=3, minutes=25),
                is_played=True,
            ),
            SongRequest(
                song_title="Livin' on a Prayer",
                performer="Bon Jovi",
                singers="Sky",
                notes="Whoa-oh!",
                ip_address="admin::127.0.0.1",
                created_at=now - timedelta(hours=4, minutes=15),
                played_at=now - timedelta(hours=4),
                is_played=True,
            ),
            SongRequest(
                song_title="Hey Jude",
                performer="The Beatles",
                singers="Devon",
                notes="Long outro",
                ip_address="admin::127.0.0.1",
                created_at=now - timedelta(hours=5, minutes=30),
                played_at=now - timedelta(hours=5, minutes=10),
                is_played=True,
            ),
            SongRequest(
                song_title="Take Me Home, Country Roads",
                performer="John Denver",
                singers="Reese",
                notes="Sing-along",
                ip_address="admin::127.0.0.1",
                created_at=now - timedelta(hours=6, minutes=20),
                played_at=now - timedelta(hours=6),
                is_played=True,
            ),
            SongRequest(
                song_title="I Will Survive",
                performer="Gloria Gaynor",
                singers="Jamie",
                notes="Power vocals",
                ip_address="admin::127.0.0.1",
                created_at=now - timedelta(hours=7, minutes=5),
                played_at=now - timedelta(hours=6, minutes=50),
                is_played=True,
            ),
        ]

        session.add_all(samples)
        return len(samples)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seed the kareoQ database with sample data")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate all tables before seeding",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Insert seed rows even if the database already has data",
    )
    args = parser.parse_args(argv)

    if args.reset:
        reset_db()

    inserted = seed_song_requests(skip_if_any=not args.force)
    print(f"Seed complete. Inserted {inserted} row(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
