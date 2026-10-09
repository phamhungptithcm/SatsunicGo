import { z } from "zod";
import { catalogSelectionSchema } from "./catalog-checkout";
const resultSchema = z
  .object({
    id: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,100}$/)
      .optional(),
    version: z.number().int().nonnegative().safe(),
  })
  .strict();
const durable = new Set([
  "submitRequest",
  "catalogCheckout",
  "acceptQuote",
  "approveFinal",
  "confirmReceipt",
]);
const immediate = new Set(["saveTurn", "saveDraft", "saveRecipient"]);
const pendingSchema = z
  .object({
    conversationId: z.string().uuid(),
    operationId: z.string().uuid(),
    expectedVersion: z.number().int().nonnegative().safe(),
    expectedOrderVersion: z.number().int().positive().safe().optional(),
    action: z.enum([
      "submitRequest",
      "catalogCheckout",
      "acceptQuote",
      "approveFinal",
      "confirmReceipt",
    ]),
    payload: z.unknown().optional(),
  })
  .strict();
export function admitAskPendingEnvelope(raw: unknown, conversationId: string) {
  const parsed = pendingSchema.safeParse(raw);
  if (
    !parsed.success ||
    parsed.data.conversationId !== conversationId ||
    (parsed.data.action === "catalogCheckout"
      ? !catalogSelectionSchema.safeParse(parsed.data.payload).success
      : parsed.data.payload !== undefined)
  )
    throw Error("ASK_PENDING_UNVERIFIED");
  return parsed.data;
}
/** A transport success is not a verified command completion. Use the original
 * operation envelope on retries; unknown results must retain pending identity. */
export function admitAskCommandResult(
  raw: unknown,
  request: { action: string; expectedVersion: number; orderId?: string },
) {
  const parsed = resultSchema.safeParse(raw);
  const steps = durable.has(request.action)
    ? 2
    : immediate.has(request.action)
      ? 1
      : 0;
  if (
    !parsed.success ||
    !steps ||
    !Number.isSafeInteger(request.expectedVersion) ||
    request.expectedVersion < 0 ||
    parsed.data.version !== request.expectedVersion + steps ||
    (steps === 2 ? !parsed.data.id : parsed.data.id !== undefined) ||
    (steps === 2 && request.orderId && parsed.data.id !== request.orderId)
  )
    throw Error("ASK_COMMAND_RESULT_UNVERIFIED");
  return parsed.data;
}

export function admitAskRecoveryResult(
  raw: unknown,
  request?: { action: string; expectedVersion: number; orderId?: string },
  orderId?: string,
) {
  const absent = z
    .object({
      version: z.number().int().nonnegative().safe(),
      outcome: z.literal("no_operation"),
    })
    .strict()
    .safeParse(raw);
  if (absent.success) {
    if (
      request &&
      (!Number.isSafeInteger(request.expectedVersion) ||
        request.expectedVersion < 0 ||
        absent.data.version < request.expectedVersion)
    )
      throw Error("ASK_COMMAND_RESULT_UNVERIFIED");
    return absent.data;
  }
  if (request) return admitAskCommandResult(raw, request);
  const result = resultSchema.safeParse(raw);
  if (
    !result.success ||
    !result.data.id ||
    !result.data.version ||
    (orderId && result.data.id !== orderId)
  )
    throw Error("ASK_COMMAND_RESULT_UNVERIFIED");
  return result.data;
}
