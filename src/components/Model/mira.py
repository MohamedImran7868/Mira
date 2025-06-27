import logging
import os
from transformers import pipeline
import torch
import json
from datetime import datetime
from typing import Dict, List, Generator
from llama_cpp import Llama
import time
from collections import Counter

# Configure logging
logging_level = os.getenv("LOGGING_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, logging_level, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("MIRA")

class MIRA:
    """Emotion-aware chatbot using RoBERTa for emotion detection and LLaMA 3.2 for streaming responses."""

    def __init__(self, model_name: str = "j-hartmann/emotion-english-distilroberta-base"):
        self.model_name = model_name
        self.device = 0 if torch.cuda.is_available() else -1
        self.responses = self._load_responses()
        self.conversation_history: List[Dict] = []
        self.recent_emotions: List[str] = []
        self.recent_context: List[Dict[str, str]] = []
        self.personality: str = "friendly"  # Default personality

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
            logger.info(f"Emotion model '{model_name}' loaded successfully on {'GPU' if self.device == 0 else 'CPU'}.")
        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}", exc_info=True)
            print("MIRA: Unable to load emotion detection model.")
            exit(1)

        # Load LLaMA 3.2 model
        try:
            self.llama = Llama.from_pretrained(
                repo_id="bartowski/Llama-3.2-3B-Instruct-GGUF",
                filename="Llama-3.2-3B-Instruct-Q4_K_M.gguf",
                n_ctx=2048,
                n_threads=6,
                n_batch=64,
                n_gpu_layers=40 if torch.cuda.is_available() else 0,
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
            if not results or not isinstance(results[0], list):
                logger.error(f"Unexpected model output: {results}")
                return [{"emotion": "error", "confidence": 0.0}]

            top_emotions = sorted(results[0], key=lambda x: x["score"], reverse=True)[:2]
            return [{"emotion": e["label"], "confidence": float(e["score"])} for e in top_emotions]
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}", exc_info=True)
            return [{"emotion": "error", "confidence": 0.0}]

    def generate_llama_response_stream(self, user_input: str, emotion_summary: str = "") -> Generator[Dict[str, str], None, None]:
        """Streaming response generator."""
        if not self.llama:
            yield {"chunk": "Sorry, my generative brain isn't working right now.", "done": True}
            return

        dominant_emotion = self.recent_emotions[-1] if self.recent_emotions else "neutral"
        temp = {
            "sadness": 0.6,
            "fear": 0.6,
            "joy": 0.9,
            "anger": 0.9,
            "neutral": 0.75
        }.get(dominant_emotion, 0.75)

        tone_instruction = "Use a cheerful and casual tone."  # Always friendly

        context_block = ""
        for turn in self.recent_context[-3:]:
            context_block += f"<|start_header_id|>user<|end_header_id|>\n{turn['user']}\n<|eot_id|>\n"
            context_block += f"<|start_header_id|>assistant<|end_header_id|>\n{turn['bot']}\n<|eot_id|>\n"

        prompt = f"""<|start_header_id|>system<|end_header_id|>
                    You are MIRA, an emotionally intelligent chatbot powered by LLaMA 3.2.
                    {tone_instruction}
                    User emotion summary: {emotion_summary}
                    <|eot_id|>
                    {context_block}<|start_header_id|>user<|end_header_id|>
                    {user_input}
                    <|eot_id|>
                    <|start_header_id|>assistant<|end_header_id|>"""

        try:
            stream = self.llama.create_completion(
                prompt,
                max_tokens=256,
                temperature=temp,
                top_p=0.9,
                stop=["<|eot_id|>"],
                stream=True
            )

            full_response = ""
            for output in stream:
                chunk = output["choices"][0]["text"]
                full_response += chunk
                yield {"chunk": chunk, "done": False}

            yield {"chunk": "", "done": True}

        except Exception as e:
            logger.error(f"LLaMA 3.2 streaming response failed: {e}", exc_info=True)
            yield {"chunk": "I'm having trouble responding right now.", "done": True}

    def log_conversation(self, user_input: str, response: Dict, bot_reply: str):
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user_input": user_input,
            "response": response,
            "bot_reply": bot_reply
        })

        emotions = [e['emotion'] for e in response.get("emotions_detected", [])]
        self.recent_emotions.extend(emotions)
        self.recent_emotions = self.recent_emotions[-5:]
        self.recent_context.append({"user": user_input, "bot": bot_reply})
        self.recent_context = self.recent_context[-3:]

    def save_conversation(self, folder: str = "conversations"):
        os.makedirs(folder, exist_ok=True)
        if self.recent_emotions:
            dominant = Counter(self.recent_emotions).most_common(1)[0][0]
            self.conversation_history.append({
                "tag": "session_dominant_emotion",
                "value": dominant
            })

        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
        timestamped_path = os.path.join(folder, f"conversation_{timestamp}.json")
        latest_path = os.path.join(folder, "conversation_latest.json")

        try:
            with open(timestamped_path, "w") as f:
                json.dump(self.conversation_history, f, indent=2)
            with open(latest_path, "w") as f:
                json.dump(self.conversation_history, f, indent=2)

            logger.info(f"Conversations saved to {timestamped_path} and {latest_path}.")
        except Exception as e:
            logger.error(f"Failed to save conversation: {e}", exc_info=True)

    def chat(self, use_streaming: bool = True):
        print(f"\nMIRA (Friendly Mode): Hi! I'm your mood-identifying assistant. Type 'quit' to exit.\n")
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

                t0 = time.time()
                emotion_results = self.detect_emotions(user_input)
                t1 = time.time()
                emotion_summary = ", ".join([
                    f"{e['emotion']} ({e['confidence']:.0%})" for e in emotion_results
                ]) or "unclear"

                print(f"\nMIRA: I sense you're feeling {emotion_summary}.")
                print("MIRA: ", end="", flush=True)
                full_response = ""
                t2 = time.time()
                for chunk in self.generate_llama_response_stream(user_input, emotion_summary):
                    print(chunk["chunk"], end="", flush=True)
                    full_response += chunk["chunk"]
                    if chunk["done"]:
                        print("\n")
                t3 = time.time()
                logger.info(f"Emotion detection: {t1 - t0:.2f}s, LLaMA streaming: {t3 - t2:.2f}s")
                self.log_conversation(user_input, {"emotions_detected": emotion_results}, full_response)

                self.save_conversation()

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
        mira.chat(use_streaming=True)
    except Exception as e:
        logger.critical(f"Failed to initialize MIRA: {e}", exc_info=True)
        print("Critical error occurred. Check logs for details.")
