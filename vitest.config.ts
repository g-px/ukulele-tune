import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { __PWA__: "false" },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/core/**/*.ts", "src/state/**/*.ts", "src/audio/mic-errors.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { lines: 95, functions: 95, statements: 95, branches: 90 },
    },
  },
});
