import { z } from "zod";
import { askCommandPlanSchema } from "./ask-command-plan";
import { requestSchema } from "./index";

export const askAnswerSchema = z
  .object({
    language: z.enum(["vi", "en"]),
    contentLanguage: z
      .string()
      .regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
      .max(35)
      .optional(),
    title: z.string().max(160),
    paragraphs: z.array(z.string().max(1500)).min(1).max(6),
    bullets: z.array(z.string().max(400)).max(8),
    sourceIds: z.array(z.string().max(108)).max(8),
    action: z.string().max(108),
    followUp: z.string().max(500).optional(),
    draft: requestSchema.optional(),
    shoppingDraft: requestSchema.partial().optional(),
    commandPlan: askCommandPlanSchema.optional(),
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
