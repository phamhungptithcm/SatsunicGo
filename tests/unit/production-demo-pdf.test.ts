import { expect, it } from "vitest";
import {
  renderPurchaseReceipt,
  type PurchaseReceiptData,
} from "../../functions/src/purchase-pdf";

// Assert customer-extracted content through PDF Unicode maps, not coordinates.
function readable(pdf: Buffer) {
  const source = pdf.toString("binary"),
    mapping = new Map<string, string>();
  for (const [, key, hex] of source.matchAll(
    /<([0-9a-f]{4})> <([0-9a-f]+)>/g,
  )) {
    const bytes = Buffer.from(hex, "hex");
    if (bytes.length % 2 === 0)
      mapping.set(key, bytes.swap16().toString("utf16le"));
  }
  return [...source.matchAll(/Tm <([0-9a-f]+)> Tj ET/g)].map(([, hex]) =>
    (hex.match(/.{4}/g) ?? []).map((key) => mapping.get(key) ?? "").join(""),
  );
}
const receipt: PurchaseReceiptData = {
  id: "10000000-0000-4000-8000-000000000002",
  ownerId: "synthetic-owner",
  provider: "sepay_sandbox",
  executionMode: "production_test",
  executionPolicyVersion: 2,
  testRunId: "20000000-0000-4000-8000-000000000001",
  reference: "synthetic-reference",
  paidAt: Date.UTC(2026, 9, 9),
  purpose: "initial",
  previouslyPaid: 0,
  snapshotHash: "synthetic",
  shipping: { state: "uncollected" },
  lines: Array.from({ length: 30 }, (_, index) => ({
    lineId: `line-${index}`,
    orderId: `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    kind: "custom",
    name: `Sản phẩm test ${index} ${"Thông tin dài ".repeat(8)}`,
    variant: "",
    quantity: 1,
    market: "US",
    goods: 100000,
    service: 0,
    total: 100000,
    termsVersion: "synthetic",
  })),
  total: 3000000,
};

it("simulation receipt explicitly denies receipt of funds on multi-page documents", () => {
  const pdf = renderPurchaseReceipt({
      ...receipt,
      provider: "production_demo",
    }),
    rows = readable(pdf),
    text = rows.join(" ");
  expect(text).toContain("Mô phỏng");
  expect(text).toContain("không xác nhận thu tiền");
  expect(rows).not.toContain("Đã thanh toán");
  expect(text).not.toContain("SePay");
  expect(text).not.toContain(receipt.ownerId);
  const pages = [
    ...pdf.toString("binary").matchAll(/\/Type \/Page(?: |\r|\n)/g),
  ].length;
  expect(rows.filter((row) => row === "CHỨNG TỪ TEST")).toHaveLength(pages);
});
