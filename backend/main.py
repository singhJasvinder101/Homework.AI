from flask import Flask, request, jsonify  # type: ignore
import os
from flask_cors import CORS  # type: ignore
from dotenv import load_dotenv  # type: ignore
import google.generativeai as genai  # type: ignore
from openai import OpenAI
from g4f.client import Client

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

genai.configure(api_key=os.environ['GOOGLE_API_KEY'])
llama_key = os.environ['LLAMA_API_KEY']
chatgpt_key = os.environ['CHATGPT_TOKEN']

model = genai.GenerativeModel('models/gemini-1.5-flash')
client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=chatgpt_key,
)
gpt_client = Client()

@app.route('/', methods=['GET'])
def hello():
    return jsonify({'message': 'working...'})

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response


def gemini_response(question: str) -> str:
    prompt = f"""
    Please respond to the following input thoughtfully and empathetically:
    - If it is a question, analyze and solve it accurately.
    - If calculations are involved, solve and verify results.
    - For ambiguous inputs, provide helpful guidance or a clarifying question.
    - Incase you are not getting the question correctly or option ask the user to "scan or copy-paste the question again".
    - for mathematicall question do not use latex format.
    - For non-questions, respond kindly and encouragingly to make the user feel supported.
    - Always be humble and polite in your response.


    response format for a question must be like this:
    Answer: A - Option Name
    Level: Easy

    Question: {question}
    """

    generation_config = genai.types.GenerationConfig(
        top_p=0.95,
        top_k=64,
        temperature=0.85,
        max_output_tokens=8192
    )

    try:
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error in gemini_response: {e}")
        "Something went wrong. Please try again later or try with different Ai using switch AI Button"

def chatgpt_response(question: str) -> str:
    # print(question)
    try:
        prompt_template = f"""
        Please respond to the following input thoughtfully and empathetically:
        - If it is a question, analyze and solve it accurately.
        - If calculations are involved, solve and verify results.
        - For ambiguous inputs, provide helpful guidance or a clarifying question.
        - Incase you are not getting the question correctly or option ask the user to "scan or copy-paste the question again".
        - for mathematicall question do not use latex format.
        - For non-questions, respond kindly and encouragingly to make the user feel supported.
        - Always be humble and polite in your response.

    
        In Last line write the final answer and the level in this format:
        Answer: your final answer
        Level: (easy, medium, hard)

        Example for non-question:
        "Thank you for reaching out! How can I assist you further?"

        Input: {question}
        """

        response = gpt_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a polite and helpful assistant."},
                {"role": "user", "content": prompt_template}
            ],
            model="gpt-4o",
            temperature=0.9,
            max_tokens=4096,
            top_p=1
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(e)
        print(f"Error in chatgpt_response: {e}")
        return "Something went wrong. Please try again later or try with different Ai using switch AI Button"

@app.route('/generate_answer', methods=['POST'])
def generate_answer():
    print("generate_answer API hit")
    data = request.json
    print("Request Data:", data)

    if not data:
        print("No data received in the request")
        return jsonify({'error': 'Invalid request data'}), 400
    
    data = request.json
    question = data.get('question')
    model_count = data.get('model_count')

    if not question:
        return jsonify({'error': 'No question provided'}), 400

    try:
        if model_count == 1:
            response = gemini_response(question)
        elif model_count == 2:
            response = chatgpt_response(question)
        else:
            response = chatgpt_response(question)
            
        print(model_count)

        return jsonify({'answer': response})
    except Exception as e:
        print(f"Error in generate_answer: {e}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

if __name__ == '__main__':
    app.run(debug=True)
