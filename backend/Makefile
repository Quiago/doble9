# Doble 9's — Backend Makefile
# Single entrypoint for all backend ops. Agents/devs use `make <target>`,
# NEVER raw `uv`/`uvicorn`/`pytest`/`alembic` directly. This keeps the
# workflow reproducible and identical in CI.

.DEFAULT_GOAL := help
.PHONY: help install lock sync dev run test test-watch test-e2e cov lint format \
        typecheck check migrate makemigration db-up db-down db-reset \
        infra-up infra-down clean docker-build docker-run docker-stop docker-smoke

PYTHON_VERSION ?= 3.12
APP            := src.main:app
PORT           ?= 8000
HOST           ?= 0.0.0.0

# Load .env so targets that read raw os.environ (alembic env.py) work without
# manual `export`. The app itself loads .env via pydantic-settings; this makes
# `make migrate`/`makemigration`/`db-reset` consistent with that. Real env vars
# (CI, prod) still win because `-include` does not override exported values.
ifneq (,$(wildcard ./.env))
include ./.env
export
endif

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

## ---------- Dependencies (uv) ----------
install: ## Create venv + install all deps (incl. dev) from lockfile
	uv sync --all-extras --dev

lock: ## Resolve and write uv.lock (commit this file)
	uv lock

sync: ## Sync env to match uv.lock exactly
	uv sync --frozen --all-extras --dev

## ---------- Run ----------
dev: ## Run FastAPI with autoreload (local development)
	uv run uvicorn $(APP) --reload --host $(HOST) --port $(PORT)

run: ## Run FastAPI without reload (prod-like, SINGLE worker — see note)
	# Single worker is REQUIRED until M2: the WS MatchRegistry (src/ws/registry.py)
	# keeps live MatchRuntimes in an in-process dict, so multiple workers would
	# fragment matches/rooms across processes. REST is Postgres-backed and would
	# scale fine, but Socket.IO state is not shared. To scale out: move the
	# registry behind Redis + a Socket.IO Redis adapter, then raise --workers.
	uv run uvicorn $(APP) --host $(HOST) --port $(PORT)

## ---------- Tests ----------
test: ## Run full test suite
	uv run pytest -q

test-watch: ## Re-run tests on file change
	uv run pytest-watch -- -q

test-e2e: ## Run real over-the-wire FE↔BE integration tests (needs infra-up)
	# Boots a live uvicorn + drives REST→JWT→Socket.IO /game exactly like the
	# frontend. Requires Postgres+Redis (run `make infra-up` and `make migrate`
	# first). Skips itself if infra is unreachable. See tests/integration/.
	uv run pytest -q -m integration -o addopts=""

cov: ## Run tests with coverage report
	uv run pytest --cov=src --cov-report=term-missing --cov-report=xml

## ---------- Quality ----------
lint: ## Lint with ruff
	uv run ruff check src tests

format: ## Auto-format with ruff
	uv run ruff format src tests
	uv run ruff check --fix src tests

typecheck: ## Static type check with mypy
	uv run mypy src

check: lint typecheck test ## CI gate: lint + types + tests

## ---------- Database (Alembic) ----------
migrate: ## Apply all pending migrations
	uv run alembic upgrade head

makemigration: ## Autogenerate a migration: make makemigration m="add users"
	uv run alembic revision --autogenerate -m "$(m)"

db-reset: ## Drop to base then re-apply all migrations
	uv run alembic downgrade base
	uv run alembic upgrade head

## ---------- Local infra (Docker) ----------
infra-up: ## Start Postgres + Redis containers
	docker compose up -d db redis

infra-down: ## Stop infra containers
	docker compose down

db-up: infra-up ## Alias: bring up the database stack

db-down: infra-down ## Alias: tear down the database stack

## ---------- Docker (production-parity build) ----------
# Mirrors the Render deploy locally: same Dockerfile, same CMD (alembic upgrade
# head + uvicorn --proxy-headers). Uses host networking so the container reaches
# the Postgres/Redis from `make infra-up`. The Postgres port matches the
# compose default (`POSTGRES_PORT`, default 5432). See ADR-008 + future ADR-012
# "Deploy hardening Render+Vercel" and docs/DEPLOY.md §"Local production-parity
# build".
DOCKER_IMAGE       ?= doble9s-backend
DOCKER_CONTAINER   ?= doble9s-backend-smoke
DOCKER_PORT        ?= 8010
POSTGRES_HOST_PORT ?= $(or $(POSTGRES_PORT),5432)
DOCKER_DB_URL      ?= postgresql://$(or $(POSTGRES_USER),doble9s):$(or $(POSTGRES_PASSWORD),doble9s)@localhost:$(POSTGRES_HOST_PORT)/$(or $(POSTGRES_DB),doble9s)
DOCKER_REDIS_URL   ?= redis://localhost:6379/0
DOCKER_SECRET_KEY  ?= dev-only-please-use-32+bytes-in-prod

docker-build: ## Build the production image (same as Render)
	docker build -t $(DOCKER_IMAGE) .

docker-run: ## Run the production image locally against `make infra-up`
	# --network host so the container can reach Postgres/Redis on localhost.
	# PORT=8010 to avoid clashing with `make dev` on 8000. Background by
	# default so `docker-smoke` (and humans) can probe it; tear down with
	# `make docker-stop`.
	docker rm -f $(DOCKER_CONTAINER) 2>/dev/null || true
	docker run -d --name $(DOCKER_CONTAINER) --network host \
		-e PORT=$(DOCKER_PORT) \
		-e DATABASE_URL='$(DOCKER_DB_URL)' \
		-e REDIS_URL='$(DOCKER_REDIS_URL)' \
		-e SECRET_KEY='$(DOCKER_SECRET_KEY)' \
		-e CORS_ORIGINS='http://localhost:5173' \
		$(DOCKER_IMAGE)

docker-stop: ## Stop and remove the smoke container
	docker rm -f $(DOCKER_CONTAINER) 2>/dev/null || true

docker-smoke: ## Probe /health then POST /auth/register against the container
	@echo "Waiting for $(DOCKER_CONTAINER) on :$(DOCKER_PORT)/health ..."
	@for i in $$(seq 1 30); do \
		if curl -fsS http://localhost:$(DOCKER_PORT)/health >/dev/null 2>&1; then \
			echo "/health OK"; break; \
		fi; \
		if [ $$i -eq 30 ]; then \
			echo "ERROR: /health never came up in 30s"; \
			docker logs --tail 80 $(DOCKER_CONTAINER) || true; \
			exit 1; \
		fi; \
		sleep 1; \
	done
	@curl -fsS http://localhost:$(DOCKER_PORT)/health
	@echo
	@echo "POST /auth/register ..."
	@USERNAME="smoke-$$(date +%s)"; \
	curl -sS -X POST http://localhost:$(DOCKER_PORT)/auth/register \
		-H 'Content-Type: application/json' \
		-d "{\"username\":\"$$USERNAME\",\"email\":\"$$USERNAME@x.co\",\"password\":\"secret123\"}"
	@echo

## ---------- Housekeeping ----------
clean: ## Remove caches and build artifacts
	rm -rf .pytest_cache .ruff_cache .mypy_cache htmlcov coverage.xml .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
