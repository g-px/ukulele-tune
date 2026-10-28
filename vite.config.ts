import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  define: { __PWA__: "true" },
  build: { target: "es2020" },
  plugins: [
    VitePWA({
      // Registered by src/pwa.ts so it can be skipped on file:// and in standalone.html.
      injectRegister: false,
      registerType: "autoUpdate",
      filename: "sw.js",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Ukulele Tune",
        short_name: "UkeTune",
        description: "Tune your ukulele with your microphone. Runs on your device.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#141A24",
        theme_color: "#141A24",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
        globIgnores: ["standalone.html"],
        navigateFallback: "index.html",
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
