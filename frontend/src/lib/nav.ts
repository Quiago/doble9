// lib/nav.ts — maps the prototype's nav vocabulary to router paths so screens
// stay faithful to design-reference. AGENT: Frontend.
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export type NavKey =
  | "splash"
  | "landing"
  | "menu"
  | "setup"
  | "lobby"
  | "game"
  | "results"
  | "tutorial"
  | "profile"
  | "settings"
  | "store"
  | "league"
  | "tournament";

const PATHS: Record<NavKey, string> = {
  splash: "/",
  landing: "/welcome",
  menu: "/menu",
  setup: "/play/solo",
  lobby: "/play/lobby/NEW",
  game: "/play/match/mock-match",
  results: "/play/match/mock-match/results",
  tutorial: "/tutorial/1",
  profile: "/profile/me",
  settings: "/settings",
  store: "/store",
  league: "/league",
  tournament: "/tournament",
};

export function pathFor(key: NavKey): string {
  return PATHS[key] ?? "/";
}

/** `const go = useGameNav(); go("menu")` — mirrors prototype `navigate(key)`.
 *  Stable identity (useCallback): effects depending on it (e.g. Splash's
 *  rAF→navigate) must not re-run every render. */
export function useGameNav() {
  const navigate = useNavigate();
  return useCallback(
    (key: NavKey) => navigate(pathFor(key)),
    [navigate],
  );
}
