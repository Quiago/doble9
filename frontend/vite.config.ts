import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// AGENT: Frontend — Vite + React 19 + PWA. Aliases: @ -> src, @shared -> cross-agent types.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/**/*", "fonts/**/*"],
      manifest: {
        name: "Doble 9's — Dominó Cubano Online",
        short_name: "Doble 9's",
        description: "Dominó cubano doble-9 multijugador en tiempo real.",
        theme_color: "#0D0D0D",
        background_color: "#0D0D0D",
        display: "standalone",
        orientation: "landscape",
        start_url: "/",
        icons: [
          { src: "/assets/logo-greenscreen.png", sizes: "512x512", type: "image/png" },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared/types", import.meta.url)),
    },
  },
  server: { port: 5173, strictPort: false },
});
