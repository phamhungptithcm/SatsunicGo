import { defineConfig } from "vite";
import { resolve } from "node:path";
const mock = resolve("tests/browser/fixtures/security076/mock.ts");
export default defineConfig({
  plugins: [
    {
      name: "synthetic-auth",
      enforce: "pre",
      resolveId(id, importer) {
        if (id === "qrcode" && importer?.endsWith("/Security.tsx"))
          return resolve("tests/browser/fixtures/security076/qr.ts");
        if (
          id === "firebase/auth" ||
          (importer?.endsWith("/Security.tsx") &&
            (id === "../../shared/firebase" || id === "./mfa"))
        )
          return mock;
      },
    },
  ],
  server: { host: "127.0.0.1", port: 5198, strictPort: true },
});
