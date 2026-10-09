import { afterEach, expect, test } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { writeResearchBudget } from "../../functions/src/ai/research-budget";
import {
  geminiResearch,
  researchGeminiLimits,
} from "../../functions/src/ai/research-gemini";
const folders: string[] = [];
afterEach(async () => {
  for (const folder of folders.splice(0))
    await rm(folder, { recursive: true, force: true });
});
test("budget ledger: atomic durable replacement preserves complete unknown-attempt reservations", async () => {
  const folder = await mkdtemp(join(tmpdir(), "ask-budget-"));
  folders.push(folder);
  const file = pathToFileURL(join(folder, "budget.json")),
    unknown = {
      maxBudgetVnd: 50000,
      reservedVnd: 25000,
      attempts: [{ id: "unknown", state: "reserved", reserveVnd: 25000 }],
    };
  await writeResearchBudget(file, unknown);
  const updated = {
    ...unknown,
    reservedVnd: 50000,
    attempts: [
      ...unknown.attempts,
      { id: "validated", state: "response_validated", reserveVnd: 25000 },
    ],
  };
  await writeResearchBudget(file, updated);
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(updated);
  expect(await readdir(folder)).toEqual(["budget.json"]);
  await expect(
    writeResearchBudget(file, { large: "x".repeat(8192) }),
  ).rejects.toThrow("RESEARCH_LEDGER_TOO_LARGE");
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(updated);
});
test("budget ledger: persistence failure prevents both count and paid generation", async () => {
  let dispatched = 0;
  const file = pathToFileURL(
      join(tmpdir(), `missing-parent-${randomUUID()}`, "budget.json"),
    ),
    policy = {
      enabled: true,
      version: 1,
      expiresAt: researchGeminiLimits.pricingExpiresAt,
      merchants: [
        {
          host: "store.example",
          kind: "retailer",
          market: "US",
          sellerIds: ["first-party"],
        },
      ],
    };
  await expect(
    geminiResearch(
      { query: "headphones", market: "US" },
      policy,
      () => writeResearchBudget(file, { reservedVnd: 25000 }),
      async () => {
        dispatched++;
        return {};
      },
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(dispatched).toBe(0);
});
