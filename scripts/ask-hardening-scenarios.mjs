/** Explicit, serial local acceptance. Does not start/reset servers or call cloud. */
import { spawn, execFileSync } from "node:child_process";
import process from "node:process";
import console from "node:console";
import { createHash } from "node:crypto";
import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2];
if (
  !["--unit", "--demo", "--browser", "--all-local"].includes(mode) ||
  process.argv.length !== 3
) {
  throw Error(
    "Use --unit, --demo, --browser or --all-local; provider/production are excluded.",
  );
}
if (
  (mode === "--demo" || mode === "--all-local") &&
  (process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    process.env.FUNCTIONS_EMULATOR !== "true" ||
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207")
)
  throw Error(
    "Set demo-satsunicgo, FUNCTIONS_EMULATOR=true, FIRESTORE_EMULATOR_HOST=127.0.0.1:18207. Never run against production.",
  );
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const output = path.join(root, "output", "ask-hardening", runId);
await mkdir(output, { recursive: true });
const phases = [];
if (mode === "--unit" || mode === "--all-local")
  phases.push({
    name: "unit",
    evidence: "SOURCE_LOCAL",
    command: [
      "node_modules/vitest/vitest.mjs",
      "run",
      "--pool=threads",
      "--maxWorkers=1",
      "--reporter=default",
      "--reporter=json",
      `--outputFile=${output}/unit.json`,
    ],
    env: { VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: "" },
  });
if (mode === "--demo" || mode === "--all-local")
  phases.push({
    name: "demo",
    evidence: "ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH",
    command: [
      "node_modules/vitest/vitest.mjs",
      "run",
      "--config",
      "vitest.rules.config.ts",
      "tests/rules/ask-approved-knowledge.test.ts",
      "tests/rules/ask-platform.test.ts",
      "tests/rules/profile-recovery.test.ts",
      "tests/rules/ask-membership-workspace.test.ts",
      "tests/rules/ask-research-feedback.test.ts",
      "--reporter=default",
      "--reporter=json",
      `--outputFile=${output}/demo.json`,
    ],
  });
if (mode === "--browser" || mode === "--all-local")
  phases.push({
    name: "browser",
    evidence: "ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API",
    command: [
      "node_modules/@playwright/test/cli.js",
      "test",
      "--config",
      "tests/browser/ask-acceptance.config.ts",
      "--reporter=list,json",
    ],
    env: { PLAYWRIGHT_JSON_OUTPUT_FILE: `${output}/browser.json` },
  });
// Freeze executable source, tests and configuration; concurrent edits invalidate
// acceptance rather than promoting results against a moving candidate.
async function snapshot() {
  const files = {};
  async function walk(relative) {
    for (const entry of await readdir(path.join(root, relative), {
      withFileTypes: true,
    })) {
      const name = path.join(relative, entry.name);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile() && /\.(?:ts|tsx|css|mjs)$/.test(name))
        files[name] = createHash("sha256")
          .update(await readFile(path.join(root, name)))
          .digest("hex");
    }
  }
  for (const folder of ["src", "packages/domain", "functions/src", "tests"])
    await walk(folder);
  for (const name of [
    "scripts/ask-hardening-scenarios.mjs",
    "scripts/ask-research-live.mjs",
    "package.json",
    "functions/package.json",
    "tsconfig.json",
    "functions/tsconfig.json",
    "vite.config.ts",
    "eslint.config.js",
    "vitest.rules.config.ts",
    "firestore.rules",
  ])
    files[name] = createHash("sha256")
      .update(await readFile(path.join(root, name)))
      .digest("hex");
  const ordered = Object.fromEntries(
    Object.entries(files).sort(([a], [b]) => a.localeCompare(b)),
  );
  return {
    head: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    files: ordered,
  };
}
const frozen = await snapshot();
await writeFile(
  path.join(output, "source.json"),
  JSON.stringify(frozen, null, 2) + "\n",
);
const results = phases.map((phase) => ({
  phase: phase.name,
  evidence: phase.evidence,
  status: "NOT_RUN",
}));
let sourceStable = true;
async function saveSummary() {
  await writeFile(
    path.join(output, "summary.json"),
    JSON.stringify(
      {
        runId,
        results,
        sourceStable,
        provider: "NOT_RUN",
        production: "NOT_RUN",
      },
      null,
      2,
    ) + "\n",
  );
}
await saveSummary();
for (let index = 0; index < phases.length; index++) {
  const phase = phases[index],
    started = Date.now();
  let code = 1;
  try {
    if (phase.name === "browser") {
      const response = await globalThis.fetch("http://127.0.0.1:5207", {
        signal: globalThis.AbortSignal.timeout(5000),
      });
      if (!response.ok) throw Error("Shared frontend unavailable");
    }
    console.log(`Running ${phase.name}: ${phase.evidence}`);
    code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, phase.command, {
        cwd: root,
        env: { ...process.env, ...phase.env },
        stdio: "inherit",
      });
      child.once("error", reject);
      child.once("close", (code) => resolve(code ?? 1));
    });
  } catch {
    console.error(
      `Cannot execute ${phase.name}; no server restart or cloud fallback attempted.`,
    );
  }
  try {
    sourceStable = JSON.stringify(await snapshot()) === JSON.stringify(frozen);
  } catch {
    sourceStable = false;
    console.error(
      "Source snapshot could not be verified; acceptance is incomplete.",
    );
  }
  results[index] = {
    phase: phase.name,
    evidence: phase.evidence,
    status: !sourceStable ? "STALE" : code === 0 ? "PASSED" : "FAILED",
    code,
    durationMs: Date.now() - started,
  };
  await saveSummary();
  if (code !== 0 || !sourceStable) {
    process.exitCode = 1;
    break;
  }
}
console.log(`Evidence: ${output}`);
