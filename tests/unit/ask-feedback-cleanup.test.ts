import { beforeEach, afterEach, expect, test, vi } from "vitest";
const state = vi.hoisted(() => ({
  reads: [] as {
    collection: string;
    field: string;
    value: Date;
    limit: number;
  }[],
  settingsReads: [] as string[],
  deletes: [] as { ref: string; precondition: unknown }[],
  commits: 0,
  transactions: 0,
  firestoreCalls: 0,
  changed: false,
  legacy: false,
  artifact: true,
  disableAfterFirst: false,
  revokeDuringCommit: false,
  expireDuringQuery: false,
  projectId: "satsunicgo",
  databaseId: "(default)",
  policy: {} as Record<string, unknown>,
  readiness: {} as Record<string, unknown>,
}));
vi.mock(
  "../../functions/src/ai/feedback-retention-gate",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../functions/src/ai/feedback-retention-gate")
      >();
    return {
      ...actual,
      readFeedbackRetentionArtifact: () =>
        state.artifact
          ? {
              schemaVersion: 1,
              project: "satsunicgo",
              database: "(default)",
              artifactSha: "a".repeat(40),
              artifactTag: "v1.2.3",
              indexDigest: actual.feedbackRetentionIndexDigest,
              indexes: actual.feedbackRetentionIndexes,
            }
          : null,
    };
  },
);
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => {
    state.firestoreCalls++;
    return {
      projectId: state.projectId,
      databaseId: state.databaseId,
      doc: (path: string) => ({ path }),
      collection: (collection: string) => ({
        where: (
          _classField: string,
          _classOperator: string,
          recordClass: string,
        ) => ({
          where: (field: string, _operator: string, value: Date) => ({
            limit: (limit: number) => ({
              collection,
              field,
              value,
              limit,
              recordClass,
            }),
          }),
        }),
      }),
      runTransaction: async (
        callback: (tx: unknown) => Promise<number>,
        options: { maxAttempts: number },
      ) => {
        expect(options).toEqual({ maxAttempts: 3 });
        for (let attempt = 0; attempt < 3; attempt++) {
          state.transactions++;
          const pending: typeof state.deletes = [];
          const result = await callback({
            get: async (ref: {
              path?: string;
              collection?: string;
              field?: string;
              value?: Date;
              limit?: number;
              recordClass?: string;
            }) => {
              if (ref.path) {
                state.settingsReads.push(ref.path);
                const row = {
                  ...(ref.path === "settings/askFeedbackRetention"
                    ? state.policy
                    : state.readiness),
                };
                return { data: () => row };
              }
              const { collection, field, value, limit, recordClass } =
                ref as Required<typeof ref>;
              state.reads.push({ collection, field, value, limit });
              if (state.expireDuringQuery)
                vi.setSystemTime(Number(state.policy.expiresAt));
              return {
                size: 1,
                docs: [
                  {
                    ref: `synthetic/${collection}`,
                    updateTime: "immutable-snapshot-time",
                    data: () =>
                      state.legacy
                        ? {}
                        : {
                            createdAt: value.getTime() - 86400000,
                            expiresAt: { toMillis: () => value.getTime() },
                            retentionClass: recordClass,
                            retentionDays: 1,
                            executionMode: "production_test",
                            executionPolicyVersion: 1,
                            testRunId: "11111111-1111-4111-8111-111111111111",
                            testMode: true,
                            analyticsEligible: false,
                          },
                  },
                ],
              };
            },
            delete: (ref: string, precondition: unknown) =>
              pending.push({ ref, precondition }),
          });
          if (state.revokeDuringCommit && pending.length) {
            state.revokeDuringCommit = false;
            state.policy.enabled = false;
            continue; // Firestore conflicts restart the whole callback with a new read-set.
          }
          if (state.changed && pending.length)
            throw Error("Synthetic update-time mismatch");
          if (pending.length) {
            state.deletes.push(...pending);
            state.commits++;
            if (state.disableAfterFirst) state.policy.enabled = false;
          }
          return result;
        }
        throw Error("Synthetic transaction retry budget exceeded");
      },
    };
  },
}));
import {
  purgeExpiredFeedback,
  askFeedbackCleanup,
} from "../../functions/src/ai/feedback-lifecycle";
import {
  feedbackRetentionReadinessDigest,
  feedbackRetentionIndexDigest,
  feedbackRetentionIndexes,
  feedbackRetentionSchedulerName,
} from "../../functions/src/ai/feedback-retention-gate";
const now = 1791597600000;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  state.reads = [];
  state.settingsReads = [];
  state.deletes = [];
  state.commits = 0;
  state.transactions = 0;
  state.firestoreCalls = 0;
  state.changed = false;
  state.legacy = false;
  state.artifact = true;
  state.disableAfterFirst = false;
  state.revokeDuringCommit = false;
  state.expireDuringQuery = false;
  state.projectId = "satsunicgo";
  state.databaseId = "(default)";
  const identity = {
    artifactSha: "a".repeat(40),
    artifactTag: "v1.2.3",
    indexDigest: feedbackRetentionIndexDigest,
  };
  state.policy = {
    schemaVersion: 1,
    enabled: true,
    approved: true,
    version: 1,
    ...identity,
    effectiveFrom: now - 1,
    expiresAt: now + 86400000,
    feedbackMaxDays: 30,
    quotaMaxHours: 48,
  };
  state.readiness = {
    schemaVersion: 1,
    ...identity,
    verifiedAt: now - 1,
    expiresAt: now + 86400000,
    indexState: "READY",
    indexNames: feedbackRetentionIndexes.map(
      (row) =>
        `projects/satsunicgo/databases/(default)/collectionGroups/${row.collectionGroup}/indexes/synthetic`,
    ),
    scheduler: {
      name: feedbackRetentionSchedulerName,
      state: "ENABLED",
      uri: "https://askfeedbackcleanup-synthetic.a.run.app",
      revision: "synthetic-1",
    },
    receiptSha256: "b".repeat(64),
  };
  state.readiness.receiptSha256 = feedbackRetentionReadinessDigest(
    state.readiness as Parameters<typeof feedbackRetentionReadinessDigest>[0],
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
test("cleanup never deletes unclassified legacy feedback under the test retention approval", async () => {
  state.legacy = true;
  expect(await purgeExpiredFeedback()).toEqual({ deleted: 0 });
  expect(state.commits).toBe(0);
  expect(state.deletes).toEqual([]);
});
test("cleanup bounds each class query and deletes only exact versions inside policy/readiness transactions", async () => {
  expect(await purgeExpiredFeedback(now)).toEqual({ deleted: 3 });
  expect(state.reads).toHaveLength(3);
  expect(state.transactions).toBe(3);
  expect(state.settingsReads).toEqual(
    Array.from({ length: 3 }, () => [
      "settings/askFeedbackRetention",
      "settings/askFeedbackRetentionReadiness",
    ]).flat(),
  );
  for (const read of state.reads) {
    expect(read.field).toBe("expiresAt");
    expect(read.limit).toBe(100);
    expect(read.value.getTime()).toBe(now);
  }
  for (const deletion of state.deletes)
    expect(deletion.precondition).toEqual({
      lastUpdateTime: "immutable-snapshot-time",
    });
});
test("cleanup changed record aborts transaction; malformed time performs no database work", async () => {
  state.changed = true;
  await expect(purgeExpiredFeedback()).rejects.toThrow(
    "Synthetic update-time mismatch",
  );
  expect(state.commits).toBe(0);
  state.reads = [];
  await expect(purgeExpiredFeedback(NaN)).rejects.toThrow("INVALID_PURGE_TIME");
  expect(state.reads).toEqual([]);
});
test.each([
  "missing artifact",
  "wrong environment",
  "wrong actual database",
  "missing policy",
  "missing readiness",
  "expired policy",
  "wrong digest",
])("cleanup defaults inactive: %s", async (reason) => {
  if (reason === "missing artifact") state.artifact = false;
  if (reason === "wrong environment")
    vi.stubEnv("GCLOUD_PROJECT", "demo-satsunicgo");
  if (reason === "wrong actual database") state.databaseId = "other";
  if (reason === "missing policy") state.policy = {};
  if (reason === "missing readiness") state.readiness = {};
  if (reason === "expired policy") state.policy.expiresAt = now;
  if (reason === "wrong digest") state.readiness.indexDigest = "f".repeat(64);
  expect(await purgeExpiredFeedback()).toEqual({ deleted: 0 });
  expect(state.deletes).toEqual([]);
  expect(state.reads).toEqual([]);
  if (reason === "wrong environment" || reason === "missing artifact")
    expect(state.firestoreCalls).toBe(0);
});
test("concurrent revocation retries the transaction and discards all pending deletes", async () => {
  state.revokeDuringCommit = true;
  expect(await purgeExpiredFeedback()).toEqual({ deleted: 0 });
  expect(state.deletes).toEqual([]);
  expect(state.transactions).toBe(4);
});
test("disable after first collection prevents subsequent class queries and deletes", async () => {
  state.disableAfterFirst = true;
  expect(await purgeExpiredFeedback()).toEqual({ deleted: 1 });
  expect(state.reads).toHaveLength(1);
  expect(state.deletes).toHaveLength(1);
});
test("policy expiry while query is pending prevents all deletes", async () => {
  state.expireDuringQuery = true;
  expect(await purgeExpiredFeedback()).toEqual({ deleted: 0 });
  expect(state.deletes).toEqual([]);
});
test("turning off new tester admission does not strand already approved feedback expiry", async () => {
  // The only settings reads are independent retention documents; no productionTest admission read.
  expect(await purgeExpiredFeedback()).toEqual({ deleted: 3 });
  expect(
    state.settingsReads.some(
      (path) =>
        path === "settings/productionTest" || path === "settings/askFeedback",
    ),
  ).toBe(false);
});

test("real SDK scheduler metadata pins UTC, timeout and no retry", () => {
  const endpoint = (
    askFeedbackCleanup as unknown as { __endpoint: Record<string, unknown> }
  ).__endpoint;
  expect(endpoint.timeoutSeconds).toBe(60);
  expect(endpoint.region).toEqual(["asia-southeast1"]);
  expect(endpoint.scheduleTrigger).toMatchObject({
    schedule: "every 60 minutes",
    timeZone: "UTC",
    retryConfig: { retryCount: 0, maxRetrySeconds: 0 },
  });
});
