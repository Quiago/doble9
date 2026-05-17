// screens/game-screen.jsx — Game Table (6) with drag-and-drop
// Depends on: window.DominoTile, window.FaceDownTile, window.PlayerAvatar,
//             window.ScorePanel, window.ChatPanel, window.TipsPanel, window.MesaInfoPanel

const INIT_HAND  = [[9,6],[7,4],[3,2],[8,5],[1,0],[3,9],[6,4],[2,7],[5,8]];
const INIT_CHAIN = [[0,1],[1,5],[5,5]];
const INIT_PLAYERS_G = [
  { name:'Luisito', score:30, tiles:7 },
  { name:'Maritza', score:15, tiles:8 },
  { name:'Yo',      score:20, tiles:9 },
  { name:'El Tigre',score:10, tiles:8 },
];
const MESSAGES_G = [
  { player:0, text:'¡Dale, que tú puedes!', time:'10:21' },
  { player:3, text:'¡Vamos a ver!',         time:'10:22' },
  { player:2, text:'¡A darle!', time:'10:22', isMe:true },
];
const TIPS_G = [
  'El doble 9 puede cambiar la partida en el último momento.',
  '¡Cuidado! Guarda fichas altas para capicúa.',
  'La pollona da el doble de puntos — ¡sorprende!',
  'Observa las fichas jugadas para anticipar rivales.',
];

function GameScreen({ navigate }) {
  const { DominoTile: DT, FaceDownTile: FDT, PlayerAvatar: PA, ScorePanel, ChatPanel, TipsPanel, MesaInfoPanel } = window;

  const [hand, setHand]         = React.useState(INIT_HAND);
  const [chain, setChain]       = React.useState(INIT_CHAIN);
  const [players, setPlayers]   = React.useState(INIT_PLAYERS_G);
  const [turn, setTurn]         = React.useState(2);
  const [selected, setSelected] = React.useState(null);
  const [dragging, setDragging] = React.useState(null);
  const [dropTarget, setDrop]   = React.useState(null);
  const [pollona, setPollona]   = React.useState(false);
  const [tipIdx, setTipIdx]     = React.useState(0);
  const [shake, setShake]       = React.useState(false);
  const isMyTurn = turn === 2;

  const PCOL = ['#3498DB','#E91E63','#D4AF37','#F39C12'];

  function advanceTurn(from) {
    const next = (from + 1) % 4;
    setTurn(next);
    setTipIdx(p => p + 1);
    if (next !== 2) {
      setTimeout(() => {
        setPlayers(p => p.map((pl,i) => i===next ? {...pl, tiles: Math.max(0, pl.tiles-1)} : pl));
        setChain(c => [...c, [Math.floor(Math.random()*9), Math.floor(Math.random()*9)]]);
        const after = (next + 1) % 4;
        setTurn(after);
        if (after !== 2) {
          setTimeout(() => {
            setPlayers(p => p.map((pl,i) => i===after ? {...pl, tiles: Math.max(0, pl.tiles-1)} : pl));
            setChain(c => [...c, [Math.floor(Math.random()*9), Math.floor(Math.random()*9)]]);
            const last = (after + 1) % 4;
            setTurn(last);
            if (last !== 2) {
              setTimeout(() => {
                setPlayers(p => p.map((pl,i) => i===last ? {...pl, tiles: Math.max(0, pl.tiles-1)} : pl));
                setChain(c => [...c, [Math.floor(Math.random()*9), Math.floor(Math.random()*9)]]);
                setTurn(2);
              }, 900);
            }
          }, 900);
        }
      }, 900);
    }
  }

  function playTile(idx, side = 'right') {
    if (!isMyTurn) return;
    const tile = hand[idx];
    const isDouble = tile[0] === tile[1];
    const newHand = hand.filter((_,i) => i !== idx);
    const newChain = side === 'right' ? [...chain, tile] : [tile, ...chain];
    setHand(newHand);
    setChain(newChain);
    setSelected(null);
    setDragging(null);
    setDrop(null);
    setPlayers(p => p.map((pl,i) => i===2 ? {...pl, score: pl.score + tile[0] + tile[1], tiles: newHand.length} : pl));
    if (newHand.length === 0) { setTimeout(() => navigate('results', {won:true, players}), 400); return; }
    if (isDouble) setPollona(true); else advanceTurn(2);
  }

  // Drag handlers
  const onDragStart = (e, i) => { e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',String(i)); setDragging(i); };
  const onDragEnd   = () => { setDragging(null); setDrop(null); };
  const onDZOver    = (e, side) => { e.preventDefault(); e.dataTransfer.dropEffect='move'; setDrop(side); };
  const onDZLeave   = () => setDrop(null);
  const onDZDrop    = (e, side) => { e.preventDefault(); const i = parseInt(e.dataTransfer.getData('text/plain')); if (!isNaN(i)) playTile(i, side); };

  const visibleChain = chain.slice(-7);

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', background:'#0D0D0D' }}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px', background:'rgba(0,0,0,0.9)', borderBottom:'1px solid rgba(212,175,55,0.15)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <window.Logo size="sm" />
          <window.OnlineDot label="Partida en vivo" />
        </div>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'rgba(212,175,55,0.6)', letterSpacing:'0.1em' }}>
          RONDA 3 · META: 100 PTS
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {['🔊','?'].map(ic => (
            <button key={ic} style={{ width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(247,241,227,0.6)',fontSize:13,cursor:'pointer' }}>{ic}</button>
          ))}
          <window.RedBtn size="sm" onClick={() => navigate('menu')}>ABANDONAR</window.RedBtn>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width:200, padding:'10px 8px 10px 12px', display:'flex', flexDirection:'column', gap:10, overflow:'hidden', flexShrink:0 }}>
          <ScorePanel players={players} round={3} target={100} />
          <ChatPanel messages={MESSAGES_G} players={players} />
        </div>

        {/* CENTER */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'8px 6px 0' }}>

          {/* North opponent */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, paddingBottom:6 }}>
            <PA name={players[0].name} score={players[0].score} isActive={turn===0} color={PCOL[0]} size={46} />
            <div style={{ display:'flex', gap:-8 }}>
              {Array.from({length: Math.min(players[0].tiles,10)}).map((_,i) => (
                <FDT key={i} width={22} height={44} style={{ marginLeft: i>0?-8:0, zIndex:i }} />
              ))}
            </div>
          </div>

          {/* Middle row */}
          <div style={{ flex:1, display:'flex', gap:8, alignItems:'stretch', minHeight:0 }}>

            {/* West */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, width:70 }}>
              <PA name={players[1].name} score={players[1].score} isActive={turn===1} color={PCOL[1]} size={46} />
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                {Array.from({length: Math.min(players[1].tiles,8)}).map((_,i) => (
                  <FDT key={i} width={22} height={44} style={{ marginTop: i>0?-10:0, zIndex:i }} />
                ))}
              </div>
            </div>

            {/* TABLE SURFACE */}
            <div style={{
              flex:1, borderRadius:24, overflow:'hidden', position:'relative',
              backgroundImage:`url('./assets/wood-texture.png')`, backgroundSize:'cover',
              border:'2px solid rgba(212,175,55,0.3)',
              boxShadow:'inset 0 0 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.5)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {/* Overlay */}
              <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(255,190,90,0.04) 0%,transparent 55%)',pointerEvents:'none' }} />
              <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.5) 100%)',pointerEvents:'none' }} />

              {/* Drop zone LEFT */}
              <div onDragOver={e=>onDZOver(e,'left')} onDragLeave={onDZLeave} onDrop={e=>onDZDrop(e,'left')}
                style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:52, height:80, borderRadius:8, border:`2px dashed ${dropTarget==='left'?'#D4AF37':'rgba(212,175,55,0.2)'}`, background:dropTarget==='left'?'rgba(212,175,55,0.15)':'transparent', display:'flex',alignItems:'center',justifyContent:'center', transition:'all 0.15s', zIndex:10 }}>
                <span style={{ fontSize:18, opacity: dropTarget==='left'?1:0.3 }}>⬅</span>
              </div>

              {/* Played chain */}
              <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', flexWrap:'wrap', gap:3, justifyContent:'center', padding:'0 72px', maxWidth:'100%' }}>
                {visibleChain.length === 0 ? (
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontStyle:'italic', fontSize:28, background:'linear-gradient(135deg,#C9A227,#F7E08A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', filter:'drop-shadow(2px 3px 3px rgba(0,0,0,0.7))' }}>Doble 9's</div>
                ) : visibleChain.map((t,i) => (
                  <DT key={i} left={t[0]} right={t[1]} orientation="horizontal" size={32} />
                ))}
              </div>

              {/* Drop zone RIGHT */}
              <div onDragOver={e=>onDZOver(e,'right')} onDragLeave={onDZLeave} onDrop={e=>onDZDrop(e,'right')}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:52, height:80, borderRadius:8, border:`2px dashed ${dropTarget==='right'?'#D4AF37':'rgba(212,175,55,0.2)'}`, background:dropTarget==='right'?'rgba(212,175,55,0.15)':'transparent', display:'flex',alignItems:'center',justifyContent:'center', transition:'all 0.15s', zIndex:10 }}>
                <span style={{ fontSize:18, opacity: dropTarget==='right'?1:0.3 }}>➡</span>
              </div>
            </div>

            {/* East */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, width:70 }}>
              <PA name={players[3].name} score={players[3].score} isActive={turn===3} color={PCOL[3]} size={46} />
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                {Array.from({length: Math.min(players[3].tiles,8)}).map((_,i) => (
                  <FDT key={i} width={22} height={44} style={{ marginTop: i>0?-10:0, zIndex:i }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width:230, padding:'10px 12px 10px 6px', display:'flex', flexDirection:'column', gap:10, flexShrink:0, overflow:'hidden' }}>
          <MesaInfoPanel />
          <TipsPanel tips={TIPS_G} tipIndex={tipIdx} manolitoImg="./assets/manolito-holding-tile.png" />
        </div>
      </div>

      {/* PLAYER HAND DOCK */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, padding:'12px 16px', flexShrink:0,
        background:'rgba(0,0,0,0.88)',
        borderTop:`2px solid ${isMyTurn ? '#0E7A43' : 'rgba(212,175,55,0.2)'}`,
        boxShadow: isMyTurn ? '0 -4px 24px rgba(14,122,67,0.2)' : 'none',
        transition:'border-color 0.4s, box-shadow 0.4s',
      }}>
        <PA name="Yo" score={players[2].score} isActive={isMyTurn} isMe color="#0E7A43" size={52} />
        {/* Tiles */}
        <div style={{ flex:1, display:'flex', gap:5, overflowX:'auto', alignItems:'flex-end', paddingBottom:4, scrollbarWidth:'none' }}>
          {hand.map((tile, i) => (
            <div key={i}
              draggable={isMyTurn}
              onDragStart={e => onDragStart(e, i)}
              onDragEnd={onDragEnd}
              onClick={() => isMyTurn && setSelected(s => s===i ? null : i)}
              style={{
                opacity: dragging===i ? 0.4 : 1,
                transition:'opacity 0.15s',
                cursor: isMyTurn ? 'grab' : 'default',
              }}
            >
              <DT left={tile[0]} right={tile[1]} orientation="vertical" size={40}
                selected={selected===i}
                onClick={() => {}} />
            </div>
          ))}
          {hand.length === 0 && <div style={{ fontFamily:'Montserrat,sans-serif', fontSize:13, fontWeight:700, color:'#D4AF37', opacity:0.7 }}>SIN FICHAS</div>}
        </div>
        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:7, flexShrink:0, minWidth:145 }}>
          <window.GreenBtn
            disabled={!isMyTurn || selected === null}
            onClick={() => selected !== null && playTile(selected, 'right')}
            style={{ fontSize:12, padding:'11px 20px' }}
          >JUGAR FICHA</window.GreenBtn>
          <window.GhostBtn size="sm" onClick={() => isMyTurn && advanceTurn(2)}>PASAR TURNO</window.GhostBtn>
        </div>
      </div>

      {/* POLLONA OVERLAY */}
      {pollona && (
        <div onClick={() => { setPollona(false); advanceTurn(2); }} style={{
          position:'fixed', inset:0, zIndex:1000,
          background:'rgba(0,0,0,0.9)', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:14, cursor:'pointer',
          animation:'pollonaShake 0.4s ease',
        }}>
          <img src="./assets/pollona-greenscreen.png" alt="Pollona" style={{ height:240, objectFit:'contain', animation:'pollonaFadeIn 0.35s ease' }} />
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontStyle:'italic', fontSize:52, color:'#D4AF37', letterSpacing:'0.02em', textShadow:'3px 3px 0 #6B0000', animation:'pollonaTextIn 0.4s 0.15s both' }}>¡POLLONAAAA!</div>
          <div style={{ fontSize:12, color:'rgba(247,241,227,0.4)', fontFamily:'Inter,sans-serif' }}>Toca para continuar</div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { GameScreen });
