import { beforeAll, afterAll, test, expect } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { askAnswerSchema } from "../../packages/domain/ask-stream";
import { feedbackHash } from "../../functions/src/ai/feedback";
import { knowledgeSource } from "../../functions/src/ai/approved-knowledge";
import {
  runWebDiscovery,
  runWebSelect,
} from "../../functions/src/ai/research-live";
import { readServerContext } from "../../functions/src/ai/server-context";
let api: typeof import("../../functions/src/index"),
  db: ReturnType<typeof getFirestore>;
const paths = new Set<string>(),
  ownedPolicies = new Map<string, unknown>(),
  policyVersion = Date.now();
const auth = (uid: string, data: unknown, mfa = true) =>
  ({
    auth: {
      uid,
      token: {
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
        firebase: {
          sign_in_provider: "google.com",
          ...(mfa ? { sign_in_second_factor: "totp" } : {}),
        },
      },
    },
    data,
  }) as CallableRequest;
const offer = () => ({
  title: `synthetic${randomUUID().replaceAll("-", "")}`,
  market: "US",
  variant: "Black",
  sellerId: "first-party",
  url: "https://store.example/item",
  observedAt: Date.now() - 1000,
  expiresAt: Date.now() + 600000,
  price: { amountMinor: 12300, currency: "USD", sourceText: "USD 123.00" },
  reviews: null,
});
async function fixture() {
  const uid = `qa-rf-${randomUUID()}`,
    id = `qa-${randomUUID()}`;
  paths.add(`staffAccess/${uid}`);
  paths.add(`users/${uid}`);
  paths.add(`askResearchQuota/${uid}-${Math.floor(Date.now() / 60000)}`);
  paths.add(`askResearchQuota/${uid}-${Math.floor(Date.now() / 60000) + 1}`);
  await db.doc(`staffAccess/${uid}`).create({ active: true, roles: ["OWNER"] });
  return { uid, id };
}
async function approve(uid: string, id: string) {
  const input = {
    action: "approve",
    operationId: randomUUID(),
    id,
    expectedVersion: 0,
    offer: offer(),
  };
  paths.add(`askResearchOffers/${id}`);
  paths.add(`askResearchOperations/${uid}-${input.operationId}`);
  await api.askResearchCommand.run(auth(uid, input));
  return input;
}
async function conversation(uid: string) {
  const cid = randomUUID(),
    answer = askAnswerSchema.parse({
      language: "vi",
      title: "Synthetic guidance",
      paragraphs: ["Synthetic fixture only."],
      bullets: [],
      sourceIds: [],
      action: "workflow",
    });
  paths.add(`askConversations/${uid}-${cid}`);
  await db.doc(`askConversations/${uid}-${cid}`).create({
    ownerId: uid,
    version: 1,
    updatedAt: Date.now(),
    turns: [{ id: randomUUID(), question: "Synthetic question", answer }],
  });
  const input = {
    operationId: randomUUID(),
    conversationId: cid,
    expectedVersion: 1,
    answerHash: feedbackHash(answer),
    submittedAt: Date.now(),
    expectedPolicyVersion: policyVersion,
    consent: true,
    category: "missing_information",
  };
  paths.add(`askFeedback/${uid}-${input.operationId}`);
  paths.add(`askFeedbackQuota/${uid}-${Math.floor(Date.now() / 86400000)}`);
  return input;
}
beforeAll(async () => {
  api = await import("../../functions/src/index");
  db = getFirestore();
  const policies = {
    askWebDiscovery: {
      enabled: true,
      version: policyVersion,
      termsReviewed: true,
      expiresAt: Date.now() + 600000,
      merchantPolicyVersion: policyVersion,
      budgetImportHash: "a".repeat(64),
    },
    askResearch: {
      enabled: true,
      version: policyVersion,
      expiresAt: Date.now() + 600000,
      merchants: [
        {
          host: "store.example",
          kind: "retailer",
          market: "US",
          sellerIds: ["first-party"],
        },
      ],
    },
    askFeedback: {
      enabled: true,
      version: policyVersion,
      retentionDays: 1,
      expiresAt: Date.now() + 600000,
    },
  };
  for (const [id, value] of Object.entries(policies)) {
    const path = `settings/${id}`;
    if ((await db.doc(path).get()).exists)
      throw Error(`Shared policy exists; refuse to overwrite ${path}`);
    await db.doc(path).create(value);
    ownedPolicies.set(path, value);
  }
  const budgetPath = "askResearchBudget/lifetime";
  if ((await db.doc(budgetPath).get()).exists)
    throw Error("Shared research ledger exists; refuse to overwrite");
  const demoLedger = {
    maxBudgetVnd: 50000,
    reservedVnd: 0,
    importedReservedVnd: 0,
    importHash: "a".repeat(64),
    fixture: policyVersion,
  };
  await db.doc(budgetPath).create(demoLedger);
  paths.add(budgetPath);
  // This quota namespace belongs only to our freshly-created synthetic policy.
  paths.add(
    `askResearchQuota/global-${policyVersion}-${Math.floor(Date.now() / 86400000)}`,
  );
  paths.add(
    `askResearchQuota/global-${policyVersion}-${Math.floor(Date.now() / 86400000) + 1}`,
  );
  paths.add(
    `askWebQuota/global-${policyVersion}-${Math.floor(Date.now() / 86400000)}`,
  );
  paths.add(
    `askWebQuota/global-${policyVersion}-${Math.floor(Date.now() / 86400000) + 1}`,
  );
});
afterAll(async () => {
  if (!db) return;
  for (const path of paths) await db.recursiveDelete(db.doc(path));
  for (const [path, value] of ownedPolicies) {
    const ref = db.doc(path);
    await db.runTransaction(async (tx) => {
      const now = await tx.get(ref);
      if (JSON.stringify(now.data()) === JSON.stringify(value)) tx.delete(ref);
    });
  }
  await db.terminate();
});
test("integration learning: missing frozen holdout blocks; actual approved source passes retrieval, changed publication rejects", async () => {
  const { uid } = await fixture(),
    id = `qa-${randomUUID()}`,
    word = `policyn${randomUUID()
      .replaceAll("-", "")
      .replace(/\d/g, (n) => "ghijklmnop"[Number(n)])}`;
  const sourcePath = `posts/${id}`,
    key = `posts-${id}`,
    holdoutPath = "settings/askKnowledgeHoldout-vi";
  paths.add(sourcePath);
  paths.add(`askKnowledge/${key}`);
  if ((await db.doc(holdoutPath).get()).exists)
    throw Error("Refuse to overwrite shared holdout");
  await expect(
    api.askFeedbackEvaluation.run(auth(uid, { language: "vi" })),
  ).rejects.toMatchObject({ code: "unavailable" });
  const publication = {
    status: "published",
    slug: id,
    title: word,
    body: `${word} synthetic approved guidance.`,
  };
  await db.doc(sourcePath).create(publication);
  const source = knowledgeSource(publication)!;
  await db.doc(`askKnowledge/${key}`).create({
    schemaVersion: 1,
    source: "posts",
    sourceId: id,
    version: 1,
    active: true,
    language: "vi",
    effectiveFrom: Date.now() - 1000,
    effectiveTo: Date.now() + 600000,
    contentHash: source.hash,
    reviewedBy: uid,
    reviewedAt: Date.now(),
  });
  await db.doc(holdoutPath).create({
    version: 1,
    approved: true,
    expiresAt: Date.now() + 600000,
    cases: [
      {
        id: "synthetic-public-policy",
        question: word,
        expected: [
          { documentId: source.document.id, requiredText: publication.body },
        ],
      },
    ],
  });
  paths.add(holdoutPath);
  expect(
    await api.askFeedbackEvaluation.run(auth(uid, { language: "vi" })),
  ).toMatchObject({
    decision: "REVIEW_REQUIRED",
    passed: 1,
    total: 1,
    scope: "retrieval_only",
    automaticPromotion: false,
  });
  await db.doc(sourcePath).update({ body: "Changed without a new approval." });
  expect(
    await api.askFeedbackEvaluation.run(auth(uid, { language: "vi" })),
  ).toMatchObject({ decision: "REJECTED", passed: 0 });
  await expect(
    api.askFeedbackEvaluation.run(auth(uid, { language: "vi" }, false)),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
async function webFixture(reservedVnd = 0) {
  const { uid } = await fixture(),
    feedback = await conversation(uid),
    query = `synthetic${randomUUID()
      .replaceAll("-", "")
      .replace(/\d/g, (n) => "ghijklmnop"[Number(n)])}`;
  const collection = `qa-askweb-${randomUUID()}`;
  paths.add(`${collection}/fixture`);
  const budget = db.doc("askResearchBudget/lifetime");
  if ((await budget.get()).data()?.fixture !== policyVersion)
    throw Error("Refuse to reset an unowned demo ledger");
  await budget.update({ reservedVnd }); // Owned synthetic demo ledger only, never local paid ledger/cloud.
  const input = {
    query,
    market: "US" as const,
    conversationId: feedback.conversationId,
    expectedVersion: 1,
  };
  const queryHash = createHash("sha256")
    .update(JSON.stringify({ query, market: input.market }))
    .digest("hex");
  const key = createHash("sha256")
    .update(
      JSON.stringify({ uid, conversationId: input.conversationId, queryHash }),
    )
    .digest("hex");
  paths.add(`askWebDiscovery/${key}`);
  paths.add(`askWebQuota/${uid}-${Math.floor(Date.now() / 60000)}`);
  paths.add(`askWebQuota/${uid}-${Math.floor(Date.now() / 60000) + 1}`);
  const calls: string[] = [];
  const transport = {
    redirect: async () => null,
    send: async (url: string) => {
      calls.push(url.endsWith(":countTokens") ? "count" : "generate");
      return url.endsWith(":countTokens")
        ? { totalTokens: 100 }
        : {
            usageMetadata: {
              promptTokenCount: 100,
              candidatesTokenCount: 1,
              totalTokenCount: 101,
            },
            candidates: [
              {
                finishReason: "STOP",
                groundingMetadata: {
                  groundingChunks: [
                    {
                      web: {
                        title: query,
                        uri: "https://store.example/public-item",
                      },
                    },
                  ],
                  webSearchQueries: [query],
                  searchEntryPoint: {
                    renderedContent: "<div>Search Suggestions</div>",
                  },
                },
              },
            ],
          };
    },
  };
  return { uid, input, calls, transport, key, feedback, collection };
}
test("integration web happy: concurrent same query reserves once; cached read rebinds current version without another dispatch", async () => {
  const f = await webFixture();
  const results = await Promise.allSettled([
    runWebDiscovery(
      f.uid,
      f.input,
      f.transport,
      AbortSignal.timeout(10000),
      f.collection,
    ),
    runWebDiscovery(
      f.uid,
      f.input,
      f.transport,
      AbortSignal.timeout(10000),
      f.collection,
    ),
  ]);
  expect(
    results.filter((r) => r.status === "fulfilled").length,
  ).toBeGreaterThanOrEqual(1);
  expect(f.calls).toEqual(["count", "generate"]);
  expect(
    (await db.doc("askResearchBudget/lifetime").get()).data()?.reservedVnd,
  ).toBe(25000);
  const result = await runWebDiscovery(
    f.uid,
    f.input,
    f.transport,
    AbortSignal.timeout(10000),
    f.collection,
  );
  expect(result.candidates[0]).toMatchObject({
    price: null,
    reviews: null,
    verified: false,
  });
  expect(result.discoveryId).toBe(f.key);
  await db
    .doc(`askConversations/${f.uid}-${f.input.conversationId}`)
    .update({ version: 2 });
  expect(
    (
      await runWebDiscovery(
        f.uid,
        { ...f.input, expectedVersion: 2 },
        f.transport,
        AbortSignal.timeout(10000),
        f.collection,
      )
    ).expectedVersion,
  ).toBe(2);
  expect(f.calls).toHaveLength(2);
  const selected = await runWebSelect(
    f.uid,
    {
      discoveryId: f.key,
      conversationId: f.input.conversationId,
      expectedVersion: 2,
      index: 0,
      quantity: 2,
      variant: "Black",
    },
    f.collection,
  );
  expect(selected.draft.items[0].quantity).toBe(2);
  expect(selected.draft.budget).toBeUndefined();
  expect(
    (
      await db.doc(`askConversations/${f.uid}-${f.input.conversationId}`).get()
    ).data()?.draft,
  ).toBeUndefined();
});
test("integration web bad: exhausted/missing ledger, private input and stale context cause zero provider I/O", async () => {
  const f = await webFixture(50000);
  await expect(
    runWebDiscovery(
      f.uid,
      f.input,
      f.transport,
      AbortSignal.timeout(10000),
      f.collection,
    ),
  ).rejects.toMatchObject({ code: "resource-exhausted" });
  await expect(
    runWebDiscovery(
      f.uid,
      { ...f.input, query: "email owner@example.com" },
      f.transport,
    ),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    runWebDiscovery(f.uid, { ...f.input, expectedVersion: 99 }, f.transport),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const ledger = (await db.doc("askResearchBudget/lifetime").get()).data()!;
  await db.doc("askResearchBudget/lifetime").delete();
  try {
    await expect(
      runWebDiscovery(
        f.uid,
        f.input,
        f.transport,
        AbortSignal.timeout(10000),
        f.collection,
      ),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
  } finally {
    await db.doc("askResearchBudget/lifetime").create(ledger);
  }
  expect(f.calls).toEqual([]);
});
test("integration web bad: unknown outcome remains held and a version change cannot buy a retry", async () => {
  const f = await webFixture();
  const transport = {
    ...f.transport,
    send: async () => {
      f.calls.push("unknown");
      throw Error("Synthetic response loss");
    },
  };
  await expect(
    runWebDiscovery(
      f.uid,
      f.input,
      transport,
      AbortSignal.timeout(10000),
      f.collection,
    ),
  ).rejects.toThrow("Synthetic response loss");
  await db
    .doc(`askConversations/${f.uid}-${f.input.conversationId}`)
    .update({ version: 2 });
  await expect(
    runWebDiscovery(
      f.uid,
      { ...f.input, expectedVersion: 2 },
      transport,
      AbortSignal.timeout(10000),
      f.collection,
    ),
  ).rejects.toMatchObject({ code: "unavailable" });
  expect(f.calls).toEqual(["unknown"]);
  expect(
    (await db.doc("askResearchBudget/lifetime").get()).data()?.reservedVnd,
  ).toBe(25000);
});
test("integration web bad: coherent catalog duplicate rejects and still charges scan quota", async () => {
  const f = await webFixture(),
    path = `${f.collection}/fixture`;
  paths.add(path);
  await db.doc(path).create({ status: "published", title: f.input.query });
  await expect(
    runWebDiscovery(
      f.uid,
      f.input,
      f.transport,
      AbortSignal.timeout(10000),
      f.collection,
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect(f.calls).toEqual([]);
  expect(
    (
      await db
        .doc(`askWebQuota/${f.uid}-${Math.floor(Date.now() / 60000)}`)
        .get()
    ).data()?.count,
  ).toBe(1);
});
test("integration web bad: context changes during dispatch discard response and hold the reservation", async () => {
  const f = await webFixture();
  const transport = {
    ...f.transport,
    send: async (url: string) => {
      const result = await f.transport.send(url);
      if (url.endsWith(":generateContent"))
        await db
          .doc(`askConversations/${f.uid}-${f.input.conversationId}`)
          .update({ version: 2 });
      return result;
    },
  };
  await expect(
    runWebDiscovery(
      f.uid,
      f.input,
      transport,
      AbortSignal.timeout(10000),
      f.collection,
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect((await db.doc(`askWebDiscovery/${f.key}`).get()).data()?.state).toBe(
    "reserved",
  );
});
test("integration feedback: withdrawal fences late creation, inbox excludes withdrawn and review cannot revive it", async () => {
  const { uid } = await fixture(),
    input = await conversation(uid);
  paths.add(
    `askFeedbackQuota/withdraw-${uid}-${Math.floor(Date.now() / 86400000)}`,
  );
  expect(
    await api.askFeedbackWithdraw.run(
      auth(uid, { feedbackId: input.operationId }),
    ),
  ).toMatchObject({ withdrawn: true });
  await expect(api.askFeedback.run(auth(uid, input))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(
    (await db.doc(`askFeedback/${uid}-${input.operationId}`).get()).data(),
  ).not.toHaveProperty("category");
  expect(
    (await api.askFeedbackInbox.run(auth(uid, {}))).rows.some(
      (row) => row.feedbackId === input.operationId,
    ),
  ).toBe(false);
  await expect(
    api.askFeedbackReview.run(
      auth(uid, {
        operationId: randomUUID(),
        ownerId: uid,
        feedbackId: input.operationId,
        expectedVersion: 1,
        disposition: "acknowledged",
      }),
    ),
  ).rejects.toMatchObject({ code: "not-found" });
});
test("integration feedback: stale submitted timestamp cannot recreate an expired or purged event; OWNER/MFA enforced", async () => {
  const { uid } = await fixture(),
    input = await conversation(uid);
  await expect(
    api.askFeedback.run(
      auth(uid, { ...input, submittedAt: Date.now() - 310000 }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    api.askFeedbackInbox.run(auth(uid, {}, false)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await api.askFeedback.run(auth(uid, input));
  expect(
    (await api.askFeedbackInbox.run(auth(uid, {}))).rows.some(
      (row) => row.feedbackId === input.operationId,
    ),
  ).toBe(true);
});
test("integration context: actual server conversation/order projection and stale stamps, foreign order denied", async () => {
  const { uid } = await fixture(),
    input = await conversation(uid),
    orderId = `qa-${randomUUID()}`;
  paths.add(`orders/${orderId}`);
  await db.doc(`orders/${orderId}`).create({
    ownerId: uid,
    version: 2,
    stage: "REQUESTED",
    recipient: { phone: "PRIVATE", address: "PRIVATE" },
  });
  const c = db.doc(`askConversations/${uid}-${input.conversationId}`);
  await c.update({
    orderId,
    pendingOperation: randomUUID(),
    draft: {
      market: "US",
      items: [{ name: "Fixture", quantity: 2, variant: "Black" }],
      notes: "PRIVATE",
    },
  });
  const query = {
    conversationId: input.conversationId,
    orderId,
    question: "Synthetic question",
    language: "vi" as const,
  };
  const snapshot = await readServerContext(uid, query);
  expect(snapshot.currentFacts.order).toMatchObject({
    version: 2,
    stage: "REQUESTED",
  });
  expect(JSON.stringify(snapshot)).not.toContain("PRIVATE");
  await c.update({ version: 2 });
  expect((await readServerContext(uid, query)).stamp).not.toBe(snapshot.stamp);
  await db.doc(`orders/${orderId}`).update({ ownerId: "foreign-owner" });
  await expect(readServerContext(uid, query)).rejects.toMatchObject({
    code: "permission-denied",
  });
});
test("research happy: OWNER approval/replay, customer comparison and selection create only provenance draft", async () => {
  const { uid, id } = await fixture(),
    input = await approve(uid, id);
  expect(await api.askResearchCommand.run(auth(uid, input))).toEqual({
    version: 1,
  });
  paths.add(`askResearchQuota/${uid}-${Math.floor(Date.now() / 60000)}`);
  const results = await api.askResearchSearch.run(
    auth(uid, { query: input.offer.title, market: "US" }),
  );
  expect(results.offers).toHaveLength(1);
  expect(results.offers[0].reviews).toBeNull();
  for (const query of [
    `Cho mình tìm ${input.offer.title} nhé`,
    `Please find ${input.offer.title}`,
  ])
    expect(
      (
        await api.askResearchSearch.run(auth(uid, { query, market: "US" }))
      ).offers.map((row) => row.id),
    ).toContain(id);
  const row = results.offers[0],
    selected = await api.askResearchSelect.run(
      auth(uid, {
        id: row.id,
        version: row.version,
        contentHash: row.contentHash,
        quantity: 2,
      }),
    );
  expect(selected.draft.items[0].quantity).toBe(2);
  expect(selected.draft.notes).toContain("staff quotation required");
  expect(selected.draft.budget).toBeUndefined();
  expect(
    (await db.doc(`askResearchOffers/${id}/revisions/1`).get()).exists,
  ).toBe(true);
});
test("research bad: no MFA, customer role, unapproved host/seller/currency denied", async () => {
  const { uid, id } = await fixture(),
    input = {
      action: "approve",
      operationId: randomUUID(),
      id,
      expectedVersion: 0,
      offer: offer(),
    };
  await expect(
    api.askResearchCommand.run(auth(uid, input, false)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  for (const delta of [
    { url: "https://evil.test/item" },
    { sellerId: "fake-seller" },
  ])
    await expect(
      api.askResearchCommand.run(
        auth(uid, { ...input, offer: { ...input.offer, ...delta } }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    api.askResearchCommand.run(
      auth(uid, {
        ...input,
        offer: {
          ...input.offer,
          price: { ...input.offer.price, currency: "JPY" },
        },
      }),
    ),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await db.doc(`staffAccess/${uid}`).update({ roles: ["SUPPORT"] });
  await expect(
    api.askResearchCommand.run(auth(uid, input)),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
test("research admission: punctuation, authentication, expired offer and quota fail closed", async () => {
  const { uid, id } = await fixture(),
    input = await approve(uid, id);
  await expect(
    api.askResearchSearch.run(auth(uid, { query: "...", market: "US" })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    api.askResearchSearch.run({
      data: { query: input.offer.title, market: "US" },
    } as CallableRequest),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  await expect(
    api.askResearchCommand.run(
      auth(uid, {
        ...input,
        id: `qa-${randomUUID()}`,
        operationId: randomUUID(),
        offer: {
          ...input.offer,
          observedAt: Date.now() - 2000,
          expiresAt: Date.now() - 1000,
        },
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  for (let i = 0; i < 4; i++)
    await api.askResearchSearch.run(
      auth(uid, { query: input.offer.title, market: "US" }),
    );
  await expect(
    api.askResearchSearch.run(
      auth(uid, { query: input.offer.title, market: "US" }),
    ),
  ).rejects.toMatchObject({ code: "resource-exhausted" });
  const record = (await db.doc(`askResearchOffers/${id}`).get()).data()!;
  await expect(
    api.askResearchSelect.run(
      auth(uid, {
        id,
        version: 1,
        contentHash: record.contentHash,
        quantity: 1,
      }),
    ),
  ).rejects.toMatchObject({ code: "resource-exhausted" });
  expect(
    (
      await db
        .doc(`askResearchQuota/${uid}-${Math.floor(Date.now() / 60000)}`)
        .get()
    ).data()?.count,
  ).toBe(4);
});
test("research bad: stale/tampered/revoked/locked selections denied; known replay conflict", async () => {
  const { uid, id } = await fixture(),
    input = await approve(uid, id),
    ref = db.doc(`askResearchOffers/${id}`),
    row = (await ref.get()).data()!;
  const select = { id, version: 1, contentHash: row.contentHash, quantity: 1 };
  await expect(
    api.askResearchSelect.run(auth(uid, { ...select, version: 2 })),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    api.askResearchCommand.run(
      auth(uid, { ...input, offer: { ...input.offer, title: "Changed" } }),
    ),
  ).rejects.toMatchObject({ code: "already-exists" });
  await ref.update({ "offer.title": "Tampered" });
  await expect(
    api.askResearchSelect.run(auth(uid, select)),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await ref.set(row);
  const revoke = {
    action: "revoke",
    id,
    expectedVersion: 1,
    operationId: randomUUID(),
  };
  paths.add(`askResearchOperations/${uid}-${revoke.operationId}`);
  await api.askResearchCommand.run(auth(uid, revoke));
  await expect(
    api.askResearchSelect.run(auth(uid, select)),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await db.doc(`users/${uid}`).set({ locked: true });
  await expect(
    api.askResearchSelect.run(auth(uid, select)),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
test("feedback happy: consent-bound actual saved answer, identical replay, no raw chat copy", async () => {
  const { uid } = await fixture(),
    input = await conversation(uid);
  const results = await Promise.all([
    api.askFeedback.run(auth(uid, input)),
    api.askFeedback.run(auth(uid, input)),
  ]);
  expect(results[0]).toEqual(results[1]);
  const row = (
    await db.doc(`askFeedback/${uid}-${input.operationId}`).get()
  ).data()!;
  expect(row.category).toBe("missing_information");
  for (const key of ["question", "answer", "profile", "address", "text"])
    expect(row[key]).toBeUndefined();
  expect(
    (
      await db
        .doc(`askFeedbackQuota/${uid}-${Math.floor(Date.now() / 86400000)}`)
        .get()
    ).data()?.count,
  ).toBe(1);
});
test("research: catalog-listed item cannot silently become custom request", async () => {
  const { uid, id } = await fixture(),
    input = await approve(uid, id),
    record = (await db.doc(`askResearchOffers/${id}`).get()).data()!,
    path = `products/${id}`;
  paths.add(path);
  await db.doc(path).create({
    title: input.offer.title,
    status: "published",
    orderable: false,
  });
  await expect(
    api.askResearchSelect.run(
      auth(uid, {
        id,
        version: 1,
        contentHash: record.contentHash,
        quantity: 1,
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
test("feedback bad: no consent/raw text/stale version/foreign owner/hash mismatch denied", async () => {
  const { uid } = await fixture(),
    input = await conversation(uid);
  for (const delta of [{ consent: false }, { text: "private chat" }])
    await expect(
      api.askFeedback.run(auth(uid, { ...input, ...delta })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  for (const delta of [{ expectedVersion: 2 }, { answerHash: "a".repeat(64) }])
    await expect(
      api.askFeedback.run(auth(uid, { ...input, ...delta })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    api.askFeedback.run(auth(`foreign-${uid}`, input)),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await db.doc(`users/${uid}`).set({ locked: true });
  await expect(api.askFeedback.run(auth(uid, input))).rejects.toMatchObject({
    code: "permission-denied",
  });
});
test("feedback review: OWNER/MFA CAS and replay, cannot resolve using unknown policy source", async () => {
  const { uid } = await fixture(),
    input = await conversation(uid);
  await api.askFeedback.run(auth(uid, input));
  const command = {
    operationId: randomUUID(),
    ownerId: uid,
    feedbackId: input.operationId,
    expectedVersion: 1,
    disposition: "needs_source_review",
  };
  paths.add(`askFeedbackReviewOperations/${uid}-${command.operationId}`);
  await expect(
    api.askFeedbackReview.run(auth(uid, command, false)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(await api.askFeedbackReview.run(auth(uid, command))).toEqual({
    version: 2,
  });
  expect(await api.askFeedbackReview.run(auth(uid, command))).toEqual({
    version: 2,
  });
  await expect(
    api.askFeedbackReview.run(
      auth(uid, { ...command, operationId: randomUUID() }),
    ),
  ).rejects.toMatchObject({ code: "aborted" });
  await expect(
    api.askFeedbackReview.run(
      auth(uid, {
        ...command,
        operationId: randomUUID(),
        expectedVersion: 2,
        disposition: "resolved",
        source: {
          key: "posts-unknown",
          version: 1,
          contentHash: "a".repeat(64),
        },
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
test("feedback resolution: approved current publication is required; no policy auto-promotion", async () => {
  const { uid, id } = await fixture(),
    input = await conversation(uid);
  await api.askFeedback.run(auth(uid, input));
  const post = {
      status: "published",
      slug: id,
      title: "Synthetic reviewed guidance",
      body: "Synthetic source for tests only.",
    },
    source = {
      key: `posts-${id}`,
      version: 1,
      contentHash: knowledgeSource(post)!.hash,
    },
    approval = {
      action: "approve",
      operationId: randomUUID(),
      source: "posts",
      sourceId: id,
      expectedVersion: 0,
      contentHash: source.contentHash,
      language: "vi",
      effectiveFrom: Date.now() - 1000,
      effectiveTo: Date.now() + 600000,
    };
  for (const path of [
    `posts/${id}`,
    `askKnowledge/${source.key}`,
    `askKnowledgeOperations/${uid}-${approval.operationId}`,
  ])
    paths.add(path);
  await db.doc(`posts/${id}`).create(post);
  await api.askKnowledgeCommand.run(auth(uid, approval));
  const review = {
    operationId: randomUUID(),
    ownerId: uid,
    feedbackId: input.operationId,
    expectedVersion: 1,
    disposition: "resolved",
    source,
  };
  paths.add(`askFeedbackReviewOperations/${uid}-${review.operationId}`);
  await db.doc(`posts/${id}`).update({ body: "Changed after approval" });
  await expect(
    api.askFeedbackReview.run(auth(uid, review)),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await db.doc(`posts/${id}`).set(post);
  expect(await api.askFeedbackReview.run(auth(uid, review))).toEqual({
    version: 2,
  });
  expect(await api.askFeedbackReview.run(auth(uid, review))).toEqual({
    version: 2,
  });
  expect(
    (await db.doc(`askKnowledge/${source.key}`).get()).data()?.version,
  ).toBe(1);
  expect((await db.doc(`posts/${id}`).get()).data()).toEqual(post);
  expect(
    (await db.doc(`askFeedback/${uid}-${input.operationId}`).get()).data()
      ?.disposition,
  ).toBe("resolved");
});
test("server-only evidence: even OWNER clients cannot read or write research/feedback records", async () => {
  const { uid, id } = await fixture(),
    research = await approve(uid, id),
    feedback = await conversation(uid);
  await api.askFeedback.run(auth(uid, feedback));
  const { initializeTestEnvironment, assertFails } =
      await import("@firebase/rules-unit-testing"),
    { doc, getDoc, setDoc } = await import("firebase/firestore"),
    env = await initializeTestEnvironment({
      projectId: "demo-satsunicgo",
      firestore: { host: "127.0.0.1", port: 18207 },
    });
  try {
    const client = env.authenticatedContext(uid).firestore();
    for (const path of [
      `askResearchOffers/${id}`,
      `askResearchOffers/${id}/revisions/1`,
      `askResearchOperations/${uid}-${research.operationId}`,
      `askFeedback/${uid}-${feedback.operationId}`,
      "askResearchBudget/lifetime",
      `askWebDiscovery/qa-${randomUUID()}`,
      `askWebQuota/qa-${randomUUID()}`,
    ])
      await assertFails(getDoc(doc(client, path)));
    for (const collection of [
      "askResearchOffers",
      "askFeedback",
      "askWebDiscovery",
      "askResearchBudget",
      "askWebQuota",
    ]) {
      const path = `${collection}/qa-${randomUUID()}`;
      paths.add(path);
      await assertFails(setDoc(doc(client, path), { active: true }));
    }
  } finally {
    await env.cleanup();
  }
});
