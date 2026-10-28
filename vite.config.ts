import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  define: { __PWA__: "true" },
  build: { target: "es2020" },
});
