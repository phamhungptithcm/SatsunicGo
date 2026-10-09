import { expect, test } from "vitest";
import {
  createActionPreview,
  createPreviewAdmission,
  contextualReply,
  draftEditOnly,
  previewCurrent,
  previewJson,
  type PreviewScope,
} from "../../packages/domain/action-preview";
const scope: PreviewScope = {
  ownerId: "synthetic-owner",
  conversationId: "11111111-1111-4111-8111-111111111111",
  epoch: 1,
  conversationVersion: 4,
  orderId: null,
  orderVersion: null,
  draftSignature: "synthetic-draft",
  localRevision: 2,
  history: false,
};
const command = {
  action: "catalogCheckout" as const,
  payload: {
    productId: "synthetic-product",
    productVersion: 3,
    quantity: 2,
    variant: "Blue",
  },
};
test("visible exact preview admits once, freezes reviewed payload and preserves stable canonical keys", async () => {
  const input = { ...command, payload: { ...command.payload } };
  const p = await createActionPreview(input, scope, 100);
  input.payload.quantity = 7;
  expect((p.command.payload as typeof command.payload).quantity).toBe(2);
  expect(p.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  expect(Object.isFrozen(p.command.payload)).toBe(true);
  const gate = createPreviewAdmission();
  expect(gate.consume(p, scope, command, p.id, 101)).toBe(true);
  expect(gate.consume(p, scope, command, p.id, 102)).toBe(false);
});
test.each([
  { ownerId: "other" },
  { conversationId: "other" },
  { epoch: 3 },
  { conversationVersion: 5 },
  { orderId: "other" },
  { orderVersion: 1 },
  { draftSignature: "edited" },
  { localRevision: 3 },
  { history: true },
])("changed binding cannot use old consent: %j", async (change) => {
  const p = await createActionPreview(command, scope, 100);
  expect(
    createPreviewAdmission().consume(
      p,
      { ...scope, ...change },
      command,
      p.id,
      101,
    ),
  ).toBe(false);
});
test.each([99, 300100, NaN, Infinity])(
  "clock before creation or at expiry is invalid: %s",
  async (now) => {
    const p = await createActionPreview(command, scope, 100);
    expect(previewCurrent(p, scope, now)).toBe(false);
  },
);
test("hidden review, different action or changed payload never dispatch", async () => {
  const p = await createActionPreview(command, scope, 100);
  const gate = createPreviewAdmission();
  expect(gate.consume(p, scope, command, null, 101)).toBe(false);
  expect(
    gate.consume(
      p,
      scope,
      { ...command, payload: { ...command.payload, quantity: 3 } },
      p.id,
      101,
    ),
  ).toBe(false);
  expect(
    gate.consume(
      p,
      scope,
      { action: "confirmReceipt", payload: { received: true } },
      p.id,
      101,
    ),
  ).toBe(false);
  expect(gate.consume(p, scope, command, p.id, 101)).toBe(true);
});
test("consumed preview stays consumed after a newer action; queue-time version wins", async () => {
  const a = await createActionPreview(command, scope, 100),
    b = await createActionPreview(command, scope, 100);
  const gate = createPreviewAdmission();
  expect(gate.consume(a, scope, command, a.id, 101)).toBe(true);
  expect(gate.consume(b, scope, command, b.id, 102)).toBe(true);
  expect(gate.consume(a, scope, command, a.id, 103)).toBe(false);
  const later = await createActionPreview(command, scope, 100);
  const queued = Promise.resolve().then(() =>
    gate.consume(
      later,
      { ...scope, conversationVersion: 5 },
      command,
      later.id,
      104,
    ),
  );
  expect(await queued).toBe(false);
});
test("source expiry bounds consent, while canonical item order remains significant", async () => {
  const p = await createActionPreview(command, scope, 100, 150);
  expect(p.expiresAt).toBe(150);
  expect(previewCurrent(p, scope, 149)).toBe(true);
  expect(previewCurrent(p, scope, 150)).toBe(false);
  expect(previewJson({ b: 2, a: 1 })).toBe(previewJson({ a: 1, b: 2 }));
  expect(previewJson([1, 2])).not.toBe(previewJson([2, 1]));
});
test.each(["đồng ý", "dong y", "yes", "OK."])("exact affirmative %s", (raw) =>
  expect(contextualReply(raw)).toBe("approve"),
);
test.each(["chưa gửi", "không", "no", "not yet"])(
  "decline is not cancellation: %s",
  (raw) => expect(contextualReply(raw)).toBe("decline"),
);
test.each(["tiếp tục", "continue", "review details"])(
  "advance to review is not approval: %s",
  (raw) => expect(contextualReply(raw)).toBe("review"),
);
test.each([
  "đồng ý nếu phí dưới 100",
  "ừ nhưng đổi số lượng",
  "số lượng 2 và đồng ý",
  "không phải tôi đồng ý",
  "đồng ý à?",
  "yes?",
  "‘yes’",
  '"yes"',
  "accept quote and refund",
  "I paid already",
  "received some items",
])("ambiguous/mixed/question/claim cannot consent: %s", (raw) =>
  expect(contextualReply(raw)).toBeNull(),
);
test.each([
  NaN,
  Infinity,
  undefined,
  new Date(),
  { x: undefined },
  { x: "x".repeat(32001) },
])("canonical input rejects unsafe data", (input) =>
  expect(() => previewJson(input)).toThrow(),
);
test("accessors are never executed by canonical preparation", () => {
  let called = false;
  const value = Object.defineProperty({}, "x", {
    enumerable: true,
    get() {
      called = true;
      return "unsafe";
    },
  });
  expect(() => previewJson(value)).toThrow();
  expect(called).toBe(false);
});

test.each([
  ["số lượng 2 và đồng ý", "số lượng 2"],
  ["quantity 3 and yes", "quantity 3"],
  ["yes, variant Blue", "variant Blue"],
])("mixed edit only %s", (raw, expected) =>
  expect(draftEditOnly(raw)).toBe(expected),
);
test.each([
  "quantity 2 and yes if cheap",
  "quantity 0 and yes",
  "quantity 2 and no",
  "quantity 2 and yes?",
  '"quantity 2 and yes"',
  "quantity 2 and yes and cancel",
])("ambiguous edit stays unparsed %s", (raw) =>
  expect(draftEditOnly(raw)).toBeNull(),
);
test.each([
  { epoch: -1 },
  { conversationVersion: 0.5 },
  { localRevision: NaN },
  { orderVersion: Infinity },
])("unsafe scope is rejected %j", async (change) => {
  await expect(
    createActionPreview(command, { ...scope, ...change }, 100),
  ).rejects.toThrow();
});
test("typed invalid payload, expected version and expired quote reject before consent", async () => {
  await expect(
    createActionPreview(
      { ...command, payload: { ...command.payload, quantity: 0 } },
      scope,
      100,
    ),
  ).rejects.toThrow();
  await expect(
    createActionPreview({ ...command, expectedOrderVersion: -1 }, scope, 100),
  ).rejects.toThrow();
  await expect(createActionPreview(command, scope, 100, 99)).rejects.toThrow();
});
test("reviewed displayed terms and amount are detached, frozen and included in digest", async () => {
  const details = [
    { vi: "Tổng", en: "Total", value: 700, kind: "money" as const },
  ];
  const a = await createActionPreview(command, scope, 100, 200, details);
  details[0].value = 900;
  const b = await createActionPreview(command, scope, 100, 200, details);
  expect(a.details[0].value).toBe(700);
  expect(Object.isFrozen(a.details[0])).toBe(true);
  expect(a.payloadHash).not.toBe(b.payloadHash);
});

test.each([8640000000000000, 1735689600000])(
  "request preview retains representable delivery date %s",
  async (desiredAt) => {
    const result = await createActionPreview(
      {
        action: "submitRequest",
        payload: {
          market: "US",
          items: [{ name: "Synthetic item", quantity: 1 }],
          desiredAt,
        },
      },
      scope,
      100,
    );
    expect((result.command.payload as { desiredAt: number }).desiredAt).toBe(
      desiredAt,
    );
  },
);
test("request preview rejects safe-integer date outside Date range", async () => {
  await expect(
    createActionPreview(
      {
        action: "submitRequest",
        payload: {
          market: "US",
          items: [{ name: "Synthetic item", quantity: 1 }],
          desiredAt: 8640000000000001,
        },
      },
      scope,
      100,
    ),
  ).rejects.toThrow("INVALID_PREVIEW");
});
