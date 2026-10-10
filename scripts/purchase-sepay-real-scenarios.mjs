// Reuse approved synthetic regressions; isolate artifacts from historical runs.
import process from "node:process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");

const dir = "output/sepay-sandbox-20261009/real-v2";
mkdirSync(dir, { recursive: true });
const jobs = [
  {
    name: "gateway",
    source: "scripts/purchase-gateway-scenarios.mjs",
    transform: (source) =>
      source.replaceAll("docs/reviews/PAYMENT-UPFRONT-20261008", dir),
    args: [],
  },
  {
    name: "business",
    source: "scripts/purchase-gateway-business-e2e.mjs",
    transform: (source) =>
      source
        .replaceAll(
          "output/pdf/payment-gateway-business-20261008",
          `${dir}/pdf`,
        )
        .replaceAll(
          "docs/reviews/PAYMENT-UPFRONT-20261008/GATEWAY-BUSINESS-E2E.json",
          `${dir}/business-results.json`,
        ),
    args: [],
  },
  {
    name: "resources",
    source: "scripts/purchase-resource-probe.mjs",
    transform: (source) =>
      source
        .replaceAll("../functions/", "../../../functions/")
        .replaceAll(
          "docs/reviews/PAYMENT-UPFRONT-20261008/GATEWAY-RESOURCES.json",
          `${dir}/resources.json`,
        ),
    args: ["--expose-gc"],
  },
];
for (const job of jobs) {
  const path = `${dir}/run-${job.name}.mjs`;
  writeFileSync(path, job.transform(readFileSync(job.source, "utf8")));
  try {
    const result = await promisify(execFile)(
      process.execPath,
      [...job.args, path],
      {
        env: process.env,
        timeout: 240000,
        maxBuffer: 2000000,
      },
    );
    writeFileSync(`${dir}/${job.name}-stdout.log`, result.stdout);
    writeFileSync(`${dir}/${job.name}-stderr.log`, result.stderr);
    process.stdout.write(`${job.name}: PASSED\n`);
  } catch (error) {
    writeFileSync(
      `${dir}/${job.name}-stdout.log`,
      String(error.stdout ?? "").slice(0, 2000000),
    );
    writeFileSync(
      `${dir}/${job.name}-stderr.log`,
      String(error.stderr ?? "").slice(0, 2000000),
    );
    throw Error(
      `${job.name}: FAILED; inspect isolated synthetic regression artifacts`,
    );
  }
}
