// GamePanels.jsx — Doble 9's Design System
// Exports: PlayerAvatar, ScorePanel, ChatPanel, TipsPanel, MesaInfoPanel → window

const PLAYER_COLORS = ['#3498DB','#E91E63','#D4AF37','#F39C12'];

function PlayerAvatar({ name, score, isActive, isMe, color, size = 58 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const ringColor = isActive ? '#0E7A43' : isMe ? '#D4AF37' : 'rgba(255,255,255,0.1)';
  const ringGlow = isActive
    ? '0 0 0 2px #0E7A43, 0 0 16px rgba(14,122,67,0.5)'
    : isMe ? '0 0 0 2px #D4AF37, 0 0 10px rgba(212,175,55,0.3)'
    : '0 0 0 1.5px rgba(255,255,255,0.1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: isMe
            ? 'linear-gradient(135deg,#1a4a2e,#0E7A43)'
            : `linear-gradient(135deg,#2a1a0e,${color}55)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Montserrat, sans-serif', fontSize: size * 0.36, fontWeight: 900,
          color: isMe ? '#F7F1E3' : color,
          boxShadow: ringGlow,
          transition: 'box-shadow 0.4s ease',
        }}>
          {initial}
        </div>
        {isActive && (
          <div style={{
            position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
            background: '#0E7A43', color: '#fff',
            fontSize: 7, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
            whiteSpace: 'nowrap', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em',
            boxShadow: '0 2px 8px rgba(14,122,67,0.4)',
          }}>
            {isMe ? 'TU TURNO' : 'JUGANDO'}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: isActive ? 5 : 0 }}>
        <div style={{
          fontSize: size < 48 ? 10 : 12, fontWeight: 700,
          color: isMe ? '#D4AF37' : '#F7F1E3',
          fontFamily: 'Montserrat, sans-serif', lineHeight: 1.1,
        }}>{name}</div>
        <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 600 }}>★ {score}</div>
      </div>
    </div>
  );
}

function ScorePanel({ players, round, target }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(212,175,55,0.2)',
      borderRadius: 12, overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(212,175,55,0.7)', fontFamily: 'Montserrat, sans-serif',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>★ Puntuación</div>
      <div style={{ padding: '8px 12px' }}>
        {players.map((p, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '4px 0',
            borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: PLAYER_COLORS[i], flexShrink: 0 }} />
              <span style={{
                fontSize: 12, fontWeight: i === 2 ? 700 : 500,
                color: i === 2 ? '#D4AF37' : 'rgba(247,241,227,0.85)',
                fontFamily: i === 2 ? 'Montserrat, sans-serif' : 'Inter, sans-serif',
              }}>{i === 2 ? 'Yo ✦' : p.name}</span>
            </div>
            <span style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 800,
              color: i === 2 ? '#D4AF37' : '#F7F1E3',
            }}>{p.score}</span>
          </div>
        ))}
        <div style={{
          marginTop: 8, padding: '5px 9px', borderRadius: 7,
          background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#D4AF37', fontFamily: 'Montserrat, sans-serif' }}>Ronda {round}</span>
          <span style={{ fontSize: 10, color: 'rgba(247,241,227,0.4)' }}>Meta: {target} pts</span>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ messages, players }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(212,175,55,0.2)',
      borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0,
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(212,175,55,0.7)', fontFamily: 'Montserrat, sans-serif', flexShrink: 0,
      }}>Chat</div>
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: PLAYER_COLORS[msg.player], fontFamily: 'Montserrat, sans-serif' }}>
                {players[msg.player]?.name}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(247,241,227,0.3)' }}>{msg.time}</span>
            </div>
            <div style={{
              padding: '5px 9px', maxWidth: '85%',
              background: msg.isMe ? 'rgba(14,122,67,0.3)' : 'rgba(255,255,255,0.07)',
              border: msg.isMe ? '1px solid rgba(14,122,67,0.4)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: msg.isMe ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
              fontSize: 12, color: 'rgba(247,241,227,0.85)', lineHeight: 1.4,
            }}>{msg.text}</div>
          </div>
        ))}
      </div>
      <div style={{
        margin: '6px 10px 8px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 9999, padding: '6px 10px',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(247,241,227,0.3)', flex: 1, fontFamily: 'Inter, sans-serif' }}>Escribe un mensaje...</span>
        <span style={{ fontSize: 12, opacity: 0.5 }}>😄</span>
      </div>
    </div>
  );
}

function TipsPanel({ tips, tipIndex, manolitoImg }) {
  const idx = tipIndex % tips.length;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(212,175,55,0.3)',
      borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid rgba(212,175,55,0.15)',
        fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: '#D4AF37',
        fontFamily: 'Montserrat, sans-serif',
      }}>MANOLITO DOBLE 9</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 14px', gap: 10 }}>
        <img src={manolitoImg} alt="Manolito" style={{ width: 120, height: 110, objectFit: 'cover', objectPosition: 'top center' }} />
        <div style={{
          background: '#F7F1E3', borderRadius: '10px 10px 10px 3px',
          padding: '8px 11px', fontSize: 12, color: '#1a1a1a',
          fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
          border: '1px solid rgba(0,0,0,0.08)', alignSelf: 'stretch',
        }}>
          {tips[idx]}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {tips.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 14 : 6, height: 6, borderRadius: 3,
              background: i === idx ? '#D4AF37' : 'rgba(212,175,55,0.25)',
              transition: 'all 0.25s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MesaInfoPanel({ gameInfo = {} }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(212,175,55,0.2)',
      borderRadius: 12, padding: '12px 14px', flexShrink: 0,
    }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 800, color: '#F7F1E3', marginBottom: 4 }}>MESA 1</div>
      <div style={{ fontSize: 11, color: 'rgba(247,241,227,0.5)', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>Doble 9 · Clásico</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0E7A43' }} />
        <span style={{ fontSize: 11, color: 'rgba(247,241,227,0.7)', fontFamily: 'Inter, sans-serif' }}>En línea 4/4</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(247,241,227,0.4)' }}>4/4</span>
      </div>
      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, color: 'rgba(247,241,227,0.4)', fontFamily: 'Inter, sans-serif' }}>Partida a</span>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 16, fontWeight: 900, color: '#D4AF37' }}>100</span>
        <span style={{ fontSize: 10, color: 'rgba(247,241,227,0.4)', fontFamily: 'Inter, sans-serif', alignSelf: 'flex-end' }}>puntos</span>
      </div>
    </div>
  );
}

Object.assign(window, { PlayerAvatar, ScorePanel, ChatPanel, TipsPanel, MesaInfoPanel, PLAYER_COLORS });
