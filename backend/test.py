import os
import json
from typing import Dict, Any, List
from dataclasses import dataclass
from uuid import uuid4
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Config:
    """Application configuration."""
    google_api_key: str = os.getenv('GOOGLE_API_KEY', '')
    debug: bool = os.getenv('DEBUG', 'False').lower() == 'true'

    def validate(self) -> None:
        """Validate configuration."""
        if not self.google_api_key:
            raise ValueError("Missing required environment variable: GOOGLE_API_KEY")

class Session:
    """Manages conversation history for a session."""
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.history: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str) -> None:
        self.history.append({"role": role, "content": content})

    def get_history(self) -> List[Dict[str, str]]:
        return self.history

class HomeworkAI:
    """Context-based Homework AI powered by Google Gemini."""
    def __init__(self, config: Config):
        self.config = config
        self.config.validate()
        genai.configure(api_key=self.config.google_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.system_prompt = self._load_system_prompt()
        self.sessions: Dict[str, Session] = {}

    def _load_system_prompt(self) -> str:
        return """
    <system_prompt>
YOU ARE "HOMEWORK-GEMINI", A DILIGENT, KIND, AND HIGHLY INTELLIGENT AI HOMEWORK ASSISTANT OPTIMIZED FOR GOOGLE'S GEMINI 1.5 MODEL ON A FREE TIER. YOUR PURPOSE IS TO HELP STUDENTS BY PROVIDING ACCURATE, WELL-STRUCTURED, AND POLITE RESPONSES TO ANY HOMEWORK-RELATED QUESTIONS — ACADEMIC, MATHEMATICAL, CONCEPTUAL, OR PRACTICAL.

---

###CORE OBJECTIVE###

RESPOND TO STUDENT QUERIES WITH:
1. CORRECT ANSWERS
2. SUPPORTIVE ENCOURAGEMENT
3. STRUCTURED JSON OUTPUT THAT CAN BE PARSED BY A FRONTEND UI

---

###CRITICAL GEMINI CAPABILITIES TO UTILIZE###

✅ **TEXT GENERATION** – PRODUCE NATURAL LANGUAGE RESPONSES THAT ARE POLITE, EXPLANATORY, AND EASY TO UNDERSTAND  
✅ **STRUCTURED OUTPUT** – RESPOND IN JSON FORMAT AS SHOWN BELOW  
✅ **LONG CONTEXT UNDERSTANDING** – HANDLE MULTI-SENTENCE QUESTIONS OR TEXTBOOK PASSAGES EFFECTIVELY  
✅ **THINKING + CHAIN OF REASONING** – ALWAYS EXPLAIN LOGIC IN SIMPLE STEPS  
✅ **DOCUMENT UNDERSTANDING** – IF A PARAGRAPH, CASE STUDY, OR TEXT IS GIVEN, EXTRACT THE MAIN IDEA AND ANSWER THE QUESTION

❌ **DO NOT USE** IMAGE ANALYSIS, FUNCTION CALLING, OR GOOGLE SEARCH — TO MINIMIZE TOKEN USAGE AND AVOID FREE-TIER LIMIT ISSUES

---

###RESPONSE FORMAT (MUST FOLLOW STRICTLY)###

ALWAYS RETURN A JSON OBJECT STRUCTURED AS FOLLOWS:

```json
{
  "greeting": "string",         // Kind, friendly opening message
  "question_type": "string",    // One of: 'math', 'science', 'history', 'essay', 'multiple-choice', 'general'
  "solution_steps": ["string"], // Step-by-step reasoning/explanation
  "final_answer": "string",     // The final answer clearly stated
  "difficulty_level": "Easy | Medium | Hard",
  "closing_note": "string"      // Supportive message, motivational or helpful closing
}
```

---

###CHAIN OF THOUGHTS TO FOLLOW###

1. **UNDERSTAND** the input: Is it a question, concept, essay, or passage-based?
2. **CLASSIFY** the question type into one of the following: math, science, history, essay, multiple-choice, general
3. **BREAK DOWN** the input into manageable reasoning steps
4. **SOLVE** it using factual logic or concept clarity
5. **FORMAT** your answer strictly using the JSON structure above
6. **RESPOND** with empathy — always include a kind greeting and closing line

---

###WHAT NOT TO DO###

- ❌ DO NOT RETURN UNSTRUCTURED TEXT
- ❌ DO NOT USE LATEX OR SYMBOLS IN MATH RESPONSES
- ❌ DO NOT CALL EXTERNAL FUNCTIONS OR PLUGINS
- ❌ NEVER USE IMAGE, AUDIO, OR MULTIMODAL INPUTS (TEXT ONLY)
- ❌ DO NOT OMIT THE GREETING OR CLOSING
- ❌ NEVER PROVIDE JUST THE ANSWER WITHOUT STEP-BY-STEP LOGIC
- ❌ DO NOT GUESS — IF INPUT IS UNCLEAR, ASK FOR CLARIFICATION

---

###EXAMPLES###

**Input**:  
What is the square root of 144?

**Output**:
```json
{
  "greeting": "Hi there! Let's solve this together 🙂",
  "question_type": "math",
  "solution_steps": [
    "We are asked to find the square root of 144.",
    "The square root of a number is a value that, when multiplied by itself, gives the original number.",
    "12 × 12 = 144"
  ],
  "final_answer": "12",
  "difficulty_level": "Easy",
  "closing_note": "You're doing great! Keep practicing and you'll master this in no time 🚀"
}
```

---

**Input**:  
Why did World War I start?

**Output**:
```json
{
  "greeting": "Hello! Here's a quick breakdown of your history question 📚",
  "question_type": "history",
  "solution_steps": [
    "World War I started in 1914 due to a combination of political tensions, military alliances, and imperial competition.",
    "The immediate trigger was the assassination of Archduke Franz Ferdinand of Austria-Hungary.",
    "This caused Austria-Hungary to declare war on Serbia, and a chain reaction of alliances followed."
  ],
  "final_answer": "The assassination of Archduke Franz Ferdinand triggered the war, supported by deeper political and military tensions.",
  "difficulty_level": "Medium",
  "closing_note": "Thanks for your curiosity — keep exploring the past to understand the present! 🕊️"
}
```

---

</system_prompt>

    """ 

    def start_session(self) -> str:
        session_id = str(uuid4())
        self.sessions[session_id] = Session(session_id)
        self.sessions[session_id].add_message("user", self.system_prompt)
        return session_id

    def generate_response(self, session_id: str, question: str) -> Dict[str, Any]:
        request_id = str(uuid4())

        if session_id not in self.sessions:
            return {
                "greeting": "Hello! Let's get started with your homework!",
                "question_type": "Error",
                "solution_steps": [
                    "The session ID is invalid or has expired.",
                    "Please start a new session and try again."
                ],
                "final_answer": "Unable to process due to invalid session.",
                "difficulty_level": "Unclear",
                "closing_note": "I'm here to help! Start a new session, and we'll dive in!",
                "request_id": request_id,
                "session_id": session_id
            }

        if not question or not isinstance(question, str):
            self.sessions[session_id].add_message("user", "No question provided")
            return {
                "greeting": "Hello! I'm here to help with your homework!",
                "question_type": "Unclear",
                "solution_steps": [
                    "It seems no question was provided.",
                    "Please scan or copy-paste your homework question, and I'll assist you!"
                ],
                "final_answer": "Please provide a question to proceed.",
                "difficulty_level": "Unclear",
                "closing_note": "Don't worry, I'm here to help! Just share your question!",
                "request_id": request_id,
                "session_id": session_id
            }

        self.sessions[session_id].add_message("user", question)

        conversation = [
            {"role": msg["role"], "parts": [{"text": msg["content"]}]}
            for msg in self.sessions[session_id].get_history()
        ]

        generation_config = genai.types.GenerationConfig(
            top_p=0.95,
            top_k=64,
            temperature=0.85,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )

        try:
            response = self.model.generate_content(
                conversation,
                generation_config=generation_config
            )
            response_json = json.loads(response.text.strip())
            self.sessions[session_id].add_message("assistant", response.text.strip())
            response_json["request_id"] = request_id
            response_json["session_id"] = session_id
            return response_json
        except json.JSONDecodeError:
            self.sessions[session_id].add_message("assistant", "Error: Failed to parse response")
            return {
                "greeting": "Hello! I'm here to assist you!",
                "question_type": "Error",
                "solution_steps": [
                    "There was an issue processing the response.",
                    "Please try again or rephrase your question."
                ],
                "final_answer": "Unable to generate response due to parsing error.",
                "difficulty_level": "Unclear",
                "closing_note": "Let's try again! I'm here to support you!",
                "request_id": request_id,
                "session_id": session_id
            }
        except Exception:
            self.sessions[session_id].add_message("assistant", "Error: API failure")
            return {
                "greeting": "Hi! I'm ready to help with your homework!",
                "question_type": "Error",
                "solution_steps": [
                    "Something went wrong while processing your question.",
                    "Please try again later or check if the question is clear."
                ],
                "final_answer": "Unable to generate response due to an error.",
                "difficulty_level": "Unclear",
                "closing_note": "No worries, we'll get this sorted! Try again soon!",
                "request_id": request_id,
                "session_id": session_id
            }

def main():
    config = Config()
    homework_ai = HomeworkAI(config)
    session_id = homework_ai.start_session()

    sample_questions = [
        "What is 2 + 3?",
        "Can you explain why the answer is 5?",
        "Explain photosynthesis",
        "Hi, I'm stuck on my homework"
    ]

    for question in sample_questions:
        response = homework_ai.generate_response(session_id, question)
        print(json.dumps(response, indent=2))

if __name__ == '__main__':
    main()
