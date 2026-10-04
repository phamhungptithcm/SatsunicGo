import { spawnSync } from "node:child_process";
import { cpSync, rmSync, readFileSync, writeFileSync } from "node:fs";
const r = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: { ...process.env, VITE_BETA_RELEASE: "true" },
});
if (r.status !== 0) process.exit(r.status ?? 1);
const html = readFileSync("dist/index.html", "utf8");
writeFileSync(
  "dist/index.html",
  html.replace(
    "<head>",
    '<head><meta name="robots" content="noindex,nofollow"><meta name="satsunicgo-release" content="0.1.0-beta.1">',
  ),
);
writeFileSync("dist/robots.txt", "User-agent: *\nDisallow: /\n");
writeFileSync(
  "dist/beta-release.json",
  JSON.stringify({
    version: "0.1.0-beta.1",
    scope: "static-ui",
    firebaseClientEnabled: false,
    transactionsEnabled: false,
  }) + "\n",
);
console.log(
  "Beta static artifact built; Firebase clients and transactions disabled.",
);

rmSync(new URL("./site/", import.meta.url), { recursive: true, force: true });
cpSync("dist", new URL("./site/", import.meta.url), { recursive: true });
