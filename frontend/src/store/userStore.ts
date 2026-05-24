// store/userStore.ts — auth + profile slice. Persisted token for cold reload.
// AGENT: Frontend.
import { create } from "zustand";
import type { User, PlayerStats } from "@shared/api";

const TOKEN_KEY = "d9.token";

interface UserSlice {
  token: string | null;
  user: User | null;
  stats: PlayerStats | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setStats: (stats: PlayerStats) => void;
  logout: () => void;
}

export const useUserStore = create<UserSlice>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  stats: null,

  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, user });
  },

  setUser: (user) => set({ user }),

  setStats: (stats) => set({ stats }),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, stats: null });
  },
}));
