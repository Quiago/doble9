import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { dlog } from "@/lib/debug";
import Splash from "@/screens/Splash";
import Landing from "@/screens/Landing";
import MainMenu from "@/screens/MainMenu";
import Setup from "@/screens/Setup";
import Lobby from "@/screens/Lobby";
import Results from "@/screens/Results";
import League from "@/screens/League";
import GameTable from "@/screens/GameTable";

// AGENT: Frontend — route table mirrors CLAUDE.md §4.3 screen inventory.
// Remaining screens land in Bloque B/C; placeholders keep dev green meanwhile.
function Placeholder({ name }: { name: string }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--negro)",
        color: "var(--dorado)",
        fontFamily: "var(--font-heading)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {name}
    </div>
  );
}

function RouteLogger() {
  const loc = useLocation();
  useEffect(() => {
    dlog("route", `→ ${loc.pathname}`);
  }, [loc.pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <RouteLogger />
      <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/menu" element={<MainMenu />} />
      <Route path="/play/solo" element={<Setup />} />
      <Route path="/play/lobby/:code" element={<Lobby />} />
      <Route path="/play/match/:id" element={<GameTable />} />
      <Route path="/play/match/:id/results" element={<Results />} />
      <Route path="/tutorial/:level" element={<Placeholder name="Tutorial" />} />
      <Route path="/profile/:userId" element={<Placeholder name="Profile" />} />
      <Route path="/settings" element={<Placeholder name="Settings" />} />
      <Route path="/store" element={<Placeholder name="Store" />} />
      <Route path="/league" element={<League />} />
      <Route path="/tournament" element={<Placeholder name="Tournament" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
