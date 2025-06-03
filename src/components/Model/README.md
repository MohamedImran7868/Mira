# MIRA: Emotion-Aware Chatbot

MIRA is a conversational AI assistant that uses a RoBERTa-based emotion classifier and a local LLaMA language model to deliver emotionally intelligent responses.

## Features

- Detects emotions in user input using RoBERTa
- Generates empathetic and context-aware responses using LLaMA
- Logs and saves conversation history
- Runs fully offline (if models are downloaded)

## Requirements

- Python 3.8+
- GPU (optional but recommended for performance)
- Install dependencies from `requirements.txt`

## Setup

1. Clone this repository or copy the script.
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Place your `.gguf` LLaMA model file (e.g., `Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf`) in the appropriate path and update `model_path` in the script accordingly.

## Usage

Run the chatbot from terminal:

```bash
python mira_chatbot.py
```

Type messages and receive emotionally intelligent responses. Type `quit` to exit.

## Notes

- The RoBERTa model used is: `j-hartmann/emotion-english-distilroberta-base`
- The LLaMA model must be in `.gguf` format for use with `llama-cpp-python`
- LLaMA response generation may take time on CPU; GPU acceleration improves speed

## Author

Developed by [MUHAMMAD ZAHIN ADRI BIN MOHD NAWAWI]
