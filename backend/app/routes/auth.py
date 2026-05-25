from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from app.extensions import db, bcrypt
from app.models.models import User, Notification
from app.utils.helpers import generate_otp, send_otp_email, award_points
from app.middleware.auth import validate_required_fields, sanitize_input
from datetime import datetime, timedelta
import json
import logging
import requests
import os

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)


def _issue_tokens(user):
    """Flask-JWT-Extended requires string identities."""
    identity = str(user.id)
    return (
        create_access_token(identity=identity),
        create_refresh_token(identity=identity),
    )


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    valid, error = validate_required_fields(data, ['name', 'email', 'password'])
    if not valid:
        return jsonify({'error': error}), 400

    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'error': 'Email already registered'}), 409

    pw_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    user = User(
        name=sanitize_input(data['name']),
        email=data['email'].lower(),
        password_hash=pw_hash,
        department=data.get('department'),
        university=data.get('university'),
        is_verified=True,
    )
    db.session.add(user)
    db.session.commit()

    notif = Notification(user_id=user.id, title='Welcome to InnovX AI! 🚀',
                         message='Complete your profile to get started.', type='welcome')
    db.session.add(notif)
    db.session.commit()

    award_points(user, 50, 'Joined InnovX AI')
    access_token, refresh_token = _issue_tokens(user)

    return jsonify({
        'message': 'Registration successful.',
        'user_id': user.id,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(include_private=True),
    }), 201

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    user = User.query.get(data.get('user_id'))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.otp != data.get('otp'):
        return jsonify({'error': 'Invalid OTP'}), 400
    if user.otp_expiry < datetime.utcnow():
        return jsonify({'error': 'OTP expired'}), 400

    user.is_verified = True
    user.otp = None
    user.otp_expiry = None
    db.session.commit()
    award_points(user, 50, 'Email Verified')

    access_token, refresh_token = _issue_tokens(user)
    return jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': user.to_dict(include_private=True)}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    valid, error = validate_required_fields(data, ['email', 'password'])
    if not valid:
        return jsonify({'error': error}), 400

    user = User.query.filter_by(email=data['email'].lower()).first()
    if not user or not user.password_hash:
        return jsonify({'error': 'Invalid credentials'}), 401
    if not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account deactivated'}), 403

    access_token, refresh_token = _issue_tokens(user)
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(include_private=True)
    }), 200

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('token')
    if not token:
        return jsonify({'error': 'Token required'}), 400

    try:
        google_data = requests.get(f'https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}').json()
        if 'error' in google_data:
            return jsonify({'error': 'Invalid Google token'}), 401

        user = User.query.filter_by(email=google_data['email']).first()
        if not user:
            user = User(
                name=google_data.get('name', ''),
                email=google_data['email'],
                google_id=google_data.get('sub'),
                avatar=google_data.get('picture'),
                is_verified=True
            )
            db.session.add(user)
            db.session.commit()
            award_points(user, 50, 'Joined InnovX AI')

        access_token, refresh_token = _issue_tokens(user)
        return jsonify({'access_token': access_token, 'refresh_token': refresh_token, 'user': user.to_dict(include_private=True)}), 200
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        return jsonify({'error': 'Google authentication failed'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email', '').lower()).first()
    if not user:
        return jsonify({'message': 'If email exists, OTP sent'}), 200

    otp = generate_otp()
    user.otp = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.session.commit()
    send_otp_email(user.email, otp, user.name)
    return jsonify({'message': 'OTP sent to email', 'user_id': user.id}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    user = User.query.get(data.get('user_id'))
    if not user or user.otp != data.get('otp') or user.otp_expiry < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    user.password_hash = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
    user.otp = None
    user.otp_expiry = None
    db.session.commit()
    return jsonify({'message': 'Password reset successful'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict(include_private=True)}), 200
