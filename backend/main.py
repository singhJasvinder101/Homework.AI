import os
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_restx import Api
from dotenv import load_dotenv
from config import Config
from routes import register_routes
from logger_config import setup_logging
from rate_limiter import limiter

load_dotenv()


def create_app() -> Flask:
    setup_logging()
    config = Config()
    app = Flask(__name__)
    config.validate()

    CORS(app, resources={r"/*": {"origins": config.allowed_origins}})

    api = Api(
        app,
        version='1.0',
        title='Homework AI API',
        description='A context-based AI for answering homework questions',
        doc='/swagger/'
    )

    register_routes(app, api, config)

    return app

if __name__ == '__main__':
    app = create_app()
    config = Config()
    limiter.init_app(app)
    app.run(debug=config.debug, host=config.host, port=config.port)