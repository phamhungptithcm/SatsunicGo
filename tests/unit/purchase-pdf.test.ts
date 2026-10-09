import { describe, expect, it } from "vitest";
import {
  renderPurchaseReceipt,
  type PurchaseReceiptData,
} from "../../functions/src/purchase-pdf";

// Read the renderer's standard PDF ToUnicode mapping and text-show operators.
// Assertions target the customer's extracted content, not drawing coordinates.
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
  id: "00000000-0000-4000-8000-000000000099",
  ownerId: "demo-customer",
  total: 4695000,
  provider: "demo",
  reference: "DEMO-00000000-0000-4000-8000-000000000099",
  paidAt: Date.UTC(2026, 9, 8, 16, 5, 6),
  purpose: "initial",
  previouslyPaid: 0,
  snapshotHash: "synthetic",
  shipping: { state: "uncollected" },
  lines: [
    {
      lineId: "one",
      orderId: "00000000-0000-4000-8000-000000000001",
      kind: "custom",
      name: "Tai nghe không dây",
      variant: "Trắng",
      quantity: 2,
      market: "US",
      goods: 2900000,
      service: 145000,
      total: 3045000,
      termsVersion: "v1",
    },
    {
      lineId: "two",
      orderId: "00000000-0000-4000-8000-000000000002",
      kind: "catalog",
      name: "Máy nghe nhạc niêm yết",
      variant: "",
      quantity: 1,
      market: "JP",
      goods: 1650000,
      service: 0,
      total: 1650000,
      termsVersion: "v1",
    },
  ],
};
function balance(reason: "sourcing" | "final"): PurchaseReceiptData {
  return {
    ...receipt,
    purpose: "balance",
    balanceReason: reason,
    total: 255000,
    previouslyPaid: 3245000,
    finalTotal: 3500000,
    previousReceiptId: "previous-receipt",
    lines: [
      {
        ...receipt.lines[0],
        name: "Bổ sung chi phí · Tai nghe không dây",
        goods: 255000,
        service: 0,
        total: 255000,
      },
    ],
  };
}
describe("purchase PDF customer presentation", () => {
  it("shows each product, quantities, exact unit goods price, row fee and collected totals", () => {
    const rows = readable(renderPurchaseReceipt(receipt));
    const all = rows.join("\n");
    for (const value of [
      "Tai nghe không dây",
      "Máy nghe nhạc niêm yết",
      "Đơn giá",
      "Phí mua hộ",
      "Thành tiền",
      "1.450.000 ₫",
      "145.000 ₫",
      "3.045.000 ₫",
      "1.650.000 ₫",
      "4.550.000 ₫",
      "4.695.000 ₫",
      "Đã gồm",
    ])
      expect(all).toContain(value);
    expect(rows.filter((r) => r === "4.695.000 ₫")).toHaveLength(1);
    expect(rows).toContain("2");
    expect(rows).toContain("1");
    expect(all).toContain(receipt.lines[0].orderId);
    expect(all).toContain(receipt.lines[1].orderId);
  });
  it("identifies actual demo method, exact Vietnam time and reference without inventing bank or recipient facts", () => {
    const all = readable(renderPurchaseReceipt(receipt)).join("\n");
    for (const value of [
      "Phương thức thanh toán",
      "Thanh toán demo",
      "Không thu tiền thật",
      "08/10/2026 · 23:05:06",
      "Giờ Việt Nam (GMT+7)",
      receipt.reference,
      "Không thay thế hóa đơn thuế.",
    ])
      expect(all).toContain(value);
    expect(all).not.toContain("PayOS");
    expect(all).not.toContain("Số tài khoản");
    expect(all).not.toContain("demo-customer");
  });
  it.each(["sourcing", "final"] as const)(
    "keeps %s incremental payment separate from goods unit prices and previously paid money",
    (reason) => {
      const rows = readable(renderPurchaseReceipt(balance(reason))),
        all = rows.join("\n");
      expect(all).toContain("Khoản bổ sung");
      expect(all).toContain("Thanh toán lần này");
      expect(all).toContain("3.245.000 ₫");
      expect(all).toContain("3.500.000 ₫");
      expect(rows.filter((r) => r === "255.000 ₫")).toHaveLength(2);
      expect(all).toContain("SG-previous-receipt");
      expect(all).toContain(
        reason === "sourcing" ? "Tổng giá đã duyệt" : "Tổng chi phí đã duyệt",
      );
      expect(all).not.toContain("Đơn giá");
      expect(all).not.toContain("127.500");
      expect(all).not.toContain("Bổ sung chi phí ·");
    },
  );
  it("keeps a fractional derived unit amount as an exact row total rather than rounding a price", () => {
    const data = {
      ...receipt,
      total: 1000,
      lines: [
        {
          ...receipt.lines[0],
          quantity: 3,
          goods: 1000,
          service: 0,
          total: 1000,
        },
      ],
    };
    const all = readable(renderPurchaseReceipt(data)).join("\n");
    expect(all).toContain("Theo tổng dòng");
    expect(all).toContain("Giá hàng cả dòng: 1.000 ₫");
    expect(all).not.toContain("333");
  });
  it("does not tell a listing-only customer that bundled freight is unpaid", () => {
    const all = readable(
      renderPurchaseReceipt({
        ...receipt,
        lines: [receipt.lines[1]],
        total: 1650000,
      }),
    ).join("\n");
    expect(all).toContain("Giá niêm yết là giá trọn gói.");
    expect(all).not.toContain("chưa thu");
  });
  it("preserves every long product's order reference and repeats table headings on subsequent product pages", () => {
    const lines = Array.from({ length: 30 }, (_, i) => ({
      ...receipt.lines[0],
      lineId: `long-${i}`,
      orderId: `ORDER-${i + 1}`,
      name: `Sản phẩm ${i + 1} - Tai nghe không dây phiên bản quốc tế và thông tin sản phẩm dài `.repeat(
        3,
      ),
    }));
    const pdf = renderPurchaseReceipt({
        ...receipt,
        lines,
        total: lines.reduce((sum, l) => sum + l.total, 0),
      }),
      rows = readable(pdf);
    const pages = (
      pdf.toString("binary").match(/\/Type \/Page \/Parent/g) ?? []
    ).length;
    expect(pages).toBeGreaterThan(1);
    expect(pages).toBeLessThanOrEqual(12);
    expect(pdf.length).toBeLessThan(3000000);
    expect(rows.filter((r) => r === "Sản phẩm").length).toBeGreaterThan(1);
    expect(rows.filter((r) => r.startsWith("Trang "))).toHaveLength(pages);
    for (let i = 1; i <= 30; i++) expect(rows).toContain(`Mã đơn: #ORDER-${i}`);
  });
});
