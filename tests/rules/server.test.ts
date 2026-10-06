import { beforeAll, afterAll, it, expect } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let command: typeof import("../../functions/src/index").command;
let workspace: typeof import("../../functions/src/workspace").workspaceCommand;
let db: ReturnType<typeof getFirestore>;
const prefix = `integration-${randomUUID()}`;
const customer = `${prefix}-a`,
  other = `${prefix}-b`,
  owner = `${prefix}-owner`;
function req(uid: string, data: unknown) {
  return {
    auth: {
      uid,
      token: {
        uid,
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
async function invoke(
  uid: string,
  action: string,
  payload: unknown,
  id?: string,
  version?: number,
  operationId = randomUUID(),
) {
  return command.run(
    req(uid, {
      action,
      payload,
      operationId,
      ...(id ? { orderId: id, expectedVersion: version } : {}),
    }),
  );
}
beforeAll(async () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  process.env.GCLOUD_PROJECT = `demo-satsunicgo-server-${randomUUID().slice(0, 8)}`;
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: process.env.GCLOUD_PROJECT,
  });
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8181";
  ({ command } = await import("../../functions/src/index"));
  ({ workspaceCommand: workspace } =
    await import("../../functions/src/workspace"));
  db = getFirestore();
  await db
    .doc(`staffAccess/${owner}`)
    .set({ active: true, locked: false, roles: ["OWNER"] });
  await db.doc("settings/pricing").set({
    approved: true,
    termsVersion: "emulator-v1",
    rates: {
      USD: { numerator: 250, denominator: 1 },
      JPY: { numerator: 1, denominator: 1 },
      KRW: { numerator: 1, denominator: 1 },
    },
    effectiveFrom: 1,
    expiresAt: Date.now() + 3600000,
  });
});
afterAll(async () => {
  await db?.terminate();
});
const payload = {
  market: "US",
  items: [
    { name: "Emulator item", url: "", quantity: 1, variant: "Confirmed size" },
  ],
  notes: "fixture only",
};
const q = () => ({
  goods: 1700000,
  service: 100000,
  sourceCosts: 0,
  internationalShipping: 150000,
  destinationShipping: 50000,
  discount: 0,
  sourceCurrency: "USD",
  sourceMinor: 6800,
  fxNumerator: 250,
  fxDenominator: 1,
  termsVersion: "emulator-v1",
  expiresAt: Date.now() + 3600000,
  verifiedProduct: "Verified test product and variant",
});
it("cannot overwrite an existing order through submitRequest", async () => {
  const a = await invoke(customer, "submitRequest", payload);
  await expect(
    invoke(other, "submitRequest", payload, a.id, a.version),
  ).rejects.toMatchObject({ code: "already-exists" });
  expect((await db.doc(`orders/${a.id}`).get()).data()?.ownerId).toBe(customer);
});
it("idempotency returns same outcome and rejects conflicting reuse", async () => {
  const op = randomUUID(),
    a = await invoke(
      customer,
      "submitRequest",
      payload,
      undefined,
      undefined,
      op,
    ),
    b = await invoke(
      customer,
      "submitRequest",
      payload,
      undefined,
      undefined,
      op,
    );
  expect(a).toEqual(b);
  await expect(
    invoke(
      customer,
      "submitRequest",
      { ...payload, notes: "changed" },
      undefined,
      undefined,
      op,
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
});
it("customer cannot quote or accept another customers quote", async () => {
  let a = await invoke(customer, "submitRequest", payload);
  await expect(
    invoke(customer, "issueQuote", q(), a.id, a.version),
  ).rejects.toMatchObject({ code: "permission-denied" });
  a = await invoke(owner, "issueQuote", q(), a.id, a.version);
  await expect(
    invoke(other, "acceptQuote", { quoteVersion: 1 }, a.id, a.version),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("full server lifecycle uses approved final total and confirmed funds", async () => {
  let a = await invoke(customer, "submitRequest", payload);
  a = await invoke(owner, "issueQuote", q(), a.id, a.version);
  a = await invoke(
    customer,
    "acceptQuote",
    { quoteVersion: 1 },
    a.id,
    a.version,
  );
  await expect(
    invoke(owner, "claimPurchase", {}, a.id, a.version),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  a = await invoke(
    owner,
    "verifyTransfer",
    {
      amount: 1000000,
      bankTransactionId: randomUUID(),
      evidence: "emulator bank entry",
      reason: "Emulator deposit",
    },
    a.id,
    a.version,
  );
  a = await invoke(owner, "claimPurchase", {}, a.id, a.version);
  a = await invoke(
    owner,
    "recordPurchase",
    {
      quantity: 1,
      supplierOrder: "test-merchant",
      actualSourceMinor: 6800,
      evidence: "test purchase receipt",
    },
    a.id,
    a.version,
  );
  a = await invoke(
    owner,
    "receive",
    { quantity: 1, condition: "good", evidence: "test check photos" },
    a.id,
    a.version,
  );
  a = await invoke(
    owner,
    "pack",
    {
      weightGrams: 1000,
      dimensionsCm: [10, 20, 30],
      evidence: "test packing photo",
      checklist: true,
    },
    a.id,
    a.version,
  );
  a = await invoke(
    owner,
    "finalize",
    { total: 2160000, reason: "Emulator actual shipping charge" },
    a.id,
    a.version,
  );
  await expect(
    invoke(owner, "dispatch", {}, a.id, a.version),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  a = await invoke(customer, "approveFinal", {}, a.id, a.version);
  a = await invoke(
    owner,
    "verifyTransfer",
    {
      amount: 1160000,
      bankTransactionId: randomUUID(),
      evidence: "test bank balance",
      reason: "Emulator balance",
    },
    a.id,
    a.version,
  );
  expect((await db.doc(`orders/${a.id}`).get()).data()?.stage).toBe(
    "READY_TO_SHIP",
  );
  a = await invoke(owner, "dispatch", {}, a.id, a.version);
  a = await invoke(
    owner,
    "track",
    { tracking: "test-parcel", delivered: true },
    a.id,
    a.version,
  );
  expect((await db.doc(`orders/${a.id}`).get()).data()?.stage).toBe(
    "DELIVERED",
  );
});
it("concurrent commands cannot double allocate bank funds", async () => {
  let a = await invoke(customer, "submitRequest", payload);
  a = await invoke(owner, "issueQuote", q(), a.id, a.version);
  a = await invoke(
    customer,
    "acceptQuote",
    { quoteVersion: 1 },
    a.id,
    a.version,
  );
  const p = {
    amount: 1000000,
    bankTransactionId: randomUUID(),
    evidence: "test entry",
    reason: "Test concurrent payment",
  };
  const results = await Promise.allSettled([
    invoke(owner, "verifyTransfer", p, a.id, a.version),
    invoke(owner, "verifyTransfer", p, a.id, a.version),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect((await db.doc(`orders/${a.id}`).get()).data()?.collected).toBe(
    1000000,
  );
}, 60000);
it("revoked finance and locked customer denied", async () => {
  const f = `${prefix}-finance`;
  const a = await invoke(customer, "submitRequest", payload);
  await db.doc(`staffAccess/${f}`).set({ active: false, roles: ["FINANCE"] });
  await expect(
    invoke(
      f,
      "verifyTransfer",
      {
        amount: 1,
        bankTransactionId: randomUUID(),
        evidence: "test-entry",
        reason: "test",
      },
      a.id,
      a.version,
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await db.doc(`users/${other}`).set({ ownerId: other, locked: true });
  await expect(invoke(other, "submitRequest", payload)).rejects.toMatchObject({
    code: "permission-denied",
  });
});
it("support creation cannot overwrite someone elses ticket", async () => {
  const t = await workspace.run(
    req(customer, {
      action: "openTicket",
      operationId: randomUUID(),
      payload: {
        subject: "Test support",
        message: "Test persisted customer message",
      },
    }),
  );
  await expect(
    workspace.run(
      req(owner, {
        action: "openTicket",
        id: t.id,
        expectedVersion: t.version,
        operationId: randomUUID(),
        payload: { subject: "Overwrite", message: "Not allowed" },
      }),
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
});
it("preserves immutable quote and acceptance snapshots", async () => {
  let order = await invoke(customer, "submitRequest", payload);
  order = await invoke(owner, "issueQuote", q(), order.id, order.version);
  const issued = (await db.doc(`orders/${order.id}/quotes/1`).get()).data();
  expect(issued?.quote.goods).toBe(q().goods);
  order = await invoke(
    customer,
    "acceptQuote",
    { quoteVersion: 1 },
    order.id,
    order.version,
  );
  expect(
    (await db.doc(`orders/${order.id}/acceptances/1`).get()).data()?.acceptedBy,
  ).toBe(customer);
  expect((await db.doc(`orders/${order.id}/quotes/1`).get()).data()).toEqual(
    issued,
  );
});
it("allocates verified provider events once and quarantines mismatched context", async () => {
  const { applyVerifiedPayment } =
    await import("../../functions/src/payments/payos");
  const id = `${prefix}-provider`,
    intentId = `${prefix}-intent`;
  await db.doc(`orders/${id}`).set({
    id,
    ownerId: customer,
    version: 1,
    stage: "ACCEPTED",
    acceptedQuoteVersion: 1,
    collected: 0,
    refunded: 0,
  });
  const orderCode = Math.floor(Date.now() / 10);
  await db.doc(`paymentRequests/${intentId}`).set({
    orderId: id,
    orderCode,
    paymentLinkId: "fixture-link",
    amount: 1000000,
    acceptedQuoteVersion: 1,
    state: "pending",
  });
  const event = {
    orderCode,
    paymentLinkId: "fixture-link",
    amount: 1000000,
    currency: "VND",
    reference: `${prefix}-provider-reference`,
    accountNumber: "fixture-account",
    code: "00",
  };
  await applyVerifiedPayment(event, "fixture-account");
  await applyVerifiedPayment(event, "fixture-account");
  expect((await db.doc(`orders/${id}`).get()).data()?.collected).toBe(1000000);
  await applyVerifiedPayment(
    { ...event, reference: `${prefix}-mismatch`, amount: 999999 },
    "fixture-account",
  );
  expect((await db.doc(`orders/${id}`).get()).data()?.collected).toBe(1000000);
  expect(
    (
      await db
        .collection("paymentExceptions")
        .where("orderCode", "==", orderCode)
        .get()
    ).size,
  ).toBe(1);
});

it("parcel allocation serializes duplicate packing and partial delivery", async () => {
  const { shippingCommand } = await import("../../functions/src/shipping");
  const id = `${prefix}-split-order`;
  await db.doc(`orders/${id}`).set({
    id,
    ownerId: customer,
    items: [{ name: "Fixture", quantity: 2, variant: "" }],
    market: "US",
    notes: "",
    stage: "READY_TO_SHIP",
    version: 1,
    createdAt: Date.now(),
    collected: 100,
    refunded: 0,
    finalTotal: 100,
    finalApproved: true,
    packingComplete: true,
    packedQuantity: 2,
  });
  const pack = async (quantity: number) =>
    shippingCommand.run(
      req(owner, {
        action: "packParcel",
        operationId: randomUUID(),
        orderVersions: { [id]: 1 },
        payload: {
          allocations: [{ orderId: id, line: 0, quantity }],
          weightGrams: 200,
          dimensionsCm: [10, 10, 10],
          warehouse: "fixture-origin",
          route: "US-VN",
          checklist: true,
          evidence: "fixture evidence",
        },
      }),
    );
  const first = await pack(1),
    second = await pack(1);
  await expect(pack(1)).rejects.toMatchObject({ code: "failed-precondition" });
  let orderVersion = 1;
  for (const parcel of [first, second]) {
    await shippingCommand.run(
      req(owner, {
        action: "dispatchParcel",
        operationId: randomUUID(),
        parcelId: parcel.id,
        expectedVersion: 1,
        orderVersions: { [id]: orderVersion },
        payload: {
          carrier: "manual fixture",
          tracking: `fixture-${parcel.id}`,
          handoffEvidence: "fixture only",
        },
      }),
    );
    orderVersion++;
  }
  await expect(
    invoke(
      owner,
      "track",
      { tracking: "bypass", delivered: true },
      id,
      orderVersion,
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await shippingCommand.run(
    req(owner, {
      action: "trackParcel",
      operationId: randomUUID(),
      parcelId: first.id,
      expectedVersion: 2,
      orderVersions: { [id]: orderVersion },
      payload: { state: "delivered", event: "fixture delivery" },
    }),
  );
  expect((await db.doc(`orders/${id}`).get()).data()?.stage).toBe("IN_TRANSIT");
  await shippingCommand.run(
    req(owner, {
      action: "trackParcel",
      operationId: randomUUID(),
      parcelId: second.id,
      expectedVersion: 2,
      orderVersions: { [id]: orderVersion },
      payload: { state: "delivered", event: "fixture delivery" },
    }),
  );
  expect((await db.doc(`orders/${id}`).get()).data()?.stage).toBe("DELIVERED");
});
it("customer-approved cancellation preserves collected money and hides internal proof", async () => {
  const { changeCommand } = await import("../../functions/src/changes");
  let current = await invoke(customer, "submitRequest", payload);
  current = await invoke(owner, "issueQuote", q(), current.id, current.version);
  current = await invoke(
    customer,
    "acceptQuote",
    { quoteVersion: 1 },
    current.id,
    current.version,
  );
  current = await invoke(
    owner,
    "verifyTransfer",
    {
      amount: 1000000,
      bankTransactionId: `${prefix}-change-payment`,
      evidence: "fixture verified",
      reason: "fixture deposit",
    },
    current.id,
    current.version,
  );
  const proposal = {
    kind: "cancellation",
    reason: "Fixture cancellation terms",
    termsVersion: q().termsVersion,
    lines: [{ line: 0, cancelQuantity: 1 }],
    actualCosts: 100000,
    finalPayable: 100000,
    evidence: "private fixture proof",
  };
  const proposed = await changeCommand.run(
    req(owner, {
      action: "propose",
      operationId: randomUUID(),
      orderId: current.id,
      expectedVersion: current.version,
      payload: proposal,
    }),
  );
  expect(
    (await db.doc(`orderChanges/${proposed.id}`).get()).data()?.proposal
      .evidence,
  ).toBeUndefined();
  await expect(
    changeCommand.run(
      req(other, {
        action: "accept",
        operationId: randomUUID(),
        orderId: current.id,
        proposalId: proposed.id,
        expectedVersion: proposed.version,
      }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    changeCommand.run(
      req(owner, {
        action: "apply",
        operationId: randomUUID(),
        orderId: current.id,
        proposalId: proposed.id,
        expectedVersion: proposed.version,
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const accepted = await changeCommand.run(
    req(customer, {
      action: "accept",
      operationId: randomUUID(),
      orderId: current.id,
      proposalId: proposed.id,
      expectedVersion: proposed.version,
    }),
  );
  await changeCommand.run(
    req(owner, {
      action: "apply",
      operationId: randomUUID(),
      orderId: current.id,
      proposalId: proposed.id,
      expectedVersion: accepted.version,
    }),
  );
  const order = (await db.doc(`orders/${current.id}`).get()).data();
  expect(order?.stage).toBe("CANCELLED");
  expect(order?.collected).toBe(1000000);
  expect(order?.refunded).toBe(0);
  expect(order?.finalTotal).toBe(100000);
  expect(order?.deposit).toBe(1000000);
});
it("privileged workspace replay is denied after staff revocation", async () => {
  const editor = `${prefix}-editor`,
    operationId = randomUUID();
  await db
    .doc(`staffAccess/${editor}`)
    .set({ active: true, roles: ["CONTENT_EDITOR"], locked: false });
  const data = {
    action: "saveContent",
    operationId,
    payload: {
      kind: "posts",
      content: {
        title: "Replay security",
        slug: `replay-${randomUUID()}`,
        body: "Only approved editors may publish content.",
        status: "draft",
      },
    },
  };
  await workspace.run(req(editor, data));
  await db.doc(`staffAccess/${editor}`).update({ active: false });
  await expect(workspace.run(req(editor, data))).rejects.toMatchObject({
    code: "permission-denied",
  });
});
it("internal CRM notes are restricted to current staff, including replay", async () => {
  const { readCustomer, saveCustomerNotes } =
    await import("../../functions/src/crm");
  const d = {
    id: customer,
    operationId: randomUUID(),
    tags: ["follow-up"],
    notes: "Private operational note",
    assigneeId: "",
    followUpAt: 0,
  };
  await expect(saveCustomerNotes.run(req(customer, d))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await saveCustomerNotes.run(req(owner, d));
  await expect(
    readCustomer.run(req(customer, { id: customer })),
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(
    (await readCustomer.run(req(owner, { id: customer }))).crm?.notes,
  ).toBe(d.notes);
});
it("consolidation seals complete allocations and blocks held or unpaid members", async () => {
  const { consolidationCommand } =
    await import("../../functions/src/consolidation");
  const ids = [`${prefix}-batch-a`, `${prefix}-batch-b`],
    parcelId = `${prefix}-batch-p`,
    batchId = `${prefix}-batch`;
  for (const id of ids) {
    await db.doc(`orders/${id}`).set({
      id,
      ownerId: customer,
      market: "US",
      items: [{ name: "Item", variant: "", quantity: 1 }],
      notes: "",
      stage: "READY_TO_SHIP",
      version: 1,
      createdAt: 1,
      collected: 100,
      refunded: 0,
      finalTotal: 100,
      finalApproved: true,
      packingComplete: true,
      packedQuantity: 1,
    });
    await db.doc(`packageAllocations/${id}`).set({
      parcelIds: [parcelId],
      allocations: [{ orderId: id, line: 0, quantity: 1 }],
    });
  }
  await db.doc(`packages/${parcelId}`).set({
    id: parcelId,
    version: 1,
    state: "packed",
    allocations: ids.map((orderId) => ({ orderId, line: 0, quantity: 1 })),
    weightGrams: 300,
    warehouse: "origin",
    route: "US-VN",
  });
  const seal = {
    action: "seal",
    operationId: randomUUID(),
    batchId,
    orderVersions: Object.fromEntries(ids.map((id) => [id, 1])),
    parcelVersions: { [parcelId]: 1 },
    payload: {
      parcelIds: [parcelId],
      orderWeights: { [ids[0]]: 100, [ids[1]]: 200 },
      freight: 101,
      hub: "VN",
      service: "Air",
      cutoff: Date.now() + 600000,
    },
  };
  await consolidationCommand.run(req(owner, seal));
  const b = (await db.doc(`consolidationBatches/${batchId}`).get()).data()!;
  expect(
    Object.values(b.shares).reduce((s: number, v) => s + Number(v), 0),
  ).toBe(101);
  for (const id of ids)
    await db.doc(`orders/${id}`).update({
      finalFreightVersion: 1,
      finalApproved: true,
      stage: "READY_TO_SHIP",
    });
  const dispatch = () =>
    consolidationCommand.run(
      req(owner, {
        action: "dispatch",
        operationId: randomUUID(),
        batchId,
        expectedVersion: 1,
        orderVersions: Object.fromEntries(ids.map((id) => [id, 2])),
        parcelVersions: { [parcelId]: 2 },
        payload: {
          carrier: "Manual carrier",
          tracking: "fixture-tracking",
          handoffEvidence: "fixture only proof",
        },
      }),
    );
  await db.doc(`orders/${ids[1]}`).update({ collected: 99 });
  await expect(dispatch()).rejects.toThrow();
  expect((await db.doc(`packages/${parcelId}`).get()).data()?.state).toBe(
    "packed",
  );
  await db
    .doc(`orders/${ids[1]}`)
    .update({ collected: 100, hold: "inspection" });
  await expect(dispatch()).rejects.toThrow();
  await db.doc(`orders/${ids[1]}`).update({ hold: null });
  await dispatch();
  expect((await db.doc(`packages/${parcelId}`).get()).data()?.state).toBe(
    "in_transit",
  );
});
it("scheduled publication, expiry and in-app outbox processing are replay safe", async () => {
  const { maintenance } = await import("../../functions/src/jobs");
  const post = db.doc(`posts/${prefix}-scheduled`),
    member = db.doc(`membershipSubscriptions/${prefix}-expired`),
    job = db.doc(`outboxJobs/${prefix}-notice`);
  await db.doc("settings/email").set({ enabled: false });
  await post.set({
    title: "Scheduled fixture",
    slug: `scheduled-${randomUUID()}`,
    body: "Fixture content only",
    status: "scheduled",
    publishAt: Date.now() - 1000,
    version: 1,
  });
  await member.set({ state: "active", endsAt: Date.now() - 1000 });
  await job.set({
    state: "queued",
    ownerId: customer,
    orderId: `${prefix}-order`,
    action: "quoteOrder",
  });
  await maintenance.run({ scheduleTime: new Date().toISOString() });
  await maintenance.run({ scheduleTime: new Date().toISOString() });
  expect((await post.get()).data()?.version).toBe(2);
  expect((await post.collection("versions").get()).size).toBe(1);
  expect((await member.get()).data()?.state).toBe("expired");
  expect((await member.collection("history").get()).size).toBe(1);
  expect((await job.get()).data()?.emailState).toBe("blocked_external");
  expect(
    (await db.doc(`notifications/${prefix}-notice`).get()).data()?.ownerId,
  ).toBe(customer);
});
it("finance verifies a pending transfer atomically and cannot reuse its bank reference", async () => {
  let o = await invoke(customer, "submitRequest", payload);
  o = await invoke(owner, "issueQuote", q(), o.id, o.version);
  o = await invoke(
    customer,
    "acceptQuote",
    { quoteVersion: 1 },
    o.id,
    o.version,
  );
  const noticeId = randomUUID();
  o = await invoke(
    customer,
    "transferReview",
    { reference: "fixture transfer notice", amount: 1000000 },
    o.id,
    o.version,
    noticeId,
  );
  const reviewId = `${customer}-${noticeId}`,
    bankId = `fixture-${randomUUID()}`;
  await expect(
    invoke(
      owner,
      "verifyTransfer",
      {
        amount: 999999,
        bankTransactionId: bankId,
        evidence: "fixture proof only",
        reason: "fixture check",
        reviewId,
      },
      o.id,
      o.version,
    ),
  ).rejects.toThrow();
  expect(
    (await db.doc(`transferReviews/${reviewId}`).get()).data()?.status,
  ).toBe("pending");
  o = await invoke(
    owner,
    "verifyTransfer",
    {
      amount: 1000000,
      bankTransactionId: bankId,
      evidence: "fixture proof only",
      reason: "fixture check",
      reviewId,
    },
    o.id,
    o.version,
  );
  expect(
    (await db.doc(`transferReviews/${reviewId}`).get()).data()?.status,
  ).toBe("verified");
  await expect(
    invoke(
      owner,
      "verifyTransfer",
      {
        amount: 1000000,
        bankTransactionId: ` ${bankId} `,
        evidence: "fixture proof only",
        reason: "duplicate check",
      },
      o.id,
      o.version,
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
  expect((await db.doc(`orders/${o.id}`).get()).data()?.collected).toBe(
    1000000,
  );
});
it("operational dashboard is staff-only and returns bounded counts without customer records", async () => {
  const { operationalDashboard } = await import("../../functions/src/crm");
  const period = { from: Date.now() - 86400000, until: Date.now() };
  await expect(
    operationalDashboard.run(req(customer, period)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  const result = await operationalDashboard.run(req(owner, period));
  expect(result.limitPerKind).toBe(100);
  expect(result.timezone).toBe("UTC");
  expect(
    Object.values(result.counts).every(
      (v) => Number.isSafeInteger(v) && v >= 0,
    ),
  ).toBe(true);
  expect(JSON.stringify(result)).not.toContain(customer);
  expect(JSON.stringify(result)).not.toContain("Private operational note");
  await expect(
    operationalDashboard.run(req(owner, { from: 1, until: Date.now() })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
});
it("AI context ownership and global quota deny before model invocation", async () => {
  const { ask } = await import("../../functions/src/ai/ask");
  const id = `${prefix}-ai-private`;
  await db.doc(`orders/${id}`).set({ ownerId: customer, stage: "REQUESTED" });
  await db.doc("settings/ai").set({
    enabled: true,
    approved: true,
    model: "gemini-fixture-never-invoked",
  });
  const data = {
    question: "Order status",
    sessionId: randomUUID(),
    language: "en",
    orderId: id,
  };
  await expect(ask.run(req(other, data))).rejects.toMatchObject({
    code: "permission-denied",
  });
  const day = Math.floor(Date.now() / 86400000);
  await db.doc(`aiQuota/global-${day}`).set({ count: 500 });
  await expect(ask.run(req(customer, data))).rejects.toMatchObject({
    code: "resource-exhausted",
  });
  await db.doc("settings/ai").set({ enabled: false, approved: false });
  await expect(ask.run(req(customer, data))).rejects.toMatchObject({
    code: "unavailable",
  });
});
it("technical quota retention requires approval and preserves current counters and financial records", async () => {
  const { maintenance } = await import("../../functions/src/jobs");
  const stale = db.doc(`aiQuota/${prefix}-stale`),
    current = db.doc(`aiQuota/${prefix}-current`);
  await stale.set({ count: 1, expiresAt: Date.now() - 1000 });
  await current.set({ count: 1, expiresAt: Date.now() + 3600000 });
  await db.doc("settings/retention").set({ approved: false });
  const financialCount = (await db.collection("financialEntries").get()).size;
  await maintenance.run({ scheduleTime: new Date().toISOString() });
  expect((await stale.get()).exists).toBe(true);
  await db.doc("settings/retention").set({
    approved: true,
    technicalQuotaRetentionDays: 2,
    policyVersion: "fixture-only",
  });
  await maintenance.run({ scheduleTime: new Date().toISOString() });
  expect((await stale.get()).exists).toBe(false);
  expect((await current.get()).exists).toBe(true);
  expect((await db.collection("financialEntries").get()).size).toBe(
    financialCount,
  );
  await db.doc("settings/retention").delete();
});

it("CRM lists paginate normalized names and schedules; current authority and versions remain enforced", async () => {
  const {
    listCustomers,
    listFollowUps,
    listCrmStaff,
    readCustomer,
    saveCustomerNotes,
  } = await import("../../functions/src/crm");
  const crmPrefix = `${prefix}-crm`,
    support = `${prefix}-support`,
    locked = `${prefix}-locked-crm`;
  await db.doc(`users/${support}`).set({ displayName: "Support fixture" });
  await db
    .doc(`staffAccess/${support}`)
    .set({ active: true, roles: ["SUPPORT"] });
  await db
    .doc(`users/${locked}`)
    .set({ displayName: "Locked support", locked: true });
  await db
    .doc(`staffAccess/${locked}`)
    .set({ active: true, roles: ["SUPPORT"] });
  const batch = db.batch();
  for (let i = 0; i < 35; i++) {
    const id = `${crmPrefix}-${String(i).padStart(2, "0")}`;
    batch.set(db.doc(`users/${id}`), {
      ownerId: id,
      displayName: `Đặng fixture ${i}`,
      searchName: `dang ${crmPrefix} ${i}`,
      businessName: "",
    });
    batch.set(db.doc(`crmCustomers/${id}`), {
      assigneeId: support,
      followUpAt: 1000,
      version: 1,
      tags: ["fixture"],
      notes: "Private fixture",
    });
    batch.set(db.doc(`orders/${id}`), {
      id,
      ownerId: `${crmPrefix}-00`,
      createdAt: 1000,
      stage: "REQUESTED",
      collected: 0,
      refunded: 0,
      items: [{ name: "Fixture order" }],
    });
  }
  await batch.commit();
  const first = await listCustomers.run(
    req(owner, { search: `dang ${crmPrefix}` }),
  );
  const second = await listCustomers.run(
    req(owner, { search: `dang ${crmPrefix}`, after: first.next }),
  );
  expect(first.rows).toHaveLength(30);
  expect(second.rows).toHaveLength(5);
  expect(new Set([...first.rows, ...second.rows].map((r) => r.id)).size).toBe(
    35,
  );
  const appointments = await listFollowUps.run(
    req(owner, { assigneeId: support, asOf: 2000, mode: "overdue" }),
  );
  expect(appointments.rows).toHaveLength(30);
  const next = await listFollowUps.run(
    req(owner, {
      assigneeId: support,
      asOf: 2000,
      mode: "overdue",
      after: appointments.next,
    }),
  );
  expect(next.rows).toHaveLength(5);
  expect(
    (
      await listFollowUps.run(
        req(owner, { assigneeId: support, asOf: 2000, mode: "upcoming" }),
      )
    ).rows,
  ).toHaveLength(0);
  const profile = await readCustomer.run(req(owner, { id: `${crmPrefix}-00` }));
  expect(profile.orders).toHaveLength(30);
  expect(profile.ordersNext).toBeTruthy();
  expect(
    (
      await readCustomer.run(
        req(owner, { id: `${crmPrefix}-00`, ordersAfter: profile.ordersNext! }),
      )
    ).orders,
  ).toHaveLength(5);
  const value = {
    id: `${crmPrefix}-00`,
    operationId: randomUUID(),
    expectedVersion: 1,
    tags: [],
    notes: "Revised note",
    assigneeId: support,
    followUpAt: 1000,
  };
  await saveCustomerNotes.run(req(owner, value));
  expect(
    (await readCustomer.run(req(owner, { id: value.id }))).crm?.followUpAt,
  ).toBe(1000);
  expect(await saveCustomerNotes.run(req(owner, value))).toEqual({
    version: 2,
  });
  await expect(
    saveCustomerNotes.run(req(owner, { ...value, operationId: randomUUID() })),
  ).rejects.toMatchObject({ code: "aborted" });
  await expect(
    saveCustomerNotes.run(
      req(owner, {
        ...value,
        expectedVersion: 2,
        assigneeId: locked,
        operationId: randomUUID(),
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const staff = await listCrmStaff.run(req(owner, {}));
  expect(staff.rows.some((r) => r.id === locked)).toBe(false);
  for (const service of [listCustomers, listFollowUps, listCrmStaff]) {
    await expect(service.run(req(customer, {}))).rejects.toMatchObject({
      code: "permission-denied",
    });
    await expect(
      service.run({ data: {} } as CallableRequest),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  }
  await db.doc(`staffAccess/${support}`).update({ active: false });
  await expect(listCustomers.run(req(support, {}))).rejects.toMatchObject({
    code: "permission-denied",
  });
});

it("warehouse list projection excludes money, and buyer pages cover every assigned ID", async () => {
  const { listWork } = await import("../../functions/src/workspace");
  const warehouse = `${prefix}-warehouse-list`,
    buyer = `${prefix}-buyer-list`;
  await db
    .doc(`staffAccess/${warehouse}`)
    .set({ active: true, roles: ["WAREHOUSE"] });
  const ids = Array.from(
    { length: 35 },
    (_, i) => `${prefix}-assigned-${String(i).padStart(2, "0")}`,
  );
  const batch = db.batch();
  for (const id of ids)
    batch.set(db.doc(`orders/${id}`), {
      id,
      ownerId: customer,
      stage: "REQUESTED",
      items: [],
      collected: 123,
      refunded: 0,
      quote: { goods: 200 },
      version: 1,
    });
  await batch.commit();
  await db
    .doc(`staffAccess/${buyer}`)
    .set({ active: true, roles: ["BUYER"], orderIds: ids });
  const restricted = await listWork.run(
    req(warehouse, { kind: "orders", id: ids[0] }),
  );
  expect(restricted.rows[0]).not.toHaveProperty("collected");
  expect(restricted.rows[0]).not.toHaveProperty("quote");
  const first = await listWork.run(req(buyer, { kind: "orders" }));
  const second = await listWork.run(
    req(buyer, { kind: "orders", after: first.next }),
  );
  expect(first.rows).toHaveLength(30);
  expect(second.rows).toHaveLength(5);
  expect(
    (await listWork.run(req(buyer, { kind: "orders", id: ids[34] }))).rows,
  ).toHaveLength(1);
  await expect(
    listWork.run(req(buyer, { kind: "orders", id: "not-assigned" })),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("physical returns conserve authorized quantities and never refund or release financial hold", async () => {
  const { returnCommand } = await import("../../functions/src/returns");
  const id = `${prefix}-return`,
    warehouse = `${prefix}-return-warehouse`;
  await db
    .doc(`staffAccess/${warehouse}`)
    .set({ active: true, roles: ["WAREHOUSE"] });
  await db.doc(`orders/${id}`).set({
    ownerId: customer,
    version: 8,
    collected: 1000,
    refunded: 0,
    hold: "Chờ đối soát",
  });
  await db.doc(`orderReturns/${id}`).set({
    orderId: id,
    ownerId: customer,
    version: 1,
    state: "authorized",
    lines: [
      {
        line: 0,
        name: "Fixture",
        authorized: 2,
        received: 0,
        accepted: 0,
        damaged: 0,
      },
    ],
  });
  const run = (
    uid: string,
    action: string,
    expectedVersion: number,
    extra = {},
    operationId = randomUUID(),
  ) =>
    returnCommand.run(
      req(uid, {
        id,
        action,
        expectedVersion,
        evidence: "private fixture inspection",
        operationId,
        ...extra,
      }),
    );
  await expect(
    run(customer, "receive", 1, { line: 0, quantity: 1 }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    run(warehouse, "inspect", 1, {
      line: 0,
      quantity: 1,
      condition: "accepted",
    }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const operationId = randomUUID();
  const first = await run(
    warehouse,
    "receive",
    1,
    { line: 0, quantity: 2 },
    operationId,
  );
  expect(
    await run(warehouse, "receive", 1, { line: 0, quantity: 2 }, operationId),
  ).toEqual(first);
  await expect(
    run(warehouse, "receive", 2, { line: 0, quantity: 1 }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(run(owner, "close", 2)).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await run(warehouse, "inspect", 2, {
    line: 0,
    quantity: 1,
    condition: "accepted",
  });
  await expect(
    run(warehouse, "inspect", 2, {
      line: 0,
      quantity: 1,
      condition: "damaged",
    }),
  ).rejects.toMatchObject({ code: "aborted" });
  await run(warehouse, "inspect", 3, {
    line: 0,
    quantity: 1,
    condition: "damaged",
  });
  await expect(run(warehouse, "close", 4)).rejects.toMatchObject({
    code: "permission-denied",
  });
  await run(owner, "close", 4);
  expect((await db.doc(`orderReturns/${id}`).get()).data()?.state).toBe(
    "closed",
  );
  expect((await db.doc(`orders/${id}`).get()).data()).toMatchObject({
    refunded: 0,
    collected: 1000,
    hold: "Chờ đối soát",
    version: 8,
  });
  await db.doc(`staffAccess/${warehouse}`).update({ active: false });
  await expect(
    run(warehouse, "receive", 1, { line: 0, quantity: 2 }, operationId),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("refund reservations serialize concurrent requests and only confirmed bank proof changes net money", async () => {
  const { refundCommand } = await import("../../functions/src/refunds");
  const id = `${prefix}-refund-reserve`;
  await db.doc(`orders/${id}`).set({
    id,
    ownerId: customer,
    version: 1,
    acceptedAt: Date.now(),
    collected: 1000,
    refunded: 0,
    stage: "CANCELLED",
    items: [],
  });
  const request = (amount: number, version: number, op = randomUUID()) =>
    refundCommand.run(
      req(owner, {
        action: "request",
        orderId: id,
        amount,
        expectedVersion: version,
        operationId: op,
        reason: "Fixture refund requested",
      }),
    );
  const results = await Promise.allSettled([request(700, 1), request(700, 1)]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const result = results.find(
    (r) => r.status === "fulfilled",
  ) as PromiseFulfilledResult<{ id: string; version: number }>;
  const reservation = result.value;
  expect((await db.doc(`orders/${id}`).get()).data()).toMatchObject({
    refundReserved: 700,
    refunded: 0,
  });
  await expect(request(400, 2)).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await expect(
    invoke(
      owner,
      "refund",
      {
        amount: 400,
        bankTransactionId: `${prefix}-unreserved`,
        evidence: "Fixture proof",
        reason: "Fixture reason",
      },
      id,
      2,
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const op = randomUUID(),
    body = {
      amount: 700,
      bankTransactionId: `${prefix}-reserved`,
      evidence: "Fixture confirmed bank proof",
      reason: "Fixture reason",
      refundRequestId: reservation.id,
    };
  await invoke(owner, "refund", body, id, 2, op);
  await invoke(owner, "refund", body, id, 2, op);
  expect((await db.doc(`orders/${id}`).get()).data()).toMatchObject({
    refundReserved: 0,
    refunded: 700,
  });
  expect((await db.doc(`refunds/${reservation.id}`).get()).data()?.state).toBe(
    "confirmed",
  );
  const second = await request(300, 3);
  await refundCommand.run(
    req(owner, {
      action: "cancel",
      id: second.id,
      orderId: id,
      expectedVersion: 4,
      operationId: randomUUID(),
      reason: "Fixture cancellation of reservation",
    }),
  );
  expect((await db.doc(`orders/${id}`).get()).data()).toMatchObject({
    refundReserved: 0,
    refunded: 700,
  });
  await expect(
    refundCommand.run(
      req(customer, {
        action: "request",
        orderId: id,
        amount: 1,
        expectedVersion: 5,
        operationId: randomUUID(),
        reason: "Fixture unauthorized",
      }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("manual reversals append history and payment exceptions cannot allocate a duplicate or wrong-beneficiary receipt", async () => {
  const { financeReview } = await import("../../functions/src/finance-review");
  const id = `${prefix}-finance-review`,
    entryId = `${prefix}-credit`,
    exceptionId = `${prefix}-exception`;
  await db.doc(`orders/${id}`).set({
    id,
    ownerId: customer,
    version: 1,
    acceptedAt: Date.now(),
    collected: 1000,
    refunded: 0,
    refundReserved: 200,
    hold: "",
    stage: "READY_TO_SHIP",
  });
  await db.doc(`financialEntries/${entryId}`).set({
    kind: "payment",
    orderId: id,
    amount: 1000,
    currency: "VND",
    createdAt: Date.now(),
  });
  const reverse = {
    action: "reverse",
    orderId: id,
    entryId,
    amount: 600,
    expectedVersion: 1,
    bankTransactionId: `${prefix}-bank-reversal`,
    evidence: "Fixture actual bank reversal proof",
    reason: "Fixture reversal reason",
    operationId: randomUUID(),
  };
  await expect(financeReview.run(req(customer, reverse))).rejects.toMatchObject(
    { code: "permission-denied" },
  );
  await financeReview.run(req(owner, reverse));
  await financeReview.run(req(owner, reverse));
  expect((await db.doc(`orders/${id}`).get()).data()).toMatchObject({
    collected: 400,
    refunded: 0,
    refundReserved: 200,
    stage: "PACKED",
    hold: "Chờ đối soát tiền bị đảo",
  });
  expect(
    (await db.doc(`financialEntries/${entryId}`).get()).data()?.amount,
  ).toBe(1000);
  await expect(
    financeReview.run(
      req(owner, {
        ...reverse,
        amount: 500,
        expectedVersion: 2,
        bankTransactionId: `${prefix}-another-reversal`,
        operationId: randomUUID(),
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await db.doc(`paymentExceptions/${exceptionId}`).set({
    state: "open",
    amount: 100,
    inboundVerified: false,
    bankReferenceHash: createHash("sha256")
      .update(`${prefix}-exception-bank`)
      .digest("hex"),
  });
  const allocate = {
    action: "allocateException",
    id: exceptionId,
    orderId: id,
    expectedVersion: 2,
    evidence: "Fixture operator verification",
    reason: "Fixture context allocation",
    operationId: randomUUID(),
  };
  await expect(financeReview.run(req(owner, allocate))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await db
    .doc(`paymentExceptions/${exceptionId}`)
    .update({ inboundVerified: true });
  await financeReview.run(req(owner, allocate));
  expect((await db.doc(`orders/${id}`).get()).data()?.collected).toBe(500);
  expect(
    (await db.doc(`paymentExceptions/${exceptionId}`).get()).data()?.state,
  ).toBe("allocated");
  const duplicate = `${prefix}-duplicate-exception`;
  await db.doc(`paymentExceptions/${duplicate}`).set({
    state: "open",
    amount: 100,
    inboundVerified: true,
    bankReferenceHash: createHash("sha256")
      .update(`${prefix}-exception-bank`)
      .digest("hex"),
  });
  await expect(
    financeReview.run(
      req(owner, {
        ...allocate,
        id: duplicate,
        expectedVersion: 3,
        operationId: randomUUID(),
      }),
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
  await financeReview.run(
    req(owner, {
      action: "closeException",
      id: duplicate,
      evidence: "Fixture duplicate readback",
      reason: "Duplicate already allocated",
      operationId: randomUUID(),
    }),
  );
  expect((await db.doc(`orders/${id}`).get()).data()?.collected).toBe(500);
});
it("verified Google is required for private CRM commands even when a password account has staff access", async () => {
  const { listCustomers } = await import("../../functions/src/crm");
  const password = req(owner, {});
  password.auth!.token.firebase = {
    ...password.auth!.token.firebase,
    sign_in_provider: "password",
  };
  await expect(listCustomers.run(password)).rejects.toMatchObject({
    code: "permission-denied",
  });
  const unverified = req(owner, {});
  unverified.auth!.token.email_verified = false;
  await expect(listCustomers.run(unverified)).rejects.toMatchObject({
    code: "permission-denied",
  });
});
it("warehouse operations projection exposes packing metadata without purchase money or internal finance notes", async () => {
  const { readOrderOperations } = await import("../../functions/src/workspace");
  const id = `${prefix}-warehouse-projection`,
    uid = `${prefix}-warehouse-meta`;
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, roles: ["WAREHOUSE"] });
  await db.doc(`orders/${id}`).set({ ownerId: customer, version: 1 });
  await db.doc(`orderOperations/${id}`).set({
    receive: {
      quantity: 2,
      condition: "good",
      shelf: "A-1",
      evidence: "Private inspection proof",
    },
    pack: {
      weightGrams: 500,
      dimensionsCm: [10, 20, 30],
      checklist: true,
      evidence: "Private packing proof",
    },
    recordPurchase: {
      quantity: 2,
      supplierOrder: "Fixture shop",
      actualSourceMinor: 9999,
    },
    finalize: { total: 999999 },
    changedAt: Date.now(),
  });
  const result = await readOrderOperations.run(req(uid, { orderId: id }));
  expect(result.receiving).toMatchObject({ quantity: 2, shelf: "A-1" });
  expect(result.packing).toMatchObject({ weightGrams: 500 });
  expect(result.purchase).toBeNull();
  expect(JSON.stringify(result)).not.toContain("9999");
  expect(JSON.stringify(result)).not.toContain("evidence");
  await expect(
    readOrderOperations.run(req(customer, { orderId: id })),
  ).rejects.toMatchObject({ code: "permission-denied" });
});

it("substitution rejects purchased variants before creating proposal or financial changes", async () => {
  const { changeCommand } = await import("../../functions/src/changes");
  const id = `${prefix}-purchased-variant`;
  const original = {
    id, ownerId: customer, market: "US", notes: "", stage: "PURCHASING",
    version: 1, createdAt: 1, acceptedAt: 1, quote: q(),
    collected: 1000000, refunded: 0, purchasedQuantity: 1, purchasedLines: [1, 0],
    items: [
      { name: "Bought item", quantity: 1, variant: "original size" },
      { name: "Unbought item", quantity: 1, variant: "" },
    ],
  };
  await db.doc(`orders/${id}`).set(original);
  const operationId = randomUUID(), proposalId = randomUUID();
  await expect(changeCommand.run(req(owner, {
    action: "propose", operationId, proposalId, orderId: id, expectedVersion: 1,
    payload: {
      kind: "substitution", reason: "Fixture replacement", termsVersion: q().termsVersion,
      finalPayable: 2000000, actualCosts: 1000000, evidence: "Private fixture evidence",
      lines: [
        { line: 0, cancelQuantity: 0, replacementVariant: "changed size" },
        { line: 1, cancelQuantity: 0, replacementName: "Replacement item" },
      ],
    },
  }))).rejects.toMatchObject({ code: "failed-precondition" });
  expect((await db.doc(`orders/${id}`).get()).data()).toEqual(original);
  expect((await db.doc(`orderChanges/${proposalId}`).get()).exists).toBe(false);
  expect((await db.doc(`orderChangeEvidence/${proposalId}`).get()).exists).toBe(false);
  expect((await db.doc(`idempotencyKeys/${owner}-${operationId}`).get()).exists).toBe(false);
});
