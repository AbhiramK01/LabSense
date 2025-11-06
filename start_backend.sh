#!/bin/bash
# Start LabSense backend with LLM environment variables

cd "$(dirname "$0")"

# Activate virtual environment
source .venv/bin/activate

# Set LLM environment variables
export LABSENSE_LLM_URL="http://localhost:11434"
export LABSENSE_LLM_MODEL="llama3.1:8b"

# Verify Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Warning: Ollama is not running!"
    echo "Please start Ollama first:"
    echo "  - Open the Ollama app, or"
    echo "  - Run: ollama serve"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to cancel..."
fi

echo "🚀 Starting LabSense backend with Local LLM..."
echo "   LLM URL: $LABSENSE_LLM_URL"
echo "   Model: $LABSENSE_LLM_MODEL"
echo ""

# Start the backend (adjust this to your actual start command)
# Example: uvicorn app.main:app --reload
# Replace with your actual command:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

