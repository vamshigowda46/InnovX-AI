from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, socketio
from app.models.models import (
    CollaborationRequest, ActiveCollaboration, Team, TeamMember, TeamInvite,
    User, Notification, ActivityLog
)
from app.middleware.auth import sanitize_input
from app.utils.ai_service import generate_team_match_score
import logging

logger = logging.getLogger(__name__)

collab_bp = Blueprint('collaboration', __name__)

try:
    from app.sockets.events import connected_users
except ImportError:
    connected_users = {}


def _safe_notify(user_id, title, message, ntype='collab', link=None):
    try:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=ntype,
            link=link,
        )
        db.session.add(notif)
        db.session.flush()
        for sid, uid in list(connected_users.items()):
            if uid == user_id:
                socketio.emit('notification', notif.to_dict(), room=sid)
                break
    except Exception as e:
        logger.warning('Notification emit failed: %s', e)


def _safe_activity(user_id, activity_type, title, description=''):
    try:
        log = ActivityLog(
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            description=description,
        )
        db.session.add(log)
    except Exception as e:
        logger.warning('Activity log failed: %s', e)


def _create_active_collaboration(req):
    """Create ActiveCollaboration record when request is accepted."""
    a, b = sorted([req.sender_id, req.receiver_id])
    existing = ActiveCollaboration.query.filter(
        ActiveCollaboration.user_a_id == a,
        ActiveCollaboration.user_b_id == b,
        ActiveCollaboration.status == 'active',
    ).first()
    if existing:
        return existing
    collab = ActiveCollaboration(
        user_a_id=a,
        user_b_id=b,
        project_id=req.project_id,
        request_id=req.id,
        status='active',
    )
    db.session.add(collab)
    return collab


@collab_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_all_requests():
    try:
        user_id = int(get_jwt_identity())
        received = CollaborationRequest.query.filter_by(receiver_id=user_id).order_by(
            CollaborationRequest.created_at.desc()
        ).all()
        sent = CollaborationRequest.query.filter_by(sender_id=user_id).order_by(
            CollaborationRequest.created_at.desc()
        ).all()
        accepted = CollaborationRequest.query.filter(
            db.or_(
                CollaborationRequest.sender_id == user_id,
                CollaborationRequest.receiver_id == user_id,
            ),
            CollaborationRequest.status == 'accepted',
        ).all()
        return jsonify({
            'received': [r.to_dict() for r in received],
            'sent': [r.to_dict() for r in sent],
            'accepted': [r.to_dict() for r in accepted],
            'pending_count': len([r for r in received if r.status == 'pending']),
        }), 200
    except Exception as e:
        logger.exception('get_all_requests error')
        return jsonify({'error': 'Failed to load requests', 'detail': str(e)}), 500


@collab_bp.route('/requests/<int:req_id>/accept', methods=['PUT'])
@jwt_required()
def accept_request(req_id):
    try:
        user_id = int(get_jwt_identity())
        req = CollaborationRequest.query.get(req_id)
        if not req:
            return jsonify({'error': 'Request not found'}), 404
        if req.receiver_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        if req.status != 'pending':
            return jsonify({'error': f'Request already {req.status}'}), 400

        req.status = 'accepted'
        _create_active_collaboration(req)
        _safe_notify(
            req.sender_id,
            'Collaboration Accepted',
            f'{req.receiver.name if req.receiver else "Someone"} accepted your request!',
            'collab_accepted',
        )
        _safe_activity(user_id, 'collab_accepted', 'Accepted collaboration request')
        db.session.commit()

        return jsonify({
            'message': 'Request accepted',
            'request': req.to_dict(),
            'success': True,
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.exception('accept_request error req_id=%s', req_id)
        return jsonify({'error': 'Failed to accept request', 'detail': str(e)}), 500


@collab_bp.route('/requests/<int:req_id>/reject', methods=['PUT'])
@jwt_required()
def reject_request(req_id):
    try:
        user_id = int(get_jwt_identity())
        req = CollaborationRequest.query.get(req_id)
        if not req:
            return jsonify({'error': 'Request not found'}), 404
        if req.receiver_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        if req.status != 'pending':
            return jsonify({'error': f'Request already {req.status}'}), 400

        req.status = 'rejected'
        _safe_notify(req.sender_id, 'Collaboration Declined', 'Your request was declined.', 'collab_rejected')
        db.session.commit()
        return jsonify({'message': 'Request rejected', 'request': req.to_dict(), 'success': True}), 200
    except Exception as e:
        db.session.rollback()
        logger.exception('reject_request error')
        return jsonify({'error': 'Failed to reject request'}), 500


@collab_bp.route('/requests/<int:req_id>/cancel', methods=['DELETE'])
@jwt_required()
def cancel_request(req_id):
    try:
        user_id = int(get_jwt_identity())
        req = CollaborationRequest.query.get(req_id)
        if not req:
            return jsonify({'error': 'Request not found'}), 404
        if req.sender_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        if req.status != 'pending':
            return jsonify({'error': 'Can only cancel pending requests'}), 400
        db.session.delete(req)
        db.session.commit()
        return jsonify({'message': 'Request cancelled', 'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel request'}), 500


@collab_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_collaborations():
    user_id = int(get_jwt_identity())
    collabs = ActiveCollaboration.query.filter(
        db.or_(ActiveCollaboration.user_a_id == user_id, ActiveCollaboration.user_b_id == user_id),
        ActiveCollaboration.status == 'active',
    ).all()
    return jsonify({
        'collaborations': [c.to_dict(current_user_id=user_id) for c in collabs],
    }), 200


@collab_bp.route('/active/<int:collab_id>', methods=['DELETE'])
@jwt_required()
def remove_collaboration(collab_id):
    user_id = int(get_jwt_identity())
    collab = ActiveCollaboration.query.get_or_404(collab_id)
    if user_id not in (collab.user_a_id, collab.user_b_id):
        return jsonify({'error': 'Unauthorized'}), 403
    collab.status = 'removed'
    db.session.commit()
    return jsonify({'message': 'Collaboration removed', 'success': True}), 200


@collab_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def collab_dashboard():
    try:
        user_id = int(get_jwt_identity())
        received_pending = CollaborationRequest.query.filter_by(
            receiver_id=user_id, status='pending'
        ).count()
        sent_pending = CollaborationRequest.query.filter_by(
            sender_id=user_id, status='pending'
        ).count()
        accepted_count = ActiveCollaboration.query.filter(
            db.or_(ActiveCollaboration.user_a_id == user_id, ActiveCollaboration.user_b_id == user_id),
            ActiveCollaboration.status == 'active',
        ).count()
        teams = Team.query.filter_by(leader_id=user_id).all()
        memberships = TeamMember.query.filter_by(user_id=user_id).all()
        invites_received = TeamInvite.query.filter_by(invitee_id=user_id, status='pending').all()
        invites_sent = TeamInvite.query.filter_by(inviter_id=user_id).all()

        activities = []
        try:
            activities = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(15).all()
        except Exception:
            pass

        return jsonify({
            'stats': {
                'pending_received': received_pending,
                'pending_sent': sent_pending,
                'active_collaborations': accepted_count,
                'teams_led': len(teams),
                'team_memberships': len(memberships),
                'pending_invites': len(invites_received),
            },
            'teams': [t.to_dict() for t in teams],
            'memberships': [{'team_id': m.team_id, 'role': m.role, 'project_id': m.project_id} for m in memberships],
            'invites_received': [i.to_dict() for i in invites_received],
            'invites_sent': [i.to_dict() for i in invites_sent],
            'recent_activity': [a.to_dict() for a in activities],
        }), 200
    except Exception as e:
        logger.exception('collab_dashboard error')
        return jsonify({'error': 'Dashboard load failed'}), 500


@collab_bp.route('/teams', methods=['POST'])
@jwt_required()
def create_team():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    if not data.get('name', '').strip():
        return jsonify({'error': 'Team name required'}), 400
    team = Team(
        name=sanitize_input(data.get('name', 'Innovation Team')),
        description=sanitize_input(data.get('description', '')),
        project_id=data.get('project_id'),
        leader_id=user_id,
        max_members=min(int(data.get('max_members', 5)), 20),
        is_open=data.get('is_open', True),
    )
    db.session.add(team)
    db.session.flush()
    db.session.add(TeamMember(team_id=team.id, user_id=user_id, role='leader', project_id=team.project_id))
    _safe_activity(user_id, 'team_created', f'Created team {team.name}')
    db.session.commit()
    return jsonify({'team': team.to_dict()}), 201


@collab_bp.route('/teams', methods=['GET'])
@jwt_required()
def list_teams():
    user_id = int(get_jwt_identity())
    led = Team.query.filter_by(leader_id=user_id).all()
    member_team_ids = [m.team_id for m in TeamMember.query.filter_by(user_id=user_id).all()]
    joined = Team.query.filter(Team.id.in_(member_team_ids)).all() if member_team_ids else []
    all_teams = {t.id: t for t in led + joined}
    result = []
    for t in all_teams.values():
        td = t.to_dict()
        td['members'] = [{
            'user_id': m.user_id,
            'role': m.role,
            'user': m.user.to_dict() if m.user else None,
        } for m in TeamMember.query.filter_by(team_id=t.id).all()]
        td['is_leader'] = t.leader_id == user_id
        result.append(td)
    return jsonify({'teams': result}), 200


@collab_bp.route('/teams/<int:team_id>/invite', methods=['POST'])
@jwt_required()
def invite_teammate(team_id):
    user_id = int(get_jwt_identity())
    team = Team.query.get_or_404(team_id)
    if team.leader_id != user_id:
        return jsonify({'error': 'Only team leader can invite'}), 403
    data = request.get_json() or {}
    invitee_id = data.get('invitee_id')
    if not invitee_id:
        return jsonify({'error': 'invitee_id required'}), 400
    if invitee_id == user_id:
        return jsonify({'error': 'Cannot invite yourself'}), 400
    existing = TeamInvite.query.filter_by(team_id=team_id, invitee_id=invitee_id, status='pending').first()
    if existing:
        return jsonify({'error': 'Invite already sent'}), 409
    invite = TeamInvite(
        team_id=team_id,
        inviter_id=user_id,
        invitee_id=invitee_id,
        role=data.get('role', 'member'),
        message=sanitize_input(data.get('message', '')),
    )
    db.session.add(invite)
    _safe_notify(invitee_id, 'Team Invitation', f'Join team: {team.name}', 'team_invite')
    db.session.commit()
    return jsonify({'invite': invite.to_dict()}), 201


@collab_bp.route('/invites/<int:invite_id>/accept', methods=['PUT'])
@jwt_required()
def accept_invite(invite_id):
    try:
        user_id = int(get_jwt_identity())
        invite = TeamInvite.query.get(invite_id)
        if not invite:
            return jsonify({'error': 'Invite not found'}), 404
        if invite.invitee_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        if invite.status != 'pending':
            return jsonify({'error': f'Invite already {invite.status}'}), 400

        team = Team.query.get(invite.team_id)
        if not team:
            return jsonify({'error': 'Team not found'}), 404
        if team.members.count() >= team.max_members:
            return jsonify({'error': 'Team is full'}), 400

        invite.status = 'accepted'
        if not TeamMember.query.filter_by(team_id=team.id, user_id=user_id).first():
            db.session.add(TeamMember(
                team_id=team.id,
                user_id=user_id,
                role=invite.role or 'member',
                project_id=team.project_id,
            ))
        _safe_notify(invite.inviter_id, 'Invite Accepted', f'{invite.invitee.name if invite.invitee else "User"} joined your team')
        db.session.commit()
        return jsonify({'invite': invite.to_dict(), 'success': True, 'message': 'Joined team'}), 200
    except Exception as e:
        db.session.rollback()
        logger.exception('accept_invite error')
        return jsonify({'error': 'Failed to accept invite', 'detail': str(e)}), 500


@collab_bp.route('/invites/<int:invite_id>/reject', methods=['PUT'])
@jwt_required()
def reject_invite(invite_id):
    try:
        user_id = int(get_jwt_identity())
        invite = TeamInvite.query.get(invite_id)
        if not invite:
            return jsonify({'error': 'Invite not found'}), 404
        if invite.invitee_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        if invite.status != 'pending':
            return jsonify({'error': f'Invite already {invite.status}'}), 400
        invite.status = 'rejected'
        db.session.commit()
        return jsonify({'invite': invite.to_dict(), 'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to reject invite'}), 500


@collab_bp.route('/teams/<int:team_id>/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def remove_team_member(team_id, member_id):
    user_id = int(get_jwt_identity())
    team = Team.query.get_or_404(team_id)
    if team.leader_id != user_id and member_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    member = TeamMember.query.filter_by(team_id=team_id, user_id=member_id).first_or_404()
    if member.role == 'leader' and member_id == team.leader_id:
        return jsonify({'error': 'Cannot remove team leader'}), 400
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Member removed', 'success': True}), 200


@collab_bp.route('/teams/<int:team_id>/members/<int:member_id>/role', methods=['PUT'])
@jwt_required()
def assign_role(team_id, member_id):
    user_id = int(get_jwt_identity())
    team = Team.query.get_or_404(team_id)
    if team.leader_id != user_id:
        return jsonify({'error': 'Only leader can assign roles'}), 403
    member = TeamMember.query.filter_by(team_id=team_id, user_id=member_id).first_or_404()
    member.role = sanitize_input((request.get_json() or {}).get('role', 'member'))
    db.session.commit()
    return jsonify({'member': {'user_id': member.user_id, 'role': member.role}}), 200


@collab_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def collab_suggestions():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'suggestions': []}), 200
    candidates = User.query.filter(User.id != user_id, User.is_active == True).limit(40).all()
    matches = []
    for candidate in candidates:
        score = generate_team_match_score(
            user.get_skills(), candidate.get_skills(),
            user.get_interests(), candidate.get_interests(),
        )
        cd = candidate.to_dict()
        cd['match_score'] = score
        cd['reason'] = 'Complementary skills & shared interests'
        matches.append(cd)
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    return jsonify({'suggestions': matches[:12]}), 200


@collab_bp.route('/online-users', methods=['GET'])
@jwt_required()
def online_users():
    online_ids = list(set(connected_users.values()))
    users = User.query.filter(User.id.in_(online_ids)).all() if online_ids else []
    return jsonify({'online_users': [u.to_dict() for u in users], 'count': len(users)}), 200
