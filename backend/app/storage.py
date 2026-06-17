from __future__ import annotations
import aiosqlite


CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    total_lines INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    python_index_time_ms REAL,
    cpp_index_time_ms REAL
)
"""


async def init_db(db: aiosqlite.Connection) -> None:
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute(CREATE_TABLE)
    await db.commit()


async def insert_file(db: aiosqlite.Connection, record: dict) -> None:
    await db.execute(
        """INSERT INTO files
           (id, filename, file_path, size_bytes, total_lines, created_at,
            python_index_time_ms, cpp_index_time_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            record["id"],
            record["filename"],
            record["file_path"],
            record["size_bytes"],
            record["total_lines"],
            record["created_at"],
            record.get("python_index_time_ms"),
            record.get("cpp_index_time_ms"),
        ),
    )
    await db.commit()


async def get_file(db: aiosqlite.Connection, file_id: str) -> dict | None:
    async with db.execute("SELECT * FROM files WHERE id = ?", (file_id,)) as cur:
        row = await cur.fetchone()
        if row is None:
            return None
        cols = [d[0] for d in cur.description]
        return dict(zip(cols, row))


async def list_files(db: aiosqlite.Connection) -> list[dict]:
    async with db.execute(
        "SELECT * FROM files ORDER BY created_at DESC"
    ) as cur:
        rows = await cur.fetchall()
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in rows]
