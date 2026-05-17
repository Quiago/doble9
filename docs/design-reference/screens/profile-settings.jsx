// screens/profile-settings.jsx — Profile (8) + Settings (9)

/* ── 8. PROFILE ─────────────────────────────────────────────────────────────── */
function ProfileScreen({ navigate }) {
  const [tab, setTab] = React.useState('stats');

  const achievements = [
    { icon:'🏆', label:'Primera Victoria', unlocked:true },
    { icon:'⚡', label:'Racha de 5',        unlocked:true },
    { icon:'✦',  label:'Capicúa Pro',       unlocked:true },
    { icon:'🐔', label:'Pollona Master',    unlocked:true },
    { icon:'🎯', label:'100 Partidas',       unlocked:false },
    { icon:'💎', label:'Liga Diamante',      unlocked:false },
    { icon:'🌍', label:'Global Player',      unlocked:false },
    { icon:'👑', label:'Campeón Torneo',     unlocked:false },
  ];

  const recentGames = [
    { result:'Victoria', opponent:'Luisito', score:'78-42', mode:'Clásico', pts:'+180 XP', color:'#0E7A43' },
    { result:'Derrota',  opponent:'Maritza', score:'31-100', mode:'Parejas',  pts:'-20 XP',  color:'#E74C3C' },
    { result:'Victoria', opponent:'El Tigre', score:'100-55', mode:'Rápido',   pts:'+140 XP', color:'#0E7A43' },
    { result:'Victoria', opponent:'Carlos',  score:'100-72', mode:'Clásico', pts:'+160 XP', color:'#0E7A43' },
  ];

  return (
    <window.ScreenWrap>
      <window.NavHeader title="MI PERFIL" onBack={() => navigate('menu')} right={
        <window.GhostBtn size="sm" onClick={() => {}}>EDITAR</window.GhostBtn>
      } />
      <div style={{ flex:1, overflowY:'auto', padding:'24px 6%', display:'flex', gap:28, alignItems:'flex-start', justifyContent:'center' }}>

        {/* LEFT — Avatar + badge */}
        <div style={{ flex:'0 0 220px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          {/* Avatar with gold ring */}
          <div style={{ position:'relative', width:140, height:140 }}>
            <img src="./assets/gold-ring-frame.png" alt="" style={{ position:'absolute', inset:-12, width:'calc(100% + 24px)', height:'calc(100% + 24px)', objectFit:'contain', zIndex:2, pointerEvents:'none' }} />
            <div style={{ width:140, height:140, borderRadius:'50%', background:'linear-gradient(135deg,#1a4a2e,#0E7A43)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'#F7F1E3', boxShadow:'0 0 0 3px #D4AF37, 0 0 24px rgba(212,175,55,0.4)' }}>Y</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#F7F1E3' }}>Jugador</div>
            <div style={{ fontSize:12, color:'rgba(247,241,227,0.5)', fontFamily:'Inter,sans-serif', marginTop:2 }}>@jugador_pro · Desde 2024</div>
          </div>
          {/* League badge */}
          <div style={{ padding:'8px 20px', borderRadius:9999, background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))', border:'1.5px solid rgba(212,175,55,0.45)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>👑</span>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#D4AF37' }}>Gold I</div>
              <div style={{ fontSize:10, color:'rgba(212,175,55,0.6)', fontFamily:'Inter,sans-serif' }}>Liga Dorada</div>
            </div>
          </div>
          {/* XP bar */}
          <window.Panel style={{ padding:'12px 16px', width:'100%' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#D4AF37', fontFamily:'Montserrat,sans-serif' }}>★ Nivel 12</span>
              <span style={{ fontSize:10, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif' }}>4,820 / 6,000 XP</span>
            </div>
            <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:9999, overflow:'hidden' }}>
              <div style={{ height:'100%', width:'80%', background:'linear-gradient(90deg,#C9A227,#F2D27A)', borderRadius:9999 }} />
            </div>
            <div style={{ fontSize:10, color:'rgba(247,241,227,0.3)', marginTop:5, fontFamily:'Inter,sans-serif' }}>1,180 XP para nivel 13</div>
          </window.Panel>
        </div>

        {/* RIGHT — tabs */}
        <div style={{ flex:1, maxWidth:600, display:'flex', flexDirection:'column', gap:16 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:0, background:'rgba(0,0,0,0.4)', borderRadius:9999, padding:3, alignSelf:'flex-start' }}>
            {[['stats','Estadísticas'],['achievements','Logros'],['history','Historial']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding:'8px 20px', borderRadius:9999, border: tab===id?'1px solid rgba(212,175,55,0.35)':'1px solid transparent',
                background: tab===id?'rgba(212,175,55,0.15)':'transparent',
                color: tab===id?'#D4AF37':'rgba(247,241,227,0.45)',
                fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12,
                letterSpacing:'0.05em', cursor:'pointer', transition:'all 0.18s',
              }}>{label}</button>
            ))}
          </div>

          {tab === 'stats' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }} key="stats">
              {/* Stats grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[['234','Partidas','📊'],['156','Victorias','🏆'],['7','Racha actual','⚡'],['66%','Win Rate','📈']].map(([val,label,icon]) => (
                  <window.Panel key={label} style={{ padding:'16px 12px', textAlign:'center' }} gold>
                    <div style={{ fontSize:22 }}>{icon}</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color:'#D4AF37', marginTop:6 }}>{val}</div>
                    <div style={{ fontSize:10, color:'rgba(247,241,227,0.45)', fontFamily:'Inter,sans-serif', marginTop:3 }}>{label}</div>
                  </window.Panel>
                ))}
              </div>
              {/* More stats */}
              <window.Panel style={{ padding:'18px 20px' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.6)', textTransform:'uppercase', marginBottom:14 }}>DETALLES</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[['Capicúas','38'],['Polonas','12'],['Puntos totales','48,240'],['Fichas jugadas','2,180'],['Torneos ganados','2'],['Mejor racha','12']].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize:12, color:'rgba(247,241,227,0.5)', fontFamily:'Inter,sans-serif' }}>{k}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#F7F1E3', fontFamily:'Montserrat,sans-serif' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </window.Panel>
            </div>
          )}

          {tab === 'achievements' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }} key="ach">
              {achievements.map(a => (
                <window.Panel key={a.label} style={{ padding:'16px 12px', textAlign:'center', opacity: a.unlocked ? 1 : 0.4, transition:'opacity 0.2s' }}>
                  <div style={{ fontSize:28, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                  <div style={{ fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:700, color: a.unlocked ? '#D4AF37' : 'rgba(247,241,227,0.4)', marginTop:8, lineHeight:1.3 }}>{a.label}</div>
                  {!a.unlocked && <div style={{ fontSize:9, color:'rgba(247,241,227,0.25)', marginTop:4, fontFamily:'Inter,sans-serif' }}>Bloqueado</div>}
                </window.Panel>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }} key="hist">
              {recentGames.map((g,i) => (
                <window.Panel key={i} style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:52, height:52, borderRadius:10, background:`${g.color}18`, border:`1.5px solid ${g.color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:10, color:g.color, letterSpacing:'0.05em' }}>{g.result === 'Victoria' ? 'WIN' : 'LOSS'}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#F7F1E3' }}>vs {g.opponent}</div>
                    <div style={{ fontSize:11, color:'rgba(247,241,227,0.45)', fontFamily:'Inter,sans-serif', marginTop:2 }}>{g.mode} · {g.score}</div>
                  </div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color: g.result==='Victoria'?'#0E7A43':'#E74C3C' }}>{g.pts}</div>
                </window.Panel>
              ))}
            </div>
          )}
        </div>
      </div>
    </window.ScreenWrap>
  );
}

/* ── 9. SETTINGS ─────────────────────────────────────────────────────────────── */
function SettingsScreen({ navigate }) {
  const [music, setMusic]     = React.useState(70);
  const [sfx, setSfx]         = React.useState(85);
  const [anim, setAnim]       = React.useState(true);
  const [notifs, setNotifs]   = React.useState(true);
  const [quality, setQuality] = React.useState('alta');
  const [table, setTable]     = React.useState('madera');
  const [lang, setLang]       = React.useState('es');

  function Toggle({ on, onChange }) {
    return (
      <div onClick={() => onChange(!on)} style={{ width:44, height:24, borderRadius:9999, background: on ? '#0E7A43' : 'rgba(255,255,255,0.12)', cursor:'pointer', transition:'background 0.2s', position:'relative', flexShrink:0, border:`1px solid ${on ? '#0E7A43' : 'rgba(255,255,255,0.15)'}` }}>
        <div style={{ position:'absolute', top:2, left: on ? 22 : 2, width:18, height:18, borderRadius:'50%', background:'#F7F1E3', transition:'left 0.2s', boxShadow:'0 2px 4px rgba(0,0,0,0.4)' }} />
      </div>
    );
  }

  function Slider({ val, onChange, label }) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:11, color:'rgba(247,241,227,0.5)', fontFamily:'Inter,sans-serif', minWidth:60 }}>{label}</span>
        <input type="range" min="0" max="100" value={val} onChange={e => onChange(Number(e.target.value))}
          style={{ flex:1, accentColor:'#D4AF37', height:4, cursor:'pointer' }} />
        <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'#D4AF37', minWidth:32, textAlign:'right' }}>{val}%</span>
      </div>
    );
  }

  function Section({ title, children }) {
    return (
      <window.Panel style={{ padding:'18px 20px' }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.6)', textTransform:'uppercase', marginBottom:16 }}>{title}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>{children}</div>
      </window.Panel>
    );
  }

  function Row({ label, sub, right }) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#F7F1E3', fontFamily:'Inter,sans-serif' }}>{label}</div>
          {sub && <div style={{ fontSize:11, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif', marginTop:2 }}>{sub}</div>}
        </div>
        {right}
      </div>
    );
  }

  return (
    <window.ScreenWrap>
      <window.NavHeader title="CONFIGURACIÓN" onBack={() => navigate('menu')} />
      <div style={{ flex:1, overflowY:'auto', padding:'24px 10%', display:'flex', flexDirection:'column', gap:16, maxWidth:700, margin:'0 auto', width:'100%' }}>

        <Section title="🔊 Audio">
          <Slider val={music} onChange={setMusic} label="Música" />
          <Slider val={sfx}   onChange={setSfx}   label="Efectos" />
          <Row label="Sonidos de fichas" sub="Clic al colocar fichas" right={<Toggle on={sfx>0} onChange={v => setSfx(v?75:0)} />} />
        </Section>

        <Section title="🎨 Visual">
          <Row label="Calidad gráfica" right={
            <div style={{ display:'flex', gap:6 }}>
              {['baja','media','alta'].map(q => (
                <button key={q} onClick={() => setQuality(q)} style={{ padding:'5px 12px', borderRadius:9999, border:`1.5px solid ${quality===q?'#D4AF37':'rgba(255,255,255,0.12)'}`, background: quality===q?'rgba(212,175,55,0.15)':'transparent', color: quality===q?'#D4AF37':'rgba(247,241,227,0.45)', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.05em', transition:'all 0.15s' }}>{q}</button>
              ))}
            </div>
          } />
          <Row label="Animaciones" sub="Efectos especiales y transiciones" right={<Toggle on={anim} onChange={setAnim} />} />
          <Row label="Mesa de juego" right={
            <div style={{ display:'flex', gap:6 }}>
              {[['madera','🪵'],['fieltro','🟩'],['mármol','🪨']].map(([id,icon]) => (
                <button key={id} onClick={() => setTable(id)} style={{ padding:'5px 12px', borderRadius:9999, border:`1.5px solid ${table===id?'#D4AF37':'rgba(255,255,255,0.12)'}`, background: table===id?'rgba(212,175,55,0.15)':'transparent', color: table===id?'#D4AF37':'rgba(247,241,227,0.45)', fontFamily:'Inter,sans-serif', fontSize:12, cursor:'pointer', transition:'all 0.15s' }}>{icon} {id}</button>
              ))}
            </div>
          } />
        </Section>

        <Section title="🔔 Notificaciones">
          <Row label="Notificaciones push" sub="Alertas cuando te inviten a jugar" right={<Toggle on={notifs} onChange={setNotifs} />} />
          <Row label="Turno en partidas activas" sub="Recuerda cuando sea tu turno" right={<Toggle on={true} onChange={() => {}} />} />
          <Row label="Resultados de torneos" right={<Toggle on={true} onChange={() => {}} />} />
        </Section>

        <Section title="👤 Cuenta">
          <Row label="Idioma" right={
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ background:'rgba(0,0,0,0.6)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, padding:'7px 12px', color:'#F7F1E3', fontFamily:'Inter,sans-serif', fontSize:13, cursor:'pointer', outline:'none' }}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          } />
          <Row label="Nombre de usuario" sub="@jugador_pro" right={<window.GhostBtn size="sm">CAMBIAR</window.GhostBtn>} />
          <window.Divider gold />
          <Row label="Cerrar sesión" right={<window.RedBtn size="sm">SALIR</window.RedBtn>} />
          <Row label="Eliminar cuenta" sub="Esta acción no se puede deshacer" right={<window.RedBtn size="sm">ELIMINAR</window.RedBtn>} />
        </Section>

        <div style={{ paddingBottom:24 }}>
          <window.GoldBtn fullWidth onClick={() => navigate('menu')}>GUARDAR CAMBIOS</window.GoldBtn>
        </div>
      </div>
    </window.ScreenWrap>
  );
}

Object.assign(window, { ProfileScreen, SettingsScreen });
