// components/molecules/DominoTile.tsx — DOM domino tile for non-canvas screens
// (Tutorial visuals). The in-match board lives in Phaser; this is the React
// twin recreated pixel-faithfully from docs/design-reference/DominoTile.jsx.
// AGENT: Frontend. Pips + body read design tokens (tokens.css), no Tailwind.
import type { CSSProperties } from "react";

type Orientation = "vertical" | "horizontal";

/** Pip positions per value, as [x%, y%] (from DominoTile.jsx PIP_LAYOUTS). */
const PIP_LAYOUTS: Record<number, Array<[number, number]>> = {
  0: [],
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 20], [72, 20], [28, 50], [72, 50], [28, 80], [72, 80]],
  7: [[22, 20], [78, 20], [22, 50], [50, 50], [78, 50], [22, 80], [78, 80]],
  8: [[20, 20], [50, 20], [80, 20], [20, 50], [80, 50], [20, 80], [50, 80], [80, 80]],
  9: [[20, 18], [50, 18], [80, 18], [20, 50], [50, 50], [80, 50], [20, 82], [50, 82], [80, 82]],
};

/** Spherical 3-stop gradient from the --pip-N-* tokens. */
function pipGradient(value: number) {
  return (
    `radial-gradient(circle at 36% 30%, var(--pip-${value}-h) 0%, ` +
    `var(--pip-${value}-b) 52%, var(--pip-${value}-s) 100%)`
  );
}

function TileHalf({ value, size }: { value: number; size: number }) {
  const positions = PIP_LAYOUTS[value] ?? [];
  const pipD = Math.max(5, size * 0.192);
  return (
    <div className="c-tile__half" style={{ width: size, height: size }}>
      {positions.map(([xp, yp], i) => (
        <span
          key={i}
          className="c-tile__pip"
          style={{
            left: `${xp}%`,
            top: `${yp}%`,
            width: pipD,
            height: pipD,
            background: pipGradient(value),
          }}
        />
      ))}
    </div>
  );
}

interface DominoTileProps {
  left: number;
  right: number;
  orientation?: Orientation;
  selected?: boolean;
  size?: number;
  onClick?: () => void;
  style?: CSSProperties;
}

export function DominoTile({
  left,
  right,
  orientation = "vertical",
  selected = false,
  size = 46,
  onClick,
  style,
}: DominoTileProps) {
  const isV = orientation === "vertical";
  return (
    <div
      onClick={onClick}
      className={[
        "c-tile",
        isV ? "c-tile--v" : "c-tile--h",
        selected && "is-selected",
        onClick && "is-clickable",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: isV ? size : size * 2,
        height: isV ? size * 2 : size,
        ...style,
      }}
    >
      <TileHalf value={left} size={size} />
      <div className="c-tile__divider" />
      <TileHalf value={right} size={size} />
    </div>
  );
}
