from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import Mentor, MentorSession, User, Notification
from app.middleware.auth import sanitize_input
import json

mentors_bp = Blueprint('mentors', __name__)

@mentors_bp.route('/', methods=['GET'])
@jwt_required()
def get_mentors():
    page = request.args.get('page', 1, type=int)
    expertise = request.args.get('expertise', '')

    query = Mentor.query.filter_by(is_available=True)
    if expertise:
        query = query.filter(Mentor.expertise.ilike(f'%{expertise}%'))

    paginated = query.paginate(page=page, per_page=12, error_out=False)
    return jsonify({
        'mentors': [m.to_dict() for m in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages
    }), 200

@mentors_bp.route('/<int:mentor_id>', methods=['GET'])
@jwt_required()
def get_mentor(mentor_id):
    mentor = Mentor.query.get_or_404(mentor_id)
    return jsonify({'mentor': mentor.to_dict()}), 200

@mentors_bp.route('/register', methods=['POST'])
@jwt_required()
def register_mentor():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json()

    existing = Mentor.query.filter_by(user_id=user_id).first()
    if existing:
        return jsonify({'error': 'Already registered as mentor'}), 409

    mentor = Mentor(
        user_id=user_id,
        expertise=json.dumps(data.get('expertise', [])),
        experience_years=data.get('experience_years', 0),
        company=sanitize_input(data.get('company', '')),
        designation=sanitize_input(data.get('designation', '')),
        hourly_rate=data.get('hourly_rate', 0),
        availability=json.dumps(data.get('availability', [])),
        bio=sanitize_input(data.get('bio', ''))
    )
    db.session.add(mentor)
    user.is_mentor = True
    db.session.commit()
    return jsonify({'mentor': mentor.to_dict(), 'message': 'Registered as mentor'}), 201

@mentors_bp.route('/book-session', methods=['POST'])
@jwt_required()
def book_session():
    student_id = int(get_jwt_identity())
    data = request.get_json()
    mentor = Mentor.query.get_or_404(data.get('mentor_id'))

    from datetime import datetime
    session = MentorSession(
        mentor_id=mentor.id,
        student_id=student_id,
        scheduled_at=datetime.fromisoformat(data['scheduled_at']) if data.get('scheduled_at') else None,
        duration_minutes=data.get('duration_minutes', 60),
        topic=sanitize_input(data.get('topic', ''))
    )
    db.session.add(session)

    notif = Notification(
        user_id=mentor.user_id,
        title='New Session Booking',
        message=f'A student booked a mentoring session with you.',
        type='session_booking'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'session': session.to_dict(), 'message': 'Session booked'}), 201

@mentors_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    user_id = int(get_jwt_identity())
    mentor = Mentor.query.filter_by(user_id=user_id).first()

    if mentor:
        sessions = MentorSession.query.filter_by(mentor_id=mentor.id).all()
    else:
        sessions = MentorSession.query.filter_by(student_id=user_id).all()

    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200

@mentors_bp.route('/sessions/<int:session_id>/review', methods=['POST'])
@jwt_required()
def review_session(session_id):
    user_id = int(get_jwt_identity())
    session = MentorSession.query.get_or_404(session_id)
    if session.student_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    session.rating = data.get('rating')
    session.review = sanitize_input(data.get('review', ''))
    session.status = 'completed'

    mentor = Mentor.query.get(session.mentor_id)
    sessions_with_rating = MentorSession.query.filter(
        MentorSession.mentor_id == mentor.id,
        MentorSession.rating.isnot(None)
    ).all()
    if sessions_with_rating:
        mentor.rating = sum(s.rating for s in sessions_with_rating) / len(sessions_with_rating)
    mentor.total_sessions += 1
    db.session.commit()
    return jsonify({'message': 'Review submitted'}), 200
