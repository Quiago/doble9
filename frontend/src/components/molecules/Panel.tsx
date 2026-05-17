// components/molecules/Panel.tsx — glass panel. From shared.jsx Panel.
// AGENT: Frontend.
import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  gold?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Panel({ children, gold = false, className, style }: PanelProps) {
  return (
    <div
      className={["c-panel", gold && "c-panel--gold", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}
