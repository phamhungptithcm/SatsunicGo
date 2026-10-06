import { expect, it } from "vitest";
import { canHandleConversation, type ConversationAccess } from "../../packages/domain/order-conversation";
it.each([
  { active: "false", roles: ["SUPPORT"] },
  { active: 1, roles: ["OWNER"] },
  { active: true, roles: "NOT_OWNER" },
  { active: true, roles: { OWNER: true } },
  { active: true, roles: ["BUYER"], orderIds: "prefix-order-target-suffix" },
  { active: true, roles: ["BUYER"], orderIds: { "order-target": true } },
])("CONV026 malformed stored authority fails closed", (raw) => {
  expect(canHandleConversation(raw as unknown as ConversationAccess, "order-target")).toBe(false);
});
it("CONV026 valid role union/exact assignment and current lock remain intact", () => {
  expect(canHandleConversation({ active: true, roles: ["OWNER"] }, "order-target")).toBe(true);
  expect(canHandleConversation({ active: true, roles: ["SUPPORT"] }, "order-target")).toBe(true);
  expect(canHandleConversation({ active: true, roles: ["BUYER"], orderIds: ["order-target"] }, "order-target")).toBe(true);
  expect(canHandleConversation({ active: true, roles: ["BUYER"], orderIds: ["other"] }, "order-target")).toBe(false);
  expect(canHandleConversation({ active: true, locked: true, roles: ["OWNER"] }, "order-target")).toBe(false);
});
