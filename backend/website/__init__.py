from flask import Flask, jsonify, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
import os
from os import path
from flask_login import LoginManager
from datetime import timedelta
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
DB_NAME = "database.db"


def create_app():
    app = Flask(__name__, static_folder='static')
    app.config['SECRET_KEY'] = 'szekret'
    #app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
    #app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@db:5432/sortify'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost:5432/sortify'
    app.config['REMEMBER_COOKIE_DURATION'] = timedelta(hours=1)

    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)    
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER 

    db.init_app(app)
    migrate.init_app(app, db)

    from .views import views
    from .auth import auth
    from .views import projects_bp

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(projects_bp)

    from .models import User_profile

    create_database(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return User_profile.query.get(int(id))
    
    @login_manager.unauthorized_handler
    def unauthorized():
        # Check if the request is an API request
        if request.path.startswith('/api/'):
            return jsonify({"error": "Unauthorized"}), 401
        else:
            # Redirect to the login page for non-API requests
            return redirect(url_for('auth.login'))
    
    return app

#PostgreSQL
def create_database(app):
    with app.app_context():
        db.create_all()
    print('Checked/created tables (if missing).')

#SQLite
# def create_database(app):
#     db_path = path.join('instance', DB_NAME)
#     if not path.exists(db_path):
#         with app.app_context():
#             db.create_all()
#         print('Created Database!')