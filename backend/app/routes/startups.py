from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import Startup, Notification, User
from app.middleware.auth import sanitize_input
from app.utils.helpers import award_points
import json

startups_bp = Blueprint('startups', __name__)

@startups_bp.route('/', methods=['GET'])
@jwt_required()
def get_startups():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    domain = request.args.get('domain', '')
    stage = request.args.get('stage', '')
    search = request.args.get('search', '')

    query = Startup.query
    if domain:
        query = query.filter(Startup.domain.ilike(f'%{domain}%'))
    if stage:
        query = query.filter_by(stage=stage)
    if search:
        query = query.filter(Startup.name.ilike(f'%{search}%'))

    query = query.order_by(Startup.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'startups': [s.to_dict() for s in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@startups_bp.route('/<int:startup_id>', methods=['GET'])
@jwt_required()
def get_startup(startup_id):
    startup = Startup.query.get_or_404(startup_id)
    startup.views += 1
    db.session.commit()
    return jsonify({'startup': startup.to_dict()}), 200

@startups_bp.route('/', methods=['POST'])
@jwt_required()
def create_startup():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Startup name required'}), 400

    startup = Startup(
        name=sanitize_input(data['name']),
        tagline=sanitize_input(data.get('tagline', '')),
        description=sanitize_input(data.get('description', '')),
        domain=data.get('domain'),
        stage=data.get('stage', 'idea'),
        website=data.get('website'),
        founder_id=user_id,
        looking_for=json.dumps(data.get('looking_for', [])),
        required_skills=json.dumps(data.get('required_skills', [])),
        funding_goal=data.get('funding_goal'),
        team_size=data.get('team_size', 1),
        location=data.get('location'),
        is_hiring=data.get('is_hiring', True)
    )
    db.session.add(startup)
    db.session.commit()

    user = User.query.get(user_id)
    award_points(user, 150, 'Startup Founder')
    return jsonify({'startup': startup.to_dict(), 'message': 'Startup created'}), 201

@startups_bp.route('/<int:startup_id>', methods=['PUT'])
@jwt_required()
def update_startup(startup_id):
    user_id = int(get_jwt_identity())
    startup = Startup.query.get_or_404(startup_id)
    if startup.founder_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    updatable = ['name', 'tagline', 'description', 'domain', 'stage', 'website',
                 'funding_goal', 'current_funding', 'team_size', 'location', 'is_hiring']
    for field in updatable:
        if field in data:
            setattr(startup, field, data[field])
    if 'looking_for' in data:
        startup.looking_for = json.dumps(data['looking_for'])
    if 'required_skills' in data:
        startup.required_skills = json.dumps(data['required_skills'])

    db.session.commit()
    return jsonify({'startup': startup.to_dict()}), 200

@startups_bp.route('/<int:startup_id>', methods=['DELETE'])
@jwt_required()
def delete_startup(startup_id):
    user_id = int(get_jwt_identity())
    startup = Startup.query.get_or_404(startup_id)
    if startup.founder_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(startup)
    db.session.commit()
    return jsonify({'message': 'Startup deleted'}), 200

@startups_bp.route('/<int:startup_id>/like', methods=['POST'])
@jwt_required()
def like_startup(startup_id):
    startup = Startup.query.get_or_404(startup_id)
    startup.likes += 1
    db.session.commit()
    return jsonify({'likes': startup.likes}), 200

@startups_bp.route('/my-startups', methods=['GET'])
@jwt_required()
def get_my_startups():
    user_id = int(get_jwt_identity())
    startups = Startup.query.filter_by(founder_id=user_id).all()
    return jsonify({'startups': [s.to_dict() for s in startups]}), 200
