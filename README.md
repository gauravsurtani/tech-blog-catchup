# Blog2Podcast

An educational blog-to-audio project with a public listening library and a private studio for approved creators.

This branch prepares the private beta. **It does not, by itself, mean the new system has been deployed or that new member generation is enabled.** See the [private-beta runbook](docs/PRIVATE_BETA_RUNBOOK.md) for release gates and operating instructions.

## How it works

1. An approved member submits text they have permission to process.
2. Ollama Cloud creates a source-grounded summary and two-speaker script.
3. A CPU-only Kokoro subprocess renders stock voices and records exact turn timings.
4. The member previews a private draft. An administrator reviews and publishes it.

The public library remains available without an account. AI output can contain mistakes; every important claim should be checked against its original source. This project does not imply publisher endorsement.

## Application

- **Frontend:** Next.js / React, persistent audio player, responsive public explainer, controllable motion and reduced-motion stepper.
- **Backend:** FastAPI, SQLite/SQLAlchemy, versioned migrations and a durable bounded generation queue.
- **Text:** Ollama Cloud, with explicit provider configuration and no OpenAI fallback.
- **Speech:** Kokoro ONNX on CPU. A separate paid speech API or GPU is not required by this implementation. Native hosting capacity still requires measurement.
- **Access:** Google/GitHub sign-in provisions pending membership. The backend checks live roles and ownership; only an operator can approve members/admins.

## Local development

Python 3.11+, Node 22+, FFmpeg, and the speech dependencies/assets are needed for complete local generation. Browser-only development does not need a provider key.

Backend:

```sh
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]' -r requirements-speech.txt
python scripts/install_speech_assets.py models/kokoro
cp .env.example .env
python run.py init
python run.py api --port 8000
```

Frontend, in another terminal:

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Fill in environment values privately. Text generation needs `OLLAMA_API_KEY`. Browser authentication needs configured OAuth credentials and `AUTH_SECRET`; the frontend and backend share a separate `API_SIGNING_SECRET` of at least 32 bytes. For local sign-in use `AUTH_URL=http://localhost:3000`. New accounts stay pending until an operator approves their verified provider subject.

Generation and scheduling default to disabled. Review the runbook's rights, identity, usage and storage gates before enabling them. CLI generation enqueues work; the API worker must be running to process it. A queued job is not an audio result.

## Checks

```sh
# backend/
python -m pytest tests/ -q
python scripts/evaluate_quality.py
# frontend/
npm run lint
npm run build
npx playwright install chromium webkit
npx playwright test
```

The quality corpus contains 20 original synthetic regression cases. It is not a human-reviewed article corpus. A separate opt-in real speech cache check is available through `python scripts/verify_speech_cache.py --assets models/kokoro`.

## Routes

- `/`: public product explanation
- `/listen`, `/explore`, `/browse`: public collection
- `/post/:id`: published episode and original source link
- `/login`, `/member`: sign-in and private drafts
- `/about`, `/sources`, `/terms`, `/privacy`: project and data-flow information

## Deployment and data

Keep the existing Railway services and mounted SQLite/audio storage. Do not deploy a fresh empty database over the live volume. [Read the migration, rollback and launch instructions](docs/PRIVATE_BETA_RUNBOOK.md). Terms/privacy remain drafts until the operator and retention details are confirmed.

New speech uses [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) and [Kokoro ONNX](https://github.com/thewh1teagle/kokoro-onnx). Text processing follows [Ollama's provider policy](https://ollama.com/privacy). Review upstream model/runtime/voice notices and source rights before public release.
