import { useEffect, useState, type FormEvent } from "react";
import { callService, sendCommand } from "../../shared/firebase";
import { stageLabels, quoteTotal, type Order } from "../../../packages/domain";
import { ProposeChange } from "../orders/Changes";
export function Workbench({ roles }: { roles: string[] }) {
  const [orders, setOrders] = useState<Order[]>([]),
    [selected, setSelected] = useState<Order | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [next, setNext] = useState<string | null>(null);
  async function load(after?: string) {
    setError("");
    try {
      const r = await callService<{ rows: Order[]; next: string | null }>(
        "listWork",
        { kind: "orders", ...(after ? { after } : {}) },
      );
      setOrders(r.rows);
      setNext(r.next);
      setSelected(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="workbench">
      <div className="pageHeading">
        <h2>Hàng đợi đơn mua hộ</h2>
        <button onClick={() => void load()} disabled={busy}>
          Tải lại
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="workColumns">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Thị trường</th>
                <th>Trạng thái</th>
                <th>Đã thu ròng</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button
                      className="textbutton"
                      onClick={() => setSelected(o)}
                    >
                      {o.items[0]?.name}
                    </button>
                  </td>
                  <td>{o.market}</td>
                  <td>{stageLabels[o.stage]}</td>
                  <td>
                    {(o.collected - o.refunded).toLocaleString("vi-VN")} ₫
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && (
            <p className="notice">Chưa có đơn trong phạm vi được phân công.</p>
          )}
          {next && (
            <button onClick={() => void load(next)}>Trang tiếp theo</button>
          )}
        </div>
        {selected && (
          <div className="panel">
            <h2>{selected.items[0]?.name}</h2>
            <p>
              {stageLabels[selected.stage]} · phiên bản {selected.version}
            </p>
            <p>
              {selected.items
                .map(
                  (i) =>
                    `${i.name} · ${i.variant || "Cần làm rõ biến thể"} · ${i.quantity}`,
                )
                .join("; ")}
            </p>
            {selected.preferredStore && (
              <p>Cửa hàng mong muốn: {selected.preferredStore}</p>
            )}
            {selected.budget !== undefined && (
              <p>
                Ngân sách khách dự kiến:{" "}
                {selected.budget.toLocaleString("vi-VN")} ₫
              </p>
            )}
            {selected.desiredAt && (
              <p>
                Ngày khách mong muốn:{" "}
                {new Date(selected.desiredAt).toLocaleDateString("vi-VN")} ·
                chưa phải cam kết giao
              </p>
            )}
            {selected.quote && (
              <p>
                Tổng dự kiến:{" "}
                {quoteTotal(selected.quote).toLocaleString("vi-VN")} ₫
              </p>
            )}
            {roles.some((r) => ["OWNER", "OPERATIONS_MANAGER"].includes(r)) && (
              <ProposeChange order={selected} onChanged={() => void load()} />
            )}
            <ActionForm
              order={selected}
              roles={roles}
              busy={busy}
              submit={async (action, payload) => {
                setBusy(true);
                setError("");
                try {
                  await sendCommand(
                    action,
                    payload,
                    selected.id,
                    selected.version,
                  );
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
const actionLabels: Record<string, string> = {
  issueQuote: "Gửi báo giá",
  claimPurchase: "Nhận việc mua hàng",
  recordPurchase: "Ghi nhận đã mua",
  receive: "Nhận và kiểm hàng",
  pack: "Xác nhận đóng gói",
  finalize: "Gửi tổng phí cuối",
  verifyTransfer: "Xác minh chuyển khoản",
  refund: "Xác nhận hoàn tiền",
  dispatch: "Bàn giao xuất gửi",
  track: "Cập nhật vận đơn",
  hold: "Cập nhật tạm giữ",
};
function ActionForm({
  order,
  roles,
  busy,
  submit,
}: {
  order: Order;
  roles: string[];
  busy: boolean;
  submit: (a: string, p: unknown) => Promise<void>;
}) {
  const actions = Object.keys(actionLabels).filter(
    (a) =>
      roles.includes("OWNER") ||
      (roles.includes("BUYER") &&
        ["issueQuote", "claimPurchase", "recordPurchase"].includes(a)) ||
      (roles.includes("WAREHOUSE") &&
        ["receive", "pack", "dispatch"].includes(a)) ||
      (roles.includes("FINANCE") && ["verifyTransfer", "refund"].includes(a)) ||
      (roles.includes("OPERATIONS_MANAGER") &&
        ["issueQuote", "finalize", "track", "hold"].includes(a)),
  );
  const [action, setAction] = useState(actions[0] ?? "");
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const n = (s: string) => Number(f.get(s)),
      t = (s: string) => String(f.get(s) ?? "");
    let p: unknown = {};
    if (action === "issueQuote")
      p = {
        goods: n("goods"),
        service: n("service"),
        sourceCosts: n("sourceCosts"),
        internationalShipping: n("internationalShipping"),
        destinationShipping: n("destinationShipping"),
        discount: n("discount"),
        sourceCurrency:
          order.market === "US" ? "USD" : order.market === "JP" ? "JPY" : "KRW",
        sourceMinor: n("sourceMinor"),
        fxNumerator: n("fxNumerator"),
        fxDenominator: n("fxDenominator"),
        termsVersion: t("termsVersion"),
        expiresAt: new Date(t("expiresAt")).getTime(),
        verifiedProduct: t("verifiedProduct"),
      };
    if (action === "recordPurchase")
      p = {
        quantity: n("quantity"),
        supplierOrder: t("supplierOrder"),
        evidence: t("evidence"),
        actualSourceMinor: n("actualSourceMinor"),
      };
    if (action === "receive")
      p = {
        quantity: n("quantity"),
        condition: t("condition"),
        evidence: t("evidence"),
      };
    if (action === "finalize")
      p = {
        total: n("total"),
        reason: t("reason"),
        ...(order.consolidatedFreight
          ? { freightShare: order.consolidatedFreight.amount }
          : {}),
      };
    if (["verifyTransfer", "refund"].includes(action))
      p = {
        amount: n("amount"),
        bankTransactionId: t("bankTransactionId"),
        evidence: t("evidence"),
        reason: t("reason"),
      };
    if (action === "pack")
      p = {
        weightGrams: n("weightGrams"),
        dimensionsCm: [n("length"), n("width"), n("height")],
        evidence: t("evidence"),
        checklist: f.get("checklist") === "on",
      };
    if (action === "track")
      p = { tracking: t("tracking"), delivered: f.get("delivered") === "on" };
    if (action === "hold") p = { reason: t("reason") };
    if (
      ["recordPurchase", "receive"].includes(action) &&
      order.items.length > 1
    ) {
      const lines = order.items
        .map((_, line) => ({ line, quantity: n(`line-${line}`) }))
        .filter((a) => a.quantity > 0);
      p = {
        ...(p as Record<string, unknown>),
        lines,
        quantity: lines.reduce((sum, a) => sum + a.quantity, 0),
      };
    }
    await submit(action, p);
  }
  return (
    <form className="form" onSubmit={(e) => void onSubmit(e)}>
      <label>
        Thao tác
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          {actions.map((a) => (
            <option value={a} key={a}>
              {actionLabels[a]}
            </option>
          ))}
        </select>
      </label>
      {action === "issueQuote" && (
        <>
          <label>
            Sản phẩm, biến thể đã xác minh
            <input
              name="verifiedProduct"
              minLength={2}
              maxLength={1000}
              required
            />
          </label>
          {[
            ["goods", "Giá hàng quy đổi (VND)"],
            ["service", "Phí mua hộ (VND)"],
            ["sourceCosts", "Phí/thuế nội địa nguồn (VND)"],
            ["internationalShipping", "Cước quốc tế dự kiến (VND)"],
            ["destinationShipping", "Giao nội địa dự kiến (VND)"],
            ["discount", "Giảm phí (VND)"],
            ["sourceMinor", "Giá gốc · đơn vị tiền tệ nhỏ nhất"],
            ["fxNumerator", "Tỷ giá · tử số"],
            ["fxDenominator", "Tỷ giá · mẫu số"],
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input type="number" min="0" step="1" name={name} required />
            </label>
          ))}
          <label>
            Version điều khoản
            <input name="termsVersion" required />
          </label>
          <label>
            Hạn báo giá
            <input type="datetime-local" name="expiresAt" required />
          </label>
        </>
      )}
      {["recordPurchase", "receive"].includes(action) &&
        order.items.length > 1 &&
        order.items.map((item, line) => (
          <label key={line}>
            {item.name} · {item.variant} · số lượng xử lý lần này
            <input
              name={`line-${line}`}
              type="number"
              min={0}
              max={item.quantity}
              step={1}
              defaultValue={0}
            />
          </label>
        ))}
      {["recordPurchase", "receive"].includes(action) &&
        order.items.length === 1 && (
          <label>
            Số lượng
            <input
              name="quantity"
              type="number"
              min={1}
              max={order.items.reduce((s, i) => s + i.quantity, 0)}
              required
            />
          </label>
        )}
      {action === "recordPurchase" && (
        <>
          <label>
            Mã đơn cửa hàng
            <input name="supplierOrder" minLength={2} required />
          </label>
          <label>
            Giá mua thực tế · đơn vị tiền nguồn nhỏ nhất
            <input
              name="actualSourceMinor"
              type="number"
              min={0}
              step={1}
              required
            />
          </label>
        </>
      )}
      {["recordPurchase", "receive", "pack"].includes(action) && (
        <label>
          Tham chiếu bằng chứng
          <input name="evidence" minLength={5} required />
        </label>
      )}
      {action === "pack" && (
        <>
          <label>
            Cân nặng đã xác nhận (gram)
            <input name="weightGrams" type="number" min={1} step={1} required />
          </label>
          {[
            ["length", "Dài"],
            ["width", "Rộng"],
            ["height", "Cao"],
          ].map(([name, label]) => (
            <label key={name}>
              {label} (cm)
              <input name={name} type="number" min={0.1} step={0.1} required />
            </label>
          ))}
          <label>
            <span>
              <input type="checkbox" name="checklist" required /> Đã kiểm tra đủ
              hàng và đóng gói
            </span>
          </label>
        </>
      )}
      {action === "receive" && (
        <label>
          Tình trạng
          <select name="condition">
            <option value="good">Đạt kiểm tra</option>
            <option value="damaged">Hỏng · tạm giữ để xử lý</option>
          </select>
        </label>
      )}
      {action === "finalize" && (
        <label>
          Lý do tổng phí cuối
          <input name="reason" minLength={5} required />
        </label>
      )}
      {action === "finalize" && (
        <label>
          Tổng cuối đã bao gồm phân bổ cước lô gom (VND)
          <input type="number" min="0" step="1" name="total" required />
        </label>
      )}
      {["verifyTransfer", "refund"].includes(action) && (
        <>
          <p className="notice">
            Chỉ xác nhận sau khi kiểm tra giao dịch ngân hàng thực tế. Ảnh khách
            gửi chưa chứng minh tiền đã về.
          </p>
          <label>
            Số tiền (VND)
            <input name="amount" type="number" min={1} step={1} required />
          </label>
          <label>
            Mã giao dịch ngân hàng
            <input name="bankTransactionId" minLength={4} required />
          </label>
          <label>
            Tham chiếu bằng chứng đối soát
            <input name="evidence" minLength={5} required />
          </label>
          <label>
            Lý do
            <input name="reason" minLength={3} required />
          </label>
        </>
      )}
      {action === "track" && (
        <>
          <label>
            Mã vận đơn
            <input name="tracking" minLength={3} required />
          </label>
          <label>
            <span>
              <input type="checkbox" name="delivered" /> Đã giao đủ hàng
            </span>
          </label>
        </>
      )}
      {action === "hold" && (
        <label>
          Lý do tạm giữ · để trống khi bỏ giữ
          <input name="reason" maxLength={500} />
        </label>
      )}
      <button className="primary" disabled={busy || !action} type="submit">
        {busy ? "Đang lưu…" : actionLabels[action]}
      </button>
    </form>
  );
}
