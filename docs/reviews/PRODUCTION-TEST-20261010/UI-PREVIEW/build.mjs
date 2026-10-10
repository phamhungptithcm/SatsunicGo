import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../../..");
const adapter = path.join(directory, "synthetic-adapter.ts");
const syntheticFirestore = path.join(directory, "synthetic-firestore.ts");
const inputs = new Set();
const result = await build({
  configFile: false,
  envDir: false,
  publicDir: false,
  root,
  logLevel: "warn",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [{
    name: "source-bound-read-only-preview",
    enforce: "pre",
    resolveId(source) {
      if (source.endsWith("/shared/firebase")) return adapter;
      if (source === "firebase/firestore") return syntheticFirestore;
      if (source.startsWith("firebase/") || source.startsWith("@firebase/")) throw Error(`Unexpected provider import: ${source}`);
    },
    load(id) {
      if (id.startsWith(root) && !id.includes("/node_modules/")) inputs.add(id.split("?")[0]);
    },
  }, react(), tailwindcss()],
  build: {
    write: false,
    target: "es2022",
    minify: true,
    cssCodeSplit: false,
    lib: { entry: path.join(directory, "entry.tsx"), name: "ReadOnlyProductionTestPreview", formats: ["iife"] },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
const script = outputs.filter((item) => item.type === "chunk").map((item) => item.code).join("\n");
const css = outputs.filter((item) => item.type === "asset" && item.fileName.endsWith(".css")).map((item) => item.source).join("\n");
if (!script || !css) throw Error("Missing bundled component/CSS output");
if (/\bprocess\.env\b/.test(script)) throw Error("Preview retained a Node environment reference");
const bundledModules = outputs.filter((item) => item.type === "chunk").flatMap((item) => Object.keys(item.modules));
if (bundledModules.some((id) => /\/node_modules\/(?:@firebase|firebase)\//.test(id) || /\/src\/shared\/firebase\.[jt]s$/.test(id))) throw Error("Preview unexpectedly bundled a real Firebase module");
const safety = `(()=>{const blocked=()=>{throw Error('Preview blocks network and persistence')};window.fetch=blocked;window.XMLHttpRequest=blocked;window.WebSocket=blocked;window.EventSource=blocked;navigator.sendBeacon=()=>false;const storage={getItem:()=>null,setItem:blocked,removeItem:()=>{},clear:blocked};for(const key of ['localStorage','sessionStorage']){try{Object.defineProperty(window,key,{value:storage})}catch{}}document.addEventListener('click',event=>{const a=event.target.closest?.('a');if(a&&/^(https?:|mailto:)/.test(a.getAttribute('href')||'')){event.preventDefault();event.stopPropagation()}},true);})();`;
const previewCss = `.previewControls{padding:12px 20px;background:#f6f8fc;border-bottom:1px solid #e2e6ef;display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:12px}.previewControls span{color:#647087}.previewControls label{display:flex;align-items:center;gap:6px;margin:0}.previewControls select,.previewControls button{font-size:12px;width:auto;min-height:34px;margin:0;padding:6px 10px}.previewShell{display:block!important;min-height:0!important;padding:20px}.previewShell .workspaceContent{margin:0!important;width:100%!important;max-width:1300px;margin-inline:auto!important}.previewContexts{padding:20px;max-width:1100px;margin:auto}.previewContexts h1{font-size:22px}.previewContexts .orderTools{margin:12px 0}@media(max-width:500px){.previewControls{padding:10px}.previewShell,.previewContexts{padding:12px}}`;
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><meta name="referrer" content="no-referrer"><title>Production Test · component preview</title><style>${css}\n${previewCss}</style></head><body><div id="root"></div><script>${safety}\n${script.replaceAll("</script", "<\\/script")}</script></body></html>`;
const destination = path.join(directory, "production-test-components.html");
await writeFile(destination, html);
const hashes = {};
for (const name of ["src/styles/form-labels.css", "package.json", "package-lock.json"]) inputs.add(path.join(root, name));
inputs.add(fileURLToPath(import.meta.url));
for (const name of [...inputs].sort()) {
  try { hashes[path.relative(root, name)] = createHash("sha256").update(await readFile(name)).digest("hex"); } catch { /* virtual IDs excluded */ }
}
await writeFile(path.join(directory, "MANIFEST.json"), JSON.stringify({ generatedAt: new Date().toISOString(), buildCycle: 3, sourceRoot: root, destination, bytes: Buffer.byteLength(html), sha256: createHash("sha256").update(html).digest("hex"), sourceHashes: hashes, actualComponents: ["Workbench", "TestOrderBadge", "ActionForm", "OrderTools", "Notifications"], syntheticOnly: true, network: "CSP connect-src none; fetch/XHR/WebSocket/EventSource blocked", providerImports: "blocked; bundled module inventory checked", notificationReadAdapter: "local exact notifications/preview-owner/createdAt-desc/limit30 read only; all other operations denied", unresolvedProcessEnvironmentReference: false, nodeEnvironment: "production", realFirebaseModules: 0, mutationAdapter: "denied", storage: "in-memory no-op/deny only", evidenceScope: "Component presentation only; no genuine MFA/backend/provider/account acceptance." }, null, 2) + "\n");
process.stdout.write(JSON.stringify({ destination, bytes: Buffer.byteLength(html), sourceInputs: Object.keys(hashes).length, sha256: createHash("sha256").update(html).digest("hex") }) + "\n");
