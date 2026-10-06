import { expect, test } from "vitest";
import {
  conversationActionSchema,
  nextCustomerAction,
  redactChat,
  redactDraft,
  safeCheckout,
  shoppingIntent,
} from "../../packages/domain/ask-workflow";
import type { Order } from "../../packages/domain";
const order: Order = {
  id: "x",
  ownerId: "a",
  market: "US",
  items: [{ name: "item", quantity: 1, variant: "" }],
  notes: "",
  version: 1,
  createdAt: 1,
  stage: "REQUESTED",
  collected: 0,
  refunded: 0,
};
test("buying intent does not get captured as a generic FAQ", () => {
  expect(shoppingIntent("Mình muốn mua hộ đôi giày size 42")).toBe(true);
  expect(shoppingIntent("Mua hộ hoạt động thế nào?")).toBe(false);
  expect(shoppingIntent("https://shop.example/product")).toBe(true);
});
test("deterministic workflow respects hold, approval, actual money and terminal states", () => {
  expect(nextCustomerAction(order)).toBe("waiting");
  expect(nextCustomerAction({ ...order, stage: "QUOTED" })).toBe("acceptQuote");
  expect(
    nextCustomerAction({
      ...order,
      stage: "QUOTE_ACCEPTED",
      acceptedAt: 1,
      deposit: 500,
    }),
  ).toBe("payment");
  expect(
    nextCustomerAction({
      ...order,
      stage: "QUOTE_ACCEPTED",
      acceptedAt: 1,
      deposit: 500,
      collected: 500,
    }),
  ).toBe("waiting");
  expect(
    nextCustomerAction({
      ...order,
      stage: "PACKED",
      finalTotal: 1200,
      acceptedAt: 1,
      collected: 500,
    }),
  ).toBe("approveFinal");
  expect(
    nextCustomerAction({
      ...order,
      stage: "PACKED",
      finalTotal: 1200,
      finalApproved: true,
      acceptedAt: 1,
      collected: 500,
    }),
  ).toBe("payment");
  expect(
    nextCustomerAction({ ...order, stage: "QUOTED", hold: "review" }),
  ).toBe("hold");
  expect(nextCustomerAction({ ...order, stage: "COMPLETED" })).toBe("finished");
});
test("customer tool allowlist rejects privileged actions and recipient payload leakage", () => {
  expect(
    conversationActionSchema.safeParse({
      action: "verifyTransfer",
      payload: {},
    }).success,
  ).toBe(false);
  expect(
    conversationActionSchema.safeParse({
      action: "saveDraft",
      payload: { recipient: "a" },
    }).success,
  ).toBe(false);
  expect(
    conversationActionSchema.safeParse({
      action: "acceptQuote",
      payload: { quoteVersion: 1, paid: true },
    }).success,
  ).toBe(false);
});
test("model context redacts explicit private details while preserving numeric budget", () => {
  expect(
    redactChat("email: fixture@example.com phone +1 222 333 4444"),
  ).not.toContain("fixture@example");
  expect(redactChat("địa chỉ: 123 Fixture Street")).not.toContain("Fixture");
  expect(
    redactDraft({ budget: 1000000000, notes: "address: 123 Fixture Street" }),
  ).toEqual({ budget: 1000000000, notes: "[private details]" });
});
test("payment links are restricted to provider HTTPS pages", () => {
  expect(safeCheckout("https://pay.payos.vn/web/example")).toContain(
    "pay.payos.vn",
  );
  for (const value of [
    "http://pay.payos.vn/x",
    "https://pay.payos.vn.evil.example/x",
    "javascript:alert(1)",
    "https://user:pass@pay.payos.vn/x",
  ])
    expect(() => safeCheckout(value)).toThrow();
});

test("receipt confirmation completes only a delivered, fully funded and released order", async () => {
  const { evolve } = await import("../../packages/domain");
  const delivered: Order = {
    ...order,
    stage: "DELIVERED",
    finalApproved: true,
    finalTotal: 1300,
    packingComplete: true,
    collected: 1300,
    tracking: "fixture-tracking",
  };
  expect(
    evolve(delivered, "confirmReceipt", { received: true }, Date.now()).stage,
  ).toBe("COMPLETED");
  for (const invalid of [
    { ...delivered, stage: "IN_TRANSIT" as const },
    { ...delivered, collected: 1200 },
    { ...delivered, hold: "review" },
    { ...delivered, refundReserved: 100 },
    { ...delivered, tracking: undefined },
  ])
    expect(() =>
      evolve(invalid, "confirmReceipt", { received: true }, Date.now()),
    ).toThrow();
});
