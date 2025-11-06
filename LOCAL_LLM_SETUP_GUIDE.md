# Local LLM Setup Guide for LabSense

## Quick Setup (5 minutes)

### Step 1: Install Ollama

**Option A: Direct Download (Recommended)**
1. Visit: https://ollama.ai/download
2. Download the macOS app
3. Install and open the app

**Option B: Command Line Install**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Pull a Model

After Ollama is installed, pull the model we'll use:

```bash
ollama pull llama3.1:8b
```

This downloads ~4.7GB. Takes 2-5 minutes depending on your internet.

### Step 3: Start Ollama

**If you installed the app:**
- Just open the Ollama app from Applications
- It will run in the background

**If you installed via command line:**
```bash
ollama serve
```
Keep this terminal open, or run it as a background service.

### Step 4: Configure LabSense

Create or update your `.env` file in the project root:

```bash
cd /path/to/LabSense2
cat > .env << EOF
LABSENSE_LLM_URL=http://localhost:11434
LABSENSE_LLM_MODEL=llama3.1:8b
EOF
```

Or export in your shell:
```bash
export LABSENSE_LLM_URL="http://localhost:11434"
export LABSENSE_LLM_MODEL="llama3.1:8b"
```

### Step 5: Restart Backend

Restart your FastAPI backend so it picks up the environment variables.

### Step 6: Verify

Submit some code and check backend logs. You should see:
```
🔍 LLM Feedback available: ['feedback', 'strengths', 'improvements', 'scope_for_improvement']
```

Instead of generic fallback messages, you'll get detailed, code-specific feedback!

---

## Automated Setup Script

I've created a setup script for you. Run:

```bash
cd /path/to/LabSense2
./setup_local_llm.sh
```

This will guide you through the process step-by-step.

---

## Model Recommendations

| Model | Size | RAM Required | Quality | Speed |
|-------|------|--------------|---------|-------|
| **llama3.1:8b** ⭐ | 4.7GB | 8GB+ | Good | Fast |
| llama3.1:70b | 40GB | 48GB+ | Excellent | Slow |
| mistral:7b | 4.1GB | 8GB+ | Good | Fast |
| qwen2:7b | 4.4GB | 8GB+ | Good | Fast |

**Recommended for your Mac**: `llama3.1:8b` - good balance of quality and speed.

---

## Troubleshooting

### "Connection refused" error
- Make sure Ollama is running: `curl http://localhost:11434/api/tags`
- If not, start it: `ollama serve` or open the Ollama app

### "Model not found" error
- Pull the model: `ollama pull llama3.1:8b`
- Check available models: `ollama list`

### Slow responses
- The model runs on CPU by default
- First request may be slower (model loading)
- Subsequent requests are faster

### Backend not using LLM
- Check environment variables are set
- Restart backend server
- Check logs for LLM errors

---

## Testing the LLM

Test Ollama directly:
```bash
ollama run llama3.1:8b "What is Python?"
```

Test from backend (Python):
```python
import requests
response = requests.post('http://localhost:11434/api/generate', json={
    'model': 'llama3.1:8b',
    'prompt': 'Hello, test',
    'stream': False
})
print(response.json())
```

---

## Running Ollama in Background (Production)

For production, you might want Ollama to run as a service:

**macOS (using launchd):**
```bash
# Create plist file (optional - Ollama app handles this)
```

The Ollama macOS app automatically runs as a background service when installed via the .app installer.

---

## Next Steps

Once set up:
1. ✅ Ollama running
2. ✅ Model pulled
3. ✅ Environment variables set
4. ✅ Backend restarted

**Test it:** Submit code as a student and verify the feedback is detailed and specific (not generic fallback messages).

