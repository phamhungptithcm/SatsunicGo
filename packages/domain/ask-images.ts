import { z } from "zod";
export const askImageSchema = z
  .object({
    mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
    base64: z
      .string()
      .min(32)
      .max(2800000)
      .regex(/^[A-Za-z0-9+/]*={0,2}$/),
  })
  .strict();
export type AskImage = z.infer<typeof askImageSchema>;
