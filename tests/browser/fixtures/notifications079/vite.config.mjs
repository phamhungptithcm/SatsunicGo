import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  plugins: [
    {
      name: "synthetic-notifications",
      enforce: "pre",
      resolveId(id, importer) {
        if (
          importer?.endsWith("/Notifications.tsx") &&
          (id === "firebase/firestore" || id === "../../shared/firebase")
        )
          return resolve("tests/browser/fixtures/notifications079/mock.ts");
      },
    },
  ],
  server: { host: "127.0.0.1", port: 5198, strictPort: true },
});
