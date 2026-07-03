"""认证路由：注册 / 登录 / 个人资料。"""
import re

from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from auth import generate_token, login_required
from db import get_db

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")


def ok(data=None, message="ok"):
    return jsonify({"code": 0, "message": message, "data": data})


def fail(message, code=400, http=400):
    return jsonify({"code": code, "message": message, "data": None}), http


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return fail("请填写完整信息")
    if len(username) < 3 or len(username) > 20:
        return fail("用户名长度需为 3-20 位")
    if not EMAIL_RE.match(email):
        return fail("邮箱格式不正确")
    if len(password) < 6:
        return fail("密码长度至少 6 位")

    db = get_db()
    if db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
        return fail("用户名已被注册")
    if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        return fail("邮箱已被注册")

    cur = db.execute(
        "INSERT INTO users (username, email, password_hash, role, status) VALUES (?,?,?,?,1)",
        (username, email, generate_password_hash(password), "user"),
    )
    db.commit()
    return ok({"id": cur.lastrowid, "username": username, "email": email}, "注册成功")


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    account = (data.get("account") or "").strip()
    password = data.get("password") or ""

    if not account or not password:
        return fail("请输入账号和密码")

    db = get_db()
    lookup = account.lower() if "@" in account else account
    row = db.execute(
        "SELECT * FROM users WHERE username = ? OR email = ?", (account, lookup)
    ).fetchone()

    if not row or not check_password_hash(row["password_hash"], password):
        return fail("账号或密码错误", 401, 401)
    if not row["status"]:
        return fail("账号已被禁用，请联系管理员", 403, 403)

    token = generate_token(row)
    return ok(
        {
            "token": token,
            "user": {
                "id": row["id"],
                "username": row["username"],
                "email": row["email"],
                "role": row["role"],
            },
        },
        "登录成功",
    )


@bp.get("/profile")
@login_required
def profile():
    u = g.current_user
    return ok(
        {
            "id": u["id"],
            "username": u["username"],
            "email": u["email"],
            "role": u["role"],
            "status": u["status"],
            "created_at": u["created_at"],
        }
    )
