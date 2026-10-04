import { useEffect, useState, type FormEvent } from "react";
import { Consolidation } from "./Consolidation";
import { callService } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
import type { Parcel, Allocation } from "../../../packages/domain/shipping";
export function Shipping({ roles }: { roles: string[] }) {
  const mayPack = roles.some((r) => ["OWNER", "WAREHOUSE"].includes(r));
  const mayTrack = roles.some((r) =>
    ["OWNER", "OPERATIONS_MANAGER"].includes(r),
  );
  const [orders, setOrders] = useState<Order[]>([]),
    [parcels, setParcels] = useState<Parcel[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const [o, p] = await Promise.all([
        callService<{ rows: Order[] }>("listWork", { kind: "orders" }),
        callService<{ rows: Parcel[] }>("listWork", { kind: "packages" }),
      ]);
      setOrders(o.rows);
      setParcels(p.rows);
    } catch {
      setError("Chưa tải được hàng đợi kiện.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: string,
    parcel?: Parcel,
  ) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let payload: unknown;
      if (action === "packParcel") {
        const allocations: Allocation[] = [];
        for (const order of orders)
          order.items.forEach((_, line) => {
            const quantity = Number(f.get(`${order.id}:${line}`));
            if (quantity > 0)
              allocations.push({ orderId: order.id, line, quantity });
          });
        payload = {
          allocations,
          weightGrams: Number(f.get("weight")),
          dimensionsCm: [
            Number(f.get("length")),
            Number(f.get("width")),
            Number(f.get("height")),
          ],
          warehouse: String(f.get("warehouse")),
          route: String(f.get("route")),
          checklist: f.get("checklist") === "on",
          evidence: String(f.get("evidence")),
        };
      } else
        payload =
          action === "dispatchParcel"
            ? {
                carrier: String(f.get("carrier")),
                tracking: String(f.get("tracking")),
                handoffEvidence: String(f.get("evidence")),
              }
            : { state: String(f.get("state")), event: String(f.get("event")) };
      await callService("shippingCommand", {
        action,
        operationId: crypto.randomUUID(),
        orderVersions: Object.fromEntries(orders.map((o) => [o.id, o.version])),
        ...(parcel
          ? { parcelId: parcel.id, expectedVersion: parcel.version }
          : {}),
        payload,
      });
      setMessage("Đã lưu kiện và lịch sử vận chuyển.");
      await load();
    } catch {
      setError(
        "Chưa lưu được. Kiểm tra số lượng đã phân bổ, tiền, hold và phiên bản đơn.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workbench">
      <h2>Kiện hàng và xuất gửi</h2>
      <p>
        Kiện nội bộ không phải shipping label của hãng vận chuyển. Danh sách
        hiện tối đa 30 đơn và 30 kiện.
      </p>
      <button disabled={busy} onClick={() => void load()}>
        Tải lại kiện
      </button>
      {mayPack && (
        <details>
          <summary>Đóng kiện từ hàng đã kiểm và đóng gói</summary>
          <form
            className="form panel"
            onSubmit={(e) => void submit(e, "packParcel")}
          >
            {orders
              .filter((o) => o.packingComplete && !o.hold)
              .map((o) => (
                <fieldset key={o.id}>
                  <legend>{o.id}</legend>
                  {o.items.map((item, line) => (
                    <label key={line}>
                      {item.name} · {item.variant} · tối đa {item.quantity}
                      <input
                        name={`${o.id}:${line}`}
                        type="number"
                        min={0}
                        max={item.quantity}
                        step={1}
                        defaultValue={0}
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
            <label>
              Kho nguồn
              <input name="warehouse" required minLength={2} />
            </label>
            <label>
              Tuyến và hub đích
              <input name="route" required minLength={2} />
            </label>
            <label>
              Khối lượng (g)
              <input
                name="weight"
                type="number"
                min={1}
                max={1000000}
                required
              />
            </label>
            {[
              ["length", "Dài"],
              ["width", "Rộng"],
              ["height", "Cao"],
            ].map(([name, label]) => (
              <label key={name}>
                {label} (cm)
                <input
                  name={name}
                  type="number"
                  min={0.1}
                  max={1000}
                  step="any"
                  required
                />
              </label>
            ))}
            <label>
              Bằng chứng kiểm/đóng gói
              <textarea name="evidence" minLength={5} required />
            </label>
            <label>
              <input name="checklist" type="checkbox" required /> Đã kiểm sản
              phẩm, số lượng, điều kiện vận chuyển và đóng gói
            </label>
            <button disabled={busy}>Tạo kiện nội bộ</button>
          </form>
        </details>
      )}
      {(mayPack || mayTrack) && <Consolidation />}
      {parcels.map((p) => (
        <article key={p.id} className="panel order">
          <h3>Kiện {p.id}</h3>
          <p>
            {
              {
                packed: "Đã đóng kiện",
                in_transit: "Đang vận chuyển",
                delivered: "Đã giao kiện",
                failed: "Giao không thành công",
                returned: "Đã trả lại",
              }[p.state]
            }{" "}
            · {p.warehouse} → {p.route} · {p.weightGrams} g
          </p>
          <p>
            {p.allocations
              .map((a) => `${a.orderId}, dòng ${a.line + 1}: ${a.quantity}`)
              .join("; ")}
          </p>
          {p.state === "packed" && !p.batchId && mayPack ? (
            <form
              className="form"
              onSubmit={(e) => void submit(e, "dispatchParcel", p)}
            >
              <label>
                Hãng vận chuyển
                <input name="carrier" required minLength={2} />
              </label>
              <label>
                Mã vận đơn
                <input name="tracking" required minLength={3} />
              </label>
              <label>
                Bằng chứng bàn giao
                <textarea name="evidence" required minLength={5} />
              </label>
              <button disabled={busy}>Xác nhận bàn giao xuất gửi</button>
            </form>
          ) : (
            mayTrack &&
            ["in_transit", "failed"].includes(p.state) && (
              <form
                className="form"
                onSubmit={(e) => void submit(e, "trackParcel", p)}
              >
                <label>
                  Kết quả cập nhật thủ công
                  <select name="state">
                    <option value="in_transit">Đang vận chuyển</option>
                    <option value="delivered">Đã giao kiện này</option>
                    <option value="failed">Giao không thành công</option>
                    <option value="returned">Đã trả lại</option>
                  </select>
                </label>
                <label>
                  Nội dung sự kiện
                  <textarea name="event" minLength={3} required />
                </label>
                <button disabled={busy}>Lưu cập nhật vận chuyển</button>
              </form>
            )
          )}
        </article>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
