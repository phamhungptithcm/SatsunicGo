import { describe, expect, it } from "vitest";
import {
  supportReply,
  supportRejection,
  supportTicketVersion,
} from "../../src/features/support/Thread";

describe("support reply contract and recovery", () => {
  it("retains exact message, ticket version and replay identity without unrelated fields", () => {
    const form = new FormData();
    form.set("message", "  Đơn hàng của tôi\nXin kiểm tra giúp.  ");
    form.set("orderId", "unrelated-order");
    expect(
      supportReply(form, { id: "ticket-a", version: 7 }, "fixed-operation"),
    ).toEqual({
      action: "replyTicket",
      id: "ticket-a",
      expectedVersion: 7,
      operationId: "fixed-operation",
      payload: {
        message: "  Đơn hàng của tôi\nXin kiểm tra giúp.  ",
        status: "open",
      },
    });
  });
  it("only an explicitly selected resolution changes reply status", () => {
    const form = new FormData();
    form.set("message", "Đã nhận hàng.");
    form.set("resolved", "on");
    expect(
      supportReply(form, { id: "ticket-a", version: 8 }, "op").payload.status,
    ).toBe("resolved");
    form.set("resolved", "false");
    expect(
      supportReply(form, { id: "ticket-a", version: 8 }, "op").payload.status,
    ).toBe("open");
  });
  it("timeouts, transport failures and unknown results must keep the issued operation", () => {
    for (const code of [
      "functions/unavailable",
      "functions/deadline-exceeded",
      "functions/internal",
      "functions/unknown",
    ])
      expect(supportRejection({ code })).toBe(false);
    expect(supportRejection(new Error("offline"))).toBe(false);
    expect(supportRejection({ code: "functions/aborted" })).toBe(true);
    expect(supportRejection({ code: "functions/failed-precondition" })).toBe(
      true,
    );
    expect(supportRejection({ code: "functions/permission-denied" })).toBe(
      true,
    );
  });
});

describe("support authoritative ticket version", () => {
  it("accepts only actual valid versions and never manufactures an unavailable value", () => {
    expect(supportTicketVersion(7)).toBe(7);
    for (const value of [
      undefined,
      null,
      "7",
      0,
      -1,
      1.5,
      NaN,
      Number.MAX_SAFE_INTEGER,
    ])
      expect(() => supportTicketVersion(value)).toThrow();
  });
});
