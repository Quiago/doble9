// screens/GameTable.tsx — (6) Game Table SHELL. Header + side panels in
// React/DOM; the wood table, chain, drop zones, hand dock and Pollona overlay
// render in the Phaser canvas mounted at .s-game__canvas (Bloque C).
// AGENT: Frontend. From game-screen.jsx + GamePanels.jsx.
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { GameManager } from "@/game/GameManager";
import {
  Logo,
  OnlineDot,
  RedBtn,
  ScorePanel,
  ChatPanel,
  TipsPanel,
  MesaInfoPanel,
  RotateHint,
  type ChatMsg,
} from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav } from "@/lib/nav";
import { useGameStore } from "@/store/gameStore";
import { useUserStore } from "@/store/userStore";
import { dispatcher } from "@/store/dispatcher";
import { A } from "@/store/types";

const TIPS = [
  "El doble 9 puede cambiar la partida en el último momento.",
  "¡Cuidado! Guarda fichas altas para capicúa.",
  "La pollona da el doble de puntos — ¡sorprende!",
  "Observa las fichas jugadas para anticipar rivales.",
];

const hhmm = (ts: number) =>
  new Date(ts).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function GameTable() {
  const go = useGameNav();
  const { id } = useParams<{ id: string }>();
  const matchId = id ?? "mock-match";

  const game = useGameStore((s) => s.game);
  const chat = useGameStore((s) => s.chat);
  const meId = useUserStore((s) => s.user?.id) ?? "u-yo";
  const [tipIdx, setTipIdx] = useState(0);
  const [roundEnd, setRoundEnd] = useState<any>(null);
  const [matchEnd, setMatchEnd] = useState<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // Derived: should show "No Llevo" button?
  const myTurn = game?.turn?.userId === meId;
  const canPass = (() => {
    if (!myTurn || !game || game.status !== "PLAYING") return false;
    const hand = game.hand ?? [];
    if (hand.length === 0) return false;
    const { leftEnd, rightEnd } = game.board;
    // Empty board → any tile can be played
    if (leftEnd == null && rightEnd == null) return false;
    const hasPlayable = hand.some((id) => {
      const [a, b] = id.split("-").map(Number);
      return a === leftEnd || b === leftEnd || a === rightEnd || b === rightEnd;
    });
    return !hasPlayable;
  })();

  // Join on mount → transport replies with an authoritative game_state.
  useEffect(() => {
    dispatcher.dispatch({ type: A.JOIN_LOBBY, payload: { matchId } });
  }, [matchId]);

  // Listen for end events
  useEffect(() => {
    const unsubs = [
      dispatcher.on("turn_changed", () => setTipIdx((n) => n + 1)),
      dispatcher.on("round_end", (p) => {
        setRoundEnd(p);
        useGameStore.getState().applyScores((p as any).scores);
        setTimeout(() => setRoundEnd(null), 5000); // Auto-hide after 5s
      }),
      dispatcher.on("match_end", (p) => {
        setMatchEnd(p);
        useGameStore.getState().applyScores((p as any).scores);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Mount the Phaser engine (boundary = Dispatcher only, ADR-002).
  useEffect(() => {
    if (!mountRef.current) return;
    const gm = new GameManager(mountRef.current);
    return () => gm.destroy();
  }, []);

  const handlePass = () => {
    dispatcher.dispatch({ type: A.PASS, payload: { matchId } });
  };

  const players = game?.players ?? [];
  const scoreRows = players.map((p) => ({
    name: p.name,
    score: game ? game.scores[p.team] : 0,
    isMe: p.userId === meId,
  }));

  const messages: ChatMsg[] = chat.map((c) => ({
    seat: c.bySeat,
    name: players[c.bySeat]?.name ?? `P${c.bySeat + 1}`,
    text: c.message,
    time: hhmm(c.timestamp),
    isMe: c.userId === meId,
  }));

  return (
    <div className="s-game">
      <RotateHint />
      <div className="s-game__header">
        <div className="s-game__header-l">
          <Logo size="sm" />
          <OnlineDot label="Partida en vivo" />
        </div>
        <div className="s-game__round">
          RONDA {game?.round ?? 1} · META: {game?.targetScore ?? 100} PTS
        </div>
        <div className="s-game__header-r">
          <button className="s-game__icbtn" aria-label="Sonido">
            🔊
          </button>
          <button className="s-game__icbtn" aria-label="Ayuda">
            ?
          </button>
          <RedBtn size="sm" onClick={() => go("menu")}>
            ABANDONAR
          </RedBtn>
        </div>
      </div>

      <div className="s-game__stage">
        {/* Phaser TableScene renders the wood mesa, chain, drop zones,
            opponents, hand dock + Pollona/Capicúa here (ADR-002). */}
        <div ref={mountRef} className="c-game-canvas" />

        {/* "No Llevo" pass-turn button — visible only when canPass is true */}
        {canPass && (
          <div className="s-game__pass-overlay">
            <button
              id="btn-no-llevo"
              className="s-game__pass-btn"
              onClick={handlePass}
            >
              <span className="s-game__pass-icon">🚫</span>
              <span className="s-game__pass-label">NO LLEVO</span>
              <span className="s-game__pass-hint">
                No tienes fichas para jugar
              </span>
            </button>
          </div>
        )}

        {/* Round End Overlay */}
        {roundEnd && (
          <div className="s-game__end-overlay" style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, color: "#fff", animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontSize: "3rem", color: "#e4b443", textTransform: "uppercase", marginBottom: "0.5rem", textShadow: "0 2px 10px rgba(228,180,67,0.5)" }}>
              {roundEnd.winnerTeam === null ? "Ronda Trancada" : `¡Gana el Equipo ${roundEnd.winnerTeam}!`}
            </h2>
            <p style={{ fontSize: "1.5rem", marginBottom: "2rem", opacity: 0.9 }}>
              {roundEnd.kind === "TRANQUE" ? "Tranque resuelto por conteo." : "¡Se pegaron!"}
            </p>
            <div style={{ fontSize: "4rem", fontWeight: 900, color: "#1bd96a", background: "rgba(27,217,106,0.1)", padding: "1rem 3rem", borderRadius: "20px", border: "2px solid rgba(27,217,106,0.3)" }}>
              +{roundEnd.points} PTS
            </div>
            <p style={{ marginTop: "2rem", color: "#aaa", fontSize: "0.9rem" }}>Próxima ronda comenzando en breve...</p>
          </div>
        )}

        {/* Match End Overlay */}
        {matchEnd && (
          <div className="s-game__end-overlay" style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 200, color: "#fff", animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🏆</div>
            <h1 style={{ fontSize: "4rem", color: "#e4b443", textTransform: "uppercase", marginBottom: "1rem", textShadow: "0 0 20px rgba(228,180,67,0.6)" }}>
              ¡Fin de la Partida!
            </h1>
            <h2 style={{ fontSize: "2rem", marginBottom: "3rem" }}>
              Ganador: Equipo {matchEnd.winnerTeam}
            </h2>
            <div style={{ display: "flex", gap: "2rem", marginBottom: "4rem" }}>
              <div style={{ textAlign: "center", padding: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "16px", minWidth: "150px" }}>
                <div style={{ color: "#aaa", marginBottom: "0.5rem" }}>Equipo 0</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 900 }}>{matchEnd.scores[0]}</div>
              </div>
              <div style={{ textAlign: "center", padding: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "16px", minWidth: "150px" }}>
                <div style={{ color: "#aaa", marginBottom: "0.5rem" }}>Equipo 1</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 900 }}>{matchEnd.scores[1]}</div>
              </div>
            </div>
            <button
              onClick={() => go("menu")}
              style={{ padding: "1rem 3rem", fontSize: "1.2rem", fontWeight: 700, background: "#e4b443", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              VOLVER AL MENÚ
            </button>
          </div>
        )}

        <div className="s-game__ov s-game__ov--l">
          <ScorePanel
            players={scoreRows}
            round={game?.round ?? 1}
            target={game?.targetScore ?? 100}
          />
          <ChatPanel messages={messages} />
        </div>

        <div className="s-game__ov s-game__ov--r">
          <MesaInfoPanel
            online={players.filter((p) => p.connected).length || 4}
            capacity={players.length || 4}
            target={game?.targetScore ?? 100}
          />
          <TipsPanel
            tips={TIPS}
            tipIndex={tipIdx}
            manolitoImg={ASSETS.manolitoHold}
          />
        </div>
      </div>
    </div>
  );
}
