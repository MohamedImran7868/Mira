from flask import Flask, request, jsonify # Flask API: a light-weight REST API for communication between server and website
from flask_cors import CORS
from emotiondetector import predict_emotion

app = Flask(__name__)
CORS(app)

@app.route('/model', methods=['POST']) # route the connection
def response_generator():
    data = request.json # set the request received in a variable
    result = predict_emotion(data['input']) # genereate the response
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)