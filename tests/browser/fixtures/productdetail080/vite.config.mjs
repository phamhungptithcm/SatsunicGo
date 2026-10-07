import { URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const mock = fileURLToPath(new URL("./mock.ts", import.meta.url));
export default defineConfig({
  plugins: [
    {
      name: "synthetic-product080",
      enforce: "pre",
      resolveId(id) {
        if (id === "firebase/auth" || id.endsWith("/shared/firebase"))
          return mock;
      },
    },
    react(),
  ],
  server: { host: "127.0.0.1", port: 5387, strictPort: true },
});
