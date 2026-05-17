// components/atoms/misc.tsx — BackBtn, Divider, OnlineDot. From shared.jsx.
// AGENT: Frontend.
interface BackBtnProps {
  onClick?: () => void;
}

export function BackBtn({ onClick }: BackBtnProps) {
  return (
    <button className="c-back" onClick={onClick} type="button">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
        <path
          d="M8.5 2L3.5 6.5L8.5 11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Atrás
    </button>
  );
}

export function Divider({
  gold = false,
  style,
}: {
  gold?: boolean;
  style?: import("react").CSSProperties;
}) {
  return (
    <div
      className={gold ? "c-divider c-divider--gold" : "c-divider"}
      style={style}
    />
  );
}

export function OnlineDot({ label = "En línea" }: { label?: string }) {
  return (
    <div className="c-online">
      <div className="c-online__dot" />
      <span className="c-online__label">{label}</span>
    </div>
  );
}
