from typing import Dict, List
from uuid import uuid4
from config import Config
import structlog

logger = structlog.get_logger(__name__)

class SessionManager:
    def __init__(self, config: Config):
        self.config = config
        self.sessions: Dict[str, List[Dict[str, str]]] = {}

    def create_session(self, session_id: str) -> None:
        """Create a new session."""
        self.sessions[session_id] = []

    def session_exists(self, session_id: str) -> bool:
        """Check if a session exists."""
        return session_id in self.sessions

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """Add a message to the session history."""
        if self.session_exists(session_id):
            self.sessions[session_id].append({"role": role, "content": content})
            # Limit history to max_history_length
            if len(self.sessions[session_id]) > self.config.max_history_length:
                self.sessions[session_id] = self.sessions[session_id][-self.config.max_history_length:]
            logger.debug("Added message to session", session_id=session_id, role=role)

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get the conversation history for a session."""
        if self.session_exists(session_id):
            return self.sessions[session_id]
        logger.warning("Session not found", session_id=session_id)
        return []

    def get_all_chats(self, session_id: str) -> List[Dict[str, str]]:
        """Get all chats for a session."""
        return self.get_history(session_id)