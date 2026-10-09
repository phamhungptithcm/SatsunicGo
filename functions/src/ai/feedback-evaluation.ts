import { z } from "zod";
import { createHash } from "node:crypto";
import {
  retrieveKnowledge,
  type KnowledgeDocument,
} from "./knowledge-retrieval";

export const retrievalHoldoutSchema = z
  .object({
    version: z.number().int().positive().safe(),
    approved: z.literal(true),
    expiresAt: z.number().int().positive().safe(),
    cases: z
      .array(
        z
          .object({
            id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
            question: z.string().min(1).max(1000),
            expected: z
              .array(
                z
                  .object({
                    documentId: z.string().regex(/^post:[a-z0-9-]{2,100}$/),
                    requiredText: z.string().min(1).max(1200),
                  })
                  .strict(),
              )
              .max(8),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    (row) => new Set(row.cases.map((c) => c.id)).size === row.cases.length,
  );
/** Real lexical/chunk retrieval, frozen public QA expectations; no caller supplied scores or LLM accuracy claim. */
export function evaluateRetrievalHoldout(
  documents: readonly KnowledgeDocument[],
  value: unknown,
  now = Date.now(),
) {
  const holdout = retrievalHoldoutSchema.parse(value);
  if (holdout.expiresAt <= now || documents.length > 20)
    throw Error("HOLDOUT_UNAVAILABLE");
  const cases = holdout.cases.map((c) => {
    const actual = retrieveKnowledge(documents, c.question, 8);
    const ids = [...new Set(actual.map((r) => r.id))].sort(),
      expected = [...new Set(c.expected.map((r) => r.documentId))].sort();
    const passed =
      JSON.stringify(ids) === JSON.stringify(expected) &&
      c.expected.every((row) =>
        actual.some(
          (a) => a.id === row.documentId && a.text.includes(row.requiredText),
        ),
      );
    return { id: c.id, passed };
  });
  const hash = (row: unknown) =>
    createHash("sha256").update(JSON.stringify(row)).digest("hex");
  return {
    datasetHash: hash(holdout),
    corpusHash: hash([...documents].sort((a, b) => a.id.localeCompare(b.id))),
    cases,
    passed: cases.filter((c) => c.passed).length,
    total: cases.length,
    decision: cases.every((c) => c.passed)
      ? ("REVIEW_REQUIRED" as const)
      : ("REJECTED" as const),
    scope: "retrieval_only" as const,
    automaticPromotion: false as const,
  };
}
const score = z.number().min(0).max(1);
export const evaluationSchema = z
  .object({
    datasetHash: z.string().regex(/^[a-f0-9]{64}$/),
    candidateHash: z.string().regex(/^[a-f0-9]{64}$/),
    split: z.enum(["validation", "holdout"]),
    cases: z
      .array(
        z
          .object({
            id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
            supported: score,
            retrieval: score,
            taskSuccess: score,
            unsafe: z.boolean(),
            latencyMs: z.number().nonnegative().finite(),
          })
          .strict(),
      )
      .min(1)
      .max(1000),
  })
  .strict();
/** A frozen holdout comparison produces evidence only, never auto-promotion. */
export function evaluateFeedbackCandidate(
  baseline: unknown,
  candidate: unknown,
) {
  const b = evaluationSchema.parse(baseline),
    c = evaluationSchema.parse(candidate);
  if (
    b.split !== "holdout" ||
    c.split !== "holdout" ||
    b.datasetHash !== c.datasetHash ||
    b.cases.length !== c.cases.length ||
    new Set(b.cases.map((row) => row.id)).size !== b.cases.length ||
    new Set(c.cases.map((row) => row.id)).size !== c.cases.length
  )
    throw Error("EVALUATION_NOT_COMPARABLE");
  const originals = new Map(b.cases.map((row) => [row.id, row]));
  if (c.cases.some((row) => !originals.has(row.id)))
    throw Error("EVALUATION_NOT_COMPARABLE");
  const regressions = c.cases
    .filter((row) => {
      const old = originals.get(row.id)!;
      return (
        row.unsafe ||
        row.supported < old.supported ||
        row.retrieval < old.retrieval ||
        row.taskSuccess < old.taskSuccess
      );
    })
    .map((row) => row.id);
  return {
    decision: regressions.length
      ? ("REJECTED" as const)
      : ("REVIEW_REQUIRED" as const),
    regressions,
    datasetHash: c.datasetHash,
    candidateHash: c.candidateHash,
    automaticPromotion: false,
  };
}
