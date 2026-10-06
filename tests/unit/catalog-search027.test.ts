import { describe, expect, it } from "vitest";
import {
  catalogMatchScore,
  catalogBrowseIntent,
  catalogSearchIntent,
  catalogSearchTerms,
  normalizeCatalogText,
} from "../../packages/domain/catalog-search";
describe("catalog name and purpose search", () => {
  it("keeps explicit browse continuation distinct from custom buying", () => {
    for (const text of [
      "tìm sản phẩm dưỡng ẩm",
      "TÌM kem",
      "search cream",
      "find vitamins",
    ])
      expect(catalogBrowseIntent(text)).toBe(true);
    for (const text of [
      "mua Unlisted",
      "buy custom item",
      "CeraVe cream",
      "đơn này đang ở đâu?",
    ])
      expect(catalogBrowseIntent(text)).toBe(false);
  });
  it("matches Vietnamese accents and useful purpose terms", () => {
    expect(normalizeCatalogText("ĐỒ dưỡng Ẩm")).toBe("do duong am");
    expect(
      catalogMatchScore("tìm sản phẩm dưỡng ẩm", {
        title: "Kem",
        functions: "Dưỡng ẩm da",
      }),
    ).toBeGreaterThan(0);
  });
  it("requires all meaningful terms and ranks title ahead of body", () => {
    expect(catalogSearchTerms("tìm sản phẩm có công dụng dưỡng ẩm")).toEqual([
      "duong",
      "am",
    ]);
    expect(
      catalogMatchScore("công dụng dưỡng ẩm", {
        title: "Kem",
        functions: "Dưỡng ẩm da",
      }),
    ).toBeGreaterThan(0);
    expect(
      catalogMatchScore("kem dưỡng", { title: "Kem", body: "chống nắng" }),
    ).toBe(0);
    expect(catalogMatchScore("kem", { title: "Kem" })).toBeGreaterThan(
      catalogMatchScore("kem", { title: "A", usage: "kem" }),
    );
  });
  it("does not match an empty query or stop words", () => {
    expect(catalogSearchTerms("please find products")).toEqual([]);
    expect(catalogMatchScore("", { title: "Kem" })).toBe(0);
  });
  it("recognizes bare product names and explicit searches", () => {
    expect(catalogSearchIntent("CeraVe cream")).toBe(true);
    expect(catalogSearchIntent("tìm kem dưỡng da")).toBe(true);
    expect(catalogSearchIntent("đơn này đang ở đâu?")).toBe(false);
  });
});

it("retains ranking and category/body evidence with protected constraints", () => {
  expect(catalogMatchScore("cerave", { title: "cerave" })).toBe(3);
  expect(catalogMatchScore("cerave", { title: "cream", body: "cerave" })).toBe(
    1,
  );
  expect(
    catalogMatchScore("cerave", { title: "cream", category: "cerave" }),
  ).toBe(1);
  expect(
    catalogMatchScore("cho chị kem cấp ẩm", {
      title: "kem",
      functions: "dưỡng ẩm",
    }),
  ).toBeGreaterThan(0);
  for (const q of [
    "không mua kem dưỡng ẩm không hương liệu",
    "kem dưỡng ẩm hay dầu cá",
    "có nên dùng kem dưỡng ẩm không",
  ])
    expect(
      catalogMatchScore(q, { title: "kem dưỡng ẩm không hương liệu dầu cá" }),
    ).toBe(0);
  expect(
    catalogMatchScore("vitamin c 1000 mg", { title: "vitamin c 1000 mcg" }),
  ).toBe(0);
  expect(catalogMatchScore("x".repeat(1001), { title: "x" })).toBe(0);
  expect(catalogSearchTerms("x".repeat(1001))).toEqual([]);
});

it("actual intent gate admits polite Vietnamese availability and rejects unsafe unrelated goals", () => {
  for (const q of [
    "chị cần kem dưỡng ẩm cho da khô ạ?",
    "có kem cấp ẩm không em?",
    "cho anh xin serum dưỡng ẩm với nhé?",
    "do you have moisturizer please?",
  ])
    expect(catalogSearchIntent(q), q).toBe(true);
  for (const q of [
    "",
    "xin chào",
    "hello",
    "cảm ơn",
    "mã đơn ABC-123 có vitamin chưa?",
    "đơn này đang ở đâu?",
    "track my order",
    "đã thanh toán chưa?",
    "cho chị xem số dư",
    "không mua kem dưỡng ẩm",
    "kem dưỡng ẩm hay dầu cá?",
    "có nên dùng kem dưỡng ẩm không?",
  ])
    expect(catalogSearchIntent(q), q).toBe(false);
});
