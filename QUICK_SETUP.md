# Quick Local LLM Setup (5 minutes)

## Step 1: Install Ollama App
1. I've opened the download page (or visit: https://ollama.ai/download)
2. Click "Download for macOS"
3. Open the downloaded `.dmg` file
4. Drag Ollama to your Applications folder
5. Open Ollama from Applications (it will install and start automatically)

## Step 2: Pull the Model
Once Ollama is running, open Terminal and run:

```bash
ollama pull llama3.1:8b
```

This downloads ~4.7GB (takes 2-5 minutes).

## Step 3: Configure LabSense

After the model is downloaded, set environment variables:

```bash
cd /Users/abhiramk01/LabSense2
export LABSENSE_LLM_URL="http://localhost:11434"
export LABSENSE_LLM_MODEL="llama3.1:8b"
```

To make this permanent, add to your `~/.zshrc`:
```bash
echo 'export LABSENSE_LLM_URL="http://localhost:11434"' >> ~/.zshrc
echo 'export LABSENSE_LLM_MODEL="llama3.1:8b"' >> ~/.zshrc
source ~/.zshrc
```

Or create a `.env` file in the project root:
```bash
cat > .env << EOF
LABSENSE_LLM_URL=http://localhost:11434
LABSENSE_LLM_MODEL=llama3.1:8b
EOF
```

## Step 4: Verify Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

Should return JSON with your models listed.

## Step 5: Test the Model

```bash
ollama run llama3.1:8b "Say hello in one word"
```

Should respond quickly.

## Step 6: Restart Backend

Restart your FastAPI backend server so it picks up the environment variables.

## Step 7: Test with LabSense

1. Submit code as a student
2. Check backend logs for: `🔍 LLM Feedback available`
3. View the submission - feedback should be detailed and specific!

---

## Troubleshooting

**"Command not found: ollama"**
- Make sure you've opened the Ollama app at least once after installation
- Or add it to PATH: `export PATH=$PATH:/Applications/Ollama.app/Contents/Resources`

**"Connection refused"**
- Open the Ollama app from Applications
- Or run: `ollama serve` in a terminal

**Backend still using fallback**
- Check environment variables are set: `echo $LABSENSE_LLM_URL`
- Restart backend completely
- Check backend logs for LLM errors

