// components/organisms/TipsPanel.tsx — From GamePanels.jsx TipsPanel.
// AGENT: Frontend.
import { ChromaImg } from "@/components/atoms/ChromaImg";

interface TipsPanelProps {
  tips: string[];
  tipIndex: number;
  manolitoImg: string;
}

export function TipsPanel({ tips, tipIndex, manolitoImg }: TipsPanelProps) {
  const idx = tips.length ? tipIndex % tips.length : 0;
  return (
    <div className="c-gp c-gp--gold c-tips">
      <div className="c-tips__h">MANOLITO DOBLE 9</div>
      <div className="c-tips__body">
        <ChromaImg className="c-tips__img" src={manolitoImg} alt="Manolito" />
        <div className="c-tips__bubble">{tips[idx]}</div>
        <div className="c-tips__dots">
          {tips.map((_, i) => (
            <div
              key={i}
              className={`c-tips__dot${i === idx ? " c-tips__dot--on" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
