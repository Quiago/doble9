// screens/Landing.tsx — (2) Landing. From design-reference/splash-landing.jsx.
// AGENT: Frontend.
import { Logo, GoldBtn, GhostBtn, OnlineDot, ChromaImg } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav, type NavKey } from "@/lib/nav";

const FEATURES = [
  "Doble 9 Completo",
  "4 Jugadores",
  "Tiempo Real",
  "Capicúa ✦",
  "Torneos",
  "Liga Global",
];

const SOCIAL = [
  { c: "#3498DB", i: "L" },
  { c: "#E91E63", i: "M" },
  { c: "#D4AF37", i: "Y" },
  { c: "#0E7A43", i: "T" },
];

const BAR_LINKS: Array<{ label: string; key: NavKey }> = [
  { label: "Liga", key: "league" },
  { label: "Torneo", key: "tournament" },
  { label: "Tienda", key: "store" },
];

export default function Landing() {
  const go = useGameNav();

  return (
    <div className="s-landing s-wood">
      <div className="s-landing__overlay" />
      <div className="s-landing__vignette" />

      <div className="s-landing__body">
        <div className="s-landing__text">
          <Logo size="lg" tagline />

          <div>
            <div className="s-landing__headline">
              La mesa ya no
              <br />
              <span>tiene fronteras</span>
            </div>
            <div className="s-landing__sub">
              El dominó cubano más auténtico del mundo digital. Juega con
              amigos o enfrenta rivales de todo el mundo, con las reglas que
              conoces y el sabor de siempre.
            </div>
          </div>

          <div className="s-landing__cta">
            <GoldBtn size="lg" onClick={() => go("menu")}>
              JUGAR AHORA
            </GoldBtn>
            <GhostBtn size="lg" onClick={() => go("tutorial")}>
              VER TUTORIAL
            </GhostBtn>
          </div>

          <div className="s-landing__chips">
            {FEATURES.map((f) => (
              <div key={f} className="s-chip">
                {f}
              </div>
            ))}
          </div>

          <div className="s-landing__social">
            <div className="s-avatars">
              {SOCIAL.map((s, i) => (
                <div
                  key={i}
                  className="s-avatars__a"
                  style={{ background: `linear-gradient(135deg,#1a1a1a,${s.c})` }}
                >
                  {s.i}
                </div>
              ))}
            </div>
            <div>
              <div className="s-landing__count">+2,400 jugadores</div>
              <div className="s-landing__count-sub">
                en línea ahora mismo
              </div>
            </div>
          </div>
        </div>

        <div className="s-landing__hero">
          <div className="s-landing__hero-glow" />
          <ChromaImg
            className="s-landing__hero-img"
            src={ASSETS.manolitoWave}
            alt="Manolito"
          />
        </div>
      </div>

      <div className="s-landing__bar">
        <OnlineDot label="2,418 jugadores en línea" />
        <div className="s-landing__bar-mid">
          Dominó Cubano · Doble Nueve
        </div>
        <div className="s-landing__bar-links">
          {BAR_LINKS.map((l) => (
            <button
              key={l.key}
              className="s-textlink"
              onClick={() => go(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
