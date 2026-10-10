import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { productionTestArtifactEnvironmentAllowed } from "../production-test-policy";

export const feedbackRetentionIndexes = [
  "askFeedback",
  "askFeedbackReviewOperations",
  "askFeedbackQuota",
].map((collectionGroup) => ({
  collectionGroup,
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "retentionClass", order: "ASCENDING" },
    { fieldPath: "expiresAt", order: "ASCENDING" },
  ],
}));
export const feedbackRetentionIndexDigest = createHash("sha256")
  .update(JSON.stringify(feedbackRetentionIndexes))
  .digest("hex");
export const feedbackRetentionSchedulerName =
  "projects/satsunicgo/locations/asia-southeast1/jobs/firebase-schedule-askFeedbackCleanup-asia-southeast1";
const sha = z.string().regex(/^[a-f0-9]{40}$/);
const tag = z.string().regex(/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const time = z.number().int().positive().safe();
const identity = {
  artifactSha: sha,
  artifactTag: tag,
  indexDigest: z.literal(feedbackRetentionIndexDigest),
};
const artifactSchema = z
  .object({
    schemaVersion: z.literal(1),
    project: z.literal("satsunicgo"),
    database: z.literal("(default)"),
    ...identity,
    indexes: z.unknown(),
  })
  .strict();
export type FeedbackRetentionArtifact = z.infer<typeof artifactSchema>;
export const feedbackRetentionPolicySchema = z
  .object({
    schemaVersion: z.literal(1),
    enabled: z.literal(true),
    approved: z.literal(true),
    version: z.number().int().positive().safe(),
    ...identity,
    effectiveFrom: time,
    expiresAt: time,
    feedbackMaxDays: z.literal(30),
    quotaMaxHours: z.literal(48),
  })
  .strict();
const readinessSchema = z
  .object({
    schemaVersion: z.literal(1),
    ...identity,
    verifiedAt: time,
    expiresAt: time,
    indexNames: z.array(z.string()).length(3),
    indexState: z.literal("READY"),
    scheduler: z
      .object({
        name: z.literal(feedbackRetentionSchedulerName),
        state: z.literal("ENABLED"),
        uri: z
          .string()
          .max(512)
          .regex(
            /^https:\/\/(askfeedbackcleanup-[a-z0-9-]+\.a\.run\.app|asia-southeast1-satsunicgo\.cloudfunctions\.net\/askFeedbackCleanup)$/,
          ),
        revision: z.string().regex(/^[a-z0-9-]{1,128}$/),
      })
      .strict(),
    receiptSha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

/** Fixed field order survives Firestore map reordering. This checksum detects
 * stale/tampered operator evidence; protected settings IAM supplies authority.
 */
export function feedbackRetentionReadinessDigest(
  row: Omit<z.infer<typeof readinessSchema>, "receiptSha256">,
) {
  const payload = {
    schemaVersion: row.schemaVersion,
    artifactSha: row.artifactSha,
    artifactTag: row.artifactTag,
    indexDigest: row.indexDigest,
    verifiedAt: row.verifiedAt,
    expiresAt: row.expiresAt,
    indexNames: row.indexNames,
    indexState: row.indexState,
    scheduler: {
      name: row.scheduler.name,
      state: row.scheduler.state,
      uri: row.scheduler.uri,
      revision: row.scheduler.revision,
    },
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/** No artifact identity fallback: source/emulator runtimes never obtain deletion authority. */
export function readFeedbackRetentionArtifact(): FeedbackRetentionArtifact | null {
  try {
    const root = resolve(__dirname, "../../../..");
    const artifact = artifactSchema.safeParse(
      JSON.parse(
        readFileSync(resolve(root, "feedback-retention.json"), "utf8"),
      ),
    );
    const release = JSON.parse(
      readFileSync(resolve(root, "release.json"), "utf8"),
    );
    if (
      !artifact.success ||
      release.schemaVersion !== 1 ||
      release.project !== "satsunicgo" ||
      release.sha !== artifact.data.artifactSha ||
      release.tag !== artifact.data.artifactTag ||
      JSON.stringify(artifact.data.indexes) !==
        JSON.stringify(feedbackRetentionIndexes)
    )
      return null;
    return artifact.data;
  } catch {
    return null;
  }
}
export function feedbackRetentionEnvironment(
  db: { databaseId: string; projectId?: unknown },
  env: NodeJS.ProcessEnv = process.env,
) {
  return (
    productionTestArtifactEnvironmentAllowed(env) &&
    db.projectId === "satsunicgo" &&
    db.databaseId === "(default)"
  );
}

/** These protected settings are read in the SAME transaction as every deletion.
 * New tester/feedback admission may be disabled without stranding existing expiry.
 */
export function admitFeedbackRetention(
  rawPolicy: unknown,
  rawReadiness: unknown,
  artifact: FeedbackRetentionArtifact,
  now: number,
) {
  const policy = feedbackRetentionPolicySchema.safeParse(rawPolicy);
  const readiness = readinessSchema.safeParse(rawReadiness);
  if (
    !policy.success ||
    !readiness.success ||
    !Number.isSafeInteger(now) ||
    now <= 0
  )
    return false;
  const p = policy.data,
    r = readiness.data;
  if (r.receiptSha256 !== feedbackRetentionReadinessDigest(r)) return false;
  const maximumValidity = 7 * 86400000;
  if (
    [p, r].some(
      (row) =>
        row.artifactSha !== artifact.artifactSha ||
        row.artifactTag !== artifact.artifactTag ||
        row.indexDigest !== artifact.indexDigest ||
        row.expiresAt <= now,
    ) ||
    p.effectiveFrom > now ||
    p.expiresAt <= p.effectiveFrom ||
    p.expiresAt - p.effectiveFrom > maximumValidity ||
    r.verifiedAt > now ||
    r.expiresAt <= r.verifiedAt ||
    r.expiresAt - r.verifiedAt > maximumValidity
  )
    return false;
  return feedbackRetentionIndexes.every(({ collectionGroup }, index) =>
    new RegExp(
      `^projects/satsunicgo/databases/\\(default\\)/collectionGroups/${collectionGroup}/indexes/[A-Za-z0-9_-]+$`,
    ).test(r.indexNames[index]),
  );
}
