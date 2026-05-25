from app.extensions import socketio, db
from app.models.models import Message, Notification
from flask_jwt_extended import decode_token
from flask import request
import logging

logger = logging.getLogger(__name__)
connected_users = {}

def register_socket_events(app):
    @socketio.on('connect')
    def handle_connect(auth):
        try:
            token = auth.get('token') if auth else None
            if token:
                decoded = decode_token(token)
                user_id = decoded.get('sub')
                connected_users[request.sid] = user_id
                socketio.emit('connected', {'user_id': user_id}, room=request.sid)
                logger.info(f"User {user_id} connected")
        except Exception as e:
            logger.error(f"Socket connect error: {e}")

    @socketio.on('disconnect')
    def handle_disconnect():
        user_id = connected_users.pop(request.sid, None)
        if user_id:
            logger.info(f"User {user_id} disconnected")

    @socketio.on('join_room')
    def handle_join_room(data):
        from flask_socketio import join_room
        room = data.get('room')
        if room:
            join_room(room)
            socketio.emit('room_joined', {'room': room}, room=request.sid)

    @socketio.on('leave_room')
    def handle_leave_room(data):
        from flask_socketio import leave_room
        room = data.get('room')
        if room:
            leave_room(room)

    @socketio.on('send_message')
    def handle_message(data):
        with app.app_context():
            try:
                sender_sid = request.sid
                sender_id = connected_users.get(sender_sid)
                if not sender_id:
                    return

                msg = Message(
                    sender_id=sender_id,
                    receiver_id=data.get('receiver_id'),
                    room_id=data.get('room_id'),
                    content=data.get('content', ''),
                    message_type=data.get('message_type', 'text')
                )
                db.session.add(msg)
                db.session.commit()

                msg_data = msg.to_dict()

                if data.get('room_id'):
                    socketio.emit('new_message', msg_data, room=data['room_id'])
                elif data.get('receiver_id'):
                    receiver_sid = next((sid for sid, uid in connected_users.items() if uid == data['receiver_id']), None)
                    if receiver_sid:
                        socketio.emit('new_message', msg_data, room=receiver_sid)
                    socketio.emit('new_message', msg_data, room=sender_sid)

                    notif = Notification(
                        user_id=data['receiver_id'],
                        title='New Message',
                        message='You have a new message',
                        type='message'
                    )
                    db.session.add(notif)
                    db.session.commit()

                    if receiver_sid:
                        socketio.emit('notification', notif.to_dict(), room=receiver_sid)

            except Exception as e:
                logger.error(f"Message error: {e}")
                socketio.emit('error', {'message': str(e)}, room=request.sid)

    @socketio.on('typing')
    def handle_typing(data):
        receiver_id = data.get('receiver_id')
        sender_id = connected_users.get(request.sid)
        if receiver_id and sender_id:
            receiver_sid = next((sid for sid, uid in connected_users.items() if uid == receiver_id), None)
            if receiver_sid:
                socketio.emit('user_typing', {'user_id': sender_id}, room=receiver_sid)

    @socketio.on('stop_typing')
    def handle_stop_typing(data):
        receiver_id = data.get('receiver_id')
        sender_id = connected_users.get(request.sid)
        if receiver_id and sender_id:
            receiver_sid = next((sid for sid, uid in connected_users.items() if uid == receiver_id), None)
            if receiver_sid:
                socketio.emit('user_stop_typing', {'user_id': sender_id}, room=receiver_sid)
