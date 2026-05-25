import json
import logging
import os
import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.models import Certificate, SavedResume, User

logger = logging.getLogger(__name__)
career_bp = Blueprint('career', __name__)


@career_bp.route('/certificates', methods=['GET'])
@jwt_required()
def list_certificates():
    user_id = int(get_jwt_identity())
    target = request.args.get('user_id', type=int) or user_id
    certs = Certificate.query.filter_by(user_id=target).order_by(Certificate.created_at.desc()).all()
    return jsonify({'certificates': [c.to_dict() for c in certs]}), 200


@career_bp.route('/certificates', methods=['POST'])
@jwt_required()
def create_certificate():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    file_url = data.get('file_url', '')
    if file_url and file_url.startswith('data:'):
        try:
            upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            header, encoded = file_url.split(',', 1)
            ext = 'png' if 'png' in header else 'jpg'
            filename = f'cert_{user_id}_{uuid.uuid4().hex[:12]}.{ext}'
            path = os.path.join(upload_dir, filename)
            import base64
            with open(path, 'wb') as f:
                f.write(base64.b64decode(encoded))
            file_url = f'/uploads/{filename}'
        except Exception as e:
            logger.warning(f'Certificate file save failed: {e}')

    cert = Certificate(
        user_id=user_id,
        title=data['title'],
        issuer=data.get('issuer', ''),
        issue_date=data.get('issue_date', ''),
        credential_url=data.get('credential_url', ''),
        description=data.get('description', ''),
        file_url=file_url,
        skill_tags=json.dumps(data.get('skill_tags', [])),
    )
    db.session.add(cert)
    db.session.commit()
    return jsonify({'certificate': cert.to_dict()}), 201


@career_bp.route('/certificates/<int:cert_id>', methods=['PUT'])
@jwt_required()
def update_certificate(cert_id):
    user_id = int(get_jwt_identity())
    cert = Certificate.query.filter_by(id=cert_id, user_id=user_id).first()
    if not cert:
        return jsonify({'error': 'Certificate not found'}), 404
    data = request.get_json() or {}
    for field in ('title', 'issuer', 'issue_date', 'credential_url', 'description', 'file_url'):
        if field in data:
            setattr(cert, field, data[field])
    if 'skill_tags' in data:
        cert.skill_tags = json.dumps(data['skill_tags'])
    db.session.commit()
    return jsonify({'certificate': cert.to_dict()}), 200


@career_bp.route('/certificates/<int:cert_id>', methods=['DELETE'])
@jwt_required()
def delete_certificate(cert_id):
    user_id = int(get_jwt_identity())
    cert = Certificate.query.filter_by(id=cert_id, user_id=user_id).first()
    if not cert:
        return jsonify({'error': 'Certificate not found'}), 404
    db.session.delete(cert)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


@career_bp.route('/certificates/stats', methods=['GET'])
@jwt_required()
def certificate_stats():
    user_id = int(get_jwt_identity())
    count = Certificate.query.filter_by(user_id=user_id).count()
    return jsonify({'total': count, 'verified_badges': min(count, 5)}), 200


@career_bp.route('/resumes', methods=['GET'])
@jwt_required()
def list_resumes():
    user_id = int(get_jwt_identity())
    resumes = SavedResume.query.filter_by(user_id=user_id).order_by(SavedResume.updated_at.desc()).all()
    return jsonify({'resumes': [r.to_dict() for r in resumes]}), 200


@career_bp.route('/resumes/primary', methods=['GET'])
@jwt_required()
def get_primary_resume():
    user_id = int(get_jwt_identity())
    resume = SavedResume.query.filter_by(user_id=user_id, is_primary=True).first()
    if not resume:
        resume = SavedResume.query.filter_by(user_id=user_id).order_by(SavedResume.updated_at.desc()).first()
    if not resume:
        user = User.query.get(user_id)
        default_content = {
            'basics': {
                'name': user.name or '',
                'role': user.department or 'Innovator',
                'email': user.email or '',
                'phone': '',
                'linkedin': user.linkedin_url or '',
                'github': user.github_url or '',
                'portfolio': user.portfolio_url or '',
                'address': user.location or '',
                'photo': user.avatar or '',
                'showPhoto': True,
            },
            'summary': user.bio or '',
            'education': [],
            'skills': user.get_skills(),
            'experience': [],
            'projects': [],
            'certifications': [],
            'achievements': [],
            'languages': [],
            'interests': user.get_interests(),
            'social': [],
        }
        return jsonify({'resume': None, 'default_content': default_content}), 200
    return jsonify({'resume': resume.to_dict()}), 200


@career_bp.route('/resumes', methods=['POST'])
@jwt_required()
def save_resume():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    content = data.get('content', {})
    resume_id = data.get('id')

    if resume_id:
        resume = SavedResume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
    else:
        if data.get('is_primary', True):
            SavedResume.query.filter_by(user_id=user_id).update({'is_primary': False})
        resume = SavedResume(user_id=user_id, is_primary=data.get('is_primary', True))

    resume.title = data.get('title', resume.title if resume_id else 'My Resume')
    resume.content = json.dumps(content)
    resume.template = data.get('template', resume.template if resume_id else 'modern-blue')
    resume.font = data.get('font', resume.font if resume_id else 'inter')
    resume.theme = data.get('theme', resume.theme if resume_id else 'blue')
    resume.updated_at = datetime.utcnow()

    if not resume_id:
        db.session.add(resume)
    db.session.commit()
    return jsonify({'resume': resume.to_dict()}), 200


@career_bp.route('/resumes/<int:resume_id>', methods=['DELETE'])
@jwt_required()
def delete_resume(resume_id):
    user_id = int(get_jwt_identity())
    resume = SavedResume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return jsonify({'error': 'Resume not found'}), 404
    db.session.delete(resume)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


@career_bp.route('/overview', methods=['GET'])
@jwt_required()
def career_overview():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    cert_count = Certificate.query.filter_by(user_id=user_id).count()
    resume = SavedResume.query.filter_by(user_id=user_id, is_primary=True).first()
    completion = 35
    if resume:
        c = resume.get_content()
        fields = ['summary', 'experience', 'education', 'skills', 'projects']
        filled = sum(1 for f in fields if c.get(f) and (len(c[f]) > 0 if isinstance(c[f], list) else bool(c[f])))
        completion = min(100, 30 + filled * 14)
    return jsonify({
        'certificates_count': cert_count,
        'resume_completion': completion,
        'has_resume': bool(resume),
        'innovation_score': user.innovation_score if user else 0,
        'productivity_score': min(100, (user.points or 0) // 10 + completion // 2) if user else 0,
    }), 200
