from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import Follow, User, Startup, ActivityLog

social_bp = Blueprint('social', __name__)


@social_bp.route('/follow', methods=['POST'])
@jwt_required()
def follow():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    following_id = data.get('following_id')
    following_type = data.get('following_type', 'user')
    if following_id == user_id and following_type == 'user':
        return jsonify({'error': 'Cannot follow yourself'}), 400
    existing = Follow.query.filter_by(
        follower_id=user_id, following_id=following_id, following_type=following_type
    ).first()
    if existing:
        return jsonify({'following': True}), 200
    db.session.add(Follow(follower_id=user_id, following_id=following_id, following_type=following_type))
    log = ActivityLog(user_id=user_id, activity_type='follow', title=f'Followed {following_type}', description=str(following_id))
    db.session.add(log)
    db.session.commit()
    return jsonify({'following': True}), 201


@social_bp.route('/unfollow', methods=['POST'])
@jwt_required()
def unfollow():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    Follow.query.filter_by(
        follower_id=user_id,
        following_id=data.get('following_id'),
        following_type=data.get('following_type', 'user'),
    ).delete()
    db.session.commit()
    return jsonify({'following': False}), 200


@social_bp.route('/following', methods=['GET'])
@jwt_required()
def get_following():
    user_id = int(get_jwt_identity())
    follows = Follow.query.filter_by(follower_id=user_id).all()
    users, startups = [], []
    for f in follows:
        if f.following_type == 'user':
            u = User.query.get(f.following_id)
            if u:
                users.append(u.to_dict())
        else:
            s = Startup.query.get(f.following_id)
            if s:
                startups.append(s.to_dict())
    return jsonify({'users': users, 'startups': startups}), 200


@social_bp.route('/followers/<int:target_id>', methods=['GET'])
@jwt_required()
def get_followers(target_id):
    follows = Follow.query.filter_by(following_id=target_id, following_type='user').all()
    users = [User.query.get(f.follower_id).to_dict() for f in follows if User.query.get(f.follower_id)]
    return jsonify({'followers': users, 'count': len(users)}), 200


@social_bp.route('/timeline/<int:user_id>', methods=['GET'])
@jwt_required()
def innovation_timeline(user_id):
    from app.models.models import InnovationPost, Project, Startup
    posts = InnovationPost.query.filter_by(author_id=user_id).order_by(
        InnovationPost.created_at.desc()
    ).limit(20).all()
    projects = Project.query.filter_by(owner_id=user_id).limit(10).all()
    startups = Startup.query.filter_by(founder_id=user_id).limit(5).all()
    current_id = int(get_jwt_identity())
    return jsonify({
        'posts': [p.to_dict(current_user_id=current_id) for p in posts],
        'projects': [p.to_dict() for p in projects],
        'startups': [s.to_dict() for s in startups],
    }), 200


@social_bp.route('/engagement/<int:user_id>', methods=['GET'])
@jwt_required()
def engagement_analytics(user_id):
    from app.models.models import PostLike, InnovationPost
    posts = InnovationPost.query.filter_by(author_id=user_id).all()
    total_likes = sum(p.likes_count for p in posts)
    followers = Follow.query.filter_by(following_id=user_id, following_type='user').count()
    following = Follow.query.filter_by(follower_id=user_id).count()
    return jsonify({
        'total_likes': total_likes,
        'posts_count': len(posts),
        'followers': followers,
        'following': following,
    }), 200
