"""用户管理路由：列表 / 增删改查 / 状态切换 / 统计概览（管理员）。"""
import re

from flask import Blueprint, g, jsonify, request
from werkzeug.security import generate_password_hash

from auth import admin_required
from db import get_db

bp = Blueprint("users", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")


def ok(data=None, message="ok"):
    return jsonify({"code": 0, "message": message, "data": data})


def fail(message, code=400, http=400):
    return jsonify({"code": code, "message": message, "data": None}), http


def row_to_dict(r):
    return {
        "id": r["id"],
        "username": r["username"],
        "email": r["email"],
        "role": r["role"],
        "status": r["status"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
    }


def _int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@bp.get("/users")
@admin_required
def list_users():
    page = max(_int(request.args.get("page"), 1), 1)
    size = min(max(_int(request.args.get("size"), 10), 1), 100)
    keyword = (request.args.get("keyword") or "").strip()
    role = (request.args.get("role") or "").strip()
    status = request.args.get("status")

    where, params = [], []
    if keyword:
        where.append("(username LIKE ? OR email LIKE ?)")
        params += [f"%{keyword}%", f"%{keyword}%"]
    if role in ("admin", "user"):
        where.append("role = ?")
        params.append(role)
    if status in ("0", "1"):
        where.append("status = ?")
        params.append(int(status))
    clause = (" WHERE " + " AND ".join(where)) if where else ""

    db = get_db()
    total = db.execute(f"SELECT COUNT(*) AS c FROM users{clause}", params).fetchone()["c"]
    rows = db.execute(
        f"SELECT * FROM users{clause} ORDER BY id DESC LIMIT ? OFFSET ?",
        params + [size, (page - 1) * size],
    ).fetchall()
    return ok(
        {
            "list": [row_to_dict(r) for r in rows],
            "total": total,
            "page": page,
            "size": size,
        }
    )


@bp.post("/users")
@admin_required
def create_user():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip()
    status = data.get("status")

    if not username or not email or not password:
        return fail("请填写完整信息")
    if len(username) < 3 or len(username) > 20:
        return fail("用户名长度需为 3-20 位")
    if not EMAIL_RE.match(email):
        return fail("邮箱格式不正确")
    if len(password) < 6:
        return fail("密码长度至少 6 位")
    if role not in ("admin", "user"):
        return fail("角色非法")
    if status not in (0, 1):
        status = 1

    db = get_db()
    if db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
        return fail("用户名已存在")
    if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        return fail("邮箱已存在")

    cur = db.execute(
        "INSERT INTO users (username, email, password_hash, role, status) VALUES (?,?,?,?,?)",
        (username, email, generate_password_hash(password), role, status),
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return ok(row_to_dict(row), "创建成功")


@bp.get("/users/<int:user_id>")
@admin_required
def get_user(user_id):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return fail("用户不存在", 404, 404)
    return ok(row_to_dict(row))


@bp.put("/users/<int:user_id>")
@admin_required
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return fail("用户不存在", 404, 404)

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "").strip()
    status = data.get("status")
    password = data.get("password") or ""

    if not username or not email:
        return fail("用户名和邮箱不能为空")
    if not EMAIL_RE.match(email):
        return fail("邮箱格式不正确")
    if role not in ("admin", "user"):
        return fail("角色非法")
    if status not in (0, 1):
        status = row["status"]

    if db.execute(
        "SELECT id FROM users WHERE username = ? AND id != ?", (username, user_id)
    ).fetchone():
        return fail("用户名已存在")
    if db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?", (email, user_id)
    ).fetchone():
        return fail("邮箱已存在")

    if password:
        if len(password) < 6:
            return fail("密码长度至少 6 位")
        db.execute(
            "UPDATE users SET username=?, email=?, role=?, status=?, password_hash=?, "
            "updated_at=datetime('now','localtime') WHERE id=?",
            (username, email, role, status, generate_password_hash(password), user_id),
        )
    else:
        db.execute(
            "UPDATE users SET username=?, email=?, role=?, status=?, "
            "updated_at=datetime('now','localtime') WHERE id=?",
            (username, email, role, status, user_id),
        )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return ok(row_to_dict(row), "更新成功")


@bp.delete("/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return fail("用户不存在", 404, 404)
    if row["role"] == "admin":
        active_admins = db.execute(
            "SELECT COUNT(*) AS c FROM users WHERE role='admin' AND status=1"
        ).fetchone()["c"]
        if active_admins <= 1:
            return fail("不能删除最后一个启用的管理员")
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    return ok(None, "删除成功")


@bp.patch("/users/<int:user_id>/status")
@admin_required
def toggle_status(user_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in (0, 1):
        return fail("状态非法")

    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return fail("用户不存在", 404, 404)
    if row["role"] == "admin" and status == 0:
        active_admins = db.execute(
            "SELECT COUNT(*) AS c FROM users WHERE role='admin' AND status=1"
        ).fetchone()["c"]
        if active_admins <= 1:
            return fail("不能禁用最后一个启用的管理员")
    db.execute(
        "UPDATE users SET status=?, updated_at=datetime('now','localtime') WHERE id=?",
        (status, user_id),
    )
    db.commit()
    return ok({"id": user_id, "status": status}, "状态已更新")


@bp.get("/stats")
@admin_required
def stats():
    db = get_db()
    return ok(
        {
            "total": db.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"],
            "active": db.execute("SELECT COUNT(*) AS c FROM users WHERE status=1").fetchone()["c"],
            "disabled": db.execute("SELECT COUNT(*) AS c FROM users WHERE status=0").fetchone()["c"],
            "admins": db.execute("SELECT COUNT(*) AS c FROM users WHERE role='admin'").fetchone()["c"],
        }
    )
