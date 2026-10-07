import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  plugins: [
    {
      name: "synthetic-request",
      enforce: "pre",
      resolveId(id, importer) {
        if (
          importer?.endsWith("/RequestForm.tsx") &&
          (id === "firebase/firestore" || id === "../../shared/firebase")
        )
          return resolve("tests/browser/fixtures/request083/mock.ts");
      },
    },
  ],
  server: { host: "127.0.0.1", port: 5203, strictPort: true },
});
