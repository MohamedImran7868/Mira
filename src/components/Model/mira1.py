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
    """Core emotion-detection chatbot using RoBERTa + LLaMA."""

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
                function_to_apply="sigmoid",
                return_all_scores=True
            )
            logger.info(f"Model '{model_name}' loaded successfully on {'GPU' if self.device == 0 else 'CPU'}.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            print("MIRA: Unable to load the model. Please check your setup.")
            exit(1)

        # Load LLaMA model
        # llama_model_path = "C:\\Users\\NITRO 5\\Desktop\\Project\\React\\Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
        try:
            self.llama = Llama.from_pretrained(
                repo_id="bartowski/Meta-Llama-3.1-8B-Instruct-GGUF",
                filename="Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
                n_ctx=1024,
                n_threads=6,
                n_batch=64,
                n_gpu_layers=35,
                verbose=False
            )
            logger.info("LLaMA model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load LLaMA model: {e}", exc_info=True)
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
            if not results or not isinstance(results, list) or not isinstance(results[0], list):
                logger.error(f"Unexpected model output format: {results}")
                return [{"emotion": "error", "confidence": 0.0}]

            all_scores = results[0]
            top_emotions = sorted(all_scores, key=lambda x: x["score"], reverse=True)[:2]

            strong_emotions = [
                {"emotion": emo["label"], "confidence": float(emo["score"])}
                for emo in top_emotions
            ]

            logger.info(f"Detected emotions: {strong_emotions}")
            return strong_emotions

        except Exception as e:
            logger.error(f"Emotion detection failed: {e}", exc_info=True)
            return [{"emotion": "error", "confidence": 0.0}]

    def generate_llama_response(self, user_input: str, emotion_summary: str = "") -> str:
        if not self.llama:
            return "Sorry, my generative brain isn't working right now."

        try:
            prompt = f"""You are MIRA, a friendly and emotionally intelligent chatbot.
The user seems to be feeling {emotion_summary}.
Respond kindly and empathetically to this input:

User: {user_input}
MIRA:"""

            output = self.llama(
                prompt,
                max_tokens=256,
                temperature=0.7,
                top_p=0.9,
                stop=["User:", "MIRA:"]
            )

            return output["choices"][0]["text"].strip()

        except Exception as e:
            logger.error(f"LLaMA response generation failed: {e}", exc_info=True)
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
                    f"{er['emotion']} ({er['confidence']:.0%})"
                    for er in emotion_results
                ])

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
