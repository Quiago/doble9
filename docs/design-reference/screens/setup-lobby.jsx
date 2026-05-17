// screens/setup-lobby.jsx — Single Player Setup (4) + Multiplayer Lobby (5)

/* ── 4. SINGLE PLAYER SETUP ─────────────────────────────────────────────────── */
function SetupScreen({ navigate }) {
  const [players, setPlayers]     = React.useState(4);
  const [difficulty, setDiff]     = React.useState('medio');
  const [mode, setMode]           = React.useState('clasico');
  const [points, setPoints]       = React.useState(100);
  const [tileset, setTileset]     = React.useState('doble9');

  const difficulties = [
    { id:'facil',   label:'Fácil',   color:'#0E7A43' },
    { id:'medio',   label:'Medio',   color:'#D4AF37' },
    { id:'dificil', label:'Difícil', color:'#F39C12' },
    { id:'experto', label:'Experto', color:'#E74C3C' },
  ];
  const modes = [
    { id:'clasico',  label:'Clásico',  sub:'Reglas estándar' },
    { id:'parejas',  label:'Parejas',  sub:'2 vs 2 equipos' },
    { id:'rapido',   label:'Rápido',   sub:'Tiempo limitado' },
  ];
  const pointsOptions = [50, 100, 150, 200];

  return (
    <window.ScreenWrap>
      <window.NavHeader title="CONFIGURAR PARTIDA" onBack={() => navigate('menu')} />
      <div style={{ flex:1, overflowY:'auto', padding:'24px 5%', display:'flex', gap:28, alignItems:'flex-start', justifyContent:'center' }}>

        {/* LEFT — Settings */}
        <div style={{ flex:1, maxWidth:520, display:'flex', flexDirection:'column', gap:18 }}>

          {/* Players */}
          <window.Panel style={{ padding:'18px 20px' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.7)', textTransform:'uppercase', marginBottom:12 }}>NÚMERO DE JUGADORES</div>
            <div style={{ display:'flex', gap:10 }}>
              {[2,3,4].map(n => (
                <button key={n} onClick={() => setPlayers(n)} style={{
                  flex:1, padding:'14px', borderRadius:10,
                  border:`2px solid ${players===n ? '#D4AF37' : 'rgba(212,175,55,0.18)'}`,
                  background: players===n ? 'rgba(212,175,55,0.12)' : 'rgba(0,0,0,0.4)',
                  cursor:'pointer', transition:'all 0.18s',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                }}>
                  <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                    {Array.from({length:n}).map((_,i) => (
                      <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: players===n ? '#D4AF37' : 'rgba(247,241,227,0.3)', transition:'all 0.18s' }} />
                    ))}
                  </div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:18, color: players===n ? '#D4AF37' : 'rgba(247,241,227,0.5)', transition:'color 0.18s' }}>{n}</div>
                  <div style={{ fontSize:9, color:'rgba(247,241,227,0.35)', fontFamily:'Inter,sans-serif' }}>{n===2?'1 vs 1':n===3?'3 rivales':'4 jugadores'}</div>
                </button>
              ))}
            </div>
          </window.Panel>

          {/* Difficulty */}
          <window.Panel style={{ padding:'18px 20px' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.7)', textTransform:'uppercase', marginBottom:12 }}>DIFICULTAD CPU</div>
            <div style={{ display:'flex', gap:8 }}>
              {difficulties.map(d => (
                <button key={d.id} onClick={() => setDiff(d.id)} style={{
                  flex:1, padding:'10px 4px', borderRadius:9999,
                  border:`1.5px solid ${difficulty===d.id ? d.color : 'rgba(255,255,255,0.1)'}`,
                  background: difficulty===d.id ? `${d.color}18` : 'transparent',
                  cursor:'pointer', transition:'all 0.18s',
                  fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11,
                  color: difficulty===d.id ? d.color : 'rgba(247,241,227,0.45)',
                  letterSpacing:'0.04em',
                }}>{d.label}</button>
              ))}
            </div>
          </window.Panel>

          {/* Mode */}
          <window.Panel style={{ padding:'18px 20px' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.7)', textTransform:'uppercase', marginBottom:12 }}>MODO DE JUEGO</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {modes.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding:'12px 16px', borderRadius:10, cursor:'pointer', transition:'all 0.18s',
                  border:`1.5px solid ${mode===m.id ? '#D4AF37' : 'rgba(212,175,55,0.15)'}`,
                  background: mode===m.id ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color: mode===m.id ? '#D4AF37' : '#F7F1E3', transition:'color 0.18s' }}>{m.label}</div>
                    <div style={{ fontSize:11, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif', marginTop:2 }}>{m.sub}</div>
                  </div>
                  <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${mode===m.id ? '#D4AF37' : 'rgba(255,255,255,0.2)'}`, background: mode===m.id ? '#D4AF37' : 'transparent', transition:'all 0.18s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {mode===m.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#0D0D0D' }} />}
                  </div>
                </button>
              ))}
            </div>
          </window.Panel>

          {/* Points + Tileset */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <window.Panel style={{ padding:'16px 18px' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.7)', textTransform:'uppercase', marginBottom:10 }}>META DE PUNTOS</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {pointsOptions.map(p => (
                  <button key={p} onClick={() => setPoints(p)} style={{
                    padding:'8px 14px', borderRadius:9999, cursor:'pointer', transition:'all 0.18s',
                    border:`1.5px solid ${points===p ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`,
                    background: points===p ? 'rgba(212,175,55,0.15)' : 'transparent',
                    fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14,
                    color: points===p ? '#D4AF37' : 'rgba(247,241,227,0.5)',
                  }}>{p}</button>
                ))}
              </div>
            </window.Panel>
            <window.Panel style={{ padding:'16px 18px' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.7)', textTransform:'uppercase', marginBottom:10 }}>JUEGO DE FICHAS</div>
              {['doble6','doble9'].map(t => (
                <button key={t} onClick={() => setTileset(t)} style={{
                  display:'block', width:'100%', marginBottom:6, padding:'9px 12px', borderRadius:9999,
                  border:`1.5px solid ${tileset===t ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`,
                  background: tileset===t ? 'rgba(212,175,55,0.12)' : 'transparent', cursor:'pointer',
                  fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12,
                  color: tileset===t ? '#D4AF37' : 'rgba(247,241,227,0.5)', transition:'all 0.18s',
                }}>{t==='doble6' ? 'Doble 6 (28)' : 'Doble 9 (55)'}</button>
              ))}
            </window.Panel>
          </div>
        </div>

        {/* RIGHT — Preview + Start */}
        <div style={{ flex:'0 0 260px', display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
          <window.Panel style={{ padding:'20px', width:'100%' }} gold>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.7)', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>PREVIEW DE MESA</div>
            {/* Table diagram */}
            <div style={{ position:'relative', width:180, height:180, margin:'0 auto', borderRadius:20, background:'rgba(58,36,22,0.4)', border:'1.5px solid rgba(212,175,55,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {/* CPU avatars */}
              {Array.from({length:players-1}).map((_,i) => {
                const positions = [[{top:8,left:'50%',transform:'translateX(-50%)'},{top:'50%',left:8,transform:'translateY(-50%)'},{top:'50%',right:8,transform:'translateY(-50%)'}],[{top:8,left:'50%',transform:'translateX(-50%)'},{top:'50%',left:8,transform:'translateY(-50%)'},{top:'50%',right:8,transform:'translateY(-50%)'}]];
                const pos = [{top:8,left:'50%',transform:'translateX(-50%)'},{top:'50%',left:8,transform:'translateY(-50%)'},{top:'50%',right:8,transform:'translateY(-50%)'}];
                return (
                  <div key={i} style={{ position:'absolute', ...pos[i] }}>
                    <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'1.5px solid rgba(212,175,55,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'rgba(247,241,227,0.6)',fontFamily:'Montserrat,sans-serif' }}>CPU</div>
                  </div>
                );
              })}
              {/* Me */}
              <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)' }}>
                <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#1a4a2e,#0E7A43)',border:'2px solid #0E7A43',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:'#F7F1E3',fontFamily:'Montserrat,sans-serif' }}>Y</div>
              </div>
              {/* Center label */}
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontStyle:'italic', fontSize:13, background:'linear-gradient(135deg,#C9A227,#F2D27A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Doble<br/>9's</div>
            </div>
            <window.Divider style={{ margin:'14px 0' }} />
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                ['Jugadores', `${players} (vs CPU)`],
                ['Dificultad', difficulties.find(d=>d.id===difficulty)?.label],
                ['Modo', modes.find(m=>m.id===mode)?.label],
                ['Meta', `${points} puntos`],
                ['Fichas', tileset==='doble9' ? 'Doble 9 (55)' : 'Doble 6 (28)'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif' }}>{k}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:'#F7F1E3', fontFamily:'Inter,sans-serif' }}>{v}</span>
                </div>
              ))}
            </div>
          </window.Panel>
          <window.GoldBtn size="lg" fullWidth onClick={() => navigate('game', { mode, players, difficulty, points })} style={{ fontSize:18, padding:'16px 0' }}>
            ¡A JUGAR!
          </window.GoldBtn>
          <img src="./assets/manolito-holding-tile.png" alt="" style={{ width:140, objectFit:'contain', filter:'drop-shadow(0 10px 20px rgba(0,0,0,0.7))', marginTop:-10 }} />
        </div>
      </div>
    </window.ScreenWrap>
  );
}

/* ── 5. MULTIPLAYER LOBBY ─────────────────────────────────────────────────────── */
function LobbyScreen({ navigate }) {
  const [tab, setTab] = React.useState('public');
  const [search, setSearch] = React.useState('');

  const rooms = [
    { id:1, name:'Mesa de los campeones', host:'Luisito', players:2, max:4, mode:'Clásico', pts:100, status:'waiting', region:'🇨🇺' },
    { id:2, name:'Solo gente seria',      host:'Maritza', players:3, max:4, mode:'Parejas',  pts:150, status:'waiting', region:'🇲🇽' },
    { id:3, name:'Principiantes OK',      host:'ElTigre', players:1, max:4, mode:'Clásico', pts:50,  status:'waiting', region:'🇺🇸' },
    { id:4, name:'Rápido y al grano',     host:'Pedro',   players:4, max:4, mode:'Rápido',   pts:100, status:'playing', region:'🇵🇷' },
    { id:5, name:'Amigos virtuales',      host:'Carmen',  players:2, max:4, mode:'Clásico', pts:200, status:'waiting', region:'🇨🇺' },
  ];

  const filtered = rooms.filter(r =>
    tab === 'public' ? r.name.toLowerCase().includes(search.toLowerCase()) : false
  );

  return (
    <window.ScreenWrap>
      <window.NavHeader title="MULTIJUGADOR"
        onBack={() => navigate('menu')}
        right={<window.GoldBtn size="sm" onClick={() => navigate('game')}>CREAR SALA</window.GoldBtn>}
      />

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'16px 5%', gap:14 }}>
        {/* Search */}
        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
          <div style={{ flex:1, position:'relative' }}>
            <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', opacity:0.4 }} width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#F7F1E3" strokeWidth="1.5"/>
              <path d="M10 10L13 13" stroke="#F7F1E3" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar sala…"
              style={{ width:'100%', padding:'11px 14px 11px 36px', borderRadius:9999, background:'rgba(0,0,0,0.55)', border:'1px solid rgba(212,175,55,0.2)', color:'#F7F1E3', fontFamily:'Inter,sans-serif', fontSize:13, outline:'none' }}
            />
          </div>
          <window.OnlineDot label="384 salas activas" />
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, background:'rgba(0,0,0,0.4)', borderRadius:9999, padding:3, flexShrink:0, alignSelf:'flex-start' }}>
          {[['public','Salas Públicas'],['friends','Amigos'],['mine','Mis Salas']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:'8px 20px', borderRadius:9999, border:'none', cursor:'pointer', transition:'all 0.18s',
              background: tab===id ? 'rgba(212,175,55,0.18)' : 'transparent',
              color: tab===id ? '#D4AF37' : 'rgba(247,241,227,0.45)',
              fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, letterSpacing:'0.05em',
              border: tab===id ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
            }}>{label}</button>
          ))}
        </div>

        {/* Room list */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(247,241,227,0.3)', fontFamily:'Inter,sans-serif', fontSize:14 }}>
              {tab === 'public' ? 'No se encontraron salas' : 'Sin resultados aquí'}
            </div>
          )}
          {filtered.map(room => (
            <div key={room.id} style={{
              display:'flex', alignItems:'center', gap:16, padding:'14px 18px',
              background:'rgba(0,0,0,0.55)', border:`1px solid ${room.status==='waiting' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius:12, backdropFilter:'blur(8px)', transition:'all 0.2s',
            }}
            onMouseEnter={e => room.status==='waiting' && (e.currentTarget.style.borderColor='rgba(212,175,55,0.45)')}
            onMouseLeave={e => e.currentTarget.style.borderColor=room.status==='waiting'?'rgba(212,175,55,0.2)':'rgba(255,255,255,0.07)'}
            >
              {/* Region + host */}
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:20 }}>{room.region}</div>
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#F7F1E3', marginBottom:3 }}>{room.name}</div>
                <div style={{ fontSize:11, color:'rgba(247,241,227,0.45)', fontFamily:'Inter,sans-serif' }}>Creador: <span style={{ color:'rgba(247,241,227,0.7)' }}>{room.host}</span></div>
              </div>
              {/* Mode + points */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
                <div style={{ padding:'3px 10px', borderRadius:9999, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.2)', fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'#D4AF37' }}>{room.mode}</div>
                <div style={{ fontSize:11, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif' }}>{room.pts} pts</div>
              </div>
              {/* Players */}
              <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                {Array.from({length:room.max}).map((_,i) => (
                  <div key={i} style={{ width:20, height:20, borderRadius:'50%', background: i < room.players ? (i===0?'#D4AF37':'rgba(14,122,67,0.8)') : 'rgba(255,255,255,0.08)', border:`1.5px solid ${i < room.players ? (i===0?'rgba(212,175,55,0.5)':'rgba(14,122,67,0.5)') : 'rgba(255,255,255,0.08)'}` }} />
                ))}
              </div>
              {/* Join button */}
              <div style={{ flexShrink:0 }}>
                {room.status === 'waiting' ? (
                  <window.GreenBtn size="sm" onClick={() => navigate('game')}>UNIRSE</window.GreenBtn>
                ) : (
                  <div style={{ padding:'6px 14px', borderRadius:9999, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:'rgba(247,241,227,0.3)', letterSpacing:'0.05em' }}>EN CURSO</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick join */}
        <div style={{ flexShrink:0, padding:'12px 16px', background:'rgba(14,122,67,0.08)', border:'1px solid rgba(14,122,67,0.25)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#F7F1E3' }}>¿Quieres jugar ya?</div>
            <div style={{ fontSize:11, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif', marginTop:2 }}>Únete a la mejor sala disponible automáticamente</div>
          </div>
          <window.GreenBtn size="md" onClick={() => navigate('game')}>UNIRME RÁPIDO</window.GreenBtn>
        </div>
      </div>
    </window.ScreenWrap>
  );
}

Object.assign(window, { SetupScreen, LobbyScreen });
