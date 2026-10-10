import { expect, test } from "vitest";
import { purchaseFeedback } from "../../src/features/cart/purchase-feedback";
test.each(["deadline-exceeded", "unavailable", "internal", "cancelled"])(
  "transport failure %s gives a retry instruction rather than raw SDK text",
  (code) => {
    expect(
      purchaseFeedback(
        { code: `functions/${code}`, message: code },
        "Kiểm tra kết nối rồi thử lại.",
      ),
    ).toBe("Kiểm tra kết nối rồi thử lại.");
  },
);
test("price-drift business guidance is preserved for a new overview", () => {
  const message =
    "Giá hàng đã thay đổi. Xem lại tổng quan trước khi thanh toán.";
  expect(
    purchaseFeedback({ code: "functions/aborted", message }, "Thử lại."),
  ).toBe(message);
});
test.each([null, {}, { message: "" }, new Error("deadline-exceeded")])(
  "missing or bare technical error remains recoverable",
  (error) => {
    expect(purchaseFeedback(error, "Xem lại tổng quan.")).toBe(
      "Xem lại tổng quan.",
    );
  },
);
