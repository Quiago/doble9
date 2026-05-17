// screens/store.jsx — Store (10)

function StoreScreen({ navigate }) {
  const [tab, setTab] = React.useState('avatares');
  const [owned, setOwned] = React.useState(new Set(['av-default','tile-classic']));

  const items = {
    avatares: [
      { id:'av-default',  name:'Manolito Clásico',  price:0,    gem:false, new:false,  preview:'🤵' },
      { id:'av-guayabera',name:'Guayabera Gold',    price:1200, gem:false, new:true,   preview:'👘' },
      { id:'av-tigre',    name:'El Tigre',           price:800,  gem:false, new:false,  preview:'🐯' },
      { id:'av-reina',    name:'La Reina',           price:1500, gem:false, new:true,   preview:'👑' },
      { id:'av-cubano',   name:'El Cubano',          price:0,    gem:true,  gemCost:15, preview:'🎺' },
      { id:'av-marine',   name:'Marinero',           price:600,  gem:false, new:false,  preview:'⚓' },
    ],
    fichas: [
      { id:'tile-classic',name:'Clásico Crema',     price:0,    gem:false, new:false,  preview:'🀱' },
      { id:'tile-gold',   name:'Doradas Premium',   price:2000, gem:false, new:true,   preview:'✨' },
      { id:'tile-marble', name:'Mármol Blanco',      price:1400, gem:false, new:false,  preview:'🪨' },
      { id:'tile-dark',   name:'Ébano Oscuro',       price:900,  gem:false, new:false,  preview:'🖤' },
      { id:'tile-crystal',name:'Cristal Azul',       price:0,    gem:true,  gemCost:25, preview:'💎' },
      { id:'tile-retro',  name:'Retro 70s',          price:700,  gem:false, new:false,  preview:'🎨' },
    ],
    mesas: [
      { id:'tbl-wood',    name:'Caoba Cubana',       price:0,    gem:false, new:false,  preview:'🪵' },
      { id:'tbl-felt',    name:'Tapete Verde',        price:800,  gem:false, new:false,  preview:'🟩' },
      { id:'tbl-marble',  name:'Mármol de Lujo',     price:1800, gem:false, new:true,   preview:'⬜' },
      { id:'tbl-neon',    name:'Neón Miami',          price:0,    gem:true,  gemCost:30, preview:'💫' },
    ],
    efectos: [
      { id:'fx-default',  name:'Estándar',            price:0,    gem:false, new:false,  preview:'✦' },
      { id:'fx-fire',     name:'Ficha en Llamas',     price:1200, gem:false, new:true,   preview:'🔥' },
      { id:'fx-confetti', name:'Lluvia de Confetti',  price:900,  gem:false, new:false,  preview:'🎊' },
      { id:'fx-lightning',name:'Relámpago',            price:0,    gem:true,  gemCost:20, preview:'⚡' },
    ],
  };

  function buy(item) {
    if (owned.has(item.id)) return;
    setOwned(prev => new Set([...prev, item.id]));
  }

  const tabs = [['avatares','Avatares'],['fichas','Fichas'],['mesas','Mesas'],['efectos','Efectos']];
  const currentItems = items[tab] || [];

  return (
    <window.ScreenWrap>
      <window.NavHeader title="TIENDA" onBack={() => navigate('menu')} right={
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:9999, padding:'5px 12px' }}>
            <span style={{ fontSize:13 }}>🪙</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#D4AF37' }}>2,450</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(52,152,219,0.1)', border:'1px solid rgba(52,152,219,0.3)', borderRadius:9999, padding:'5px 12px' }}>
            <span style={{ fontSize:13 }}>💎</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#3498DB' }}>30</span>
          </div>
        </div>
      } />

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* FEATURED BANNER */}
        <div style={{
          margin:'16px 5% 0', borderRadius:16, overflow:'hidden',
          background:'linear-gradient(135deg,#1a0e00 0%,#3A2416 40%,#C9A227 100%)',
          border:'1px solid rgba(212,175,55,0.4)', padding:'20px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexShrink:0,
          boxShadow:'0 8px 32px rgba(212,175,55,0.15)',
        }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', color:'rgba(212,175,55,0.7)', fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', marginBottom:6 }}>⚡ Oferta Especial — 48h</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#F7F1E3', lineHeight:1.2 }}>Pack Campeón</div>
            <div style={{ fontSize:12, color:'rgba(247,241,227,0.6)', fontFamily:'Inter,sans-serif', marginTop:6 }}>Avatar Gold + Fichas Doradas + Mesa Mármol</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:12 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#D4AF37' }}>💎 49</div>
              <div style={{ fontSize:12, color:'rgba(247,241,227,0.35)', textDecoration:'line-through', fontFamily:'Inter,sans-serif' }}>💎 90</div>
              <div style={{ padding:'3px 10px', borderRadius:9999, background:'rgba(231,76,60,0.2)', border:'1px solid rgba(231,76,60,0.4)', fontSize:10, fontWeight:700, color:'#E74C3C', fontFamily:'Montserrat,sans-serif' }}>-45%</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:-8, flexShrink:0 }}>
            {['✨','🪨'].map((ic,i) => (
              <div key={i} style={{ width:60, height:60, borderRadius:12, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginLeft: i>0?-12:0 }}>{ic}</div>
            ))}
          </div>
          <window.GoldBtn size="md" onClick={() => {}} style={{ flexShrink:0 }}>COMPRAR PACK</window.GoldBtn>
        </div>

        {/* TABS */}
        <div style={{ padding:'16px 5% 0', flexShrink:0 }}>
          <div style={{ display:'flex', gap:0, background:'rgba(0,0,0,0.4)', borderRadius:9999, padding:3, alignSelf:'flex-start', width:'fit-content' }}>
            {tabs.map(([id,label]) => (
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

        {/* ITEM GRID */}
        <div style={{ flex:1, padding:'16px 5% 24px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
          {currentItems.map(item => {
            const isOwned = owned.has(item.id);
            return (
              <div key={item.id} style={{
                borderRadius:14, overflow:'hidden',
                background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)',
                border:`1px solid ${isOwned ? 'rgba(14,122,67,0.4)' : 'rgba(212,175,55,0.18)'}`,
                transition:'all 0.2s', cursor:'pointer', position:'relative',
                boxShadow: isOwned ? '0 4px 16px rgba(14,122,67,0.15)' : 'none',
              }}
              onMouseEnter={e => !isOwned && (e.currentTarget.style.borderColor='rgba(212,175,55,0.45)')}
              onMouseLeave={e => !isOwned && (e.currentTarget.style.borderColor='rgba(212,175,55,0.18)')}
              >
                {item.new && !isOwned && (
                  <div style={{ position:'absolute', top:10, right:10, padding:'2px 8px', borderRadius:9999, background:'#E74C3C', fontSize:9, fontWeight:800, color:'#fff', fontFamily:'Montserrat,sans-serif', letterSpacing:'0.06em' }}>NUEVO</div>
                )}
                {isOwned && (
                  <div style={{ position:'absolute', top:10, right:10, padding:'2px 8px', borderRadius:9999, background:'rgba(14,122,67,0.8)', fontSize:9, fontWeight:800, color:'#F7F1E3', fontFamily:'Montserrat,sans-serif', letterSpacing:'0.06em' }}>✓ TUYO</div>
                )}
                {/* Preview */}
                <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', background: isOwned ? 'rgba(14,122,67,0.08)' : 'rgba(212,175,55,0.04)', fontSize:44, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  {item.preview}
                </div>
                {/* Info */}
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#F7F1E3', marginBottom:6, lineHeight:1.2 }}>{item.name}</div>
                  {isOwned ? (
                    <div style={{ padding:'7px', borderRadius:9999, background:'rgba(14,122,67,0.15)', border:'1px solid rgba(14,122,67,0.35)', textAlign:'center', fontSize:11, fontWeight:700, color:'#0E7A43', fontFamily:'Montserrat,sans-serif' }}>EQUIPADO ✓</div>
                  ) : item.price === 0 && !item.gem ? (
                    <window.GreenBtn size="sm" fullWidth onClick={() => buy(item)} style={{ fontSize:11, padding:'7px' }}>GRATIS</window.GreenBtn>
                  ) : item.gem ? (
                    <button onClick={() => buy(item)} style={{ width:'100%', padding:'7px', borderRadius:9999, border:'1px solid rgba(52,152,219,0.4)', background:'rgba(52,152,219,0.1)', color:'#3498DB', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, cursor:'pointer', transition:'all 0.15s' }}>
                      💎 {item.gemCost} gemas
                    </button>
                  ) : (
                    <button onClick={() => buy(item)} style={{ width:'100%', padding:'7px', borderRadius:9999, border:'1px solid rgba(212,175,55,0.3)', background:'rgba(212,175,55,0.1)', color:'#D4AF37', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, cursor:'pointer', transition:'all 0.15s' }}>
                      🪙 {item.price.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* GET COINS */}
        <div style={{ margin:'0 5% 24px', padding:'16px 20px', borderRadius:14, background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#F7F1E3' }}>¿Necesitas más monedas?</div>
            <div style={{ fontSize:12, color:'rgba(247,241,227,0.45)', fontFamily:'Inter,sans-serif', marginTop:3 }}>Gana jugando o compra paquetes de monedas y gemas.</div>
          </div>
          <window.GoldBtn size="sm">VER PAQUETES</window.GoldBtn>
        </div>
      </div>
    </window.ScreenWrap>
  );
}

Object.assign(window, { StoreScreen });
