import json
from typing import Dict, Any, List
from uuid import uuid4
import google.generativeai as genai
from config import Config
from session_manager import SessionManager
import structlog

logger = structlog.get_logger(__name__)

class HomeworkAI:
    """Context-based Homework AI powered by Google Gemini."""
    def __init__(self, config: Config, session_manager: SessionManager):
        """Initialize Gemini client and system prompt."""
        self.config = config
        self.session_manager = session_manager
        genai.configure(api_key=config.google_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.system_prompt = self._load_system_prompt()
        logger.info("HomeworkAI initialized successfully")

    def _load_system_prompt(self) -> str:
        """Load the system prompt for Gemini."""
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

```
json example for multiple-choice question
{
    "closing_note": "Keep up the great work! Understanding the strengths and weaknesses of different data structures is key in programming. ",
  "difficulty_level": "Medium",
  "final_answer": "The correct disadvantages of arrays from the options provided are b) and d).",
  "greeting": "Hello! Let's figure out the disadvantages of arrays.",
  "question_type": "general",
  "request_id": "12ebaedb-4e8d-4deb-8f21-503c3342692d",
  "session_id": "0ca67a87-37e2-4f51-80b1-c22e59b147b2",
  "solution_steps": [
    "a) is incorrect because array indices are typically non-negative integers starting at 0. c) is incorrect because while not ideal, it's possible to implement queue or stack-like behavior using arrays (although less efficient than other data structures)."
    "Arrays store elements in contiguous memory locations.  This means each element is placed directly next to the other in memory.",
    "Because of this contiguous storage, accessing elements sequentially is very efficient.  However, it is also a disadvantage if you need to frequently insert or delete elements in the middle of the array, as it requires shifting other elements.",
    "Arrays have a fixed size determined at creation.  If you allocate more space than needed, you waste memory.  If you allocate less space, you cannot add more elements without creating a new, larger array and copying everything over.",
    "While arrays can be used to implement some aspects of queues or stacks, they aren't the most efficient or natural data structures for these purposes. Other data structures are better suited."
  ]
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
        """Start a new session and return its ID."""
        session_id = str(uuid4())
        self.session_manager.create_session(session_id)
        self.session_manager.add_message(session_id, "user", self.system_prompt)
        logger.info("Started new session", session_id=session_id)
        return session_id

    def generate_response(self, session_id: str, question: str) -> Dict[str, Any]:
        """Generate a response for the given question."""
        request_id = str(uuid4())
        logger.info("Processing question", request_id=request_id, session_id=session_id, question=question[:50])

        if not self.session_manager.session_exists(session_id):
            logger.warning("Invalid session ID", request_id=request_id, session_id=session_id)
            return self._error_response("Invalid session ID", request_id, session_id)

        if not question or not isinstance(question, str):
            logger.warning("Invalid question provided", request_id=request_id, session_id=session_id)
            self.session_manager.add_message(session_id, "user", "No question provided")
            return self._error_response("No question provided", request_id, session_id, steps=[
                "It seems no question was provided.",
                "Please provide a valid homework question."
            ])

        self.session_manager.add_message(session_id, "user", question)

        conversation = [
            {"role": msg["role"], "parts": [{"text": msg["content"]}]}
            for msg in self.session_manager.get_history(session_id)
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
            self.session_manager.add_message(session_id, "assistant", response.text.strip())
            response_json["request_id"] = request_id
            response_json["session_id"] = session_id
            logger.info("Generated response successfully", request_id=request_id, session_id=session_id)
            return response_json
        except json.JSONDecodeError as e:
            logger.error("Failed to parse JSON response", request_id=request_id, session_id=session_id, error=str(e))
            self.session_manager.add_message(session_id, "assistant", "Error: Failed to parse response")
            return self._error_response("Failed to parse response", request_id, session_id, steps=[
                "There was an issue processing the response.",
                "Please try again or rephrase your question."
            ])
        except Exception as e:
            logger.error("Gemini API error", request_id=request_id, session_id=session_id, error=str(e))
            self.session_manager.add_message(session_id, "assistant", "Error: API failure")
            return self._error_response("API failure", request_id, session_id, steps=[
                "Something went wrong while processing your question.",
                "Please try again later."
            ])

    def _error_response(self, message: str, request_id: str, session_id: str, steps: List[str] = None) -> Dict[str, Any]:
        """Return a structured error response."""
        return {
            "greeting": "Hello! I'm here to assist you!",
            "question_type": "Error",
            "solution_steps": steps or ["An error occurred.", "Please try again."],
            "final_answer": message,
            "difficulty_level": "Unclear",
            "closing_note": "No worries, let's try again! I'm here to help!",
            "request_id": request_id,
            "session_id": session_id
        }