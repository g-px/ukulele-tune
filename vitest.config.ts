import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/core/**/*.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { lines: 95, functions: 95, statements: 95, branches: 90 },
    },
  },
});
