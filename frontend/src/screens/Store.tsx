// screens/Store.tsx — (10) Store. From design-reference/store.jsx.
// AGENT: Frontend. Catalog is mock until GET /store/items + POST purchase wire.
import { useState } from "react";
import { ScreenWrap, NavHeader, GoldBtn, GreenBtn } from "@/components";
import { useGameNav } from "@/lib/nav";
import { dlog } from "@/lib/debug";

type TabId = "avatares" | "fichas" | "mesas" | "efectos";

interface Item {
  id: string;
  name: string;
  price: number;
  gem: boolean;
  gemCost?: number;
  new?: boolean;
  preview: string;
}

const ITEMS: Record<TabId, Item[]> = {
  avatares: [
    { id: "av-default", name: "Manolito Clásico", price: 0, gem: false, new: false, preview: "🤵" },
    { id: "av-guayabera", name: "Guayabera Gold", price: 1200, gem: false, new: true, preview: "👘" },
    { id: "av-tigre", name: "El Tigre", price: 800, gem: false, new: false, preview: "🐯" },
    { id: "av-reina", name: "La Reina", price: 1500, gem: false, new: true, preview: "👑" },
    { id: "av-cubano", name: "El Cubano", price: 0, gem: true, gemCost: 15, preview: "🎺" },
    { id: "av-marine", name: "Marinero", price: 600, gem: false, new: false, preview: "⚓" },
  ],
  fichas: [
    { id: "tile-classic", name: "Clásico Crema", price: 0, gem: false, new: false, preview: "🀱" },
    { id: "tile-gold", name: "Doradas Premium", price: 2000, gem: false, new: true, preview: "✨" },
    { id: "tile-marble", name: "Mármol Blanco", price: 1400, gem: false, new: false, preview: "🪨" },
    { id: "tile-dark", name: "Ébano Oscuro", price: 900, gem: false, new: false, preview: "🖤" },
    { id: "tile-crystal", name: "Cristal Azul", price: 0, gem: true, gemCost: 25, preview: "💎" },
    { id: "tile-retro", name: "Retro 70s", price: 700, gem: false, new: false, preview: "🎨" },
  ],
  mesas: [
    { id: "tbl-wood", name: "Caoba Cubana", price: 0, gem: false, new: false, preview: "🪵" },
    { id: "tbl-felt", name: "Tapete Verde", price: 800, gem: false, new: false, preview: "🟩" },
    { id: "tbl-marble", name: "Mármol de Lujo", price: 1800, gem: false, new: true, preview: "⬜" },
    { id: "tbl-neon", name: "Neón Miami", price: 0, gem: true, gemCost: 30, preview: "💫" },
  ],
  efectos: [
    { id: "fx-default", name: "Estándar", price: 0, gem: false, new: false, preview: "✦" },
    { id: "fx-fire", name: "Ficha en Llamas", price: 1200, gem: false, new: true, preview: "🔥" },
    { id: "fx-confetti", name: "Lluvia de Confetti", price: 900, gem: false, new: false, preview: "🎊" },
    { id: "fx-lightning", name: "Relámpago", price: 0, gem: true, gemCost: 20, preview: "⚡" },
  ],
};

const TABS: Array<[TabId, string]> = [
  ["avatares", "Avatares"],
  ["fichas", "Fichas"],
  ["mesas", "Mesas"],
  ["efectos", "Efectos"],
];

export default function Store() {
  const go = useGameNav();
  const [tab, setTab] = useState<TabId>("avatares");
  const [owned, setOwned] = useState<Set<string>>(new Set(["av-default", "tile-classic"]));

  const buy = (item: Item) => {
    if (owned.has(item.id)) return;
    dlog("ui", `store buy=${item.id}`);
    setOwned((prev) => new Set([...prev, item.id]));
  };

  return (
    <ScreenWrap>
      <NavHeader
        title="TIENDA"
        onBack={() => go("menu")}
        right={
          <div className="s-store__wallet">
            <span className="s-store__coins">🪙 2,450</span>
            <span className="s-store__gems">💎 30</span>
          </div>
        }
      />

      <div className="s-store__body">
        <div className="s-store__featured">
          <div className="s-store__feat-text">
            <div className="s-store__feat-kicker">⚡ Oferta Especial — 48h</div>
            <div className="s-store__feat-title">Pack Campeón</div>
            <div className="s-store__feat-sub">Avatar Gold + Fichas Doradas + Mesa Mármol</div>
            <div className="s-store__feat-price">
              <span className="s-store__feat-now">💎 49</span>
              <span className="s-store__feat-old">💎 90</span>
              <span className="s-store__feat-off">-45%</span>
            </div>
          </div>
          <div className="s-store__feat-icons">
            <span>✨</span>
            <span>🪨</span>
          </div>
          <GoldBtn size="md">COMPRAR PACK</GoldBtn>
        </div>

        <div className="s-store__tabs">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              className={`s-store__tab${tab === id ? " is-active" : ""}`}
              onClick={() => {
                dlog("ui", `store tab=${id}`);
                setTab(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="s-store__grid">
          {ITEMS[tab].map((item) => {
            const isOwned = owned.has(item.id);
            return (
              <div key={item.id} className={`s-store__item${isOwned ? " is-owned" : ""}`}>
                {item.new && !isOwned && <div className="s-store__tag s-store__tag--new">NUEVO</div>}
                {isOwned && <div className="s-store__tag s-store__tag--owned">✓ TUYO</div>}
                <div className="s-store__preview">{item.preview}</div>
                <div className="s-store__info">
                  <div className="s-store__name">{item.name}</div>
                  {isOwned ? (
                    <div className="s-store__equipped">EQUIPADO ✓</div>
                  ) : item.price === 0 && !item.gem ? (
                    <GreenBtn size="sm" fullWidth onClick={() => buy(item)}>GRATIS</GreenBtn>
                  ) : item.gem ? (
                    <button className="s-store__buy s-store__buy--gem" onClick={() => buy(item)}>
                      💎 {item.gemCost} gemas
                    </button>
                  ) : (
                    <button className="s-store__buy s-store__buy--coin" onClick={() => buy(item)}>
                      🪙 {item.price.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="s-store__getcoins">
          <div>
            <div className="s-store__getcoins-t">¿Necesitas más monedas?</div>
            <div className="s-store__getcoins-s">Gana jugando o compra paquetes de monedas y gemas.</div>
          </div>
          <GoldBtn size="sm">VER PAQUETES</GoldBtn>
        </div>
      </div>
    </ScreenWrap>
  );
}
