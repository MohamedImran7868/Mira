from flask import Flask, request, jsonify
from mira import MIRA
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)
mira = MIRA()

@app.route('/model', methods=['POST'])
def process_message():
    try:
        data = request.get_json()
        user_input = data.get('input', '').strip()
        
        if not user_input:
            return jsonify({'result': "Please share how you're feeling."})
        
        # Detect emotions
        emotion_results = mira.detect_emotions(user_input)
        
        # Generate response
        emotions = [er["emotion"] for er in emotion_results]
        response = mira.generate_response(emotions)
        
        # Format emotion display
        emotion_strings = [f"{er['emotion']} ({er['confidence']:.0%})" for er in emotion_results]
        emotion_display = ", ".join(emotion_strings)
        
        full_response = f"I sense you're feeling {emotion_display}.\n{response}"
        
        # Log conversation
        mira.log_conversation(user_input, {
            'emotions_detected': emotion_results,
            'bot_response': response
        })
        
        return jsonify({'result': full_response})
    
    except Exception as e:
        logging.error(f"Error processing message: {e}")
        return jsonify({'result': "Sorry, I encountered an error. Please try again."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)