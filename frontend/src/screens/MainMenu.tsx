// screens/MainMenu.tsx — (3) Main Menu. From design-reference/main-menu.jsx.
// AGENT: Frontend.
import { useEffect } from "react";
import { Logo, GoldBtn, Panel, OnlineDot, ChromaImg } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav, type NavKey } from "@/lib/nav";
import { useUserStore } from "@/store/userStore";
import { api } from "@/services/api";


const QUICK: Array<{ id: NavKey; label: string; sub: string; icon: string }> = [
  { id: "setup", label: "1 JUGADOR", sub: "vs CPU inteligente", icon: "🤖" },
  { id: "lobby", label: "MULTIJUGADOR", sub: "Con amigos o rivales", icon: "👥" },
  { id: "tournament", label: "TORNEO", sub: "Competencia oficial", icon: "🏆" },
  { id: "league", label: "LIGA", sub: "Temporada activa", icon: "⚡" },
];

const NAV: Array<{ id: NavKey; label: string; icon: string }> = [
  { id: "tutorial", label: "Tutorial", icon: "📖" },
  { id: "profile", label: "Perfil", icon: "👤" },
  { id: "store", label: "Tienda", icon: "🛒" },
  { id: "settings", label: "Config.", icon: "⚙️" },
];

export default function MainMenu() {
  const go = useGameNav();
  const user = useUserStore((s) => s.user);
  const stats = useUserStore((s) => s.stats);

  useEffect(() => {
    if (user?.id) {
      api.userStats(user.id)
        .then((res) => {
          useUserStore.getState().setStats(res);
        })
        .catch((e) => console.error("failed to fetch stats", e));
    }
  }, [user?.id]);

  const username = user?.username ?? "Jugador";
  const level = stats?.level ?? 1;
  const league = stats?.leagueTier ?? "Bronze";
  const coins = stats?.coins ?? 100;
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="s-menu s-wood">
      <div className="s-menu__glow" />

      <div className="s-menu__top">
        <Logo size="sm" />
        <div className="s-menu__top-right">
          <OnlineDot label="2,418 en línea" />
          <div className="s-menu__user">
            <div className="s-menu__user-av">{initial}</div>
            <div>
              <div className="s-menu__user-name">{username}</div>
              <div className="s-menu__user-lvl">★ Nivel {level} · {league}</div>
            </div>
          </div>
          <div className="s-menu__coins">
            <span>🪙</span>
            <span>{coins}</span>
          </div>
        </div>
      </div>


      <div className="s-menu__main">
        <div className="s-menu__left">
          <ChromaImg
            className="s-menu__manolito"
            src={ASSETS.manolitoWave}
            alt="Manolito"
          />
          <Panel gold className="s-menu__daily">
            <div className="s-menu__daily-h">⚡ Desafío del Día</div>
            <div className="s-menu__daily-t">
              Gana 3 partidas con capicúa
            </div>
            <div className="s-menu__daily-track">
              <div className="s-menu__daily-fill" />
            </div>
            <div className="s-menu__daily-n">1 / 3 completadas</div>
          </Panel>
        </div>

        <div className="s-menu__center">
          <Logo size="lg" tagline />
          <GoldBtn
            size="lg"
            className="s-menu__cta"
            onClick={() => go("setup")}
          >
            ¡JUGAR!
          </GoldBtn>
          <div className="s-menu__grid">
            {QUICK.map((a) => (
              <div
                key={a.id}
                className="s-menu__card"
                onClick={() => go(a.id)}
              >
                <div className="s-menu__card-ic">{a.icon}</div>
                <div>
                  <div className="s-menu__card-l">{a.label}</div>
                  <div className="s-menu__card-s">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="s-menu__right">
          {NAV.map((n) => (
            <button
              key={n.id}
              className="s-menu__nav"
              onClick={() => go(n.id)}
            >
              <span className="s-menu__nav-ic">{n.icon}</span>
              <span className="s-menu__nav-l">{n.label}</span>
            </button>
          ))}
          <div className="s-menu__friends">
            <div className="s-menu__friends-h">● Amigos</div>
            <div className="s-menu__friends-t">3 amigos en línea</div>
            <button
              className="s-menu__friends-btn"
              onClick={() => go("lobby")}
            >
              VER AMIGOS
            </button>
          </div>
        </div>
      </div>

      <div className="s-menu__bottom">
        <div className="s-menu__bottom-l">
          Doble 9's · La mesa ya no tiene fronteras
        </div>
        <div className="s-menu__bottom-r">
          {["🔊", "❓", "📋"].map((ic) => (
            <button key={ic} className="s-menu__icbtn">
              {ic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
