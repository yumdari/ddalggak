"""SQLite connection and schema initialization."""

import sqlite3
from pathlib import Path

from flask import current_app, g


def get_db():
    if "db" not in g:
        database = Path(current_app.config["DATABASE"])
        database.parent.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(database)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    schema = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
    db = get_db()
    db.executescript(schema)
    db.commit()
