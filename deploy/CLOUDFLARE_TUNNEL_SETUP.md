# Cloudflare Tunnel Setup - Quick Commands

## 1. Start Backend

```bash
cd /Users/abhiramk01/LabSense2
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Keep this terminal running.

## 2. Start Cloudflare Tunnel

Open a **new terminal** and run:

```bash
npx cloudflared tunnel --url http://localhost:8000
```

Copy the URL shown (e.g., `https://random-name-1234.trycloudflare.com`)

## 3. Extract Tunnel URL (Alternative Method)

If you need to extract the URL from logs:

```bash
# Start tunnel in background
npx cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &

# Wait a few seconds, then extract URL
sleep 5
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | head -1
```

Or use the helper script:

```bash
./update_tunnel_url.sh
```

## 4. Update Frontend Environment Variable

1. Go to Cloudflare Dashboard → **Workers & Pages** → Your app → **Settings** → **Environment variables**
2. Add/Update:
   - **Name:** `VITE_API_BASE`
   - **Value:** `https://your-tunnel-url.trycloudflare.com/api` (must end with `/api`)
3. Click **Save** → **Deployments** → **Retry deployment**

## 5. Update Backend CORS

Edit `app/main.py` and add your Cloudflare Pages URL:

```python
allow_origins=[
    "https://your-app-name.pages.dev",  # Add your Pages URL here
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
],
```

Restart backend after updating.

---

## Running in Background

### Start Both Services

```bash
# Backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Tunnel
nohup npx cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
```

### Check Status

```bash
# Check if running
ps aux | grep uvicorn | grep -v grep
ps aux | grep cloudflared | grep -v grep

# View logs
tail -f backend.log
tail -f tunnel.log
```

### Stop Services

```bash
pkill -f "uvicorn app.main:app"
pkill -f "cloudflared tunnel"
```

---

## Extract Tunnel URL from Logs

```bash
# From tunnel.log
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | head -1

# Or check the log file
cat tunnel.log | grep trycloudflare
```

---

## Quick Reference

- **Backend:** `http://localhost:8000`
- **Tunnel URL:** Changes each time you restart (check logs)
- **Frontend:** `https://your-app-name.pages.dev` (set in Cloudflare Pages)
- **API Base:** `https://tunnel-url.trycloudflare.com/api` (set in Cloudflare Pages env vars)

---

## Troubleshooting

- **Backend not running:** Check with `curl http://localhost:8000/health`
- **Tunnel not running:** Check with `ps aux | grep cloudflared`
- **Can't find URL:** Check `tunnel.log` or run tunnel in foreground to see URL
- **CORS error:** Make sure Cloudflare Pages URL is in `app/main.py` CORS origins
