// screens/Results.tsx — (11) Results. From results-league.jsx.
// AGENT: Frontend. `won` arrives via router state; defaults to win in mock.
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Panel, Divider, GoldBtn, GhostBtn } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav } from "@/lib/nav";

const PCOL = ["#3498DB", "#E91E63", "#D4AF37", "#F39C12"];
const DEFAULT_PLAYERS = [
  { name: "Luisito", score: 78 },
  { name: "Maritza", score: 55 },
  { name: "Yo", score: 100 },
  { name: "El Tigre", score: 42 },
];

export default function Results() {
  const go = useGameNav();
  const state = (useLocation().state ?? {}) as {
    won?: boolean;
    players?: Array<{ name: string; score: number }>;
  };
  const won = state.won !== false;
  const players = state.players ?? DEFAULT_PLAYERS;

  const coins = useMemo(
    () =>
      Array.from({ length: 16 }).map(() => ({
        x: 20 + Math.random() * 60,
        delay: Math.random() * 1.5,
        dur: 1.2 + Math.random() * 0.8,
      })),
    [],
  );

  const ranked = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={`s-results ${won ? "s-results--win" : "s-results--lose"}`}>
      <div className="s-results__tex" />

      {won &&
        coins.map((c, i) => (
          <div
            key={i}
            className="s-results__coin"
            style={{
              left: `${c.x}%`,
              animation: `coinFall ${c.dur}s ${c.delay}s ease-in infinite`,
            }}
          />
        ))}

      <div className="s-results__hd">
        <div
          className={`s-results__title ${won ? "s-results__title--win" : "s-results__title--lose"}`}
        >
          {won ? "¡GANASTE!" : "PERDISTE"}
        </div>
        <div className="s-results__sub">
          {won
            ? "La mesa es tuya, campeón. ¡Eso se juega!"
            : "La próxima es la tuya. ¡No te rajes!"}
        </div>
      </div>

      <img
        className={`s-results__manolito ${won ? "s-results__manolito--win" : "s-results__manolito--lose"}`}
        src={won ? ASSETS.manolitoWave : ASSETS.manolitoSurp}
        alt="Manolito"
      />

      {won && (
        <div className="s-results__badges">
          {([
            ["✦ Capicúa", "#D4AF37"],
            ["🐔 Pollona", "#E74C3C"],
          ] as const).map(([label, color]) => (
            <div
              key={label}
              className="s-results__badge"
              style={{ background: `${color}18`, border: `1.5px solid ${color}44`, color }}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      <Panel gold className="s-results__panel">
        <div className="s-results__panel-h">PUNTUACIÓN FINAL</div>
        <div className="s-results__rows">
          {ranked.map((p, i) => {
            const orig = players.findIndex((x) => x.name === p.name);
            const isMe = p.name === "Yo";
            return (
              <div
                key={p.name}
                className={`s-results__row${isMe ? " s-results__row--me" : ""}`}
              >
                <div
                  className={`s-results__rank${i === 0 ? " s-results__rank--first" : ""}`}
                >
                  #{i + 1}
                </div>
                <div
                  className="s-results__av"
                  style={{
                    background: `${PCOL[orig]}22`,
                    border: `1.5px solid ${PCOL[orig]}`,
                    color: PCOL[orig],
                  }}
                >
                  {p.name.charAt(0)}
                </div>
                <div className="s-results__pname">{p.name}</div>
                <div className="s-results__pscore">{p.score}</div>
                <div className="s-results__pts">pts</div>
              </div>
            );
          })}
        </div>
        <Divider gold style={{ margin: "12px 0 10px" }} />
        <div className="s-results__xp">
          <div className="s-results__xp-k">XP ganados</div>
          <div className="s-results__xp-v">+{won ? 250 : 80} XP</div>
        </div>
      </Panel>

      <div className="s-results__cta">
        <GoldBtn size="lg" onClick={() => go("game")}>
          JUGAR DE NUEVO
        </GoldBtn>
        <GhostBtn size="md" onClick={() => go("menu")}>
          MENÚ PRINCIPAL
        </GhostBtn>
      </div>
    </div>
  );
}
