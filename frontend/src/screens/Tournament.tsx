// screens/Tournament.tsx — (13) Tournament. From design-reference/tournament.jsx.
// AGENT: Frontend. Bracket/schedule are mock until tournament endpoints exist.
import { useState } from "react";
import { ScreenWrap, NavHeader, Panel, GoldBtn } from "@/components";
import { useGameNav } from "@/lib/nav";
import { dlog } from "@/lib/debug";

type Tab = "activo" | "schedule" | "prizes";

interface Match {
  p1: string;
  p2: string;
  winner: string | null;
  score: string | null;
  me?: boolean;
}

const BRACKET: Record<"quarterfinals" | "semifinals" | "final", Match[]> = {
  quarterfinals: [
    { p1: "ElCampeón99", p2: "DobleRey", winner: "ElCampeón99", score: "100-78" },
    { p1: "MaestroFicha", p2: "CubaLinda", winner: "CubaLinda", score: "100-65" },
    { p1: "Jugador", p2: "LaTigresa", winner: null, score: null, me: true },
    { p1: "PipaGold", p2: "El7mares", winner: "PipaGold", score: "100-82" },
  ],
  semifinals: [
    { p1: "ElCampeón99", p2: "CubaLinda", winner: "ElCampeón99", score: "100-71" },
    { p1: "TBD", p2: "PipaGold", winner: null, score: null },
  ],
  final: [{ p1: "ElCampeón99", p2: "TBD", winner: null, score: null }],
};

const UPCOMING = [
  { time: "HOY 20:00", opponent: "LaTigresa", mode: "Clásico", pts: 100, prize: "🏆 +800 XP" },
  { time: "MAÑ 18:00", opponent: "TBD", mode: "Clásico", pts: 100, prize: "🏆 +1,200 XP" },
  { time: "DOM 15:00", opponent: "FINAL", mode: "Clásico", pts: 100, prize: "💎 50 + Trofeo" },
];

const PRIZES = [
  { place: "1° Lugar", reward: "💎 100 + Trofeo Copa D9", color: "#D4AF37", icon: "🥇" },
  { place: "2° Lugar", reward: "💎 40 + Medalla Plata", color: "#C0C0C0", icon: "🥈" },
  { place: "3–4° Lugar", reward: "💎 15 + Badge Bronce", color: "#CD7F32", icon: "🥉" },
  { place: "Top 8", reward: "🪙 2,000 monedas", color: "#5DADE2", icon: "⭐" },
  { place: "Participar", reward: "🪙 500 + 150 XP", color: "#0E7A43", icon: "✦" },
  { place: "Capicúa", reward: "+250 XP bonus", color: "#9B59B6", icon: "✦" },
];

const TABS: Array<[Tab, string]> = [
  ["activo", "Bracket"],
  ["schedule", "Calendario"],
  ["prizes", "Premios"],
];

function BracketMatch({ match }: { match: Match }) {
  const isActive = !match.winner && match.p1 !== "TBD" && match.p2 !== "TBD";
  const cls = match.me ? "is-mine" : isActive ? "is-active" : "";
  return (
    <div className={`s-tour__match ${cls}`}>
      {[match.p1, match.p2].map((player, i) => {
        const isWinner = player === match.winner;
        const isMe = player === "Jugador";
        return (
          <div
            key={i}
            className={`s-tour__slot${isWinner ? " is-winner" : ""}${i === 1 ? " s-tour__slot--b" : ""}`}
          >
            <span className="s-tour__slot-l">
              <span className={`s-tour__slot-av${isMe ? " is-me" : ""}`}>{player.charAt(0)}</span>
              <span
                className={`s-tour__slot-n${isWinner ? " is-winner" : ""}${isMe ? " is-me" : ""}${player === "TBD" ? " is-tbd" : ""}`}
              >
                {player}
              </span>
            </span>
            {isWinner && <span className="s-tour__check">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function Tournament() {
  const go = useGameNav();
  const [tab, setTab] = useState<Tab>("activo");
  const [registered, setRegistered] = useState(false);

  return (
    <ScreenWrap>
      <NavHeader
        title="TORNEO"
        onBack={() => go("menu")}
        right={
          <div className="s-tour__head">
            <div className="s-tour__live">● EN VIVO</div>
            <div>Copa Doble 9</div>
          </div>
        }
      />

      <div className="s-tour__hero">
        <div className="s-tour__hero-l">
          <div className="s-tour__hero-ic">🏆</div>
          <div>
            <div className="s-tour__hero-t">Copa Doble 9 — Semana 21</div>
            <div className="s-tour__hero-s">8 jugadores · Clásico · Meta 100 pts · Eliminación directa</div>
            <div className="s-tour__hero-tags">
              <span className="s-tour__chip s-tour__chip--green">
                <span className="s-tour__chip-dot" />En Curso
              </span>
              <span className="s-tour__chip s-tour__chip--gold">Cuartos de Final</span>
            </div>
          </div>
        </div>
        <div className="s-tour__prize">
          <div className="s-tour__prize-h">Premio</div>
          <div className="s-tour__prize-v">💎 100</div>
          <div className="s-tour__prize-s">+ Trofeo Copa D9</div>
        </div>
        {!registered ? (
          <GoldBtn onClick={() => setRegistered(true)}>UNIRSE AL TORNEO</GoldBtn>
        ) : (
          <div className="s-tour__reg">
            <div className="s-tour__reg-t">✓ REGISTRADO</div>
            <div className="s-tour__reg-s">Próximo: HOY 20:00</div>
          </div>
        )}
      </div>

      <div className="s-tour__tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={`s-tour__tab${tab === id ? " is-active" : ""}`}
            onClick={() => {
              dlog("ui", `tournament tab=${id}`);
              setTab(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="s-tour__body">
        {tab === "activo" && (
          <div className="s-tour__activo" key="bracket">
            <Panel className="s-tour__bracket">
              <div className="s-tour__section-h">CUADRO DE COMPETICIÓN</div>
              <div className="s-tour__rounds">
                <div className="s-tour__round">
                  <div className="s-tour__round-h">CUARTOS</div>
                  <div className="s-tour__round-col">
                    {BRACKET.quarterfinals.map((m, i) => <BracketMatch key={i} match={m} />)}
                  </div>
                </div>
                <div className="s-tour__round">
                  <div className="s-tour__round-h">SEMIS</div>
                  <div className="s-tour__round-col s-tour__round-col--sf">
                    {BRACKET.semifinals.map((m, i) => <BracketMatch key={i} match={m} />)}
                  </div>
                </div>
                <div className="s-tour__round">
                  <div className="s-tour__round-h">FINAL</div>
                  <div className="s-tour__round-col s-tour__round-col--f">
                    {BRACKET.final.map((m, i) => <BracketMatch key={i} match={m} />)}
                  </div>
                </div>
                <div className="s-tour__round s-tour__round--champ">
                  <div className="s-tour__round-h">CAMPEÓN</div>
                  <div className="s-tour__trophy">🏆</div>
                </div>
              </div>
            </Panel>

            <Panel gold className="s-tour__next">
              <div className="s-tour__section-h">TU PRÓXIMO PARTIDO</div>
              <div className="s-tour__next-row">
                <div className="s-tour__next-vs">
                  <span className="s-tour__next-av is-me">Y</span>
                  <span className="s-tour__next-name is-me">Jugador</span>
                  <span className="s-tour__next-x">VS</span>
                  <span className="s-tour__next-av" style={{ background: "rgba(233,30,99,0.2)", borderColor: "rgba(233,30,99,0.4)", color: "#E91E63" }}>L</span>
                  <span className="s-tour__next-name">LaTigresa</span>
                </div>
                <div className="s-tour__next-when">
                  <div className="s-tour__next-time">HOY 20:00</div>
                  <div className="s-tour__next-stage">Cuartos de Final</div>
                </div>
                <GoldBtn size="sm" onClick={() => go("game")}>IR A LA MESA</GoldBtn>
              </div>
            </Panel>
          </div>
        )}

        {tab === "schedule" && (
          <div className="s-tour__schedule" key="schedule">
            {UPCOMING.map((u, i) => (
              <Panel key={i} className="s-tour__sched">
                <div className="s-tour__sched-time">{u.time}</div>
                <div className="s-tour__sched-info">
                  <div className="s-tour__sched-vs">vs {u.opponent}</div>
                  <div className="s-tour__sched-meta">{u.mode} · {u.pts} pts</div>
                </div>
                <div className="s-tour__sched-prize">{u.prize}</div>
              </Panel>
            ))}
          </div>
        )}

        {tab === "prizes" && (
          <div className="s-tour__prizes" key="prizes">
            {PRIZES.map((p) => (
              <Panel key={p.place} className="s-tour__pcard">
                <div className="s-tour__pcard-ic">{p.icon}</div>
                <div className="s-tour__pcard-place" style={{ color: p.color }}>{p.place}</div>
                <div className="s-tour__pcard-reward">{p.reward}</div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </ScreenWrap>
  );
}
