// screens/tutorial.jsx — Tutorial Screen (7) — 10 steps
// Depends on: window.GoldBtn, window.GhostBtn, window.Panel, window.NavHeader, window.ScreenWrap, window.DominoTile

const TUTORIAL_STEPS = [
  {
    title: '¿Qué es el Dominó Cubano?',
    body: 'El dominó cubano es un juego de mesa para 4 jugadores donde se usan fichas con dos mitades numeradas. El objetivo es quedar sin fichas o acumular la menor puntuación posible. ¡Es rápido, estratégico y muy divertido!',
    tip: '¡La mesa es donde nace la amistad y la rivalidad!',
    visual: 'overview',
  },
  {
    title: 'Las Fichas del Doble 9',
    body: 'El juego usa 55 fichas con valores del 0 al 9. Cada ficha tiene dos mitades con un número cada una. Las fichas "dobles" (0-0, 1-1... 9-9) tienen el mismo número en ambas mitades y son especialmente poderosas.',
    tip: 'El Doble 9 es la ficha más alta y quien la tenga ¡comienza la partida!',
    visual: 'tiles',
  },
  {
    title: 'Preparando la Partida',
    body: 'Las 55 fichas se mezclan boca abajo y cada jugador toma 10. Las 15 fichas restantes forman el "boneyard" (cementerio). Coloca tus fichas de pie para que solo tú las veas.',
    tip: 'Nunca muestres tus fichas. ¡El secreto es parte de la estrategia!',
    visual: 'deal',
  },
  {
    title: '¿Quién Comienza?',
    body: 'El jugador que tenga el doble más alto (generalmente el 9-9) coloca su ficha primero. Si nadie tiene dobles, comienza quien tenga la ficha más alta. Desde ahí se juega en sentido de las agujas del reloj.',
    tip: '¡El Doble 9 es el rey de la mesa! Quien lo tenga parte con ventaja.',
    visual: 'start',
  },
  {
    title: 'Cómo Jugar una Ficha',
    body: 'En tu turno debes colocar una ficha cuyos extremos coincidan con alguno de los números libres en los extremos de la cadena. Arrastra tu ficha al extremo que corresponda. Si no puedes jugar, debes robar del boneyard.',
    tip: 'Las fichas se pueden girar 180° para adaptarlas — explora las dos posiciones.',
    visual: 'play',
  },
  {
    title: 'Pasar el Turno',
    body: 'Si el boneyard está vacío y no puedes jugar ninguna ficha, debes pasar tu turno. El juego continúa con el siguiente jugador. ¡Pasar demasiado puede costarte la partida!',
    tip: 'Guardar fichas versátiles (las que pegan en muchos lados) es clave para no pasar.',
    visual: 'pass',
  },
  {
    title: 'La Capicúa ✦',
    body: 'La capicúa ocurre cuando juegas la última ficha y ambos extremos de la cadena coinciden con tus números. Es un cierre perfecto que vale el doble de puntos — ¡una jugada de maestro!',
    tip: '¡La capicúa es la jugada más elegante del dominó. Planifícala con cuidado!',
    visual: 'capicua',
  },
  {
    title: '¡Pollonaaaa! 🐔',
    body: 'La Pollona ocurre cuando un jugador gana sin haber jugado ni una sola ficha (su equipo las jugó todas). Es la victoria más vergonzosa para el rival — ¡y la más celebrada en la mesa!',
    tip: '¡Cuidado con la Pollona! Manolito y su gallina aparecen para celebrarla.',
    visual: 'pollona',
  },
  {
    title: 'Contando los Puntos',
    body: 'La ronda termina cuando alguien juega todas sus fichas o nadie puede mover. Los perdedores suman el valor de sus fichas restantes. El ganador va acumulando esa puntuación. ¡Llega a 100 puntos para ganar la partida!',
    tip: 'Vaciarte de fichas altas rápido reduce tu riesgo de sumar puntos al rival.',
    visual: 'score',
  },
  {
    title: '¡A La Mesa!',
    body: '¡Ya conoces todo lo que necesitas para jugar! Recuerda: el dominó cubano es pasión, estrategia y mucha diversión. Cada partida es única. ¡Que comience el juego!',
    tip: '¡La mesa ya no tiene fronteras! Juega con gente de todo el mundo.',
    visual: 'ready',
  },
];

function TutorialVisual({ type, step }) {
  const { DominoTile: DT } = window;

  if (type === 'tiles') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', padding:'8px 0' }}>
      {[[9,9],[0,0],[5,3],[7,2],[4,8],[1,6]].map((t,i) => (
        <DT key={i} left={t[0]} right={t[1]} orientation="vertical" size={38} />
      ))}
    </div>
  );

  if (type === 'play') return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {[[2,4],[4,4],[4,7],[7,3]].map((t,i) => (
          <DT key={i} left={t[0]} right={t[1]} orientation="horizontal" size={34} />
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ padding:'6px 14px', borderRadius:9999, background:'rgba(14,122,67,0.15)', border:'1px solid rgba(14,122,67,0.4)', fontSize:11, color:'#0E7A43', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>← extremo: 2</div>
        <div style={{ padding:'6px 14px', borderRadius:9999, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.35)', fontSize:11, color:'#D4AF37', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>extremo: 3 →</div>
      </div>
    </div>
  );

  if (type === 'capicua') return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {[[5,3],[3,1],[1,7],[7,5]].map((t,i) => (
          <DT key={i} left={t[0]} right={t[1]} orientation="horizontal" size={32}
            style={{ filter: i===0||i===3 ? 'drop-shadow(0 0 6px rgba(212,175,55,0.7))' : 'none' }} />
        ))}
      </div>
      <div style={{ padding:'6px 16px', borderRadius:9999, background:'rgba(212,175,55,0.15)', border:'1.5px solid #D4AF37', fontSize:12, fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#D4AF37', letterSpacing:'0.08em' }}>✦ CAPICÚA — DOBLE PUNTOS</div>
    </div>
  );

  if (type === 'pollona') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <img src="./assets/pollona-greenscreen.png" alt="Pollona" style={{ height:100, objectFit:'contain', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.8))' }} />
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontStyle:'italic', fontSize:22, color:'#D4AF37' }}>¡POLLONAAAA!</div>
    </div>
  );

  if (type === 'score') return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%' }}>
      {[['Luisito','43 pts','#3498DB'],['Maritza','28 pts','#E91E63'],['Yo — GANADOR','0 pts','#D4AF37'],['El Tigre','19 pts','#F39C12']].map(([name,pts,col]) => (
        <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 14px', borderRadius:8, background: name.includes('GANADOR') ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.3)', border:`1px solid ${name.includes('GANADOR') ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:col }} />
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'#F7F1E3' }}>{name}</span>
          </div>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:name.includes('GANADOR')?'#D4AF37':'#F7F1E3' }}>{pts}</span>
        </div>
      ))}
    </div>
  );

  if (type === 'ready') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <img src="./assets/manolito-waving.png" alt="Manolito" style={{ height:160, objectFit:'contain', filter:'drop-shadow(0 10px 20px rgba(0,0,0,0.8))', animation:'float 3s ease-in-out infinite' }} />
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:18, color:'#D4AF37', textAlign:'center' }}>¡Estás listo para jugar!</div>
    </div>
  );

  // Default: diagram with dots
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', padding:'16px 0' }}>
      {[[step+1,step%5],[step%4,step+2],[step%3,step+1]].map((t,i) => (
        <DT key={i} left={t[0]%10} right={t[1]%10} orientation="vertical" size={44} />
      ))}
    </div>
  );
}

function TutorialScreen({ navigate }) {
  const [step, setStep] = React.useState(0);
  const total = TUTORIAL_STEPS.length;
  const cur = TUTORIAL_STEPS[step];
  const isLast = step === total - 1;

  return (
    <window.ScreenWrap style={{ backgroundImage:`url('./assets/wood-texture.png')`, backgroundSize:'cover', backgroundBlendMode:'overlay' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(13,13,13,0.88)', pointerEvents:'none' }} />

      <window.NavHeader title={`TUTORIAL — PASO ${step+1} DE ${total}`} onBack={() => step > 0 ? setStep(s=>s-1) : navigate('menu')} />

      {/* Progress bar */}
      <div style={{ height:3, background:'rgba(212,175,55,0.12)', flexShrink:0, position:'relative', zIndex:1 }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#C9A227,#F2D27A)', width:`${((step+1)/total)*100}%`, transition:'width 0.35s ease', boxShadow:'0 0 8px rgba(212,175,55,0.5)' }} />
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative', zIndex:1 }}>

        {/* LEFT — Content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'32px 5% 32px 6%', gap:24, animation:'screenFadeIn 0.3s ease' }} key={step}>
          {/* Step dots */}
          <div style={{ display:'flex', gap:6 }}>
            {Array.from({length:total}).map((_,i) => (
              <div key={i} onClick={() => setStep(i)} style={{
                width: i===step ? 24 : 8, height:8, borderRadius:9999,
                background: i<=step ? '#D4AF37' : 'rgba(212,175,55,0.2)',
                transition:'all 0.3s', cursor:'pointer',
              }} />
            ))}
          </div>

          {/* Title */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.18em', color:'rgba(212,175,55,0.55)', fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', marginBottom:8 }}>Paso {step+1}</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:28, color:'#F7F1E3', lineHeight:1.15, letterSpacing:'-0.01em' }}>{cur.title}</div>
          </div>

          {/* Body */}
          <div style={{ fontSize:15, color:'rgba(247,241,227,0.72)', fontFamily:'Inter,sans-serif', lineHeight:1.7, maxWidth:520 }}>
            {cur.body}
          </div>

          {/* Visual */}
          <window.Panel style={{ padding:'20px', maxWidth:460 }}>
            <TutorialVisual type={cur.visual} step={step} />
          </window.Panel>

          {/* Navigation */}
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            {step > 0 && <window.GhostBtn onClick={() => setStep(s=>s-1)}>ANTERIOR</window.GhostBtn>}
            {isLast ? (
              <window.GoldBtn size="lg" onClick={() => navigate('menu')}>¡A JUGAR!</window.GoldBtn>
            ) : (
              <window.GoldBtn onClick={() => setStep(s=>s+1)}>SIGUIENTE →</window.GoldBtn>
            )}
            {!isLast && (
              <button onClick={() => navigate('menu')} style={{ background:'none', border:'none', fontSize:12, color:'rgba(247,241,227,0.3)', fontFamily:'Inter,sans-serif', cursor:'pointer', marginLeft:'auto' }}>
                Saltar tutorial
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Manolito + tip */}
        <div style={{ flex:'0 0 280px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', padding:'20px 40px 40px', gap:16 }}>
          <img src="./assets/manolito-holding-tile.png" alt="Manolito"
            style={{ height:200, objectFit:'contain', filter:'drop-shadow(0 16px 32px rgba(0,0,0,0.8))', animation:'float 3.5s ease-in-out infinite' }}
          />
          {/* Speech bubble */}
          <window.Panel style={{ padding:'14px 16px', position:'relative' }} gold>
            <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderBottom:'10px solid rgba(212,175,55,0.45)' }} />
            <div style={{ fontSize:12, color:'rgba(247,241,227,0.8)', fontFamily:'Inter,sans-serif', lineHeight:1.55, textAlign:'center', fontStyle:'italic' }}>
              "{cur.tip}"
            </div>
            <div style={{ fontSize:10, fontWeight:700, color:'#D4AF37', fontFamily:'Montserrat,sans-serif', textAlign:'center', marginTop:8, letterSpacing:'0.06em' }}>— Manolito Doble 9</div>
          </window.Panel>
        </div>
      </div>
    </window.ScreenWrap>
  );
}

Object.assign(window, { TutorialScreen });
