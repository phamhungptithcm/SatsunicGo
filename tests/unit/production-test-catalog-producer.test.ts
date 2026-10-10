import type { CallableRequest } from "firebase-functions/v2/https";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  writes: [] as string[],
  reads: [] as string[],
  sequence: 0,
}));
type Ref = {
  path: string;
  collection: (name: string) => { doc: (id?: string) => Ref };
};
function ref(path: string): Ref {
  return { path, collection: (name) => collection(`${path}/${name}`) };
}
function collection(path: string) {
  return { doc: (id?: string) => ref(`${path}/${id ?? `owned-${++h.sequence}`}`) };
}
const db = {
  projectId: "satsunicgo",
  doc: ref,
  collection,
  async runTransaction<T>(work: (tx: unknown) => Promise<T>) {
    const rows = new Map(h.rows);
    const writes: string[] = [];
    const result = await work({
      get: async (item: Ref) => {
        if (writes.length) throw Error("READ_AFTER_WRITE");
        h.reads.push(item.path);
        return { exists: rows.has(item.path), data: () => rows.get(item.path) };
      },
      create: (item: Ref, data: Record<string, unknown>) => {
        if (rows.has(item.path)) throw Error("ALREADY_EXISTS");
        rows.set(item.path, structuredClone(data));
        writes.push(item.path);
      },
    });
    h.rows = rows;
    h.writes.push(...writes);
    return result;
  },
};
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => db }));
const { catalogCheckout } = await import("../../functions/src/catalog-checkout");
const now = Date.UTC(2026, 9, 10);
const uid = "owned-catalog-tester";
const operationId = "9e079a85-e9a4-4b27-a1fd-a71dde615b46";
const selection = {
  operationId,
  productId: "owned-product",
  productVersion: 3,
  quantity: 2,
  variant: "Blue",
};
const policy = () => ({
  enabled: true,
  approved: true,
  version: 7,
  effectiveFrom: now - 1,
  expiresAt: now + 600_000,
  origin: "https://satsunicgo.web.app",
  provider: "sepay_sandbox",
  testerUids: [uid],
});
const request = (data: unknown = selection) =>
  ({
    data,
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
  }) as CallableRequest;
const run = (data: unknown = selection) => catalogCheckout.run(request(data));
const expected = {
  executionMode: "production_test",
  executionPolicyVersion: 7,
  testRunId: operationId,
  testMode: true,
};
async function rejectsWithoutWrites(
  action: () => Promise<unknown>,
  error: Record<string, unknown>,
) {
  const before = structuredClone(h.rows);
  await expect(action()).rejects.toMatchObject(error);
  expect(h.writes).toEqual([]);
  expect(h.rows).toEqual(before);
}
beforeEach(() => {
  h.rows = new Map();
  h.writes = [];
  h.reads = [];
  h.sequence = 0;
  db.projectId = "satsunicgo";
  vi.spyOn(Date, "now").mockReturnValue(now);
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", '{"projectId":"satsunicgo"}');
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
    "STORAGE_EMULATOR_HOST",
    "PUBSUB_EMULATOR_HOST",
    "FIREBASE_EMULATOR_HUB",
    "EVENTARC_EMULATOR",
  ])
    vi.stubEnv(key, undefined);
  h.rows.set("settings/productionTest", policy());
  h.rows.set("products/owned-product", {
    title: "Owned test product",
    slug: "owned-test-product",
    status: "published",
    market: "US",
    version: 3,
    orderable: true,
    listedPrice: 100_000,
    termsVersion: "owned-v1",
    catalogOptions: ["Blue"],
    stock: 10,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("actual legacy catalog callable in the production-test artifact", () => {
  it("pins every order derivative and response, without stock or live money writes", async () => {
    const product = structuredClone(h.rows.get("products/owned-product"));
    const result = await run();
    expect(result).toMatchObject({ ...expected, version: 1, total: 200_000 });
    expect(h.reads).toContain("settings/productionTest");
    const created = h.writes.filter((path) => !path.startsWith("users/"));
    expect(created).toHaveLength(6);
    for (const path of created) expect(h.rows.get(path)).toMatchObject(expected);
    const orderPath = created.find((path) => /^orders\/[^/]+$/.test(path))!;
    expect(h.rows.get(orderPath)).toMatchObject({
      ownerId: uid,
      stage: "QUOTE_ACCEPTED",
      collected: 0,
      refunded: 0,
      finalTotal: 200_000,
    });
    expect(h.rows.get(`idempotencyKeys/${uid}-${operationId}`)?.result).toEqual(
      result,
    );
    expect(h.rows.get("products/owned-product")).toEqual(product);
    expect(
      h.writes.some((path) =>
        /^(financialEntries|purchaseTestFinancialEntries|bankTransactions|purchaseRecords|receivingRecords|packageAllocations|packages|stock|inventory)\//.test(
          path,
        ),
      ),
    ).toBe(false);
  });

  it.each([
    undefined,
    { ...policy(), enabled: false },
    { ...policy(), approved: false },
    { ...policy(), version: 0 },
    { ...policy(), expiresAt: now },
    { ...policy(), effectiveFrom: now + 1 },
    { ...policy(), testerUids: ["other-tester"] },
    { ...policy(), testerUids: [uid, uid] },
    { ...policy(), origin: "https://untrusted.invalid" },
    { ...policy(), provider: "demo" },
    { ...policy(), unexpectedField: true },
  ])("denies missing or invalid admission with zero writes: %j", async (value) => {
    if (value) h.rows.set("settings/productionTest", value);
    else h.rows.delete("settings/productionTest");
    await rejectsWithoutWrites(() => run(), {
      code: "failed-precondition",
      details: { reason: "PRODUCTION_TEST_NOT_ADMITTED" },
    });
  });

  it.each([
    ["GCLOUD_PROJECT", "wrong-project"],
    ["GOOGLE_CLOUD_PROJECT", "wrong-project"],
    ["FIREBASE_CONFIG", '{"projectId":"wrong-project"}'],
    ["FIREBASE_CONFIG", "not-json"],
    ["FUNCTIONS_EMULATOR", "false"],
    ["FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207"],
  ])("a malformed v1 runtime cannot create a live order: %s", async (key, value) => {
    vi.stubEnv(key, value);
    await rejectsWithoutWrites(() => run(), {
      code: "failed-precondition",
      details: { reason: "PRODUCTION_TEST_NOT_ADMITTED" },
    });
  });

  it("requires the actual database project to match", async () => {
    db.projectId = "demo-satsunicgo";
    await rejectsWithoutWrites(() => run(), {
      code: "failed-precondition",
      details: { reason: "PRODUCTION_TEST_NOT_ADMITTED" },
    });
  });

  it.each([
    { ...selection, executionMode: "production_test" },
    { ...selection, executionPolicyVersion: 999 },
    { ...selection, testRunId: operationId },
    { ...selection, testMode: true },
    { ...selection, amount: 1 },
  ])("rejects forged provenance or price instead of trusting client data: %j", async (data) => {
    await rejectsWithoutWrites(() => run(data), { code: "invalid-argument" });
  });

  it("replays the exact original result after policy-off without reading admission or writing", async () => {
    const original = await run();
    h.rows.set("settings/productionTest", { ...policy(), enabled: false });
    h.writes = [];
    h.reads = [];
    expect(await run()).toEqual(original);
    expect(h.writes).toEqual([]);
    expect(h.reads).not.toContain("settings/productionTest");
  });

  it("cannot reuse the same operation for a different selection even after policy-off", async () => {
    await run();
    h.rows.delete("settings/productionTest");
    h.writes = [];
    await rejectsWithoutWrites(() => run({ ...selection, quantity: 1 }), {
      code: "already-exists",
    });
  });

  it.each([`users/${uid}`, `staffAccess/${uid}`])(
    "a locked actor cannot create or replay: %s",
    async (path) => {
      await run();
      h.rows.set(path, { ...h.rows.get(path), locked: true });
      h.writes = [];
      await rejectsWithoutWrites(() => run(), { code: "permission-denied" });
    },
  );

  it("requires authenticated verified Google identity", async () => {
    await rejectsWithoutWrites(
      () => catalogCheckout.run({ data: selection } as CallableRequest),
      { code: "unauthenticated" },
    );
  });

  it("stale authoritative product version rejects before all writes", async () => {
    await rejectsWithoutWrites(() => run({ ...selection, productVersion: 2 }), {
      code: "aborted",
    });
  });

  it("legacy artifact behavior stays unmarked without requiring test policy", async () => {
    vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", undefined);
    h.rows.delete("settings/productionTest");
    const result = await run();
    expect(result).toMatchObject({ version: 1, total: 200_000 });
    expect(result).not.toHaveProperty("executionMode");
    expect(h.reads).not.toContain("settings/productionTest");
    for (const path of h.writes)
      expect(h.rows.get(path)).not.toHaveProperty("executionMode");
  });
});
