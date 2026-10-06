import { useState } from "react";
import { Link } from "react-router-dom";
import {
  calculateShippingRate,
  type ShippingRatesPublicSnapshot,
} from "../../../packages/domain/shipping-rates";
import { normalizeCatalogText } from "../../../packages/domain/catalog-search";
import styles from "./Ask.module.css";
export function shippingQuestionDirection(
  question: string,
): "VN_US" | "US_VN" | null {
  const text = normalizeCatalogText(question);
  if (!/\b(gui|ship|shipping|freight|van chuyen|cuoc|phi|gia)\b/.test(text))
    return null;
  if (
    /\b(?:my|usa|us|america|united states)\b.*\b(?:viet nam|vietnam|vn)\b/.test(
      text,
    )
  )
    return "US_VN";
  if (
    /\b(?:viet nam|vietnam|vn)\b.*\b(?:my|usa|us|america|united states)\b/.test(
      text,
    )
  )
    return "VN_US";
  return null;
}
export function questionWeightKg(question: string) {
  const found = question.match(
    /(?:^|\s)(\d{1,6}(?:[.,]\d{1,3})?)\s*(kg|kilograms?|kilos?|g|grams?)\b/i,
  );
  if (!found) return "";
  const value = Number(found[1].replace(",", "."));
  return String(/^g/i.test(found[2]) ? value / 1000 : value);
}
export function ShippingQuote({
  snapshot,
  direction,
  question,
  vi,
}: {
  snapshot: ShippingRatesPublicSnapshot;
  direction: "VN_US" | "US_VN";
  question: string;
  vi: boolean;
}) {
  const [weight, setWeight] = useState(questionWeightKg(question));
  const [service, setService] = useState<"standard" | "express" | "cargo">(
    direction === "US_VN"
      ? "cargo"
      : /(?:nhanh|express)/i.test(question)
        ? "express"
        : "standard",
  );
  const [warehouse, setWarehouse] = useState<
    "vietnam" | "texas_cali" | "oregon"
  >(direction === "VN_US" ? "vietnam" : "texas_cali");
  const [rowId, setRowId] = useState("");
  if (!snapshot.config)
    return (
      <p role="status">
        {vi
          ? "Biểu phí chưa được mở. Gửi thông tin hàng trong chat để được xem xét báo giá."
          : "Shipping rates are unavailable. Provide shipment details in this chat for quote review."}
      </p>
    );
  const config = snapshot.config,
    grams = Math.round(Number(weight.replace(",", ".")) * 1000);
  const available = config.rows.filter(
    (r) =>
      r.direction === direction &&
      r.service === service &&
      r.warehouse === warehouse,
  );
  const quote =
    Number.isSafeInteger(grams) && grams > 0 && grams <= 1_000_000_000
      ? calculateShippingRate(config, {
          direction,
          service,
          warehouse,
          weightGrams: grams,
          ...(rowId ? { rowId } : {}),
        })
      : null;
  return (
    <section
      className={styles.inlineForm}
      aria-label={vi ? "Tính cước trong chat" : "Shipping calculator in chat"}
    >
      <h3>
        {direction === "VN_US"
          ? vi
            ? "Việt Nam → Mỹ"
            : "Vietnam → US"
          : vi
            ? "Mỹ → Việt Nam"
            : "US → Vietnam"}
      </h3>
      <label>
        {vi ? "Khối lượng tính cước (kg)" : "Chargeable weight (kg)"}
        <input
          type="number"
          min="0.001"
          max="1000000"
          step="0.001"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </label>
      {direction === "VN_US" ? (
        <label>
          {vi ? "Dịch vụ" : "Service"}
          <select
            value={service}
            onChange={(e) =>
              setService(e.target.value as "standard" | "express")
            }
          >
            <option value="standard">{vi ? "Thông thường" : "Standard"}</option>
            <option value="express">{vi ? "Nhanh" : "Express"}</option>
          </select>
        </label>
      ) : (
        <>
          <label>
            {vi ? "Kho xuất gửi" : "Origin warehouse"}
            <select
              value={warehouse}
              onChange={(e) => {
                setWarehouse(e.target.value as "texas_cali" | "oregon");
                setRowId("");
              }}
            >
              <option value="texas_cali">Texas / California</option>
              <option value="oregon">Oregon</option>
            </select>
          </label>
          <label>
            {vi ? "Loại hàng" : "Goods category"}
            <select value={rowId} onChange={(e) => setRowId(e.target.value)}>
              <option value="">
                {vi ? "Chọn loại hàng" : "Choose goods category"}
              </option>
              {available.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <div aria-live="polite">
        {!quote ? (
          <p>
            {vi
              ? "Nhập khối lượng để kiểm tra cước."
              : "Enter the chargeable weight to check freight."}
          </p>
        ) : quote.status === "estimate" ? (
          <p>
            <strong>
              {vi ? "Cước vận chuyển dự tính" : "Estimated freight"}:{" "}
              {new Intl.NumberFormat(vi ? "vi-VN" : "en-US", {
                style: "currency",
                currency: quote.currency,
              }).format(
                quote.currency === "USD"
                  ? quote.freightMinor / 100
                  : quote.freightMinor,
              )}
            </strong>
          </p>
        ) : (
          <p>
            {vi
              ? "Cần xem xét báo giá cho khối lượng hoặc loại hàng này."
              : "This weight or goods category requires a quote review."}
          </p>
        )}
      </div>
      <p>
        {vi
          ? "Cước dự tính · phụ phí và thuế tính riêng."
          : "Estimated freight · surcharges and taxes are separate."}
      </p>
      <details>
        <summary>
          {vi ? "Điều kiện và phụ phí" : "Conditions and surcharges"}
        </summary>
        <p>
          {vi
            ? "Hàng cồng kềnh dùng cân quy đổi khi lớn hơn cân thực. Cước này chưa phải tổng tiền đã chốt hay ETA của đơn."
            : "Bulky goods use volumetric weight when greater than actual weight. This is not an approved total or an order ETA."}
        </p>
        <ul>
          {config.conditions.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      </details>
      <Link to="/fees">
        {vi ? "Xem toàn bộ biểu phí" : "View all shipping rates"}
      </Link>
    </section>
  );
}
