// screens/Profile.tsx — (8) Profile. From design-reference/profile-settings.jsx.
// AGENT: Frontend. Stats are mock until GET /users/:id/stats is wired.
import { useState } from "react";
import { ScreenWrap, NavHeader, Panel, GhostBtn } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav } from "@/lib/nav";
import { dlog } from "@/lib/debug";

type Tab = "stats" | "achievements" | "history";

const TABS: Array<[Tab, string]> = [
  ["stats", "Estadísticas"],
  ["achievements", "Logros"],
  ["history", "Historial"],
];

const STAT_CARDS: Array<[string, string, string]> = [
  ["234", "Partidas", "📊"],
  ["156", "Victorias", "🏆"],
  ["7", "Racha actual", "⚡"],
  ["66%", "Win Rate", "📈"],
];

const DETAILS: Array<[string, string]> = [
  ["Capicúas", "38"],
  ["Pollonas", "12"],
  ["Puntos totales", "48,240"],
  ["Fichas jugadas", "2,180"],
  ["Torneos ganados", "2"],
  ["Mejor racha", "12"],
];

const ACHIEVEMENTS = [
  { icon: "🏆", label: "Primera Victoria", unlocked: true },
  { icon: "⚡", label: "Racha de 5", unlocked: true },
  { icon: "✦", label: "Capicúa Pro", unlocked: true },
  { icon: "🐔", label: "Pollona Master", unlocked: true },
  { icon: "🎯", label: "100 Partidas", unlocked: false },
  { icon: "💎", label: "Liga Diamante", unlocked: false },
  { icon: "🌍", label: "Global Player", unlocked: false },
  { icon: "👑", label: "Campeón Torneo", unlocked: false },
];

const RECENT = [
  { result: "Victoria", opponent: "Luisito", score: "78-42", mode: "Clásico", pts: "+180 XP", color: "#0E7A43" },
  { result: "Derrota", opponent: "Maritza", score: "31-100", mode: "Parejas", pts: "-20 XP", color: "#E74C3C" },
  { result: "Victoria", opponent: "El Tigre", score: "100-55", mode: "Rápido", pts: "+140 XP", color: "#0E7A43" },
  { result: "Victoria", opponent: "Carlos", score: "100-72", mode: "Clásico", pts: "+160 XP", color: "#0E7A43" },
];

export default function Profile() {
  const go = useGameNav();
  const [tab, setTab] = useState<Tab>("stats");

  return (
    <ScreenWrap>
      <NavHeader
        title="MI PERFIL"
        onBack={() => go("menu")}
        right={<GhostBtn size="sm" onClick={() => go("settings")}>EDITAR</GhostBtn>}
      />
      <div className="s-prof__body">
        <aside className="s-prof__left">
          <div className="s-prof__avatar">
            <img className="s-prof__ring" src={ASSETS.goldRing} alt="" aria-hidden />
            <div className="s-prof__av">Y</div>
          </div>
          <div className="s-prof__id">
            <div className="s-prof__name">Jugador</div>
            <div className="s-prof__handle">@jugador_pro · Desde 2024</div>
          </div>
          <div className="s-prof__league">
            <span className="s-prof__league-ic">👑</span>
            <div>
              <div className="s-prof__league-t">Gold I</div>
              <div className="s-prof__league-s">Liga Dorada</div>
            </div>
          </div>
          <Panel className="s-prof__xp">
            <div className="s-prof__xp-row">
              <span className="s-prof__xp-lvl">★ Nivel 12</span>
              <span className="s-prof__xp-n">4,820 / 6,000 XP</span>
            </div>
            <div className="s-prof__xp-track">
              <div className="s-prof__xp-fill" style={{ width: "80%" }} />
            </div>
            <div className="s-prof__xp-next">1,180 XP para nivel 13</div>
          </Panel>
        </aside>

        <section className="s-prof__right">
          <div className="s-prof__tabs">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                className={`s-prof__tab${tab === id ? " is-active" : ""}`}
                onClick={() => {
                  dlog("ui", `profile tab=${id}`);
                  setTab(id);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "stats" && (
            <div className="s-prof__stats" key="stats">
              <div className="s-prof__cards">
                {STAT_CARDS.map(([val, label, icon]) => (
                  <Panel key={label} gold className="s-prof__card">
                    <div className="s-prof__card-ic">{icon}</div>
                    <div className="s-prof__card-v">{val}</div>
                    <div className="s-prof__card-l">{label}</div>
                  </Panel>
                ))}
              </div>
              <Panel className="s-prof__details">
                <div className="s-prof__section-h">DETALLES</div>
                <div className="s-prof__detail-grid">
                  {DETAILS.map(([k, v]) => (
                    <div key={k} className="s-prof__detail">
                      <span className="s-prof__detail-k">{k}</span>
                      <span className="s-prof__detail-v">{v}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {tab === "achievements" && (
            <div className="s-prof__ach" key="ach">
              {ACHIEVEMENTS.map((a) => (
                <Panel key={a.label} className={`s-prof__badge${a.unlocked ? "" : " is-locked"}`}>
                  <div className="s-prof__badge-ic">{a.icon}</div>
                  <div className="s-prof__badge-l">{a.label}</div>
                  {!a.unlocked && <div className="s-prof__badge-lock">Bloqueado</div>}
                </Panel>
              ))}
            </div>
          )}

          {tab === "history" && (
            <div className="s-prof__hist" key="hist">
              {RECENT.map((g, i) => (
                <Panel key={i} className="s-prof__game">
                  <div
                    className="s-prof__game-r"
                    style={{ background: `${g.color}18`, border: `1.5px solid ${g.color}44`, color: g.color }}
                  >
                    {g.result === "Victoria" ? "WIN" : "LOSS"}
                  </div>
                  <div className="s-prof__game-info">
                    <div className="s-prof__game-vs">vs {g.opponent}</div>
                    <div className="s-prof__game-meta">{g.mode} · {g.score}</div>
                  </div>
                  <div
                    className="s-prof__game-pts"
                    style={{ color: g.result === "Victoria" ? "var(--verde)" : "var(--error)" }}
                  >
                    {g.pts}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>
      </div>
    </ScreenWrap>
  );
}
