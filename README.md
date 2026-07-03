# 用户管理系统 UserVault

基于 **Python + Flask + SQLite** 的用户管理系统，提供用户注册、登录与后台用户管理功能。前端使用原生 HTML/CSS/JS，前后端通过 RESTful API（JWT 鉴权）交互。

## 功能特性

- 用户注册 / 登录（用户名或邮箱登录）
- JWT Token 鉴权，密码 Werkzeug 加盐哈希
- 后台用户管理：列表、新增、编辑、删除、启用/禁用
- 关键字搜索、角色/状态筛选、分页
- 统计概览（总数 / 启用 / 禁用 / 管理员数）
- 角色权限：普通用户、管理员
- 深色「指挥中心」风格 UI，响应式布局

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python 3 · Flask 3 · PyJWT · Flask-CORS · Werkzeug |
| 数据库 | SQLite 3（文件型，免安装） |
| 前端 | HTML5 · CSS3 · JavaScript (ES6+) · Fetch API |

## 目录结构

```
.
├── app.py                # Flask 入口
├── db.py                 # SQLite 初始化与数据访问
├── auth.py               # JWT 与密码哈希、鉴权装饰器
├── routes/
│   ├── __init__.py
│   ├── auth_routes.py    # 注册/登录/profile
│   └── user_routes.py    # 用户 CRUD + 统计
├── static/
│   ├── css/style.css
│   └── js/{app,admin,home}.js
├── templates/
│   ├── index.html        # 登录注册
│   ├── admin.html        # 管理后台
│   └── home.html         # 用户主页
├── requirements.txt
└── README.md
```

## 快速开始

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动服务（首次启动自动创建数据库并预置管理员）
python app.py

# 3. 浏览器访问
# http://127.0.0.1:5000
```

## 默认管理员账号

```
用户名：admin
密码：  admin123
```

> 登录后可在后台修改密码。生产环境请务必修改 `app.py` 中的 `SECRET_KEY`。

## API 一览

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 公开 |
| POST | `/api/auth/login` | 登录 | 公开 |
| GET  | `/api/auth/profile` | 当前用户信息 | 登录 |
| GET  | `/api/users` | 用户列表（分页/搜索） | 管理员 |
| POST | `/api/users` | 新增用户 | 管理员 |
| GET  | `/api/users/<id>` | 用户详情 | 管理员 |
| PUT  | `/api/users/<id>` | 编辑用户 | 管理员 |
| DELETE | `/api/users/<id>` | 删除用户 | 管理员 |
| PATCH | `/api/users/<id>/status` | 启用/禁用 | 管理员 |
| GET  | `/api/stats` | 统计概览 | 管理员 |

请求需在 Header 携带 `Authorization: Bearer <token>`。统一响应：`{ "code": 0, "message": "ok", "data": {} }`。

## 安全说明

- 密码使用 Werkzeug `generate_password_hash` 加盐哈希存储，不可逆
- JWT 过期时间 24 小时，密钥由 `SECRET_KEY` 环境变量配置
- 防止删除/禁用最后一个启用的管理员
- 注册防用户名/邮箱重复
