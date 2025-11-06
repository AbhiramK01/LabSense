# Cloudflare Pages + Tunnel Deployment

Free deployment solution: Frontend on Cloudflare Pages (always online) + Backend via Cloudflare Tunnel from your computer.

---

## Prerequisites

- GitHub account
- Cloudflare account (free, no credit card)
- Python 3.9+ and Node.js 18+ installed locally
- Backend runs on your computer (must be online for backend to work)

---

## Part 1: Deploy Frontend to Cloudflare Pages

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/AbhiramK01/LabSense.git
git push -u origin main
```

### Step 2: Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Connect GitHub → Select `LabSense` repository
3. Configure build settings:
   - **Framework preset:** Vite
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Build output directory:** `frontend/dist`
   - **Root directory:** `/`
   - **Node version:** 18 or higher
   - **Environment variables:**
     - **Name:** `NPM_FLAGS`
     - **Value:** `--include=optional`
4. Click **Save and Deploy**

**Result:** `https://your-app-name.pages.dev` (always online)

> **Example:** For this project, the frontend is deployed at: `https://labsense-8jr.pages.dev`

> **Note:** The `NPM_FLAGS=--include=optional` environment variable ensures optional dependencies (like Rollup platform-specific packages) are installed, preventing build errors on Cloudflare Pages.

---

## Part 2: Expose Backend via Cloudflare Tunnel

### Step 3: Install Cloudflare Tunnel

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Or download from: https://github.com/cloudflare/cloudflared/releases
```

### Step 4: Start Backend and Tunnel

**Option A: Use Helper Scripts (Recommended)**

```bash
# Start everything (backend + tunnel)
./start_all.sh

# Stop everything
./stop_all.sh
```

The script will:
- Start backend server in background
- Start Cloudflare tunnel in background
- Automatically extract tunnel URL with `/api` appended
- Display direct link to Cloudflare Pages settings

**Option B: Manual Start**

```bash
# Terminal 1: Start backend
cd /Users/abhiramk01/LabSense2
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start tunnel
npx cloudflared tunnel --url http://localhost:8000
```

Copy the tunnel URL shown (e.g., `https://random-name-1234.trycloudflare.com`)

> **Important:** Quick tunnels generate a new URL on each restart. Use `./start_all.sh` to automatically extract the URL.

---

## Part 3: Connect Frontend to Backend

### Step 5: Configure Frontend Environment Variable

1. Go to Cloudflare Dashboard → **Workers & Pages** → Your app → **Settings** → **Environment variables**
2. Add/Update variable:
   - **Name:** `VITE_API_BASE`
   - **Value:** `https://your-tunnel-url.trycloudflare.com/api` (must end with `/api`)
3. Click **Save** → **Deployments** → **Retry deployment**

### Step 6: Update Backend CORS

Edit `app/main.py` and add your Cloudflare Pages URL to allowed origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app-name.pages.dev",  # Add your Cloudflare Pages URL here
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart backend after updating.

---

## Part 4: Running in Background

### Using Helper Scripts

```bash
# Start everything in background
./start_all.sh

# Stop everything
./stop_all.sh
```

### Manual Background Execution

```bash
# Backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Tunnel
nohup npx cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
```

### Process Management

```bash
# Check if running
ps aux | grep uvicorn | grep -v grep
ps aux | grep cloudflared | grep -v grep

# View logs
tail -f backend.log
tail -f tunnel.log

# Stop processes
pkill -f "uvicorn app.main:app"
pkill -f "cloudflared tunnel"
```

### Important Notes

- **Shutdown/Reboot:** Processes stop and must be restarted manually
- **Sleep:** Processes pause and resume automatically
- **Tunnel URL:** Changes on each restart with quick tunnels (use `./start_all.sh` to auto-extract)

---

## Part 5: Extract Tunnel URL

### Using Helper Script

```bash
./update_tunnel_url.sh
```

### Manual Extraction

```bash
# From tunnel.log
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | head -1

# Or check the log file
cat tunnel.log | grep trycloudflare
```

---

## Troubleshooting

### Frontend Can't Reach API

1. **Tunnel URL changed:** Run `./start_all.sh` to get new URL, update `VITE_API_BASE` in Cloudflare Pages
2. **Backend not running:** Verify with `curl http://localhost:8000/health`
3. **Tunnel not running:** Check with `ps aux | grep cloudflared`
4. **CORS error:** Ensure Cloudflare Pages URL is in `allow_origins` in `app/main.py`

### Build Errors

- **Rollup error:** Use build command: `cd frontend && rm -rf node_modules package-lock.json && npm install && npm run build`
- **TypeScript errors:** Fix type annotations in source files

### Tunnel Issues

- **URL changes on restart:** Use `./start_all.sh` to automatically extract new URL
- **Connection refused:** Ensure backend is running on port 8000
- **Can't find URL:** Check `tunnel.log` or wait longer (tunnel may take 10-30 seconds to start)

---

## Quick Reference

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | `https://your-app-name.pages.dev` | Always online, deployed on Cloudflare Pages |
| **Backend** | `http://localhost:8000` | Runs on your computer |
| **Tunnel** | `https://random-url.trycloudflare.com` | Changes on restart |
| **API Base** | `https://tunnel-url.trycloudflare.com/api` | Set in Cloudflare Pages env vars |

### Quick Commands

```bash
# Start everything
./start_all.sh

# Stop everything
./stop_all.sh

# Extract tunnel URL
./update_tunnel_url.sh

# View logs
tail -f backend.log
tail -f tunnel.log
```

---

## Summary

- **Frontend:** `https://your-app-name.pages.dev` (always online, free)
- **Backend:** `https://tunnel-url.trycloudflare.com` (when computer is on)
- **Cost:** $0
- **Credit Card:** Not required
- **Setup Time:** ~15 minutes

Your application is now live and accessible worldwide.
