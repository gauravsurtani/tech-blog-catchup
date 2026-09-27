# Blog2Podcast development guide

Read `docs/PRIVATE_BETA_RUNBOOK.md` before changing authentication, generation, publication or deployment. The private-beta implementation is a release candidate; a local build does not establish live production acceptance.

## Stack

Next.js 16 / React 19 frontend, FastAPI / SQLAlchemy / SQLite backend. Keep this stack. Ollama Cloud handles text; Kokoro ONNX renders stock synthetic voices on CPU in a bounded child process. There is no OpenAI provider fallback and no Podcastfy dependency.

## Checks

From `backend/`: `python -m pytest tests/ -q` with development dependencies installed.
From `frontend/`: `npm ci`, `npm run lint`, `npm run build`, `npx playwright test`.
Speech dependencies are separately listed in `backend/requirements-speech.txt`; the Dockerfile installs them together with the app. Asset installation uses fixed hashes. The actual deployment target is Python 3.11. Do not copy incompatible desktop prototype pins.

## Contracts

- New Posts default private. A Job owns an immutable source snapshot, run specification and generated artifact. Published Post fields change only through reviewed admin publication.
- `src/jobs.py` owns atomic admission, idempotency, limits, leases, fencing and the durable worker. API and scheduler use it. Cancellation retains resource ownership until the provider or child exits.
- `ENABLE_GENERATION=false` is the default. Both scheduled crawling and the text client honor it. `ENABLE_SCHEDULER` is a separate opt-in.
- `src/text_client.py` fixes the provider URL to Ollama. Do not rely on SDK defaults or log credentials/provider response bodies.
- `src/podcast/kokoro_worker.py` receives no provider key. It checks assets, uses CPUExecutionProvider, caches immutable segments, records exact offsets and verifies a full MP3 decode.
- User roles: pending/member/admin, plus revocation timestamp. A verified OAuth identity provisions pending. An operator explicitly approves a provider subject using `run.py member`.
- Browser sessions are Auth.js sessions. The same-origin gateway creates short-lived signed API tokens using a separate `API_SIGNING_SECRET`; never decode the Auth.js cookie as an HS256 API token.
- Public posts, source/tag counts, metadata and audio must exclude private drafts. Private jobs are owner/admin only. Audio delivery checks publication/ownership and supports Range. Never restore unrestricted StaticFiles serving.
- The service worker caches only immutable build assets; private/session/API/audio responses must not be stored offline.
- SQLite migrations run through Alembic against mounted storage under an exclusive migration lock. Preserve legacy IDs, URLs and audio; backup and restore-test before a production migration.

## Frontend

`/` is the public explainer; `/listen` is the feed; `/explore`, `/browse` and `/post/:id` remain available. `/member` is the private studio. `/landing`, `/signup` and `/submit` redirect to their current destinations. Keep one root AudioPlayerProvider across shells. Motion must be demonstrative or driven by real state, with pause/replay and reduced motion. Timed transcripts use renderer offsets, never character-count estimates.

## Secrets and launch

Copy the environment examples without committing values. Keep the Ollama key and signing secrets server-side. The canonical sign-in origin is `https://blog2podcast.com`; www sign-in redirects there. Do not invent OAuth credentials, operator identity, source permissions, budget approvals or listening acceptance. Policy drafts must not be described as legally finalized. No AWS changes are part of this project.
