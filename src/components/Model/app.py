from flask import Flask, request, jsonify, Response, stream_with_context
from mira import MIRA
from flask_cors import CORS
import logging
import time
import json

app = Flask(__name__)
CORS(app, origins=[
    "https://www.mirahub.me",
    "http://localhost:5173"
])

mira = MIRA()

@app.route('/model', methods=['POST'])
def process_message():
    try:
        data = request.get_json()
        if not data or 'input' not in data:
            return jsonify({'error': 'Invalid request format'}), 400

        user_input = data['input'].strip()
        if not user_input:
            return jsonify({'result': "Please share how you're feeling."})

        # Detect emotions
        emotion_results = mira.detect_emotions(user_input)
        emotion_summary = ", ".join([
            f"{er['emotion']} ({er['confidence']:.0%})"
            for er in emotion_results
        ])

        # Streaming generator
        def generate():
            # Send emotion info first
            yield json.dumps({
                "emotions": emotion_results,
                "emotion_summary": emotion_summary,
                "chunk": "",
                "done": False
            }) + "\n"

            # Stream LLaMA response
            for chunk in mira.generate_llama_response_stream(user_input, emotion_summary):
                yield json.dumps({
                    "chunk": chunk["chunk"],
                    "done": chunk["done"]
                }) + "\n"

        return Response(stream_with_context(generate()), mimetype='application/json')

    except Exception as e:
        logging.error(f"Error processing message: {e}", exc_info=True)
        return jsonify({
            'result': "Sorry, I encountered an error. Please try again.",
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)