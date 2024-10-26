from flask import Flask, request, jsonify # type: ignore
import os
import google.generativeai as genai # type: ignore
from flask_cors import CORS # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

genai.configure(api_key = os.environ['GOOGLE_API_KEY'])

model = genai.GenerativeModel('models/gemini-1.5-flash')

@app.route('/', methods = ['GET'])
def hello():
    return jsonify({ 'message': 'working...' })

@app.route('/generate_answer', methods = ['POST'])
def generate_answer():
    data = request.json
    question = data.get('question')

    if not question:
        return jsonify({ 'error': 'No question provided' }), 400

    prompt_template = f"""
    Ensure that every answers to my questions come from reputable sources and always include citations and links to the sources for information.
    
    If the questions include good mathematical questions do solve them by yourself and revise your answer 4 times before submitting.
    
    If question include factual question carefully check the answer from all sources and return most accurate answer also check your answer and verify with question atleast 3-4 times

    Do not give me explanation of the answer Just write the correct answer.
    
    In next line rate the level of question as level:
    Question: {question}"""


    generation_config = genai.types.GenerationConfig(
      top_p=0.95,  # required probability
      top_k=64,   
      temperature=0.85, 
      max_output_tokens=8192  
    )

    response = model.generate_content(
        prompt_template,
        generation_config = generation_config
    )

    return jsonify({ 'answer': response.text })

if __name__ == '__main__':
    app.run(debug = True)
