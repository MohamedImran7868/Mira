import logging
from transformers import pipeline
import torch
import json
from datetime import datetime
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("MIRA")

class MIRA:
    """Core emotion-detection chatbot using RoBERTa."""
    
    def __init__(self, model_name: str = "SamLowe/roberta-base-go_emotions"):
        """
        Initialize MIRA with a pre-trained RoBERTa model.
        
        Args:
            model_name (str): Hugging Face model path.
        """
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.responses = self._load_responses()
        self.conversation_history: List[Dict] = []
        
        try:
            self.emotion_classifier = pipeline(
                "text-classification",
                model=self.model_name,
                device=self.device,
                top_k=1  # Only return the top emotion
            )
            logger.info(f"Model '{model_name}' loaded successfully on {self.device.upper()}.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            raise

    def _load_responses(self) -> Dict[str, str]:
        """Load predefined empathetic responses for emotions."""
        return {
            "joy": "That's wonderful! 😊 What's making you happy today?",
            "sadness": "I'm here for you. 💙 Would you like to talk?",
            "anger": "It's okay to feel angry. Take a deep breath. 🌪️",
            "fear": "Fear can be tough. You're not alone. 🌟",
            "surprise": "Wow! Tell me more about what surprised you!",
            "disgust": "That sounds unpleasant. Want to talk about it?",
            "neutral": "I see. How can I support you today?",
            "error": "I'm having trouble understanding. Could you rephrase that?"
        }

    def detect_emotion(self, text: str) -> Dict[str, float]:
        """
        Detect the dominant emotion from text.
        
        Args:
            text (str): User input text.
            
        Returns:
            Dict[str, float]: {"emotion": str, "confidence": float}
        """
        if not isinstance(text, str) or not text.strip():
            logger.warning("Invalid input: Empty or non-string text.")
            return {"emotion": "error", "confidence": 0.0}

        try:
            results = self.emotion_classifier(text)
            if not results or not isinstance(results, list):
                logger.error("Unexpected model output format.")
                return {"emotion": "error", "confidence": 0.0}

            # The pipeline with top_k=1 returns [{'label':..., 'score':...}]
            top_emotion = results[0]
            return {
                "emotion": top_emotion["label"],
                "confidence": float(top_emotion["score"])
            }
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}", exc_info=True)
            return {"emotion": "error", "confidence": 0.0}

    def generate_response(self, emotion: str) -> str:
        """
        Generate an empathetic response based on detected emotion.
        
        Args:
            emotion (str): Detected emotion label.
            
        Returns:
            str: Empathetic response.
        """
        return self.responses.get(emotion.lower(), self.responses["error"])

    def log_conversation(self, user_input: str, response: Dict):
        """Log conversation to history with timestamp."""
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user_input": user_input,
            "response": response
        })

    def save_conversation(self, filepath: str = "conversation_history.json"):
        """Save conversation history to a JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(self.conversation_history, f, indent=2)
            logger.info(f"Conversation saved to {filepath}.")
        except Exception as e:
            logger.error(f"Failed to save conversation: {e}")

    def chat(self):
        """Run an interactive chat session with MIRA."""
        print("MIRA: Hi! I'm your mood-identifying assistant. Type 'quit' to exit.\n")
        
        while True:
            try:
                user_input = input("You: ").strip()
                
                if user_input.lower() in ["quit", "exit"]:
                    self.save_conversation()
                    print("\nMIRA: Goodbye! Take care. 💖")
                    break
                
                if not user_input:
                    print("MIRA: Please share how you're feeling.")
                    continue
                
                # Detect emotion and respond
                emotion_result = self.detect_emotion(user_input)
                response = self.generate_response(emotion_result["emotion"])
                
                # Display results
                print(f"\nMIRA: I sense you're feeling {emotion_result['emotion']} "
                      f"(confidence: {emotion_result['confidence']:.0%}).")
                print(f"MIRA: {response}\n")
                
                # Log conversation
                self.log_conversation(user_input, {
                    "emotion": emotion_result["emotion"],
                    "confidence": emotion_result["confidence"],
                    "bot_response": response
                })
                
            except KeyboardInterrupt:
                self.save_conversation()
                print("\nMIRA: Session interrupted. Goodbye!")
                break
            except Exception as e:
                logger.error(f"Unexpected error: {e}", exc_info=True)
                print("MIRA: Sorry, I encountered an error. Please try again.")

if __name__ == "__main__":
    try:
        mira = MIRA()
        mira.chat()
    except Exception as e:
        logger.critical(f"Failed to initialize MIRA: {e}", exc_info=True)
        print("Critical error occurred. Check logs for details.")