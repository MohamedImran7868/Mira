from flask import Flask, request, jsonify
from mira import MIRA
from flask_cors import CORS
import logging
import time

app = Flask(__name__)
CORS(app, origins=[
    "https://www.mirahub.me",
    "http://localhost:5173"
])

# Initialize MIRA only once when the app starts
mira = MIRA()

@app.route('/model', methods=['POST'])
def process_message():
    start = time.time()
    try:
        data = request.get_json()
        if not data or 'input' not in data:
            return jsonify({'error': 'Invalid request format'}), 400
            
        user_input = data['input'].strip()
        
        if not user_input:
            return jsonify({'result': "Please share how you're feeling."})
        
        t0 = time.time()
        # Detect emotions
        emotion_results = mira.detect_emotions(user_input)
        
        # Get emotion summary for LLaMA
        emotion_summary = ", ".join([
            f"{er['emotion']} ({er['confidence']:.0%})"
            for er in emotion_results
        ])
        
        t1 = time.time()
        # Generate LLaMA response
        llama_response = mira.generate_llama_response(user_input, emotion_summary)
        
        t2 = time.time()
        logging.info(f"Emotion detection: {t1-t0:.2f}s, LLaMA response: {t2-t1:.2f}s")
        # Format response
        response_data = {
            'result': llama_response,
            'emotions': [
                {
                    'emotion': er['emotion'],
                    'confidence': er['confidence']
                } for er in emotion_results
            ],
            'emotion_summary': emotion_summary
        }
        
        result = jsonify(response_data)
        elapsed = time.time() - start
        logging.info(f"/model processed in {elapsed:.2f} seconds")
        return result
    
    except Exception as e:
        logging.error(f"Error processing message: {e}", exc_info=True)
        return jsonify({
            'result': "Sorry, I encountered an error. Please try again.",
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)