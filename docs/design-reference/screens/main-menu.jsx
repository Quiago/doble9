// screens/main-menu.jsx — Main Menu (3)
// Depends on: window.GoldBtn, window.GhostBtn, window.Logo, window.Panel, window.ASSETS

function MainMenuScreen({ navigate }) {
  const [hovered, setHovered] = React.useState(null);

  const quickActions = [
    { id:'setup',      label:'1 JUGADOR',    sub:'vs CPU inteligente',  icon:'🤖', color:'#3498DB' },
    { id:'lobby',      label:'MULTIJUGADOR', sub:'Con amigos o rivales', icon:'👥', color:'#E91E63' },
    { id:'tournament', label:'TORNEO',       sub:'Competencia oficial',  icon:'🏆', color:'#D4AF37' },
    { id:'league',     label:'LIGA',         sub:'Temporada activa',     icon:'⚡', color:'#0E7A43' },
  ];

  const navItems = [
    { id:'tutorial', label:'Tutorial', icon:'📖' },
    { id:'profile',  label:'Perfil',   icon:'👤' },
    { id:'store',    label:'Tienda',   icon:'🛒' },
    { id:'settings', label:'Config.',  icon:'⚙️' },
  ];

  return (
    <div style={{
      height:'100vh', overflow:'hidden', display:'flex', flexDirection:'column',
      background:'#0D0D0D',
      backgroundImage:`url('./assets/wood-texture.png')`,
      backgroundSize:'cover', backgroundBlendMode:'overlay',
      position:'relative',
    }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 30%,rgba(58,36,22,0.7) 0%,rgba(13,13,13,0.92) 65%)', pointerEvents:'none' }} />

      {/* TOP BAR */}
      <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderBottom:'1px solid rgba(212,175,55,0.12)', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(12px)', flexShrink:0 }}>
        <window.Logo size="sm" />
        {/* Player info */}
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <window.OnlineDot label="2,418 en línea" />
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:9999, padding:'7px 14px', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#1a4a2e,#0E7A43)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'#F7F1E3' }}>Y</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#F7F1E3', fontFamily:'Montserrat,sans-serif', lineHeight:1.1 }}>Jugador</div>
              <div style={{ fontSize:10, color:'#D4AF37', fontFamily:'Inter,sans-serif' }}>★ Nivel 12 · Gold I</div>
            </div>
          </div>
          {/* Coins */}
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:9999, padding:'6px 14px' }}>
            <span style={{ fontSize:14 }}>🪙</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#D4AF37' }}>2,450</span>
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex:1, display:'flex', alignItems:'center', position:'relative', zIndex:1, padding:'0 5%', gap:40 }}>

        {/* LEFT — Manolito */}
        <div style={{ flex:'0 0 260px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <img src="./assets/manolito-waving.png" alt="Manolito" style={{ height:340, objectFit:'contain', filter:'drop-shadow(0 20px 50px rgba(0,0,0,0.8))', animation:'float 3.5s ease-in-out infinite' }} />
          {/* Daily challenge */}
          <window.Panel style={{ padding:'12px 16px', width:'100%' }} gold>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:'#D4AF37', fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', marginBottom:6 }}>⚡ Desafío del Día</div>
            <div style={{ fontSize:12, color:'rgba(247,241,227,0.8)', fontFamily:'Inter,sans-serif', lineHeight:1.4 }}>Gana 3 partidas con capicúa</div>
            <div style={{ marginTop:8, height:4, background:'rgba(255,255,255,0.07)', borderRadius:9999, overflow:'hidden' }}>
              <div style={{ height:'100%', width:'33%', background:'linear-gradient(90deg,#C9A227,#F2D27A)', borderRadius:9999 }} />
            </div>
            <div style={{ fontSize:10, color:'rgba(247,241,227,0.35)', marginTop:4, fontFamily:'Inter,sans-serif' }}>1 / 3 completadas</div>
          </window.Panel>
        </div>

        {/* CENTER — Quick actions + Logo */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>
          <window.Logo size="lg" tagline={true} />

          {/* Primary CTA */}
          <window.GoldBtn size="lg" onClick={() => navigate('setup')} style={{ letterSpacing:'0.15em', fontSize:22, padding:'18px 80px' }}>
            ¡JUGAR!
          </window.GoldBtn>

          {/* Quick action grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:480 }}>
            {quickActions.map(a => (
              <div key={a.id}
                onClick={() => navigate(a.id)}
                onMouseEnter={() => setHovered(a.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding:'14px 18px', borderRadius:12, cursor:'pointer',
                  background: hovered === a.id ? `rgba(${a.id==='setup'?'52,152,219':'233,30,99'===a.color?'233,30,99':'212,175,55'===a.color?'212,175,55':'14,122,67'},0.1)` : 'rgba(0,0,0,0.55)',
                  border:`1px solid ${hovered === a.id ? a.color+'44' : 'rgba(212,175,55,0.15)'}`,
                  backdropFilter:'blur(8px)',
                  transition:'all 0.2s', display:'flex', alignItems:'center', gap:12,
                  boxShadow: hovered === a.id ? `0 4px 20px ${a.color}22` : 'none',
                }}>
                <div style={{ fontSize:24 }}>{a.icon}</div>
                <div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:hovered===a.id ? a.color : '#F7F1E3', letterSpacing:'0.06em', transition:'color 0.2s' }}>{a.label}</div>
                  <div style={{ fontSize:10, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif', marginTop:2 }}>{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Nav items */}
        <div style={{ flex:'0 0 200px', display:'flex', flexDirection:'column', gap:10 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'14px 18px',
              background:'rgba(0,0,0,0.55)', border:'1px solid rgba(212,175,55,0.15)',
              borderRadius:12, cursor:'pointer', transition:'all 0.2s', textAlign:'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(212,175,55,0.08)'; e.currentTarget.style.borderColor='rgba(212,175,55,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0.55)'; e.currentTarget.style.borderColor='rgba(212,175,55,0.15)'; }}
            >
              <span style={{ fontSize:20 }}>{n.icon}</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'rgba(247,241,227,0.85)', letterSpacing:'0.05em' }}>{n.label}</span>
            </button>
          ))}
          {/* Invite */}
          <div style={{ marginTop:8, padding:'12px 16px', borderRadius:12, background:'rgba(14,122,67,0.1)', border:'1px solid rgba(14,122,67,0.25)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#0E7A43', fontFamily:'Montserrat,sans-serif', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>● Amigos</div>
            <div style={{ fontSize:12, color:'rgba(247,241,227,0.5)', fontFamily:'Inter,sans-serif' }}>3 amigos en línea</div>
            <button onClick={() => navigate('lobby')} style={{ marginTop:8, width:'100%', padding:'7px', borderRadius:9999, border:'1px solid rgba(14,122,67,0.4)', background:'transparent', color:'#0E7A43', fontFamily:'Montserrat,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.06em', cursor:'pointer' }}>VER AMIGOS</button>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div style={{ position:'relative', zIndex:2, padding:'10px 24px', borderTop:'1px solid rgba(212,175,55,0.1)', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ fontSize:10, color:'rgba(212,175,55,0.35)', fontFamily:'Inter,sans-serif', letterSpacing:'0.14em', textTransform:'uppercase' }}>Doble 9's · La mesa ya no tiene fronteras</div>
        <div style={{ display:'flex', gap:8 }}>
          {['🔊','❓','📋'].map(ic => (
            <button key={ic} style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', fontSize:13, cursor:'pointer' }}>{ic}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MainMenuScreen });
