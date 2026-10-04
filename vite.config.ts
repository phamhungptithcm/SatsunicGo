import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  build: { manifest: true },
  plugins: [react(), tailwindcss()],
  test: { include: ["tests/unit/**/*.test.ts"] },
});
