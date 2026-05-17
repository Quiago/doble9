import { Routes, Route, Navigate } from "react-router-dom";

// AGENT: Frontend — route table mirrors CLAUDE.md §4.3 screen inventory.
// Screens land in Bloque B/C; placeholders keep `npm run dev` green meanwhile.
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder name="Splash" />} />
      <Route path="/welcome" element={<Placeholder name="Landing" />} />
      <Route path="/menu" element={<Placeholder name="Main Menu" />} />
      <Route path="/play/solo" element={<Placeholder name="Single Setup" />} />
      <Route path="/play/lobby/:code" element={<Placeholder name="Lobby" />} />
      <Route path="/play/match/:id" element={<Placeholder name="Game Table" />} />
      <Route path="/play/match/:id/results" element={<Placeholder name="Results" />} />
      <Route path="/tutorial/:level" element={<Placeholder name="Tutorial" />} />
      <Route path="/profile/:userId" element={<Placeholder name="Profile" />} />
      <Route path="/settings" element={<Placeholder name="Settings" />} />
      <Route path="/store" element={<Placeholder name="Store" />} />
      <Route path="/league" element={<Placeholder name="League" />} />
      <Route path="/tournament" element={<Placeholder name="Tournament" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
