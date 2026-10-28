import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/** Emit the inlined page as dist/standalone.html next to the normal build. */
function renameToStandalone(): Plugin {
  return {
    name: "rename-to-standalone",
    enforce: "post",
    generateBundle(_options, bundle) {
      const page = bundle["index.html"];
      if (page) page.fileName = "standalone.html";
    },
  };
}

export default defineConfig({
  base: "./",
  define: { __PWA__: "false" },
  plugins: [viteSingleFile({ removeViteModuleLoader: true }), renameToStandalone()],
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: false,
  },
});
