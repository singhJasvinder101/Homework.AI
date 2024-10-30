from flask import Flask, request, jsonify # type: ignore
import os
import google.generativeai as genai # type: ignore
from flask_cors import CORS # type: ignore
from dotenv import load_dotenv  # type: ignore
from langchain_groq import ChatGroq


load_dotenv()
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

genai.configure(api_key = os.environ['GOOGLE_API_KEY'])
llama_key  = os.environ['LLAMA_API_KEY']

model = genai.GenerativeModel('models/gemini-1.5-flash')

@app.route('/', methods = ['GET'])
def hello():
    return jsonify({ 'message': 'working...' })

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response




def llama_response(question):
    llm = ChatGroq(
        model="llama-3.1-70b-versatile",
        temperature=0.95,
        api_key=llama_key
    )

    prompt_template = """
    Please analyze the question below and perform the following:
    - Identify if there are calculations involved; if so, solve accurately and verify results.
    - Provide only the answer in this format: Answer: [Correct Option] - [Option Name].
    - Also return the level of Question in the format: Level: [Level of Question]
    - It may also possible when the user want to talk to you other than question then nicely answer
    
    Example:
    Answer: A - Option Name

    Question: {question}
    """

    prompt = prompt_template.format(question=question)
    response = llm.invoke(prompt)
    
    print("llama called",response.content.strip())
    return response.content.strip()


def gemini_response(question):
    prompt_template = f"""
    Please analyze the question below and perform the following:
    - Identify if there are calculations involved; if so, solve accurately and verify results.
    - Provide only the answer in this format: Answer: [Correct Option](Optionally/ not necessory) - [Option Name] compulsory.
    - Also return the level of Question in the format: Level: [Level of Question]
    - It may also possible when the user want to talk to you other than question then nicely answer
    
    Example:
    Answer: A - Option Name

    Question: {question}
    """


    generation_config = genai.types.GenerationConfig(
      top_p=0.95,  # required probability
      top_k=64,   
      temperature=0.85, 
      max_output_tokens=8192  
    )

    try:
        response = model.generate_content(
            prompt_template,
            generation_config = generation_config
        )
        print("gemini called",response.text)
        return response.text
    except:
      print('An exception occurred')
      return "something went wrong"

@app.route('/generate_answer', methods = ['POST'])
def generate_answer():
    data = request.json
    question = data.get('question')
    model_count = data.get('model_count')

    if not question:
        return jsonify({ 'error': 'No question provided' }), 400
    
    response = ""
    
    print(model_count)

    if(model_count == 1):
        response = gemini_response(question)  
    elif(model_count == 2):
        response = llama_response(question)
    else:
        response = gemini_response(question)
        

    return jsonify({ 'answer': response })

if __name__ == '__main__':
    app.run(debug = True)


#     from anthropic import Anthropic
#     prompt_template = f"""
#     You are a search engine that provides very brief, direct answers.
#     Rules:
#     - Provide only the essential information without explanations
#     - For math problems, solve step by step but show only final answer
#     - For factual questions, verify thoroughly and provide only verified facts
#     - Max response length: 2-3 sentences
#     - No explanations or context unless absolutely necessary

#     Question: {question}

#     Answer: """

#     try:
#         response = anthropic.messages.create(
#             model="claude-3-sonnet-20240229",
#             max_tokens=150,
#             temperature=0.7,
#             system="You are a direct answering service. Provide only essential information without explanations.",
#             messages=[
#                 {
#                     "role": "user",
#                     "content": prompt_template
#                 }
#             ]
#         )

#         return jsonify({'answer': response.content[0].text})
    