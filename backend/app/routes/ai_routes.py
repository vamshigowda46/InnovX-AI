from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import User, Event
from app.utils.ai_service import (
    generate_project_ideas, analyze_skills,
    generate_resume_content, generate_learning_roadmap, detect_fake_profile,
    predict_startup_success, ai_innovation_assistant, verify_skills_authenticity,
    get_ai_status,
)
from app.extensions import db
import json
import logging

ai_bp = Blueprint('ai', __name__)
logger = logging.getLogger(__name__)


def _strip_meta(data):
    if isinstance(data, dict):
        return {k: v for k, v in data.items() if k != '_meta'}
    if isinstance(data, list):
        return [(_strip_meta(i) if isinstance(i, dict) else i) for i in data]
    return data


@ai_bp.route('/status', methods=['GET'])
def ai_status():
    return jsonify(get_ai_status()), 200


@ai_bp.route('/generate-ideas', methods=['POST'])
@jwt_required()
def generate_ideas():
    try:
        data = request.get_json() or {}
        if not data.get('domain'):
            return jsonify({'error': 'Domain required'}), 400
        ideas = generate_project_ideas(
            domain=data['domain'],
            difficulty=data.get('difficulty', 'intermediate'),
            tech_stack=data.get('tech_stack', [])
        )
        ideas = [_strip_meta(i) if isinstance(i, dict) else i for i in ideas]
        return jsonify({
            'ideas': ideas,
            'count': len(ideas),
            'ai': get_ai_status(),
        }), 200
    except Exception as e:
        logger.error('generate_ideas error: %s', e)
        return jsonify({'error': 'Failed to generate ideas', 'detail': str(e)}), 500

@ai_bp.route('/analyze-skills', methods=['POST'])
@jwt_required()
def ai_analyze_skills():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json() or {}
        analysis = analyze_skills(
            skills=user.get_skills(),
            projects=data.get('projects_description', f'{user.projects.count()} projects'),
            interests=user.get_interests()
        )
        return jsonify({'analysis': analysis}), 200
    except Exception as e:
        logger.error(f'analyze_skills error: {e}')
        return jsonify({'error': 'Analysis failed'}), 500

@ai_bp.route('/generate-resume', methods=['POST'])
@jwt_required()
def generate_resume():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json() or {}
        user_data = {
            'name': user.name,
            'department': user.department or 'Computer Science',
            'skills': user.get_skills(),
            'interests': user.get_interests(),
            'projects': data.get('projects', f'{user.projects.count()} projects'),
            'university': user.university or ''
        }
        content = generate_resume_content(user_data)
        return jsonify({'resume_content': content}), 200
    except Exception as e:
        logger.error(f'generate_resume error: {e}')
        return jsonify({'error': 'Resume generation failed'}), 500

@ai_bp.route('/learning-roadmap', methods=['POST'])
@jwt_required()
def learning_roadmap():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json() or {}
        if not data.get('career_goal'):
            return jsonify({'error': 'Career goal required'}), 400
        roadmap = generate_learning_roadmap(
            career_goal=data['career_goal'],
            current_skills=user.get_skills(),
            timeline_months=data.get('timeline_months', 6)
        )
        return jsonify({'roadmap': roadmap}), 200
    except Exception as e:
        logger.error(f'learning_roadmap error: {e}')
        return jsonify({'error': 'Roadmap generation failed'}), 500

@ai_bp.route('/verify-profile', methods=['POST'])
@jwt_required()
def verify_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        profile_data = {
            'skills': user.get_skills(),
            'projects_count': user.projects.count(),
            'bio': user.bio or '',
            'github_url': user.github_url,
            'linkedin_url': user.linkedin_url,
            'hackathon_count': user.hackathon_count or 0
        }
        result = detect_fake_profile(profile_data)
        from app.extensions import db
        user.trust_score = result.get('trust_score', user.trust_score)
        db.session.commit()
        return jsonify({'verification': result}), 200
    except Exception as e:
        logger.error(f'verify_profile error: {e}')
        return jsonify({'error': 'Verification failed'}), 500

@ai_bp.route('/recommend-events', methods=['GET'])
@jwt_required()
def recommend_events():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'events': []}), 200
        skills = user.get_skills()
        interests = user.get_interests()
        events = Event.query.limit(50).all()
        scored = []
        for event in events:
            tags = json.loads(event.tags) if event.tags else []
            score = sum(1 for tag in tags if any(s.lower() in tag.lower() for s in skills + interests))
            ed = event.to_dict()
            ed['relevance_score'] = score
            scored.append(ed)
        scored.sort(key=lambda x: x['relevance_score'], reverse=True)
        return jsonify({'events': scored[:10]}), 200
    except Exception as e:
        logger.error(f'recommend_events error: {e}')
        return jsonify({'events': []}), 200


@ai_bp.route('/assistant', methods=['POST'])
@jwt_required()
def innovation_assistant():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json() or {}
        query = (data.get('query') or data.get('message') or '').strip()
        if not query:
            return jsonify({'error': 'Message required'}), 400
        history = data.get('history', [])
        context = {
            'name': user.name,
            'skills': user.get_skills(),
            'interests': user.get_interests(),
            'department': user.department or '',
            'university': user.university or '',
            'projects_count': user.projects.count(),
            'hackathon_count': user.hackathon_count or 0,
        }
        result = ai_innovation_assistant(query, context, history=history)
        return jsonify({'assistant': result}), 200
    except Exception as e:
        logger.error('assistant error: %s', e)
        return jsonify({'error': 'Assistant failed', 'detail': str(e)}), 500


@ai_bp.route('/startup-predictor', methods=['POST'])
@jwt_required()
def startup_predictor():
    data = request.get_json() or {}
    if not data.get('name'):
        return jsonify({'error': 'Startup name required'}), 400
    prediction = predict_startup_success(data)
    return jsonify({'prediction': prediction}), 200


@ai_bp.route('/innovation-score', methods=['GET'])
@jwt_required()
def innovation_score():
    user_id = int(get_jwt_identity())
    from app.models.models import CollaborationRequest
    user = User.query.get(user_id)
    accepted = CollaborationRequest.query.filter(
        ((CollaborationRequest.sender_id == user_id) | (CollaborationRequest.receiver_id == user_id)),
        CollaborationRequest.status == 'accepted'
    ).count()
    score = min(100, (
        user.projects.count() * 8 + user.startups.count() * 15 +
        (user.hackathon_count or 0) * 10 + len(user.get_skills()) * 3 +
        accepted * 5 + user.achievements.count() * 4
    ))
    user.innovation_score = score
    db.session.commit()
    return jsonify({'innovation_score': score, 'rank': user.rank}), 200


@ai_bp.route('/skill-verification', methods=['POST'])
@jwt_required()
def skill_verification():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    result = verify_skills_authenticity({
        'skills': user.get_skills(),
        'github_url': user.github_url,
        'projects_count': user.projects.count(),
        'bio': user.bio,
    })
    return jsonify({'verification': result}), 200


@ai_bp.route('/feed-recommendations', methods=['GET'])
@jwt_required()
def feed_recommendations():
    from app.routes.feed import _personalize_score, _seed_feed_if_empty
    from app.models.models import InnovationPost
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    _seed_feed_if_empty()
    posts = InnovationPost.query.limit(100).all()
    scored = sorted(posts, key=lambda p: _personalize_score(p, user), reverse=True)
    return jsonify({
        'recommendations': [p.to_dict(current_user_id=user_id) for p in scored[:8]],
        'match_reason': 'Personalized from skills, interests, and activity',
    }), 200
