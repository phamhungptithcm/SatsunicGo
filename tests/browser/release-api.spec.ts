import { test, expect } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  sourceOrder,
  db,
  customer,
  product,
  freshCustomer,
} from "./fixtures";
import { call, invoke, timedFixtureStep } from "./http";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
type State = { id: string; version: number };

test("MEM-H01 paid membership requires confirmed funds and renews exactly once", async () => {
  const { identity, uid } = await freshCustomer();
  const planId = randomUUID();
  await db.doc(`membershipPlans/${planId}`).set({
    name: "PLUS",
    status: "published",
    price: 100000,
    periodDays: 30,
    serviceDiscountBps: 1000,
    discountCap: 50000,
  });
  const purchase = { action: "purchase", planId, operationId: randomUUID() };
  const invoice = await invoke<{ id: string; state: string }>(
    "membershipCommand",
    purchase,
    identity,
  );
  expect(invoice.state).toBe("pending");
  expect(
    (await db.doc(`membershipSubscriptions/${uid}`).get()).data()?.state,
  ).not.toBe("active");
  const confirmation = {
    action: "confirm",
    invoiceId: invoice.id,
    amount: 100000,
    bankTransactionId: randomUUID(),
    evidence: "Synthetic bank proof; emulator only",
    operationId: randomUUID(),
  };
  expect(
    (await call("membershipCommand", confirmation, identity)).error?.status,
  ).toBe("PERMISSION_DENIED");
  const results = await Promise.all([
    invoke("membershipCommand", confirmation, "finance"),
    invoke("membershipCommand", confirmation, "finance"),
  ]);
  expect(results[0]).toEqual(results[1]);
  const first = (await db.doc(`membershipSubscriptions/${uid}`).get()).data()!;
  expect(first.state).toBe("active");
  expect(first.endsAt - first.startsAt).toBe(30 * 86400000);
  const renewal = await invoke<{ id: string }>(
    "membershipCommand",
    { ...purchase, operationId: randomUUID() },
    identity,
  );
  await invoke(
    "membershipCommand",
    {
      ...confirmation,
      invoiceId: renewal.id,
      bankTransactionId: randomUUID(),
      operationId: randomUUID(),
    },
    "finance",
  );
  const renewed = (
    await db.doc(`membershipSubscriptions/${uid}`).get()
  ).data()!;
  expect(renewed.endsAt - first.endsAt).toBe(30 * 86400000);
  expect(
    (
      await db
        .collection("financialEntries")
        .where("invoiceId", "==", invoice.id)
        .get()
    ).size,
  ).toBe(1);
});

test("CMS-H01 draft publication and archive follow public visibility; customer cannot publish", async () => {
  const slug = `sanity-${randomUUID()}`;
  const content = {
    title: "Synthetic CMS sanity",
    slug,
    body: "Synthetic isolated CMS lifecycle only.",
    status: "draft",
  };
  const create = {
    action: "saveContent",
    operationId: randomUUID(),
    payload: { kind: "posts", content },
  };
  expect(
    (await call("workspaceCommand", create, "customer-a")).error?.status,
  ).toBe("PERMISSION_DENIED");
  let state = await invoke<State>("workspaceCommand", create);
  const read = () =>
    fetch(
      `http://127.0.0.1:5107/demo-satsunicgo/asia-southeast1/publicPage/posts/${slug}`,
    );
  expect((await read()).status).toBe(404);
  const publish = {
    action: "saveContent",
    operationId: randomUUID(),
    id: state.id,
    expectedVersion: state.version,
    payload: { kind: "posts", content: { ...content, status: "published" } },
  };
  state = await invoke<State>("workspaceCommand", publish);
  const publicPage = await read();
  expect(publicPage.status).toBe(200);
  expect(await publicPage.text()).toContain("Synthetic CMS sanity");
  expect(
    (await call("workspaceCommand", { ...publish, operationId: randomUUID() }))
      .error?.status,
  ).toBe("ABORTED");
  await invoke("workspaceCommand", {
    ...publish,
    operationId: randomUUID(),
    expectedVersion: state.version,
    payload: { kind: "posts", content: { ...content, status: "archived" } },
  });
  expect((await read()).status).toBe(404);
});

test("SUP-H01 ticket handoff and consent preserve ownership and audit without external delivery", async () => {
  const ticket = await invoke<State>(
    "workspaceCommand",
    {
      action: "openTicket",
      operationId: randomUUID(),
      payload: {
        subject: "Synthetic help request",
        message: "Synthetic customer needs purchase help",
        topic: "purchase",
      },
    },
    "customer-a",
  );
  const reply = {
    action: "replyTicket",
    id: ticket.id,
    expectedVersion: ticket.version,
    operationId: randomUUID(),
    payload: { message: "Synthetic support response", status: "resolved" },
  };
  expect(
    (await call("workspaceCommand", reply, "customer-b")).error?.status,
  ).toBe("PERMISSION_DENIED");
  await invoke("workspaceCommand", reply, "support");
  expect(
    (await db.doc(`supportTickets/${ticket.id}`).get()).data(),
  ).toMatchObject({ ownerId: customer, status: "resolved" });
  expect(
    (
      await db
        .collection("outboxJobs")
        .where("resourceId", "==", ticket.id)
        .get()
    ).size,
  ).toBe(1);
  const user = await freshCustomer();
  const profile = {
    action: "saveProfile",
    operationId: randomUUID(),
    expectedVersion: 1,
    payload: {
      displayName: "Synthetic consent customer",
      businessName: "",
      marketingConsent: true,
    },
  };
  const saved = await invoke<State>("workspaceCommand", profile, user.identity);
  await invoke(
    "workspaceCommand",
    {
      ...profile,
      operationId: randomUUID(),
      expectedVersion: saved.version,
      payload: { ...profile.payload, marketingConsent: false },
    },
    user.identity,
  );
  expect(
    (await db.doc(`users/${user.uid}`).get()).data()?.marketingConsent,
  ).toBe(false);
  expect(
    (await db.doc(`users/${user.uid}`).collection("consents").get()).size,
  ).toBe(2);
  expect((await db.doc("settings/email").get()).data()?.enabled).toBe(false);
});

test("FLOW-H01 custom HTTP lifecycle preserves two installments and explicit final approval", async () => {
  let state = await invoke<State>(
    "command",
    {
      action: "submitRequest",
      operationId: randomUUID(),
      payload: {
        market: "US",
        items: [
          {
            name: "Synthetic full custom lifecycle",
            quantity: 1,
            variant: "Large",
            url: "",
          },
        ],
        notes: "Synthetic only",
      },
    },
    "customer-a",
  );
  const act = (action: string, payload: unknown, identity = "owner") =>
    invoke<State>(
      "command",
      {
        action,
        payload,
        operationId: randomUUID(),
        orderId: state.id,
        expectedVersion: state.version,
      },
      identity,
    );
  state = await act("issueQuote", {
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
    termsVersion: "synthetic-sanity-v1",
    expiresAt: Date.now() + 3600000,
    verifiedProduct: "Synthetic reviewed product",
  });
  state = await act("acceptQuote", { quoteVersion: 1 }, "customer-a");
  const blocked = await call("command", {
    action: "claimPurchase",
    payload: {},
    operationId: randomUUID(),
    orderId: state.id,
    expectedVersion: state.version,
  });
  expect(blocked.error?.status).toBe("FAILED_PRECONDITION");
  state = await act("verifyTransfer", {
    amount: 1000000,
    bankTransactionId: randomUUID(),
    evidence: "Synthetic first installment proof",
    reason: "Emulator only",
  });
  state = await act("claimPurchase", {});
  state = await act("recordPurchase", {
    quantity: 1,
    supplierOrder: "synthetic-supplier",
    actualSourceMinor: 6800,
    evidence: "Synthetic purchase proof",
  });
  state = await act("receive", {
    quantity: 1,
    condition: "good",
    evidence: "Synthetic received item",
  });
  state = await act("pack", {
    weightGrams: 1000,
    dimensionsCm: [10, 20, 30],
    evidence: "Synthetic packing proof",
    checklist: true,
  });
  state = await act("finalize", {
    total: 2160000,
    reason: "Synthetic approved freight adjustment",
  });
  const packed = (await db.doc(`orders/${state.id}`).get()).data()!;
  expect(packed).toMatchObject({
    collected: 1000000,
    finalTotal: 2160000,
    finalApproved: false,
  });
  const unpaid = await call("command", {
    action: "dispatch",
    payload: {},
    operationId: randomUUID(),
    orderId: state.id,
    expectedVersion: state.version,
  });
  expect(unpaid.error?.status).toBe("FAILED_PRECONDITION");
  state = await act("approveFinal", {}, "customer-a");
  state = await act("verifyTransfer", {
    amount: 1160000,
    bankTransactionId: randomUUID(),
    evidence: "Synthetic balance proof",
    reason: "Emulator only",
  });
  state = await act("dispatch", {});
  state = await act("track", {
    tracking: "SYNTHETIC-CARRIER",
    delivered: true,
  });
  state = await act("confirmReceipt", { received: true }, "customer-a");
  expect(
    (
      await timedFixtureStep("custom-final-read", () =>
        db.doc(`orders/${state.id}`).get(),
      )
    ).data(),
  ).toMatchObject({
    stage: "COMPLETED",
    finalTotal: 2160000,
    collected: 2160000,
    refunded: 0,
  });
  const entries = await timedFixtureStep("custom-ledger-read", () =>
    db
      .collection("financialEntries")
      .where("orderId", "==", state.id)
      .where("kind", "==", "payment")
      .get(),
  );
  expect(entries.size).toBe(2);
});

test("FLOW-H02 catalog HTTP lifecycle collects once and rejects quote and freight surcharge", async () => {
  const p = await product();
  let state = await invoke<State>(
    "catalogCheckout",
    {
      productId: p.id,
      productVersion: 1,
      quantity: 2,
      variant: "Large",
      operationId: randomUUID(),
    },
    "customer-a",
  );
  const act = (action: string, payload: unknown, identity = "owner") =>
    invoke<State>(
      "command",
      {
        action,
        payload,
        operationId: randomUUID(),
        orderId: state.id,
        expectedVersion: state.version,
      },
      identity,
    );
  for (const action of ["claimPurchase", "acceptQuote", "approveFinal"]) {
    const result = await call(
      "command",
      {
        action,
        operationId: randomUUID(),
        orderId: state.id,
        expectedVersion: state.version,
        payload: action === "acceptQuote" ? { quoteVersion: 1 } : {},
      },
      action === "claimPurchase" ? "owner" : "customer-a",
    );
    expect(result.error?.status).toBe("FAILED_PRECONDITION");
  }
  state = await act("verifyTransfer", {
    amount: 240000,
    bankTransactionId: randomUUID(),
    evidence: "Synthetic full catalog payment proof",
    reason: "Emulator only",
  });
  state = await act("claimPurchase", {});
  state = await act("recordPurchase", {
    quantity: 2,
    supplierOrder: "synthetic-catalog-supplier",
    actualSourceMinor: 1000,
    evidence: "Synthetic receipt",
  });
  state = await act("receive", {
    quantity: 2,
    condition: "good",
    evidence: "Synthetic receive",
  });
  state = await act("pack", {
    weightGrams: 1000,
    dimensionsCm: [10, 20, 30],
    evidence: "Synthetic packed",
    checklist: true,
  });
  expect(
    (
      await call("command", {
        action: "finalize",
        operationId: randomUUID(),
        orderId: state.id,
        expectedVersion: state.version,
        payload: { total: 240001, reason: "Synthetic forbidden surcharge" },
      })
    ).error?.status,
  ).toBe("FAILED_PRECONDITION");
  state = await act("dispatch", {});
  state = await act("track", {
    tracking: "SYNTHETIC-CATALOG",
    delivered: true,
  });
  state = await act("confirmReceipt", { received: true }, "customer-a");
  expect(
    (
      await timedFixtureStep("catalog-final-read", () =>
        db.doc(`orders/${state.id}`).get(),
      )
    ).data(),
  ).toMatchObject({
    stage: "COMPLETED",
    finalTotal: 240000,
    collected: 240000,
  });
  const entries = await timedFixtureStep("catalog-ledger-read", () =>
    db
      .collection("financialEntries")
      .where("orderId", "==", state.id)
      .where("kind", "==", "payment")
      .get(),
  );
  expect(entries.size).toBe(1);
});

test("AUTH-B01 anonymous forged cross-owner revoked locked and support writes fail through actual HTTP", async () => {
  const id = await sourceOrder();
  const create = {
    action: "createDraft",
    orderId: id,
    operationId: randomUUID(),
  };
  for (const identity of [
    null,
    "customer-a",
    "customer-b",
    "support",
    "revoked",
    "locked",
  ]) {
    expect((await call("invoiceCommand", create, identity)).error?.status).toBe(
      identity === null ? "UNAUTHENTICATED" : "PERMISSION_DENIED",
    );
  }
  expect(
    (await call("invoiceCommand", create, "owner", true)).error?.status,
  ).toBe("UNAUTHENTICATED");
  const draft = await invoke<State>("invoiceCommand", create);
  expect(
    (await call("invoiceDetail", { id: draft.id }, "customer-a")).error?.status,
  ).toBe("PERMISSION_DENIED");
  const issued = await invoke<State>("invoiceCommand", {
    action: "issue",
    id: draft.id,
    expectedVersion: draft.version,
    operationId: randomUUID(),
  });
  expect(
    (await call("invoiceDetail", { id: issued.id }, "customer-b")).error
      ?.status,
  ).toBe("PERMISSION_DENIED");
  expect(
    (
      await invoke<{ ownerId: string }>(
        "invoiceDetail",
        { id: issued.id },
        "customer-a",
      )
    ).ownerId,
  ).toBe(customer);
  expect(
    (await call("readOrderOperations", { orderId: id }, "customer-b")).error
      ?.status,
  ).toBe("PERMISSION_DENIED");
  expect(
    (await call("readCustomer", { id: customer }, "customer-a")).error?.status,
  ).toBe("PERMISSION_DENIED");
});

test("DOC-H01 concurrent issue frozen statement share revoke void replacement and email-disabled preserve money", async () => {
  const orderId = await sourceOrder();
  const before = (await db.doc(`orders/${orderId}`).get()).data();
  const draft = await invoke<State>("invoiceCommand", {
    action: "createDraft",
    orderId,
    operationId: randomUUID(),
  });
  const data = {
    action: "issue",
    id: draft.id,
    expectedVersion: draft.version,
    operationId: randomUUID(),
  };
  const [issued, replay] = await Promise.all([
    invoke<State>("invoiceCommand", data),
    invoke<State>("invoiceCommand", data),
  ]);
  expect(issued).toEqual(replay);
  let state = issued;
  const shared = await invoke<State & { token: string }>("invoiceCommand", {
    action: "createShare",
    id: state.id,
    expectedVersion: state.version,
    operationId: randomUUID(),
  });
  state = shared;
  const publicView = await invoke("invoiceShare", { token: shared.token });
  for (const field of [
    "ownerId",
    "buyerName",
    "sourceOrderId",
    "recipient",
    "id",
  ])
    expect(publicView).not.toHaveProperty(field);
  const op = {
    action: "queueEmail",
    id: state.id,
    expectedVersion: state.version,
    operationId: randomUUID(),
  };
  expect((await call("invoiceCommand", op)).error?.status).toBe(
    "FAILED_PRECONDITION",
  );
  expect(
    (await db.doc(`outboxJobs/invoice-${op.operationId}`).get()).exists,
  ).toBeFalsy();
  state = await invoke<State>("invoiceCommand", {
    action: "revokeShare",
    id: state.id,
    expectedVersion: state.version,
    operationId: randomUUID(),
  });
  expect(
    (await call("invoiceShare", { token: shared.token })).error?.status,
  ).toBe("NOT_FOUND");
  state = await invoke<State>("invoiceCommand", {
    action: "void",
    id: state.id,
    expectedVersion: state.version,
    reason: "Synthetic replacement correction",
    operationId: randomUUID(),
  });
  const replacement = await invoke<State>("invoiceCommand", {
    action: "createDraft",
    orderId,
    replacesId: state.id,
    operationId: randomUUID(),
  });
  expect(
    (await db.doc(`salesDocuments/${replacement.id}`).get()).data()?.replacesId,
  ).toBe(state.id);
  expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(before);
  expect(
    (
      await db
        .collection("financialEntries")
        .where("orderId", "==", orderId)
        .get()
    ).size,
  ).toBe(0);
  expect((await db.doc(`salesDocuments/${state.id}`).get()).data()?.state).toBe(
    "void",
  );
});

test("DOC-B01 expiry and source version conflict refuse share and issue", async () => {
  const orderId = await sourceOrder();
  let d = await invoke<State>("invoiceCommand", {
    action: "createDraft",
    orderId,
    operationId: randomUUID(),
  });
  await db.doc(`orders/${orderId}`).update({ version: 2 });
  expect(
    (
      await call("invoiceCommand", {
        action: "issue",
        id: d.id,
        expectedVersion: d.version,
        operationId: randomUUID(),
      })
    ).error?.status,
  ).toBe("ABORTED");
  d = await invoke<State>("invoiceCommand", {
    action: "refreshDraft",
    id: d.id,
    expectedVersion: d.version,
    operationId: randomUUID(),
  });
  d = await invoke<State>("invoiceCommand", {
    action: "issue",
    id: d.id,
    expectedVersion: d.version,
    operationId: randomUUID(),
  });
  const shared = await invoke<State & { token: string }>("invoiceCommand", {
    action: "createShare",
    id: d.id,
    expectedVersion: d.version,
    operationId: randomUUID(),
  });
  await db
    .doc(
      `salesDocumentShares/${createHash("sha256").update(shared.token).digest("hex")}`,
    )
    .update({ expiresAt: Date.now() - 1 });
  expect(
    (await call("invoiceShare", { token: shared.token })).error?.status,
  ).toBe("NOT_FOUND");
});
