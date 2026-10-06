import { z } from "zod";
import { market, money, type Order } from "./index";

export const catalogOptionsSchema = z
  .array(z.string().trim().min(1).max(200))
  .max(30)
  .refine((options) => new Set(options).size === options.length);
export const catalogProductSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    slug: z.string().regex(/^[a-z0-9-]{2,100}$/),
    status: z.literal("published"),
    market,
    version: z.number().int().positive(),
    orderable: z.literal(true),
    listedPrice: money.positive(),
    termsVersion: z.string().trim().min(1).max(80),
    catalogOptions: catalogOptionsSchema.default([]),
    variants: z.string().max(500).optional(),
    referenceUrl: z
      .string()
      .url()
      .refine((url) => /^https?:\/\//i.test(url))
      .optional(),
  })
  .refine(
    (product) => !product.variants?.trim() || product.catalogOptions.length > 0,
  );
export const catalogSelectionSchema = z
  .object({
    productId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
    productVersion: z.number().int().positive(),
    quantity: z.number().int().min(1).max(100),
    variant: z.string().trim().max(200).default(""),
  })
  .strict();
export type CatalogSelection = z.infer<typeof catalogSelectionSchema>;
export type CatalogSnapshot = {
  productId: string;
  productVersion: number;
  slug: string;
  title: string;
  variant: string;
  unitPrice: number;
  quantity: number;
  total: number;
  termsVersion: string;
};
export function createCatalogOrder(
  product: unknown,
  selection: unknown,
  context: {
    id: string;
    ownerId: string;
    now: number;
  },
): Order {
  const p = catalogProductSchema.parse(product),
    s = catalogSelectionSchema.parse(selection);
  if (p.version !== s.productVersion) throw Error("CATALOG_PRICE_CHANGED");
  if (
    p.catalogOptions.length
      ? !p.catalogOptions.includes(s.variant)
      : s.variant !== ""
  )
    throw Error("INVALID_CATALOG_VARIANT");
  const total = money.positive().parse(p.listedPrice * s.quantity);
  return {
    id: context.id,
    ownerId: context.ownerId,
    createdAt: context.now,
    version: 1,
    purchaseKind: "catalog",
    market: p.market,
    items: [
      {
        name: p.title,
        quantity: s.quantity,
        variant: s.variant,
        ...(p.referenceUrl ? { url: p.referenceUrl } : {}),
      },
    ],
    notes: "",
    stage: "QUOTE_ACCEPTED",
    acceptedAt: context.now,
    collected: 0,
    refunded: 0,
    finalTotal: total,
    finalApproved: true,
    catalogSnapshot: {
      productId: s.productId,
      productVersion: p.version,
      slug: p.slug,
      title: p.title,
      variant: s.variant,
      unitPrice: p.listedPrice,
      quantity: s.quantity,
      total,
      termsVersion: p.termsVersion,
    },
  };
}
