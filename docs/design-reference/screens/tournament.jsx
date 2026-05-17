// screens/tournament.jsx — Tournament (13)

function TournamentScreen({ navigate }) {
  const [tab, setTab] = React.useState('activo');
  const [registered, setRegistered] = React.useState(false);

  // Bracket data — 8 players, 3 rounds
  const bracket = {
    quarterfinals: [
      { p1:'ElCampeón99', p2:'DobleRey',     winner:'ElCampeón99', score:'100-78' },
      { p1:'MaestroFicha',p2:'CubaLinda',    winner:'CubaLinda',   score:'100-65' },
      { p1:'Jugador',     p2:'LaTigresa',    winner:null,          score:null, me:true },
      { p1:'PipaGold',    p2:'El7mares',     winner:'PipaGold',    score:'100-82' },
    ],
    semifinals: [
      { p1:'ElCampeón99', p2:'CubaLinda',   winner:'ElCampeón99', score:'100-71' },
      { p1:'TBD',         p2:'PipaGold',    winner:null,          score:null },
    ],
    final: [
      { p1:'ElCampeón99', p2:'TBD',         winner:null,          score:null },
    ],
  };

  const upcoming = [
    { time:'HOY 20:00', opponent:'LaTigresa', mode:'Clásico', pts:100, prize:'🏆 +800 XP' },
    { time:'MAÑ 18:00', opponent:'TBD',       mode:'Clásico', pts:100, prize:'🏆 +1,200 XP' },
    { time:'DOM 15:00', opponent:'FINAL',     mode:'Clásico', pts:100, prize:'💎 50 + Trofeo' },
  ];

  function BracketMatch({ match, round }) {
    const isActive = !match.winner && match.p1 !== 'TBD' && match.p2 !== 'TBD';
    const myMatch = match.me;
    return (
      <div style={{
        borderRadius:10, overflow:'hidden', width:160,
        border: `1.5px solid ${myMatch ? '#D4AF37' : isActive ? 'rgba(14,122,67,0.4)' : 'rgba(212,175,55,0.15)'}`,
        background: myMatch ? 'rgba(212,175,55,0.08)' : 'rgba(0,0,0,0.55)',
        boxShadow: myMatch ? '0 4px 20px rgba(212,175,55,0.2)' : 'none',
        flexShrink: 0,
      }}>
        {[match.p1, match.p2].map((player, i) => {
          const isWinner = player === match.winner;
          const isMe = player === 'Jugador';
          return (
            <div key={i} style={{
              padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between',
              background: isWinner ? 'rgba(14,122,67,0.15)' : 'transparent',
              borderTop: i===1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                  background: isMe ? 'linear-gradient(135deg,#1a4a2e,#0E7A43)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${isMe?'#0E7A43':'rgba(255,255,255,0.15)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'#F7F1E3', fontFamily:'Montserrat,sans-serif',
                }}>{player.charAt(0)}</div>
                <span style={{
                  fontFamily:'Montserrat,sans-serif', fontWeight: isWinner||isMe ? 800 : 500,
                  fontSize:10, color: isWinner ? '#0E7A43' : isMe ? '#D4AF37' : player==='TBD' ? 'rgba(247,241,227,0.2)' : 'rgba(247,241,227,0.7)',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>{player}</span>
              </div>
              {isWinner && <span style={{ fontSize:10 }}>✓</span>}
            </div>
          );
        })}
      </div>
    );
  }

  function ConnectorLine({ vertical = false }) {
    return (
      <div style={{
        background:'rgba(212,175,55,0.2)',
        width: vertical ? 1 : 24, height: vertical ? 48 : 1,
        flexShrink: 0,
      }} />
    );
  }

  return (
    <window.ScreenWrap>
      <window.NavHeader title="TORNEO" onBack={() => navigate('menu')} right={
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, color:'rgba(212,175,55,0.55)', textAlign:'right' }}>
          <div style={{ color:'#0E7A43', fontSize:10 }}>● EN VIVO</div>
          <div>Copa Doble 9</div>
        </div>
      } />

      {/* Tournament hero banner */}
      <div style={{
        margin:'0', padding:'20px 5%', flexShrink:0,
        background:'linear-gradient(135deg,#1a0e00 0%,#2a1800 50%,#1a0e00 100%)',
        borderBottom:'1px solid rgba(212,175,55,0.2)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:20,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ width:60, height:60, borderRadius:14, background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))', border:'1.5px solid rgba(212,175,55,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🏆</div>
          <div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#F7F1E3' }}>Copa Doble 9 — Semana 21</div>
            <div style={{ fontSize:12, color:'rgba(247,241,227,0.5)', fontFamily:'Inter,sans-serif', marginTop:3 }}>8 jugadores · Clásico · Meta 100 pts · Eliminación directa</div>
            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:9999, background:'rgba(14,122,67,0.12)', border:'1px solid rgba(14,122,67,0.3)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#0E7A43' }} />
                <span style={{ fontSize:11, fontWeight:700, color:'#0E7A43', fontFamily:'Montserrat,sans-serif' }}>En Curso</span>
              </div>
              <div style={{ padding:'4px 12px', borderRadius:9999, background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.25)', fontSize:11, fontWeight:700, color:'#D4AF37', fontFamily:'Montserrat,sans-serif' }}>
                Cuartos de Final
              </div>
            </div>
          </div>
        </div>
        {/* Prize */}
        <div style={{ textAlign:'center', flexShrink:0, padding:'12px 20px', background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:12 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.55)', fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', marginBottom:6 }}>Premio</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:18, color:'#D4AF37' }}>💎 100</div>
          <div style={{ fontSize:11, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif', marginTop:2 }}>+ Trofeo Copa D9</div>
        </div>
        {!registered ? (
          <window.GoldBtn onClick={() => setRegistered(true)} style={{ flexShrink:0 }}>UNIRSE AL TORNEO</window.GoldBtn>
        ) : (
          <div style={{ padding:'12px 20px', borderRadius:12, background:'rgba(14,122,67,0.12)', border:'1.5px solid rgba(14,122,67,0.4)', textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#0E7A43', fontFamily:'Montserrat,sans-serif' }}>✓ REGISTRADO</div>
            <div style={{ fontSize:10, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif', marginTop:3 }}>Próximo: HOY 20:00</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ padding:'14px 5% 0', flexShrink:0 }}>
        <div style={{ display:'flex', gap:0, background:'rgba(0,0,0,0.4)', borderRadius:9999, padding:3, width:'fit-content' }}>
          {[['activo','Bracket'],['schedule','Calendario'],['prizes','Premios']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:'8px 20px', borderRadius:9999, cursor:'pointer', transition:'all 0.18s',
              border: tab===id ? '1px solid rgba(212,175,55,0.35)' : '1px solid transparent',
              background: tab===id ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: tab===id ? '#D4AF37' : 'rgba(247,241,227,0.45)',
              fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, letterSpacing:'0.05em',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 5% 24px' }}>

        {tab === 'activo' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }} key="bracket">
            {/* Bracket visual */}
            <window.Panel style={{ padding:'24px', overflow:'auto' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.55)', textTransform:'uppercase', marginBottom:20 }}>CUADRO DE COMPETICIÓN</div>
              <div style={{ display:'flex', gap:0, alignItems:'center', minWidth:720 }}>

                {/* Quarterfinals */}
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.45)', textTransform:'uppercase', marginBottom:12, textAlign:'center' }}>CUARTOS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                    {bracket.quarterfinals.map((m,i) => <BracketMatch key={i} match={m} round="qf" />)}
                  </div>
                </div>

                {/* QF→SF connectors */}
                <div style={{ display:'flex', flexDirection:'column', gap:0, padding:'28px 0' }}>
                  {[0,1].map(i => (
                    <div key={i} style={{ display:'flex', alignItems:'center', height: 82, marginTop: i===0 ? 44 : 0 }}>
                      <ConnectorLine />
                      <div style={{ display:'flex', flexDirection:'column' }}>
                        <ConnectorLine vertical />
                        <ConnectorLine vertical />
                      </div>
                      <ConnectorLine />
                    </div>
                  ))}
                </div>

                {/* Semifinals */}
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.45)', textTransform:'uppercase', marginBottom:12, textAlign:'center' }}>SEMIS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:24, marginTop:48 }}>
                    {bracket.semifinals.map((m,i) => <BracketMatch key={i} match={m} round="sf" />)}
                  </div>
                </div>

                {/* SF→F connectors */}
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'28px 0', height:280 }}>
                  <div style={{ display:'flex', alignItems:'center', height:82, marginTop:24 }}>
                    <ConnectorLine />
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      <ConnectorLine vertical />
                      <ConnectorLine vertical />
                    </div>
                    <ConnectorLine />
                  </div>
                </div>

                {/* Final */}
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.45)', textTransform:'uppercase', marginBottom:12, textAlign:'center' }}>FINAL</div>
                  <div style={{ marginTop:90 }}>
                    {bracket.final.map((m,i) => <BracketMatch key={i} match={m} round="f" />)}
                  </div>
                </div>

                {/* Trophy */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingLeft:24, marginTop:90 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.45)', textTransform:'uppercase', marginBottom:12 }}>CAMPEÓN</div>
                  <div style={{ width:52, height:52, borderRadius:12, background:'rgba(212,175,55,0.1)', border:'1.5px solid rgba(212,175,55,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🏆</div>
                </div>
              </div>
            </window.Panel>

            {/* My next match */}
            <window.Panel style={{ padding:'18px 20px' }} gold>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'rgba(212,175,55,0.6)', textTransform:'uppercase', marginBottom:14 }}>TU PRÓXIMO PARTIDO</div>
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#1a4a2e,#0E7A43)',border:'2px solid #0E7A43',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,fontFamily:'Montserrat,sans-serif',color:'#F7F1E3' }}>Y</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#D4AF37' }}>Jugador</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:'rgba(247,241,227,0.3)' }}>VS</div>
                    <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(233,30,99,0.2)',border:'1.5px solid rgba(233,30,99,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,fontFamily:'Montserrat,sans-serif',color:'#E91E63' }}>L</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#F7F1E3' }}>LaTigresa</div>
                  </div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:'#F7F1E3' }}>HOY 20:00</div>
                  <div style={{ fontSize:11,color:'rgba(247,241,227,0.4)',fontFamily:'Inter,sans-serif' }}>Cuartos de Final</div>
                </div>
                <window.GoldBtn size="sm" onClick={() => navigate('game')}>IR A LA MESA</window.GoldBtn>
              </div>
            </window.Panel>
          </div>
        )}

        {tab === 'schedule' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }} key="schedule">
            {upcoming.map((u,i) => (
              <window.Panel key={i} style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ minWidth:90, padding:'8px 12px', borderRadius:8, background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)', textAlign:'center' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#D4AF37' }}>{u.time}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#F7F1E3' }}>vs {u.opponent}</div>
                  <div style={{ fontSize:11,color:'rgba(247,241,227,0.45)',fontFamily:'Inter,sans-serif',marginTop:2 }}>{u.mode} · {u.pts} pts</div>
                </div>
                <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,color:'#0E7A43' }}>{u.prize}</div>
              </window.Panel>
            ))}
          </div>
        )}

        {tab === 'prizes' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }} key="prizes">
            {[
              { place:'1° Lugar',  reward:'💎 100 + Trofeo Copa D9', color:'#D4AF37', icon:'🥇' },
              { place:'2° Lugar',  reward:'💎 40 + Medalla Plata',   color:'#C0C0C0', icon:'🥈' },
              { place:'3–4° Lugar',reward:'💎 15 + Badge Bronce',    color:'#CD7F32', icon:'🥉' },
              { place:'Top 8',     reward:'🪙 2,000 monedas',        color:'#5DADE2', icon:'⭐' },
              { place:'Participar',reward:'🪙 500 + 150 XP',         color:'#0E7A43', icon:'✦'  },
              { place:'Capicúa',   reward:'+250 XP bonus',           color:'#9B59B6', icon:'✦'  },
            ].map(p => (
              <window.Panel key={p.place} style={{ padding:'20px', textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>{p.icon}</div>
                <div style={{ fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:p.color,marginBottom:6 }}>{p.place}</div>
                <div style={{ fontSize:12,color:'rgba(247,241,227,0.7)',fontFamily:'Inter,sans-serif',lineHeight:1.4 }}>{p.reward}</div>
              </window.Panel>
            ))}
          </div>
        )}
      </div>
    </window.ScreenWrap>
  );
}

Object.assign(window, { TournamentScreen });
