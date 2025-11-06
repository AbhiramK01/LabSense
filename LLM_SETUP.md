# LLM Setup Guide for LabSense Evaluation System

## Quick Start

The new evaluation system uses LLMs for effort scoring, logic similarity, and feedback generation. You can use either:

1. **API-based** (OpenAI/Anthropic) - Fast setup, requires API keys
2. **Local LLM** (Ollama) - Free, requires local setup

## Option 1: API-based (Recommended for Quick Start)

### OpenAI
```bash
export OPENAI_API_KEY="your-api-key-here"
export OPENAI_MODEL="gpt-4o-mini"  # Optional, defaults to gpt-4o-mini
```

Install package:
```bash
pip install openai>=1.0.0
```

### Anthropic (Claude)
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"  # Optional
```

Install package:
```bash
pip install anthropic>=0.18.0
```

## Option 2: Local LLM (Recommended for Production)

### Setup Ollama

1. **Install Ollama**: https://ollama.ai/download

2. **Pull a model** (recommended: Llama 3.1 8B):
```bash
ollama pull llama3.1:8b
```

3. **Set environment variables**:
```bash
export LABSENSE_LLM_URL="http://localhost:11434"
export LABSENSE_LLM_MODEL="llama3.1:8b"
```

4. **Start Ollama** (if not running as service):
```bash
ollama serve
```

### Other Local Options

- **vLLM**: For GPU-accelerated inference (requires NVIDIA GPU)
- **llama.cpp**: For CPU inference (cross-platform)

## Verification

Test the setup by running a submission. Check logs for:
```
🔍 LLM Feedback available: ['feedback', 'strengths', 'improvements', 'scope_for_improvement']
```

If LLM is unavailable, the system falls back to heuristic evaluation.

## Troubleshooting

- **No LLM response**: Check API keys or Ollama URL
- **Slow evaluation**: Local LLM may be slower, consider API
- **Fallback to heuristic**: LLM failed, check logs for errors

## Cost Comparison

- **OpenAI GPT-4o-mini**: ~$0.001 per evaluation (~$0.30 for 100 students × 3 questions)
- **Local Ollama**: Free (after setup), requires hardware (8GB+ RAM recommended)

