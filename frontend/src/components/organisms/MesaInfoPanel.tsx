// components/organisms/MesaInfoPanel.tsx — From GamePanels.jsx MesaInfoPanel.
// AGENT: Frontend.
interface MesaInfoPanelProps {
  table?: string;
  mode?: string;
  online?: number;
  capacity?: number;
  target?: number;
}

export function MesaInfoPanel({
  table = "MESA 1",
  mode = "Doble 9 · Clásico",
  online = 4,
  capacity = 4,
  target = 100,
}: MesaInfoPanelProps) {
  return (
    <div className="c-gp c-mesa">
      <div className="c-mesa__title">{table}</div>
      <div className="c-mesa__sub">{mode}</div>
      <div className="c-mesa__row">
        <div className="c-mesa__dot" />
        <span className="c-mesa__online">
          En línea {online}/{capacity}
        </span>
        <span className="c-mesa__count">
          {online}/{capacity}
        </span>
      </div>
      <div className="c-mesa__foot">
        <span className="c-mesa__foot-k">Partida a</span>
        <span className="c-mesa__foot-v">{target}</span>
        <span className="c-mesa__foot-k">puntos</span>
      </div>
    </div>
  );
}
