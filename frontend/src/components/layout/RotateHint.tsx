// components/layout/RotateHint.tsx — landscape nudge for the game table on
// phones. Visibility is pure CSS (.c-rotate media query). AGENT: Frontend.
export function RotateHint() {
  return (
    <div className="c-rotate" role="dialog" aria-label="Gira el dispositivo">
      <div className="c-rotate__icon">📱↻</div>
      <div className="c-rotate__t">Gira tu dispositivo</div>
      <div className="c-rotate__s">
        Doble 9's se juega en horizontal para ver la mesa completa.
      </div>
    </div>
  );
}
