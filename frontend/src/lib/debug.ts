// lib/debug.ts — namespaced console tracing for every FE phase/interaction.
// AGENT: Frontend. Catches "invisible" errors (stuck splash, stale build,
// wrong dir) by making each step observable. On in DEV, or set
// localStorage.d9debug="1" in prod.

/** Bump on every meaningful FE change so the console banner proves which
 *  build is actually loaded (the stale-build / wrong-dir smoke test). */
export const BUILD_TAG = "fe/work · post-Bloque-C · splash+chroma fix";

const ON =
  import.meta.env.DEV ||
  (typeof localStorage !== "undefined" &&
    localStorage.getItem("d9debug") === "1");

const t0 = performance.now();
const stamp = () => `+${(performance.now() - t0).toFixed(0)}ms`;

const COLORS: Record<string, string> = {
  boot: "#D4AF37",
  route: "#12A356",
  splash: "#F2D27A",
  nav: "#3498DB",
  dispatch: "#E91E63",
  ws: "#9B59B6",
  chroma: "#1ABC9C",
  phaser: "#E67E22",
  ui: "#F39C12",
};

export function dlog(scope: string, msg: string, data?: unknown) {
  if (!ON) return;
  const c = COLORS[scope] ?? "#888";
  if (data !== undefined)
    console.log(
      `%c[d9:${scope}]%c ${msg} %c${stamp()}`,
      `color:${c};font-weight:700`,
      "color:inherit",
      "color:#888",
      data,
    );
  else
    console.log(
      `%c[d9:${scope}]%c ${msg} %c${stamp()}`,
      `color:${c};font-weight:700`,
      "color:inherit",
      "color:#888",
    );
}

export function dbanner(extra: Record<string, unknown>) {
  if (!ON) return;
  console.log(
    `%c Doble 9's FE %c ${BUILD_TAG} `,
    "background:#0D0D0D;color:#D4AF37;font-weight:900;padding:3px 6px;border-radius:3px 0 0 3px",
    "background:#D4AF37;color:#0D0D0D;font-weight:700;padding:3px 6px;border-radius:0 3px 3px 0",
  );
  console.log("%c[d9:boot] env", "color:#D4AF37;font-weight:700", {
    mode: import.meta.env.MODE,
    mocks: import.meta.env.VITE_USE_MOCKS,
    ...extra,
  });
}
