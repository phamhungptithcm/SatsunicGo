import { feedbackExecutionSchema } from "../../../packages/domain/ask-feedback";

export const testFeedbackRetention = {
  recordClass: "ask_feedback_production_test_v1",
  operationClass: "ask_feedback_test_review_v1",
  quotaClass: "ask_feedback_quota_v1",
  maxDays: 30,
} as const;

/** A partly tagged record cannot silently become real feedback. Legacy records
 * remain legacy; they are never retroactively relabeled by current test policy.
 */
export function feedbackExecution(row: Record<string, unknown>) {
  const keys = [
    "executionMode",
    "executionPolicyVersion",
    "testRunId",
    "testMode",
    "analyticsEligible",
  ];
  if (keys.every((key) => row[key] === undefined)) return undefined;
  return feedbackExecutionSchema.parse(
    Object.fromEntries(keys.map((key) => [key, row[key]])),
  );
}

export function feedbackAnalyticsEligible(row: Record<string, unknown>) {
  try {
    return !row.withdrawn && row.consent === true && !feedbackExecution(row);
  } catch {
    return false;
  }
}

/** A scheduler enabled for production tests cannot delete legacy records just
 * because they contain expiresAt. Only the specifically stamped class/duration
 * is admitted; version preconditions still protect races during deletion.
 */
export function feedbackCleanupEligible(
  collection: string,
  row: Record<string, unknown>,
  now: number,
) {
  const expiry = row.expiresAt as { toMillis?: () => number } | undefined;
  const expiresAt =
    typeof expiry?.toMillis === "function" ? expiry.toMillis() : NaN;
  const createdAt = row.createdAt;
  if (
    !Number.isSafeInteger(createdAt) ||
    Number(createdAt) <= 0 ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Number(createdAt) ||
    expiresAt > now
  )
    return false;
  if (collection === "askFeedbackQuota")
    return (
      row.retentionClass === testFeedbackRetention.quotaClass &&
      expiresAt - Number(createdAt) <= 172800000
    );
  try {
    if (!feedbackExecution(row)) return false;
  } catch {
    return false;
  }
  const days = row.retentionDays;
  const expectedClass =
    collection === "askFeedback"
      ? testFeedbackRetention.recordClass
      : collection === "askFeedbackReviewOperations"
        ? testFeedbackRetention.operationClass
        : null;
  return (
    expectedClass !== null &&
    row.retentionClass === expectedClass &&
    Number.isSafeInteger(days) &&
    Number(days) >= 1 &&
    Number(days) <= testFeedbackRetention.maxDays &&
    expiresAt - Number(createdAt) <= Number(days) * 86400000
  );
}
