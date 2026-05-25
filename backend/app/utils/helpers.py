import random
import string
from datetime import datetime, timedelta
from flask_mail import Message as MailMessage
from app.extensions import mail
import logging

logger = logging.getLogger(__name__)

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp, name="User"):
    try:
        msg = MailMessage(
            subject='InnovX AI - Email Verification OTP',
            sender='noreply@innovx.ai',
            recipients=[email]
        )
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
            <div style="background: white; border-radius: 8px; padding: 30px; text-align: center;">
                <h1 style="color: #667eea; margin-bottom: 10px;">InnovX AI</h1>
                <h2 style="color: #333;">Email Verification</h2>
                <p style="color: #666;">Hi {name}, your OTP is:</p>
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-size: 36px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                    {otp}
                </div>
                <p style="color: #999; font-size: 12px;">Valid for 10 minutes. Do not share this OTP.</p>
            </div>
        </div>"""
        mail.send(msg)
        return True
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False

def calculate_rank(points):
    if points >= 10000: return 'Legend'
    elif points >= 5000: return 'Expert'
    elif points >= 2000: return 'Advanced'
    elif points >= 1000: return 'Intermediate'
    elif points >= 500: return 'Rising Star'
    elif points >= 100: return 'Explorer'
    return 'Newcomer'

def award_points(user, points, achievement_title=None):
    from app.models.models import Achievement
    from app.extensions import db
    user.points += points
    user.rank = calculate_rank(user.points)
    user.innovation_score = min(user.innovation_score + points // 10, 1000)
    if achievement_title:
        achievement = Achievement(
            user_id=user.id,
            title=achievement_title,
            points_awarded=points,
            badge_icon='🏆',
            badge_color='gold'
        )
        db.session.add(achievement)
    db.session.commit()

def paginate_query(query, page, per_page=12):
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': paginated.items,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev
    }
