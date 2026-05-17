# AGENT: Backend
"""Realtime gateway (Socket.IO namespace `/game`).

Mirrors `contracts/websocket.yml` + ADR-004 (reconnect). The socket
handlers (`gateway.py`) are deliberately thin; all authoritative logic
lives in `MatchRuntime` (testable without a live socket).
"""
