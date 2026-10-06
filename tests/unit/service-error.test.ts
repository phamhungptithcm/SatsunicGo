import { it, expect } from "vitest";
import { serviceError } from "../../src/shared/service-error";
it.each([400, 401, 403, 404, 409, 429, 499, 500, 501, 503, 504])(
  "callable HTTP metadata%s stays out of visible guidance while retaining error code",
  (status) => {
    const e = serviceError(
      {
        message: `Đơn đã hủy. Không thể phân bổ thêm tiền. [${status}]`,
        code: "functions/failed-precondition",
      },
      "fallback",
    );
    expect(e.message).toBe("Đơn đã hủy. Không thể phân bổ thêm tiền.");
    expect(e.code).toBe("functions/failed-precondition");
  },
);
it.each([
  [{ message: "Amount [400]", code: "domain/invalid" }, "Amount [400]"],
  [
    { message: "Reference [123]", code: "functions/internal" },
    "Reference [123]",
  ],
  [
    { message: "Reference [400] remains", code: "functions/internal" },
    "Reference [400] remains",
  ],
  [
    { message: "Normal domain guidance", code: "functions/aborted" },
    "Normal domain guidance",
  ],
  [null, "fallback"],
])(
  "service error preserves unrelated guidance and fallback %#",
  (error, message) =>
    expect(serviceError(error, "fallback").message).toBe(message),
);
