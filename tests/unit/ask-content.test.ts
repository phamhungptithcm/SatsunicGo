import { expect, test } from "vitest";
import sharp from "sharp";
import { toDataURL } from "qrcode";
import { sanitizeProductImage } from "../../functions/src/ai/product-images";
import { validatePaymentQr } from "../../packages/domain/payment-qr";
import { customerChatAction } from "../../packages/domain/chat-action";
import { fixtureQR } from "../fixtures/ask009";
import type { Order } from "../../packages/domain";
const expected = {
  amount: 650,
  accountNumber: "00000000",
  description: "SG 100001",
  bin: "970000",
};
test("QR must bind exact merchant, amount, reference and CRC; local rendering only", async () => {
  const qr = fixtureQR();
  expect(validatePaymentQr(qr, expected)).toBe(qr);
  const image = await toDataURL(qr);
  expect(image.startsWith("data:image/png;base64,")).toBe(true);
  for (const mutation of [
    { amount: 651 },
    { accountNumber: "00000001" },
    { description: "SG 100002" },
    { bin: "970001" },
  ])
    expect(() => validatePaymentQr(qr, { ...expected, ...mutation })).toThrow();
  expect(() => validatePaymentQr(qr.slice(0, -1) + "Z", expected)).toThrow();
  expect(() => validatePaymentQr("javascript:wrong", expected)).toThrow();
});
test.each(["jpeg", "png", "webp"] as const)(
  "server decodes and strips metadata from %s",
  async (format) => {
    const source = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "white" },
    })
      .toFormat(format)
      .withExif({ IFD0: { Copyright: "PRIVATE FIXTURE METADATA" } })
      .toBuffer();
    const clean = await sanitizeProductImage(source, `image/${format}`);
    const meta = await sharp(clean).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.icc).toBeUndefined();
    expect(meta.format).toBe("jpeg");
    expect(clean.includes(Buffer.from("PRIVATE FIXTURE"))).toBe(false);
  },
);
test("sanitizer rejects SVG/mismatched MIME/oversize/truncated decode", async () => {
  await expect(
    sanitizeProductImage(
      Buffer.from('<svg width="8" height="8"></svg>'),
      "image/png",
    ),
  ).rejects.toThrow();
  await expect(
    sanitizeProductImage(new Uint8Array(2 * 1024 * 1024 + 1), "image/jpeg"),
  ).rejects.toThrow();
  const png = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await expect(sanitizeProductImage(png, "image/jpeg")).rejects.toThrow();
  await expect(
    sanitizeProductImage(png.slice(0, 30), "image/png"),
  ).rejects.toThrow();
});
test("chat actions are explicit and follow the same domain next action; never credit claimed payments", () => {
  const draft = {
    market: "US",
    items: [{ name: "Fixture", variant: "42", quantity: 1, url: "" }],
    notes: "fixture",
  };
  expect(customerChatAction("gửi yêu cầu", null, draft)).toBe("submitRequest");
  expect(customerChatAction("gửi yêu cầu", null, {})).toBeNull();
  const order = {
    stage: "QUOTED",
    quote: { expiresAt: Date.now() + 10000 },
    collected: 0,
    refunded: 0,
  } as Order;
  expect(customerChatAction("chấp nhận báo giá", order, {})).toBe(
    "acceptQuote",
  );
  for (const text of [
    "đồng ý",
    "đã thanh toán",
    "đừng chấp nhận báo giá",
    "gửi tiền",
    "mua luôn nhé",
  ])
    expect(customerChatAction(text, order, {})).toBeNull();
  expect(
    customerChatAction("chấp nhận báo giá", { ...order, hold: "fixture" }, {}),
  ).toBeNull();
});

test("catalog chat does not accept quotes or final approval", () => {
  const order = { purchaseKind: "catalog", stage: "QUOTED", acceptedAt: 1, finalTotal: 1000, collected: 0, refunded: 0 } as Order;
  expect(customerChatAction("chấp nhận báo giá", order, {})).toBeNull();
  expect(customerChatAction("duyệt tổng phí cuối", { ...order, stage: "PACKED", finalApproved: false }, {})).toBeNull();
});
