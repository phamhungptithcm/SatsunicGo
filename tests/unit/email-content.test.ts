import { describe, expect, it } from "vitest";
import { emailContent } from "../../functions/src/email-content";
describe("notification email meaning", () => {
  it("does not describe membership or unknown events as order updates", () => {
    for (const action of [
      "membershipActivated",
      "membershipExpired",
      "membershipExpiring",
      undefined,
      "futureEvent",
    ])
      expect(emailContent(action).text).not.toContain("Đơn");
    expect(emailContent("membershipActivated").subject).toContain("kích hoạt");
    expect(emailContent("membershipExpired").subject).toContain("hết hạn");
    expect(emailContent("futureEvent").subject).toContain("cập nhật");
  });
});

it("internal statement email discloses its type without customer data or capability secrets", () => {
  const r = emailContent("invoiceIssued", "SG-00000001");
  expect(r.text).toContain("không phải hóa đơn điện tử thuế");
  expect(r.text).toContain("SG-00000001");
  expect(r.text).not.toContain("#");
  expect(emailContent("invoiceIssued", "<unsafe>").text).not.toContain(
    "<unsafe>",
  );
});
