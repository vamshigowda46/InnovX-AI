from app.extensions import db
from datetime import datetime
import json


def _safe_json_list(value):
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except (TypeError, json.JSONDecodeError):
        return []

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))
    avatar = db.Column(db.String(500))
    department = db.Column(db.String(100))
    university = db.Column(db.String(150))
    year_of_study = db.Column(db.Integer)
    bio = db.Column(db.Text)
    github_url = db.Column(db.String(300))
    linkedin_url = db.Column(db.String(300))
    portfolio_url = db.Column(db.String(300))
    location = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    skills = db.Column(db.Text, default='[]')  # JSON array
    interests = db.Column(db.Text, default='[]')
    hackathon_count = db.Column(db.Integer, default=0)
    startup_interest = db.Column(db.Boolean, default=False)
    is_mentor = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    trust_score = db.Column(db.Float, default=100.0)
    innovation_score = db.Column(db.Integer, default=0)
    points = db.Column(db.Integer, default=0)
    rank = db.Column(db.String(50), default='Newcomer')
    google_id = db.Column(db.String(200))
    otp = db.Column(db.String(10))
    otp_expiry = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = db.relationship('Project', backref='owner', lazy='dynamic', foreign_keys='Project.owner_id')
    startups = db.relationship('Startup', backref='founder', lazy='dynamic', foreign_keys='Startup.founder_id')
    sent_messages = db.relationship('Message', backref='sender', lazy='dynamic', foreign_keys='Message.sender_id')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')
    achievements = db.relationship('Achievement', backref='user', lazy='dynamic')

    def get_skills(self):
        try:
            return json.loads(self.skills) if self.skills else []
        except:
            return []

    def get_interests(self):
        try:
            return json.loads(self.interests) if self.interests else []
        except:
            return []

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'name': self.name,
            'avatar': self.avatar,
            'department': self.department,
            'university': self.university,
            'year_of_study': self.year_of_study,
            'bio': self.bio,
            'github_url': self.github_url,
            'linkedin_url': self.linkedin_url,
            'portfolio_url': self.portfolio_url,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'skills': self.get_skills(),
            'interests': self.get_interests(),
            'hackathon_count': self.hackathon_count,
            'startup_interest': self.startup_interest,
            'is_mentor': self.is_mentor,
            'is_verified': self.is_verified,
            'trust_score': self.trust_score,
            'innovation_score': self.innovation_score,
            'points': self.points,
            'rank': self.rank,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_private:
            data['email'] = self.email
        return data


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    domain = db.Column(db.String(100))
    tech_stack = db.Column(db.Text, default='[]')
    status = db.Column(db.String(50), default='active')  # active, completed, paused
    difficulty = db.Column(db.String(50))
    github_url = db.Column(db.String(300))
    demo_url = db.Column(db.String(300))
    thumbnail = db.Column(db.String(500))
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    team_size = db.Column(db.Integer, default=1)
    looking_for_members = db.Column(db.Boolean, default=True)
    required_skills = db.Column(db.Text, default='[]')
    milestones = db.Column(db.Text, default='[]')
    progress = db.Column(db.Integer, default=0)
    ai_generated = db.Column(db.Boolean, default=False)
    likes = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = db.relationship('Task', backref='project', lazy='dynamic')
    team_members = db.relationship('TeamMember', backref='project', lazy='dynamic')

    def get_tech_stack(self):
        try:
            return json.loads(self.tech_stack) if self.tech_stack else []
        except:
            return []

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'domain': self.domain,
            'tech_stack': self.get_tech_stack(),
            'status': self.status,
            'difficulty': self.difficulty,
            'github_url': self.github_url,
            'demo_url': self.demo_url,
            'thumbnail': self.thumbnail,
            'owner_id': self.owner_id,
            'owner': self.owner.to_dict() if self.owner else None,
            'team_size': self.team_size,
            'looking_for_members': self.looking_for_members,
            'required_skills': _safe_json_list(self.required_skills),
            'milestones': _safe_json_list(self.milestones),
            'progress': self.progress,
            'ai_generated': self.ai_generated,
            'likes': self.likes,
            'views': self.views,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    leader_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    max_members = db.Column(db.Integer, default=5)
    is_open = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    members = db.relationship('TeamMember', backref='team', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'project_id': self.project_id,
            'leader_id': self.leader_id,
            'max_members': self.max_members,
            'is_open': self.is_open,
            'member_count': self.members.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class TeamMember(db.Model):
    __tablename__ = 'team_members'
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'))
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    role = db.Column(db.String(100))
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='team_memberships')


class Startup(db.Model):
    __tablename__ = 'startups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    tagline = db.Column(db.String(300))
    description = db.Column(db.Text)
    domain = db.Column(db.String(100))
    stage = db.Column(db.String(50))  # idea, mvp, seed, series-a
    logo = db.Column(db.String(500))
    website = db.Column(db.String(300))
    pitch_deck = db.Column(db.String(500))
    founder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    looking_for = db.Column(db.Text, default='[]')  # co-founder, developer, designer
    required_skills = db.Column(db.Text, default='[]')
    funding_goal = db.Column(db.Float)
    current_funding = db.Column(db.Float, default=0)
    team_size = db.Column(db.Integer, default=1)
    location = db.Column(db.String(200))
    is_hiring = db.Column(db.Boolean, default=True)
    likes = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'tagline': self.tagline,
            'description': self.description,
            'domain': self.domain,
            'stage': self.stage,
            'logo': self.logo,
            'website': self.website,
            'founder_id': self.founder_id,
            'founder': self.founder.to_dict() if self.founder else None,
            'looking_for': _safe_json_list(self.looking_for),
            'required_skills': _safe_json_list(self.required_skills),
            'funding_goal': self.funding_goal,
            'current_funding': self.current_funding,
            'team_size': self.team_size,
            'location': self.location,
            'is_hiring': self.is_hiring,
            'likes': self.likes,
            'views': self.views,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    room_id = db.Column(db.String(100))  # for group chats
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(50), default='text')  # text, file, image
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender': self.sender.to_dict() if self.sender else None,
            'receiver_id': self.receiver_id,
            'room_id': self.room_id,
            'content': self.content,
            'message_type': self.message_type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200))
    message = db.Column(db.Text)
    type = db.Column(db.String(50))  # team_invite, message, achievement, etc.
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'link': self.link,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Mentor(db.Model):
    __tablename__ = 'mentors'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    expertise = db.Column(db.Text, default='[]')
    experience_years = db.Column(db.Integer)
    company = db.Column(db.String(200))
    designation = db.Column(db.String(200))
    hourly_rate = db.Column(db.Float, default=0)
    availability = db.Column(db.Text, default='[]')
    rating = db.Column(db.Float, default=0)
    total_sessions = db.Column(db.Integer, default=0)
    bio = db.Column(db.Text)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='mentor_profile')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'expertise': json.loads(self.expertise) if self.expertise else [],
            'experience_years': self.experience_years,
            'company': self.company,
            'designation': self.designation,
            'hourly_rate': self.hourly_rate,
            'availability': json.loads(self.availability) if self.availability else [],
            'rating': self.rating,
            'total_sessions': self.total_sessions,
            'bio': self.bio,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    event_type = db.Column(db.String(50))  # hackathon, workshop, meetup, competition
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    location = db.Column(db.String(300))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    is_online = db.Column(db.Boolean, default=False)
    registration_url = db.Column(db.String(500))
    prize_pool = db.Column(db.String(200))
    max_participants = db.Column(db.Integer)
    current_participants = db.Column(db.Integer, default=0)
    tags = db.Column(db.Text, default='[]')
    thumbnail = db.Column(db.String(500))
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    organizer = db.relationship('User', backref='organized_events')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'event_type': self.event_type,
            'organizer_id': self.organizer_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'is_online': self.is_online,
            'registration_url': self.registration_url,
            'prize_pool': self.prize_pool,
            'max_participants': self.max_participants,
            'current_participants': self.current_participants,
            'tags': json.loads(self.tags) if self.tags else [],
            'thumbnail': self.thumbnail,
            'is_featured': self.is_featured,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    badge_icon = db.Column(db.String(100))
    badge_color = db.Column(db.String(50))
    points_awarded = db.Column(db.Integer, default=0)
    achievement_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'badge_icon': self.badge_icon,
            'badge_color': self.badge_color,
            'points_awarded': self.points_awarded,
            'achievement_type': self.achievement_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ActiveCollaboration(db.Model):
    """Established collaboration between two users after request accepted."""
    __tablename__ = 'active_collaborations'
    id = db.Column(db.Integer, primary_key=True)
    user_a_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_b_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    request_id = db.Column(db.Integer, db.ForeignKey('collaboration_requests.id'))
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_a = db.relationship('User', foreign_keys=[user_a_id])
    user_b = db.relationship('User', foreign_keys=[user_b_id])

    def to_dict(self, current_user_id=None):
        partner = self.user_b if self.user_a_id == current_user_id else self.user_a
        return {
            'id': self.id,
            'user_a_id': self.user_a_id,
            'user_b_id': self.user_b_id,
            'partner': partner.to_dict() if partner else None,
            'project_id': self.project_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CollaborationRequest(db.Model):
    __tablename__ = 'collaboration_requests'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    message = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_requests')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_requests')
    project = db.relationship('Project', backref='collab_requests')

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender': self.sender.to_dict() if self.sender else None,
            'receiver_id': self.receiver_id,
            'project_id': self.project_id,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(50), default='todo')  # todo, in_progress, done
    priority = db.Column(db.String(50), default='medium')
    due_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    assignee = db.relationship('User', backref='assigned_tasks')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'assigned_to': self.assigned_to,
            'assignee': self.assignee.to_dict() if self.assignee else None,
            'status': self.status,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class InnovationPost(db.Model):
    __tablename__ = 'innovation_posts'
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_type = db.Column(db.String(50), default='innovation')  # idea, project, startup, hackathon, collab, tech, mentor, ai_opportunity, recruitment
    category = db.Column(db.String(100))
    title = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text)
    tags = db.Column(db.Text, default='[]')
    media_url = db.Column(db.String(500))
    ref_id = db.Column(db.Integer)  # linked project/startup/event id
    ref_type = db.Column(db.String(50))
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    shares_count = db.Column(db.Integer, default=0)
    is_trending = db.Column(db.Boolean, default=False)
    is_ai_generated = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    author = db.relationship('User', backref='posts')

    def get_tags(self):
        return _safe_json_list(self.tags)

    def to_dict(self, current_user_id=None):
        data = {
            'id': self.id,
            'author_id': self.author_id,
            'author': self.author.to_dict() if self.author else None,
            'post_type': self.post_type,
            'category': self.category,
            'title': self.title,
            'content': self.content,
            'tags': self.get_tags(),
            'media_url': self.media_url,
            'ref_id': self.ref_id,
            'ref_type': self.ref_type,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'shares_count': self.shares_count,
            'is_trending': self.is_trending,
            'is_ai_generated': self.is_ai_generated,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'liked': False,
            'saved': False,
            'user_reaction': None,
        }
        if current_user_id:
            data['liked'] = PostLike.query.filter_by(user_id=current_user_id, post_id=self.id).first() is not None
            data['saved'] = PostSave.query.filter_by(user_id=current_user_id, post_id=self.id).first() is not None
            reaction = PostReaction.query.filter_by(user_id=current_user_id, post_id=self.id).first()
            data['user_reaction'] = reaction.reaction_type if reaction else None
        return data


class PostLike(db.Model):
    __tablename__ = 'post_likes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('innovation_posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='uq_post_like'),)


class PostSave(db.Model):
    __tablename__ = 'post_saves'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('innovation_posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='uq_post_save'),)


class PostComment(db.Model):
    __tablename__ = 'post_comments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('innovation_posts.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='post_comments')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'post_id': self.post_id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PostReaction(db.Model):
    __tablename__ = 'post_reactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('innovation_posts.id'), nullable=False)
    reaction_type = db.Column(db.String(20), default='like')  # like, love, rocket, insight
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='uq_post_reaction'),)


class Follow(db.Model):
    __tablename__ = 'follows'
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    following_id = db.Column(db.Integer, nullable=False)
    following_type = db.Column(db.String(20), default='user')  # user, startup
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('follower_id', 'following_id', 'following_type', name='uq_follow'),)


class TeamInvite(db.Model):
    __tablename__ = 'team_invites'
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    inviter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invitee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(100), default='member')
    status = db.Column(db.String(50), default='pending')
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    team = db.relationship('Team', backref='invites')
    inviter = db.relationship('User', foreign_keys=[inviter_id])
    invitee = db.relationship('User', foreign_keys=[invitee_id])

    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'team': self.team.to_dict() if self.team else None,
            'inviter_id': self.inviter_id,
            'inviter': self.inviter.to_dict() if self.inviter else None,
            'invitee_id': self.invitee_id,
            'invitee': self.invitee.to_dict() if self.invitee else None,
            'role': self.role,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    activity_type = db.Column(db.String(50))
    title = db.Column(db.String(300))
    description = db.Column(db.Text)
    metadata_json = db.Column(db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='activities')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'activity_type': self.activity_type,
            'title': self.title,
            'description': self.description,
            'metadata': json.loads(self.metadata_json) if self.metadata_json else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class MentorSession(db.Model):
    __tablename__ = 'mentor_sessions'
    id = db.Column(db.Integer, primary_key=True)
    mentor_id = db.Column(db.Integer, db.ForeignKey('mentors.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    scheduled_at = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=60)
    status = db.Column(db.String(50), default='pending')
    topic = db.Column(db.String(300))
    notes = db.Column(db.Text)
    rating = db.Column(db.Integer)
    review = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    mentor = db.relationship('Mentor', backref='sessions')
    student = db.relationship('User', backref='mentor_sessions')

    def to_dict(self):
        return {
            'id': self.id,
            'mentor_id': self.mentor_id,
            'student_id': self.student_id,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'topic': self.topic,
            'notes': self.notes,
            'rating': self.rating,
            'review': self.review,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    issuer = db.Column(db.String(200))
    issue_date = db.Column(db.String(50))
    credential_url = db.Column(db.String(500))
    description = db.Column(db.Text)
    file_url = db.Column(db.String(1000))
    skill_tags = db.Column(db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='certificates')

    def get_skill_tags(self):
        return _safe_json_list(self.skill_tags)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'issuer': self.issuer,
            'issue_date': self.issue_date,
            'credential_url': self.credential_url,
            'description': self.description,
            'file_url': self.file_url,
            'skill_tags': self.get_skill_tags(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SavedResume(db.Model):
    __tablename__ = 'saved_resumes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), default='My Resume')
    content = db.Column(db.Text, default='{}')
    template = db.Column(db.String(50), default='modern-blue')
    font = db.Column(db.String(50), default='inter')
    theme = db.Column(db.String(50), default='blue')
    is_primary = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='saved_resumes')

    def get_content(self):
        try:
            return json.loads(self.content) if self.content else {}
        except (TypeError, json.JSONDecodeError):
            return {}

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.get_content(),
            'template': self.template,
            'font': self.font,
            'theme': self.theme,
            'is_primary': self.is_primary,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
