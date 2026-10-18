import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./legacy/vite/src/test/setup.js"],
    include: ["src/**/*.test.{ts,tsx}", "legacy/vite/src/**/*.test.{js,jsx}"],
  },
});
