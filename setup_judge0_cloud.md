# Judge0 Cloud Setup

## 🚀 **Step 1: Get Free RapidAPI Key**

1. Go to: https://rapidapi.com/judge0-official/api/judge0-ce
2. Click "Subscribe to Test" (Free tier)
3. Sign up/login with your email
4. Copy your API key

## 🔧 **Step 2: Configure API Key**

Replace `your-rapidapi-key-here` in `app/evaluator/execute.py` with your actual key.

## 🎯 **Step 3: Start Backend**

```bash
cd /path/to/LabSense
source .venv/bin/activate
export LABSENSE_JUDGE0_URL="https://judge0-ce.p.rapidapi.com"
uvicorn app.main:app --reload
```

## ✅ **Supported Languages**

- Python (71)
- JavaScript (63) 
- Java (62)
- C (50)
- C++ (54)
- Go (60)

## 🔄 **Fallback**

If Judge0 Cloud fails, it automatically falls back to local Python execution.
