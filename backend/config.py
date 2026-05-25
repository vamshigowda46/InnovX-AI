import os
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import urlparse, urlencode, parse_qs

load_dotenv()

def _build_db_uri():
    raw = os.getenv('DATABASE_URL', 'mysql+pymysql://root:password@localhost:3306/innovx_db')
    parsed = urlparse(raw.replace('mysql+pymysql://', 'mysql://', 1))
    qs = parse_qs(parsed.query)
    ssl_mode = qs.pop('ssl-mode', [None])[0]
    new_qs = urlencode(qs, doseq=True) if qs else ''
    base = f'mysql+pymysql://{parsed.netloc}{parsed.path}'
    if new_qs:
        base += f'?{new_qs}'
    return base, ssl_mode

_DB_URI, _SSL_MODE = _build_db_uri()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'innovx-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'innovx-jwt-secret')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    SQLALCHEMY_DATABASE_URI = _DB_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    _ssl_connect_args = {}
    if _SSL_MODE and _SSL_MODE.upper() in ('REQUIRED', 'VERIFY_IDENTITY', 'VERIFY_CA'):
        _ssl_connect_args = {'ssl': {}}

    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'pool_size': 10,
        'max_overflow': 20,
        'connect_args': _ssl_connect_args,
    }

    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    CORS_ORIGINS = [os.getenv('FRONTEND_URL', 'http://localhost:5173')]

    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
