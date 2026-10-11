import process from "node:process";
// Build only. Reuses the existing Vite5207 static server; never starts a server.
import { build } from "vite";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core", {
  paths: [
    process.env.SATSUNICGO_QA_TOOLS ||
      "/private/tmp/satsunicgo-guest-adverse-tools",
  ],
});
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
const mocks = {
  "../../shared/firebase": `export const db = null; export { auth, callService } from '/tests/component/guest-browser-state.ts';`,
  "firebase/auth": `export { onAuthStateChanged } from '/tests/component/guest-browser-state.ts';`,
  "../../shared/analytics": `import { trackAsk } from '/tests/component/guest-browser-state.ts'; export {trackAsk}; export const trackProduct=trackAsk;`,
  "./transport": `export { askService } from '/tests/component/guest-browser-state.ts'; export const askRateLimited=()=>false;`,
  "./Commerce": `export { useAskCommerce } from '/tests/component/guest-browser-state.ts'; export const CommercePanel=()=>null,askReadinessMessage=()=>'';`,
  "./useActionPreview": `export { useActionPreview } from '/tests/component/guest-browser-state.ts';`,
  "./ImageIntake": `export { useAskImages } from '/tests/component/guest-browser-state.ts';`,
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
          importer?.includes("/src/features/ask/") &&
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
  define: { "import.meta.env.DEV": "true" },
  build: {
    outDir: "test-results/guest-adverse",
    emptyOutDir: true,
    rolldownOptions: { input: "tests/component/guest-harness.html" },
  },
});
