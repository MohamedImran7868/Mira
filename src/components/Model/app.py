from flask import Flask, request, jsonify
from mira import MIRA
from flask_cors import CORS
import logging
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

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
        
        # Detect emotions
        emotion_results = mira.detect_emotions(user_input)
        
        # Get emotion summary for LLaMA
        emotion_summary = ", ".join([
            f"{er['emotion']} ({er['confidence']:.0%})"
            for er in emotion_results
        ])
        
        # Generate LLaMA response
        llama_response = mira.generate_llama_response(user_input, emotion_summary)
        
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
        
        # Log conversation
        mira.log_conversation(user_input, {
            'emotions_detected': emotion_results,
            'bot_response': llama_response
        })
        
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