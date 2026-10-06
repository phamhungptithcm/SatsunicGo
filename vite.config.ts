import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  server: {
    watch: { ignored: ["**/output/**", "**/playwright-report/**"] },
  },
  build: {
    manifest: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "firebase",
              test: /node_modules\/(?:@firebase|firebase)\//,
              priority: 30,
            },
            {
              name: "react",
              test: /node_modules\/(?:react|react-dom|react-router|react-router-dom|scheduler)\//,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  test: { include: ["tests/unit/**/*.test.ts"] },
});
