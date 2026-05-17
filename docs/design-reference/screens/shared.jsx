// screens/shared.jsx — Doble 9's Shared UI Components
// Exports: GoldBtn, GhostBtn, GreenBtn, RedBtn, Panel, Logo, BackBtn,
//          ScreenWrap, NavHeader, Divider, OnlineDot, ASSETS, C, PLAYER_AVATARS

const ASSETS = {
  wood:          './assets/wood-texture.png',
  manolitoWave:  './assets/manolito-waving.png',
  manolitoHold:  './assets/manolito-holding-tile.png',
  manolitoSurp:  './assets/manolito-surprised.png',
  pollona:       './assets/pollona-greenscreen.png',
  logoGreen:     './assets/logo-greenscreen.png',
  goldRing:      './assets/gold-ring-frame.png',
  tableTop:      './assets/table-top.png',
};

const C = {
  negro: '#0D0D0D', madera: '#3A2416',
  dorado: '#D4AF37', doradoClaro: '#F2D27A', doradoDark: '#A8892A',
  crema: '#F7F1E3', verde: '#0E7A43', verdeLight: '#12A356',
  error: '#E74C3C', panel: 'rgba(0,0,0,0.72)',
  borderGold: 'rgba(212,175,55,0.25)',
};

const PLAYER_AVATARS = [
  { name: 'Luisito', color: '#3498DB', initials: 'L' },
  { name: 'Maritza', color: '#E91E63', initials: 'M' },
  { name: 'Yo',      color: '#D4AF37', initials: 'Y' },
  { name: 'El Tigre',color: '#F39C12', initials: 'T' },
];

function GoldBtn({ children, onClick, size = 'md', fullWidth = false, style: xs = {} }) {
  const sz = { sm:{p:'9px 24px',fs:12}, md:{p:'13px 40px',fs:15}, lg:{p:'17px 60px',fs:19} }[size] || {p:'13px 40px',fs:15};
  return (
    <button onClick={onClick} style={{
      padding: sz.p, fontSize: sz.fs, width: fullWidth ? '100%' : 'auto',
      borderRadius: 9999, border: 'none',
      background: 'linear-gradient(135deg,#C9A227 0%,#F2D27A 50%,#C9A227 100%)',
      color: '#0D0D0D', fontFamily: 'Montserrat,sans-serif',
      fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
      transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', ...xs,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(212,175,55,0.6)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(212,175,55,0.4)'; }}
    onMouseDown={e => e.currentTarget.style.transform='scale(0.97)'}
    onMouseUp={e => e.currentTarget.style.transform='scale(1.03)'}
    >{children}</button>
  );
}

function GhostBtn({ children, onClick, size = 'md', style: xs = {} }) {
  const sz = { sm:{p:'7px 20px',fs:11}, md:{p:'11px 32px',fs:14}, lg:{p:'14px 48px',fs:16} }[size] || {p:'11px 32px',fs:14};
  return (
    <button onClick={onClick} style={{
      padding: sz.p, fontSize: sz.fs,
      borderRadius: 9999, border: '1.5px solid rgba(212,175,55,0.4)',
      background: 'transparent', color: 'rgba(212,175,55,0.85)',
      fontFamily: 'Montserrat,sans-serif', fontWeight: 700,
      letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer',
      transition: 'all 0.18s', ...xs,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor='#D4AF37'; e.currentTarget.style.background='rgba(212,175,55,0.08)'; e.currentTarget.style.color='#F2D27A'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(212,175,55,0.4)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(212,175,55,0.85)'; }}
    >{children}</button>
  );
}

function GreenBtn({ children, onClick, size = 'md', disabled = false, style: xs = {} }) {
  const sz = { sm:{p:'9px 24px',fs:12}, md:{p:'13px 40px',fs:15}, lg:{p:'17px 60px',fs:19} }[size] || {p:'13px 40px',fs:15};
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: sz.p, fontSize: sz.fs,
      borderRadius: 9999, border: 'none',
      background: disabled ? 'rgba(14,122,67,0.3)' : '#0E7A43',
      color: '#F7F1E3', fontFamily: 'Montserrat,sans-serif',
      fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(14,122,67,0.4)',
      opacity: disabled ? 0.55 : 1, transition: 'all 0.18s', ...xs,
    }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.background='#12A356')}
    onMouseLeave={e => !disabled && (e.currentTarget.style.background='#0E7A43')}
    >{children}</button>
  );
}

function RedBtn({ children, onClick, size = 'md', style: xs = {} }) {
  return (
    <button onClick={onClick} style={{
      padding: size==='sm' ? '7px 18px' : '10px 26px',
      fontSize: size==='sm' ? 11 : 13,
      borderRadius: 9999, border: '1.5px solid rgba(231,76,60,0.4)',
      background: 'transparent', color: '#E74C3C',
      fontFamily: 'Montserrat,sans-serif', fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
      transition: 'all 0.15s', ...xs,
    }}
    onMouseEnter={e => { e.currentTarget.style.background='rgba(231,76,60,0.12)'; e.currentTarget.style.borderColor='#E74C3C'; }}
    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(231,76,60,0.4)'; }}
    >{children}</button>
  );
}

function Panel({ children, style: xs = {}, gold = false }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.72)',
      border: `1px solid ${gold ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.2)'}`,
      borderRadius: 12, backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', ...xs,
    }}>{children}</div>
  );
}

function Logo({ size = 'md', tagline = false }) {
  const fs = {sm:28, md:44, lg:72, xl:96}[size] || 44;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontStyle: 'italic',
        fontSize: fs, lineHeight: 0.88, letterSpacing: '-0.02em',
        background: 'linear-gradient(135deg,#C9A227 0%,#F7E08A 40%,#C9A227 70%,#F2D27A 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(2px 4px 3px rgba(0,0,0,0.7))', userSelect: 'none',
      }}>Doble<br/>9's</div>
      {tagline && (
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', marginTop: 10, fontFamily: 'Inter,sans-serif' }}>
          ✦ Dominó Cubano Online ✦
        </div>
      )}
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'transparent', border: '1px solid rgba(247,241,227,0.15)',
      borderRadius: 9999, padding: '8px 16px',
      color: 'rgba(247,241,227,0.65)', fontFamily: 'Montserrat,sans-serif',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(247,241,227,0.4)'; e.currentTarget.style.color='#F7F1E3'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(247,241,227,0.15)'; e.currentTarget.style.color='rgba(247,241,227,0.65)'; }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M8.5 2L3.5 6.5L8.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Atrás
    </button>
  );
}

function ScreenWrap({ children, style: xs = {} }) {
  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'screenFadeIn 0.3s ease', background: '#0D0D0D', ...xs }}>
      {children}
    </div>
  );
}

function NavHeader({ title, onBack, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', borderBottom: '1px solid rgba(212,175,55,0.15)',
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', flexShrink: 0,
    }}>
      <div style={{ minWidth: 90 }}>{onBack && <BackBtn onClick={onBack} />}</div>
      <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F7F1E3' }}>
        {title}
      </div>
      <div style={{ minWidth: 90, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function Divider({ gold = false, style: xs = {} }) {
  return <div style={{ height: 1, background: gold ? 'rgba(212,175,55,0.22)' : 'rgba(247,241,227,0.07)', ...xs }} />;
}

function OnlineDot({ label = 'En línea' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0E7A43', boxShadow: '0 0 6px rgba(14,122,67,0.7)' }} />
      <span style={{ fontSize: 11, color: 'rgba(247,241,227,0.5)', fontFamily: 'Inter,sans-serif' }}>{label}</span>
    </div>
  );
}

Object.assign(window, { GoldBtn, GhostBtn, GreenBtn, RedBtn, Panel, Logo, BackBtn, ScreenWrap, NavHeader, Divider, OnlineDot, ASSETS, C, PLAYER_AVATARS });
