import { afterEach, beforeEach, expect, test, vi } from "vitest";
const state = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  serial: Promise.resolve(),
  projectId: "satsunicgo",
  afterCommit: undefined as (() => void) | undefined,
}));
vi.mock("firebase-admin/app", () => ({
  getApp: () => ({
    options: {
      credential: {
        getAccessToken: async () => ({ access_token: "synthetic-only" }),
      },
    },
  }),
}));
vi.mock("firebase-admin/firestore", () => {
  const snapshot = (path: string) => ({
    exists: state.docs.has(path),
    data: () => state.docs.get(path),
  });
  const doc = (path: string) => ({
    path,
    collection: (name: string) => ({
      doc: (id: string) => doc(`${path}/${name}/${id}`),
    }),
    get: async () => snapshot(path),
    update: async (data: Record<string, unknown>) => {
      state.docs.set(path, { ...state.docs.get(path), ...data });
    },
  });
  return {
    getFirestore: () => ({
      projectId: state.projectId,
      doc,
      collection: (name: string) => ({
        doc: (id = "audit-fixture") => doc(`${name}/${id}`),
        where: () => ({ limit: () => ({ query: name }) }),
      }),
      runTransaction: (work: (tx: unknown) => Promise<unknown>) => {
        const result = state.serial.then(async () => {
          const writes: (() => void)[] = [];
          const result = await work({
            get: async (ref: { path: string; query?: string }) =>
              ref.query ? { docs: [], size: 0 } : snapshot(ref.path),
            set: (
              ref: { path: string },
              data: Record<string, unknown>,
              options?: { merge: boolean },
            ) =>
              writes.push(() =>
                state.docs.set(ref.path, {
                  ...(options?.merge ? state.docs.get(ref.path) : {}),
                  ...data,
                }),
              ),
            create: (ref: { path: string }, data: Record<string, unknown>) =>
              writes.push(() => state.docs.set(ref.path, data)),
            update: (ref: { path: string }, data: Record<string, unknown>) =>
              writes.push(() =>
                state.docs.set(ref.path, {
                  ...state.docs.get(ref.path),
                  ...data,
                }),
              ),
          });
          writes.forEach((write) => write());
          state.afterCommit?.();
          return result;
        });
        state.serial = result.then(
          () => {},
          () => {},
        );
        return result;
      },
    }),
  };
});
import {
  checkCustomerAiPolicy,
  customerAiLimits,
  customerAiReservation,
  customerAiRequest,
  customerAiEnvironmentReady,
  generateCustomerAi,
  completeCustomerAiAnswer,
  customerAiCanPromote,
  customerAiConfigured,
  verifyCustomerAiProvider,
} from "../../functions/src/ai/ask-production";
const policyPath = "settings/askCustomerAi",
  budgetPath = "aiCustomerBudget/lifetime";
const policy = (audience = "customers") => ({
  schemaVersion: 1,
  enabled: true,
  audience,
  canaryUid: "owner",
  maxBudgetVnd: 50000,
  activatedAt: Date.now() - 1000,
  expiresAt: Date.now() + 3600000,
  version: 1,
  releaseId: customerAiLimits.releaseId,
});
const usage = {
  promptTokenCount: 100,
  candidatesTokenCount: 40,
  totalTokenCount: 140,
};
const answer = {
  candidates: [
    {
      finishReason: "STOP",
      content: { parts: [{ text: '{"title":"Help"}' }] },
    },
  ],
  usageMetadata: usage,
};
let paid: string[];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T12:00:00Z"));
  for (const key of [
    "GOOGLE_CLOUD_PROJECT",
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
  ])
    vi.stubEnv(key, "");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  state.projectId = "satsunicgo";
  state.docs = new Map([[policyPath, policy()]]);
  state.serial = Promise.resolve();
  state.afterCommit = undefined;
  paid = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options: RequestInit) => {
      if (url.endsWith(":countTokens"))
        return Response.json({ totalTokens: 100 });
      paid.push(String(options.body));
      return Response.json(answer);
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function generate(
  uid = "customer",
  text = "hello",
  signal = new AbortController().signal,
) {
  return generateCustomerAi(
    uid,
    "session-id",
    async (count) => {
      const body = customerAiRequest("instructions", text);
      await count(body, signal);
      return body;
    },
    signal,
  );
}
test("customer admission counts exact bytes, reserves and validates one paid attempt", async () => {
  const result = await generate();
  expect(result.value).toEqual({ title: "Help" });
  expect(paid).toHaveLength(1);
  expect(state.docs.get(budgetPath)?.reservedVnd).toBe(1000);
  await completeCustomerAiAnswer(
    "customer",
    result.operation,
    result.policyVersion,
  );
  expect(
    state.docs.get(`${budgetPath}/attempts/${result.operation}`)?.state,
  ).toBe("validated");
  expect(state.docs.get(budgetPath)?.canaryAt).toBeUndefined();
  expect(JSON.stringify([...state.docs])).not.toContain("instructions");
});
test("OWNER canary proof exists only after validated answer and is bound to account/release/time", async () => {
  state.docs.set(policyPath, policy("owner-canary"));
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  await expect(generate("customer")).rejects.toThrow();
  const result = await generate("owner");
  expect(
    customerAiCanPromote(state.docs.get(budgetPath), "owner", Date.now()),
  ).toBe(false);
  await completeCustomerAiAnswer(
    "owner",
    result.operation,
    result.policyVersion,
  );
  expect(
    customerAiCanPromote(state.docs.get(budgetPath), "owner", Date.now()),
  ).toBe(true);
  expect(
    customerAiCanPromote(state.docs.get(budgetPath), "other", Date.now()),
  ).toBe(false);
  vi.advanceTimersByTime(customerAiLimits.windowMs);
  expect(
    customerAiCanPromote(state.docs.get(budgetPath), "owner", Date.now()),
  ).toBe(false);
});
test.each([
  undefined,
  {},
  { ...policy(), enabled: false },
  { ...policy(), maxBudgetVnd: 50001 },
  { ...policy(), releaseId: "other" },
  { ...policy(), expiresAt: 1 },
  { ...policy(), activatedAt: 9999999999999 },
  { ...policy(), expiresAt: 9999999999999 },
])("bad or closed policy never pays (%j)", async (value) => {
  state.docs.set(policyPath, value as Record<string, unknown>);
  await expect(generate()).rejects.toThrow();
  expect(paid).toHaveLength(0);
});
test("pricing expiry closes even otherwise valid policy", async () => {
  vi.setSystemTime(customerAiLimits.pricingExpiresAt);
  expect(() =>
    checkCustomerAiPolicy(policy(), "customer", Date.now()),
  ).toThrow();
  await expect(generate()).rejects.toThrow();
  expect(paid).toHaveLength(0);
});
test.each([NaN, -1000, "1000", 1, 50000, Number.MAX_SAFE_INTEGER])(
  "invalid/exhausted budget fails closed %s",
  async (reservedVnd) => {
    expect(() => customerAiReservation(reservedVnd, 50000)).toThrow();
    state.docs.set(budgetPath, { reservedVnd });
    await expect(generate()).rejects.toThrow();
    expect(paid).toHaveLength(0);
  },
);
test("concurrent admission never exceeds total ceiling", async () => {
  state.docs.set(budgetPath, { reservedVnd: 49000 });
  const result = await Promise.allSettled(
    Array.from({ length: 8 }, (_, i) => generate(`customer-${i}`)),
  );
  expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(paid).toHaveLength(1);
  expect(state.docs.get(budgetPath)?.reservedVnd).toBe(50000);
});
test("per-user lifetime ceiling survives minute rollover", async () => {
  for (let i = 0; i < 5; i++) {
    await generate("customer", `turn-${i}`);
    vi.advanceTimersByTime(60000);
  }
  await expect(generate("customer", "sixth")).rejects.toThrow();
  expect(paid).toHaveLength(5);
});
test("per-minute customer limit denies third distinct turn", async () => {
  await generate("customer", "one");
  await generate("customer", "two");
  await expect(generate("customer", "three")).rejects.toThrow();
  expect(paid).toHaveLength(2);
});
test("global minute limit denies eleventh customer", async () => {
  for (let i = 0; i < 10; i++) await generate(`customer-${i}`);
  await expect(generate("eleventh")).rejects.toThrow();
  expect(paid).toHaveLength(10);
});
test("locked user and locked staff denied before paid dispatch", async () => {
  state.docs.set("users/customer", { locked: true });
  await expect(generate()).rejects.toThrow();
  state.docs.delete("users/customer");
  state.docs.set("staffAccess/customer", { locked: true });
  await expect(generate()).rejects.toThrow();
  expect(paid).toHaveLength(0);
});
test.each(["policy", "lock", "cancel"])(
  "post-reservation %s change keeps reservation without dispatch",
  async (change) => {
    const controller = new AbortController();
    state.afterCommit = () => {
      if (change === "policy")
        state.docs.set(policyPath, { ...policy(), enabled: false, version: 2 });
      if (change === "lock") state.docs.set("users/customer", { locked: true });
      if (change === "cancel") controller.abort();
    };
    await expect(
      generate("customer", "hi", controller.signal),
    ).rejects.toThrow();
    expect(paid).toHaveLength(0);
    expect(state.docs.get(budgetPath)?.reservedVnd).toBe(1000);
  },
);
test("unknown provider outcome is retained; identical transport replay cannot pay again", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith(":countTokens"))
        return Response.json({ totalTokens: 100 });
      paid.push("unknown");
      throw Error("timeout");
    }),
  );
  await expect(generate()).rejects.toThrow();
  await expect(generate()).rejects.toThrow();
  expect(paid).toHaveLength(1);
  expect(state.docs.get(budgetPath)?.reservedVnd).toBe(1000);
});
test.each(["thinking", "usage", "blocked", "oversized"])(
  "invalid provider %s cannot validate or produce canary proof",
  async (kind) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith(":countTokens"))
          return Response.json({ totalTokens: 100 });
        paid.push(kind);
        if (kind === "oversized") return new Response("x".repeat(65537));
        return Response.json({
          ...answer,
          ...(kind === "blocked" ? { candidates: [] } : {}),
          usageMetadata: {
            ...usage,
            ...(kind === "thinking" ? { thoughtsTokenCount: 1 } : {}),
            ...(kind === "usage" ? { totalTokenCount: 141 } : {}),
          },
        });
      }),
    );
    await expect(generate()).rejects.toThrow();
    expect(state.docs.get(budgetPath)?.reservedVnd).toBe(1000);
    expect(state.docs.get(budgetPath)?.canaryAt).toBeUndefined();
  },
);
test("policy change after provider return prevents validated response", async () => {
  const result = await generate();
  state.docs.set(policyPath, { ...policy(), version: 2 });
  await expect(
    completeCustomerAiAnswer(
      "customer",
      result.operation,
      result.policyVersion,
    ),
  ).rejects.toThrow();
});
test("actual database and emulator fences deny regardless of configuration", async () => {
  state.projectId = "demo-satsunicgo";
  expect(customerAiEnvironmentReady(state.projectId)).toBe(false);
  await expect(generate()).rejects.toThrow();
  state.projectId = "satsunicgo";
  vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:19207");
  await expect(generate()).rejects.toThrow();
  expect(await verifyCustomerAiProvider()).toBe(false);
  expect(paid).toHaveLength(0);
});
test("explicit disabled or invalid customer policy prevents paid pilot fallback", async () => {
  expect(await customerAiConfigured()).toBe(true);
  state.docs.set(policyPath, { enabled: false });
  expect(await customerAiConfigured()).toBe(true);
  state.docs.delete(policyPath);
  expect(await customerAiConfigured()).toBe(false);
});
test("token-count overflow and redirected/error readiness never pay", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ totalTokens: 10001 })),
  );
  await expect(generate()).rejects.toThrow();
  expect(paid).toHaveLength(0);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 403 })),
  );
  expect(await verifyCustomerAiProvider()).toBe(false);
});

// Execute the real callable handler. Runtime App Check enforcement is separately
// retained on its trigger; these tests exercise server authorization and writes.
import {
  workspaceCommand,
  readOwnerConfiguration,
} from "../../functions/src/workspace";
const adminRequest = (
  payload: unknown,
  action = "saveAskCustomerPolicy",
  expectedVersion?: number,
) => ({
  data: {
    action,
    operationId: "11111111-1111-4111-8111-111111111111",
    payload,
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
  },
  auth: {
    uid: "owner",
    token: {
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
      firebase: {
        sign_in_provider: "google.com",
        sign_in_second_factor: "totp",
      },
    },
  },
});
const runAdmin = (request: ReturnType<typeof adminRequest>) =>
  workspaceCommand.run(request as never);
test("policy administration requires current OWNER and MFA even for disable", async () => {
  const req = adminRequest(
    { enabled: false, audience: "owner-canary" },
    "saveAskCustomerPolicy",
    1,
  );
  await expect(runAdmin(req)).rejects.toThrow();
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  req.auth.token.firebase.sign_in_second_factor = "";
  await expect(runAdmin(req)).rejects.toThrow();
  expect(state.docs.get(policyPath)?.enabled).toBe(true);
});
test("unverified Google administration cannot reach provider or write", async () => {
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  const req = adminRequest({ enabled: true, audience: "owner-canary" });
  req.auth.token.email_verified = false;
  await expect(runAdmin(req)).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
test("customer promotion blocked before validated OWNER canary", async () => {
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  await expect(
    runAdmin(
      adminRequest(
        { enabled: true, audience: "customers" },
        "saveAskCustomerPolicy",
        1,
      ),
    ),
  ).rejects.toThrow(/Cần thử Ask/);
  expect(paid).toHaveLength(0);
});
test("disable preserves lifetime reservation and idempotent replay never resets policy", async () => {
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  state.docs.set(budgetPath, { reservedVnd: 13000 });
  const req = adminRequest(
    { enabled: false, audience: "customers" },
    "saveAskCustomerPolicy",
    1,
  );
  const first = await runAdmin(req);
  expect(state.docs.get(policyPath)?.enabled).toBe(false);
  const expires = state.docs.get(policyPath)?.expiresAt;
  vi.advanceTimersByTime(1000);
  expect(await runAdmin(req)).toEqual(first);
  expect(state.docs.get(policyPath)?.expiresAt).toBe(expires);
  expect(state.docs.get(budgetPath)?.reservedVnd).toBe(13000);
  expect(fetch).not.toHaveBeenCalled();
});
test("stale policy write denied without overwriting existing version", async () => {
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  await expect(
    runAdmin(
      adminRequest(
        { enabled: false, audience: "customers" },
        "saveAskCustomerPolicy",
        0,
      ),
    ),
  ).rejects.toThrow();
  expect(state.docs.get(policyPath)?.version).toBe(1);
});
test("OWNER policy creation fixes ceiling, code expiry and canary account", async () => {
  state.docs.delete(policyPath);
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  await runAdmin(adminRequest({ enabled: true, audience: "owner-canary" }));
  expect(state.docs.get(policyPath)).toMatchObject({
    enabled: true,
    canaryUid: "owner",
    maxBudgetVnd: 50000,
    audience: "owner-canary",
    version: 1,
  });
  expect(state.docs.get(policyPath)?.expiresAt).toBe(Date.now() + 86400000);
  expect(paid).toHaveLength(0);
});
test("configuration read returns sanitized customer authority and unknown corrupt budget", async () => {
  state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
  state.docs.set(budgetPath, { reservedVnd: "bad" });
  const req = adminRequest({});
  const result = await readOwnerConfiguration.run({
    auth: req.auth,
    data: {},
  } as never);
  expect(result.customerAi.reservedVnd).toBeNull();
  expect(result.customerAi.maxBudgetVnd).toBe(50000);
  expect(result.customerAi).not.toHaveProperty("canaryUid");
});

import { readServerContext } from "../../functions/src/ai/server-context";
import { pilotAnswer } from "../../functions/src/ai/ask-pilot-answer";
const questionInput = {
  question: "Which fabric is easier to care for?",
  language: "en" as const,
  history: [],
  images: [],
};
test("customer server context needs no staff role; legacy pilot still requires OWNER", async () => {
  const context = await readServerContext(
    "customer",
    questionInput,
    "customer",
  );
  expect(context.currentFacts.order).toBeNull();
  await expect(readServerContext("customer", questionInput)).rejects.toThrow();
});
test("customer context cannot read a foreign conversation or order", async () => {
  const conversationId = "22222222-2222-4222-8222-222222222222";
  const ref = `askConversations/customer-${conversationId}`;
  state.docs.set(ref, {
    ownerId: "other",
    version: 1,
    updatedAt: Date.now(),
    turns: [],
  });
  await expect(
    readServerContext(
      "customer",
      { ...questionInput, conversationId },
      "customer",
    ),
  ).rejects.toThrow();
  state.docs.set(ref, {
    ownerId: "customer",
    version: 1,
    updatedAt: Date.now(),
    turns: [],
    orderId: "order-1",
  });
  state.docs.set("orders/order-1", {
    ownerId: "other",
    version: 1,
    stage: "REQUESTED",
  });
  await expect(
    readServerContext(
      "customer",
      { ...questionInput, conversationId, orderId: "order-1" },
      "customer",
    ),
  ).rejects.toThrow();
});
test.each(["valid", "invented-citation", "malformed", "changed-context"])(
  "real customer answer path validates %s before canary proof",
  async (kind) => {
    state.docs.set(policyPath, policy("owner-canary"));
    state.docs.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const conversationRef = `askConversations/owner-${conversationId}`;
    state.docs.set(conversationRef, {
      ownerId: "owner",
      version: 1,
      updatedAt: Date.now(),
      turns: [],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options: RequestInit) => {
        if (url.endsWith(":countTokens"))
          return Response.json({ totalTokens: 100 });
        paid.push(String(options.body));
        if (kind === "changed-context")
          state.docs.set(conversationRef, {
            ...state.docs.get(conversationRef),
            version: 2,
          });
        const value = {
          language: "en",
          title: "Fabric care",
          paragraphs: ["Check the care label before washing."],
          bullets: [],
          sourceIds: kind === "invented-citation" ? ["post:unapproved"] : [],
          action: "workflow",
        };
        return Response.json({
          ...answer,
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  { text: JSON.stringify(kind === "malformed" ? {} : value) },
                ],
              },
            },
          ],
        });
      }),
    );
    const result = pilotAnswer(
      "owner",
      { ...questionInput, conversationId },
      new AbortController().signal,
      "session-id",
    );
    if (kind === "valid") {
      expect((await result).title).toBe("Fabric care");
      expect(
        customerAiCanPromote(state.docs.get(budgetPath), "owner", Date.now()),
      ).toBe(true);
    } else {
      await expect(result).rejects.toThrow();
      expect(
        customerAiCanPromote(state.docs.get(budgetPath), "owner", Date.now()),
      ).toBe(false);
    }
    expect(state.docs.get(budgetPath)?.reservedVnd).toBe(1000);
  },
);
