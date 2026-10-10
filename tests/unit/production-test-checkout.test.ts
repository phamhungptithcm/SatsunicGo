import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";
import type { CheckoutSnapshot } from "../../packages/domain/purchase-checkout";

const h = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  writes: [] as string[],
  ready: true,
  form: vi.fn((value: unknown) => value),
}));
type Ref = { path: string; get: () => Promise<ReturnType<typeof snapshot>> };
function snapshot(ref: Ref, rows = h.rows) {
  return { ref, exists: rows.has(ref.path), data: () => rows.get(ref.path) };
}
const db = {
  projectId: "satsunicgo",
  doc(path: string): Ref {
    const ref = { path, get: async () => snapshot(ref) };
    return ref;
  },
  async runTransaction<T>(work: (tx: unknown) => Promise<T>) {
    const rows = new Map(h.rows);
    const writes: string[] = [];
    const read = async (ref: Ref) => {
      if (writes.length) throw Error("READ_AFTER_WRITE");
      return snapshot(ref, rows);
    };
    const result = await work({
      get: read,
      getAll: (...refs: Ref[]) => Promise.all(refs.map(read)),
      create: (ref: Ref, data: Record<string, unknown>) => {
        if (rows.has(ref.path)) throw Error("ALREADY_EXISTS");
        rows.set(ref.path, structuredClone(data));
        writes.push(ref.path);
      },
      update: (ref: Ref, data: Record<string, unknown>) => {
        if (!rows.has(ref.path)) throw Error("MISSING");
        rows.set(ref.path, { ...rows.get(ref.path), ...structuredClone(data) });
        writes.push(ref.path);
      },
      set: (ref: Ref, data: Record<string, unknown>) => {
        rows.set(ref.path, structuredClone(data));
        writes.push(ref.path);
      },
    });
    h.rows = rows;
    h.writes.push(...writes);
    return result;
  },
};
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => db }));
vi.mock("../../functions/src/purchase-settlement", () => ({
  applyDemoSettlement: vi.fn(),
  settleSePayEvidence: vi.fn(),
}));
vi.mock("../../functions/src/payments/sepay-sandbox", () => ({
  sandboxPaymentReady: () => h.ready,
  sepaySecrets: [],
  authenticSePayIpn: vi.fn(),
  sandboxAdapter: () => ({ form: h.form }),
  sepaySandboxIpnSecret: undefined,
}));
const api = await import("../../functions/src/purchase-checkout");
const sepay = await import("../../functions/src/purchase-sepay");
const now = Date.UTC(2026, 9, 10);
const uid = "owned-synthetic-test";
const recipient = {
  recipient: "Test recipient",
  phone: "0900000000",
  country: "VN",
  provinceCode: "01",
  communeCode: "00001",
  province: "Test province",
  commune: "Test commune",
  street: "10 Test street",
  note: "",
};
type Preview = CheckoutSnapshot & { previewHash: string };
const request = (data: unknown, owner = uid) =>
  ({
    data,
    auth: {
      uid: owner,
      token: {
        email_verified: true,
        email: "test@example.invalid",
        firebase: { sign_in_provider: "google.com" },
      },
    },
  }) as CallableRequest;
const preview = () =>
  api.purchaseCheckout.run(
    request({
      action: "preview",
      operationId: randomUUID(),
      expectedRevision: 1,
      recipient,
    }),
  ) as Promise<Preview>;
const commitCommand = (p: Preview) => ({
  action: "commit",
  operationId: randomUUID(),
  previewId: p.id,
  previewHash: p.previewHash,
  confirmed: true,
  paymentMethod: "BANK_TRANSFER",
});
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
  ])
    vi.stubEnv(key, undefined);
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", '{"projectId":"satsunicgo"}');
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  h.rows = new Map();
  h.writes = [];
  h.ready = true;
  h.form.mockClear();
  h.rows.set("settings/productionTest", {
    enabled: true,
    approved: true,
    version: 1,
    effectiveFrom: now - 1,
    expiresAt: now + 600000,
    provider: "sepay_sandbox",
    origin: "https://satsunicgo.web.app",
    testerUids: [uid],
  });
  h.rows.set("settings/upfrontCheckout", {
    enabled: true,
    approved: true,
    version: 1,
    serviceBps: 500,
    termsVersion: "test-v1",
    effectiveFrom: 0,
    expiresAt: now + 600000,
    rates: {
      USD: { numerator: 250, denominator: 1 },
      JPY: { numerator: 170, denominator: 1 },
      KRW: { numerator: 20, denominator: 1 },
    },
  });
  h.rows.set("settings/purchaseRegions", {
    provinces: [
      {
        code: "01",
        name: recipient.province,
        communes: [{ code: "00001", name: recipient.commune }],
      },
    ],
  });
  h.rows.set("products/test-product", {
    title: "Test product",
    slug: "test-product",
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 100000,
    termsVersion: "test-v1",
    catalogOptions: [],
  });
  h.rows.set(`carts/${uid}`, {
    ownerId: uid,
    revision: 1,
    updatedAt: 0,
    items: [
      {
        lineId: randomUUID(),
        productId: "test-product",
        variant: "",
        quantity: 2,
      },
    ],
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("pins preview, checkout and idempotent acknowledgement without real financial effects", async () => {
  const p = await preview();
  expect(p.executionMode).toBe("production_test");
  expect(p.testRunId).toBe(p.id);
  const command = commitCommand(p),
    result = await api.purchaseCheckout.run(request(command));
  expect(result).toMatchObject({
    id: p.id,
    provider: "sepay_sandbox",
    executionMode: "production_test",
    executionPolicyVersion: 1,
    testRunId: p.id,
  });
  expect(h.rows.get(`purchaseCheckouts/${p.id}`)).toMatchObject({
    executionMode: "production_test",
    hash: p.previewHash,
  });
  expect(
    h.writes.some((path) =>
      /^(orders|financialEntries|stock|inventory)\//.test(path),
    ),
  ).toBe(false);
  const writes = h.writes.length;
  h.rows.set("settings/productionTest", { enabled: false });
  expect(await api.purchaseCheckout.run(request(command))).toEqual(result);
  expect(h.writes).toHaveLength(writes);
});
it.each([
  { enabled: false },
  { approved: false },
  { testerUids: ["other"] },
  { expiresAt: now },
  { origin: "http://127.0.0.1:5207" },
])("denies new preview under policy delta %j", async (delta) => {
  h.rows.set("settings/productionTest", {
    ...h.rows.get("settings/productionTest"),
    ...delta,
  });
  await expect(preview()).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(h.writes).toHaveLength(0);
});
it.each([{ enabled: false }, { version: 2 }, { testerUids: ["other"] }])(
  "revalidates new commit after preview %j",
  async (delta) => {
    const p = await preview();
    h.rows.set("settings/productionTest", {
      ...h.rows.get("settings/productionTest"),
      ...delta,
    });
    await expect(
      api.purchaseCheckout.run(request(commitCommand(p))),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(h.rows.has(`purchaseCheckouts/${p.id}`)).toBe(false);
  },
);
it("rejects client provenance and unavailable provider rather than forging a test checkout", async () => {
  await expect(
    api.purchaseCheckout.run(
      request({
        action: "preview",
        operationId: randomUUID(),
        expectedRevision: 1,
        recipient,
        executionMode: "production_test",
      }),
    ),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  const p = await preview();
  h.ready = false;
  await expect(
    api.purchaseCheckout.run(request(commitCommand(p))),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
it("keeps locked accounts and wrong owners fenced", async () => {
  h.rows.set(`users/${uid}`, { locked: true });
  await expect(preview()).rejects.toMatchObject({ code: "permission-denied" });
  h.rows.delete(`users/${uid}`);
  const p = await preview();
  await expect(
    api.purchaseCheckout.run(request({ action: "status", id: p.id }, "other")),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("advertises unavailable after policy-off while retaining visible pinned status", async () => {
  const p = await preview();
  await api.purchaseCheckout.run(request(commitCommand(p)));
  h.rows.set("settings/productionTest", { enabled: false });
  expect(await api.purchaseCheckoutSetup.run(request({}))).toMatchObject({
    paymentCapabilities: { provider: "unavailable" },
  });
  expect(
    await api.purchaseCheckout.run(request({ action: "status", id: p.id })),
  ).toMatchObject({ executionMode: "production_test", testRunId: p.id });
});
it("pins new intent provenance and permits same intent resume after policy-off", async () => {
  const p = await preview();
  await api.purchaseCheckout.run(request(commitCommand(p)));
  const result = await sepay.handleSePayPayment(
    request({ action: "createCheckout", id: p.id }),
  );
  expect(result).toMatchObject({
    executionMode: "production_test",
    testRunId: p.id,
  });
  expect(h.rows.get(`purchaseSePayIntents/${p.id}`)).toMatchObject({
    executionMode: "production_test",
    testRunId: p.id,
  });
  h.rows.set("settings/productionTest", { enabled: false });
  expect(
    await sepay.handleSePayPayment(
      request({ action: "createCheckout", id: p.id }),
    ),
  ).toEqual(result);
});
it("does not create a first provider intent after policy-off or accept injected runtime adapters", async () => {
  const p = await preview();
  await api.purchaseCheckout.run(request(commitCommand(p)));
  h.rows.set("settings/productionTest", { enabled: false });
  await expect(
    sepay.handleSePayPayment(request({ action: "createCheckout", id: p.id })),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect(h.rows.has(`purchaseSePayIntents/${p.id}`)).toBe(false);
  await expect(
    sepay.handleSePayPayment(request({ action: "status", id: p.id }), {
      form: vi.fn(),
      readback: vi.fn(),
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("rejects legacy test checkout and mismatched intent modes in production", async () => {
  const p = await preview();
  await api.purchaseCheckout.run(request(commitCommand(p)));
  const stored = h.rows.get(`purchaseCheckouts/${p.id}`)!;
  h.rows.set(`purchaseSePayIntents/${p.id}`, {
    ownerId: uid,
    amount: stored.total,
    checkoutHash: stored.hash,
    paymentMethod: "BANK_TRANSFER",
  });
  await expect(
    sepay.handleSePayPayment(request({ action: "status", id: p.id })),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const { executionMode, executionPolicyVersion, testRunId, ...legacy } =
    stored;
  void executionMode;
  void executionPolicyVersion;
  void testRunId;
  h.rows.set(`purchaseCheckouts/${p.id}`, legacy);
  await expect(
    sepay.handleSePayPayment(request({ action: "status", id: p.id })),
  ).rejects.toThrow("PURCHASE_EXECUTION_ENVIRONMENT");
});

async function balanceSource() {
  const p = await preview();
  await api.purchaseCheckout.run(request(commitCommand(p)));
  const orderId = p.lines[0].orderId;
  h.rows.set(`purchaseCheckouts/${p.id}`, {
    ...h.rows.get(`purchaseCheckouts/${p.id}`),
    state: "paid",
  });
  h.rows.set(`orders/${orderId}`, {
    id: orderId,
    ownerId: uid,
    checkoutId: p.id,
    upfront: { policyVersion: 1 },
    stage: "PACKED",
    version: 1,
    finalApproved: true,
    finalTotal: 300000,
    collected: 200000,
    refunded: 0,
    executionMode: "production_test",
    executionPolicyVersion: 1,
    testRunId: p.id,
  });
  return { p, orderId };
}
const balancePreview = (orderId: string) =>
  api.purchaseBalanceCheckout.run(
    request({
      action: "preview",
      operationId: randomUUID(),
      orderId,
      expectedVersion: 1,
    }),
  ) as Promise<Preview>;

it("keeps original balance provenance across a new policy version and resumes idempotently", async () => {
  const { p, orderId } = await balanceSource();
  h.rows.set("settings/productionTest", {
    ...h.rows.get("settings/productionTest"),
    version: 2,
  });
  const balance = await balancePreview(orderId);
  expect(balance).toMatchObject({
    total: 100000,
    executionPolicyVersion: 1,
    testRunId: p.id,
    purpose: "balance",
  });
  const command = commitCommand(balance);
  const committed = await api.purchaseBalanceCheckout.run(request(command));
  expect(committed).toMatchObject({
    executionPolicyVersion: 1,
    testRunId: p.id,
    provider: "sepay_sandbox",
  });
  h.rows.set("settings/productionTest", { enabled: false });
  expect(await api.purchaseBalanceCheckout.run(request(command))).toEqual(
    committed,
  );
  expect(h.writes.some((path) => path.startsWith("financialEntries/"))).toBe(
    false,
  );
});
it.each(["legacy", "mismatched-run", "mismatched-version", "live-provider"])(
  "rejects mixed balance source %s",
  async (kind) => {
    const { p, orderId } = await balanceSource();
    if (kind === "legacy") {
      const row = h.rows.get(`orders/${orderId}`)!;
      delete row.executionMode;
      delete row.executionPolicyVersion;
      delete row.testRunId;
    } else {
      h.rows.set(`purchaseCheckouts/${p.id}`, {
        ...h.rows.get(`purchaseCheckouts/${p.id}`),
        ...(kind === "mismatched-run" ? { testRunId: randomUUID() } : {}),
        ...(kind === "mismatched-version" ? { executionPolicyVersion: 2 } : {}),
        ...(kind === "live-provider" ? { provider: "payos_unavailable" } : {}),
      });
    }
    await expect(balancePreview(orderId)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(h.rows.get(`orders/${orderId}`)?.balanceCheckoutId).toBeUndefined();
  },
);
it("rejects new balance commit after policy-off", async () => {
  const { orderId } = await balanceSource();
  const balance = await balancePreview(orderId);
  h.rows.set("settings/productionTest", { enabled: false });
  await expect(
    api.purchaseBalanceCheckout.run(request(commitCommand(balance))),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect(h.rows.has(`purchaseCheckouts/${balance.id}`)).toBe(false);
});
it("keeps maximum thirty-line preview and commit writes bounded", async () => {
  const source = h.rows.get("products/test-product")!;
  const items = Array.from({ length: 30 }, (_, i) => {
    const productId = `test-product-${i}`;
    h.rows.set(`products/${productId}`, { ...source, slug: productId });
    return { lineId: randomUUID(), productId, variant: "", quantity: 1 };
  });
  h.rows.set(`carts/${uid}`, {
    ownerId: uid,
    revision: 1,
    updatedAt: 0,
    items,
  });
  const p = await preview();
  await api.purchaseCheckout.run(request(commitCommand(p)));
  expect(p.lines).toHaveLength(30);
  expect(p.total).toBe(3000000);
  expect(h.writes).toHaveLength(5);
  expect(
    h.writes.some((path) =>
      /^(orders|financialEntries|inventory)\//.test(path),
    ),
  ).toBe(false);
});

it.each(["legacy-live", "different-run", "partial-mode"])(
  "never mutates a mixed target during sandbox worker recovery: %s",
  async (kind) => {
    const id = randomUUID(),
      orderId = randomUUID(),
      key = "a".repeat(64);
    const provenance = {
      executionMode: "production_test",
      executionPolicyVersion: 1,
      testRunId: randomUUID(),
    };
    const checkout = {
      state: "pending",
      version: 1,
      provider: "sepay_sandbox",
      lines: [{ orderId }],
      ...(kind === "different-run"
        ? { ...provenance, testRunId: randomUUID() }
        : {}),
      ...(kind === "partial-mode" ? { executionMode: "production_test" } : {}),
    };
    h.rows.set(`purchaseCheckouts/${id}`, checkout);
    h.rows.set(`orders/${orderId}`, { state: "pending", version: 1 });
    h.rows.set(`purchaseSePayInbox/${key}`, {
      ...provenance,
      checkoutId: id,
      state: "queued",
      attempts: 0,
      payload: { notification_type: "TRANSACTION_VOID" },
    });
    await expect(sepay.processSePayInbox(key)).rejects.toThrow(
      "SEPAY_RETRY_REQUIRED",
    );
    expect(h.rows.get(`purchaseCheckouts/${id}`)).toEqual(checkout);
    expect(h.rows.get(`orders/${orderId}`)).toEqual({
      state: "pending",
      version: 1,
    });
    expect(h.rows.get(`purchaseSePayInbox/${key}`)).toMatchObject({
      state: "queued",
      attempts: 1,
      leaseUntil: 0,
    });
  },
);
