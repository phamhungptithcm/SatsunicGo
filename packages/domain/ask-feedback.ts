import { z } from "zod";
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const feedbackExecutionSchema = z
  .object({
    executionMode: z.literal("production_test"),
    executionPolicyVersion: z.number().int().positive().safe(),
    testRunId: z.string().uuid(),
    testMode: z.literal(true),
    analyticsEligible: z.literal(false),
  })
  .strict();
export const feedbackPolicySchema = z
  .object({
    enabled: z.boolean(),
    version: z.number().int().positive().safe(),
    retentionDays: z.number().int().min(1).max(90),
    expiresAt: z.number().int().positive().safe(),
  })
  .strict();
export const askFeedbackSchema = z
  .object({
    operationId: z.string().uuid(),
    submittedAt: z.number().int().positive().safe(),
    expectedPolicyVersion: z.number().int().positive().safe(),
    conversationId: z.string().uuid(),
    expectedVersion: z.number().int().positive().safe(),
    answerHash: hash,
    consent: z.literal(true),
    category: z.enum([
      "helpful",
      "missing_information",
      "incorrect_information",
      "hard_to_understand",
    ]),
  })
  .strict();
export const feedbackReviewSchema = z
  .object({
    operationId: z.string().uuid(),
    ownerId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
    feedbackId: z.string().uuid(),
    expectedVersion: z.number().int().positive().safe(),
    disposition: z.enum(["acknowledged", "needs_source_review", "resolved"]),
    source: z
      .object({
        key: z.string().regex(/^(?:posts|blogPublished)-[A-Za-z0-9_-]{1,100}$/),
        version: z.number().int().positive().safe(),
        contentHash: hash,
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((row) => row.disposition !== "resolved" || !!row.source);

export const feedbackWithdrawalSchema = z
  .object({ feedbackId: z.string().uuid() })
  .strict();
export const feedbackInboxSchema = z
  .object({
    rows: z
      .array(
        z
          .object({
            ownerId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
            feedbackId: z.string().uuid(),
            category: askFeedbackSchema.shape.category,
            reviewVersion: z.number().int().positive().safe(),
            createdAt: z.number().int().positive().safe(),
            expiresAt: z.number().int().positive().safe(),
            disposition: z.enum([
              "unreviewed",
              "acknowledged",
              "needs_source_review",
              "resolved",
            ]),
            testMode: z.literal(true).optional(),
          })
          .strict(),
      )
      .max(50),
    limited: z.boolean(),
  })
  .strict();
export const feedbackEvaluationResultSchema = z
  .object({
    datasetHash: hash,
    corpusHash: hash,
    cases: z
      .array(
        z
          .object({
            id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
            passed: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    passed: z.number().int().nonnegative().max(100),
    total: z.number().int().positive().max(100),
    decision: z.enum(["REVIEW_REQUIRED", "REJECTED"]),
    scope: z.literal("retrieval_only"),
    automaticPromotion: z.literal(false),
  })
  .strict()
  .refine(
    (row) =>
      row.total === row.cases.length &&
      row.passed === row.cases.filter((c) => c.passed).length &&
      (row.decision === "REVIEW_REQUIRED") === (row.passed === row.total),
  );
