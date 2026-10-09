import { expect, it } from "vitest";
import {
  admitAskCommandResult,
  admitAskRecoveryResult,
  admitAskPendingEnvelope,
} from "../../packages/domain/ask-command-result";
const durable = { action: "catalogCheckout", expectedVersion: 4 };
it("admits checked catalog completion", () =>
  expect(admitAskCommandResult({ id: "order-a", version: 6 }, durable)).toEqual(
    { id: "order-a", version: 6 },
  ));
it("admits immediate completion", () =>
  expect(
    admitAskCommandResult(
      { version: 5 },
      { action: "saveDraft", expectedVersion: 4 },
    ),
  ).toEqual({ version: 5 }));
it.each([
  null,
  {},
  { version: 6 },
  { id: "order-a", version: 5 },
  { id: "order-a", version: NaN },
  { id: "order-a", version: Infinity },
  { id: "order-a", version: 6, paid: true },
  { id: "../foreign", version: 6 },
  { id: "order-a", version: -2 },
  { id: "order-a", version: 6.5 },
])("rejects malformed durable response %j", (raw) =>
  expect(() => admitAskCommandResult(raw, durable)).toThrow(),
);
it("rejects an unrelated order result", () =>
  expect(() =>
    admitAskCommandResult(
      { id: "order-b", version: 6 },
      { ...durable, action: "acceptQuote", orderId: "order-a" },
    ),
  ).toThrow());
it("rejects unexpected id on an immediate save", () =>
  expect(() =>
    admitAskCommandResult(
      { id: "order-a", version: 5 },
      { action: "saveTurn", expectedVersion: 4 },
    ),
  ).toThrow());
it("admits replay using original envelope version", () =>
  expect(
    admitAskCommandResult({ id: "order-a", version: 6 }, durable).version,
  ).toBe(6));
it.each([
  null,
  {},
  { version: 6 },
  { outcome: "no_operation", version: -1 },
  { outcome: "no_operation", version: 3 },
  { outcome: "no_operation", version: 4, id: "order-a" },
  { id: "order-a", version: 5 },
])("retains pending for malformed recovery %j", (raw) =>
  expect(() => admitAskRecoveryResult(raw, durable)).toThrow(),
);
it("admits authoritative absence and completed recovery", () => {
  expect(
    admitAskRecoveryResult({ outcome: "no_operation", version: 4 }, durable),
  ).toEqual({ outcome: "no_operation", version: 4 });
  expect(
    admitAskRecoveryResult({ id: "order-a", version: 6 }, durable),
  ).toEqual({ id: "order-a", version: 6 });
});
const cid = "55555555-1111-4111-8111-111111111111",
  pending = {
    conversationId: cid,
    operationId: "66666666-1111-4111-8111-111111111111",
    action: "catalogCheckout",
    expectedVersion: 4,
    payload: {
      productId: "product-a",
      productVersion: 3,
      quantity: 2,
      variant: "Blue",
    },
  };
it("admits exact public catalog envelope and private-free durable identity", () => {
  expect(admitAskPendingEnvelope(pending, cid)).toEqual(pending);
  const { payload: _, ...identity } = pending;
  expect(
    admitAskPendingEnvelope({ ...identity, action: "submitRequest" }, cid)
      .payload,
  ).toBeUndefined();
});
it.each([
  { conversationId: "77777777-1111-4111-8111-111111111111" },
  { operationId: "invalid" },
  { expectedVersion: NaN },
  { expectedVersion: -1 },
  { action: "saveDraft" },
  { expectedOrderVersion: 0 },
  { payload: { ...pending.payload, price: 1 } },
  { payload: { ...pending.payload, quantity: 0 } },
  { action: "submitRequest", payload: { privateAddress: "never persist" } },
  { ownerId: "another-owner" },
])("blocks corrupt pending identity %j", (patch) =>
  expect(() =>
    admitAskPendingEnvelope({ ...pending, ...patch }, cid),
  ).toThrow(),
);
it("fences a server-side pending recovery without local envelope", () => {
  expect(() =>
    admitAskRecoveryResult(
      { id: "other-order", version: 6 },
      undefined,
      "order-a",
    ),
  ).toThrow();
  expect(() => admitAskRecoveryResult({ version: 6 })).toThrow();
});
