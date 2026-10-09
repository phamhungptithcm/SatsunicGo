import { describe, expect, it } from "vitest";
import {
  admitPurchaseCheckoutAcknowledgement,
  admitPurchaseSourcingAcknowledgement,
} from "../../packages/domain/purchase-checkout";

const id = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const checkout = { id, state: "pending", total: 125000, provider: "demo" };
const command = Object.freeze({ orderId: id, expectedVersion: 4 });

describe("purchase commit acknowledgement admission", () => {
  it("admits the shared initial/balance receipt for the submitted preview", () => {
    expect(admitPurchaseCheckoutAcknowledgement(checkout, id)).toEqual(checkout);
  });

  it("accepts an idempotent replay with the same checkout identity", () => {
    expect(admitPurchaseCheckoutAcknowledgement({ ...checkout }, id).id).toBe(id);
  });

  it.each([
    null,
    undefined,
    {},
    { ...checkout, id: undefined },
    { ...checkout, id: "not-a-checkout-id" },
    { ...checkout, id: otherId },
    { ...checkout, state: "paid" },
    { ...checkout, state: "unknown" },
    { ...checkout, total: "125000" },
    { ...checkout, total: 0 },
    { ...checkout, total: -1 },
    { ...checkout, total: 1.5 },
    { ...checkout, total: Number.NaN },
    { ...checkout, total: Number.POSITIVE_INFINITY },
    { ...checkout, total: Number.MAX_SAFE_INTEGER },
    { ...checkout, provider: "payos_unavailable" },
    { ...checkout, provider: undefined },
  ])("rejects malformed/unverified or unrelated receipt %j", (value) => {
    expect(() => admitPurchaseCheckoutAcknowledgement(value, id)).toThrow();
  });

  it("does not use an unrelated preview to admit a valid receipt", () => {
    expect(() => admitPurchaseCheckoutAcknowledgement(checkout, otherId)).toThrow();
  });
});

describe("sourcing acknowledgement admission", () => {
  it("admits propose/approve only for the submitted order and single increment", () => {
    expect(admitPurchaseSourcingAcknowledgement({ id, version: 5 }, command)).toEqual({ id, version: 5 });
  });

  it("reconciles against the original envelope after the rendered order advances", () => {
    const original = { id, version: 5 };
    expect(admitPurchaseSourcingAcknowledgement(original, command)).toEqual(original);
    expect(() => admitPurchaseSourcingAcknowledgement(original, { orderId: id, expectedVersion: 5 })).toThrow();
    expect(command).toEqual({ orderId: id, expectedVersion: 4 });
  });

  it.each([
    null,
    undefined,
    {},
    { id },
    { id: otherId, version: 5 },
    { id: "not-an-order-id", version: 5 },
    { id, version: "5" },
    { id, version: 0 },
    { id, version: 4 },
    { id, version: 6 },
    { id, version: 5.5 },
    { id, version: Number.POSITIVE_INFINITY },
    { id, version: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects malformed or out-of-scope sourcing receipt %j", (value) => {
    expect(() => admitPurchaseSourcingAcknowledgement(value, command)).toThrow();
  });

  it.each([0, -1, 4.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid submitted version %s",
    (expectedVersion) => {
      expect(() => admitPurchaseSourcingAcknowledgement({ id, version: 5 }, { orderId: id, expectedVersion })).toThrow();
    },
  );

  it.each([null, {}, { orderId: id }, { orderId: otherId, expectedVersion: 4 }, { orderId: id, expectedVersion: "4" }])(
    "rejects an invalid or unrelated persisted command context %j",
    (stored) => {
      expect(() => admitPurchaseSourcingAcknowledgement({ id, version: 5 }, stored)).toThrow();
    },
  );
});
