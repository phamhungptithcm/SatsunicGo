import { expect, test } from "vitest";
import { PayOS } from "@payos/node";
import {
  assertDemoProviderBinding,
  demoGatewayInput,
  demoWebhookSchema,
} from "../../packages/domain/purchase-provider";
const data = {
  orderCode: 200001,
  amount: 4695000,
  description: "SG 200001",
  accountNumber: "DEMO-NO-BANK" as const,
  reference: "DEMO-123",
  transactionDateTime: "2026-10-08T12:00:00Z",
  currency: "VND" as const,
  paymentLinkId: "a".repeat(32),
  code: "00" as const,
  desc: "Thành công",
};
const expected = {
  ...data,
  paidAt: Date.parse(data.transactionDateTime),
  status: "PAID",
};
test("exact persisted provider proof binds all money identifiers", () =>
  expect(() => assertDemoProviderBinding(data, expected)).not.toThrow());
test.each([
  { amount: 4694999 },
  { amount: 4695001 },
  { currency: "USD" },
  { orderCode: 200002 },
  { paymentLinkId: "b".repeat(32) },
  { reference: "DEMO-other" },
  { reference: undefined },
  { paidAt: expected.paidAt + 1 },
  { paidAt: undefined },
  { paidAt: -1 },
  { paidAt: Number.NaN },
  { status: "PENDING" },
  { status: "PROCESSING" },
  { status: "CANCELLED" },
  { status: "EXPIRED" },
])("rejects mismatched or unsettled provider evidence %j", (change) =>
  expect(() =>
    assertDemoProviderBinding(data, { ...expected, ...change }),
  ).toThrow("PROVIDER_PROOF_MISMATCH"),
);
test.each(["not-a-date", "2026-10-08T12:00:01Z"])(
  "rejects signed proof with invalid or altered payment time %s",
  (transactionDateTime) =>
    expect(() =>
      assertDemoProviderBinding({ ...data, transactionDateTime }, expected),
    ).toThrow("PROVIDER_PROOF_MISMATCH"),
);
test.each([
  { amount: 0 },
  { amount: -1 },
  { amount: 1.2 },
  { amount: Number.MAX_SAFE_INTEGER + 1 },
  { currency: "USD" },
  { accountNumber: "real-bank" },
  { paymentLinkId: "../../admin" },
  { reference: "DEMO-../../other" },
  { description: "x".repeat(81) },
  { code: "01" },
  { extra: "injection" },
])("rejects invalid callback body %j", (change) =>
  expect(
    demoWebhookSchema.safeParse({
      code: "00",
      desc: "ok",
      success: true,
      data: { ...data, ...change },
      signature: "a".repeat(64),
    }).success,
  ).toBe(false),
);
test.each([
  { success: false },
  { signature: "forged" },
  { extra: "injection" },
  { code: "01" },
])("rejects callback envelope %j", (change) =>
  expect(
    demoWebhookSchema.safeParse({
      code: "00",
      desc: "ok",
      success: true,
      data,
      signature: "a".repeat(64),
      ...change,
    }).success,
  ).toBe(false),
);
test.each([
  { id: "../other" },
  { action: "payosLive" },
  { amount: 1 },
  { returnUrl: "https://attacker.invalid" },
])("rejects client-controlled contract %j", (change) =>
  expect(
    demoGatewayInput.safeParse({
      id: "00000000-0000-4000-8000-000000000001",
      action: "pay",
      ...change,
    }).success,
  ).toBe(false),
);
test("mock payload is verified by official PayOS SDK and tamper is rejected", async () => {
  const sdk = new PayOS({
    clientId: "fixture",
    apiKey: "fixture",
    checksumKey: "fixture-not-a-merchant-key",
  });
  const signature = await sdk.crypto.createSignatureFromObj(
    data,
    sdk.checksumKey,
  );
  const body = demoWebhookSchema.parse({
    code: "00",
    desc: "ok",
    success: true,
    data,
    signature,
  });
  expect(await sdk.webhooks.verify(body)).toEqual(data);
  await expect(
    sdk.webhooks.verify({ ...body, data: { ...data, amount: 1 } }),
  ).rejects.toThrow();
});
test.each(["PAID", "UNDERPAID"])(
  "verified actual amount in %s is bound for review, never inferred as full payment",
  (status) => {
    expect(() =>
      assertDemoProviderBinding(
        { ...data, amount: 100 },
        { ...expected, status, paidAmount: 100 },
      ),
    ).not.toThrow();
    expect(() =>
      assertDemoProviderBinding(data, { ...expected, status, paidAmount: 100 }),
    ).toThrow("PROVIDER_PROOF_MISMATCH");
  },
);
