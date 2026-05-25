from flask import Flask, jsonify, request
from app.extensions import db, jwt, bcrypt, socketio, cors, mail, limiter
from config import config
from app.utils.ai_service import init_gemini
import logging
import os

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Fix CORS — allow all origins in dev, specific in prod
    cors.init_app(app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    socketio.init_app(app,
        cors_allowed_origins="*",
        async_mode='threading',
        logger=False,
        engineio_logger=False
    )

    mail.init_app(app)
    limiter.init_app(app)

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(name)s: %(message)s'
    )

    init_gemini(app.config)

    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.projects import projects_bp
    from app.routes.startups import startups_bp
    from app.routes.messages import messages_bp
    from app.routes.mentors import mentors_bp
    from app.routes.events import events_bp
    from app.routes.ai_routes import ai_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.feed import feed_bp
    from app.routes.collaboration import collab_bp
    from app.routes.social import social_bp
    from app.routes.career import career_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(startups_bp, url_prefix='/api/startups')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(mentors_bp, url_prefix='/api/mentors')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(feed_bp, url_prefix='/api/feed')
    app.register_blueprint(collab_bp, url_prefix='/api/collaboration')
    app.register_blueprint(social_bp, url_prefix='/api/social')
    app.register_blueprint(career_bp, url_prefix='/api/career')

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        from flask import send_from_directory
        upload_dir = app.config.get('UPLOAD_FOLDER', 'uploads')
        return send_from_directory(upload_dir, filename)

    from app.sockets.events import register_socket_events
    register_socket_events(app)

    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            app.logger.warning('Database connection failed: %s', e)
            app.logger.warning('App running without database connectivity')

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Bad request', 'message': str(e)}), 400

    @app.errorhandler(500)
    def server_error(e):
        logger.exception('Unhandled server error')
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429

    @app.route('/api/health')
    def health():
        from app.utils.ai_service import get_ai_status
        return jsonify({
            'status': 'ok',
            'service': 'InnovX AI Backend',
            'ai': get_ai_status(),
        }), 200

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

    return app
