import process from "node:process";
// Build only. Reuses the existing Vite5207 static server; never starts a server.
import { build } from "vite";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const fixture = JSON.parse(
  readFileSync("test-results/tracking-real/fixture.json", "utf8"),
);
if (
  !fixture.orderId?.startsWith("SG-QA-") ||
  !fixture.owner?.sub?.startsWith("tracking-qa-") ||
  !fixture.staff?.sub?.startsWith("tracking-qa-")
)
  throw Error("Owned fixture metadata required");
const axePath = require.resolve("axe-core", {
  paths: [
    process.env.SATSUNICGO_QA_TOOLS ||
      "/private/tmp/satsunicgo-guest-adverse-tools",
  ],
});
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
const mocks = {
  "../../shared/firebase": `export * from '/tests/component/tracking-real-sdk.ts';`,

  "../../shared/analytics": `import { trackAsk } from '/tests/component/tracking-real-sdk.ts'; export {trackAsk}; export const trackProduct=trackAsk;`,
  "./transport": `export { askService } from '/tests/component/tracking-real-sdk.ts'; export const askRateLimited=()=>false;`,
  "./Commerce": `export { useAskCommerce } from '/tests/component/tracking-real-sdk.ts'; export const CommercePanel=()=>null,askReadinessMessage=()=>'';`,
  "./useActionPreview": `export { useActionPreview } from '/tests/component/tracking-real-sdk.ts';`,
  "./ImageIntake": `export { useAskImages } from '/tests/component/tracking-real-sdk.ts';`,
  "./CustomerWorkspace": `export const CustomerWorkspace=()=>null;`,
  "./AnswerFeedback": `export const AnswerFeedback=()=>null;`,
  "./ActionWindow": `export const ActionWindow=()=>null,actionLabel=()=>'';`,
  "./CatalogChat": `export const CatalogChat=()=>null;`,
  "./WebDiscovery": `export const WebDiscovery=()=>null;`,
  "./CatalogSearch": `export const CatalogSearch=()=>null;`,
  "./catalog-search": `export const searchPublishedCatalog=()=>{throw Error('Unexpected catalog path')};`,
};
await build({
  configFile: false,
  base: "./",
  plugins: [
    {
      name: "guest-test-dependencies",
      enforce: "pre",
      resolveId(source, importer) {
        if (source === "guest-qa-axe") return axePath;
        if (
          (source === "../../shared/firebase" ||
            importer?.includes("/src/features/ask/")) &&
          Object.hasOwn(mocks, source)
        )
          return "\0guest-mock:" + source;
      },
      load(id) {
        if (id.startsWith("\0guest-mock:"))
          return mocks[id.slice("\0guest-mock:".length)];
      },
    },
    react(),
    tailwindcss(),
  ],
  define: {
    "import.meta.env.DEV": "true",
    __TRACKING_QA_FIXTURE__: JSON.stringify(fixture),
  },
  build: {
    outDir: "test-results/tracking-real-build",
    emptyOutDir: true,
    rolldownOptions: { input: "tests/component/tracking-real.html" },
  },
});
