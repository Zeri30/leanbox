import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    // `e2e/` holds Playwright specs (also *.spec.ts) — keep Vitest out of them.
    exclude: ["node_modules", ".next", "e2e/**"],
  },
});
