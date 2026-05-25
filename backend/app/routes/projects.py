from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import Project, TeamMember, Task, Notification, User
from app.middleware.auth import sanitize_input
from app.utils.helpers import award_points
import json

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    domain = request.args.get('domain', '')
    search = request.args.get('search', '')
    status = request.args.get('status', '')

    query = Project.query
    if domain:
        query = query.filter(Project.domain.ilike(f'%{domain}%'))
    if search:
        query = query.filter(Project.title.ilike(f'%{search}%'))
    if status:
        query = query.filter_by(status=status)

    query = query.order_by(Project.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'projects': [p.to_dict() for p in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    project.views += 1
    db.session.commit()
    data = project.to_dict()
    data['tasks'] = [t.to_dict() for t in project.tasks.all()]
    data['members'] = [{'user': m.user.to_dict(), 'role': m.role} for m in project.team_members.all()]
    return jsonify({'project': data}), 200

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('title'):
        return jsonify({'error': 'Title required'}), 400

    project = Project(
        title=sanitize_input(data['title']),
        description=sanitize_input(data.get('description', '')),
        domain=data.get('domain'),
        tech_stack=json.dumps(data.get('tech_stack', [])),
        difficulty=data.get('difficulty'),
        github_url=data.get('github_url'),
        demo_url=data.get('demo_url'),
        owner_id=user_id,
        team_size=data.get('team_size', 1),
        looking_for_members=data.get('looking_for_members', True),
        required_skills=json.dumps(data.get('required_skills', [])),
        milestones=json.dumps(data.get('milestones', [])),
        ai_generated=data.get('ai_generated', False)
    )
    db.session.add(project)
    db.session.flush()

    member = TeamMember(project_id=project.id, user_id=user_id, role='Owner')
    db.session.add(member)
    db.session.commit()

    user = User.query.get(user_id)
    award_points(user, 100, 'Created First Project' if user.projects.count() == 1 else None)
    return jsonify({'project': project.to_dict(), 'message': 'Project created'}), 201

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)
    if project.owner_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    updatable = ['title', 'description', 'domain', 'difficulty', 'github_url', 'demo_url',
                 'status', 'progress', 'looking_for_members', 'team_size']
    for field in updatable:
        if field in data:
            setattr(project, field, data[field])

    if 'tech_stack' in data:
        project.tech_stack = json.dumps(data['tech_stack'])
    if 'required_skills' in data:
        project.required_skills = json.dumps(data['required_skills'])
    if 'milestones' in data:
        project.milestones = json.dumps(data['milestones'])

    db.session.commit()
    return jsonify({'project': project.to_dict()}), 200

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)
    if project.owner_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'}), 200

@projects_bp.route('/<int:project_id>/tasks', methods=['GET'])
@jwt_required()
def get_tasks(project_id):
    tasks = Task.query.filter_by(project_id=project_id).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]}), 200

@projects_bp.route('/<int:project_id>/tasks', methods=['POST'])
@jwt_required()
def create_task(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)
    data = request.get_json()

    task = Task(
        project_id=project_id,
        title=sanitize_input(data['title']),
        description=sanitize_input(data.get('description', '')),
        assigned_to=data.get('assigned_to'),
        priority=data.get('priority', 'medium'),
        status=data.get('status', 'todo')
    )
    if data.get('due_date'):
        from datetime import datetime
        task.due_date = datetime.fromisoformat(data['due_date'])

    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201

@projects_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    for field in ['title', 'description', 'status', 'priority', 'assigned_to']:
        if field in data:
            setattr(task, field, data[field])
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 200

@projects_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'}), 200

@projects_bp.route('/<int:project_id>/join', methods=['POST'])
@jwt_required()
def join_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get_or_404(project_id)

    existing = TeamMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if existing:
        return jsonify({'error': 'Already a member'}), 409

    data = request.get_json() or {}
    member = TeamMember(project_id=project_id, user_id=user_id, role=data.get('role', 'Member'))
    db.session.add(member)

    notif = Notification(
        user_id=project.owner_id,
        title='New Team Member',
        message=f'Someone joined your project: {project.title}',
        type='team_join'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'message': 'Joined project'}), 200

@projects_bp.route('/my-projects', methods=['GET'])
@jwt_required()
def get_my_projects():
    user_id = int(get_jwt_identity())
    projects = Project.query.filter_by(owner_id=user_id).order_by(Project.created_at.desc()).all()
    return jsonify({'projects': [p.to_dict() for p in projects]}), 200
