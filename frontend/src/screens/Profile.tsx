// screens/Profile.tsx — (8) Profile. From design-reference/profile-settings.jsx.
// AGENT: Frontend. Stats are mock until GET /users/:id/stats is wired.
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ScreenWrap, NavHeader, Panel, GhostBtn } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav } from "@/lib/nav";
import { dlog } from "@/lib/debug";
import { useUserStore } from "@/store/userStore";
import { api } from "@/services/api";
import type { PlayerStats, MatchHistoryEntry } from "@shared/api";


type Tab = "stats" | "achievements" | "history";

const TABS: Array<[Tab, string]> = [
  ["stats", "Estadísticas"],
  ["achievements", "Logros"],
  ["history", "Historial"],
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


export default function Profile() {
  const go = useGameNav();
  const { userId } = useParams<{ userId: string }>();
  const me = useUserStore((s) => s.user);
  const meStats = useUserStore((s) => s.stats);

  const targetId = userId === "me" || !userId ? me?.id : userId;

  const [stats, setStats] = useState<PlayerStats | null>(
    targetId === me?.id ? meStats : null
  );
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("stats");

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.userStats(targetId),
          api.userHistory(targetId),
        ]);
        setStats(statsRes);
        // Cast or map paginated items
        setHistory(historyRes.items || []);
        if (targetId === me?.id) {
          useUserStore.getState().setStats(statsRes);
        }
      } catch (err) {
        dlog("error", "failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [targetId, me?.id]);

  const username = (targetId === me?.id ? me?.username : stats?.userId === targetId ? "Jugador" : "Usuario") || "Jugador";
  const initial = username.charAt(0).toUpperCase();

  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const gamesWon = stats?.gamesWon ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  const winRate = gamesPlayed > 0 ? `${Math.round((gamesWon / gamesPlayed) * 100)}%` : "0%";


  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const nextLevelXp = level * 1000;
  const prevLevelXp = (level - 1) * 1000;
  const levelProgress = xp - prevLevelXp;
  const xpRequired = 1000;
  const xpPercent = Math.max(0, Math.min(100, (levelProgress / xpRequired) * 100));

  const cards: Array<[string, string, string]> = [
    [String(gamesPlayed), "Partidas", "📊"],
    [String(gamesWon), "Victorias", "🏆"],
    [String(currentStreak), "Racha actual", "⚡"],
    [winRate, "Win Rate", "📈"],
  ];

  const detailsList: Array<[string, string]> = [
    ["Puntos totales", String(stats?.totalPoints ?? 0)],
    ["Mejor racha", String(stats?.bestStreak ?? 0)],
    ["Monedas", String(stats?.coins ?? 100)],
    ["Nivel", String(stats?.level ?? 1)],
    ["Puntos de liga", String(stats?.leaguePoints ?? 0)],
  ];

  if (loading && !stats) {
    return (
      <ScreenWrap>
        <NavHeader title="CARGANDO PERFIL..." onBack={() => go("menu")} />
        <div className="s-prof__body" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="u-gold-glow" style={{ fontSize: "20px" }}>Cargando datos del jugador...</div>
        </div>
      </ScreenWrap>
    );
  }

  return (
    <ScreenWrap>
      <NavHeader
        title="MI PERFIL"
        onBack={() => go("menu")}
        right={targetId === me?.id ? <GhostBtn size="sm" onClick={() => go("settings")}>EDITAR</GhostBtn> : undefined}
      />
      <div className="s-prof__body">
        <aside className="s-prof__left">
          <div className="s-prof__avatar">
            <img className="s-prof__ring" src={ASSETS.goldRing} alt="" aria-hidden />
            <div className="s-prof__av">{initial}</div>
          </div>
          <div className="s-prof__id">
            <div className="s-prof__name">{username}</div>
            <div className="s-prof__handle">@{username.toLowerCase()} · Desde 2026</div>
          </div>
          <div className="s-prof__league">
            <span className="s-prof__league-ic">👑</span>
            <div>
              <div className="s-prof__league-t">{stats?.leagueTier ?? "Bronze"}</div>
              <div className="s-prof__league-s">Liga de Dominó</div>
            </div>
          </div>
          <Panel className="s-prof__xp">
            <div className="s-prof__xp-row">
              <span className="s-prof__xp-lvl">★ Nivel {level}</span>
              <span className="s-prof__xp-n">{xp} XP</span>
            </div>
            <div className="s-prof__xp-track">
              <div className="s-prof__xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <div className="s-prof__xp-next">{nextLevelXp - xp} XP para nivel {level + 1}</div>
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
                {cards.map(([val, label, icon]) => (
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
                  {detailsList.map(([k, v]) => (
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
              {ACHIEVEMENTS.map((a) => {
                const unlocked = a.label === "Primera Victoria" ? (stats?.gamesWon ?? 0) >= 1 :
                                 a.label === "Racha de 5" ? (stats?.bestStreak ?? 0) >= 5 :
                                 a.label === "100 Partidas" ? (stats?.gamesPlayed ?? 0) >= 100 :
                                 a.unlocked;
                return (
                  <Panel key={a.label} className={`s-prof__badge${unlocked ? "" : " is-locked"}`}>
                    <div className="s-prof__badge-ic">{a.icon}</div>
                    <div className="s-prof__badge-l">{a.label}</div>
                    {!unlocked && <div className="s-prof__badge-lock">Bloqueado</div>}
                  </Panel>
                );
              })}
            </div>
          )}

          {tab === "history" && (
            <div className="s-prof__hist" key="hist">
              {history.length === 0 ? (
                <div className="s-lobby__empty">No hay partidas registradas en el historial</div>
              ) : (
                history.map((g, i) => {
                  const isWin = g.result === "win";
                  const color = isWin ? "var(--verde)" : "var(--error)";
                  return (
                    <Panel key={i} className="s-prof__game">
                      <div
                        className="s-prof__game-r"
                        style={{ background: `${color}18`, border: `1.5px solid ${color}44`, color: color }}
                      >
                        {isWin ? "WIN" : "LOSS"}
                      </div>
                      <div className="s-prof__game-info">
                        <div className="s-prof__game-vs">{g.mode.toUpperCase()} MATCH</div>
                        <div className="s-prof__game-meta">Score: {g.finalScores.teamA} - {g.finalScores.teamB}</div>
                      </div>
                      <div
                        className="s-prof__game-pts"
                        style={{ color: color }}
                      >
                        {isWin ? "+150 XP" : "+50 XP"}
                      </div>
                    </Panel>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </ScreenWrap>
  );
}
