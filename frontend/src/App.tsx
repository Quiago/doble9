import { useEffect, type ReactElement } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { dlog } from "@/lib/debug";
import { useAuth } from "@/hooks";
import { useUiStore } from "@/store/uiStore";
import Splash from "@/screens/Splash";
import Landing from "@/screens/Landing";
import MainMenu from "@/screens/MainMenu";
import Setup from "@/screens/Setup";
import Lobby from "@/screens/Lobby";
import Results from "@/screens/Results";
import League from "@/screens/League";
import GameTable from "@/screens/GameTable";
import Tutorial from "@/screens/Tutorial";
import Profile from "@/screens/Profile";
import Settings from "@/screens/Settings";
import Store from "@/screens/Store";
import Tournament from "@/screens/Tournament";

import { ToastContainer } from "@/components";

// AGENT: Frontend — route table mirrors CLAUDE.md §4.3 screen inventory.
function RouteLogger() {
  const loc = useLocation();
  useEffect(() => {
    dlog("route", `→ ${loc.pathname}`);
  }, [loc.pathname]);
  return null;
}

/** Cold-reload auth hydration: token in localStorage → fetch /auth/me. */
function AuthBootstrap() {
  const { bootstrap } = useAuth();
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  return null;
}

/**
 * ADR-009 — route-level auth invariant. A protected screen never renders
 * without a token; instead of bouncing the user silently, we tell them why
 * (toast) and send them to Landing, which auto-opens the AuthModal and
 * remembers `from` so login returns them to where they were headed.
 */
function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  useEffect(() => {
    if (!isAuthed) {
      dlog("auth", `guard blocked ${loc.pathname} → /welcome`);
      useUiStore.getState().toast("Inicia sesión para continuar", "info");
    }
  }, [isAuthed, loc.pathname]);
  if (!isAuthed) {
    return <Navigate to="/welcome" replace state={{ from: loc.pathname }} />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <RouteLogger />
      <AuthBootstrap />
      <ToastContainer />
      <Routes>
      {/* Public — reachable without a token (boot + pre-login funnel). */}
      <Route path="/" element={<Splash />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/tutorial/:level" element={<Tutorial />} />
      {/* Protected — RequireAuth (ADR-009). Tutorial stays public as a
          try-before-signup demo; everything below needs a session. */}
      <Route path="/menu" element={<RequireAuth><MainMenu /></RequireAuth>} />
      <Route path="/play/solo" element={<RequireAuth><Setup /></RequireAuth>} />
      <Route path="/play/lobby/:code" element={<RequireAuth><Lobby /></RequireAuth>} />
      <Route path="/play/match/:id" element={<RequireAuth><GameTable /></RequireAuth>} />
      <Route path="/play/match/:id/results" element={<RequireAuth><Results /></RequireAuth>} />
      <Route path="/profile/:userId" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/store" element={<RequireAuth><Store /></RequireAuth>} />
      <Route path="/league" element={<RequireAuth><League /></RequireAuth>} />
      <Route path="/tournament" element={<RequireAuth><Tournament /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
