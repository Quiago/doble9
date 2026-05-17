// DominoTile.jsx — Doble 9's Design System
// Exports: DominoTile, FaceDownTile, TileHalf → window

// Pip colors: base, highlight, shadow — for spherical 3D gradient
const PIP_COLORS = [
  null,
  { b:'#CC3828', h:'#E06055', s:'#9E2A1E' }, // 1 Rojo
  { b:'#2A7EC0', h:'#50A0D8', s:'#1A5C96' }, // 2 Azul
  { b:'#22A850', h:'#40BF6A', s:'#168038' }, // 3 Verde
  { b:'#D88810', h:'#ECB040', s:'#A8680A' }, // 4 Naranja
  { b:'#7E3E9E', h:'#9C5CB8', s:'#5C2878' }, // 5 Morado
  { b:'#C86018', h:'#E08840', s:'#9A4810' }, // 6 Naranja+
  { b:'#129880', h:'#2CB89A', s:'#0C7060' }, // 7 Teal
  { b:'#C41450', h:'#DC4474', s:'#98103C' }, // 8 Rosa
  { b:'#273848', h:'#3C5060', s:'#182430' }, // 9 Gris Osc.
];

const PIP_LAYOUTS = {
  0: [],
  1: [[50,50]],
  2: [[30,30],[70,70]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,20],[72,20],[28,50],[72,50],[28,80],[72,80]],
  7: [[22,20],[78,20],[22,50],[50,50],[78,50],[22,80],[78,80]],
  8: [[20,20],[50,20],[80,20],[20,50],[80,50],[20,80],[50,80],[80,80]],
  9: [[20,18],[50,18],[80,18],[20,50],[50,50],[80,50],[20,82],[50,82],[80,82]],
};

function TileHalf({ value, size }) {
  const c = PIP_COLORS[value];
  const positions = PIP_LAYOUTS[value] || [];
  const pipD = Math.max(5, size * 0.192);
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      {c && positions.map(([xp, yp], i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${xp}%`, top: `${yp}%`,
          transform: 'translate(-50%,-50%)',
          width: pipD, height: pipD,
          borderRadius: '50%',
          background: `radial-gradient(circle at 36% 30%, ${c.h} 0%, ${c.b} 52%, ${c.s} 100%)`,
          boxShadow: `0 1.5px 4px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.1), inset 0 0.5px 1px rgba(255,255,255,0.2)`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}

function DominoTile({ left, right, orientation = 'vertical', selected = false, size = 46, onClick, style: xs = {} }) {
  const isV = orientation === 'vertical';
  return (
    <div
      onClick={onClick}
      style={{
        width: isV ? size : size * 2,
        height: isV ? size * 2 : size,
        // Cream bakelite/resin — no gold border
        background: 'linear-gradient(158deg, #F9F0DA 0%, #F1E3C2 55%, #E8D8AE 100%)',
        borderRadius: 10,
        boxShadow: selected
          ? '0 0 0 2px rgba(14,122,67,0.7), 0 0 12px rgba(14,122,67,0.25), 0 8px 22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.45)'
          : '0 4px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
        display: 'flex', flexDirection: isV ? 'column' : 'row',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s',
        transform: selected ? 'translateY(-7px) scale(1.04)' : 'none',
        flexShrink: 0,
        ...xs,
      }}
    >
      <TileHalf value={left} size={size} />
      <div style={{
        flexShrink: 0, background: 'rgba(50,38,22,0.2)',
        ...(isV ? { height: 1.5, width: '100%' } : { width: 1.5, height: '100%' }),
      }} />
      <TileHalf value={right} size={size} />
    </div>
  );
}

function FaceDownTile({ width = 34, height = 68, style: xs = {} }) {
  return (
    <div style={{
      width, height, flexShrink: 0,
      background: 'linear-gradient(150deg, #1C1C1C, #111)',
      borderRadius: 8,
      boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
      backgroundImage: 'repeating-linear-gradient(-45deg,rgba(255,255,255,0.022) 0px,rgba(255,255,255,0.022) 1px,transparent 1px,transparent 9px)',
      position: 'relative', overflow: 'hidden',
      ...xs,
    }} />
  );
}

Object.assign(window, { DominoTile, FaceDownTile, TileHalf, PIP_COLORS });
