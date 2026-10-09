import { z } from "zod";
export const customerSavePointerSchema = z
  .object({
    schemaVersion: z.literal(1),
    action: z.enum(["saveProfile", "saveAddress"]),
    operationId: z.string().uuid(),
    commandHash: z.string().regex(/^[a-f0-9]{64}$/),
    expectedVersion: z.number().int().nonnegative().safe(),
  })
  .strict();
export type CustomerSavePointer = z.infer<typeof customerSavePointerSchema>;
export const customerSaveResultSchema = z
  .object({
    id: z.string().min(1).max(128),
    version: z.number().int().positive().safe(),
  })
  .strict();
export const customerSaveResolutionSchema = z.discriminatedUnion("status", [
  z
    .object({ status: z.literal("saved"), result: customerSaveResultSchema })
    .strict(),
  z.object({ status: z.literal("not-saved") }).strict(),
]);
