import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";
const state = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    projectId: "satsunicgo",
    doc: (path: string) => ({
      path,
      get: async () => ({ data: () => state.rows.get(path) }),
      collection: (name: string) => ({
        doc: (id: string) => ({ path: `${path}/${name}/${id}` }),
      }),
    }),
    runTransaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        get: async ({ path }: { path: string }) => ({
          exists: state.rows.has(path),
          data: () => state.rows.get(path),
        }),
        create: ({ path }: { path: string }, data: Record<string, unknown>) => {
          if (state.rows.has(path)) throw Error("Synthetic create collision");
          state.rows.set(path, data);
        },
        set: (
          { path }: { path: string },
          data: Record<string, unknown>,
          options?: { merge: boolean },
        ) =>
          state.rows.set(
            path,
            options?.merge ? { ...state.rows.get(path), ...data } : data,
          ),
      }),
  }),
}));
vi.mock("../../functions/src/index", () => ({ command: { run: vi.fn() } }));
import {
  askFeedback,
  askFeedbackPolicy,
  feedbackHash,
} from "../../functions/src/ai/feedback";
import {
  feedbackCleanupEligible,
  feedbackExecution,
  feedbackAnalyticsEligible,
  testFeedbackRetention,
} from "../../functions/src/ai/feedback-provenance";
import { inboxRow } from "../../functions/src/ai/feedback-lifecycle";
import { productionTestPolicySchema } from "../../functions/src/production-test-policy";
import { askWorkflow } from "../../functions/src/ai/ask-workflow";

const now = Date.parse("2026-10-10T01:00:00Z"),
  id = "11111111-1111-4111-8111-111111111111",
  operationId = "22222222-2222-4222-8222-222222222222",
  answer = {
    language: "vi",
    title: "Test",
    paragraphs: ["Public answer"],
    bullets: [],
    sourceIds: [],
    action: "workflow",
  };
const request = (data: unknown) =>
  ({
    auth: {
      uid: "tester",
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;
const input = () => ({
  operationId,
  conversationId: id,
  expectedVersion: 1,
  answerHash: feedbackHash(answer),
  submittedAt: Date.now(),
  expectedPolicyVersion: 1,
  consent: true,
  category: "helpful",
});
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
    "GOOGLE_CLOUD_PROJECT",
  ])
    vi.stubEnv(key, undefined);
  state.rows.clear();
  state.rows.set(
    "settings/productionTest",
    productionTestPolicySchema.parse({
      enabled: true,
      approved: true,
      version: 3,
      effectiveFrom: now - 1000,
      expiresAt: now + 60000,
      origin: "https://satsunicgo.web.app",
      provider: "sepay_sandbox",
      testerUids: ["tester"],
    }),
  );
  state.rows.set("settings/askFeedback", {
    enabled: true,
    version: 1,
    retentionDays: 90,
    expiresAt: now + 60000,
  });
  state.rows.set(`askConversations/tester-${id}`, {
    ownerId: "tester",
    version: 1,
    updatedAt: now,
    turns: [{ id, question: "Public question", answer }],
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
test("feedback producer derives immutable test provenance and30-day retention without raw chat", async () => {
  expect((await askFeedbackPolicy.run(request({}))).retentionDays).toBe(30);
  await askFeedback.run(request(input()));
  const saved = state.rows.get(`askFeedback/tester-${operationId}`)!;
  expect(saved).toMatchObject({
    executionMode: "production_test",
    executionPolicyVersion: 3,
    testMode: true,
    analyticsEligible: false,
    retentionClass: testFeedbackRetention.recordClass,
    retentionDays: 30,
  });
  expect(saved.testRunId).not.toBe(operationId);
  expect(saved.testRunId).toMatch(/^[a-f0-9-]{36}$/);
  expect(JSON.stringify(saved)).not.toMatch(/Public question|Public answer/);
  expect(feedbackAnalyticsEligible(saved)).toBe(false);
  const original = saved.testRunId;
  saved.expiresAt = { toMillis: () => now + 60000 };
  state.rows.delete("settings/productionTest");
  await askFeedback.run(request(input()));
  expect(state.rows.get(`askFeedback/tester-${operationId}`)?.testRunId).toBe(
    original,
  );
});
test("client cannot forge mode and unlisted or wrong-environment users cannot obtain test provenance", async () => {
  await expect(
    askFeedback.run(request({ ...input(), testMode: true })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  state.rows.set("settings/productionTest", {
    ...state.rows.get("settings/productionTest"),
    testerUids: ["other"],
  });
  await askFeedback.run(request(input()));
  expect(
    feedbackExecution(state.rows.get(`askFeedback/tester-${operationId}`)!),
  ).toBeUndefined();
  state.rows.delete(`askFeedback/tester-${operationId}`);
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207");
  await askFeedback.run(request(input()));
  expect(
    feedbackExecution(state.rows.get(`askFeedback/tester-${operationId}`)!),
  ).toBeUndefined();
});
test("saved test answer keeps server provenance through policy disable and cannot become real feedback", async () => {
  state.rows.set("settings/askCommerce", { enabled: true, approved: true });
  const turn = { id, question: "Public question", answer };
  // Real handler reads requireCommerceEnabled outside its transaction.
  const data = {
    conversationId: id,
    operationId: "33333333-3333-4333-8333-333333333333",
    expectedVersion: 1,
    action: "saveTurn",
    payload: turn,
  };
  await askWorkflow.run(request(data));
  const saved = state.rows.get(`askConversations/tester-${id}`)!;
  expect(saved.turnProvenance).toHaveProperty(id);
  state.rows.delete("settings/productionTest");
  await askFeedback.run(request({ ...input(), expectedVersion: 2 }));
  expect(state.rows.get(`askFeedback/tester-${operationId}`)).toMatchObject({
    testMode: true,
    analyticsEligible: false,
    executionPolicyVersion: 3,
  });
});
test("test staff inbox is labeled, malformed provenance cannot be laundered into real analytics", () => {
  const row = {
    consent: true,
    category: "helpful",
    reviewVersion: 1,
    createdAt: now,
    expiresAt: { toMillis: () => now + 1000 },
    disposition: "unreviewed",
    executionMode: "production_test",
    executionPolicyVersion: 3,
    testRunId: id,
    testMode: true,
    analyticsEligible: false,
  };
  expect(inboxRow({ id: `tester-${id}`, data: () => row }, now)?.testMode).toBe(
    true,
  );
  for (const delta of [
    { testMode: false },
    { analyticsEligible: true },
    { testRunId: "invalid" },
  ]) {
    const corrupt = { ...row, ...delta };
    expect(feedbackAnalyticsEligible(corrupt)).toBe(false);
    expect(
      inboxRow({ id: `tester-${id}`, data: () => corrupt }, now),
    ).toBeNull();
  }
});
test("retention deletes only approved class/duration and exact expiry boundary", () => {
  const row = {
    createdAt: now,
    expiresAt: { toMillis: () => now + 86400000 },
    retentionDays: 1,
    retentionClass: testFeedbackRetention.recordClass,
    executionMode: "production_test",
    executionPolicyVersion: 3,
    testRunId: id,
    testMode: true,
    analyticsEligible: false,
  };
  expect(feedbackCleanupEligible("askFeedback", row, now + 86400000 - 1)).toBe(
    false,
  );
  expect(feedbackCleanupEligible("askFeedback", row, now + 86400000)).toBe(
    true,
  );
  for (const delta of [
    { retentionClass: undefined },
    { retentionDays: 90 },
    { analyticsEligible: true },
    { expiresAt: { toMillis: () => now + 86400001 } },
  ])
    expect(
      feedbackCleanupEligible(
        "askFeedback",
        { ...row, ...delta },
        now + 90 * 86400000,
      ),
    ).toBe(false);
  expect(feedbackCleanupEligible("financialEntries", row, now + 86400000)).toBe(
    false,
  );
});
