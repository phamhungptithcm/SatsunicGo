import { useRef, useState } from "react";
import type { Order } from "../../../packages/domain";
import {
  admitPurchaseSourcingAcknowledgement,
  decimalSourceMinor,
} from "../../../packages/domain/purchase-checkout";
import { callService, auth } from "../../shared/firebase";
import { Link } from "react-router-dom";
const money = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
export function PurchaseAdjustment({
  order,
  staff = false,
  onSaved,
}: {
  order: Order;
  staff?: boolean;
  onSaved?: () => void;
}) {
  const [price, setPrice] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    flight = useRef(false);
  const proposal = order.purchaseAdjustment,
    key = `purchase-price:${auth?.currentUser?.uid}:${order.id}`;
  const [pending, setPending] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem(key));
    } catch {
      return true;
    }
  });
  async function send() {
    if (flight.current) return;
    setError("");
    let command: unknown;
    try {
      command =
        JSON.parse(sessionStorage.getItem(key) ?? "null") ??
        (staff
          ? {
              action: "propose",
              operationId: crypto.randomUUID(),
              orderId: order.id,
              expectedVersion: order.version,
              sourceLimitMinor: decimalSourceMinor(
                price.replace(",", "."),
                order.market,
              ),
              reason,
            }
          : {
              action: "approve",
              operationId: crypto.randomUUID(),
              orderId: order.id,
              expectedVersion: order.version,
              proposalVersion: proposal!.version,
            });
      sessionStorage.setItem(key, JSON.stringify(command));
      setPending(true);
    } catch {
      setError(
        "Nhập tổng giá mua và lý do; trình duyệt cần lưu được lần gửi để kiểm tra lại.",
      );
      return;
    }
    flight.current = true;
    setBusy(true);
    const uid = auth?.currentUser?.uid;
    try {
      const result = await callService<unknown>("purchaseSourcingChange", command);
      try {
        admitPurchaseSourcingAcknowledgement(result, command);
      } catch {
        throw Error(
          "Có lần gửi đang chờ đối chiếu. Kiểm tra lại cùng lần gửi trước khi sửa giá.",
        );
      }
      sessionStorage.removeItem(key);
      if (auth?.currentUser?.uid !== uid) return;
      setPending(false);
      setSaved(true);
      onSaved?.();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (
        [
          "functions/aborted",
          "functions/invalid-argument",
          "functions/failed-precondition",
          "functions/permission-denied",
        ].includes(code)
      ) {
        sessionStorage.removeItem(key);
        if (auth?.currentUser?.uid === uid) setPending(false);
      }
      if (auth?.currentUser?.uid === uid) setError((e as Error).message);
    } finally {
      flight.current = false;
      if (auth?.currentUser?.uid === uid) setBusy(false);
    }
  }
  if (!order.upfront || order.stage !== "PURCHASING") return null;
  return (
    <section className="panel">
      <h3>Chênh lệch giá mua</h3>
      {pending && (
        <p role="status">
          Có lần gửi đang chờ đối chiếu. Kiểm tra lại cùng lần gửi trước khi sửa
          giá.
        </p>
      )}
      {proposal && (
        <>
          <p>{proposal.reason}</p>
          <p>
            Tổng giá hàng và phí mua hộ mới:{" "}
            <strong>{money(proposal.total)}</strong> · Còn trả:{" "}
            <strong>
              {money(
                Math.max(0, proposal.total - order.collected + order.refunded),
              )}
            </strong>
          </p>
          <p>
            {proposal.approved
              ? "Khách đã duyệt giá mới. Cần đủ tiền trước khi mua tiếp."
              : "Đang chờ khách duyệt giá mới."}
          </p>
        </>
      )}
      {staff ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label>
            Tổng giá hàng dự kiến cho toàn bộ món (
            {order.upfront.sourceCurrency})
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={busy || pending || Boolean(order.balanceCheckoutId)}
              required
            />
          </label>
          <label>
            Lý do và tham chiếu giá mới
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={5}
              maxLength={1000}
              disabled={busy || pending || Boolean(order.balanceCheckoutId)}
              required
            />
          </label>
          <button disabled={busy || Boolean(order.balanceCheckoutId)}>
            {busy
              ? "Đang gửi…"
              : pending
                ? "Kiểm tra lại lần gửi"
                : "Gửi khách duyệt giá mới"}
          </button>
        </form>
      ) : proposal && !proposal.approved ? (
        <button disabled={busy || saved} onClick={() => void send()}>
          Duyệt giá mua mới
        </button>
      ) : proposal?.approved &&
        Math.max(0, proposal.total - order.collected + order.refunded) > 0 ? (
        <Link
          to={
            order.balanceCheckoutId
              ? `/checkout/payment/${order.balanceCheckoutId}`
              : `/checkout?order=${order.id}`
          }
        >
          Xem tổng quan và thanh toán chênh lệch
        </Link>
      ) : null}
      {saved && (
        <p role="status">Đã ghi nhận. Tải lại đơn để xem trạng thái mới.</p>
      )}
      {error && (
        <p role="alert">
          {error}{" "}
          <button disabled={busy} onClick={() => void send()}>
            Kiểm tra lại lần gửi
          </button>
        </p>
      )}
    </section>
  );
}
