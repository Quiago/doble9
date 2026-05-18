// screens/Splash.tsx — (1) Splash. From design-reference/splash-landing.jsx.
// AGENT: Frontend.
import { useEffect, useState } from "react";
import { Logo, ChromaImg } from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav } from "@/lib/nav";
import { dlog } from "@/lib/debug";

export default function Splash() {
  const go = useGameNav();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    dlog("splash", "mount — progress timer start (2600ms)");
    const start = Date.now();
    const dur = 2600;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    let lastLogged = -1;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setProgress(p);
      const bucket = Math.floor(p * 4); // log at 0/25/50/75/100%
      if (bucket !== lastLogged) {
        lastLogged = bucket;
        dlog("splash", `progress ${(p * 100).toFixed(0)}%`);
      }
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        dlog("splash", "progress complete → navigate(landing) in 200ms");
        timer = setTimeout(() => go("landing"), 200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      dlog("splash", "cleanup (cancel rAF + timer)");
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [go]);

  return (
    <div className="s-splash s-wood">
      <div className="s-splash__glow" />
      <div className="s-splash__logo">
        <Logo size="xl" tagline />
      </div>
      <ChromaImg className="s-splash__manolito" src={ASSETS.manolitoWave} />
      <div className="s-splash__progress">
        <div className="s-splash__track">
          <div className="s-splash__bar" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="s-splash__loading">Cargando…</div>
      </div>
      <div className="s-splash__version">v1.0.0-beta</div>
    </div>
  );
}
