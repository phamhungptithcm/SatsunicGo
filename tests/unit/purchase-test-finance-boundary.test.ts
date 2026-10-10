import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
const memory = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  writes: [] as string[],
  projectId: "satsunicgo",
  seq: 0,
}));
vi.mock("firebase-admin/firestore", async (original) => {
  const actual = await original<typeof import("firebase-admin/firestore")>();
  type Data = Record<string, unknown>;
  type Query = {
    path: string;
    filters: [string, string, unknown][];
    max: number;
  };
  const ref = (path: string) => ({
    path,
    id: path.split("/").at(-1)!,
    get: async () => snapshot(path),
    collection: (child: string) => collection(`${path}/${child}`),
    create: async (value: Data) => {
      if (memory.docs.has(path)) throw { code: 6 };
      memory.docs.set(path, structuredClone(value));
      memory.writes.push(path);
    },
  });
  const snapshot = (path: string) => ({
    ref: ref(path),
    id: path.split("/").at(-1)!,
    exists: memory.docs.has(path),
    data: () =>
      memory.docs.get(path)
        ? structuredClone(memory.docs.get(path))
        : undefined,
  });
  const collection = (
    path: string,
    filters: Query["filters"] = [],
    max = Infinity,
  ) => ({
    path,
    filters,
    max,
    doc: (id = `auto-${++memory.seq}`) => ref(`${path}/${id}`),
    where: (key: string, op: string, value: unknown) =>
      collection(path, [...filters, [key, op, value]], max),
    orderBy: (_key: string, _direction?: string) =>
      collection(path, filters, max),
    limit: (limit: number) => collection(path, filters, limit),
  });
  const get = async (r: ReturnType<typeof ref> | Query) => {
    if (!("filters" in r)) return snapshot(r.path);
    const docs = [...memory.docs.keys()]
      .filter(
        (path) =>
          path.startsWith(`${r.path}/`) &&
          path.split("/").length === r.path.split("/").length + 1,
      )
      .filter((path) =>
        r.filters.every(([key, op, value]) => {
          const current = memory.docs.get(path)![key];
          if (op === "==") return current === value;
          if (op === ">=")
            return (
              typeof current === "number" &&
              typeof value === "number" &&
              current >= value
            );
          if (op === "<=")
            return (
              typeof current === "number" &&
              typeof value === "number" &&
              current <= value
            );
          throw Error("UNSUPPORTED_QUERY");
        }),
      )
      .slice(0, r.max)
      .map(snapshot);
    return { docs, size: docs.length };
  };
  return {
    ...actual,
    getFirestore: () => ({
      projectId: memory.projectId,
      doc: ref,
      collection,
      runTransaction: async (work: (tx: unknown) => Promise<unknown>) => {
        const pending: (() => void)[] = [];
        const tx = {
          get,
          getAll: (...refs: ReturnType<typeof ref>[]) =>
            Promise.all(refs.map(get)),
          create: (r: ReturnType<typeof ref>, value: Data) =>
            pending.push(() => {
              if (memory.docs.has(r.path)) throw Error("ALREADY_EXISTS");
              memory.docs.set(r.path, structuredClone(value));
              memory.writes.push(r.path);
            }),
          update: (r: ReturnType<typeof ref>, value: Data) =>
            pending.push(() => {
              if (!memory.docs.has(r.path)) throw Error("NOT_FOUND");
              memory.docs.set(r.path, {
                ...memory.docs.get(r.path),
                ...structuredClone(value),
              });
              memory.writes.push(r.path);
            }),
          set: (
            r: ReturnType<typeof ref>,
            value: Data,
            options?: { merge?: boolean },
          ) =>
            pending.push(() => {
              memory.docs.set(r.path, {
                ...(options?.merge ? memory.docs.get(r.path) : {}),
                ...structuredClone(value),
              });
              memory.writes.push(r.path);
            }),
        };
        const result = await work(tx);
        pending.forEach((commit) => commit());
        return result;
      },
    }),
  };
});
import {
  isPurchaseTestRecord,
  matchingPurchaseExecution,
  purchaseExecutionFields,
  purchaseFinancialCollection,
  requireLivePurchaseRecord,
} from "../../functions/src/purchase-test-boundary";
import {
  settleSePayEvidence,
  applyDemoSettlement,
} from "../../functions/src/purchase-settlement";
import { financeReview } from "../../functions/src/finance-review";
import { refundCommand } from "../../functions/src/refunds";
import { shippingCommand } from "../../functions/src/shipping";
import { consolidationCommand } from "../../functions/src/consolidation";
import { changeCommand } from "../../functions/src/changes";
import { returnCommand } from "../../functions/src/returns";
import { orderHistory } from "../../functions/src/order-history";
import { invoiceCommand } from "../../functions/src/invoices";
import { operationalDashboard } from "../../functions/src/crm";
import {
  enqueueAnalytics,
  processAnalyticsJob,
} from "../../functions/src/analytics-worker";
import { purchaseSourcingChange } from "../../functions/src/purchase-adjustment";
import { SEPAY_MERCHANT } from "../../packages/domain/purchase-sepay";
const provenance = {
  executionMode: "production_test",
  executionPolicyVersion: 1,
  testRunId: "00000000-0000-4000-8000-000000000001",
};
const now = Date.now(),
  owner = "test-owner",
  staff = "test-staff";
const req = (data: unknown, uid = staff) =>
  ({
    data,
    auth: {
      uid,
      token: {
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
        firebase: {
          sign_in_provider: "google.com",
          sign_in_second_factor: "totp",
        },
      },
    },
  }) as CallableRequest;
const put = (path: string, data: Record<string, unknown>) =>
  memory.docs.set(path, structuredClone(data));
function baseOrder(id = randomUUID()) {
  return {
    id,
    ownerId: owner,
    stage: "PURCHASING",
    version: 1,
    createdAt: now - 1000,
    market: "US",
    items: [{ name: "Synthetic item", variant: "", quantity: 1 }],
    collected: 100000,
    refunded: 0,
    notes: "",
    ...provenance,
  };
}
function fixture(balance = false, lineCount = 1) {
  const id = randomUUID(),
    reference = "SEPAY-SBX-fixture",
    proofId = "a".repeat(64);
  const orders = Array.from({ length: lineCount }, () => baseOrder());
  const lines = orders.map((o, i) => ({
    orderId: o.id,
    lineId: randomUUID(),
    name: "Synthetic item",
    itemIndex: i,
    quantity: 1,
    total: 100000,
  }));
  const checkout = {
    ...provenance,
    id,
    ownerId: owner,
    version: 1,
    state: "pending",
    provider: "sepay_sandbox",
    paymentMethod: "BANK_TRANSFER",
    hash: "b".repeat(64),
    total: lineCount * 100000,
    createdAt: now - 1000,
    expiresAt: now + 60000,
    lines,
    orders,
    recipient: {
      recipient: "Synthetic tester",
      phone: "0900000000",
      street: "Synthetic street",
      commune: "Commune",
      province: "Province",
    },
    shipping: { state: "unknown" },
    ...(balance
      ? {
          purpose: "balance",
          sourceOrderId: orders[0].id,
          sourceOrderVersion: 1,
          balanceReason: "sourcing",
        }
      : {}),
  };
  put(`purchaseCheckouts/${id}`, checkout);
  put(`carts/${owner}`, {
    ownerId: owner,
    revision: 1,
    updatedAt: 0,
    activeCheckoutId: id,
    items: [],
  });
  put(`users/${owner}`, { locked: false });
  put(`purchaseSePayEvidence/${proofId}`, {
    ...provenance,
    state: "verified",
    provider: "sepay_sandbox",
    merchant: SEPAY_MERCHANT,
    checkoutId: id,
    ownerId: owner,
    currency: "VND",
    paymentMethod: "BANK_TRANSFER",
    amount: checkout.total,
    expectedAmount: checkout.total,
    paidAt: now,
    reference,
    checkoutHash: checkout.hash,
    invoice: "TEST",
    providerOrderId: "P1",
    providerInternalId: "1",
    transactionId: "1",
    verifiedAt: now,
  });
  if (balance)
    put(`orders/${orders[0].id}`, {
      ...orders[0],
      version: 2,
      balanceCheckoutId: id,
      checkoutId: "original",
      upfront: { initialTotal: 100000 },
      purchaseAdjustment: { approved: true, total: 200000 },
    });
  return { id, orders, proofId, reference };
}
beforeEach(() => {
  memory.docs.clear();
  memory.writes.length = 0;
  memory.projectId = "satsunicgo";
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  for (const key of [
    "GOOGLE_CLOUD_PROJECT",
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
  ])
    vi.stubEnv(key, "");
  // Optional project identity may be absent, never a different project.
  delete process.env.GOOGLE_CLOUD_PROJECT;
  put(`staffAccess/${staff}`, {
    active: true,
    roles: ["OWNER", "FINANCE", "WAREHOUSE", "OPERATIONS_MANAGER"],
    locked: false,
  });
  put(`users/${staff}`, { locked: false });
});
afterEach(() => vi.unstubAllEnvs());
describe("test provenance never grants live authority", () => {
  it.each([
    { testMode: true },
    { provider: "sepay_sandbox" },
    { paymentProvider: "sepay_sandbox" },
    { executionMode: "unknown" },
    { testRunId: "partial" },
    provenance,
  ])("rejects live authority for %j", (record) => {
    expect(isPurchaseTestRecord(record)).toBe(true);
    expect(() => requireLivePurchaseRecord(record)).toThrow();
    expect(purchaseFinancialCollection(record)).toBe(
      "purchaseTestFinancialEntries",
    );
  });
  it("retains legacy real behavior, rejects partial propagation and mode mixing", () => {
    expect(() => requireLivePurchaseRecord({})).not.toThrow();
    expect(purchaseFinancialCollection({})).toBe("financialEntries");
    expect(() =>
      purchaseExecutionFields({ executionMode: "production_test" }),
    ).toThrow();
    expect(
      matchingPurchaseExecution(provenance, {
        ...provenance,
        testRunId: randomUUID(),
      }),
    ).toBe(false);
    expect(matchingPurchaseExecution(provenance, {})).toBe(false);
    expect(purchaseExecutionFields({ testMode: true })).toEqual({
      testMode: true,
    });
  });
});
describe("real settlement transaction in production test mode", () => {
  it("allocates once only into test ledger and propagates immutable provenance", async () => {
    const f = fixture();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => settleSePayEvidence(f.proofId)),
    );
    expect(results.every((r) => r.state === "paid")).toBe(true);
    const paths = [...memory.docs.keys()];
    expect(paths.filter((p) => p.startsWith("financialEntries/"))).toHaveLength(
      0,
    );
    expect(
      paths.filter((p) => p.startsWith("purchaseTestFinancialEntries/")),
    ).toHaveLength(1);
    for (const path of [
      `orders/${f.orders[0].id}`,
      `purchaseReceipts/${f.id}`,
      `purchaseReceiptJobs/${f.id}`,
      `outboxJobs/purchase-payment-${f.id}`,
      `orderOperations/${f.orders[0].id}`,
      `orderRecipients/${f.orders[0].id}`,
    ])
      expect(memory.docs.get(path)).toMatchObject(provenance);
  });
  it("supports pinned sourcing balance within the same test run", async () => {
    const f = fixture(true);
    await settleSePayEvidence(f.proofId);
    expect(memory.docs.get(`orders/${f.orders[0].id}`)).toMatchObject({
      collected: 200000,
      ...provenance,
    });
  });
  it.each([
    {},
    { ...provenance, testRunId: "00000000-0000-4000-8000-000000000002" },
    { ...provenance, executionPolicyVersion: 2 },
  ])("rejects mixed balance without touching its source %j", async (mode) => {
    const f = fixture(true);
    const path = `orders/${f.orders[0].id}`,
      order = memory.docs.get(path)!;
    for (const key of Object.keys(provenance)) delete order[key];
    Object.assign(order, mode);
    const before = structuredClone(order);
    await expect(settleSePayEvidence(f.proofId)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(memory.docs.get(path)).toEqual(before);
    expect(memory.writes).toHaveLength(0);
  });
  it.each(["underpayment", "late_payment", "locked_owner"])(
    "verified %s remains test-only review evidence",
    async (reason) => {
      const f = fixture();
      const proof = memory.docs.get(`purchaseSePayEvidence/${f.proofId}`)!;
      if (reason === "underpayment") proof.amount = 99000;
      if (reason === "late_payment") proof.paidAt = now + 120000;
      if (reason === "locked_owner") put(`users/${owner}`, { locked: true });
      expect(await settleSePayEvidence(f.proofId)).toMatchObject({
        state: "review_required",
      });
      expect(
        memory.docs.get(`purchasePaymentEvidence/${f.reference}`),
      ).toMatchObject({ ...provenance, allocationState: "review_required" });
      expect(
        [...memory.docs.keys()].filter((path) =>
          /^(financialEntries|purchaseTestFinancialEntries|orders|purchaseReceipts)\//.test(
            path,
          ),
        ),
      ).toHaveLength(0);
    },
  );
  it("corrupt proof mode cannot fall back to a real operation", async () => {
    const f = fixture();
    memory.docs.get(`purchaseSePayEvidence/${f.proofId}`)!.executionMode =
      "unknown";
    await expect(settleSePayEvidence(f.proofId)).rejects.toThrow();
    expect(memory.writes).toHaveLength(0);
  });
  it("cannot relabel old unpinned sandbox proof on production", async () => {
    const f = fixture();
    const proof = memory.docs.get(`purchaseSePayEvidence/${f.proofId}`)!;
    for (const key of Object.keys(provenance)) delete proof[key];
    await expect(settleSePayEvidence(f.proofId)).rejects.toThrow();
    expect(memory.writes).toHaveLength(0);
  });
  it("blocks client demo outcomes on production", async () => {
    const f = fixture();
    await expect(
      applyDemoSettlement({ id: f.id, uid: owner, outcome: "paid" }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(memory.writes).toHaveLength(0);
  });
  it("bounds maximum 30-line allocation below transaction write limit", async () => {
    const f = fixture(false, 30);
    await settleSePayEvidence(f.proofId);
    expect(
      [...memory.docs.keys()].filter((p) =>
        p.startsWith("purchaseTestFinancialEntries/"),
      ),
    ).toHaveLength(30);
    expect(memory.writes.length).toBeLessThan(500);
  });
});
describe("existing handlers reject real side effects", () => {
  it.each(["reverse", "allocateException"] as const)(
    "finance %s rejects a test order",
    async (action) => {
      const o = baseOrder();
      put(`orders/${o.id}`, o);
      const data = {
        action,
        orderId: o.id,
        expectedVersion: 1,
        operationId: randomUUID(),
        evidence: "Synthetic evidence",
        reason: "Synthetic reason",
        ...(action === "reverse"
          ? { entryId: "entry", amount: 100, bankTransactionId: "bank1" }
          : { id: "exception" }),
      };
      await expect(financeReview.run(req(data))).rejects.toMatchObject({
        code: "failed-precondition",
      });
      expect(memory.writes).toHaveLength(0);
    },
  );
  it("refund rejects test balance", async () => {
    const o = baseOrder();
    put(`orders/${o.id}`, o);
    await expect(
      refundCommand.run(
        req({
          action: "request",
          orderId: o.id,
          expectedVersion: 1,
          operationId: randomUUID(),
          amount: 100,
          reason: "Synthetic reason",
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(memory.writes).toHaveLength(0);
  });
  it("physical parcel cannot include a test order", async () => {
    const o = baseOrder();
    put(`orders/${o.id}`, o);
    await expect(
      shippingCommand.run(
        req({
          action: "packParcel",
          operationId: randomUUID(),
          orderVersions: { [o.id]: 1 },
          payload: {
            allocations: [{ orderId: o.id, line: 0, quantity: 1 }],
            weightGrams: 10,
            warehouse: "Test",
            route: "Test",
            dimensionsCm: [1, 1, 1],
            checklist: true,
            evidence: "Synthetic evidence",
          },
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(memory.writes).toHaveLength(0);
  });
  it("physical consolidation cannot include a test order", async () => {
    const o = baseOrder();
    put(`orders/${o.id}`, o);
    put("packages/parcel", {
      id: "parcel",
      version: 1,
      allocations: [{ orderId: o.id, line: 0, quantity: 1 }],
    });
    await expect(
      consolidationCommand.run(
        req({
          action: "seal",
          operationId: randomUUID(),
          orderVersions: { [o.id]: 1 },
          parcelVersions: { parcel: 1 },
          payload: {
            parcelIds: ["parcel"],
            orderWeights: { [o.id]: 10 },
            freight: 100,
            hub: "Test",
            service: "Test",
            cutoff: now + 60000,
          },
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(memory.writes).toHaveLength(0);
  });
  it("change flow cannot create real financial adjustments from a test order", async () => {
    const o = baseOrder();
    put(`orders/${o.id}`, o);
    await expect(
      changeCommand.run(
        req({
          action: "propose",
          orderId: o.id,
          expectedVersion: 1,
          operationId: randomUUID(),
          payload: {},
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(memory.writes).toHaveLength(0);
  });
  it("physical return rejects both old and current test records", async () => {
    const o = baseOrder();
    put(`orders/${o.id}`, o);
    put("orderReturns/return1", {
      orderId: o.id,
      version: 1,
      state: "authorized",
    });
    await expect(
      returnCommand.run(
        req({
          action: "close",
          id: "return1",
          expectedVersion: 1,
          operationId: randomUUID(),
          evidence: "Synthetic evidence",
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(memory.writes).toHaveLength(0);
  });
  it("sourcing proposal/approval stay simulated and outbox inherits provenance", async () => {
    const o = {
      ...baseOrder(),
      checkoutId: randomUUID(),
      upfront: {
        unitSourceMinor: 100,
        fxNumerator: 100,
        fxDenominator: 1,
        service: 100,
        initialTotal: 10100,
      },
    };
    put(`orders/${o.id}`, o);
    await purchaseSourcingChange.run(
      req({
        action: "propose",
        orderId: o.id,
        expectedVersion: 1,
        operationId: randomUUID(),
        sourceLimitMinor: 200,
        reason: "Synthetic source difference",
      }),
    );
    await purchaseSourcingChange.run(
      req(
        {
          action: "approve",
          orderId: o.id,
          expectedVersion: 2,
          proposalVersion: 1,
          operationId: randomUUID(),
        },
        owner,
      ),
    );
    expect(memory.docs.get(`orders/${o.id}`)).toMatchObject({
      ...provenance,
      purchaseAdjustment: { approved: true },
    });
    expect(
      [...memory.docs.keys()].some((p) => p.startsWith("financialEntries/")),
    ).toBe(false);
    for (const [path, value] of memory.docs)
      if (path.startsWith("outboxJobs/"))
        expect(value).toMatchObject(provenance);
  });
});
describe("generic invoices cannot turn sandbox totals into real statements", () => {
  function seedInvoice(testSource = true, state = "draft") {
    const o = {
      ...baseOrder(),
      acceptedAt: now,
      finalApproved: true,
      finalTotal: 100000,
      quote: { termsVersion: "synthetic-v1" },
    } as Record<string, unknown>;
    if (!testSource) for (const key of Object.keys(provenance)) delete o[key];
    put(`orders/${o.id}`, o);
    put(`users/${owner}`, { displayName: "Synthetic tester" });
    put("settings/invoiceSeller", {
      version: 1,
      seller: {
        name: "Synthetic seller",
        address: "Synthetic seller address",
        contact: "Synthetic contact",
      },
    });
    put("settings/email", { enabled: true });
    put("salesDocuments/doc1", {
      id: "doc1",
      ownerId: owner,
      sourceOrderId: o.id,
      sourceVersion: 1,
      sellerVersion: 1,
      version: 1,
      state,
      shareEpoch: 0,
      issueNumber: "SG-00000001",
      createdAt: now,
    });
    return o;
  }
  it.each([
    "createDraft",
    "refreshDraft",
    "issue",
    "createShare",
    "queueEmail",
  ])(
    "%s rejects test source before counter/document/share/email writes",
    async (action) => {
      const o = seedInvoice(
        true,
        ["createShare", "queueEmail"].includes(action) ? "issued" : "draft",
      );
      const data = {
        action,
        operationId: randomUUID(),
        ...(action === "createDraft"
          ? { orderId: o.id }
          : { id: "doc1", expectedVersion: 1 }),
      };
      await expect(invoiceCommand.run(req(data))).rejects.toMatchObject({
        code: "failed-precondition",
      });
      expect(memory.writes).toHaveLength(0);
      expect(memory.docs.has("documentCounters/internalStatements")).toBe(
        false,
      );
    },
  );
  it.each([
    { testMode: true },
    { executionMode: "unknown" },
    { testRunId: "partial" },
  ])(
    "tagged document cannot gain live authority even with untagged source %j",
    async (marker) => {
      seedInvoice(false);
      Object.assign(memory.docs.get("salesDocuments/doc1")!, marker);
      await expect(
        invoiceCommand.run(
          req({
            action: "issue",
            id: "doc1",
            expectedVersion: 1,
            operationId: randomUUID(),
          }),
        ),
      ).rejects.toMatchObject({ code: "failed-precondition" });
      expect(memory.writes).toHaveLength(0);
    },
  );
  it("real draft, numbering, share and email retain authenticated behavior", async () => {
    const o = seedInvoice(false);
    const draft = await invoiceCommand.run(
      req({ action: "createDraft", orderId: o.id, operationId: randomUUID() }),
    );
    const id = String(draft.id);
    await invoiceCommand.run(
      req({
        action: "issue",
        id,
        expectedVersion: 1,
        operationId: randomUUID(),
      }),
    );
    expect(memory.docs.get("documentCounters/internalStatements")).toEqual({
      value: 1,
    });
    expect(memory.docs.get(`salesDocuments/${id}`)).toMatchObject({
      state: "issued",
      issueNumber: "SG-00000001",
    });
    const shared = await invoiceCommand.run(
      req({
        action: "createShare",
        id,
        expectedVersion: 2,
        operationId: randomUUID(),
      }),
    );
    expect(typeof shared.token).toBe("string");
    await invoiceCommand.run(
      req({
        action: "queueEmail",
        id,
        expectedVersion: 3,
        operationId: randomUUID(),
      }),
    );
    expect(
      [...memory.docs.entries()].filter(
        ([path, data]) =>
          path.startsWith("outboxJobs/invoice-") &&
          data.action === "invoiceIssued",
      ),
    ).toHaveLength(1);
  });
});
describe("readers and analytics", () => {
  it.each([true, false])(
    "history uses corresponding ledger (test=%s)",
    async (test) => {
      const o = baseOrder();
      if (!test)
        for (const key of Object.keys(provenance))
          delete (o as Record<string, unknown>)[key];
      put(`orders/${o.id}`, o);
      put(`financialEntries/real`, {
        orderId: o.id,
        kind: "payment",
        amount: 999,
        createdAt: now,
      });
      put(`purchaseTestFinancialEntries/test`, {
        orderId: o.id,
        kind: "payment",
        amount: 123,
        createdAt: now,
      });
      const result = await orderHistory.run(req({ orderId: o.id }, owner));
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].amount).toBe(test ? 123 : 999);
    },
  );
  it("foreign history remains denied", async () => {
    const o = baseOrder();
    put(`orders/${o.id}`, o);
    await expect(
      orderHistory.run(req({ orderId: o.id }, "foreign")),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it.each(["order", "ledger"] as const)(
    "direct %s enqueue ignores test sources",
    async (type) => {
      const o = baseOrder();
      put(`orders/${o.id}`, o);
      put("analyticsConfig/current", { enabled: true });
      put("financialEntries/legacy", { orderId: o.id, amount: 100 });
      await enqueueAnalytics(type, type === "order" ? o.id : "legacy", "1");
      expect(
        [...memory.docs.keys()].filter((p) => p.startsWith("analyticsJobs/")),
      ).toHaveLength(0);
    },
  );
  it.each(["order", "ledger"] as const)(
    "pending historical %s job cannot leak test revenue",
    async (type) => {
      const o = baseOrder();
      put(`orders/${o.id}`, o);
      put("analyticsConfig/current", {
        enabled: true,
        startedAt: now - 100000,
      });
      put("financialEntries/legacy", {
        orderId: o.id,
        amount: 100,
        currency: "VND",
        kind: "payment",
        createdAt: now,
      });
      put("analyticsJobs/job", {
        type,
        source: type === "order" ? o.id : "legacy",
        state: "pending",
      });
      await processAnalyticsJob("job");
      expect(memory.docs.get("analyticsJobs/job")).toMatchObject({
        state: "done",
        reason: "test_record_excluded",
      });
      expect(
        memory.writes.every(
          (p) =>
            p.startsWith("analyticsJobs/") ||
            p.startsWith("analyticsProcessed/"),
        ),
      ).toBe(true);
    },
  );
  it("live operations dashboard excludes test and partial mode records", async () => {
    const real = { ...baseOrder(), id: "real", stage: "REQUESTED" } as Record<
      string,
      unknown
    >;
    for (const key of Object.keys(provenance)) delete real[key];
    put("orders/real", real);
    put("orders/test", { ...baseOrder(), stage: "REQUESTED" });
    put("orders/partial", { ...real, executionMode: "unknown" });
    put("transferReviews/test", {
      ...provenance,
      status: "pending",
      createdAt: now,
    });
    put("paymentExceptions/test", {
      testMode: true,
      state: "open",
      createdAt: now,
    });
    const result = await operationalDashboard.run(
      req({ from: now - 60000, until: now + 1000 }),
    );
    expect(result.counts).toMatchObject({
      requests: 1,
      transfers: 0,
      exceptions: 0,
    });
  });
  it("untagged real finance reversal keeps its existing ledger behavior", async () => {
    const o = baseOrder() as Record<string, unknown>;
    for (const key of Object.keys(provenance)) delete o[key];
    put(`orders/${o.id}`, o);
    put("financialEntries/real-payment", {
      kind: "payment",
      orderId: o.id,
      amount: 1000,
    });
    await financeReview.run(
      req({
        action: "reverse",
        orderId: o.id,
        entryId: "real-payment",
        expectedVersion: 1,
        amount: 100,
        bankTransactionId: "synthetic-real-ledger",
        operationId: randomUUID(),
        evidence: "Synthetic evidence",
        reason: "Synthetic reason",
      }),
    );
    expect(memory.docs.get(`orders/${o.id}`)?.collected).toBe(99900);
    expect(
      [...memory.docs.entries()].filter(
        ([path, data]) =>
          path.startsWith("financialEntries/") && data.kind === "reversal",
      ),
    ).toHaveLength(1);
    expect(
      [...memory.docs.keys()].some((path) =>
        path.startsWith("purchaseTestFinancialEntries/"),
      ),
    ).toBe(false);
  });
  it("finance cannot close a tagged exception in a live queue", async () => {
    put("paymentExceptions/test", { state: "open", testMode: true });
    await expect(
      financeReview.run(
        req({
          action: "closeException",
          id: "test",
          operationId: randomUUID(),
          evidence: "Synthetic evidence",
          reason: "Synthetic reason",
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(memory.writes).toHaveLength(0);
  });
  it("real order cannot reverse a tagged legacy sandbox entry", async () => {
    const o = baseOrder() as Record<string, unknown>;
    for (const key of Object.keys(provenance)) delete o[key];
    put(`orders/${o.id}`, o);
    put("financialEntries/tagged", {
      testMode: true,
      kind: "payment",
      orderId: o.id,
      amount: 100,
    });
    await expect(
      financeReview.run(
        req({
          action: "reverse",
          orderId: o.id,
          entryId: "tagged",
          expectedVersion: 1,
          amount: 100,
          bankTransactionId: "synthetic",
          operationId: randomUUID(),
          evidence: "Synthetic evidence",
          reason: "Synthetic reason",
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(memory.writes).toHaveLength(0);
  });
  it("untagged real order still enqueues", async () => {
    put("orders/real", { id: "real", version: 1 });
    put("analyticsConfig/current", { enabled: true });
    await enqueueAnalytics("order", "real", "1");
    const digest = createHash("sha256").update("real:1").digest("hex");
    expect(memory.docs.get(`analyticsJobs/order-${digest}`)).toMatchObject({
      state: "pending",
    });
  });
});
