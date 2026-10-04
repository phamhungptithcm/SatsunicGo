import process from "node:process";
import console from "node:console";
import path from "node:path";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const mode = process.argv[2];
if (!["rules", "http", "restore"].includes(mode))
  throw Error("Choose rules, http or restore demo tests only");
const homes = [
  process.env.JAVA_HOME,
  "/opt/homebrew/opt/openjdk@24",
  "/opt/homebrew/opt/openjdk@21",
  "/usr/lib/jvm/java-21-openjdk-amd64",
].filter(Boolean);
let selected = null;
for (const home of homes) {
  const executable = path.join(
    home,
    "bin",
    process.platform === "win32" ? "java.exe" : "java",
  );
  if (!existsSync(executable)) continue;
  const result = spawnSync(executable, ["-version"], { encoding: "utf8" });
  const match = (result.stderr + result.stdout).match(/version\s+"(\d+)/);
  if (match && Number(match[1]) >= 21) {
    selected = home;
    break;
  }
}
if (!selected) {
  const result = spawnSync("java", ["-version"], { encoding: "utf8" });
  const match = (result.stderr + result.stdout).match(/version\s+"(\d+)/);
  if (!match || Number(match[1]) < 21) {
    console.error(
      "Firebase CLI 15 requires Java 21+. Set JAVA_HOME to an installed JDK; no global installation is performed.",
    );
    process.exit(1);
  }
}
const env = {
  ...process.env,
  ...(selected
    ? {
        JAVA_HOME: selected,
        PATH: `${path.join(selected, "bin")}${path.delimiter}${process.env.PATH}`,
      }
    : {}),
};
const binary = path.resolve("node_modules/firebase-tools/lib/bin/firebase.js");
if (mode === "restore") {
  const root = mkdtempSync(path.join(tmpdir(), "satsunicgo-demo-restore-"));
  const directory = path.join(root, "export");
  for (const phase of ["write", "verify"]) {
    const args = [
      binary,
      "emulators:exec",
      "--project",
      "demo-satsunicgo",
      "--only",
      "firestore,storage",
      ...(phase === "write"
        ? ["--export-on-exit", directory]
        : ["--import", directory]),
      `node tests/http/restore-fixture.mjs ${phase}`,
    ];
    const child = spawnSync(process.execPath, args, { env, stdio: "inherit" });
    if (child.status !== 0) process.exit(child.status ?? 1);
  }
  console.log(`Isolated backup retained at ${directory}`);
  process.exit(0);
}
const args = [
  binary,
  "emulators:exec",
  "--project",
  "demo-satsunicgo",
  "--only",
  mode === "http" ? "auth,firestore,functions" : "firestore",
  mode === "http"
    ? "node tests/http/callable.mjs"
    : "vitest run --config vitest.rules.config.ts",
];
const child = spawnSync(process.execPath, args, { env, stdio: "inherit" });
process.exit(child.status ?? 1);
