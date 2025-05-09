from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from config import Config
from ai_provider import HomeworkAI
from session_manager import SessionManager
from uuid import uuid4
import structlog

logger = structlog.get_logger(__name__)

def register_routes(app, api: 'Api', config: Config):
    ns = Namespace('api', description='Homework AI operations')
    api.add_namespace(ns)

    session_manager = SessionManager(config)
    homework_ai = HomeworkAI(config, session_manager)

    generate_model = api.model('GenerateAnswer', {
        'question': fields.String(required=True, description='The homework question'),
        'session_id': fields.String(description='Session ID (optional; new session created if not provided)')
    })

    @ns.route('/health')
    class HealthCheck(Resource):
        def get(self):
            return jsonify({
                'status': 'healthy',
                'request_id': str(uuid4())
            })

    @ns.route('/generate_answer')
    class GenerateAnswer(Resource):
        @ns.expect(generate_model)
        def post(self):
            """Generate AI response for a homework question."""
            request_id = str(uuid4())
            logger.info("Processing generate_answer request", request_id=request_id)

            data = request.get_json(silent=True)
            if not data:
                logger.warning("Invalid request data", request_id=request_id)
                return jsonify({
                    'error': 'Invalid request data',
                    'request_id': request_id
                }), 400

            question = data.get('question')
            session_id = data.get('session_id')

            if not question:
                logger.warning("No question provided", request_id=request_id)
                return jsonify({
                    'error': 'No question provided',
                    'request_id': request_id
                }), 400

            if not session_id or not session_manager.session_exists(session_id):
                session_id = homework_ai.start_session()
                logger.info("Created new session", session_id=session_id, request_id=request_id)

            response = homework_ai.generate_response(session_id, question)
            return jsonify(response)

    @ns.route('/chat_history/<string:session_id>')
    class ChatHistory(Resource):
        def get(self, session_id: str):
            """Fetch all chats for a session."""
            request_id = str(uuid4())
            logger.info("Fetching chat history", request_id=request_id, session_id=session_id)

            if not session_manager.session_exists(session_id):
                logger.warning("Invalid session ID", request_id=request_id, session_id=session_id)
                return jsonify({
                    'error': 'Invalid session ID',
                    'request_id': request_id
                }), 404

            history = session_manager.get_all_chats(session_id)
            return jsonify({
                'session_id': session_id,
                'history': history,
                'request_id': request_id
            })
