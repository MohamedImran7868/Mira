import logging
import os
from transformers import pipeline
import torch
import json
from datetime import datetime
from typing import Dict, List, Optional
from llama_cpp import Llama

# Configure logging
logging_level = os.getenv("LOGGING_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, logging_level, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("MIRA")

class MIRA:
    """Emotion-aware chatbot using RoBERTa for emotion detection and LLaMA 3.2 for responses."""

    def __init__(self, model_name: str = "j-hartmann/emotion-english-distilroberta-base"):
        self.model_name = model_name
        self.device = 0 if torch.cuda.is_available() else -1
        self.responses = self._load_responses()
        self.conversation_history: List[Dict] = []

        # Load emotion classifier
        try:
            self.emotion_classifier = pipeline(
                "text-classification",
                model=self.model_name,
                device=self.device,
                top_k=None,
                function_to_apply="sigmoid",  # more stable multi-label scoring
                return_all_scores=True
            )
            logger.info(f"Emotion model '{model_name}' loaded successfully on {'GPU' if self.device == 0 else 'CPU'}.")
        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}", exc_info=True)
            print("MIRA: Unable to load emotion detection model.")
            exit(1)

        # Load LLaMA 3.2 model
        llama_model_path = r"C:\Users\Shadow\OneDrive\Documents\MIRA\Llama-3.2-3B-Instruct-Q4_K_M.gguf"
        
        try:
            self.llama = Llama(
                model_path=llama_model_path,
                n_ctx=2048,
                n_threads=8,
                n_batch=64,
                n_gpu_layers=40 if torch.cuda.is_available() else 0,
                verbose=False
            )
            logger.info("LLaMA 3.2 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load LLaMA 3.2 model: {e}", exc_info=True)
            self.llama = None

    def _load_responses(self) -> Dict[str, str]:
        return {
            "joy": "That's wonderful! 😊 What's making you happy today?",
            "sadness": "I'm here for you. 💙 Would you like to talk?",
            "anger": "It's okay to feel angry. Take a deep breath. 🌪️",
            "fear": "Fear can be tough. You're not alone. 🌟",
            "surprise": "Wow! Tell me more about what surprised you!",
            "disgust": "That sounds unpleasant. Want to talk about it?",
            "neutral": "I see. How can I support you today?",
            "mixed": "I sense you're feeling a mix of emotions. I'm here with you — care to share more?",
            "error": "I'm having trouble understanding. Could you rephrase that?"
        }

    def detect_emotions(self, text: str) -> List[Dict[str, float]]:
        if not isinstance(text, str) or not text.strip():
            logger.warning("Invalid input: Empty or non-string text.")
            return [{"emotion": "error", "confidence": 0.0}]

        try:
            results = self.emotion_classifier(text)
            if not results or not isinstance(results[0], list):
                logger.error(f"Unexpected model output: {results}")
                return [{"emotion": "error", "confidence": 0.0}]

            top_emotions = sorted(results[0], key=lambda x: x["score"], reverse=True)[:2]
            return [{"emotion": e["label"], "confidence": float(e["score"])} for e in top_emotions]
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}", exc_info=True)
            return [{"emotion": "error", "confidence": 0.0}]

    def generate_llama_response(self, user_input: str, emotion_summary: str = "") -> str:
        if not self.llama:
            return "Sorry, my generative brain isn't working right now."

        try:
            prompt = f"""<|start_header_id|>system<|end_header_id|>
You are MIRA, an emotionally intelligent and compassionate chatbot powered by LLaMA 3.2.
You detect the user's emotional state and respond with warmth, empathy, and kindness.
Current detected emotion(s): {emotion_summary}
<|eot_id|>
<|start_header_id|>user<|end_header_id|>
{user_input}
<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>"""

            output = self.llama(
                prompt,
                max_tokens=256,
                temperature=0.7,
                top_p=0.9,
                stop=["<|eot_id|>"]
            )

            return output["choices"][0]["text"].strip()
        except Exception as e:
            logger.error(f"LLaMA 3.2 response generation failed: {e}", exc_info=True)
            return "I'm having trouble responding right now."

    def log_conversation(self, user_input: str, response: Dict):
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user_input": user_input,
            "response": response
        })

    def save_conversation(self, filepath: Optional[str] = None):
        if not filepath:
            filepath = f"conversation_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filepath, "w") as f:
                json.dump(self.conversation_history, f, indent=2)
            logger.info(f"Conversation saved to {filepath}.")
        except Exception as e:
            logger.error(f"Failed to save conversation: {e}", exc_info=True)

    def chat(self):
        print("MIRA: Hi! I'm your mood-identifying assistant. Type 'quit' to exit.\n")

        while True:
            try:
                user_input = input("You: ").strip()

                if user_input.lower() in ["quit", "exit", "bye"]:
                    self.save_conversation()
                    print("\nMIRA: Goodbye! Take care. 💖")
                    break

                if not user_input:
                    print("MIRA: Please share how you're feeling.")
                    continue

                emotion_results = self.detect_emotions(user_input)
                emotion_summary = ", ".join([
                    f"{e['emotion']} ({e['confidence']:.0%})" for e in emotion_results
                ]) or "unclear"

                llama_response = self.generate_llama_response(user_input, emotion_summary)

                print(f"\nMIRA: I sense you're feeling {emotion_summary}.")
                print(f"MIRA: {llama_response}\n")

                self.log_conversation(user_input, {
                    "emotions_detected": emotion_results,
                    "bot_response": llama_response
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
