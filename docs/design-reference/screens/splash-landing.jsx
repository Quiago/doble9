// screens/splash-landing.jsx — Splash (1) + Landing (2)
// Depends on: window.GoldBtn, window.GhostBtn, window.Logo, window.ASSETS

/* ── 1. SPLASH ─────────────────────────────────────────────────────────────── */
function SplashScreen({ navigate }) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const start = Date.now();
    const dur = 2600;
    const raf = requestAnimationFrame(function tick() {
      const p = Math.min((Date.now() - start) / dur, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => navigate('landing'), 200);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0D0D0D',
      backgroundImage: `url('./assets/wood-texture.png')`,
      backgroundSize: 'cover', backgroundBlendMode: 'overlay',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Radial warm glow */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 60%, rgba(58,36,22,0.6) 0%, transparent 65%)', pointerEvents:'none' }} />

      {/* Logo */}
      <div style={{ animation: 'splashLogo 0.9s cubic-bezier(0.34,1.56,0.64,1) both', zIndex:1 }}>
        <window.Logo size="xl" tagline={true} />
      </div>

      {/* Manolito peek */}
      <img src="./assets/manolito-waving.png" alt="" style={{
        position: 'absolute', bottom: -10, right: '10%',
        height: 260, objectFit: 'contain', opacity: 0.35,
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))',
        animation: 'screenFadeIn 1.2s 0.6s both',
        pointerEvents: 'none',
      }} />

      {/* Progress */}
      <div style={{ position:'absolute', bottom: 48, left: '50%', transform:'translateX(-50%)', width: 220, zIndex:2 }}>
        <div style={{ height: 2, background: 'rgba(212,175,55,0.15)', borderRadius: 9999, overflow:'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 9999,
            background: 'linear-gradient(90deg,#C9A227,#F2D27A)',
            width: `${progress * 100}%`,
            transition: 'width 0.05s linear',
            boxShadow: '0 0 8px rgba(212,175,55,0.5)',
          }} />
        </div>
        <div style={{ textAlign:'center', marginTop: 10, fontSize: 10, letterSpacing:'0.18em', color:'rgba(212,175,55,0.4)', fontFamily:'Inter,sans-serif', textTransform:'uppercase' }}>
          Cargando…
        </div>
      </div>

      {/* Version */}
      <div style={{ position:'absolute', bottom:16, right:16, fontSize:10, color:'rgba(247,241,227,0.2)', fontFamily:'Inter,sans-serif' }}>v1.0.0-beta</div>
    </div>
  );
}

/* ── 2. LANDING ─────────────────────────────────────────────────────────────── */
function LandingScreen({ navigate }) {
  const features = ['Doble 9 Completo','4 Jugadores','Tiempo Real','Capicúa ✦','Torneos','Liga Global'];
  return (
    <div style={{
      height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: '#0D0D0D',
      backgroundImage: `url('./assets/wood-texture.png')`,
      backgroundSize: 'cover', backgroundBlendMode: 'multiply',
      position: 'relative',
    }}>
      {/* Dark overlay */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(13,13,13,0.92) 0%,rgba(58,36,22,0.5) 50%,rgba(13,13,13,0.88) 100%)', pointerEvents:'none' }} />
      {/* Gold vignette top */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:160, background:'linear-gradient(180deg,rgba(212,175,55,0.06) 0%,transparent 100%)', pointerEvents:'none' }} />

      <div style={{ flex:1, display:'flex', alignItems:'center', position:'relative', zIndex:1, padding:'0 6%', gap:0 }}>
        {/* Left — text */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:28, paddingRight:'4%', animation:'screenFadeIn 0.6s ease' }}>
          <window.Logo size="lg" tagline={true} />

          <div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:38, lineHeight:1.05, color:'#F7F1E3', letterSpacing:'-0.01em', textTransform:'uppercase' }}>
              La mesa ya no<br/>
              <span style={{ background:'linear-gradient(135deg,#C9A227,#F2D27A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                tiene fronteras
              </span>
            </div>
            <div style={{ fontSize:15, color:'rgba(247,241,227,0.55)', marginTop:14, fontFamily:'Inter,sans-serif', lineHeight:1.65, maxWidth:420 }}>
              El dominó cubano más auténtico del mundo digital. Juega con amigos o enfrenta rivales de todo el mundo, con las reglas que conoces y el sabor de siempre.
            </div>
          </div>

          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <window.GoldBtn size="lg" onClick={() => navigate('menu')}>JUGAR AHORA</window.GoldBtn>
            <window.GhostBtn size="lg" onClick={() => navigate('tutorial')}>VER TUTORIAL</window.GhostBtn>
          </div>

          {/* Feature chips */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {features.map(f => (
              <div key={f} style={{
                padding:'5px 14px', borderRadius:9999,
                border:'1px solid rgba(212,175,55,0.25)',
                background:'rgba(212,175,55,0.07)',
                fontSize:11, fontWeight:600, letterSpacing:'0.07em',
                color:'rgba(212,175,55,0.75)', fontFamily:'Inter,sans-serif',
              }}>{f}</div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ display:'flex' }}>
              {['#3498DB','#E91E63','#D4AF37','#0E7A43'].map((c,i) => (
                <div key={i} style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,#1a1a1a,${c})`, border:'2px solid #0D0D0D', marginLeft: i > 0 ? -8 : 0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#F7F1E3', fontFamily:'Montserrat,sans-serif' }}>
                  {['L','M','Y','T'][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#D4AF37' }}>+2,400 jugadores</div>
              <div style={{ fontSize:11, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif' }}>en línea ahora mismo</div>
            </div>
          </div>
        </div>

        {/* Right — Manolito */}
        <div style={{ flex:'0 0 380px', display:'flex', alignItems:'flex-end', justifyContent:'center', position:'relative' }}>
          <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(212,175,55,0.12) 0%,transparent 70%)', pointerEvents:'none' }} />
          <img src="./assets/manolito-waving.png" alt="Manolito" style={{
            height: 460, objectFit:'contain',
            filter:'drop-shadow(0 30px 60px rgba(0,0,0,0.8))',
            animation:'float 4s ease-in-out infinite',
            position:'relative', zIndex:1,
          }} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position:'relative', zIndex:1, padding:'14px 6%', borderTop:'1px solid rgba(212,175,55,0.12)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.4)' }}>
        <window.OnlineDot label="2,418 jugadores en línea" />
        <div style={{ fontSize:11, color:'rgba(212,175,55,0.35)', fontFamily:'Inter,sans-serif', letterSpacing:'0.12em', textTransform:'uppercase' }}>Dominó Cubano · Doble Nueve</div>
        <div style={{ display:'flex', gap:16 }}>
          {['Liga','Torneo','Tienda'].map(l => (
            <button key={l} onClick={() => navigate(l.toLowerCase())} style={{ background:'none', border:'none', color:'rgba(247,241,227,0.35)', fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='#D4AF37'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(247,241,227,0.35)'}
            >{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SplashScreen, LandingScreen });
