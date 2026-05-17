// components/atoms/Button.tsx — GoldBtn/GhostBtn/GreenBtn/RedBtn.
// AGENT: Frontend. Recreated from shared.jsx with BEM classes (no inline CSS).
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Size = "sm" | "md" | "lg";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: Size;
  fullWidth?: boolean;
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function GoldBtn({ children, size = "md", fullWidth, className, ...rest }: BtnProps) {
  return (
    <button
      className={cx("c-btn", "c-btn--gold", `c-btn--${size}`, fullWidth && "c-btn--full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ children, size = "md", fullWidth, className, ...rest }: BtnProps) {
  return (
    <button
      className={cx("c-btn", "c-btn--ghost", `c-btn--${size}`, fullWidth && "c-btn--full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GreenBtn({ children, size = "md", fullWidth, className, ...rest }: BtnProps) {
  return (
    <button
      className={cx("c-btn", "c-btn--green", `c-btn--${size}`, fullWidth && "c-btn--full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function RedBtn({ children, size = "md", fullWidth, className, ...rest }: BtnProps) {
  return (
    <button
      className={cx("c-btn", "c-btn--red", `c-btn--${size}`, fullWidth && "c-btn--full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
