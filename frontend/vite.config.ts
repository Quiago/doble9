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
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Doble 9's — Dominó Cubano Online",
        short_name: "Doble 9's",
        description: "Dominó cubano doble-9 multijugador en tiempo real.",
        theme_color: "#0D0D0D",
        background_color: "#0D0D0D",
        display: "standalone",
        orientation: "landscape",
        start_url: "/",
        lang: "es",
        categories: ["games"],
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell + fonts precached; offline SPA fallback.
        globPatterns: ["**/*.{js,css,html,svg,woff2,ttf}"],
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // Heavy art (wood/Manolito ~6MB): cache on first use, never
            // precache (would bloat the SW install).
            urlPattern: /\/assets\/.*\.(?:png|jpe?g|webp|svg)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "d9-assets",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
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
