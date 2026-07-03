"""SQLite 数据访问层：连接管理 + 初始化 + 管理员预置。"""
import sqlite3
from pathlib import Path

from flask import g
from werkzeug.security import generate_password_hash

DB_PATH = Path(__file__).resolve().parent / "users.db"


def get_db():
    """获取当前请求的数据库连接（每个请求复用，请求结束自动关闭）。"""
    if "db" not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """首次启动建表并预置管理员账号 admin / admin123。"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT NOT NULL UNIQUE,
            email         TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL DEFAULT 'user',
            status        INTEGER NOT NULL DEFAULT 1,
            created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            updated_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        )
        """
    )
    if conn.execute("SELECT id FROM users WHERE username = ?", ("admin",)).fetchone() is None:
        conn.execute(
            "INSERT INTO users (username, email, password_hash, role, status) "
            "VALUES (?,?,?,?,1)",
            ("admin", "admin@example.com", generate_password_hash("admin123"), "admin"),
        )
    conn.commit()
    conn.close()
