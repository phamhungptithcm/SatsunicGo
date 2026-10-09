import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { open, mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import process from "node:process";
import console from "node:console";
import { Buffer } from "node:buffer";
import { URL } from "node:url";
/* global fetch, AbortSignal */
// One fixed public-product probe. No private chat, app users or Firestore I/O.
if (process.argv[2] !== "--approved-gemini-50000" || process.argv.length !== 3)
  throw Error("Explicit approved test budget required");
const directory = new URL("../output/ask-research-live/", import.meta.url);
await mkdir(directory, { recursive: true });
const lock = await open(new URL("budget.lock", directory), "wx");
try {
  execFileSync(
    process.execPath,
    [
      "node_modules/typescript/bin/tsc",
      "-p",
      "functions/tsconfig.json",
      "--outDir",
      "output/ask-research-compiled",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  await writeFile(
    new URL("../output/ask-research-compiled/package.json", import.meta.url),
    '{"type":"commonjs"}\n',
  );
  const require = createRequire(import.meta.url);
  const {
    geminiResearch,
    researchReservation,
    researchGeminiLimits,
  } = require("../output/ask-research-compiled/functions/src/ai/research-gemini.js");
  const {
    writeResearchBudget,
  } = require("../output/ask-research-compiled/functions/src/ai/research-budget.js");
  const ledgerFile = new URL("budget.json", directory);
  let ledger = { maxBudgetVnd: 50000, reservedVnd: 0, attempts: [] };
  try {
    ledger = JSON.parse(await readFile(ledgerFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw Error("Invalid research budget ledger");
  }
  if (
    ledger.maxBudgetVnd !== 50000 ||
    !Array.isArray(ledger.attempts) ||
    ledger.attempts.length > 2 ||
    ledger.attempts.some(
      (row) =>
        ![20000, 25000].includes(row.reserveVnd) ||
        typeof row.id !== "string" ||
        !["reserved", "response_validated"].includes(row.state),
    ) ||
    ledger.reservedVnd !==
      ledger.attempts.reduce((sum, row) => sum + row.reserveVnd, 0) ||
    new Set(ledger.attempts.map((row) => row.id)).size !==
      ledger.attempts.length
  )
    throw Error("Invalid research budget ledger");
  // Upgrade the earlier standard-rate ceiling before any further dispatch.
  for (const row of ledger.attempts)
    if (row.reserveVnd === 20000) {
      row.originalReserveVnd = 20000;
      row.reserveVnd = 25000;
    }
  ledger.reservedVnd = ledger.attempts.reduce(
    (sum, row) => sum + row.reserveVnd,
    0,
  );
  // Admission before credential acquisition. This does not reserve or refund.
  researchReservation(ledger.reservedVnd);
  const attempt = randomUUID();
  const reserve = async () => {
    ledger.reservedVnd = researchReservation(ledger.reservedVnd);
    ledger.attempts.push({
      id: attempt,
      reserveVnd: researchGeminiLimits.reserveVnd,
      state: "reserved",
      createdAt: Date.now(),
    });
    await writeResearchBudget(ledgerFile, ledger);
  };
  // Ordinary authenticated CLI flow; credential stays in memory and is never logged.
  let token;
  try {
    token = execFileSync("gcloud", ["auth", "print-access-token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    throw Error("AUTHENTICATION_UNAVAILABLE");
  }
  const observations = [];
  const send = async (url, body, signal) => {
    const result = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!result.ok) throw Error(`PROVIDER_HTTP_${result.status}`);
    if (Number(result.headers.get("content-length") ?? 0) > 150000)
      throw Error("PROVIDER_RESPONSE_TOO_LARGE");
    const text = await result.text();
    if (Buffer.byteLength(text) > 150000)
      throw Error("PROVIDER_RESPONSE_TOO_LARGE");
    const data = JSON.parse(text);
    observations.push({
      phase: url.endsWith(":countTokens") ? "count" : "generate",
      totalTokens: data.totalTokens,
      usage: data.usageMetadata,
      finishReasons: data.candidates?.map((row) => row.finishReason),
      grounding: data.candidates?.map((row) => ({
        keys: Object.keys(row.groundingMetadata ?? {}),
        chunkCount: row.groundingMetadata?.groundingChunks?.length,
        hosts: row.groundingMetadata?.groundingChunks?.map((chunk) => {
          try {
            return new URL(chunk.web?.uri).hostname;
          } catch {
            return "invalid";
          }
        }),
      })),
    });
    return data;
  };
  const policy = {
    version: 1,
    enabled: true,
    expiresAt: researchGeminiLimits.pricingExpiresAt,
    merchants: [
      {
        host: "www.bhphotovideo.com",
        market: "US",
        kind: "retailer",
        sellerIds: ["first-party"],
      },
      {
        host: "electronics.sony.com",
        market: "US",
        kind: "retailer",
        sellerIds: ["first-party"],
      },
    ],
  };
  let evidence;
  try {
    const result = await geminiResearch(
      { query: "Sony WH-1000XM6 headphones", market: "US" },
      policy,
      reserve,
      send,
      AbortSignal.timeout(45000),
      async (uri, signal) => {
        const result = await fetch(uri, {
          method: "GET",
          redirect: "manual",
          signal,
          headers: { Range: "bytes=0-0" },
        });
        await result.body?.cancel();
        return [301, 302, 303, 307, 308].includes(result.status)
          ? result.headers.get("location")
          : null;
      },
    );
    evidence = {
      status: "PROVIDER_RESPONSE_VALIDATED",
      tier: "LIVE_PROVIDER_ONLY_NOT_APP_ACCEPTANCE",
      observedAt: Date.now(),
      attempt,
      ...result,
    };
    ledger.attempts.find((row) => row.id === attempt).state =
      "response_validated";
  } catch (error) {
    evidence = {
      status: "BLOCKED",
      tier: "LIVE_PROVIDER_ONLY_NOT_APP_ACCEPTANCE",
      observedAt: Date.now(),
      attempt,
      reason: /^PROVIDER_HTTP_\d+$/.test(error.message)
        ? error.message
        : "PROVIDER_OR_RESPONSE_NOT_VERIFIED",
      schemaIssues: Array.isArray(error.issues)
        ? error.issues.map((issue) => ({ code: issue.code, path: issue.path }))
        : undefined,
    };
  }
  evidence.observations = observations;
  await writeResearchBudget(ledgerFile, ledger);
  await writeFile(
    new URL(`${attempt}.json`, directory),
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      status: evidence.status,
      reason: evidence.reason,
      candidates: evidence.candidates?.length,
      inputTokens: evidence.inputTokens,
      reservedVnd: ledger.reservedVnd,
      evidenceFile: `output/ask-research-live/${attempt}.json`,
    }),
  );
  if (evidence.status !== "PROVIDER_RESPONSE_VALIDATED") process.exitCode = 1;
} finally {
  await lock.close();
  const { unlink } = await import("node:fs/promises");
  await unlink(new URL("budget.lock", directory));
}
