from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.models import User
import logging

logger = logging.getLogger(__name__)

def jwt_required_custom(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"JWT error: {str(e)}")
            return jsonify({'error': 'Invalid or expired token'}), 401
    return decorated

def get_current_user():
    try:
        user_id = int(get_jwt_identity())
        return User.query.get(user_id)
    except:
        return None

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user or not user.is_verified:
                return jsonify({'error': 'Admin access required'}), 403
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    return decorated

def sanitize_input(data):
    if isinstance(data, str):
        return data.replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
    return data

def validate_required_fields(data, fields):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None
