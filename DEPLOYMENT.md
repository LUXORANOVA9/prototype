# Luxor9 Ai Factory — Deployment Guide

## Open-Source Cloud Solutions (Free, Self-Hosted)

### Option 1: Coolify (RECOMMENDED)
**Best for:** Full PaaS experience, Git-based deploys, auto SSL, one-click databases

```bash
# Install Coolify on your server (one command)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Then in Coolify dashboard:
# 1. New Resource → Docker Compose
# 2. Paste docker-compose.coolify.yml
# 3. Set API_KEY and JWT_SECRET
# 4. Click Deploy
```

**Features:**
- Free & open-source (Apache 2.0)
- Auto SSL with Let's Encrypt
- Git integration (auto-deploy on push)
- Built-in database management
- Server monitoring
- Team collaboration
- 51.8k GitHub stars

**Website:** https://coolify.io

---

### Option 2: CapRover
**Best for:** Simple Docker deployments, one-click apps

```bash
# Install CapRover on your server
docker run -p 80:80 -p 443:443 -p 3000:3000 -d --cap-add NET_ADMIN \
  --name caprover caprover/caprover

# Then deploy:
caprover login
caprover deploy
```

**Features:**
- Free & open-source (Apache 2.0)
- One-click app templates
- Auto SSL
- Docker-based
- Web dashboard

**Website:** https://caprover.com

---

### Option 3: Dokku
**Best for:** Heroku-like git push deployments

```bash
# Install Dokku
wget https://raw.githubusercontent.com/dokku/dokku/v0.34.8/bootstrap.sh
sudo DOKKU_TAG=v0.34.8 bash bootstrap.sh

# Create app and deploy
dokku apps:create luxor9
git remote add dokku dokku@your-server:luxor9
git push dokku main
```

**Features:**
- Free & open-source (MIT)
- Heroku buildpack compatible
- Plugin ecosystem
- Git-based deployment

**Website:** https://dokku.com

---

### Option 4: Docker Compose (Any VPS)
**Best for:** Simplest setup, works anywhere

```bash
# On any server with Docker:
docker-compose -f docker-compose.coolify.yml up -d

# Frontend: http://your-server:3000
# API:      http://your-server:8080
```

---

### Option 5: Manual VPS Setup
**Best for:** Full control, no Docker overhead

```bash
# Run the deploy script
bash deploy.sh
# Select option 3 (Manual VPS)
```

---

## Quick Start

### 1. Deploy Backend

Pick any option above. For the fastest setup:

```bash
# Option A: Coolify (recommended)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Option B: Docker (simplest)
docker-compose -f docker-compose.coolify.yml up -d
```

### 2. Set Environment Variables

```bash
# Required for AI features
API_KEY=your-gemini-api-key

# Auto-generated or set manually
JWT_SECRET=your-secure-secret
```

### 3. Deploy Frontend

The frontend auto-connects to the backend via:
- Same-origin `/api` paths (when behind reverse proxy)
- `http://localhost:8080` (local development)
- Runtime config via `window.__LUXOR9_API_URL`

### 4. Seed Demo Data (Optional)

```bash
cd service
node seed.js
# Creates demo user: demo / demo123
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR SERVER                          │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────┐    │
│  │   Coolify/PaaS  │    │     Your Application    │    │
│  │  (Management)   │    │                         │    │
│  │                 │    │  ┌──────────────────┐  │    │
│  │  - Auto SSL     │    │  │  Frontend (Nginx) │  │    │
│  │  - Git Deploy   │    │  │  Port 3000        │  │    │
│  │  - Monitoring   │    │  └────────┬─────────┘  │    │
│  │  - DB Manage    │    │           │ /api        │    │
│  └─────────────────┘    │  ┌────────▼─────────┐  │    │
│                         │  │  Backend (Node.js) │  │    │
│                         │  │  Port 8080         │  │    │
│                         │  │  - Express API     │  │    │
│                         │  │  - SQLite DB       │  │    │
│                         │  │  - WebSocket       │  │    │
│                         │  │  - JWT Auth        │  │    │
│                         │  │  - Gemini AI       │  │    │
│                         │  └──────────────────┘  │    │
│                         └─────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Comparison

| Solution | Cost | Features |
|----------|------|----------|
| **Coolify** | Free (own server $4-5/mo) | Full PaaS, SSL, Git, DB, Monitoring |
| **CapRover** | Free (own server $4-5/mo) | Docker PaaS, SSL, One-click apps |
| **Dokku** | Free (own server $4-5/mo) | Heroku-like, Git push |
| **Docker Compose** | Free (own server) | Simple, manual management |
| **Railway** | $5/mo (free tier available) | Managed, auto-scaling |
| **Render** | Free tier available | Managed, auto SSL |
| **Fly.io** | Free tier (3 VMs) | Edge deployment |

---

## Recommended Setup

For the best experience with minimum cost:

1. **Get a VPS** — Hetzner ($4/mo), DigitalOcean ($4/mo), or any $5/mo server
2. **Install Coolify** — One command setup
3. **Deploy Luxor9** — One-click via Docker Compose
4. **Set API_KEY** — Your Gemini API key
5. **Done** — Auto SSL, monitoring, and management included

---

## Files Reference

| File | Purpose |
|------|---------|
| `docker-compose.coolify.yml` | One-click deploy for Coolify/Docker |
| `nginx.conf` | Reverse proxy config |
| `Dockerfile` | Full-stack multi-stage build |
| `railway.json` | Railway deployment config |
| `captain-definition` | CapRover deployment config |
| `Procfile` | Heroku/Dokku deployment |
| `deploy.sh` | Interactive deploy script |
| `service/server.js` | Backend API server |
| `service/seed.js` | Demo data seeder |
