# Deployment Plan — Tech Blog Catchup

## Issues Created

| # | Title | Parallel Group | Depends On |
|-|-|-|-|
| #105 | fix: AUDIO_DIR env var not read | A | — |
| #106 | fix: CORS defaults block production | A | — |
| #107 | chore: remove posts without audio | A | — |
| #108 | chore: document all env vars | B | #105, #106 |
| #109 | feat: make OAuth optional | A | — |
| #110 | feat: Railway deployment spec | B | #105, #106, #109 |
| #111 | test: E2E verification script | C | #110 |

## Execution Phases

### Phase A — Parallel fixes (4 agents)
All independent, can run simultaneously:

1. **Agent: audio-dir-fix** (#105)
   - Edit `generator.py:48` — `os.getenv("AUDIO_DIR", <existing-fallback>)`
   - Edit `app.py:63` — same pattern
   - Test: set AUDIO_DIR env var, verify both read it

2. **Agent: cors-fix** (#106)
   - Edit `app.py:49-60` — log active origins on startup
   - Update `.env.example`

3. **Agent: cleanup-posts** (#107)
   - Add `cleanup` command to `run.py`
   - Delete posts where audio_status != 'ready'
   - Clean up orphaned post_tags, crawl_logs
   - Add `--dry-run` flag

4. **Agent: optional-auth** (#109)
   - Make OAuth providers conditional in `auth.ts`
   - Remove AuthGuard from status page
   - Hide login UI when no OAuth configured
   - Graceful SessionProvider when no auth

### Phase B — Documentation + Deployment (after Phase A)
2 agents:

5. **Agent: env-docs** (#108)
   - Update `backend/.env.example` with all vars
   - Create `frontend/.env.example`
   - Update CLAUDE.md

6. **Agent: railway-spec** (#110)
   - Update Dockerfiles (Node 22 for frontend)
   - Ensure AUDIO_DIR works in Dockerfile
   - Write docs/RUNBOOK.md with Railway setup steps

### Phase C — E2E Verification (after Phase B)
1 agent:

7. **Agent: e2e-verify** (#111)
   - Create `backend/scripts/verify_deployment.py`
   - Test against local stack
   - Verify all 9 checks pass

## Railway Deployment Spec

### Backend Service
```
Build: backend/Dockerfile
Port: 8000
Health: /api/health
Volumes:
  /app/data → SQLite DB (persistent)
  /app/audio → MP3 files (persistent)
Environment:
  OPENAI_API_KEY=<secret>
  CORS_ORIGINS=https://<frontend-domain>.up.railway.app
  AUDIO_DIR=/app/audio
  AUDIO_BASE_URL=https://<backend-domain>.up.railway.app/audio
  NEXTAUTH_SECRET=<random-string>
```

### Frontend Service
```
Build: frontend/Dockerfile
  Build arg: NEXT_PUBLIC_API_URL=https://<backend-domain>.up.railway.app
Port: 3000
Environment:
  AUTH_SECRET=<random-string>  (optional)
  GOOGLE_CLIENT_ID=<optional>
  GOOGLE_CLIENT_SECRET=<optional>
  GITHUB_ID=<optional>
  GITHUB_SECRET=<optional>
```

### First Deploy Steps
1. Create Railway project
2. Add backend service from Dockerfile
3. Create 2 volumes: /app/data, /app/audio
4. Set backend env vars
5. Deploy backend, verify /api/health
6. Add frontend service from Dockerfile
7. Set NEXT_PUBLIC_API_URL as build arg pointing to backend URL
8. Deploy frontend
9. Run verify_deployment.py against both URLs
10. Run `python run.py crawl --max-posts 5` to seed data
11. Run `python run.py generate` to create audio
12. Verify audio playback in frontend

## Verification Script Spec

`backend/scripts/verify_deployment.py --backend-url <URL> --frontend-url <URL>`

Checks:
1. GET /api/health → 200, json.db_status = "connected"
2. GET /api/posts?limit=5 → 200, len(data) > 0
3. GET /api/playlist → 200, at least 1 post
4. HEAD /audio/<first-audio-file> → 200, Content-Type contains audio
5. GET /api/sources → 200, at least 1 source with posts
6. GET /api/tags → 200, tags present
7. GET /api/status → 200, valid JSON
8. GET frontend / → 200, HTML response
9. OPTIONS /api/posts (with Origin header) → CORS header present

Output: table with check name, status (PASS/FAIL), details
Exit code: 0 if all pass, 1 if any fail
