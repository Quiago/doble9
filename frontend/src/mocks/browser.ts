// mocks/browser.ts — dev bootstrap: MSW REST worker + fake WS transport.
// AGENT: Frontend. Only loaded when VITE_USE_MOCKS=true (see main.tsx).
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { wsFake } from "./wsFake";

export const worker = setupWorker(...handlers);

export async function startMocks() {
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
  });
  wsFake.connect();
}
