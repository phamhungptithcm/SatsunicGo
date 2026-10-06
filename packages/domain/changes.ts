import { z } from "zod";
import { money, type Order } from "./index";
export const proposalSchema = z
  .object({
    kind: z.enum([
      "substitution",
      "partialCancellation",
      "cancellation",
      "return",
    ]),
    resolveHold: z.boolean().default(false),
    reason: z.string().min(5).max(1000),
    termsVersion: z.string().min(1).max(80),
    lines: z
      .array(
        z
          .object({
            line: z.number().int().min(0).max(29),
            cancelQuantity: z.number().int().min(0).max(100),
            replacementName: z.string().min(2).max(200).optional(),
            replacementVariant: z.string().max(200).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(30),
    finalPayable: money,
    actualCosts: money,
    evidence: z.string().min(5).max(1000),
  })
  .strict();
export type ChangeProposal = z.infer<typeof proposalSchema>;
export function checkProposal(order: Order, p: ChangeProposal) {
  proposalSchema.parse(p);
  if (
    order.purchaseKind === "catalog" &&
    (!order.catalogSnapshot || p.finalPayable > order.catalogSnapshot.total)
  )
    throw Error("CATALOG_REPRICING_FORBIDDEN");
  if (
    !order.acceptedAt ||
    p.termsVersion !==
      (order.purchaseKind === "catalog"
        ? order.catalogSnapshot?.termsVersion
        : order.quote?.termsVersion) ||
    order.stage === "CANCELLED"
  )
    throw Error("INVALID_STATE");
  if (p.kind === "substitution" && p.lines.some((l) => l.cancelQuantity !== 0))
    throw Error("SUBSTITUTION_QUANTITY_CHANGED");
  if (
    p.kind !== "substitution" &&
    p.lines.some(
      (l) =>
        l.replacementName !== undefined || l.replacementVariant !== undefined,
    )
  )
    throw Error("UNEXPECTED_SUBSTITUTION");
  if (
    p.kind === "partialCancellation" &&
    p.lines.reduce((sum, l) => sum + l.cancelQuantity, 0) >=
      order.items.reduce((sum, item) => sum + item.quantity, 0)
  )
    throw Error("USE_FULL_CANCELLATION");
  if (p.kind === "substitution" && !p.lines.some((l) => l.replacementName))
    throw Error("NO_SUBSTITUTION");
  if (p.kind !== "substitution" && !p.lines.some((l) => l.cancelQuantity > 0))
    throw Error("NO_QUANTITY_CHANGE");
  if (new Set(p.lines.map((l) => l.line)).size !== p.lines.length)
    throw Error("DUPLICATE_LINE");
  for (const l of p.lines) {
    const item = order.items[l.line];
    if (!item || l.cancelQuantity > item.quantity)
      throw Error("INVALID_QUANTITY");
    const processed =
      order.purchasedLines?.[l.line] ??
      (order.items.length === 1 ? (order.purchasedQuantity ?? 0) : 0);
    if (
      !["return", "cancellation"].includes(p.kind) &&
      l.cancelQuantity > item.quantity - processed
    )
      throw Error("ALREADY_PURCHASED");
    if (
      (l.replacementName !== undefined || l.replacementVariant !== undefined) &&
      processed > 0
    )
      throw Error("ALREADY_PURCHASED");
  }
  if (
    p.kind === "cancellation" &&
    p.lines.reduce((sum, l) => sum + l.cancelQuantity, 0) !==
      order.items.reduce((sum, i) => sum + i.quantity, 0)
  )
    throw Error("FULL_CANCELLATION_REQUIRED");
  if (p.finalPayable < p.actualCosts) throw Error("UNCOVERED_COSTS");
  if (
    p.kind === "return" &&
    !order.tracking &&
    !["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(order.stage)
  )
    throw Error("RETURN_NOT_SHIPPED");
}
