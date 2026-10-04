import { useEffect, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
import type { Parcel } from "../../../packages/domain/shipping";
import type { Batch } from "../../../packages/domain/consolidation";
export function Consolidation() {
  const [orders, setOrders] = useState<Order[]>([]),
    [parcels, setParcels] = useState<Parcel[]>([]),
    [batches, setBatches] = useState<Batch[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const [o, p, b] = await Promise.all([
        callService<{ rows: Order[] }>("listWork", { kind: "orders" }),
        callService<{ rows: Parcel[] }>("listWork", { kind: "packages" }),
        callService<{ rows: Batch[] }>("listWork", {
          kind: "consolidationBatches",
        }),
      ]);
      setOrders(o.rows);
      setParcels(p.rows);
      setBatches(b.rows);
    } catch {
      setMessage("Chưa tải được lô gom. Thử tải lại.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>, batch?: Batch) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const parcelIds = f.getAll("parcel").map(String);
      const members = new Set(
        parcels
          .filter((p) => parcelIds.includes(p.id))
          .flatMap((p) => p.allocations.map((a) => a.orderId)),
      );
      await callService("consolidationCommand", {
        action: batch ? "dispatch" : "seal",
        operationId: crypto.randomUUID(),
        ...(batch ? { batchId: batch.id, expectedVersion: batch.version } : {}),
        orderVersions: Object.fromEntries(orders.map((o) => [o.id, o.version])),
        parcelVersions: Object.fromEntries(
          parcels.map((p) => [p.id, p.version]),
        ),
        payload: batch
          ? {
              carrier: String(f.get("carrier")),
              tracking: String(f.get("tracking")),
              handoffEvidence: String(f.get("evidence")),
            }
          : {
              parcelIds,
              orderWeights: Object.fromEntries(
                [...members].map((id) => [id, Number(f.get(`weight:${id}`))]),
              ),
              freight: Number(f.get("freight")),
              hub: String(f.get("hub")),
              service: String(f.get("service")),
              cutoff: new Date(String(f.get("cutoff"))).getTime(),
            },
      });
      setMessage(
        batch
          ? "Đã ghi nhận bàn giao toàn bộ lô."
          : "Đã chốt phân bổ cước. Cần lập tổng tiền cuối và khách duyệt trước khi xuất gửi.",
      );
      await load();
    } catch {
      setMessage(
        "Chưa lưu được. Tải lại và kiểm tra toàn bộ kiện, phân bổ cước, hạn bàn giao, tiền và hold của từng đơn.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workbench">
      <h2>Gom kiện và phân bổ cước</h2>
      <p>
        Hiện tối đa 30 bản ghi mỗi loại. Mỗi lô phải gồm toàn bộ kiện của các
        đơn tham gia, cùng kho và tuyến. Chốt lô chưa ghi nhận thu tiền.
      </p>
      <button disabled={busy} onClick={() => void load()}>
        Tải lại lô gom
      </button>
      <details>
        <summary>Tạo lô gom</summary>
        <form className="form panel" onSubmit={(e) => void submit(e)}>
          {parcels
            .filter((p) => p.state === "packed" && !p.batchId)
            .map((p) => (
              <label key={p.id}>
                <input type="checkbox" name="parcel" value={p.id} />
                {p.id} · {p.weightGrams} g · {p.route}
              </label>
            ))}
          {orders
            .filter((o) => o.packingComplete && !o.consolidatedFreight)
            .map((o) => (
              <label key={o.id}>
                Khối lượng phân bổ cho đơn {o.id} (g)
                <input
                  name={`weight:${o.id}`}
                  type="number"
                  min={1}
                  max={1000000}
                />
              </label>
            ))}
          <p>
            Tổng khối lượng phân bổ phải bằng tổng khối lượng các kiện đã chọn.
          </p>
          <label>
            Tổng cước quốc tế (₫)
            <input name="freight" type="number" min={0} step={1} required />
          </label>
          <label>
            Hub đích
            <input name="hub" minLength={2} required />
          </label>
          <label>
            Dịch vụ vận chuyển
            <input name="service" minLength={2} required />
          </label>
          <label>
            Hạn bàn giao theo giờ địa phương
            <input name="cutoff" type="datetime-local" required />
          </label>
          <button disabled={busy}>Chốt lô và phân bổ cước</button>
        </form>
      </details>
      {batches.map((b) => (
        <article className="panel order" key={b.id}>
          <h3>Lô {b.id}</h3>
          <p>
            {b.state === "sealed" ? "Chờ bàn giao" : "Đã bàn giao"} · {b.route}{" "}
            · {b.hub} · {b.service}
          </p>
          <p>Hạn bàn giao: {new Date(b.cutoff).toLocaleString("vi-VN")}</p>
          <p>Tổng cước: {b.freight.toLocaleString("vi-VN")} ₫</p>
          {Object.entries(b.shares).map(([id, share]) => (
            <p key={id}>
              Đơn {id}: {share.toLocaleString("vi-VN")} ₫
            </p>
          ))}
          {b.state === "sealed" && (
            <form className="form" onSubmit={(e) => void submit(e, b)}>
              <label>
                Hãng vận chuyển
                <input name="carrier" minLength={2} required />
              </label>
              <label>
                Mã vận đơn lô
                <input name="tracking" minLength={3} required />
              </label>
              <label>
                Bằng chứng bàn giao
                <textarea name="evidence" minLength={5} required />
              </label>
              <button disabled={busy}>Xác nhận xuất gửi toàn bộ lô</button>
            </form>
          )}
        </article>
      ))}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
