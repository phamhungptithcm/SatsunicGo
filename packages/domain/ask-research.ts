import { z } from "zod";
import { requestSchema } from "./index";

const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const timestamp = z.number().int().nonnegative().safe();
const host = z
  .string()
  .max(253)
  .regex(/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/);
const quote = z.string().trim().min(1).max(280);
export const researchPolicySchema = z
  .object({
    version: z.number().int().positive().safe(),
    enabled: z.boolean(),
    expiresAt: timestamp,
    merchants: z
      .array(
        z
          .object({
            host,
            kind: z.enum(["retailer", "marketplace"]),
            market: z.enum(["US", "JP", "KR"]),
            sellerIds: z.array(identifier).min(1).max(20),
          })
          .strict()
          .refine(
            (row) =>
              row.kind !== "marketplace" ||
              !row.sellerIds.includes("first-party"),
          ),
      )
      .min(1)
      .max(30),
  })
  .strict();
export const researchOfferInputSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    market: z.enum(["US", "JP", "KR"]),
    variant: z.string().trim().min(1).max(160),
    sellerId: identifier,
    url: z
      .string()
      .url()
      .max(1000)
      .refine((value) => {
        try {
          const u = new URL(value);
          return (
            u.protocol === "https:" &&
            !u.username &&
            !u.password &&
            !u.port &&
            !u.hash &&
            host.safeParse(u.hostname).success &&
            !u.hostname.endsWith(".")
          );
        } catch {
          return false;
        }
      }),
    observedAt: timestamp,
    expiresAt: timestamp,
    price: z
      .object({
        amountMinor: z.number().int().positive().safe().max(1_000_000_000),
        currency: z.enum(["USD", "JPY", "KRW"]),
        sourceText: quote,
      })
      .strict()
      .nullable(),
    reviews: z
      .object({
        rating: z.number().min(0).max(5),
        count: z.number().int().positive().max(100_000_000),
        sourceText: quote,
      })
      .strict()
      .nullable(),
  })
  .strict()
  .refine(
    (row) =>
      row.expiresAt > row.observedAt &&
      row.expiresAt - row.observedAt <= 86_400_000,
  )
  .refine(
    (row) =>
      !row.price ||
      row.price.currency ===
        ({ US: "USD", JP: "JPY", KR: "KRW" } as const)[row.market],
  );
export const researchOfferSchema = researchOfferInputSchema.safeExtend({
  id: identifier,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  policyVersion: z.number().int().positive().safe(),
});
export type ResearchOffer = z.infer<typeof researchOfferSchema>;
export const researchCommandSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("approve"),
      operationId: z.string().uuid(),
      id: identifier,
      expectedVersion: z.number().int().nonnegative().safe(),
      offer: researchOfferInputSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("revoke"),
      operationId: z.string().uuid(),
      id: identifier,
      expectedVersion: z.number().int().positive().safe(),
    })
    .strict(),
]);
export const researchSearchSchema = z
  .object({
    query: z.string().trim().min(2).max(200),
    market: z.enum(["US", "JP", "KR"]),
  })
  .strict();
export const researchSearchResultSchema = z
  .object({
    offers: z.array(researchOfferSchema).max(5),
    scanned: z.number().int().nonnegative().max(100),
    limited: z.boolean(),
    observedAt: timestamp,
  })
  .strict();
export const researchSelectSchema = z
  .object({
    id: identifier,
    version: z.number().int().positive().safe(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    quantity: z.number().int().min(1).max(99),
  })
  .strict();
export const researchSelectResultSchema = z
  .object({ offer: researchOfferSchema, draft: requestSchema })
  .strict();

/** Exact hosts and sellers; never treat a marketplace host as seller approval. */
export function researchMerchant(
  value: string,
  market: "US" | "JP" | "KR",
  sellerId: string,
  policy: z.infer<typeof researchPolicySchema>,
) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hash ||
      url.hostname.endsWith(".") ||
      !host.safeParse(url.hostname).success
    )
      return null;
    return policy.merchants.some(
      (m) =>
        m.host === url.hostname &&
        m.market === market &&
        m.sellerIds.includes(sellerId),
    )
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function researchPriceText(price: NonNullable<ResearchOffer["price"]>) {
  const amount = price.amountMinor / (price.currency === "USD" ? 100 : 1);
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: price.currency === "USD" ? 2 : 0, maximumFractionDigits: price.currency === "USD" ? 2 : 0 })} ${price.currency}`;
}
/** Canonical provenance remains a research estimate, outside monetary commands. */
export function researchDraft(offer: ResearchOffer, quantity: number) {
  return requestSchema.parse({
    market: offer.market,
    items: [
      { name: offer.title, variant: offer.variant, quantity, url: offer.url },
    ],
    notes: `Research reference only — staff quotation required. Reference ${offer.id} v${offer.version} (${offer.contentHash}). Original item: ${offer.title}; variant: ${offer.variant}. ${offer.price ? `Unit price observed: ${researchPriceText(offer.price)}.` : "Price not confirmed."} Checked ${new Date(offer.observedAt).toISOString()}. Source ${offer.url}`,
  });
}
