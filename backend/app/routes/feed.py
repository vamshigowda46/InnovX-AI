from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, socketio
from app.models.models import (
    InnovationPost, PostLike, PostSave, PostComment, PostReaction,
    User, Project, Startup, Event, Notification, ActivityLog, _safe_json_list
)
from app.middleware.auth import sanitize_input
from sqlalchemy import or_
import json
import random

feed_bp = Blueprint('feed', __name__)

POST_TYPES = ['idea', 'project', 'startup', 'hackathon', 'collab', 'tech', 'mentor', 'ai_opportunity', 'recruitment']


def _seed_feed_if_empty():
    if InnovationPost.query.count() > 0:
        return
    users = User.query.filter_by(is_active=True).limit(5).all()
    if not users:
        return
    author = users[0]
    seeds = []

    for p in Project.query.limit(8).all():
        seeds.append(InnovationPost(
            author_id=p.owner_id or author.id,
            post_type='project',
            category=p.domain or 'Technology',
            title=p.title,
            content=(p.description or '')[:500],
            tags=json.dumps(p.get_tech_stack()[:5] if hasattr(p, 'get_tech_stack') else []),
            ref_id=p.id,
            ref_type='project',
            likes_count=random.randint(2, 40),
            is_trending=random.random() > 0.7,
        ))

    for s in Startup.query.limit(6).all():
        seeds.append(InnovationPost(
            author_id=s.founder_id or author.id,
            post_type='startup',
            category=s.domain or 'Startup',
            title=s.name,
            content=s.tagline or s.description or '',
            tags=json.dumps((_safe_json_list(s.looking_for))[:4]),
            ref_id=s.id,
            ref_type='startup',
            likes_count=random.randint(5, 60),
            is_trending=random.random() > 0.6,
        ))

    for e in Event.query.filter(Event.event_type.in_(['hackathon', 'competition'])).limit(5).all():
        seeds.append(InnovationPost(
            author_id=e.organizer_id or author.id,
            post_type='hackathon',
            category='Events',
            title=e.title,
            content=e.description or f"Join {e.title}! Prize: {e.prize_pool or 'TBA'}",
            tags=json.dumps(json.loads(e.tags) if e.tags else []),
            ref_id=e.id,
            ref_type='event',
            likes_count=random.randint(10, 80),
            is_trending=True,
        ))

    ai_posts = [
        ('ai_opportunity', 'AI', 'Build an AI Campus Copilot', 'Gemini-powered assistant for student innovation matching.', ['AI', 'LLM', 'EdTech']),
        ('tech', 'Trending', 'WebGPU is reshaping browser ML', 'Real-time inference in the browser unlocks new hackathon projects.', ['WebGPU', 'ML', 'Frontend']),
        ('collab', 'Collaboration', 'Seeking ML engineer for HealthTech MVP', '2-week sprint — equity discussion open.', ['collab', 'healthtech', 'python']),
        ('mentor', 'Mentorship', 'YC alum offering office hours', 'Book 30-min sessions for pitch deck review.', ['mentor', 'startup']),
        ('recruitment', 'Teams', 'Full-stack dev for fintech hackathon team', 'React + Flask team of 3, need one more.', ['recruitment', 'hackathon']),
        ('idea', 'Ideas', 'Smart campus energy dashboard', 'IoT + analytics to reduce university carbon footprint.', ['IoT', 'sustainability']),
    ]
    for ptype, cat, title, content, tags in ai_posts:
        seeds.append(InnovationPost(
            author_id=random.choice(users).id,
            post_type=ptype,
            category=cat,
            title=title,
            content=content,
            tags=json.dumps(tags),
            is_ai_generated=ptype == 'ai_opportunity',
            likes_count=random.randint(3, 50),
            is_trending=random.random() > 0.5,
        ))

    for post in seeds:
        db.session.add(post)
    db.session.commit()


def _personalize_score(post, user):
    score = 0
    user_skills = set(s.lower() for s in user.get_skills())
    user_interests = set(i.lower() for i in user.get_interests())
    post_tags = set(t.lower() for t in post.get_tags())
    score += len(user_skills & post_tags) * 15
    score += len(user_interests & post_tags) * 12
    if post.category and any(i in (post.category or '').lower() for i in user_interests):
        score += 10
    if post.is_trending:
        score += 8
    if post.post_type in ('collab', 'recruitment') and user.startup_interest:
        score += 15
    if post.post_type == 'hackathon' and (user.hackathon_count or 0) > 0:
        score += 12
    score += min(post.likes_count, 30) * 0.3
    return score


@feed_bp.route('/posts', methods=['GET'])
@jwt_required()
def get_feed():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    _seed_feed_if_empty()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    feed_type = request.args.get('type', 'for_you')
    category = request.args.get('category', '')
    post_type = request.args.get('post_type', '')

    query = InnovationPost.query
    if category:
        query = query.filter(InnovationPost.category.ilike(f'%{category}%'))
    if post_type:
        query = query.filter_by(post_type=post_type)

    if feed_type == 'trending':
        posts = query.filter_by(is_trending=True).order_by(
            InnovationPost.likes_count.desc()
        ).limit(per_page * page).all()
    elif feed_type == 'following':
        from app.models.models import Follow
        following_ids = [f.following_id for f in Follow.query.filter_by(
            follower_id=user_id, following_type='user'
        ).all()]
        posts = query.filter(InnovationPost.author_id.in_(following_ids)).order_by(
            InnovationPost.created_at.desc()
        ).limit(per_page * page).all() if following_ids else []
    else:
        all_posts = query.order_by(InnovationPost.created_at.desc()).limit(200).all()
        scored = [(p, _personalize_score(p, user)) for p in all_posts]
        scored.sort(key=lambda x: x[1], reverse=True)
        start = (page - 1) * per_page
        posts = [p for p, _ in scored[start:start + per_page]]

    return jsonify({
        'posts': [p.to_dict(current_user_id=user_id) for p in posts],
        'page': page,
        'has_more': len(posts) == per_page,
    }), 200


@feed_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    post = InnovationPost(
        author_id=user_id,
        post_type=data.get('post_type', 'innovation'),
        category=sanitize_input(data.get('category', 'General')),
        title=sanitize_input(data.get('title', '')),
        content=sanitize_input(data.get('content', '')),
        tags=json.dumps(data.get('tags', [])),
        media_url=data.get('media_url'),
        ref_id=data.get('ref_id'),
        ref_type=data.get('ref_type'),
    )
    db.session.add(post)
    log = ActivityLog(user_id=user_id, activity_type='post', title=post.title, description='Shared an innovation post')
    db.session.add(log)
    db.session.commit()
    return jsonify({'post': post.to_dict(current_user_id=user_id)}), 201


@feed_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    user_id = int(get_jwt_identity())
    post = InnovationPost.query.get_or_404(post_id)
    existing = PostLike.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        db.session.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        PostReaction.query.filter_by(user_id=user_id, post_id=post_id).delete()
        db.session.commit()
        return jsonify({'liked': False, 'likes_count': post.likes_count}), 200
    db.session.add(PostLike(user_id=user_id, post_id=post_id))
    db.session.add(PostReaction(user_id=user_id, post_id=post_id, reaction_type='like'))
    post.likes_count += 1
    db.session.commit()
    return jsonify({'liked': True, 'likes_count': post.likes_count}), 200


@feed_bp.route('/posts/<int:post_id>/react', methods=['POST'])
@jwt_required()
def react_post(post_id):
    user_id = int(get_jwt_identity())
    post = InnovationPost.query.get_or_404(post_id)
    reaction_type = request.get_json().get('reaction', 'love')
    existing = PostReaction.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        existing.reaction_type = reaction_type
    else:
        db.session.add(PostReaction(user_id=user_id, post_id=post_id, reaction_type=reaction_type))
        if not PostLike.query.filter_by(user_id=user_id, post_id=post_id).first():
            db.session.add(PostLike(user_id=user_id, post_id=post_id))
            post.likes_count += 1
    db.session.commit()
    return jsonify({'reaction': reaction_type, 'likes_count': post.likes_count}), 200


@feed_bp.route('/posts/<int:post_id>/save', methods=['POST'])
@jwt_required()
def save_post(post_id):
    user_id = int(get_jwt_identity())
    existing = PostSave.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'saved': False}), 200
    db.session.add(PostSave(user_id=user_id, post_id=post_id))
    db.session.commit()
    return jsonify({'saved': True}), 200


@feed_bp.route('/posts/<int:post_id>/share', methods=['POST'])
@jwt_required()
def share_post(post_id):
    post = InnovationPost.query.get_or_404(post_id)
    post.shares_count += 1
    db.session.commit()
    return jsonify({'shares_count': post.shares_count}), 200


@feed_bp.route('/posts/<int:post_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(post_id):
    comments = PostComment.query.filter_by(post_id=post_id).order_by(
        PostComment.created_at.desc()
    ).all()
    return jsonify({'comments': [c.to_dict() for c in comments]}), 200


@feed_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    post = InnovationPost.query.get_or_404(post_id)
    comment = PostComment(
        user_id=user_id,
        post_id=post_id,
        content=sanitize_input(data.get('content', ''))
    )
    db.session.add(comment)
    post.comments_count += 1
    db.session.commit()
    return jsonify({'comment': comment.to_dict()}), 201


@feed_bp.route('/saved', methods=['GET'])
@jwt_required()
def get_saved():
    user_id = int(get_jwt_identity())
    saves = PostSave.query.filter_by(user_id=user_id).all()
    posts = [InnovationPost.query.get(s.post_id) for s in saves]
    posts = [p for p in posts if p]
    return jsonify({'posts': [p.to_dict(current_user_id=user_id) for p in posts]}), 200


@feed_bp.route('/trending', methods=['GET'])
@jwt_required()
def trending():
    user_id = int(get_jwt_identity())
    posts = InnovationPost.query.filter_by(is_trending=True).order_by(
        InnovationPost.likes_count.desc()
    ).limit(10).all()
    return jsonify({'posts': [p.to_dict(current_user_id=user_id) for p in posts]}), 200


@feed_bp.route('/top-innovators', methods=['GET'])
@jwt_required()
def top_innovators():
    users = User.query.filter_by(is_active=True).order_by(
        User.innovation_score.desc(), User.points.desc()
    ).limit(10).all()
    return jsonify({'innovators': [u.to_dict() for u in users]}), 200


@feed_bp.route('/daily-suggestions', methods=['GET'])
@jwt_required()
def daily_suggestions():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    _seed_feed_if_empty()
    posts = InnovationPost.query.limit(50).all()
    scored = sorted(posts, key=lambda p: _personalize_score(p, user), reverse=True)
    return jsonify({
        'suggestions': [p.to_dict(current_user_id=user_id) for p in scored[:5]],
        'message': 'AI-curated picks based on your skills and interests',
    }), 200


@feed_bp.route('/categories', methods=['GET'])
@jwt_required()
def categories():
    return jsonify({
        'categories': ['Ideas', 'Projects', 'Startups', 'Hackathons', 'Collaboration',
                       'Trending', 'Tech', 'Mentorship', 'AI Opportunities', 'Recruitment'],
        'post_types': POST_TYPES,
    }), 200
