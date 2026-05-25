from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import Event, User
from app.middleware.auth import sanitize_input
import json
from datetime import datetime

events_bp = Blueprint('events', __name__)

@events_bp.route('/', methods=['GET'])
@jwt_required()
def get_events():
    page = request.args.get('page', 1, type=int)
    event_type = request.args.get('type', '')
    search = request.args.get('search', '')

    query = Event.query
    if event_type:
        query = query.filter_by(event_type=event_type)
    if search:
        query = query.filter(Event.title.ilike(f'%{search}%'))

    query = query.order_by(Event.start_date.asc())
    paginated = query.paginate(page=page, per_page=12, error_out=False)
    return jsonify({
        'events': [e.to_dict() for e in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages
    }), 200

@events_bp.route('/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    event = Event.query.get_or_404(event_id)
    return jsonify({'event': event.to_dict()}), 200

@events_bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('title'):
        return jsonify({'error': 'Title required'}), 400

    event = Event(
        title=sanitize_input(data['title']),
        description=sanitize_input(data.get('description', '')),
        event_type=data.get('event_type', 'hackathon'),
        organizer_id=user_id,
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
        location=data.get('location'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        is_online=data.get('is_online', False),
        registration_url=data.get('registration_url'),
        prize_pool=data.get('prize_pool'),
        max_participants=data.get('max_participants'),
        tags=json.dumps(data.get('tags', [])),
        is_featured=data.get('is_featured', False)
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({'event': event.to_dict(), 'message': 'Event created'}), 201

@events_bp.route('/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_for_event(event_id):
    event = Event.query.get_or_404(event_id)
    if event.max_participants and event.current_participants >= event.max_participants:
        return jsonify({'error': 'Event is full'}), 400
    event.current_participants += 1
    db.session.commit()
    return jsonify({'message': 'Registered for event', 'event': event.to_dict()}), 200

@events_bp.route('/featured', methods=['GET'])
@jwt_required()
def get_featured_events():
    events = Event.query.filter_by(is_featured=True).order_by(Event.start_date.asc()).limit(6).all()
    return jsonify({'events': [e.to_dict() for e in events]}), 200

@events_bp.route('/nearby', methods=['GET'])
@jwt_required()
def get_nearby_events():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user.latitude or not user.longitude:
        return jsonify({'events': Event.query.limit(10).all()}), 200

    import math
    events = Event.query.filter(Event.latitude.isnot(None)).all()
    nearby = []
    for e in events:
        dlat = math.radians(e.latitude - user.latitude)
        dlon = math.radians(e.longitude - user.longitude)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(user.latitude)) * math.cos(math.radians(e.latitude)) * math.sin(dlon/2)**2
        dist = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        if dist <= 200:
            ed = e.to_dict()
            ed['distance_km'] = round(dist, 2)
            nearby.append(ed)

    nearby.sort(key=lambda x: x['distance_km'])
    return jsonify({'events': nearby[:20]}), 200
