// screens/results-league.jsx — Results (11) + League (12)

/* ── 11. RESULTS ─────────────────────────────────────────────────────────────── */
function ResultsScreen({ navigate, params = {} }) {
  const won = params.won !== false;
  const players = params.players || [
    { name:'Luisito', score:78 },
    { name:'Maritza', score:55 },
    { name:'Yo',      score:100 },
    { name:'El Tigre',score:42 },
  ];
  const PCOL = ['#3498DB','#E91E63','#D4AF37','#F39C12'];

  // Coin particles
  const coins = React.useMemo(() =>
    Array.from({length:16}).map((_,i) => ({
      x: 20 + Math.random()*60, delay: Math.random()*1.5, dur: 1.2 + Math.random()*0.8, rot: Math.random()*720,
    }))
  , [won]);

  return (
    <div style={{
      height:'100vh', overflow:'hidden', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:24,
      background:`radial-gradient(ellipse at 50% 20%, ${won ? 'rgba(60,40,10,0.8)' : 'rgba(80,15,10,0.7)'} 0%, #0D0D0D 65%)`,
      position:'relative', animation:'screenFadeIn 0.4s ease',
    }}>

      {/* Background texture */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`url('./assets/wood-texture.png')`, backgroundSize:'cover', opacity:0.06, pointerEvents:'none' }} />

      {/* Coin rain (win only) */}
      {won && coins.map((c,i) => (
        <div key={i} style={{ position:'absolute', top:0, left:`${c.x}%`, width:12, height:12, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,#F7E08A,#C9A227)', boxShadow:'0 2px 4px rgba(0,0,0,0.5)', animation:`coinFall ${c.dur}s ${c.delay}s ease-in infinite`, pointerEvents:'none' }} />
      ))}

      {/* Win / Lose header */}
      <div style={{ textAlign:'center', zIndex:1, animation:'resultSlideIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{
          fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:60, letterSpacing:'-0.02em', lineHeight:1,
          color: won ? '#D4AF37' : '#E74C3C',
          textShadow: won ? '0 0 60px rgba(212,175,55,0.4),3px 3px 0 rgba(0,0,0,0.5)' : '0 0 40px rgba(231,76,60,0.3)',
          textTransform:'uppercase',
        }}>
          {won ? '¡GANASTE!' : 'PERDISTE'}
        </div>
        <div style={{ fontSize:14, color:'rgba(247,241,227,0.45)', marginTop:6, fontFamily:'Inter,sans-serif' }}>
          {won ? 'La mesa es tuya, campeón. ¡Eso se juega!' : 'La próxima es la tuya. ¡No te rajes!'}
        </div>
      </div>

      {/* Manolito */}
      <img
        src={won ? './assets/manolito-waving.png' : './assets/manolito-surprised.png'}
        alt="Manolito"
        style={{ height:180, objectFit:'contain', filter:'drop-shadow(0 20px 40px rgba(0,0,0,0.8))', zIndex:1, animation: won ? 'float 3s ease-in-out infinite' : 'screenFadeIn 0.5s ease' }}
      />

      {/* Special events */}
      {won && (
        <div style={{ display:'flex', gap:10, zIndex:1 }}>
          {[['✦ Capicúa','#D4AF37'],['🐔 Pollona','#E74C3C']].map(([label,color]) => (
            <div key={label} style={{ padding:'6px 16px', borderRadius:9999, background:`${color}18`, border:`1.5px solid ${color}44`, fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color, letterSpacing:'0.06em' }}>{label}</div>
          ))}
        </div>
      )}

      {/* Score table */}
      <window.Panel style={{ padding:'16px 24px', zIndex:1, minWidth:340 }} gold>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.16em', color:'rgba(212,175,55,0.55)', textTransform:'uppercase', marginBottom:12 }}>PUNTUACIÓN FINAL</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[...players].sort((a,b) => b.score-a.score).map((p,i) => {
            const orig = players.findIndex(x => x.name === p.name);
            const isMe = p.name === 'Yo';
            return (
              <div key={p.name} style={{
                display:'flex', alignItems:'center', gap:12, padding:'8px 10px',
                borderRadius:8, background: isMe ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                border: isMe ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
              }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color: i===0?'#D4AF37':'rgba(247,241,227,0.35)', minWidth:24 }}>#{i+1}</div>
                <div style={{ width:24, height:24, borderRadius:'50%', background:`${PCOL[orig]}22`, border:`1.5px solid ${PCOL[orig]}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:PCOL[orig], fontFamily:'Montserrat,sans-serif' }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ flex:1, fontFamily:'Montserrat,sans-serif', fontWeight: isMe ? 800 : 600, fontSize:13, color: isMe ? '#F7F1E3' : 'rgba(247,241,227,0.7)' }}>{p.name}</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color: isMe ? '#D4AF37' : '#F7F1E3' }}>{p.score}</div>
                <div style={{ fontSize:10, color:'rgba(247,241,227,0.35)', fontFamily:'Inter,sans-serif' }}>pts</div>
              </div>
            );
          })}
        </div>
        <window.Divider style={{ margin:'12px 0 10px' }} gold />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, color:'rgba(247,241,227,0.5)', fontFamily:'Inter,sans-serif' }}>XP ganados</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#0E7A43' }}>+{won ? 250 : 80} XP</div>
        </div>
      </window.Panel>

      {/* CTAs */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center', zIndex:1 }}>
        <window.GoldBtn size="lg" onClick={() => navigate('game')}>JUGAR DE NUEVO</window.GoldBtn>
        <window.GhostBtn size="md" onClick={() => navigate('menu')}>MENÚ PRINCIPAL</window.GhostBtn>
      </div>
    </div>
  );
}

/* ── 12. LEAGUE ─────────────────────────────────────────────────────────────── */
function LeagueScreen({ navigate }) {
  const tiers = [
    { name:'Bronce',   color:'#CD7F32', icon:'🥉', range:'0–999',    players:'12.4K' },
    { name:'Plata',    color:'#C0C0C0', icon:'🥈', range:'1K–2.4K',  players:'8.1K'  },
    { name:'Oro',      color:'#D4AF37', icon:'🏆', range:'2.5K–4.9K',players:'3.2K', current:true },
    { name:'Platino',  color:'#5DADE2', icon:'💫', range:'5K–9.9K',  players:'980'   },
    { name:'Diamante', color:'#52D9F5', icon:'💎', range:'10K+',     players:'142'   },
  ];

  const leaders = [
    { rank:1,  name:'ElCampeón99',  pts:4820, change:+2,  me:false },
    { rank:2,  name:'DobleRey',     pts:4750, change: 0,  me:false },
    { rank:3,  name:'MaestroFicha', pts:4680, change:-1,  me:false },
    { rank:4,  name:'CubaLinda',    pts:4510, change:+3,  me:false },
    { rank:5,  name:'Jugador',      pts:4320, change:+1,  me:true  },
    { rank:6,  name:'LaTigresa',    pts:4290, change:-2,  me:false },
    { rank:7,  name:'PipaGold',     pts:4200, change:+4,  me:false },
    { rank:8,  name:'El7mares',     pts:4080, change: 0,  me:false },
    { rank:9,  name:'DominoPro',    pts:3960, change:-1,  me:false },
    { rank:10, name:'LaReina',      pts:3890, change:+2,  me:false },
  ];

  const myEntry = leaders.find(l => l.me);
  // Season countdown: 14 days, 6h
  const daysLeft = 14;

  return (
    <window.ScreenWrap>
      <window.NavHeader title="LIGA" onBack={() => navigate('menu')} right={
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, color:'rgba(212,175,55,0.6)', textAlign:'right' }}>
          <div>TEMPORADA 7</div>
          <div style={{ color:'rgba(247,241,227,0.4)', fontSize:10 }}>{daysLeft}d restantes</div>
        </div>
      } />

      <div style={{ flex:1, overflowY:'auto', padding:'20px 5%', display:'flex', gap:24, alignItems:'flex-start', justifyContent:'center' }}>

        {/* LEFT — Tier ladder */}
        <div style={{ flex:'0 0 220px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.55)', textTransform:'uppercase', marginBottom:6 }}>Divisiones</div>
          {[...tiers].reverse().map(t => (
            <div key={t.name} style={{
              padding:'12px 14px', borderRadius:10, display:'flex', alignItems:'center', gap:12,
              background: t.current ? `${t.color}18` : 'rgba(0,0,0,0.45)',
              border: `1.5px solid ${t.current ? t.color+'66' : 'rgba(255,255,255,0.07)'}`,
              boxShadow: t.current ? `0 4px 20px ${t.color}22` : 'none',
            }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color: t.current ? t.color : '#F7F1E3' }}>{t.name}{t.current ? ' I' : ''}</div>
                <div style={{ fontSize:10, color:'rgba(247,241,227,0.35)', fontFamily:'Inter,sans-serif', marginTop:1 }}>{t.players} jugadores</div>
              </div>
              {t.current && <div style={{ fontSize:9, fontWeight:700, color:t.color, fontFamily:'Montserrat,sans-serif', background:`${t.color}18`, border:`1px solid ${t.color}44`, borderRadius:9999, padding:'2px 8px', letterSpacing:'0.06em' }}>TÚ</div>}
            </div>
          ))}

          {/* Season timer */}
          <window.Panel style={{ padding:'14px 16px', marginTop:8 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:'rgba(212,175,55,0.6)', fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', marginBottom:8 }}>FIN DE TEMPORADA</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color:'#F7F1E3' }}>{daysLeft}d 6h</div>
            <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:9999, overflow:'hidden', marginTop:8 }}>
              <div style={{ height:'100%', width:`${100-(daysLeft/30)*100}%`, background:'linear-gradient(90deg,#C9A227,#F2D27A)', borderRadius:9999 }} />
            </div>
            <div style={{ fontSize:10, color:'rgba(247,241,227,0.3)', marginTop:5, fontFamily:'Inter,sans-serif' }}>Temporada termina en 14 días</div>
          </window.Panel>
        </div>

        {/* RIGHT — Leaderboard */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14, maxWidth:520 }}>
          {/* My position */}
          <window.Panel style={{ padding:'16px 20px' }} gold>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.6)', textTransform:'uppercase', marginBottom:10 }}>TU POSICIÓN</div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:40, color:'#D4AF37', lineHeight:1 }}>#{myEntry?.rank}</div>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:16, color:'#F7F1E3' }}>Oro I</div>
                <div style={{ fontSize:12, color:'rgba(247,241,227,0.5)', fontFamily:'Inter,sans-serif', marginTop:3 }}>{myEntry?.pts.toLocaleString()} puntos · +{myEntry?.change} posiciones</div>
              </div>
              <div style={{ marginLeft:'auto' }}>
                <div style={{ fontSize:10, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif', marginBottom:4 }}>Para Platino I</div>
                <div style={{ width:120, height:5, background:'rgba(255,255,255,0.07)', borderRadius:9999, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'84%', background:'linear-gradient(90deg,#C9A227,#F2D27A)', borderRadius:9999 }} />
                </div>
                <div style={{ fontSize:10, color:'rgba(247,241,227,0.3)', fontFamily:'Inter,sans-serif', marginTop:3 }}>680 pts restantes</div>
              </div>
            </div>
          </window.Panel>

          {/* Leaderboard */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {leaders.map(l => (
              <div key={l.rank} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderRadius:10,
                background: l.me ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.5)',
                border: `1px solid ${l.me ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                transition:'all 0.15s',
              }}>
                {/* Rank */}
                <div style={{ minWidth:28, fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize: l.rank<=3?18:14, color: l.rank===1?'#D4AF37':l.rank===2?'#C0C0C0':l.rank===3?'#CD7F32':'rgba(247,241,227,0.35)' }}>
                  {l.rank<=3 ? ['🥇','🥈','🥉'][l.rank-1] : `#${l.rank}`}
                </div>
                {/* Avatar */}
                <div style={{ width:32, height:32, borderRadius:'50%', background: l.me ? 'linear-gradient(135deg,#1a4a2e,#0E7A43)' : 'rgba(255,255,255,0.08)', border:`1.5px solid ${l.me?'#0E7A43':'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#F7F1E3', fontFamily:'Montserrat,sans-serif', flexShrink:0 }}>
                  {l.name.charAt(0)}
                </div>
                {/* Name */}
                <div style={{ flex:1, fontFamily:'Montserrat,sans-serif', fontWeight: l.me?800:600, fontSize:13, color: l.me?'#F7F1E3':'rgba(247,241,227,0.7)' }}>
                  {l.name}{l.me && ' (Tú)'}
                </div>
                {/* Change */}
                <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color: l.change>0?'#0E7A43':l.change<0?'#E74C3C':'rgba(247,241,227,0.3)', minWidth:30, textAlign:'center' }}>
                  {l.change>0?`+${l.change}`:l.change===0?'—':l.change}
                </div>
                {/* Points */}
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color: l.me?'#D4AF37':'#F7F1E3', minWidth:60, textAlign:'right' }}>
                  {l.pts.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </window.ScreenWrap>
  );
}

Object.assign(window, { ResultsScreen, LeagueScreen });
