import { describe, expect, it } from "vitest";
import {
  normalizeRequestInput,
  requestInputText,
} from "../../packages/domain/request-input";
import { requestSchema } from "../../packages/domain";
describe("unified product input", () => {
  it("accepts name-only and image-only without inventing product identity", () => {
    expect(normalizeRequestInput("  Máy ảnh  ")).toEqual({
      name: "Máy ảnh",
      url: "",
    });
    expect(normalizeRequestInput("", true).name).toBe("Sản phẩm theo ảnh");
    expect(normalizeRequestInput("").name).toBe("");
  });
  it("extracts a reference URL and keeps the actual description", () => {
    expect(
      normalizeRequestInput("Màu đen https://example.com/item?q=one"),
    ).toEqual({ name: "Màu đen", url: "https://example.com/item?q=one" });
    expect(normalizeRequestInput("https://example.com/item").name).toBe(
      "Sản phẩm từ example.com",
    );
  });
  it("uses the existing schema for bounds and invalid input", () => {
    const item = normalizeRequestInput("https://example.com/item");
    expect(
      requestSchema.safeParse({
        market: "JP",
        items: [{ ...item, quantity: 1, variant: "" }],
      }).success,
    ).toBe(true);
    expect(
      requestSchema.safeParse({
        market: "JP",
        items: [{ ...normalizeRequestInput(""), quantity: 1 }],
      }).success,
    ).toBe(false);
    expect(
      requestSchema.safeParse({
        market: "US",
        items: [{ ...normalizeRequestInput("https://"), quantity: 1 }],
      }).success,
    ).toBe(false);
  });
  it("retains an existing product URL when restoring canonical drafts", () => {
    const text = requestInputText({
      name: "Sản phẩm",
      url: "https://example.com/item",
    });
    expect(normalizeRequestInput(text)).toEqual({
      name: "Sản phẩm",
      url: "https://example.com/item",
    });
  });
});
