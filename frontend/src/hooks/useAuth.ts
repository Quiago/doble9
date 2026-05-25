// hooks/useAuth.ts — JWT auth over api + userStore. AGENT: Frontend.
import { useCallback } from "react";
import { useUserStore } from "@/store/userStore";
import { api } from "@/services/api";
import { socketTransport } from "@/services/websocket";
import type { LoginRequest, RegisterRequest } from "@shared/api";

// En modo mock, wsFake es el transporte; llamar al socketTransport real lo pisa
// y deja la mesa vacía tras login (bootstrap nunca lo hacía). Gateado igual que
// main.tsx. AGENT: Frontend.
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function useAuth() {
  const token = useUserStore((s) => s.token);
  const user = useUserStore((s) => s.user);
  const setAuth = useUserStore((s) => s.setAuth);
  const logout = useUserStore((s) => s.logout);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await api.login(data);
      setAuth(res.token, res.user);
      if (!USE_MOCKS) socketTransport.reconnect();
      try {
        const stats = await api.userStats(res.user.id);
        useUserStore.getState().setStats(stats);
      } catch (err) {
        console.error("failed to fetch stats", err);
      }
      return res.user;
    },
    [setAuth],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const res = await api.register(data);
      setAuth(res.token, res.user);
      if (!USE_MOCKS) socketTransport.reconnect();
      try {
        const stats = await api.userStats(res.user.id);
        useUserStore.getState().setStats(stats);
      } catch (err) {
        console.error("failed to fetch stats", err);
      }
      return res.user;
    },
    [setAuth],
  );

  /** Cold-reload: have a token but no user → hydrate from /auth/me. */
  const bootstrap = useCallback(async () => {
    const t = useUserStore.getState().token;
    if (!t || useUserStore.getState().user) return;
    try {
      const me = await api.me();
      setAuth(t, me);
      try {
        const stats = await api.userStats(me.id);
        useUserStore.getState().setStats(stats);
      } catch (err) {
        console.error("failed to fetch stats", err);
      }
    } catch {
      logout();
    }
  }, [setAuth, logout]);

  return {
    token,
    user,
    isAuthed: !!token,
    login,
    register,
    logout,
    bootstrap,
  };
}
