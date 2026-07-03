"""JWT 鉴权与密码工具：Token 生成/校验、鉴权装饰器。"""
import datetime
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from db import get_db


def generate_token(user):
    """为指定用户生成 24h 有效的 JWT。"""
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "username": user["username"],
        "role": user["role"],
        "iat": now,
        "exp": now + datetime.timedelta(hours=24),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user():
    """从请求头解析 Token 并返回用户记录，失败返回 None。"""
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    payload = decode_token(header.split(" ", 1)[1])
    if not payload:
        return None
    db = get_db()
    return db.execute("SELECT * FROM users WHERE id = ?", (int(payload["sub"]),)).fetchone()


def _unauthorized(message):
    return jsonify({"code": 401, "message": message, "data": None}), 401


def _forbidden(message):
    return jsonify({"code": 403, "message": message, "data": None}), 403


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return _unauthorized("未登录或登录已过期")
        if not user["status"]:
            return _forbidden("账号已被禁用，请联系管理员")
        g.current_user = user
        return f(*args, **kwargs)

    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return _unauthorized("未登录或登录已过期")
        if not user["status"]:
            return _forbidden("账号已被禁用，请联系管理员")
        if user["role"] != "admin":
            return _forbidden("无权限访问该资源")
        g.current_user = user
        return f(*args, **kwargs)

    return wrapper
