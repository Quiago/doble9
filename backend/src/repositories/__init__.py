# AGENT: Backend
"""Persistence boundary. Routers depend on the Protocols here, never on
SQLAlchemy directly — so the SQL impl runs in prod and an in-memory impl
runs in `make check` (no Postgres needed for unit tests).
"""
