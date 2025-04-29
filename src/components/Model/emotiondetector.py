from transformers import BertForSequenceClassification, BertTokenizer
import torch, os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # get the folder where emotiondetector.py is
model_path = os.path.join(BASE_DIR, 'emotion_model_27')
# model_name = 'j-hartmann/emotion-english-distilroberta-base'
tokenizer = BertTokenizer.from_pretrained(model_path)
model = BertForSequenceClassification.from_pretrained(model_path)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
model.eval()

# Emotion labels
emotion_labels = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring",
    "confusion", "curiosity", "desire", "disappointment", "disapproval",
    "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief",
    "joy", "love", "nervousness", "optimism", "pride", "realization",
    "relief", "remorse", "sadness", "surprise"
]

def predict_emotion(text):
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)
    prediction = torch.argmax(outputs.logits, dim=1).item()
    return emotion_labels[prediction]
