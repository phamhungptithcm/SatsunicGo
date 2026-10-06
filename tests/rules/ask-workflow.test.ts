import { beforeAll, afterAll, expect, test } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
let workflow: typeof import("../../functions/src/ai/ask-workflow").askWorkflow;
let current: typeof import("../../functions/src/ai/ask-workflow").currentAskConversation;
let db: ReturnType<typeof getFirestore>, env: RulesTestEnvironment;
const uid = `ask-${randomUUID()}`,
  cid = randomUUID();
function req(user: string, data: unknown) {
  return {
    auth: {
      uid: user,
      token: {
        uid: user,
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
function input(action: string, payload: unknown, version: number, extra = {}) {
  return {
    conversationId: cid,
    operationId: randomUUID(),
    expectedVersion: version,
    action,
    payload,
    ...extra,
  };
}
const draft = {
  market: "US",
  items: [{ name: "Fixture shoes", quantity: 1, variant: "42", url: "" }],
  notes: "fixture only",
};
beforeAll(async () => {
  ({ askWorkflow: workflow, currentAskConversation: current } =
    await import("../../functions/src/index"));
  db = getFirestore();
  env = await initializeTestEnvironment({
    projectId: "demo-satsunicgo",
    firestore: {
      host: "127.0.0.1",
      port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(":")[1] ?? 8181),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
afterAll(async () => {
  await env?.cleanup();
  await db?.terminate();
});
test("authenticated draft starts without turns; conversation resumes by server pointer; saveTurn redacts", async () => {
  const data = input("saveDraft", draft, 0);
  const first = await workflow.run(req(uid, data));
  expect(first.version).toBe(1);
  expect(await workflow.run(req(uid, data))).toEqual(first);
  expect((await current.run(req(uid, {}))).conversationId).toBe(cid);
  await expect(
    workflow.run(
      req(uid, { ...data, payload: { ...draft, notes: "changed" } }),
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
  const answer = {
    language: "vi",
    title: "Fixture",
    paragraphs: ["Review details"],
    bullets: [],
    sourceIds: [],
    action: "request",
  };
  await workflow.run(
    req(
      uid,
      input(
        "saveTurn",
        { id: randomUUID(), question: "email fixture@example.com", answer },
        1,
      ),
    ),
  );
  const c = (await db.doc(`askConversations/${uid}-${cid}`).get()).data()!;
  expect(c.turns[0].question).not.toContain("fixture@example.com");
  expect(c.version).toBe(2);
});
test("duplicate/concurrent submission creates exactly one order and rejects unsupported or anonymous actions", async () => {
  const data = input("submitRequest", draft, 2);
  const [a, b] = await Promise.all([
    workflow.run(req(uid, data)),
    workflow.run(req(uid, data)),
  ]);
  expect(a).toEqual(b);
  const c = (await db.doc(`askConversations/${uid}-${cid}`).get()).data()!;
  expect(c.orderId).toBe(a.id);
  expect(c.pendingOperation).toBeNull();
  const orders = await db
    .collection("orders")
    .where("ownerId", "==", uid)
    .get();
  expect(orders.size).toBe(1);
  await expect(
    workflow.run(req(uid, input("submitRequest", draft, c.version))),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    workflow.run(req(uid, input("verifyTransfer", {}, c.version))),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(workflow.run({ data } as CallableRequest)).rejects.toMatchObject(
    { code: "unauthenticated" },
  );
});
test("recipient gates quote acceptance, is separate from model context, and stale quote is denied", async () => {
  const ref = db.doc(`askConversations/${uid}-${cid}`),
    c = (await ref.get()).data()!;
  await db.doc(`orders/${c.orderId}`).update({
    stage: "QUOTED",
    quoteVersion: 1,
    version: 2,
    quote: {
      goods: 1000,
      service: 100,
      sourceCosts: 0,
      internationalShipping: 200,
      destinationShipping: 0,
      discount: 0,
      sourceCurrency: "USD",
      sourceMinor: 4,
      fxNumerator: 250,
      fxDenominator: 1,
      termsVersion: "fixture",
      expiresAt: Date.now() + 60000,
      verifiedProduct: "Fixture shoes size 42",
    },
  });
  await expect(
    workflow.run(
      req(
        uid,
        input("acceptQuote", { quoteVersion: 1 }, c.version, {
          expectedOrderVersion: 2,
        }),
      ),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await workflow.run(
    req(
      uid,
      input(
        "saveRecipient",
        {
          recipient: "Fixture recipient",
          phone: "0123456789",
          address: "123 Fixture Street, Fixture City",
        },
        c.version,
        { expectedOrderVersion: 2 },
      ),
    ),
  );
  const fresh = (await ref.get()).data()!;
  expect(JSON.stringify(fresh)).not.toContain("Fixture Street");
  expect(
    (await db.doc(`orderOperations/${c.orderId}`).get()).data()?.recipient
      .address,
  ).toContain("Fixture Street");
  await expect(
    workflow.run(
      req(
        uid,
        input("acceptQuote", { quoteVersion: 99 }, fresh.version, {
          expectedOrderVersion: 2,
        }),
      ),
    ),
  ).rejects.toBeDefined();
  const afterFailure = (await ref.get()).data()!;
  await workflow.run(
    req(
      uid,
      input("acceptQuote", { quoteVersion: 1 }, afterFailure.version, {
        expectedOrderVersion: 2,
      }),
    ),
  );
  expect((await db.doc(`orders/${c.orderId}`).get()).data()?.stage).toBe(
    "QUOTE_ACCEPTED",
  );
  const accepted = (await ref.get()).data()!;
  await expect(
    workflow.run(
      req(
        uid,
        input(
          "saveRecipient",
          {
            recipient: "Other",
            phone: "0123456789",
            address: "Another Fixture Street",
          },
          accepted.version,
          { expectedOrderVersion: 3 },
        ),
      ),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
test("resume recovers a committed order after lost workflow finalization with no duplicate", async () => {
  const otherCid = randomUUID(),
    data = { ...input("submitRequest", draft, 0), conversationId: otherCid };
  const result = await workflow.run(req(uid, data));
  const ref = db.doc(`askConversations/${uid}-${otherCid}`),
    op = ref.collection("operations").doc(data.operationId);
  await ref.update({
    orderId: null,
    pendingOperation: data.operationId,
    version: 1,
  });
  await op.set({
    hash: createHash("sha256").update(JSON.stringify(data)).digest("hex"),
    state: "pending",
    request: data,
  });
  const recovered = await workflow.run(
    req(uid, {
      ...data,
      action: "resume",
      payload: {},
      operationId: randomUUID(),
    }),
  );
  expect(recovered.id).toBe(result.id);
  expect((await ref.get()).data()?.pendingOperation).toBeNull();
});
test("resume retrieves a completed operation after its response was lost", async () => {
  const data = {
    ...input("submitRequest", draft, 0),
    conversationId: randomUUID(),
  };
  const created = await workflow.run(req(uid, data));
  const recovered = await workflow.run(
    req(uid, {
      ...data,
      operationId: randomUUID(),
      action: "resume",
      payload: { operationId: data.operationId },
    }),
  );
  expect(recovered).toEqual(created);
  const unknown = await workflow.run(
    req(uid, {
      ...data,
      operationId: randomUUID(),
      action: "resume",
      payload: { operationId: randomUUID() },
    }),
  );
  expect(unknown.outcome).toBe("no_operation");
  await db.doc(`users/${uid}`).set({ locked: true }, { merge: true });
  try {
    await expect(
      workflow.run(req(uid, { ...data, action: "resume", payload: {} })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  } finally {
    await db.doc(`users/${uid}`).set({ locked: false }, { merge: true });
  }
});
test("server guards locked user and Firestore denies cross-user conversations, operations and recipient writes", async () => {
  const c = (await db.doc(`askConversations/${uid}-${cid}`).get()).data()!;
  const owner = env
    .authenticatedContext(uid, {
      email_verified: true,
      firebase: { sign_in_provider: "google.com" },
    })
    .firestore();
  const other = env
    .authenticatedContext(`${uid}-other`, {
      email_verified: true,
      firebase: { sign_in_provider: "google.com" },
    })
    .firestore();
  await assertSucceeds(getDoc(doc(owner, "askConversations", `${uid}-${cid}`)));
  await assertFails(getDoc(doc(other, "askConversations", `${uid}-${cid}`)));
  await assertFails(getDoc(doc(other, "orderRecipients", c.orderId)));
  await assertFails(
    setDoc(doc(owner, "askConversations", `${uid}-${cid}`), { ownerId: uid }),
  );
  await assertFails(
    getDoc(
      doc(
        owner,
        "askConversations",
        `${uid}-${cid}`,
        "operations",
        randomUUID(),
      ),
    ),
  );
  await db.doc(`users/${uid}`).set({ ownerId: uid, locked: true });
  await expect(current.run(req(uid, {}))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await assertFails(getDoc(doc(owner, "askConversations", `${uid}-${cid}`)));
});

test("server commerce rollout remains closed outside the dedicated demo exemption", async () => {
  const old = process.env.FUNCTIONS_EMULATOR;
  process.env.FUNCTIONS_EMULATOR = "false";
  try {
    await expect(current.run(req(`${uid}-new`, {}))).rejects.toMatchObject({
      code: "unavailable",
    });
    await expect(
      workflow.run(req(`${uid}-new`, input("saveDraft", draft, 0))),
    ).rejects.toMatchObject({ code: "unavailable" });
  } finally {
    process.env.FUNCTIONS_EMULATOR = old;
  }
});

test("catalog checkout in chat reuses frozen full-payment order and permits private recipient before payment", async () => {
  const catalogUid = `${uid}-catalog`,
    conversationId = randomUUID(),
    productId = `ask-catalog-${randomUUID()}`;
  await db.doc(`products/${productId}`).set({
    title: "Synthetic listed product",
    slug: productId,
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 200000,
    termsVersion: "fixture-v1",
    catalogOptions: ["Red"],
  });
  const mutation = {
    conversationId,
    operationId: randomUUID(),
    expectedVersion: 0,
    action: "catalogCheckout",
    payload: { productId, productVersion: 1, quantity: 2, variant: "Red" },
  };
  const first = await workflow.run(req(catalogUid, mutation));
  expect(await workflow.run(req(catalogUid, mutation))).toEqual(first);
  const os = await db.doc(`orders/${first.id}`).get();
  expect(os.data()).toMatchObject({
    purchaseKind: "catalog",
    finalTotal: 400000,
    collected: 0,
  });
  expect(os.data()).not.toHaveProperty("deposit");
  await workflow.run(
    req(catalogUid, {
      conversationId,
      operationId: randomUUID(),
      expectedVersion: first.version,
      expectedOrderVersion: 1,
      action: "saveRecipient",
      payload: {
        recipient: "Synthetic Customer",
        phone: "0900000000",
        address: "Synthetic delivery address",
      },
    }),
  );
  expect(
    (
      await db.doc(`askConversations/${catalogUid}-${conversationId}`).get()
    ).data()?.recipientSaved,
  ).toBe(true);
  await expect(
    workflow.run(
      req(catalogUid, {
        ...mutation,
        expectedVersion: first.version + 1,
        operationId: randomUUID(),
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
