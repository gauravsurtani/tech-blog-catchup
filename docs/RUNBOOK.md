# Railway Deployment Runbook

## Architecture

```
GitHub Repo
  ├── backend/   → Railway Service 1 (FastAPI :8000)
  │     ├── SQLite DB at /app/data/techblog.db (persistent volume)
  │     └── Audio files at /app/audio/ (persistent volume)
  └── frontend/  → Railway Service 2 (Next.js :3000, standalone)
```

- **Backend**: Python 3.11, FastAPI, SQLite, serves audio files and REST API
- **Frontend**: Next.js 16 (Node 22), standalone output, static export

## Prerequisites

- Railway account (https://railway.app)
- GitHub repo connected to Railway
- OpenAI API key (required for podcast generation)

## Backend Service Setup

### 1. Create Service

1. In your Railway project, click **New Service** > **GitHub Repo**
2. Select this repository
3. Set **Root Directory** to `backend/`
4. Railway will auto-detect the Dockerfile at `backend/Dockerfile`

### 2. Create Persistent Volumes

Two volumes are required to survive redeploys:

| Volume | Mount Path | Purpose |
|-|-|-|
| Data | `/app/data` | SQLite database |
| Audio | `/app/audio` | Generated podcast MP3 files |

In Railway: **Service** > **Volumes** > **New Volume** for each.

### 3. Set Environment Variables

| Variable | Required | Example | Notes |
|-|-|-|-|
| `OPENAI_API_KEY` | Yes | `sk-proj-...` | For LLM scripts + TTS audio |
| `CORS_ORIGINS` | Yes | `https://your-frontend.up.railway.app` | Comma-separated allowed origins |
| `AUDIO_DIR` | Yes | `/app/audio` | Must match volume mount path |
| `AUDIO_BASE_URL` | No | `/audio` | URL prefix for audio files (default: `/audio`) |
| `DATABASE_URL` | No | `sqlite:///data/techblog.db` | Default works with volume at `/app/data` |
| `PORT` | No | `8000` | Railway sets this automatically |

### 4. Deploy and Verify

After deploy completes:

```bash
curl https://your-backend.up.railway.app/api/health
# Should return: {"status": "healthy", "uptime": ..., "db_status": "ok", "version": "..."}
```

## Frontend Service Setup

### 1. Create Service

1. Click **New Service** > **GitHub Repo** (same repo)
2. Set **Root Directory** to `frontend/`
3. Railway will auto-detect `frontend/Dockerfile`

### 2. Set Build Arguments

**IMPORTANT**: `NEXT_PUBLIC_API_URL` is baked in at build time (Next.js static replacement). It must be set as a **build argument**, not a runtime env var.

| Variable | Required | Example | Notes |
|-|-|-|-|
| `NEXT_PUBLIC_API_URL` | Yes | `https://your-backend.up.railway.app` | Backend's public URL. **Must be a build arg.** |
| `PORT` | No | `3000` | Railway sets this automatically |

In Railway: **Service** > **Variables** > Add `NEXT_PUBLIC_API_URL`. Railway passes service variables as both env vars and Docker build args.

### 3. Deploy and Verify

```bash
curl -s https://your-frontend.up.railway.app | head -20
# Should return HTML for the Next.js app
```

## Post-Deploy Setup

### Initialize Database

```bash
# Via Railway CLI (install: npm i -g @railway/cli)
railway link         # link to your project
railway run -s backend -- python run.py init
```

### Run Initial Crawl

```bash
railway run -s backend -- python run.py crawl --max-posts 5
```

### Generate Podcasts

```bash
railway run -s backend -- python run.py generate
```

### Verify Audio Playback

1. Open the frontend URL in a browser
2. Navigate to a post with audio (audio_status = ready)
3. Click play — audio should stream from the backend

## Monitoring

| Endpoint | Purpose |
|-|-|
| `GET /api/health` | Service health, DB status, uptime |
| `GET /api/status` | Post counts, audio stats, tag distribution |
| `GET /api/crawl-status` | Per-source scrape status |
| `GET /api/jobs` | Background job status (crawl, generate) |

## Troubleshooting

### CORS Errors

**Symptom**: Browser console shows `Access-Control-Allow-Origin` errors.

**Fix**: Ensure `CORS_ORIGINS` includes the exact frontend URL (with `https://`, no trailing slash).

```
CORS_ORIGINS=https://your-frontend.up.railway.app
```

Backend logs the configured CORS origins on startup — check Railway logs to verify.

### No Audio Playback

**Symptom**: Posts show as "ready" but audio doesn't play.

**Checklist**:
1. Verify `AUDIO_DIR` env var matches the volume mount path (`/app/audio`)
2. Check the volume is mounted at `/app/audio` in Railway
3. Verify `AUDIO_BASE_URL` is set correctly (default `/audio` usually works)
4. Check audio files exist: `railway run -s backend -- ls /app/audio/`

### Auth/OAuth Crashes

**Symptom**: App crashes on startup with OAuth-related errors.

**Fix**: OAuth (Google/GitHub) is optional. If you don't need auth, simply don't set the OAuth env vars (`GOOGLE_CLIENT_ID`, `GITHUB_ID`, etc.). The app will run without authentication.

### Database Lost on Redeploy

**Symptom**: All posts disappear after a redeploy.

**Fix**: Ensure the persistent volume is mounted at `/app/data`. Without it, SQLite data lives in the ephemeral container filesystem and is lost on every deploy.

### Frontend Shows "Cannot connect to API"

**Symptom**: Frontend loads but shows no data.

**Checklist**:
1. Verify `NEXT_PUBLIC_API_URL` was set correctly **before** the frontend was built
2. Since it's baked at build time, you must **redeploy** the frontend after changing this variable
3. Check backend is healthy: `curl <backend-url>/api/health`

### Build Failures

- **Frontend**: Ensure Node 22 is used (Dockerfile uses `node:22-alpine`)
- **Backend**: `crawl4ai-setup` may warn/fail in slim images — this is expected and non-blocking (`|| true`)
