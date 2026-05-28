# Doble 9's backend — production image.
# Multi-stage: build deps with uv into a venv, copy into a slim runtime.
# Single worker on purpose: the WS MatchRegistry is in-process (M1). To scale
# out, move the registry behind Redis + a Socket.IO adapter, then add workers.

# ---------- builder ----------
FROM python:3.12-slim AS builder

# uv: fast, reproducible installs from uv.lock.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /app

# Install only prod deps first (no dev group, no [rl] extra) for layer caching.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# App source (changes most often — keep last).
COPY . .
RUN uv sync --frozen --no-dev --no-editable

# ---------- runtime ----------
FROM python:3.12-slim AS runtime

# Non-root user.
RUN useradd -m -u 10001 app

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

USER app
EXPOSE 8000

# Apply migrations, then start the single-worker ASGI app. $PORT is provided by
# Render/Railway; falls back to 8000 locally.
#
# --proxy-headers + --forwarded-allow-ips="*": Render (and Railway) terminate
# TLS at an edge proxy and forward via plain HTTP, attaching X-Forwarded-Proto
# and X-Forwarded-For. uvicorn must trust those to (a) build correct absolute
# URLs (scheme=https), (b) mark cookies as Secure on HTTPS, and (c) let
# python-socketio negotiate WS upgrade over wss://. Render's proxy IPs are not
# stable, so we trust all (the proxy is the only path inbound to the container).
# See ADR-008 + future ADR-012 "Deploy hardening Render+Vercel".
CMD ["sh", "-c", "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips=*"]
