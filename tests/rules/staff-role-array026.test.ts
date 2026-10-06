import { getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>;
let command: typeof import("../../functions/src/index"),
  workspace: typeof import("../../functions/src/workspace"),
  refunds: typeof import("../../functions/src/refunds"),
  invoices: typeof import("../../functions/src/invoices"),
  membership: typeof import("../../functions/src/membership"),
  returns: typeof import("../../functions/src/returns"),
  shipping: typeof import("../../functions/src/shipping"),
  consolidation: typeof import("../../functions/src/consolidation"),
  media: typeof import("../../functions/src/media"),
  orderMedia: typeof import("../../functions/src/order-media"),
  finance: typeof import("../../functions/src/finance-review"),
  outbox: typeof import("../../functions/src/outbox-command"),
  changes: typeof import("../../functions/src/changes"),
  history: typeof import("../../functions/src/order-history");
const prefix = `roles026-${randomUUID()}`,
  uid = `${prefix}-staff`,
  owner = `${prefix}-customer`,
  orderId = `${prefix}-order`,
  claimId = `${prefix}-claim`,
  returnId = `${prefix}-return`,
  parcelId = `${prefix}-parcel`,
  planId = `${prefix}-plan`,
  documentId = `${prefix}-document`,
  exceptionId = `${prefix}-exception`,
  jobId = `${prefix}-job`,
  ticketId = `${prefix}-ticket`;
const order = {
  id: orderId,
  ownerId: owner,
  version: 1,
  acceptedAt: 1,
  market: "JP",
  stage: "IN_TRANSIT",
  quote: { termsVersion: "synthetic-v1" },
  items: [{ name: "Synthetic item", quantity: 2 }],
  collected: 100,
  refunded: 0,
  refundReserved: 0,
};
const claim = {
  ...order,
  id: claimId,
  purchaseKind: "catalog",
  stage: "QUOTE_ACCEPTED",
  catalogSnapshot: { total: 100 },
  finalTotal: 100,
  createdAt: 1,
};
const parcel = {
  id: parcelId,
  version: 1,
  state: "in_transit",
  allocations: [{ orderId, line: 0, quantity: 1 }],
  route: "Synthetic route",
  warehouse: "Synthetic warehouse",
};
const returned = {
  orderId,
  state: "inspecting",
  version: 1,
  lines: [{ line: 0, authorized: 1, received: 1, accepted: 1, damaged: 0 }],
};
const seller = {
  name: "Synthetic seller",
  address: "Synthetic address",
  contact: "Synthetic contact",
};
const boundaries = [
  "refund",
  "invoiceCommand",
  "workspaceCommand",
  "membership",
  "return",
  "shipping",
  "consolidation",
  "media",
  "orderMedia",
  "finance",
  "outbox",
  "changes",
  "history",
  "command",
  "listWork",
  "ownerConfig",
  "staffRead",
  "orderOperations",
  "ticketMessages",
  "invoiceList",
  "invoiceDetail",
] as const;
type Boundary = (typeof boundaries)[number];
function req(data: unknown, actor = uid) {
  return {
    auth: {
      uid: actor,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
function input(b: Boundary, operationId: string) {
  if (b === "refund")
    return {
      action: "request",
      id: randomUUID(),
      orderId,
      expectedVersion: 1,
      operationId,
      amount: 10,
      reason: "Synthetic refund",
    };
  if (b === "invoiceCommand")
    return { action: "configure", operationId, expectedVersion: 1, seller };
  if (b === "workspaceCommand")
    return {
      action: "replyTicket",
      id: ticketId,
      expectedVersion: 1,
      operationId,
      payload: { message: "Synthetic reply", status: "open" },
    };
  if (b === "membership")
    return {
      action: "grant",
      operationId,
      planId,
      ownerId: owner,
      reason: "Synthetic grant",
    };
  if (b === "return")
    return {
      action: "close",
      id: returnId,
      expectedVersion: 1,
      operationId,
      evidence: "Synthetic inspection",
    };
  if (b === "shipping")
    return {
      action: "trackParcel",
      operationId,
      parcelId,
      expectedVersion: 1,
      orderVersions: { [orderId]: 1 },
      payload: { state: "in_transit", event: "Synthetic event" },
    };
  if (b === "consolidation")
    return {
      action: "seal",
      batchId: randomUUID(),
      operationId,
      orderVersions: {},
      parcelVersions: {},
      payload: {},
    };
  if (b === "media")
    return {
      mime: "image/png",
      base64: "AA==",
      alt: "Synthetic image",
      rightsConfirmed: true,
    };
  if (b === "orderMedia" || b === "history" || b === "orderOperations")
    return { orderId };
  if (b === "finance")
    return {
      action: "closeException",
      id: exceptionId,
      evidence: "Synthetic evidence",
      reason: "Synthetic review",
      operationId,
    };
  if (b === "outbox")
    return {
      action: "resolveUnknown",
      id: jobId,
      expectedVersion: 1,
      operationId,
      outcome: "confirmed_not_sent",
      evidence: "Synthetic readback",
    };
  if (b === "changes")
    return {
      action: "propose",
      orderId,
      proposalId: randomUUID(),
      expectedVersion: 1,
      operationId,
      payload: {
        kind: "return",
        reason: "Synthetic return",
        termsVersion: "synthetic-v1",
        lines: [{ line: 0, cancelQuantity: 1 }],
        finalPayable: 100,
        actualCosts: 0,
        evidence: "Synthetic evidence",
      },
    };
  if (b === "command")
    return {
      action: "claimPurchase",
      orderId: claimId,
      expectedVersion: 1,
      operationId,
      payload: {},
    };
  if (b === "listWork") return { kind: "orderChanges" };
  if (b === "staffRead") return { id: owner };
  if (b === "ticketMessages") return { id: ticketId };
  if (b === "invoiceDetail") return { id: documentId };
  return {};
}
async function invoke(b: Boundary, data: unknown, actor = uid) {
  const r = req(data, actor);
  switch (b) {
    case "refund":
      return refunds.refundCommand.run(r);
    case "invoiceCommand":
      return invoices.invoiceCommand.run(r);
    case "workspaceCommand":
      return workspace.workspaceCommand.run(r);
    case "membership":
      return membership.membershipCommand.run(r);
    case "return":
      return returns.returnCommand.run(r);
    case "shipping":
      return shipping.shippingCommand.run(r);
    case "consolidation":
      return consolidation.consolidationCommand.run(r);
    case "media":
      return media.uploadContentImage.run(r);
    case "orderMedia":
      return orderMedia.listOrderImages.run(r);
    case "finance":
      return finance.financeReview.run(r);
    case "outbox":
      return outbox.outboxCommand.run(r);
    case "changes":
      return changes.changeCommand.run(r);
    case "history":
      return history.orderHistory.run(r);
    case "command":
      return command.command.run(r);
    case "listWork":
      return workspace.listWork.run(r);
    case "ownerConfig":
      return workspace.readOwnerConfiguration.run(r);
    case "staffRead":
      return workspace.readStaffAccess.run(r);
    case "orderOperations":
      return workspace.readOrderOperations.run(r);
    case "ticketMessages":
      return workspace.ticketMessages.run(r);
    case "invoiceList":
      return invoices.invoiceList.run(r);
    case "invoiceDetail":
      return invoices.invoiceDetail.run(r);
  }
}
beforeAll(async () => {
  const previousProject = process.env.GCLOUD_PROJECT;
  process.env.GCLOUD_PROJECT = `demo-satsunicgo-roles-${randomUUID().slice(0, 8)}`;
  try {
    command = await import("../../functions/src/index");
  } finally {
    if (previousProject === undefined) delete process.env.GCLOUD_PROJECT;
    else process.env.GCLOUD_PROJECT = previousProject;
  }
  db = getFirestore();
  workspace = await import("../../functions/src/workspace");
  refunds = await import("../../functions/src/refunds");
  invoices = await import("../../functions/src/invoices");
  membership = await import("../../functions/src/membership");
  returns = await import("../../functions/src/returns");
  shipping = await import("../../functions/src/shipping");
  consolidation = await import("../../functions/src/consolidation");
  media = await import("../../functions/src/media");
  orderMedia = await import("../../functions/src/order-media");
  finance = await import("../../functions/src/finance-review");
  outbox = await import("../../functions/src/outbox-command");
  changes = await import("../../functions/src/changes");
  history = await import("../../functions/src/order-history");
});
beforeEach(async () => {
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db.doc(`users/${owner}`).set({ locked: false }),
    db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] }),
    db.doc(`orders/${orderId}`).set(order),
    db.doc(`orders/${claimId}`).set(claim),
    db.doc(`orderOperations/${claimId}`).delete(),
    db.doc(`orderReturns/${returnId}`).set(returned),
    db.doc(`packages/${parcelId}`).set(parcel),
    db
      .doc(`packageAllocations/${orderId}`)
      .set({ allocations: parcel.allocations, parcelIds: [parcelId] }),
    db.doc(`membershipPlans/${planId}`).set({
      status: "published",
      name: "Synthetic plan",
      price: 100,
      periodDays: 30,
    }),
    db.doc(`membershipSubscriptions/${owner}`).delete(),
    db.doc("settings/invoiceSeller").set({ version: 1, seller }),
    db.doc(`salesDocuments/${documentId}`).set({
      id: documentId,
      ownerId: owner,
      state: "issued",
      version: 1,
      total: 100,
      sourceOrderId: orderId,
    }),
    db
      .doc(`paymentExceptions/${exceptionId}`)
      .set({ state: "open", amount: 100 }),
    db.doc(`outboxJobs/${jobId}`).set({
      ownerId: owner,
      version: 1,
      emailState: "unknown",
      reconciliationRequired: true,
    }),
    db
      .doc(`supportTickets/${ticketId}`)
      .set({ ownerId: owner, version: 1, status: "open" }),
  ]);
});
// Snapshot only persistence paths touched by the selected operation branches.
const collections = [
  "refunds",
  "orderChangeEvidence",
  "customerShipments",
  "idempotencyKeys",
  "consolidationBatches",
  `supportTickets/${ticketId}/messages`,
  `packages/${parcelId}/events`,
  `orderReturns/${returnId}/evidence`,
  `orders/${orderId}/timeline`,
  `orders/${claimId}/timeline`,
  "orders",
  "orderReturns",
  "packages",
  "salesDocuments",
  "membershipSubscriptions",
  "paymentExceptions",
  "outboxJobs",
  "orderChanges",
  "orderOperations",
  "financialEntries",
  "auditEvents",
  "contentMedia",
  "orderMedia",
  "membershipHistory",
  "settings",
  "supportTickets",
];
async function snapshot() {
  return Promise.all(
    collections.map(async (c) =>
      (await db.collection(c).get()).docs
        .map((d) => ({ id: d.id, data: d.data() }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    ),
  );
}
const malformed = [
  { label: "object", roles: ["OWNER", {}] },
  { label: "null", roles: ["OWNER", null] },
  { label: "number", roles: ["OWNER", 1] },
];
for (const b of boundaries) {
  it.each(malformed)(
    `ROLE026 ${b} denies mixed $label staff authority without effects`,
    async ({ roles }) => {
      await db.doc(`staffAccess/${uid}`).set({ active: true, roles });
      const operationId = randomUUID(),
        data = input(b, operationId),
        before = await snapshot();
      if (b === "invoiceList") {
        const result = await invoices.invoiceList.run(req(data));
        expect(result.rows).toEqual([]);
        expect(result.canIssue).toBe(false);
        expect(result.canConfigure).toBe(false);
        expect(result.seller).toBeNull();
      } else
        await expect(invoke(b, data)).rejects.toMatchObject({
          code: "permission-denied",
        });
      expect(await snapshot()).toEqual(before);
      expect(
        (await db.doc(`idempotencyKeys/${uid}-${operationId}`).get()).exists,
      ).toBe(false);
    },
  );
  it(`ROLE026 ${b} valid future string union preserves native authority boundary`, async () => {
    await db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, roles: ["OWNER", "FUTURE_ROLE"] });
    const data = input(b, randomUUID());
    if (b === "media") {
      await expect(invoke(b, data)).rejects.toMatchObject({
        code: "invalid-argument",
      });
      return;
    }
    if (b === "consolidation") {
      await expect(invoke(b, data)).rejects.toMatchObject({
        code: "failed-precondition",
      });
      return;
    }
    const result = await invoke(b, data);
    expect(result).toBeDefined();
    if (
      [
        "refund",
        "invoiceCommand",
        "workspaceCommand",
        "membership",
        "return",
        "shipping",
        "finance",
        "outbox",
        "changes",
        "command",
      ].includes(b)
    )
      expect(await invoke(b, data)).toEqual(result);
  });
}
it.each(malformed)(
  "ROLE026 completed refund replay denies current mixed $label actor without extra effects",
  async ({ roles }) => {
    const data = input("refund", randomUUID()),
      result = await invoke("refund", data);
    expect(await invoke("refund", data)).toEqual(result);
    await db.doc(`staffAccess/${uid}`).set({ active: true, roles });
    const before = await snapshot();
    await expect(invoke("refund", data)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(await snapshot()).toEqual(before);
  },
);
it.each([
  "history",
  "orderMedia",
  "ticketMessages",
  "invoiceDetail",
  "invoiceList",
] as const)(
  "ROLE026 customer ownership survives mixed staff metadata for %s",
  async (b) => {
    await db
      .doc(`staffAccess/${owner}`)
      .set({ active: true, roles: ["OWNER", null] });
    const result = await invoke(b, input(b, randomUUID()), owner);
    expect(result).toBeDefined();
    if (b === "invoiceList")
      expect(
        (
          result as Awaited<ReturnType<typeof invoices.invoiceList.run>>
        ).rows.map((r) => r.id),
      ).toContain(documentId);
  },
);
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});
