import { beforeEach, expect, test, vi } from "vitest";
const files = vi.hoisted(() => ({
  artifact: "",
  release: "",
  paths: [] as string[],
}));
vi.mock("node:fs", () => ({
  readFileSync: (path: string) => {
    files.paths.push(path);
    return path.endsWith("/feedback-retention.json")
      ? files.artifact
      : files.release;
  },
}));
import {
  admitFeedbackRetention,
  feedbackRetentionReadinessDigest,
  feedbackRetentionEnvironment,
  feedbackRetentionIndexes,
  feedbackRetentionIndexDigest,
  feedbackRetentionSchedulerName,
  readFeedbackRetentionArtifact,
} from "../../functions/src/ai/feedback-retention-gate";
const now = 1791597600000;
const identity = {
  artifactSha: "a".repeat(40),
  artifactTag: "v1.2.3",
  indexDigest: feedbackRetentionIndexDigest,
};
const artifact = {
  schemaVersion: 1 as const,
  project: "satsunicgo" as const,
  database: "(default)" as const,
  ...identity,
  indexes: feedbackRetentionIndexes,
};
const policy = () => ({
  schemaVersion: 1,
  enabled: true,
  approved: true,
  version: 1,
  ...identity,
  effectiveFrom: now - 1,
  expiresAt: now + 86400000,
  feedbackMaxDays: 30,
  quotaMaxHours: 48,
});
const readiness = () => {
  const row = {
    schemaVersion: 1,
    ...identity,
    verifiedAt: now - 1,
    expiresAt: now + 86400000,
    indexNames: feedbackRetentionIndexes.map(
      (row) =>
        `projects/satsunicgo/databases/(default)/collectionGroups/${row.collectionGroup}/indexes/synthetic`,
    ),
    indexState: "READY",
    scheduler: {
      name: feedbackRetentionSchedulerName,
      state: "ENABLED",
      uri: "https://askfeedbackcleanup-synthetic.a.run.app",
      revision: "synthetic-1",
    },
    receiptSha256: "b".repeat(64),
  };
  return {
    ...row,
    receiptSha256: feedbackRetentionReadinessDigest(
      row as Parameters<typeof feedbackRetentionReadinessDigest>[0],
    ),
  };
};
beforeEach(() => {
  files.artifact = JSON.stringify(artifact);
  files.release = JSON.stringify({
    schemaVersion: 1,
    project: "satsunicgo",
    sha: identity.artifactSha,
    tag: identity.artifactTag,
    runId: "synthetic",
  });
  files.paths = [];
});
test("runtime requires immutable packaged retention and release identities with exact three-index digest", () => {
  expect(readFeedbackRetentionArtifact()).toEqual(artifact);
  expect(files.paths.map((path) => path.split("/").at(-1))).toEqual([
    "feedback-retention.json",
    "release.json",
  ]);
});
test.each([
  "missing",
  "invalid json",
  "wrong sha",
  "wrong project",
  "wrong index spec",
  "unknown metadata",
])("runtime artifact fails closed: %s", (reason) => {
  if (reason === "missing") files.artifact = "";
  if (reason === "invalid json") files.artifact = "{";
  if (reason === "wrong sha")
    files.release = JSON.stringify({
      schemaVersion: 1,
      project: "satsunicgo",
      sha: "c".repeat(40),
      tag: identity.artifactTag,
    });
  if (reason === "wrong project")
    files.release = JSON.stringify({
      schemaVersion: 1,
      project: "demo-satsunicgo",
      sha: identity.artifactSha,
      tag: identity.artifactTag,
    });
  if (reason === "wrong index spec")
    files.artifact = JSON.stringify({
      ...artifact,
      indexes: feedbackRetentionIndexes.slice(0, 2),
    });
  if (reason === "unknown metadata")
    files.artifact = JSON.stringify({ ...artifact, allowLegacy: true });
  expect(readFeedbackRetentionArtifact()).toBeNull();
});
test("retention environment checks exact real default database independently of new admission", () => {
  const env = {
    PURCHASE_PRODUCTION_TEST_ARTIFACT: "v1",
    GCLOUD_PROJECT: "satsunicgo",
    FIREBASE_CONFIG: '{"projectId":"satsunicgo"}',
  };
  expect(
    feedbackRetentionEnvironment(
      { projectId: "satsunicgo", databaseId: "(default)" },
      env,
    ),
  ).toBe(true);
  expect(
    feedbackRetentionEnvironment(
      { projectId: "satsunicgo", databaseId: "secondary" },
      env,
    ),
  ).toBe(false);
  expect(
    feedbackRetentionEnvironment(
      { projectId: "other", databaseId: "(default)" },
      env,
    ),
  ).toBe(false);
  expect(
    feedbackRetentionEnvironment(
      { projectId: "satsunicgo", databaseId: "(default)" },
      { ...env, FIRESTORE_EMULATOR_HOST: "localhost" },
    ),
  ).toBe(false);
});
test("independent current activation and READY receipt admit only exact artifact scope", () =>
  expect(admitFeedbackRetention(policy(), readiness(), artifact, now)).toBe(
    true,
  ));
test.each([
  ["disabled policy", { enabled: false }],
  ["unapproved policy", { approved: false }],
  ["extended feedback", { feedbackMaxDays: 31 }],
  ["extended quota", { quotaMaxHours: 49 }],
  ["unknown class override", { allowLegacy: true }],
  ["future policy", { effectiveFrom: now + 1 }],
  ["expired policy", { expiresAt: now }],
  ["overlong policy", { expiresAt: now + 8 * 86400000 }],
  ["wrong artifact", { artifactSha: "c".repeat(40) }],
  ["wrong digest", { indexDigest: "d".repeat(64) }],
])("policy denies %s", (_label, delta) =>
  expect(
    admitFeedbackRetention(
      { ...policy(), ...delta },
      readiness(),
      artifact,
      now,
    ),
  ).toBe(false),
);
test.each([
  ["index not ready", { indexState: "CREATING" }],
  ["missing index", { indexNames: [] }],
  ["wrong group", { indexNames: readiness().indexNames.toReversed() }],
  ["missing scheduler", { scheduler: {} }],
  ["expired receipt", { expiresAt: now }],
  ["future receipt", { verifiedAt: now + 1 }],
  ["wrong receipt artifact", { artifactTag: "v2.0.0" }],
  ["unknown receipt field", { unverified: true }],
])("readiness denies %s", (_label, delta) =>
  expect(
    admitFeedbackRetention(
      policy(),
      { ...readiness(), ...delta },
      artifact,
      now,
    ),
  ).toBe(false),
);

test("canonical readiness checksum accepts reordered Firestore maps", () => {
  const row = readiness();
  const reordered = {
    scheduler: Object.fromEntries(Object.entries(row.scheduler).toReversed()),
    ...Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => key !== "scheduler")
        .toReversed(),
    ),
  };
  expect(admitFeedbackRetention(policy(), reordered, artifact, now)).toBe(true);
});
test.each([
  "verifiedAt",
  "expiresAt",
  "indexNames",
  "scheduler",
  "receiptSha256",
])(
  "readiness content tampering with an unchanged checksum is denied: %s",
  (field) => {
    const row = readiness();
    if (field === "verifiedAt") row.verifiedAt = now - 2;
    if (field === "expiresAt") row.expiresAt = now + 1000;
    if (field === "indexNames")
      row.indexNames[0] = row.indexNames[0] + "different";
    if (field === "scheduler") row.scheduler.revision = "changed-1";
    if (field === "receiptSha256") row.receiptSha256 = "f".repeat(64);
    expect(admitFeedbackRetention(policy(), row, artifact, now)).toBe(false);
  },
);
