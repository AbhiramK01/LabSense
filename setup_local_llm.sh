#!/bin/bash

# Setup script for Local LLM (Ollama) with LabSense

set -e

echo "🚀 Setting up Local LLM for LabSense..."
echo ""

# Check if Ollama is installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is already installed!"
    ollama --version
else
    echo "📥 Installing Ollama..."
    echo ""
    echo "Please download and install Ollama from: https://ollama.ai/download"
    echo "Or use the direct download:"
    echo "  macOS: curl -fsSL https://ollama.ai/install.sh | sh"
    echo ""
    read -p "Press Enter after you've installed Ollama, or Ctrl+C to cancel..."
fi

# Check if Ollama is running
echo ""
echo "🔍 Checking if Ollama is running..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running!"
else
    echo "⚠️  Ollama is not running. Starting Ollama..."
    echo "Please run 'ollama serve' in a separate terminal, or"
    echo "if you installed via the app, make sure it's running."
    echo ""
    read -p "Press Enter after Ollama is running, or Ctrl+C to cancel..."
fi

# Pull the model
echo ""
echo "📦 Pulling Llama 3.1 8B model (this may take a few minutes)..."
ollama pull llama3.1:8b

# Verify the model
echo ""
echo "🔍 Verifying model installation..."
ollama list

# Set environment variables
echo ""
echo "📝 Setting up environment variables..."
export LABSENSE_LLM_URL="http://localhost:11434"
export LABSENSE_LLM_MODEL="llama3.1:8b"

# Create .env file or update existing one
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    # Update existing .env
    if grep -q "LABSENSE_LLM_URL" "$ENV_FILE"; then
        sed -i '' 's|LABSENSE_LLM_URL=.*|LABSENSE_LLM_URL=http://localhost:11434|' "$ENV_FILE"
    else
        echo "LABSENSE_LLM_URL=http://localhost:11434" >> "$ENV_FILE"
    fi
    
    if grep -q "LABSENSE_LLM_MODEL" "$ENV_FILE"; then
        sed -i '' 's|LABSENSE_LLM_MODEL=.*|LABSENSE_LLM_MODEL=llama3.1:8b|' "$ENV_FILE"
    else
        echo "LABSENSE_LLM_MODEL=llama3.1:8b" >> "$ENV_FILE"
    fi
    echo "✅ Updated $ENV_FILE"
else
    cat > "$ENV_FILE" << EOF
LABSENSE_LLM_URL=http://localhost:11434
LABSENSE_LLM_MODEL=llama3.1:8b
EOF
    echo "✅ Created $ENV_FILE"
fi

# Test the connection
echo ""
echo "🧪 Testing LLM connection..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:11434/api/generate -d '{"model":"llama3.1:8b","prompt":"test","stream":false}' 2>&1 || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q "error"; then
    echo "⚠️  Connection test failed. Make sure Ollama is running."
else
    echo "✅ LLM connection successful!"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Ollama is running: 'ollama serve' (or use the Ollama app)"
echo "2. Restart your LabSense backend server"
echo "3. The backend will automatically use the local LLM"
echo ""
echo "To verify it's working, check backend logs for:"
echo "  🔍 LLM Feedback available: ['feedback', 'strengths', ...]"
echo ""

