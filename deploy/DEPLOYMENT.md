# Zero-Cost Deployment (Oracle Cloud Always Free)

This guide deploys your app (FastAPI + React + Nginx) on an Oracle Always Free VM using Docker Compose.

## 1) Provision a Free VM
- Create an Oracle Cloud account (Always Free).
- Launch a small VM (Ubuntu 22.04 recommended).
- Get the public IP and SSH into it:

```bash
ssh ubuntu@YOUR_VM_IP
```

## 2) Install Docker and Compose
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in (or run: newgrp docker)
```

## 3) Prepare directories for TLS
```bash
sudo apt update && sudo apt -y install certbot
sudo mkdir -p /var/www/certbot
```

## 4) Get the code on the VM
```bash
git clone https://github.com/YOUR_USER/LabSense2.git
cd LabSense2
```

## 5) Configure environment
- Copy `deploy/env.example` to project root as `.env` and edit values:

```bash
cp deploy/env.example .env
nano .env
```
- Set `VITE_API_BASE` to `https://YOUR_DOMAIN/api` (or use the VM IP temporarily with http).
- Set `CORS_ORIGINS` to your site origin(s).
- Set `JWT_SECRET` and any API keys.

## 6) Start the stack (HTTP only for now)
```bash
docker compose up -d --build
```
- API runs internally at `labsense-api:8000`.
- Frontend served internally by `labsense-frontend`.
- Nginx exposes port 80 and 443.

## 7) Point DNS to your VM
- Create an `A` record for your domain (or use a free subdomain like DuckDNS) → point to your VM IP.

## 8) Issue TLS certificates (Let’s Encrypt)
- Ensure port 80 is open in Oracle security list and VM firewall.
- Run:

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

- Edit `deploy/nginx.conf` and replace `your-domain.com` with your real domain.
- Restart Nginx container:

```bash
docker compose restart nginx
```

## 9) Verify
- Visit `https://YOUR_DOMAIN` → React app should load.
- API should respond at `https://YOUR_DOMAIN/api/docs` (FastAPI docs).

## 10) Persistence & Backups
- App data (JSON) persists via bind mount: `./data:/app/data`.
- Back up periodically:

```bash
tar czf labsense-data-$(date +%F).tar.gz data/
```

## 11) Updates / Redeploy
```bash
git pull
docker compose up -d --build
```

## Ports & Security
- Only ports 80 and 443 are exposed. Uvicorn port is internal.
- Always keep secrets in `.env` (not committed).

---
If you need a one-liner script to automate steps 2–6, we can add it.



