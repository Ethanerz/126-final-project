import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./legacy/vite/src/test/setup.js"],
    include: ["src/**/*.test.{ts,tsx}", "legacy/vite/src/**/*.test.{js,jsx}"],
  },
});
