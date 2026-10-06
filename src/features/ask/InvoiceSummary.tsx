import type { Order } from "../../../packages/domain";
import { quoteTotal } from "../../../packages/domain";
import styles from "./Ask.module.css";
export function InvoiceSummary({
  order,
  vi,
  money,
}: {
  order: Order;
  vi: boolean;
  money: (n: number) => string;
}) {
  const q = order.quote;
  const catalog = order.purchaseKind === "catalog";
  const total =
    order.finalTotal ??
    (catalog ? order.catalogSnapshot?.total : q ? quoteTotal(q) : undefined);
  if (total === undefined) return null;
  const done = ["COMPLETED", "CANCELLED"].includes(order.stage);
  const paid = order.collected - order.refunded;
  const rows: [string, string, number][] = q
    ? [
        ["Tiền hàng", "Goods", q.goods],
        ["Phí mua hộ", "Buying fee", q.service],
        ["Phí tại nguồn", "Source costs", q.sourceCosts],
        [
          "Vận chuyển quốc tế",
          "International shipping",
          q.internationalShipping,
        ],
        ["Giao tại nơi nhận", "Destination shipping", q.destinationShipping],
        ["Giảm giá", "Discount", q.discount],
      ]
    : [];
  return (
    <>
      <div className={styles.totalHero}>
        <span>
          {vi
            ? order.finalTotal !== undefined
              ? "Tổng thanh toán"
              : "Tổng báo giá"
            : order.finalTotal !== undefined
              ? "Total payment"
              : "Quote total"}
        </span>
        <strong>{money(total)}</strong>
        <span>
          {done
            ? vi
              ? "Đã xác nhận"
              : "Verified payment"
            : vi
              ? "Tiền đã xác nhận"
              : "Verified payment"}{" "}
          · {money(paid)}
        </span>
      </div>
      {!done && !catalog && q && !order.finalApproved && (
        <div className={styles.depositLine}>
          <span>{vi ? "Thanh toán cọc 50%" : "50% deposit"}</span>
          <strong>
            {money(order.deposit ?? Math.ceil(quoteTotal(q) / 2))}
          </strong>
        </div>
      )}
      <details className={styles.quoteDetails}>
        <summary>{vi ? "Chi tiết thanh toán" : "Payment details"}</summary>
        {q && (
          <>
            <p className={styles.smallPrint}>{q.verifiedProduct}</p>
            <dl className={styles.invoiceRows}>
              {rows.map(([a, b, n]) => (
                <div key={b}>
                  <dt>{vi ? a : b}</dt>
                  <dd>
                    {n && b === "Discount" ? "−" : ""}
                    {money(n)}
                  </dd>
                </div>
              ))}
              <div className={styles.invoiceTotal}>
                <dt>{vi ? "Tổng báo giá" : "Quote total"}</dt>
                <dd>{money(quoteTotal(q))}</dd>
              </div>
            </dl>
            <p className={styles.smallPrint}>
              {vi ? "Hiệu lực đến" : "Valid until"}:{" "}
              {new Date(q.expiresAt).toLocaleString(vi ? "vi-VN" : "en-US")}
            </p>
            <p className={styles.smallPrint}>
              {vi ? "Điều khoản" : "Terms"}: {q.termsVersion}
            </p>
          </>
        )}
        {catalog && order.catalogSnapshot && (
          <dl className={styles.invoiceRows}>
            <div>
              <dt>{vi ? "Giá sản phẩm" : "Product price"}</dt>
              <dd>
                {money(order.catalogSnapshot.unitPrice)} ×{" "}
                {order.catalogSnapshot.quantity}
              </dd>
            </div>
          </dl>
        )}
        <p className={styles.smallPrint}>
          {vi
            ? "Tiền đã xác nhận đã trừ khoản hoàn tiền."
            : "Verified payments are net of refunds."}
        </p>
      </details>
    </>
  );
}
