import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import "@/styles/main.css";

// AGENT: Frontend — entry point. MSW + WS-fake boot before render in mock mode.
async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    const { startMocks } = await import("@/mocks/browser");
    await startMocks();
  } else {
    const { socketTransport } = await import("@/services/websocket");
    socketTransport.connect();
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();
