from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import User, Project, Startup, Event, Achievement
from app.extensions import db
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    total_users = User.query.filter_by(is_active=True).count()
    total_projects = Project.query.count()
    total_startups = Startup.query.count()
    total_events = Event.query.count()

    my_projects = user.projects.count()
    my_startups = user.startups.count()

    top_innovators = User.query.filter_by(is_active=True).order_by(
        User.innovation_score.desc()
    ).limit(5).all()

    recent_projects = Project.query.order_by(Project.created_at.desc()).limit(6).all()
    recent_startups = Startup.query.order_by(Startup.created_at.desc()).limit(4).all()

    return jsonify({
        'platform_stats': {
            'total_users': total_users,
            'total_projects': total_projects,
            'total_startups': total_startups,
            'total_events': total_events
        },
        'my_stats': {
            'projects': my_projects,
            'startups': my_startups,
            'points': user.points,
            'rank': user.rank,
            'innovation_score': user.innovation_score,
            'trust_score': user.trust_score
        },
        'top_innovators': [u.to_dict() for u in top_innovators],
        'recent_projects': [p.to_dict() for p in recent_projects],
        'recent_startups': [s.to_dict() for s in recent_startups],
        'achievements': [a.to_dict() for a in user.achievements.limit(5).all()]
    }), 200

@dashboard_bp.route('/search', methods=['GET'])
@jwt_required()
def global_search():
    query = request.args.get('q', '')
    if not query or len(query) < 2:
        return jsonify({'results': {}}), 200

    users = User.query.filter(
        User.name.ilike(f'%{query}%') | User.skills.ilike(f'%{query}%') | User.department.ilike(f'%{query}%')
    ).limit(5).all()

    projects = Project.query.filter(
        Project.title.ilike(f'%{query}%') | Project.description.ilike(f'%{query}%') | Project.tech_stack.ilike(f'%{query}%')
    ).limit(5).all()

    startups = Startup.query.filter(
        Startup.name.ilike(f'%{query}%') | Startup.domain.ilike(f'%{query}%')
    ).limit(5).all()

    events = Event.query.filter(
        Event.title.ilike(f'%{query}%') | Event.tags.ilike(f'%{query}%')
    ).limit(5).all()

    return jsonify({
        'results': {
            'users': [u.to_dict() for u in users],
            'projects': [p.to_dict() for p in projects],
            'startups': [s.to_dict() for s in startups],
            'events': [e.to_dict() for e in events]
        }
    }), 200

@dashboard_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    new_users = User.query.filter(User.created_at >= thirty_days_ago).count()
    new_projects = Project.query.filter(Project.created_at >= thirty_days_ago).count()
    new_startups = Startup.query.filter(Startup.created_at >= thirty_days_ago).count()

    skill_counts = {}
    users = User.query.filter(User.skills != '[]', User.skills.isnot(None)).all()
    for user in users:
        for skill in user.get_skills():
            skill_counts[skill] = skill_counts.get(skill, 0) + 1

    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    domain_counts = {}
    for project in Project.query.all():
        if project.domain:
            domain_counts[project.domain] = domain_counts.get(project.domain, 0) + 1

    return jsonify({
        'growth': {
            'new_users_30d': new_users,
            'new_projects_30d': new_projects,
            'new_startups_30d': new_startups
        },
        'top_skills': [{'skill': s, 'count': c} for s, c in top_skills],
        'project_domains': [{'domain': d, 'count': c} for d, c in domain_counts.items()]
    }), 200


@dashboard_bp.route('/heatmap', methods=['GET'])
@jwt_required()
def innovation_heatmap():
    users = User.query.filter(
        User.latitude.isnot(None),
        User.longitude.isnot(None),
        User.is_active == True
    ).all()
    events = Event.query.filter(
        Event.latitude.isnot(None),
        Event.longitude.isnot(None)
    ).limit(30).all()
    startups = Startup.query.filter(Startup.location.isnot(None)).limit(20).all()

    innovators = [{
        'id': u.id, 'name': u.name, 'lat': u.latitude, 'lng': u.longitude,
        'type': 'innovator', 'score': u.innovation_score,
        'department': u.department,
    } for u in users]

    hotspots = [{
        'id': s.id, 'name': s.name, 'lat': 12.97 + (s.id % 10) * 0.01,
        'lng': 77.59 + (s.id % 10) * 0.01, 'type': 'startup', 'domain': s.domain,
    } for s in startups]

    event_points = [{
        'id': e.id, 'name': e.title, 'lat': e.latitude, 'lng': e.longitude,
        'type': 'event', 'event_type': e.event_type,
    } for e in events]

    return jsonify({
        'innovators': innovators,
        'startups': hotspots,
        'events': event_points,
        'collaboration_zones': innovators[:15],
    }), 200


@dashboard_bp.route('/activity-feed', methods=['GET'])
@jwt_required()
def activity_feed():
    from app.models.models import ActivityLog
    activities = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(30).all()
    if not activities:
        users = User.query.filter_by(is_active=True).limit(5).all()
        projects = Project.query.order_by(Project.created_at.desc()).limit(5).all()
        feed = []
        for p in projects:
            feed.append({
                'id': p.id, 'activity_type': 'project',
                'title': f'New project: {p.title}',
                'description': p.domain or 'Innovation',
                'user': p.owner.to_dict() if p.owner else None,
                'created_at': p.created_at.isoformat() if p.created_at else None,
            })
        for u in users:
            feed.append({
                'id': u.id, 'activity_type': 'innovator',
                'title': f'{u.name} joined the ecosystem',
                'description': u.department or 'Innovator',
                'user': u.to_dict(),
                'created_at': u.created_at.isoformat() if u.created_at else None,
            })
        return jsonify({'activities': feed}), 200
    return jsonify({'activities': [a.to_dict() for a in activities]}), 200


@dashboard_bp.route('/innovation-score/<int:target_id>', methods=['GET'])
@jwt_required()
def compute_innovation_score(target_id):
    from app.models.models import CollaborationRequest
    user = User.query.get_or_404(target_id)
    accepted_collabs = CollaborationRequest.query.filter(
        ((CollaborationRequest.sender_id == target_id) | (CollaborationRequest.receiver_id == target_id)),
        CollaborationRequest.status == 'accepted'
    ).count()
    score = min(100, (
        user.projects.count() * 8 +
        user.startups.count() * 15 +
        (user.hackathon_count or 0) * 10 +
        len(user.get_skills()) * 3 +
        accepted_collabs * 5 +
        user.achievements.count() * 4 +
        int((user.trust_score or 0) / 10)
    ))
    user.innovation_score = score
    db.session.commit()
    return jsonify({
        'innovation_score': score,
        'breakdown': {
            'projects': user.projects.count(),
            'startups': user.startups.count(),
            'hackathons': user.hackathon_count or 0,
            'skills': len(user.get_skills()),
            'collaborations': accepted_collabs,
            'achievements': user.achievements.count(),
            'trust_factor': user.trust_score,
        }
    }), 200
