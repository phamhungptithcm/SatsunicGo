import {
  checkoutRecipientSchema,
  type CheckoutRecipient,
} from "../../../packages/domain/purchase-checkout";

export const purchaseRecipientFields = [
  "recipient",
  "phone",
  "provinceCode",
  "communeCode",
  "street",
  "note",
] as const;
export type PurchaseRecipientField = (typeof purchaseRecipientFields)[number];

const messages: Record<PurchaseRecipientField, string> = {
  recipient: "Nhập tên người nhận (ít nhất 2 ký tự).",
  phone: "Nhập số điện thoại Việt Nam hợp lệ.",
  provinceCode: "Chọn tỉnh / thành phố.",
  communeCode: "Chọn phường / xã.",
  street: "Nhập địa chỉ cụ thể (ít nhất 5 ký tự).",
  note: "Ghi chú tối đa 500 ký tự.",
};

export function validatePurchaseRecipient(recipient: CheckoutRecipient) {
  const parsed = checkoutRecipientSchema.safeParse(recipient);
  const errors: Partial<Record<PurchaseRecipientField, string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      const field = purchaseRecipientFields.find(
        (field) =>
          field === path ||
          (field === "provinceCode" && path === "province") ||
          (field === "communeCode" && path === "commune"),
      );
      if (field) errors[field] = messages[field];
    }
  }
  return { parsed, errors };
}
