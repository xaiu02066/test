"""Flask 应用入口：注册蓝图、托管页面与静态资源、初始化数据库。"""
import os

from flask import Flask, render_template
from flask_cors import CORS

from db import close_db, init_db
from routes.auth_routes import bp as auth_bp
from routes.user_routes import bp as user_bp


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me-please")
    CORS(app)

    app.teardown_appcontext(close_db)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/admin")
    @app.route("/admin.html")
    def admin():
        return render_template("admin.html")

    @app.route("/home")
    @app.route("/home.html")
    def home():
        return render_template("home.html")

    return app


app = create_app()

with app.app_context():
    init_db()


if __name__ == "__main__":
    # host=0.0.0.0：允许手机真机调试通过局域网 IP 访问本机后端
    app.run(host="0.0.0.0", port=5000, debug=True)
