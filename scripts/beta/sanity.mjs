import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const root = new URL("./site/", import.meta.url);
const paths = [];
function walk(dir, prefix = "") {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const path = prefix + name;
    const file = new URL(path, root);
    if (statSync(file).isDirectory()) walk(file, path + "/");
    else paths.push(path);
  }
}
walk(root);
const results = [];
for (const path of paths) {
  const response = await fetch("https://satsunicgo.web.app/" + path);
  const bytes = Buffer.from(await response.arrayBuffer());
  const hash = (b) => createHash("sha256").update(b).digest("hex");
  results.push({
    path,
    status: response.status,
    match: hash(bytes) === hash(readFileSync(new URL(path, root))),
    sha256: hash(bytes),
  });
}
const home = await fetch("https://satsunicgo.web.app/");
const evidence = {
  time: new Date().toISOString(),
  version: process.env.BETA_HOSTING_VERSION ?? "UNKNOWN",
  headers: Object.fromEntries(
    [
      "content-security-policy",
      "x-robots-tag",
      "x-frame-options",
      "x-content-type-options",
    ].map((k) => [k, home.headers.get(k)]),
  ),
  files: results,
};
writeFileSync(
  "docs/releases/BETA-003-HTTP.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
if (
  results.some((x) => x.status !== 200 || !x.match) ||
  !evidence.headers["content-security-policy"] ||
  evidence.headers["x-robots-tag"] !== "noindex, nofollow"
)
  process.exit(1);
console.log(
  "Production artifact matches: " +
    results.length +
    " files; security headers present.",
);
