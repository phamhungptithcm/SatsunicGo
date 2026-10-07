import { describe, expect, it } from "vitest";
import {
  activeBanners,
  bannerDraftSchema,
  bannerManifestSchema,
  emptyBannerManifest,
  mediaInBanner,
  parseVietnamTime,
  vietnamTimeInput,
  type BannerDraft,
  type PublishedBanner,
} from "../../packages/domain/campaign-banners";
const id = "11111111-1111-4111-8111-111111111111",
  media = "22222222-2222-4222-8222-222222222222";
const draft: BannerDraft = {
  title: "Khám phá từ Mỹ",
  description: "",
  cta: "Xem sản phẩm",
  path: "/products",
  desktopMediaId: media,
  placements: ["home"],
  priority: 0,
  startsAt: 1000,
  endsAt: 2000,
};
const entry: PublishedBanner = {
  id,
  revision: 1,
  draft,
  desktopAlt: "Sản phẩm được giới thiệu",
};
describe("BANNER076 schedules, strict data and public projection policy", () => {
  it.each([0, 999, 2000, 2001])(
    "hides outside half-open server window %i",
    (now) =>
      expect(
        activeBanners(
          { entries: [entry], modes: { home: "auto", products: "auto" } },
          "home",
          now,
        ),
      ).toEqual([]),
  );
  it.each([1000, 1500, 1999])("visible within server window %i", (now) =>
    expect(
      activeBanners(
        { entries: [entry], modes: { home: "auto", products: "auto" } },
        "home",
        now,
      ),
    ).toEqual([entry]),
  );
  it("does not expose home-only banner on products", () =>
    expect(
      activeBanners(
        { entries: [entry], modes: { home: "auto", products: "auto" } },
        "products",
        1500,
      ),
    ).toEqual([]));
  it("empty manifest creates no entries", () =>
    expect(activeBanners(emptyBannerManifest(), "home", 1500)).toEqual([]));
  it("priority and tie order deterministic", () => {
    const low = { ...entry, id: media },
      high = { ...entry, draft: { ...draft, priority: 10 } };
    expect(
      activeBanners(
        { entries: [low, high], modes: { home: "slider", products: "static" } },
        "home",
        1500,
      ),
    ).toEqual([high, low]);
  });
  it.each([
    "https://example.com",
    "//example.com",
    "/products?discount=100",
    "/products/../account",
    "/account",
    "javascript:alert(1)",
    "/products/%2e%2e",
  ])("rejects unsafe destination %s", (path) =>
    expect(bannerDraftSchema.safeParse({ ...draft, path }).success).toBe(false),
  );
  it.each([
    "/request",
    "/products",
    "/posts",
    "/fees",
    "/membership",
    "/products/fish-oil",
    "/posts/huong-dan",
  ])("accepts supported destination %s", (path) =>
    expect(bannerDraftSchema.safeParse({ ...draft, path }).success).toBe(true),
  );
  it("rejects unknown keys, invalid UUID, duplicate placements and inverted window", () => {
    for (const change of [
      { enabled: true },
      { desktopMediaId: "fake" },
      { placements: ["home", "home"] },
      { endsAt: 1000 },
      { priority: 101 },
      { title: " " },
    ])
      expect(bannerDraftSchema.safeParse({ ...draft, ...change }).success).toBe(
        false,
      );
  });
  it("caps published snapshots and rejects duplicate IDs", () => {
    expect(
      bannerManifestSchema.safeParse({
        entries: [entry, entry],
        modes: { home: "auto", products: "auto" },
      }).success,
    ).toBe(false);
    expect(
      bannerManifestSchema.safeParse({
        ...emptyBannerManifest(),
        entries: Array.from({ length: 13 }, () => entry),
      }).success,
    ).toBe(false);
  });
  it("reference and time must both authorize media", () => {
    expect(mediaInBanner(entry, media, 1500)).toBe(true);
    expect(mediaInBanner(entry, id, 1500)).toBe(false);
    expect(mediaInBanner(entry, media, 2000)).toBe(false);
  });
  it("Vietnam conversion independent timezone with leap day", () => {
    expect(parseVietnamTime("2028-02-29T00:00")).toBe(
      Date.parse("2028-02-28T17:00:00Z"),
    );
    expect(vietnamTimeInput(parseVietnamTime("2026-10-06T23:59"))).toBe(
      "2026-10-06T23:59",
    );
  });
  it.each([
    "2026-02-29T00:00",
    "2026-04-31T00:00",
    "2026-13-01T00:00",
    "2026-01-01T24:00",
    "2026-01-01T12:60",
    "",
    "2026-01-01T00:00Z",
  ])("rejects calendar rollover %s", (value) =>
    expect(() => parseVietnamTime(value)).toThrow(),
  );
});
