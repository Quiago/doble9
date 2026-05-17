// screens/Setup.tsx — (4) Single Player Setup. From setup-lobby.jsx.
// AGENT: Frontend. Selections are local UI only; backend creates the match.
import { useState } from "react";
import { ScreenWrap, NavHeader, Panel, Divider, GoldBtn } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav } from "@/lib/nav";

const DIFFS = [
  { id: "facil", label: "Fácil", color: "#0E7A43" },
  { id: "medio", label: "Medio", color: "#D4AF37" },
  { id: "dificil", label: "Difícil", color: "#F39C12" },
  { id: "experto", label: "Experto", color: "#E74C3C" },
];
const MODES = [
  { id: "clasico", label: "Clásico", sub: "Reglas estándar" },
  { id: "parejas", label: "Parejas", sub: "2 vs 2 equipos" },
  { id: "rapido", label: "Rápido", sub: "Tiempo limitado" },
];
const POINTS = [50, 100, 150, 200];
const SEAT_POS = ["s-setup__seat--top", "s-setup__seat--left", "s-setup__seat--right"];

export default function Setup() {
  const go = useGameNav();
  const [players, setPlayers] = useState(4);
  const [difficulty, setDiff] = useState("medio");
  const [mode, setMode] = useState("clasico");
  const [points, setPoints] = useState(100);
  const [tileset, setTileset] = useState("doble9");

  const summary: Array<[string, string]> = [
    ["Jugadores", `${players} (vs CPU)`],
    ["Dificultad", DIFFS.find((d) => d.id === difficulty)?.label ?? ""],
    ["Modo", MODES.find((m) => m.id === mode)?.label ?? ""],
    ["Meta", `${points} puntos`],
    ["Fichas", tileset === "doble9" ? "Doble 9 (55)" : "Doble 6 (28)"],
  ];

  return (
    <ScreenWrap>
      <NavHeader title="CONFIGURAR PARTIDA" onBack={() => go("menu")} />
      <div className="s-setup__body">
        <div className="s-setup__col">
          <Panel className="s-setup__panel">
            <div className="s-setup__label">NÚMERO DE JUGADORES</div>
            <div className="s-setup__pill-row">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={`s-setup__pn${players === n ? " is-active" : ""}`}
                  onClick={() => setPlayers(n)}
                >
                  <div className="s-setup__pn-dots">
                    {Array.from({ length: n }).map((_, i) => (
                      <div key={i} className="s-setup__pn-dot" />
                    ))}
                  </div>
                  <div className="s-setup__pn-n">{n}</div>
                  <div className="s-setup__pn-s">
                    {n === 2 ? "1 vs 1" : n === 3 ? "3 rivales" : "4 jugadores"}
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="s-setup__panel">
            <div className="s-setup__label">DIFICULTAD CPU</div>
            <div className="s-setup__diffs">
              {DIFFS.map((d) => (
                <button
                  key={d.id}
                  className="s-setup__diff"
                  onClick={() => setDiff(d.id)}
                  style={
                    difficulty === d.id
                      ? { borderColor: d.color, background: `${d.color}18`, color: d.color }
                      : undefined
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="s-setup__panel">
            <div className="s-setup__label">MODO DE JUEGO</div>
            <div className="s-setup__modes">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  className={`s-setup__mode${mode === m.id ? " is-active" : ""}`}
                  onClick={() => setMode(m.id)}
                >
                  <div>
                    <div className="s-setup__mode-l">{m.label}</div>
                    <div className="s-setup__mode-s">{m.sub}</div>
                  </div>
                  <div className="s-setup__radio">
                    {mode === m.id && <div className="s-setup__radio-i" />}
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <div className="s-setup__split">
            <Panel className="s-setup__panel">
              <div className="s-setup__label">META DE PUNTOS</div>
              <div className="s-setup__opts">
                {POINTS.map((p) => (
                  <button
                    key={p}
                    className={`s-setup__opt${points === p ? " is-active" : ""}`}
                    onClick={() => setPoints(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Panel>
            <Panel className="s-setup__panel">
              <div className="s-setup__label">JUEGO DE FICHAS</div>
              {["doble6", "doble9"].map((t) => (
                <button
                  key={t}
                  className={`s-setup__opt s-setup__opt--block${tileset === t ? " is-active" : ""}`}
                  onClick={() => setTileset(t)}
                >
                  {t === "doble6" ? "Doble 6 (28)" : "Doble 9 (55)"}
                </button>
              ))}
            </Panel>
          </div>
        </div>

        <div className="s-setup__side">
          <Panel gold style={{ padding: 20, width: "100%" }}>
            <div className="s-setup__preview-h">PREVIEW DE MESA</div>
            <div className="s-setup__diagram">
              {Array.from({ length: players - 1 }).map((_, i) => (
                <div key={i} className={`s-setup__seat ${SEAT_POS[i]}`}>
                  CPU
                </div>
              ))}
              <div className="s-setup__seat s-setup__seat--me s-setup__seat--bottom">
                Y
              </div>
              <div className="s-setup__diagram-logo">
                Doble
                <br />
                9's
              </div>
            </div>
            <Divider style={{ margin: "14px 0" }} />
            <div className="s-setup__sum">
              {summary.map(([k, v]) => (
                <div key={k} className="s-setup__sum-row">
                  <span className="s-setup__sum-k">{k}</span>
                  <span className="s-setup__sum-v">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
          <GoldBtn
            size="lg"
            fullWidth
            style={{ fontSize: 18, padding: "16px 0" }}
            onClick={() => go("game")}
          >
            ¡A JUGAR!
          </GoldBtn>
          <img
            className="s-setup__manolito"
            src={ASSETS.manolitoHold}
            alt=""
          />
        </div>
      </div>
    </ScreenWrap>
  );
}
