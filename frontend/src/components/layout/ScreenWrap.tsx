// components/layout/ScreenWrap.tsx — full-height screen shell with fade-in.
// AGENT: Frontend. From shared.jsx ScreenWrap.
import type { CSSProperties, ReactNode } from "react";

interface ScreenWrapProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ScreenWrap({ children, className, style }: ScreenWrapProps) {
  return (
    <div
      className={["c-screen", className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}
