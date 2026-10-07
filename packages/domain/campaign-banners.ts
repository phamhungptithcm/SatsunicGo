import { z } from "zod";

export const bannerPlacement = z.enum(["home", "products"]);
export const bannerMode = z.enum(["auto", "static", "slider"]);
export const bannerId = z
  .string()
  .uuid()
  .regex(/^[a-f0-9-]{36}$/);
const timestamp = z.number().int().min(1).max(253402275599999);
export const bannerDraftSchema = z
  .object({
    title: z.string().trim().min(2).max(80),
    description: z.string().trim().max(160),
    cta: z.string().trim().min(2).max(40),
    path: z
      .string()
      .regex(
        /^\/(?:products(?:\/[a-z0-9-]{2,100})?|posts(?:\/[a-z0-9-]{2,100})?|request|fees|membership)$/,
      ),
    desktopMediaId: bannerId,
    mobileMediaId: bannerId.optional(),
    placements: z
      .array(bannerPlacement)
      .min(1)
      .max(2)
      .refine((v) => new Set(v).size === v.length),
    priority: z.number().int().min(0).max(100),
    startsAt: timestamp,
    endsAt: timestamp,
  })
  .strict()
  .refine((v) => v.endsAt > v.startsAt, {
    message: "Giờ kết thúc phải sau giờ bắt đầu.",
  });
export type BannerDraft = z.infer<typeof bannerDraftSchema>;
export const publishedBannerSchema = z
  .object({
    id: bannerId,
    revision: z.number().int().positive(),
    draft: bannerDraftSchema,
    desktopAlt: z.string().min(2).max(300),
    mobileAlt: z.string().min(2).max(300).optional(),
  })
  .strict();
export type PublishedBanner = z.infer<typeof publishedBannerSchema>;
export const bannerManifestSchema = z
  .object({
    entries: z
      .array(publishedBannerSchema)
      .max(12)
      .refine((v) => new Set(v.map((x) => x.id)).size === v.length),
    modes: z.object({ home: bannerMode, products: bannerMode }).strict(),
  })
  .strict();
export type BannerManifest = z.infer<typeof bannerManifestSchema>;
export const emptyBannerManifest = (): BannerManifest => ({
  entries: [],
  modes: { home: "auto", products: "auto" },
});
export function activeBanners(
  manifest: BannerManifest,
  placement: "home" | "products",
  now: number,
) {
  return manifest.entries
    .filter(
      (v) =>
        v.draft.placements.includes(placement) &&
        v.draft.startsAt <= now &&
        now < v.draft.endsAt,
    )
    .sort(
      (a, b) => b.draft.priority - a.draft.priority || a.id.localeCompare(b.id),
    );
}
export function vietnamTimeInput(ms: number) {
  return new Date(ms + 7 * 3600000).toISOString().slice(0, 16);
}
/** Strict calendar conversion; independent of the machine/browser timezone. */
export function parseVietnamTime(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Nhập ngày và giờ Việt Nam hợp lệ.");
  const ms = Date.parse(`${value}:00+07:00`);
  if (!Number.isSafeInteger(ms) || ms <= 0 || vietnamTimeInput(ms) !== value)
    throw new Error("Nhập ngày và giờ Việt Nam hợp lệ.");
  return ms;
}
export function mediaInBanner(
  entry: PublishedBanner,
  mediaId: string,
  now: number,
) {
  return (
    entry.draft.startsAt <= now &&
    now < entry.draft.endsAt &&
    (entry.draft.desktopMediaId === mediaId ||
      entry.draft.mobileMediaId === mediaId)
  );
}
