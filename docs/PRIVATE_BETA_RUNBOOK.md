# Blog2Podcast private beta candidate

This branch changes the application and schema. It has not been deployed by the implementation task. Existing production remains a separate system until the launch gates below are met.

## Architecture and limits

- Public homepage and library; `/listen` holds the former feed. `/landing` redirects home. `/signup` redirects to login and `/submit` to the member studio.
- Google/GitHub verified identity creates a pending user. An operator approves a provider subject using `python run.py member --subject google:PROVIDER_SUBJECT --role member` (or admin/revoked). The account must already exist. Never infer approval from an email alone.
- Auth.js session cookies stay on the canonical origin. The web gateway validates the session and mutation Origin, then signs a 60-second API token with a separate server-only `API_SIGNING_SECRET`. FastAPI checks current membership for each request.
- Generation defaults off. New member text is a private Post; a Job owns its frozen source, model specification, script, evidence and audio. Only explicit admin publication changes the public projection. Old public files remain available until withdrawal.
- One leased generation globally, two attempts, default daily cap 10 aggregate / 3 per actor. Failed attempts count toward budget. A retry of the same request key returns the same job. A new source or model needs a new key.
- Ollama Cloud text requests use `OLLAMA_API_KEY` and `OLLAMA_MODEL`; no OpenAI fallback. Both the scheduler and text client honor `ENABLE_GENERATION=false`.
- Speech runs in a CPU-only child, two intra-op threads, one inter-op thread, 15-minute whole-process timeout. Cancellation kills its process group. Fixed model and stock-voice hashes are checked before loading. Audio is fully decoded before the MP3 becomes an artifact.
- The worker polls persisted jobs while the API is running. A restarted worker may reclaim an expired lease once. Historical jobs with no lease are not assumed safe to restart; reconcile after confirming their old executor has stopped.
- Arbitrary audio upload is disabled: the old route could overwrite publication without provenance. Metadata imports cannot change existing public records.

## Environment and storage

Backend: `DATABASE_PATH=/app/data/techblog.db`, `AUDIO_DIR=/app/data/audio` (match the actual existing volume!), `KOKORO_ASSET_DIR=/app/models/kokoro`, `API_SIGNING_SECRET`, `OLLAMA_API_KEY`, `OLLAMA_MODEL`. Set `ENABLE_GENERATION=false` and `ENABLE_SCHEDULER=false` during migration. Do not move existing audio paths without a checked manifest.

Frontend: `NEXT_PUBLIC_API_URL` is baked during build. `BACKEND_URL` is server-only. Set `AUTH_URL=https://blog2podcast.com`, a random `AUTH_SECRET`, and the separate shared `API_SIGNING_SECRET` (at least 32 bytes). Configure OAuth callback URLs on that canonical hostname. www sign-in redirects to the canonical origin. `OPERATOR_NAME` and `OPERATOR_CONTACT` are factual publication inputs, not invented defaults.

Provider keys never belong in Git, browser environment variables, reports, or renderer requests. Render children receive a narrow environment and no provider key.

## Migration and rollback

1. Stop new admission and scheduling; wait for active work or cancel it.
2. Take a SQLite backup using the existing backup script/SQLite backup API, and snapshot the corresponding audio tree. Record row counts, IDs/URLs, file paths and hashes. Existing user-submitted rows need a separate review list.
3. Restore into a disposable volume. Run `python run.py init` twice. Confirm Alembic revision `0001_private_beta`, SQLite `integrity_check`, `foreign_key_check`, legacy public counts, user-submission privacy and audio checksums. A synthetic restore is not a production backup.
4. Deploy the candidate against the mounted database, never an image-build copy. Startup holds a SQLite write lock while Alembic runs. The legacy non-user catalog stays public; old user submissions remain private. New rows default private.
5. Keep admission disabled during all catalog/audio smoke checks. Confirm the deployed revision and correct volume before enabling any provider work.
6. Rollback: disable all work, stop writers, preserve the failed candidate database/audio for diagnosis, then restore the paired verified backup and known compatible application image. Do not run the old application against a partially migrated database and do not restore the retired OpenAI key.

## Acceptance commands

Backend: `python -m pytest tests/ -q` with development dependencies. Frontend: `npm ci`, `npm run lint`, `npm run build`, `npx playwright test` against a controlled candidate. CI runs Chromium and WebKit profiles and no paid model calls.

Quality: `python scripts/evaluate_quality.py` records the 20 original synthetic regression cases without provider calls. `--live --limit 1` is an explicit bounded provider check; it requires an enabled, configured test environment. The synthetic corpus does not replace the human-reviewed article set or listening acceptance.

Runtime speech proof must use the actual Python 3.11 image under resource caps and no network. Validate the current source hashes, decoded duration/samples, source/script/spec hashes, HTTP Range, cancellation, API latency and peak memory. An ARM desktop result alone is insufficient for Railway.

## Launch gates still requiring operator input

- Real OAuth credentials/callbacks and initial verified administrator.
- Operator identity, private contact route, jurisdiction, retention/deletion schedule and final policy review.
- Source rights/allowlist and approval of private drafts followed by admin publication.
- Voice listening approval, 20 human-reviewed articles/key claims and accepted model/voice quality.
- Confirm daily/aggregate cost and usage limits; do not automatically enable schedules.
- Restore-tested production database/audio backup and live revision/volume verification.

## Operations

Check `/api/health` for database availability; published counts must exclude drafts. An admin can inspect owned/admin `/api/jobs` for lease failures. Provider errors are sanitized; do not log provider response bodies or source text. Review quotas/model retirements in the provider dashboard. Assign a human owner for uptime/certificate alerts, backup restore drills, source removals and failed/stale jobs before enabling the cohort. This change does not create a recurring monitor or promise automated retention.

## Data and license record

Identity, session, source snapshot, job state, script, evidence and audio are stored by the app. Text goes to Ollama Cloud; new speech stays on the application server. Hosting and OAuth providers process their respective operational/login data. Private dynamic responses are no-store; the service worker caches only immutable static build assets.

Publisher references: https://ollama.com/privacy ; https://github.com/thewh1teagle/kokoro-onnx ; https://huggingface.co/hexgrad/Kokoro-82M . Preserve upstream model/runtime/voice and phonemizer notices when distributing an image. Final rights/license review is a launch gate, not established by a successful checksum.
