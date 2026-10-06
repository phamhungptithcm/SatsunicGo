import { z } from "zod";
import { money, type Order, catalogPayable } from "./index";
export const sellerSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    address: z.string().trim().min(5).max(300),
    contact: z.string().trim().min(3).max(160),
  })
  .strict();
export type Seller = z.infer<typeof sellerSchema>;
export type SalesDocument = {
  id: string;
  ownerId: string;
  sourceOrderId: string;
  sourceVersion: number;
  replacesId?: string;
  version: number;
  state: "draft" | "issued" | "void";
  kind: "internal_statement";
  currency: "VND";
  purchaseKind: "catalog" | "custom";
  seller: Seller;
  sellerVersion: number;
  buyerName: string;
  lines: { name: string; quantity: number; variant: string }[];
  total: number;
  collected: number;
  refunded: number;
  netCollected: number;
  remainingDue: number;
  overpayment: number;
  termsVersion: string;
  createdAt: number;
  changedAt: number;
  issuedAt?: number;
  issueNumber?: string;
  voidReason?: string;
  voidedAt?: number;
  shareEpoch: number;
};
export function documentSnapshot(
  order: Order,
  seller: Seller,
  buyerName: string,
) {
  sellerSchema.parse(seller);
  if (
    !order.acceptedAt ||
    order.finalApproved !== true ||
    order.finalTotal === undefined ||
    !order.items?.length
  )
    throw Error("FINAL_TOTAL_REQUIRED");
  if (order.purchaseKind === "catalog") catalogPayable(order);
  const total = money.parse(order.finalTotal),
    collected = money.parse(order.collected),
    refunded = money.parse(order.refunded);
  if (refunded > collected) throw Error("INVALID_LEDGER");
  const termsVersion =
    order.catalogSnapshot?.termsVersion ?? order.quote?.termsVersion;
  if (!termsVersion) throw Error("TERMS_REQUIRED");
  return {
    seller,
    buyerName: buyerName.slice(0, 120),
    purchaseKind:
      order.purchaseKind === "catalog"
        ? ("catalog" as const)
        : ("custom" as const),
    lines: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      variant: i.variant,
    })),
    total,
    collected,
    refunded,
    netCollected: collected - refunded,
    remainingDue: Math.max(0, total - collected + refunded),
    overpayment: Math.max(0, collected - refunded - total),
    termsVersion,
  };
}
/** A capability shares only the document amount/items, never customer identity or order IDs. */
export function sharedDocument(d: SalesDocument) {
  return {
    kind: d.kind,
    currency: d.currency,
    state: d.state,
    seller: d.seller,
    lines: d.lines,
    total: d.total,
    netCollected: d.netCollected,
    remainingDue: d.remainingDue,
    overpayment: d.overpayment,
    purchaseKind: d.purchaseKind,
    termsVersion: d.termsVersion,
    issuedAt: d.issuedAt,
    issueNumber: d.issueNumber,
  };
}
