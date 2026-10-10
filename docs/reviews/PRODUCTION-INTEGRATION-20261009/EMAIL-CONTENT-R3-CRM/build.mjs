/** QA-only generation. No real SDK, service, account, runtime or server mutation. */
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
const root = process.cwd();
const out = path.join(root, "docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-R3-CRM");
const service = path.join(out, "fixture-service.ts");
const digest = async name => crypto.createHash("sha256").update(await fs.readFile(name)).digest("hex");
const imported = new Map();
const plugin = {
  name: "crm-recipient-qa-adapter", enforce: "pre",
  resolveId(id) {
    if (/shared\/firebase(?:\.ts)?$/.test(id)) return service;
    if (id.startsWith("firebase") || id.startsWith("@firebase")) throw Error("FORBIDDEN_REAL_SDK_IMPORT");
  },
  async transform(_code, id) {
    const file = id.split("?")[0];
    if (file.startsWith(root + path.sep) && !file.includes("/node_modules/") && /\.(tsx?|css)$/.test(file))
      if (!imported.has(file)) imported.set(file, await digest(file));
  },
  generateBundle() {
    for (const id of this.getModuleIds()) if (/node_modules\/(?:@firebase|firebase)\//.test(id)) throw Error("REAL_SDK_IN_BUNDLE");
  },
};
const result = await build({ configFile: false, root, logLevel: "warn", plugins: [plugin, react(), tailwindcss()],
  define: { "process.env.NODE_ENV": '"production"' },
  build: { write: false, minify: true, lib: { entry: path.join(out, "entry.tsx"), formats: ["es"], fileName: () => "components.js" }, cssCodeSplit: false, rollupOptions: { output: { codeSplitting: false } } },
});
const generated = [];
for (const item of (Array.isArray(result) ? result[0] : result).output) {
  const name = item.type === "chunk" ? "components.js" : item.fileName.endsWith(".css") ? "components.css" : null;
  if (!name) throw Error("UNEXPECTED_FIXTURE_ASSET");
  await fs.writeFile(path.join(out, name), item.type === "chunk" ? item.code : item.source); generated.push(name);
}
const head = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; connect-src \'self\' ws://127.0.0.1:5207; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; object-src \'none\'; base-uri \'none\'; form-action \'none\'">';
await fs.writeFile(path.join(out, "component.html"), `${head}<title>CRM recipient component proxy</title><link rel="stylesheet" href="./components.css"></head><body><div id="crmFixtureRoot"></div><script type="module" src="./components.js"></script></body></html>`);
await fs.writeFile(path.join(out, "preview.html"), `${head}<title>CRM component review widths</title></head><body><p>QA only: current OperationsDetails component; synthetic service and shell. Frame widths are not browser viewport/OS zoom/MFA proof.</p><p><a href="./component.html">Open desktop component</a></p><div style="display:flex;gap:20px;flex-wrap:wrap"><section><h2>320px iframe</h2><iframe title="CRM 320px proxy" src="./component.html" width="320" height="1100" style="border:1px solid #ddd"></iframe></section><section><h2>390px iframe</h2><iframe title="CRM 390px proxy" src="./component.html" width="390" height="1100" style="border:1px solid #ddd"></iframe></section></div></body></html>`);
generated.push("component.html", "preview.html");
const inputs = [...imported].map(([name, sha256]) => ({ path: path.relative(root, name), sha256, kind: name.startsWith(out) ? "qa_fixture" : "actual_imported_source" }));
for (const name of ["PLAN.md", "build.mjs"]) inputs.push({ path: path.relative(root, path.join(out, name)), sha256: await digest(path.join(out, name)), kind: "qa_generation_context" });
for (const name of ["src/features/operations/Workbench.tsx", "src/features/crm/Workspace.tsx", "package.json", "package-lock.json"])
  inputs.push({ path: name, sha256: await digest(path.join(root, name)), kind: "verified_context_not_rendered" });
const drift = [];
for (const input of inputs) if (await digest(path.join(root, input.path)) !== input.sha256) drift.push(input.path);
const outputs = await Promise.all(generated.map(async name => ({ path: path.relative(root, path.join(out, name)), sha256: await digest(path.join(out, name)) })));
const receipt = { at: new Date().toISOString(), status: drift.length ? "INVALID_SOURCE_DRIFT" : "READY_FOR_CUA_PROXY_ONLY", runtime: process.version,
  inputs, outputs, actualImportedCount: inputs.filter(x => x.kind === "actual_imported_source").length, sourceDrift: drift,
  repositoryIntelligence: "DEGRADED bounded root fallback; no index refresh", method: "Vite write:false; unchanged OperationsDetails and canonical CSS with strict synthetic single-service adapter",
  limitations: ["Synthetic in-memory records/service and faithful class wrapper; no real authentication/MFA/backend or whole shell", "320/390 are explicit iframe contexts, not outer browser or OS zoom", "PRE001 authenticated candidate rendering/spokenAT remains open", "No production/provider/performance acceptance", "Browser NOT_RUN at generation"],
  providerIO: false, runtimeWrites: false, appSourceWrites: false, browserStatus: "NOT_RUN", tokenUsage: "Unavailable", actualBilledCost: "Unavailable", memoryCandidates: "None" };
await fs.writeFile(path.join(out, "SOURCE-MANIFEST.json"), JSON.stringify(receipt, null, 2) + "\n");
if (drift.length) throw Error("SOURCE_DRIFT");
console.log(JSON.stringify({ status: receipt.status, actualImportedCount: receipt.actualImportedCount, outputs, sourceDrift: drift }));
