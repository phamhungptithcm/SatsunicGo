import { expect, test } from "vitest";
import { createHmac } from "node:crypto";
import { PayOS } from "@payos/node";
test("official payOS verifier rejects forged and modified fixture callbacks", async () => {
  const checksum = "fixture-checksum-not-a-merchant-secret";
  const client = new PayOS({
    clientId: "fixture-client",
    apiKey: "fixture-api-not-a-secret",
    checksumKey: checksum,
  });
  const data = {
    orderCode: 123,
    amount: 1000000,
    description: "fixture",
    accountNumber: "0000000000",
    reference: "fixture-reference",
    transactionDateTime: "2026-10-04 00:00:00",
    currency: "VND",
    paymentLinkId: "fixture-link",
    code: "00",
    desc: "fixture",
  };
  const message = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key as keyof typeof data]}`)
    .join("&");
  const signature = createHmac("sha256", checksum)
    .update(message)
    .digest("hex");
  const webhook = {
    code: "00",
    desc: "fixture",
    success: true,
    data,
    signature,
  };
  expect(await client.webhooks.verify(webhook)).toEqual(data);
  await expect(
    client.webhooks.verify({ ...webhook, signature: "forged" }),
  ).rejects.toThrow();
  await expect(
    client.webhooks.verify({ ...webhook, data: { ...data, amount: 1000001 } }),
  ).rejects.toThrow();
});
