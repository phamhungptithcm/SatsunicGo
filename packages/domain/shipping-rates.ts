import { z } from "zod";

const amount = z.number().int().nonnegative().max(100_000_000_000);
export const shippingRateRowSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,64}$/),
    direction: z.enum(["VN_US", "US_VN"]),
    warehouse: z.enum(["vietnam", "texas_cali", "oregon"]),
    service: z.enum(["standard", "express", "cargo"]),
    label: z.string().trim().min(1).max(240),
    currency: z.enum(["VND", "USD"]),
    pricing: z.enum(["total", "per_kg", "quote"]),
    amountMinor: amount.nullable(),
    priceDisplay: z.string().trim().min(1).max(80),
    clearance: z.string().trim().max(80),
    minGrams: z.number().int().positive().max(1_000_000_000),
    maxGrams: z.number().int().positive().max(1_000_000_000).nullable(),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.maxGrams !== null && r.maxGrams < r.minGrams)
      ctx.addIssue({
        code: "custom",
        message: "Khoảng khối lượng không hợp lệ.",
      });
    if ((r.pricing === "quote") !== (r.amountMinor === null))
      ctx.addIssue({
        code: "custom",
        message: "Giá cần xác nhận không được dùng để tính cước.",
      });
    if ((r.direction === "VN_US") !== (r.warehouse === "vietnam"))
      ctx.addIssue({
        code: "custom",
        message: "Kho không thuộc chiều vận chuyển.",
      });
    if ((r.direction === "VN_US") !== (r.currency === "VND"))
      ctx.addIssue({
        code: "custom",
        message: "Đơn vị tiền không thuộc bảng giá.",
      });
    if (r.pricing === "total" && r.minGrams !== r.maxGrams)
      ctx.addIssue({
        code: "custom",
        message: "Giá trọn mốc chỉ dùng đúng khối lượng công bố.",
      });
  });
export const shippingRateConfigSchema = z
  .object({
    sourceLabel: z.string().trim().min(1).max(160),
    sourceUrls: z
      .array(
        z
          .string()
          .url()
          .refine((v) => {
            const u = new URL(v);
            return (
              u.protocol === "https:" &&
              u.hostname === "www.vietcargo.vn" &&
              !u.username &&
              !u.password
            );
          }),
      )
      .min(1)
      .max(2),
    conditions: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
    rows: z.array(shippingRateRowSchema).min(1).max(160),
  })
  .strict()
  .superRefine((c, ctx) => {
    const ids = new Set<string>();
    for (const r of c.rows) {
      if (ids.has(r.id))
        ctx.addIssue({ code: "custom", message: "Mã dòng giá bị trùng." });
      ids.add(r.id);
    }
  });
export type ShippingRateConfig = z.infer<typeof shippingRateConfigSchema>;
export type ShippingRateRow = z.infer<typeof shippingRateRowSchema>;
export type ShippingRatesSnapshot = {
  version: number;
  config: ShippingRateConfig | null;
  publishedVersion: number | null;
};
export type ShippingRatesPublicSnapshot = {
  version: number | null;
  config: ShippingRateConfig | null;
  origin: "reference" | "published" | "unavailable";
};
export const shippingQuoteInputSchema = z
  .object({
    direction: z.enum(["VN_US", "US_VN"]),
    service: z.enum(["standard", "express", "cargo"]),
    warehouse: z.enum(["vietnam", "texas_cali", "oregon"]),
    weightGrams: z.number().int().positive().max(1_000_000_000),
    rowId: z.string().max(64).optional(),
  })
  .strict();
export type ShippingQuoteInput = z.infer<typeof shippingQuoteInputSchema>;
export type ShippingQuote =
  | {
      status: "estimate";
      currency: "VND" | "USD";
      freightMinor: number;
      rowId: string;
      chargeableGrams: number;
    }
  | { status: "quote_required" };
/** Freight only. No bracket rounding, interpolation, FX, tax or surcharge assumptions. */
export function calculateShippingRate(
  config: ShippingRateConfig,
  raw: ShippingQuoteInput,
): ShippingQuote {
  const p = shippingQuoteInputSchema.parse(raw);
  const grams =
    p.direction === "US_VN" ? Math.max(1000, p.weightGrams) : p.weightGrams;
  const candidates = config.rows.filter(
    (r) =>
      r.direction === p.direction &&
      r.service === p.service &&
      r.warehouse === p.warehouse &&
      grams >= r.minGrams &&
      (r.maxGrams === null || grams <= r.maxGrams) &&
      (p.direction === "VN_US" || r.id === p.rowId),
  );
  // Oregon table and separate +$2/kg note are ambiguous: retain values but require confirmation.
  if (candidates.length !== 1 || p.warehouse === "oregon")
    return { status: "quote_required" };
  const r = candidates[0];
  if (r.pricing === "quote" || r.amountMinor === null)
    return { status: "quote_required" };
  const freight =
    r.pricing === "total" ? r.amountMinor : (r.amountMinor * grams) / 1000;
  if (!Number.isSafeInteger(freight)) return { status: "quote_required" };
  return {
    status: "estimate",
    currency: r.currency,
    freightMinor: freight,
    rowId: r.id,
    chargeableGrams: grams,
  };
}

const VN_SOURCE =
  "https://www.vietcargo.vn/bang-gia-gui-hang-tu-viet-nam-di-my/";
const US_SOURCE = "https://www.vietcargo.vn/bang-gia-ship-hang-tu-my/";
const vnAmounts: Array<[number, number | null, number | null]> = [
  [1000, 1300000, 1549999],
  [1500, 1450000, 1699999],
  [2000, 1550000, 1799999],
  [2500, 1750000, 2099999],
  [3000, 1900000, 2149999],
  [3500, 2050000, 2349999],
  [4000, 2250000, 2499999],
  [4500, 2350000, 2649999],
  [5000, 2450000, 2849999],
  [5500, null, null],
  [6000, 3000000, 3149999],
  [6500, 3150000, 3349999],
  [7000, 3250000, 3549999],
  [7500, 3400000, 3599999],
  [8000, 3450000, 3649999],
  [8500, 3550000, 3799999],
  [9000, 3650000, 4049999],
  [9500, 3750000, 4199999],
  [10000, 3900000, 4399999],
  [10500, 4250000, 4749999],
];
const vnRows: ShippingRateRow[] = vnAmounts.flatMap(
  ([grams, standard, express]) =>
    (["standard", "express"] as const).map((service, i) => {
      const value = i === 0 ? standard : express;
      return {
        id: `vn-${service}-${grams}`,
        direction: "VN_US",
        warehouse: "vietnam",
        service,
        label: `${grams / 1000} kg`,
        currency: "VND",
        pricing: value === null ? "quote" : "total",
        amountMinor: value,
        priceDisplay:
          value === null ? "Liên hệ xác nhận" : `${value} VND / mốc`,
        clearance: "Chưa gồm thuế và phí hải quan nước nhận",
        minGrams: grams,
        maxGrams: grams,
      };
    }),
);
for (const [minGrams, maxGrams, value] of [
  [21000, 44000, 239999],
  [45000, 70000, 229999],
  [71000, 99000, 219999],
  [100000, null, 209999],
] as const)
  vnRows.push({
    id: `vn-cargo-${minGrams}`,
    direction: "VN_US",
    warehouse: "vietnam",
    service: "cargo",
    label:
      maxGrams === null
        ? "Từ 100 kg"
        : `${minGrams / 1000}–${maxGrams / 1000} kg`,
    currency: "VND",
    pricing: "per_kg",
    amountMinor: value,
    priceDisplay: `${value} VND / kg`,
    clearance: "Chưa gồm thuế và phí hải quan nước nhận",
    minGrams,
    maxGrams,
  });
// Exact published numeric facts; ambiguous product/tier units remain quote-only.
const usProducts: Array<[string, string, number, string, boolean?]> = [
  ["food", "Sữa, bánh kẹo, thực phẩm, dụng cụ nhà bếp", 890, "Miễn phí"],
  ["clothes", "Quần áo, vải, đồ dùng trong gia đình", 890, "Miễn phí"],
  ["baby", "Hàng em bé, đồ chơi không điện, nôi, xe đẩy", 890, "Miễn phí"],
  ["vitamins", "Thuốc bổ, vitamin, thực phẩm chức năng", 890, "Miễn phí"],
  ["beauty-tools", "Dụng cụ làm đẹp, chăm sóc da", 890, "Miễn phí"],
  ["tobacco", "Thuốc lá, xì gà", 2900, "Miễn phí"],
  ["wine", "Rượu vang, rượu nhẹ", 2500, "Miễn phí"],
  ["iphone-11-16", "iPhone 11–16", 4000, "Miễn phí", true],
  ["phones", "Samsung Fold, iPhone 17", 9900, "Miễn phí", true],
  ["clocks", "Đồng hồ treo tường, để bàn", 890, "Miễn phí"],
  ["parts", "Phụ tùng ô tô, xe máy", 990, "Miễn phí"],
  ["sports", "Dụng cụ thể thao", 990, "Miễn phí"],
  ["furniture", "Đồ nội thất, trang trí", 990, "Miễn phí"],
  ["cosmetics", "Sản phẩm điều trị, mỹ phẩm, kem dưỡng da", 990, "Miễn phí"],
  ["discs", "CD, đĩa than, DVD", 990, "1 USD"],
  ["watches", "Đồng hồ đeo tay dưới 200–dưới 1000 USD", 990, "1 / 5 USD", true],
  ["helmets", "Mũ bảo hiểm", 890, "1 USD"],
  ["fashion", "Giày dép, túi xách, ví, thắt lưng", 890, "1 USD"],
  ["glasses", "Mắt kính thời trang", 890, "1 USD"],
  ["perfume", "Nước hoa", 990, "1 USD"],
  ["lighters", "Hộp quẹt, Zippo", 990, "1 USD"],
  ["camera", "Máy ảnh du lịch", 990, "5 USD"],
  ["milk-machines", "Máy hút sữa, máy hâm sữa", 890, "10 USD"],
  ["suitcase", "Vali kéo", 890, "20 USD"],
  ["office", "Thiết bị văn phòng", 890, "20 USD"],
  ["laptop", "Laptop HP, Sony, Surface, Lenovo", 990, "40 USD"],
  ["server-mining", "Server mạng, máy đào Bitcoin", 990, "5% giá trị"],
  ["macbook", "Macbook Pro/Air", 990, "50 USD"],
  ["bicycle", "Xe đạp thường", 890, "40 USD"],
  ["carbon-bike", "Xe đạp carbon", 890, "3% giá trị"],
  ["components", "Linh kiện máy vi tính, thiết bị điện tử", 990, "5% giá trị"],
  [
    "apple-accessories",
    "iPod, AirPods, Apple Watch, tai Bluetooth",
    890,
    "5% giá trị",
  ],
  ["jewelry", "Trang sức, đồng hồ, hàng hiệu, kim loại quý", 890, "8% giá trị"],
  ["instruments", "Dụng cụ âm nhạc", 890, "8% giá trị"],
  ["medical", "Thiết bị và dụng cụ y tế", 990, "8% giá trị"],
  ["tv", "TV, màn hình LCD, server", 990, "8% giá trị"],
  ["dslr", "Ống kính, máy ảnh DSLR", 990, "8% giá trị"],
  ["games", "Máy chơi game, máy đọc sách", 890, "10 USD"],
  [
    "kitchen-machines",
    "Máy cà phê, làm bánh, bếp nướng, lò vi sóng gia đình",
    890,
    "15 USD",
  ],
  [
    "tablet",
    "Máy tính bảng: 200 / 500 / 1000 USD",
    990,
    "10 / 20 / 30 USD",
    true,
  ],
  ["ipad", "iPad: 200 / 500 / 1000 USD", 990, "10 / 20 / 30 USD", true],
  ["lighters-repeat", "Hộp quẹt, Zippo (dòng lặp trong nguồn)", 990, "1 USD"],
  [
    "small-electronics",
    "RAM, webcam, TV connect, điện tử nhỏ",
    890,
    "5% giá trị",
  ],
  ["sport-rods", "Vợt tennis, gậy golf, gậy bida, cần câu", 990, "5 USD"],
  ["vacuum", "Máy hút bụi, máy ghi âm", 990, "10 USD"],
  ["workstation", "Workstation laptop", 890, "5% giá trị"],
];
const usRows: ShippingRateRow[] = (["texas_cali", "oregon"] as const).flatMap(
  (warehouse) =>
    usProducts.map(([id, label, base, clearance, ambiguous]) => {
      const value =
        warehouse === "oregon"
          ? id === "tobacco"
            ? 3000
            : ["wine", "iphone-11-16", "phones"].includes(id)
              ? base
              : base + 200
          : base;
      return {
        id: `us-${warehouse.replaceAll("_", "-")}-${id}`,
        direction: "US_VN",
        warehouse,
        service: "cargo",
        label,
        currency: "USD",
        pricing: ambiguous ? "quote" : "per_kg",
        amountMinor: ambiguous ? null : value,
        priceDisplay:
          id === "iphone-11-16"
            ? "40–80 USD · xác nhận đơn vị"
            : id === "phones"
              ? "99 USD · xác nhận đơn vị"
              : `${value / 100} USD / kg`,
        clearance,
        minGrams: 1000,
        maxGrams: null,
      };
    }),
);
/** Local reference only: never persisted or represented as a published config implicitly. */
export const vietCargoReferenceRates: ShippingRateConfig =
  shippingRateConfigSchema.parse({
    sourceLabel: "VietCargo · Việt Nam → Mỹ 10/2026; Mỹ → Việt Nam 01/02/2026",
    sourceUrls: [VN_SOURCE, US_SOURCE],
    conditions: [
      "Cước tham khảo; nhân viên xác nhận loại hàng, kích thước và điểm đến trước khi nhận gửi. Không phải tổng tiền thanh toán.",
      "Việt Nam → Mỹ: đúng mốc khối lượng công bố; 5,5 kg và các khoảng chưa có giá cần báo giá riêng. Thường 8–12 ngày; nhanh 6–8 ngày, không phải ngày đến của đơn.",
      "Việt Nam → Mỹ chưa gồm VAT và phí hải quan nước nhận. Thực phẩm: FDA 200.000 VND/đơn. Mỹ phẩm dưới 4 món và dưới 2 kg: MSDS 250.000 VND/đơn; trên 2 kg: 70.000 VND/kg tiếp theo, cần xác nhận điều kiện.",
      "Khối lượng quy đổi: dài × rộng × cao / 5000, kích thước cm. Nhân viên xác nhận khối lượng tính cước.",
      "Mỹ → Việt Nam: tối thiểu 1 kg/đơn; USD, không tự quy đổi sang VND. Phí thông quan hiển thị riêng, không cộng tự động khi đơn vị hoặc mức áp dụng chưa rõ.",
      "Oregon: bảng đã hiển thị 10,9 / 11,9 USD và nguồn còn ghi cộng 2 USD/kg; cần xác nhận để tránh cộng hai lần. Nguồn ghi thông quan 3% với sản phẩm riêng lẻ từ 200 USD; không tự chọn giữa ghi chú và từng dòng.",
      "Mỹ → Việt Nam áp dụng hàng phi mậu dịch; hàng kinh doanh cần báo giá riêng. Tỷ giá theo thời điểm thanh toán; bảo hiểm 3% tùy chọn. Thời gian tham khảo 7–12 ngày làm việc từ khi nhận tại Mỹ.",
      "Bảng này không xác nhận mọi mặt hàng đều được phép vận chuyển; nhân viên kiểm tra từng lô hàng.",
    ],
    rows: [...vnRows, ...usRows],
  });
