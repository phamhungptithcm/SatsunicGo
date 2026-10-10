import { describe, expect, it } from "vitest";
import { validatePurchaseRecipient } from "../../src/features/cart/purchase-recipient-validation";
import type { CheckoutRecipient } from "../../packages/domain/purchase-checkout";

const valid: CheckoutRecipient = {
  recipient: "Khách kiểm thử",
  phone: "0900000000",
  country: "VN",
  provinceCode: "79",
  province: "TP. Hồ Chí Minh",
  communeCode: "26734",
  commune: "Phường Bến Thành",
  street: "Số 10, đường kiểm thử",
  note: "",
};

describe("checkout recipient feedback", () => {
  it("accepts a complete address and preserves schema trimming", () => {
    const result = validatePurchaseRecipient({
      ...valid,
      recipient: "  Khách kiểm thử  ",
      phone: "+84900000000",
    });
    expect(result.errors).toEqual({});
    expect(result.parsed.success).toBe(true);
    if (result.parsed.success)
      expect(result.parsed.data.recipient).toBe("Khách kiểm thử");
  });
  it("identifies every required empty field without a backend request", () => {
    const result = validatePurchaseRecipient({
      ...valid,
      recipient: "",
      phone: "",
      provinceCode: "",
      province: "",
      communeCode: "",
      commune: "",
      street: "",
    });
    expect(result.parsed.success).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual([
      "communeCode",
      "phone",
      "provinceCode",
      "recipient",
      "street",
    ]);
  });
  it.each(["123", "abcdef", "0900000000000"])(
    "identifies an invalid phone %s without blaming other fields",
    (phone) => {
      const result = validatePurchaseRecipient({ ...valid, phone });
      expect(result.parsed.success).toBe(false);
      expect(Object.keys(result.errors)).toEqual(["phone"]);
    },
  );
  it("associates missing region names with their visible selectors", () => {
    const result = validatePurchaseRecipient({
      ...valid,
      province: "",
      commune: "",
    });
    expect(Object.keys(result.errors).sort()).toEqual([
      "communeCode",
      "provinceCode",
    ]);
  });
  it("keeps short name, short street and excessive note independently actionable", () => {
    const result = validatePurchaseRecipient({
      ...valid,
      recipient: "A",
      street: "123",
      note: "a".repeat(501),
    });
    expect(Object.keys(result.errors).sort()).toEqual([
      "note",
      "recipient",
      "street",
    ]);
    expect(validatePurchaseRecipient(valid).errors).toEqual({});
  });
  it("never treats an unsupported country as a valid form", () => {
    const result = validatePurchaseRecipient({
      ...valid,
      country: "US" as "VN",
    });
    expect(result.parsed.success).toBe(false);
  });
});
