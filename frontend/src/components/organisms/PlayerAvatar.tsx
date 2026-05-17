// components/organisms/PlayerAvatar.tsx — seat avatar with turn/me rings.
// AGENT: Frontend. From GamePanels.jsx PlayerAvatar.
interface PlayerAvatarProps {
  name: string;
  score: number;
  isActive?: boolean;
  isMe?: boolean;
  color: string;
  size?: number;
}

export function PlayerAvatar({
  name,
  score,
  isActive = false,
  isMe = false,
  color,
  size = 58,
}: PlayerAvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const discClass =
    "c-pa__disc" +
    (isActive ? " c-pa__disc--active" : isMe ? " c-pa__disc--me" : "");

  return (
    <div className="c-pa">
      <div className="c-pa__ring">
        <div
          className={discClass}
          style={{
            width: size,
            height: size,
            fontSize: size * 0.36,
            background: isMe
              ? "linear-gradient(135deg,#1a4a2e,#0E7A43)"
              : `linear-gradient(135deg,#2a1a0e,${color}55)`,
            color: isMe ? "var(--crema)" : color,
          }}
        >
          {initial}
        </div>
        {isActive && (
          <div className="c-pa__badge">{isMe ? "TU TURNO" : "JUGANDO"}</div>
        )}
      </div>
      <div style={{ marginTop: isActive ? 5 : 0 }}>
        <div
          className={`c-pa__name${isMe ? " c-pa__name--me" : ""}`}
          style={{ fontSize: size < 48 ? 10 : 12 }}
        >
          {name}
        </div>
        <div className="c-pa__score">★ {score}</div>
      </div>
    </div>
  );
}
