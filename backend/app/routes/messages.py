from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.models import Message, Notification, User
from app.middleware.auth import sanitize_input
from sqlalchemy import or_, and_, case

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = int(get_jwt_identity())

    partner_ids = set()
    sent = db.session.query(Message.receiver_id).filter(
        Message.sender_id == user_id,
        Message.room_id.is_(None),
        Message.receiver_id.isnot(None)
    ).distinct().all()
    received = db.session.query(Message.sender_id).filter(
        Message.receiver_id == user_id,
        Message.room_id.is_(None)
    ).distinct().all()

    for (rid,) in sent: partner_ids.add(rid)
    for (sid,) in received: partner_ids.add(sid)

    conversations = []
    for pid in sorted(partner_ids):
        last_msg = Message.query.filter(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == pid),
                and_(Message.sender_id == pid, Message.receiver_id == user_id)
            ),
            Message.room_id.is_(None)
        ).order_by(Message.created_at.desc()).first()

        if last_msg:
            other_user = User.query.get(pid)
            if other_user:
                unread = Message.query.filter_by(
                    sender_id=pid, receiver_id=user_id, is_read=False
                ).count()
                conversations.append({
                    'user': other_user.to_dict(),
                    'last_message': last_msg.to_dict(),
                    'unread_count': unread
                })

    conversations.sort(key=lambda c: c['last_message']['created_at'] or '', reverse=True)
    return jsonify({'conversations': conversations}), 200

@messages_bp.route('/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_messages(other_user_id):
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)

    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == user_id)
        ),
        Message.room_id.is_(None)
    ).order_by(Message.created_at.asc()).paginate(page=page, per_page=50, error_out=False)

    # Mark as read
    Message.query.filter_by(sender_id=other_user_id, receiver_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()

    return jsonify({
        'messages': [m.to_dict() for m in messages.items],
        'total': messages.total,
        'pages': messages.pages
    }), 200

@messages_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('content'):
        return jsonify({'error': 'Content required'}), 400

    msg = Message(
        sender_id=user_id,
        receiver_id=data.get('receiver_id'),
        room_id=data.get('room_id'),
        content=sanitize_input(data['content']),
        message_type=data.get('message_type', 'text')
    )
    db.session.add(msg)

    if data.get('receiver_id'):
        notif = Notification(
            user_id=data['receiver_id'],
            title='New Message',
            message=f'You have a new message',
            type='message'
        )
        db.session.add(notif)

    db.session.commit()
    return jsonify({'message': msg.to_dict()}), 201

@messages_bp.route('/room/<room_id>', methods=['GET'])
@jwt_required()
def get_room_messages(room_id):
    page = request.args.get('page', 1, type=int)
    messages = Message.query.filter_by(room_id=room_id).order_by(
        Message.created_at.asc()
    ).paginate(page=page, per_page=50, error_out=False)
    return jsonify({'messages': [m.to_dict() for m in messages.items]}), 200

@messages_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).limit(50).all()
    unread = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({'notifications': [n.to_dict() for n in notifs], 'unread_count': unread}), 200

@messages_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200
