// components/organisms/ScorePanel.tsx — From GamePanels.jsx ScorePanel.
// AGENT: Frontend.
import { PLAYER_COLORS } from "@/lib/constants";

interface Row {
  name: string;
  score: number;
  isMe?: boolean;
}

interface ScorePanelProps {
  players: Row[];
  round: number;
  target: number;
}

export function ScorePanel({ players, round, target }: ScorePanelProps) {
  return (
    <div className="c-gp c-score">
      <div className="c-gp__h">★ Puntuación</div>
      <div className="c-gp__body">
        {players.map((p, i) => (
          <div key={i} className="c-score__row">
            <div className="c-score__who">
              <div
                className="c-score__dot"
                style={{ background: PLAYER_COLORS[i % 4] }}
              />
              <span
                className={`c-score__name${p.isMe ? " c-score__name--me" : ""}`}
              >
                {p.isMe ? "Yo ✦" : p.name}
              </span>
            </div>
            <span
              className={`c-score__pts${p.isMe ? " c-score__pts--me" : ""}`}
            >
              {p.score}
            </span>
          </div>
        ))}
        <div className="c-score__round">
          <span className="c-score__round-n">Ronda {round}</span>
          <span className="c-score__round-t">Meta: {target} pts</span>
        </div>
      </div>
    </div>
  );
}
