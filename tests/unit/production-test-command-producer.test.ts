import { readFileSync } from "node:fs";
import * as crypto from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import { z } from "zod";
import * as https from "firebase-functions/v2/https";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as guards from "../../functions/src/auth/guards";
import * as domain from "../../packages/domain";
import * as crm from "../../packages/domain/crm";
import * as events from "../../functions/src/customer-notification-events";
import * as boundary from "../../functions/src/purchase-test-boundary";
import * as commands from "../../functions/src/production-test-commands";
import * as policy from "../../functions/src/production-test-policy";

const rows = new Map<string, Record<string, unknown>>();
const writes: string[] = [];
let sequence = 0;
const ref = (path: string) => ({ path, collection: (name: string) => collection(`${path}/${name}`) });
const collection = (path: string) => ({ doc: (id?: string) => ref(`${path}/${id ?? `generated-${++sequence}`}`) });
const db = {
  projectId: "satsunicgo", doc: ref, collection,
  async runTransaction(run: (tx: unknown) => Promise<unknown>) {
    const next = new Map(rows), staged: string[] = [];
    const result = await run({
      get: async (item: ReturnType<typeof ref>) => {
        if (staged.length) throw Error("READ_AFTER_WRITE");
        return { exists: next.has(item.path), data: () => next.get(item.path) };
      },
      create: (item: ReturnType<typeof ref>, value: Record<string, unknown>) => {
        if (next.has(item.path)) throw Error("ALREADY_EXISTS");
        next.set(item.path, structuredClone(value)); staged.push(item.path);
      },
      set: (item: ReturnType<typeof ref>, value: Record<string, unknown>) => {
        next.set(item.path, structuredClone(value)); staged.push(item.path);
      },
    });
    rows.clear(); for (const [key, value] of next) rows.set(key, value);
    writes.push(...staged); return result;
  },
};
// Execute the actual index.ts command declaration; exclude unrelated export modules.
// Firebase callable .run and transaction storage are the unit boundary, not live HTTP/MFA proof.
const source = readFileSync(new URL("../../functions/src/index.ts", import.meta.url), "utf8");
const end = source.indexOf('export { ask } from "./ai/ask";');
if (end < 0) throw Error("COMMAND_SOURCE_BOUNDARY_CHANGED");
const compiled = ts.transpileModule(source.slice(0, end), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const modules: Record<string, unknown> = {
  "./purchase-test-boundary": boundary, "./production-test-commands": commands,
  "./production-test-policy": policy, "./customer-notification-events": events,
  "./auth/guards": guards, "firebase-admin/app": { initializeApp: () => ({}) },
  "firebase-admin/firestore": { getFirestore: () => db }, "firebase-functions/v2/https": https,
  "../../packages/domain/crm": crm, "node:crypto": crypto, zod: { z }, "../../packages/domain": domain,
};
const exports: { command?: { run: (request: unknown) => Promise<unknown> } } = {};
vm.runInNewContext(compiled, { exports, process, Date, require: (name: string) => {
  if (!(name in modules)) throw Error("UNEXPECTED_COMMAND_IMPORT"); return modules[name];
} });
const now = 1791590400000;
const operationId = "8d4bd111-a42d-402c-ac3e-f2b323111111";
const data = { action: "submitRequest", operationId, orderId: "owned-test-request", payload: { market: "US", items: [{ name: "Test item", quantity: 1 }] } };
const request = () => ({ data, auth: { uid: "tester", token: { email_verified: true, firebase: { sign_in_provider: "google.com" } } } });
const valid = () => ({ enabled: true, approved: true, version: 3, effectiveFrom: now - 1, expiresAt: now + 100000, origin: policy.PRODUCTION_TEST_ORIGIN, provider: "sepay_sandbox", testerUids: ["tester"] });
beforeEach(() => {
  rows.clear(); writes.length = 0; sequence = 0;
  vi.spyOn(Date, "now").mockReturnValue(now);
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1"); vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", undefined); vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  for (const key of ["FUNCTIONS_EMULATOR", "FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST", "STORAGE_EMULATOR_HOST", "PUBSUB_EMULATOR_HOST", "FIREBASE_EMULATOR_HUB", "EVENTARC_EMULATOR"]) vi.stubEnv(key, undefined);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
it.each([undefined, { ...valid(), enabled: false }, { ...valid(), approved: false }, { ...valid(), expiresAt: now }, { ...valid(), effectiveFrom: now + 1 }, { ...valid(), testerUids: ["someone-else"] }])("artifact-v1 rejects new generic requests without test admission and writes nothing: %j", async value => {
  if (value) rows.set("settings/productionTest", value);
  await expect(exports.command!.run(request())).rejects.toMatchObject({ code: "failed-precondition", details: { reason: "PRODUCTION_TEST_NOT_ADMITTED" } });
  expect(writes).toEqual([]);
  expect([...rows.keys()].some(key => /^(orders|outboxJobs|idempotencyKeys|auditEvents|orderOperations)\//.test(key))).toBe(false);
});
it("valid admission pins mode/run/version on the order, result, timeline, outbox and audit", async () => {
  rows.set("settings/productionTest", valid());
  const result = await exports.command!.run(request());
  const expected = { executionMode: "production_test", executionPolicyVersion: 3, testRunId: operationId, testMode: true };
  expect(result).toMatchObject(expected);
  for (const path of writes.filter(key => !key.startsWith("users/"))) expect(rows.get(path)).toMatchObject(expected);
  expect(rows.get("orders/owned-test-request")?.stage).toBe("REQUESTED");
  expect(writes.some(path => path.startsWith("financialEntries/") || path.startsWith("purchaseRecords/"))).toBe(false);
});
it("existing operation replays original test result after policy is turned off without new writes", async () => {
  rows.set("settings/productionTest", valid());
  const first = await exports.command!.run(request());
  rows.set("settings/productionTest", { ...valid(), enabled: false }); writes.length = 0;
  expect(await exports.command!.run(request())).toEqual(first);
  expect(writes).toEqual([]);
});
it("legacy artifacts preserve established live request behavior outside production-test v1", async () => {
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", undefined);
  await exports.command!.run(request());
  expect(rows.get("orders/owned-test-request")?.executionMode).toBeUndefined();
  expect(rows.get("orders/owned-test-request")?.stage).toBe("REQUESTED");
});
it("a malformed v1 runtime cannot fall back to live creation", async () => {
  rows.set("settings/productionTest", valid());
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "wrong-project" }));
  await expect(exports.command!.run(request())).rejects.toMatchObject({ code: "failed-precondition", details: { reason: "PRODUCTION_TEST_NOT_ADMITTED" } });
  expect(writes).toEqual([]);
});
