# Free Deployment: Cloudflare Pages + Tunnel (No Credit Card!)

This is the **best free option** for students:
- ✅ Frontend: Always online (Cloudflare Pages)
- ✅ Backend: Free tunnel from your computer
- ✅ No credit card needed
- ✅ Professional URLs

---

## Part 1: Frontend on Cloudflare Pages (Always Online)

### Step 1: Push your code to GitHub
```bash
# If not already on GitHub:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/LabSense2.git
git push -u origin main
```

### Step 2: Deploy to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Sign up (free, no card)
2. Click **"Workers & Pages"** → **"Create application"** → **"Pages"** → **"Connect to Git"**
3. Connect your GitHub account → Select `LabSense2` repo
4. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `cd frontend && npm run build`
   - **Build output directory:** `frontend/dist`
   - **Root directory:** `/` (leave empty or set to root)
5. Click **"Save and Deploy"**

**You'll get:** `https://your-app-name.pages.dev` (always online!)

---

## Part 2: Backend via Cloudflare Tunnel (From Your Computer)

### Step 3: Install Cloudflare Tunnel
```bash
# Mac:
brew install cloudflare/cloudflare/cloudflared

# Or download from: https://github.com/cloudflare/cloudflared/releases
```

### Step 4: Start your backend locally
```bash
cd /Users/abhiramk01/LabSense2
# Make sure you have a virtual environment activated
source venv/bin/activate  # or: python -m venv venv && source venv/bin/activate
pip install -r app/requirements.txt

# Start FastAPI
cd app
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Keep this terminal open!** Your backend is now running at `http://localhost:8000`

### Step 5: Create a tunnel (quick method - random URL)
Open a **new terminal** and run:
```bash
npx cloudflared tunnel --url http://localhost:8000
```

You'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://random-name-1234.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
```

**Copy that URL!** (e.g., `https://random-name-1234.trycloudflare.com`)

---

## Part 6: Connect Frontend to Backend

### Step 6: Update Cloudflare Pages environment variable
1. Go back to Cloudflare Dashboard → **Workers & Pages** → Your app
2. Click **"Settings"** → **"Environment variables"**
3. Add:
   - **Variable name:** `VITE_API_BASE`
   - **Value:** `https://random-name-1234.trycloudflare.com/api` (your tunnel URL + `/api`)
4. Click **"Save"**
5. Go to **"Deployments"** → Click **"Retry deployment"** (or push a new commit)

### Step 7: Update backend CORS (optional but recommended)
Edit `app/main.py`:
```python
# Replace line 20:
allow_origins=["*"],  # Change this to:
allow_origins=[
    "https://your-app-name.pages.dev",  # Your Cloudflare Pages URL
    "http://localhost:5173",  # Keep for local dev
    "http://localhost:3000",  # Keep for local dev
],
```

Restart your backend (Ctrl+C, then run `uvicorn` again).

---

## Part 8: Test Everything

1. **Frontend:** Visit `https://your-app-name.pages.dev` → Should load!
2. **API:** Visit `https://random-name-1234.trycloudflare.com/api/docs` → Should show FastAPI docs!
3. **Login:** Try logging in from the frontend → Should work!

---

## Part 9: Keep It Running

### To keep backend online:
- **Keep the terminal with `uvicorn` running** (backend)
- **Keep the terminal with `cloudflared tunnel` running** (tunnel)

### Or run in background (Mac/Linux):
```bash
# Backend:
cd app && nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Tunnel:
nohup npx cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
```

### To stop:
```bash
# Find processes:
ps aux | grep uvicorn
ps aux | grep cloudflared

# Kill them:
kill <PID>
```

---

## Optional: Custom Domain (Pretty URL)

If you own a domain (or get a free one):

1. **Add domain to Cloudflare:**
   - Cloudflare Dashboard → **"Websites"** → **"Add a site"**
   - Add your domain → Follow DNS setup

2. **Point Pages to custom domain:**
   - Pages → Your app → **"Custom domains"** → Add `app.yourdomain.com`

3. **Create named tunnel for backend:**
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create labsense-api
   cloudflared tunnel route dns labsense-api api.yourdomain.com
   ```
   
4. **Create config file:** `~/.cloudflared/config.yml`
   ```yaml
   tunnel: labsense-api
   credentials-file: /Users/youruser/.cloudflared/<tunnel-id>.json
   
   ingress:
     - hostname: api.yourdomain.com
       service: http://localhost:8000
     - service: http_status:404
   ```

5. **Run tunnel:**
   ```bash
   cloudflared tunnel run labsense-api
   ```

6. **Update Pages env var:** `VITE_API_BASE=https://api.yourdomain.com/api`

---

## Troubleshooting

**Frontend can't reach API:**
- Check tunnel is running: `ps aux | grep cloudflared`
- Check backend is running: `curl http://localhost:8000/health`
- Check CORS allows your Pages URL

**Tunnel URL changes every time:**
- Use the "named tunnel" method (Part 9) for a permanent URL

**Backend stops when you close terminal:**
- Use `nohup` or run as a service (see Part 9)

---

## Summary

✅ **Frontend:** `https://your-app-name.pages.dev` (always online)  
✅ **Backend:** `https://random-name.trycloudflare.com` (when your computer is on)  
✅ **Cost:** $0  
✅ **Credit card:** Not needed!

Your app is live! 🎉


