import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
const root = resolve("docs/reviews/FINANCE-CONTENT-095/fixture");
await build({
  configFile: false,
  root,
  plugins: [
    {
      name: "synthetic095-transport",
      enforce: "pre",
      resolveId(id) {
        if (id.endsWith("/shared/firebase"))
          return resolve(root, "firebase.ts");
      },
    },
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: resolve(root, "main.tsx"),
      name: "Finance095Fixture",
      formats: ["iife"],
      fileName: () => "fixture.js",
      cssFileName: "fixture",
    },
  },
});
await writeFile(
  resolve(root, "dist/preview.html"),
  `<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UX095 · Kiểm thử giao diện</title><link rel="stylesheet" href="./fixture.css"></head><body><div id="root"></div><script src="./fixture.js"></script></body></html>`,
);
