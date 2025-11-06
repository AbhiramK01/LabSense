# How to Verify LLM Status

## Quick Check

The feedback you're seeing is the **fallback feedback**, which means the LLM is NOT being called.

### To check if LLM is working:

1. **Look for these log messages in your backend terminal:**
   - ❌ `LLM effort evaluation failed:` = LLM call failed
   - ❌ `LLM logic similarity evaluation failed:` = LLM call failed  
   - ❌ `LLM feedback generation failed:` = LLM call failed
   - ✅ `🔍 LLM Feedback available: ['feedback', 'strengths', ...]` = LLM working!

2. **Check environment variables:**
   ```bash
   echo $OPENAI_API_KEY
   echo $ANTHROPIC_API_KEY
   echo $LABSENSE_LLM_URL
   ```

3. **Real LLM feedback will:**
   - Be more detailed and specific
   - Reference the actual code/problem
   - Provide concrete suggestions
   - Vary based on the submission

## Current Fallback Feedback (What you're seeing)

The generic messages like:
- "Code was submitted and evaluated successfully"
- "Consider reviewing the solution approach"
- "Review code quality, algorithm efficiency"

These are **placeholder messages** that appear when no LLM is available.

## Setup LLM

### Option 1: OpenAI API (Fastest)
```bash
export OPENAI_API_KEY="sk-your-key-here"
pip install openai
```

### Option 2: Local Ollama (Your Preference)
```bash
# Install Ollama first
ollama pull llama3.1:8b

# Set environment variables
export LABSENSE_LLM_URL="http://localhost:11434"
export LABSENSE_LLM_MODEL="llama3.1:8b"

# Make sure Ollama is running
ollama serve
```

### Option 3: Anthropic Claude
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
pip install anthropic
```

## After Setup

1. Restart your backend server
2. Submit code again
3. Check logs - you should see LLM calls instead of fallback messages
4. Feedback should be more detailed and specific

