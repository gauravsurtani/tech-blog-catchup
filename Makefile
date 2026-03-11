# Tech Blog Catchup — Quick Commands
# Usage: make backend | make frontend | make both | make setup

.PHONY: setup setup-backend setup-frontend backend frontend both stop status

# ── Setup (first time) ──────────────────────────────────────

setup: setup-backend setup-frontend
	@echo "\n✅ Setup complete. Run: make both"

setup-backend:
	@echo "Setting up backend..."
	cd backend && python3 -m venv .venv
	cd backend && .venv/bin/pip install -e .
	cd backend && .venv/bin/python run.py init
	@echo "✅ Backend ready"

setup-frontend:
	@echo "Setting up frontend..."
	cd frontend && npm install
	@echo "✅ Frontend ready"

# ── Run services ─────────────────────────────────────────────

backend:
	@echo "Starting backend on :8000..."
	cd backend && .venv/bin/python run.py api --reload

frontend:
	@echo "Starting frontend on :3000..."
	cd frontend && npm run dev

both:
	@echo "Starting backend (:8000) and frontend (:3000)..."
	@make backend & make frontend & wait

stop:
	@echo "Stopping services..."
	-@pkill -f "run.py api" 2>/dev/null
	-@pkill -f "next dev" 2>/dev/null
	@echo "✅ Stopped"

# ── Utilities ────────────────────────────────────────────────

status:
	cd backend && .venv/bin/python run.py status

crawl:
	cd backend && .venv/bin/python run.py crawl --max-posts 10

generate:
	cd backend && .venv/bin/python run.py generate

discover:
	cd backend && .venv/bin/python run.py discover

test-backend:
	cd backend && .venv/bin/pip install -e ".[dev]" && .venv/bin/pytest tests/ -v

test-frontend:
	cd frontend && npm run lint

lint: test-frontend test-backend
