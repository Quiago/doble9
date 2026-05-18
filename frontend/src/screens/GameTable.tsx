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
  const mountRef = useRef<HTMLDivElement>(null);

  // Join on mount → transport replies with an authoritative game_state.
  useEffect(() => {
    dispatcher.dispatch({ type: A.JOIN_LOBBY, payload: { matchId } });
  }, [matchId]);

  // Mount the Phaser engine (boundary = Dispatcher only, ADR-002).
  useEffect(() => {
    if (!mountRef.current) return;
    const gm = new GameManager(mountRef.current);
    return () => gm.destroy();
  }, []);

  // Advance Manolito's tip every turn change (decoupled via the bus).
  useEffect(
    () => dispatcher.on("turn_changed", () => setTipIdx((n) => n + 1)),
    [],
  );

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
