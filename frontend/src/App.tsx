import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { dlog } from "@/lib/debug";
import { useAuth } from "@/hooks";
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

export default function App() {
  return (
    <>
      <RouteLogger />
      <AuthBootstrap />
      <ToastContainer />
      <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/menu" element={<MainMenu />} />
      <Route path="/play/solo" element={<Setup />} />
      <Route path="/play/lobby/:code" element={<Lobby />} />
      <Route path="/play/match/:id" element={<GameTable />} />
      <Route path="/play/match/:id/results" element={<Results />} />
      <Route path="/tutorial/:level" element={<Tutorial />} />
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/store" element={<Store />} />
      <Route path="/league" element={<League />} />
      <Route path="/tournament" element={<Tournament />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
