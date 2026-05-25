from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import User, Achievement, CollaborationRequest, Notification, ActiveCollaboration
from app.middleware.auth import sanitize_input
from app.utils.helpers import award_points
from app.utils.ai_service import detect_fake_profile, analyze_skills
import json
import math

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    search = request.args.get('search', '')
    skill = request.args.get('skill', '')
    department = request.args.get('department', '')

    query = User.query.filter_by(is_active=True)
    if search:
        query = query.filter(User.name.ilike(f'%{search}%'))
    if department:
        query = query.filter(User.department.ilike(f'%{department}%'))
    if skill:
        query = query.filter(User.skills.ilike(f'%{skill}%'))

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'users': [u.to_dict() for u in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    current_id = int(get_jwt_identity())
    is_own = (current_id == user_id)
    data = user.to_dict(include_private=is_own)
    data['achievements'] = [a.to_dict() for a in user.achievements.all()]
    return jsonify({'user': data}), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json()

    updatable = ['name', 'department', 'university', 'year_of_study', 'bio',
                 'github_url', 'linkedin_url', 'portfolio_url', 'location',
                 'latitude', 'longitude', 'startup_interest', 'is_mentor',
                 'hackathon_count', 'avatar']

    for field in updatable:
        if field in data:
            val = data[field]
            if isinstance(val, str):
                val = sanitize_input(val)
            setattr(user, field, val)

    if 'skills' in data:
        user.skills = json.dumps(data['skills'] if isinstance(data['skills'], list) else [])
    if 'interests' in data:
        user.interests = json.dumps(data['interests'] if isinstance(data['interests'], list) else [])

    # Recalculate trust score
    profile_data = {
        'skills': user.get_skills(),
        'projects_count': user.projects.count(),
        'bio': user.bio or '',
        'github_url': user.github_url,
        'linkedin_url': user.linkedin_url,
        'hackathon_count': user.hackathon_count
    }
    fake_result = detect_fake_profile(profile_data)
    user.trust_score = fake_result.get('trust_score', user.trust_score)

    db.session.commit()
    award_points(user, 10)
    return jsonify({'user': user.to_dict(include_private=True), 'message': 'Profile updated'}), 200

@users_bp.route('/nearby', methods=['GET'])
@jwt_required()
def get_nearby_users():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    radius_km = request.args.get('radius', 50, type=float)

    if not current_user.latitude or not current_user.longitude:
        return jsonify({'error': 'Location not set'}), 400

    users = User.query.filter(
        User.id != user_id,
        User.latitude.isnot(None),
        User.longitude.isnot(None),
        User.is_active == True
    ).all()

    nearby = []
    for u in users:
        dist = haversine(current_user.latitude, current_user.longitude, u.latitude, u.longitude)
        if dist <= radius_km:
            user_dict = u.to_dict()
            user_dict['distance_km'] = round(dist, 2)
            nearby.append(user_dict)

    nearby.sort(key=lambda x: x['distance_km'])
    return jsonify({'users': nearby[:50]}), 200

@users_bp.route('/match-recommendations', methods=['GET'])
@jwt_required()
def get_match_recommendations():
    from app.utils.ai_service import generate_team_match_score
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)

    candidates = User.query.filter(User.id != user_id, User.is_active == True).limit(50).all()
    matches = []
    for candidate in candidates:
        score = generate_team_match_score(
            current_user.get_skills(), candidate.get_skills(),
            current_user.get_interests(), candidate.get_interests()
        )
        user_dict = candidate.to_dict()
        user_dict['match_score'] = score
        matches.append(user_dict)

    matches.sort(key=lambda x: x['match_score'], reverse=True)
    return jsonify({'matches': matches[:20]}), 200

@users_bp.route('/analyze-skills', methods=['POST'])
@jwt_required()
def analyze_user_skills():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json() or {}

    result = analyze_skills(
        user.get_skills(),
        data.get('projects', f'{user.projects.count()} projects'),
        user.get_interests()
    )
    return jsonify({'analysis': result}), 200

@users_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    users = User.query.filter_by(is_active=True).order_by(User.points.desc()).limit(50).all()
    return jsonify({'leaderboard': [u.to_dict() for u in users]}), 200

@users_bp.route('/send-collab-request', methods=['POST'])
@jwt_required()
def send_collab_request():
    sender_id = int(get_jwt_identity())
    data = request.get_json() or {}
    receiver_id = data.get('receiver_id')

    if not receiver_id:
        return jsonify({'error': 'receiver_id is required'}), 400
    receiver_id = int(receiver_id)
    if receiver_id == sender_id:
        return jsonify({'error': 'Cannot send request to yourself'}), 400

    receiver = User.query.get(receiver_id)
    if not receiver or not receiver.is_active:
        return jsonify({'error': 'User not found'}), 404

    existing = CollaborationRequest.query.filter(
        CollaborationRequest.sender_id == sender_id,
        CollaborationRequest.receiver_id == receiver_id,
        CollaborationRequest.status == 'pending',
    ).first()
    if existing:
        return jsonify({'error': 'Request already sent'}), 409

    reverse_pending = CollaborationRequest.query.filter(
        CollaborationRequest.sender_id == receiver_id,
        CollaborationRequest.receiver_id == sender_id,
        CollaborationRequest.status == 'pending',
    ).first()
    if reverse_pending:
        return jsonify({'error': 'They already sent you a request — accept theirs instead'}), 409

    req = CollaborationRequest(
        sender_id=sender_id,
        receiver_id=receiver_id,
        project_id=data.get('project_id'),
        message=sanitize_input(data.get('message', '')),
    )
    db.session.add(req)

    notif = Notification(
        user_id=receiver_id,
        title='New Collaboration Request',
        message=f'{User.query.get(sender_id).name if User.query.get(sender_id) else "Someone"} wants to collaborate!',
        type='collab_request',
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'message': 'Request sent', 'request': req.to_dict(), 'success': True}), 201

@users_bp.route('/collab-requests', methods=['GET'])
@jwt_required()
def get_collab_requests():
    user_id = int(get_jwt_identity())
    received = CollaborationRequest.query.filter_by(receiver_id=user_id).order_by(
        CollaborationRequest.created_at.desc()
    ).all()
    sent = CollaborationRequest.query.filter_by(sender_id=user_id).order_by(
        CollaborationRequest.created_at.desc()
    ).all()
    return jsonify({
        'received': [r.to_dict() for r in received],
        'sent': [r.to_dict() for r in sent],
        'requests': [r.to_dict() for r in received],
    }), 200

@users_bp.route('/collab-requests/<int:req_id>', methods=['PUT'])
@jwt_required()
def respond_collab_request(req_id):
    user_id = int(get_jwt_identity())
    req = CollaborationRequest.query.get_or_404(req_id)
    if req.receiver_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    status = data.get('status', 'accepted')
    if status not in ('accepted', 'rejected'):
        return jsonify({'error': 'Invalid status'}), 400
    if req.status != 'pending':
        return jsonify({'error': f'Request already {req.status}'}), 400
    req.status = status
    if status == 'accepted':
        a, b = sorted([req.sender_id, req.receiver_id])
        if not ActiveCollaboration.query.filter_by(user_a_id=a, user_b_id=b, status='active').first():
            db.session.add(ActiveCollaboration(
                user_a_id=a, user_b_id=b, project_id=req.project_id, request_id=req.id, status='active',
            ))
    notif = Notification(
        user_id=req.sender_id,
        title=f'Collaboration {"Accepted" if status == "accepted" else "Declined"}',
        message=f'Your request was {status}.',
        type='collab_request'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'message': f'Request {req.status}', 'request': req.to_dict()}), 200

@users_bp.route('/collab-requests/<int:req_id>/cancel', methods=['DELETE'])
@jwt_required()
def cancel_collab_request(req_id):
    user_id = int(get_jwt_identity())
    req = CollaborationRequest.query.get_or_404(req_id)
    if req.sender_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    if req.status != 'pending':
        return jsonify({'error': 'Can only cancel pending requests'}), 400
    db.session.delete(req)
    db.session.commit()
    return jsonify({'message': 'Request cancelled'}), 200

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
