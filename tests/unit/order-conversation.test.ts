import { describe, expect, it } from "vitest";
import {
  canHandleConversation,
  conversationCommandSchema,
} from "../../packages/domain/order-conversation";
import { notificationTarget } from "../../src/features/content/notification-target";

describe("conversation authority and input", () => {
  it("routes staff alerts to the staff order, with bounded identifiers", () => {
    expect(notificationTarget("staffConversationUpdate", "order-a").path).toBe(
      "/crm/orders?order=order-a",
    );
    expect(
      notificationTarget("staffConversationUpdate", "../secret").path,
    ).toBe("/account");
    expect(notificationTarget("orderConversationReply", "order-a").path).toBe(
      "/account/orders/order-a",
    );
  });
  it("requires current active eligible role and exact buyer assignment", () => {
    expect(canHandleConversation(undefined, "order-a")).toBe(false);
    expect(
      canHandleConversation({ active: false, roles: ["OWNER"] }, "order-a"),
    ).toBe(false);
    expect(
      canHandleConversation(
        { active: true, locked: true, roles: ["SUPPORT"] },
        "order-a",
      ),
    ).toBe(false);
    expect(
      canHandleConversation(
        { active: true, roles: ["FINANCE", "WAREHOUSE"] },
        "order-a",
      ),
    ).toBe(false);
    expect(
      canHandleConversation(
        { active: true, roles: ["BUYER"], orderIds: ["order-b"] },
        "order-a",
      ),
    ).toBe(false);
    expect(
      canHandleConversation(
        { active: true, roles: ["BUYER"], orderIds: ["order-a"] },
        "order-a",
      ),
    ).toBe(true);
    expect(
      canHandleConversation({ active: true, roles: ["SUPPORT"] }, "order-a"),
    ).toBe(true);
  });
  it("rejects forged delivery/ownership and whitespace-only messages", () => {
    const base = {
      action: "message",
      orderId: "order-a",
      operationId: "47e9a861-5c0b-4d62-a190-0af4d8fdcb69",
      expectedVersion: 0,
      text: " Xin chào ",
    };
    const parsed = conversationCommandSchema.parse(base);
    expect(parsed.action !== "assign" && parsed.text).toBe("Xin chào");
    for (const input of [
      { ...base, text: "  " },
      { ...base, text: "a".repeat(4001) },
      { ...base, ownerId: "someone" },
      { ...base, channel: "zalo" },
      { ...base, expectedVersion: -1 },
      { ...base, orderId: "../other" },
    ])
      expect(conversationCommandSchema.safeParse(input).success).toBe(false);
  });
});
