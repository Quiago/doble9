// screens/League.tsx — (12) League. From results-league.jsx.
// AGENT: Frontend. Standings are mock until GET /leaderboard is wired.
import { ScreenWrap, NavHeader, Panel } from "@/components";
import { useGameNav } from "@/lib/nav";

const TIERS = [
  { name: "Bronce", color: "#CD7F32", icon: "🥉", players: "12.4K", current: false },
  { name: "Plata", color: "#C0C0C0", icon: "🥈", players: "8.1K", current: false },
  { name: "Oro", color: "#D4AF37", icon: "🏆", players: "3.2K", current: true },
  { name: "Platino", color: "#5DADE2", icon: "💫", players: "980", current: false },
  { name: "Diamante", color: "#52D9F5", icon: "💎", players: "142", current: false },
];

const LEADERS = [
  { rank: 1, name: "ElCampeón99", pts: 4820, change: 2, me: false },
  { rank: 2, name: "DobleRey", pts: 4750, change: 0, me: false },
  { rank: 3, name: "MaestroFicha", pts: 4680, change: -1, me: false },
  { rank: 4, name: "CubaLinda", pts: 4510, change: 3, me: false },
  { rank: 5, name: "Jugador", pts: 4320, change: 1, me: true },
  { rank: 6, name: "LaTigresa", pts: 4290, change: -2, me: false },
  { rank: 7, name: "PipaGold", pts: 4200, change: 4, me: false },
  { rank: 8, name: "El7mares", pts: 4080, change: 0, me: false },
  { rank: 9, name: "DominoPro", pts: 3960, change: -1, me: false },
  { rank: 10, name: "LaReina", pts: 3890, change: 2, me: false },
];

const DAYS_LEFT = 14;
const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_COLORS: Record<number, string> = { 1: "#D4AF37", 2: "#C0C0C0", 3: "#CD7F32" };

export default function League() {
  const go = useGameNav();
  const me = LEADERS.find((l) => l.me)!;

  const changeColor = (c: number) =>
    c > 0 ? "var(--verde)" : c < 0 ? "var(--error)" : "rgba(247,241,227,0.3)";
  const changeText = (c: number) =>
    c > 0 ? `+${c}` : c === 0 ? "—" : String(c);

  return (
    <ScreenWrap>
      <NavHeader
        title="LIGA"
        onBack={() => go("menu")}
        right={
          <div className="s-league__season">
            <div>TEMPORADA 7</div>
            <div className="s-league__season-d">{DAYS_LEFT}d restantes</div>
          </div>
        }
      />
      <div className="s-league__body">
        <div className="s-league__left">
          <div className="s-league__lbl">Divisiones</div>
          {[...TIERS].reverse().map((t) => (
            <div
              key={t.name}
              className="s-league__tier"
              style={
                t.current
                  ? {
                      background: `${t.color}18`,
                      borderColor: `${t.color}66`,
                      boxShadow: `0 4px 20px ${t.color}22`,
                    }
                  : undefined
              }
            >
              <span className="s-league__tier-ic">{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div
                  className="s-league__tier-n"
                  style={t.current ? { color: t.color } : undefined}
                >
                  {t.name}
                  {t.current ? " I" : ""}
                </div>
                <div className="s-league__tier-p">{t.players} jugadores</div>
              </div>
              {t.current && (
                <div
                  className="s-league__tier-tag"
                  style={{
                    color: t.color,
                    background: `${t.color}18`,
                    border: `1px solid ${t.color}44`,
                  }}
                >
                  TÚ
                </div>
              )}
            </div>
          ))}

          <Panel className="s-league__timer">
            <div className="s-league__timer-h">FIN DE TEMPORADA</div>
            <div className="s-league__timer-v">{DAYS_LEFT}d 6h</div>
            <div className="s-league__track">
              <div
                className="s-league__fill"
                style={{ width: `${100 - (DAYS_LEFT / 30) * 100}%` }}
              />
            </div>
            <div className="s-league__timer-n">
              Temporada termina en 14 días
            </div>
          </Panel>
        </div>

        <div className="s-league__right">
          <Panel gold className="s-league__mypos">
            <div className="s-league__mypos-h">TU POSICIÓN</div>
            <div className="s-league__mypos-row">
              <div className="s-league__mypos-rank">#{me.rank}</div>
              <div>
                <div className="s-league__mypos-tier">Oro I</div>
                <div className="s-league__mypos-sub">
                  {me.pts.toLocaleString()} puntos · +{me.change} posiciones
                </div>
              </div>
              <div className="s-league__next">
                <div className="s-league__next-k">Para Platino I</div>
                <div className="s-league__next-bar">
                  <div className="s-league__fill" style={{ width: "84%" }} />
                </div>
                <div className="s-league__next-n">680 pts restantes</div>
              </div>
            </div>
          </Panel>

          <div className="s-league__board">
            {LEADERS.map((l) => (
              <div
                key={l.rank}
                className={`s-league__entry${l.me ? " s-league__entry--me" : ""}`}
              >
                <div
                  className="s-league__erank"
                  style={{
                    fontSize: l.rank <= 3 ? 18 : 14,
                    color: RANK_COLORS[l.rank] ?? "rgba(247,241,227,0.35)",
                  }}
                >
                  {l.rank <= 3 ? MEDALS[l.rank - 1] : `#${l.rank}`}
                </div>
                <div className="s-league__eav">{l.name.charAt(0)}</div>
                <div className="s-league__ename">
                  {l.name}
                  {l.me && " (Tú)"}
                </div>
                <div
                  className="s-league__echange"
                  style={{ color: changeColor(l.change) }}
                >
                  {changeText(l.change)}
                </div>
                <div className="s-league__epts">
                  {l.pts.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScreenWrap>
  );
}
