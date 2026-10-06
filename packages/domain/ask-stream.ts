import { z } from "zod";
import { requestSchema } from "./index";

export const askAnswerSchema = z
  .object({
    language: z.enum(["vi", "en"]),
    title: z.string().max(160),
    paragraphs: z.array(z.string().max(1500)).min(1).max(6),
    bullets: z.array(z.string().max(400)).max(8),
    sourceIds: z.array(z.string().max(100)).max(8),
    action: z.string().max(100),
    followUp: z.string().max(500).optional(),
    draft: requestSchema.optional(),
    shoppingDraft: requestSchema.partial().optional(),
  })
  .strict();
export const askStreamEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("status"),
      phase: z.enum(["retrieving", "selecting"]),
    })
    .strict(),
  z.object({ type: z.literal("answer"), answer: askAnswerSchema }).strict(),
]);
export type AskStreamEvent = z.infer<typeof askStreamEventSchema>;
