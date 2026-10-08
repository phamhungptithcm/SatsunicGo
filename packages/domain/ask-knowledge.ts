import { z } from "zod";

const source = z.enum(["posts", "blogPublished"]);
const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
export const knowledgePreviewSchema = z
  .object({ source, sourceId: identifier })
  .strict();
export const knowledgePreviewResultSchema = z
  .object({
    source,
    sourceId: identifier,
    title: z.string().max(200),
    body: z.string().max(20000),
    published: z.boolean(),
    contentHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    version: z.number().int().nonnegative().safe(),
  active: z.boolean(),
  approved: z.boolean(),
  })
  .strict();
export const knowledgeCommandSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("approve"),
      operationId: z.string().uuid(),
      source,
      sourceId: identifier,
      expectedVersion: z.number().int().nonnegative().safe(),
      contentHash: z.string().regex(/^[a-f0-9]{64}$/),
      language: z.enum(["vi", "en"]),
      effectiveFrom: z.number().int().nonnegative().safe(),
      effectiveTo: z.number().int().positive().safe(),
    })
    .strict()
    .refine((row) => row.effectiveTo > row.effectiveFrom),
  z
    .object({
      action: z.literal("revoke"),
      operationId: z.string().uuid(),
      source,
      sourceId: identifier,
      expectedVersion: z.number().int().positive().safe(),
    })
    .strict(),
]);
export const approvedKnowledgeSchema = z
  .object({
    schemaVersion: z.literal(1),
    source,
    sourceId: identifier,
    version: z.number().int().positive().safe(),
    active: z.boolean(),
    language: z.enum(["vi", "en"]),
    effectiveFrom: z.number().int().nonnegative().safe(),
    effectiveTo: z.number().int().positive().safe(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    reviewedBy: z.string().min(1).max(128),
    reviewedAt: z.number().int().nonnegative().safe(),
  })
  .strict()
  .refine((row) => row.effectiveTo > row.effectiveFrom);
export function activeKnowledge(
  value: unknown,
  language: "vi" | "en",
  now: number,
) {
  const parsed = approvedKnowledgeSchema.safeParse(value);
  return parsed.success &&
    Number.isSafeInteger(now) &&
    parsed.data.active &&
    parsed.data.language === language &&
    parsed.data.effectiveFrom <= now &&
    now < parsed.data.effectiveTo
    ? parsed.data
    : null;
}
