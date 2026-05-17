# Doble 9's — Backend Makefile
# Single entrypoint for all backend ops. Agents/devs use `make <target>`,
# NEVER raw `uv`/`uvicorn`/`pytest`/`alembic` directly. This keeps the
# workflow reproducible and identical in CI.

.DEFAULT_GOAL := help
.PHONY: help install lock sync dev run test test-watch cov lint format \
        typecheck check migrate makemigration db-up db-down db-reset \
        infra-up infra-down clean

PYTHON_VERSION ?= 3.12
APP            := src.main:app
PORT           ?= 8000
HOST           ?= 0.0.0.0

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

run: ## Run FastAPI without reload (prod-like)
	uv run uvicorn $(APP) --host $(HOST) --port $(PORT) --workers 4

## ---------- Tests ----------
test: ## Run full test suite
	uv run pytest -q

test-watch: ## Re-run tests on file change
	uv run pytest-watch -- -q

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

## ---------- Housekeeping ----------
clean: ## Remove caches and build artifacts
	rm -rf .pytest_cache .ruff_cache .mypy_cache htmlcov coverage.xml .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
