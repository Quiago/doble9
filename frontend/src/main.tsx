import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { dbanner, dlog } from "@/lib/debug";
import { audio } from "@/audio/AudioEngine";
import "@/styles/main.css";

// AGENT: Frontend — entry point. MSW + WS-fake boot before render in mock mode.

/** Kill any stale PWA service worker + caches in dev. A SW registered by a
 *  prior `npm run preview`/build silently serves the OLD bundle on
 *  localhost:5173 with NO console error — exactly the "nada cambió" trap. */
async function killStaleServiceWorker() {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  if (regs.length) {
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window)
      await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    dlog("boot", `unregistered ${regs.length} stale SW + cleared caches`);
  }
}

async function bootstrap() {
  dbanner({ url: location.href });
  await killStaleServiceWorker();

  if (import.meta.env.VITE_USE_MOCKS === "true") {
    dlog("boot", "starting mocks (MSW + wsFake)");
    const { startMocks } = await import("@/mocks/browser");
    await startMocks();
    dlog("boot", "mocks ready");
  } else {
    dlog("boot", "connecting real socket transport");
    const { socketTransport } = await import("@/services/websocket");
    socketTransport.connect();
  }

  audio.start();

  dlog("boot", "React render");
  // NO StrictMode: su doble-montaje en dev crea dos Phaser.Game (destroy() es
  // asíncrono y no alcanza a destruir el primero antes del remonte), dejando una
  // escena zombi cuyos listeners del bus golpean `this.sys === null` y crashean
  // el render de mano/tablero. Phaser es incompatible con el doble-invoke de
  // StrictMode (su template oficial de React tampoco lo usa). AGENT: Frontend.
  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

void bootstrap();
