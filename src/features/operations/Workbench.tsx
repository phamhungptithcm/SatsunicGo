import {
  CrmHeading,
  CrmIcon,
  CrmReference,
  CrmState,
} from "../crm/CrmPresentation";
import { OperationsDetails } from "./OperationsDetails";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { callService, sendCommand } from "../../shared/firebase";
import {
  orderStageLabel,
  quoteTotal,
  purchaseAmount,
  type Order,
} from "../../../packages/domain";
import { ProposeChange } from "../orders/Changes";
import { Link, useSearchParams } from "react-router-dom";
import { OrderImages } from "../orders/OrderImages";
import { OrderTools } from "../orders/OrderTools";
import { OrderConversation } from "../support/OrderConversation";
export function Workbench({
  roles,
  queue,
}: {
  roles: string[];
  queue?: string;
}) {
  const [params, setParams] = useSearchParams();
  const target = params.get("order");
  const selectedQueue = queue ?? params.get("queue") ?? "";
  const showMoney = roles.some((r) =>
    ["OWNER", "OPERATIONS_MANAGER", "FINANCE", "SUPPORT", "BUYER"].includes(r),
  );
  const [orders, setOrders] = useState<Order[]>([]),
    [selected, setSelected] = useState<Order | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [next, setNext] = useState<string | null>(null);
  const request = useRef(0);
  const mutation = useRef(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const detailPanel = useRef<HTMLDivElement>(null);
  const selectionTrigger = useRef<HTMLButtonElement | null>(null);
  const listScroll = useRef(0);
  const focusSelection = useRef(false);
  useEffect(() => {
    if (!detailOpen || !selected || !focusSelection.current) return;
    focusSelection.current = false;
    detailHeading.current?.focus({ preventScroll: true });
    detailPanel.current?.scrollIntoView({
      block: "nearest",
      behavior: "instant",
    });
  }, [selected?.id, detailOpen, selectionRevision]);
  function selectOrder(order: Order, trigger: HTMLButtonElement) {
    selectionTrigger.current = trigger;
    listScroll.current = window.scrollY;
    focusSelection.current = true;
    setSelected(order);
    setDetailOpen(true);
    setSelectionRevision((revision) => revision + 1);
  }
  function returnToList() {
    if (busy) return;
    setDetailOpen(false);
  }
  useEffect(() => {
    if (detailOpen || !selectionTrigger.current) return;
    selectionTrigger.current.focus({ preventScroll: true });
    window.scrollTo({ top: listScroll.current, behavior: "instant" });
  }, [detailOpen]);
  async function load(after?: string) {
    const current = ++request.current;
    setError("");
    setBusy(true);
    setOrders([]);
    setSelected(null);
    setDetailOpen(false);
    selectionTrigger.current = null;
    focusSelection.current = false;
    setNext(null);
    try {
      const r = await callService<{ rows: Order[]; next: string | null }>(
        "listWork",
        {
          kind: "orders",
          ...(target ? { id: target } : {}),
          ...(selectedQueue ? { queue: selectedQueue } : {}),
          ...(after ? { after } : {}),
        },
      );
      if (current !== request.current) return;
      setOrders(r.rows);
      setNext(r.next);
      setSelected(target ? (r.rows[0] ?? null) : null);
      setDetailOpen(Boolean(target && r.rows.length));
    } catch (e) {
      if (current !== request.current) return;
      setError((e as Error).message);
      setOrders([]);
      setSelected(null);
    } finally {
      if (current === request.current) setBusy(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      request.current++;
    };
  }, [target, selectedQueue]);
  return (
    <div className="workbench crmWorkbench028">
      <CrmHeading
        title={
          queue === "purchasing"
            ? "Mua hàng"
            : queue === "warehouse"
              ? "Nhận kho & đóng gói"
              : "Yêu cầu & báo giá"
        }
        description="Chọn đơn để xem thông tin và thực hiện thao tác phù hợp."
        actions={
          <button onClick={() => void load()} disabled={busy}>
            <CrmIcon name="refresh" /> Tải lại
          </button>
        }
      />
      {!queue && !target && (
        <label className="crmQueueFilter">
          Hàng đợi
          <select
            value={selectedQueue}
            onChange={(e) =>
              setParams(e.target.value ? { queue: e.target.value } : {})
            }
          >
            <option value="">Tất cả đơn</option>
            <option value="requests">Yêu cầu mới</option>
            <option value="quotes">Chờ duyệt báo giá</option>
            <option value="purchasing">Chờ thanh toán / cần mua</option>
            <option value="warehouse">Nhận kho & đóng gói</option>
            <option value="balance">Đã đóng gói</option>
            <option value="ready">Sẵn sàng xuất gửi</option>
            <option value="holds">Đang tạm giữ</option>
          </select>
        </label>
      )}
      {target && (
        <div className="workbenchLinks">
          <Link to="/crm/orders">← Tất cả đơn</Link>
          <Link to={`/crm/documents?order=${encodeURIComponent(target)}`}>
            Chứng từ của đơn
          </Link>
        </div>
      )}
      {busy && <CrmState kind="loading" title="Đang tải hàng đợi…" />}
      {error && (
        <CrmState
          kind="error"
          title="Chưa tải hoặc lưu được đơn"
          action={
            <button disabled={busy} onClick={() => void load()}>
              <CrmIcon name="refresh" /> Tải lại
            </button>
          }
        >
          {error}
        </CrmState>
      )}
      <div
        className="workColumns"
        data-detail-open={Boolean(selected && detailOpen)}
      >
        <div className="crmList">
          {orders.map((o) => (
            <article className="crmItem" key={o.id}>
              <div className="crmItemMain">
                <button
                  className="textbutton crmItemTitle"
                  disabled={busy}
                  aria-pressed={selected?.id === o.id}
                  onClick={(event) => selectOrder(o, event.currentTarget)}
                >
                  {o.items[0]?.name || "Xem đơn hàng"}
                </button>
                <div className="crmItemMeta">
                  <span>{o.market}</span>
                  <span className="crmBadge">{orderStageLabel(o)}</span>
                </div>
                {o.hold && (
                  <p className="notice">
                    <CrmIcon name="warning" /> Tạm giữ: {o.hold}
                  </p>
                )}
                {showMoney && (
                  <p>
                    Đã thu ròng:{" "}
                    {(o.collected - o.refunded).toLocaleString("vi-VN")} ₫
                  </p>
                )}
                <CrmReference label="Đơn" value={o.id} />
              </div>
            </article>
          ))}
          {!orders.length && !busy && !error && (
            <CrmState
              kind="empty"
              title="Chưa có đơn trong phạm vi được phân công"
            />
          )}
          {next && (
            <button disabled={busy} onClick={() => void load(next)}>
              Trang tiếp theo
            </button>
          )}
        </div>
        {!selected && !busy && orders.length > 0 && (
          <div className="crmWorkbenchPrompt028">
            <CrmIcon name="search" />
            <h2>Chọn một đơn để xem chi tiết</h2>
            <p>Thông tin và thao tác của đơn sẽ hiển thị tại đây.</p>
          </div>
        )}
        {selected && (
          <div
            className="panel crmItem crmWorkbenchDetail028"
            ref={detailPanel}
          >
            {!target && (
              <button
                type="button"
                className="crmWorkbenchBack028"
                disabled={busy}
                onClick={returnToList}
              >
                <CrmIcon name="arrow" /> Quay lại danh sách
              </button>
            )}
            <h2 className="crmItemTitle" ref={detailHeading} tabIndex={-1}>
              {selected.items[0]?.name}
            </h2>
            <CrmReference label="Đơn" value={selected.id} />
            {selected.hold && (
              <p className="notice">
                <CrmIcon name="warning" /> Tạm giữ: {selected.hold}
              </p>
            )}
            <div className="crmFacts">
              <span className="crmBadge">{orderStageLabel(selected)}</span>
              <span>
                Tổng số lượng:{" "}
                {selected.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
              {selected.receivedQuantity !== undefined && (
                <span>Đã nhận: {selected.receivedQuantity}</span>
              )}
              {selected.packedQuantity !== undefined && (
                <span>Đã đóng gói: {selected.packedQuantity}</span>
              )}
              {showMoney && (
                <span>
                  Đã thu ròng:{" "}
                  {(selected.collected - selected.refunded).toLocaleString(
                    "vi-VN",
                  )}{" "}
                  ₫
                </span>
              )}
            </div>
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
            {selected.purchaseKind === "catalog" && (
              <p>
                Sản phẩm niêm yết · tổng trọn gói:{" "}
                {selected.finalTotal?.toLocaleString("vi-VN")} ₫ · thanh toán
                toàn bộ trước khi mua hộ.
              </p>
            )}
            {selected.quote && (
              <p>
                Tổng dự kiến:{" "}
                {quoteTotal(selected.quote).toLocaleString("vi-VN")} ₫
              </p>
            )}
            <ActionForm
              key={`action-${selected.id}`}
              order={selected}
              roles={roles}
              busy={busy}
              submit={async (action, payload) => {
                if (mutation.current) return;
                mutation.current = true;
                const context = request.current;
                setBusy(true);
                setError("");
                try {
                  await sendCommand(
                    action,
                    payload,
                    selected.id,
                    selected.version,
                  );
                  if (context === request.current) await load();
                } catch (e) {
                  if (context === request.current)
                    setError((e as Error).message);
                } finally {
                  mutation.current = false;
                  if (context === request.current) setBusy(false);
                }
              }}
            />
            <section className="crmItemDetails">
              <h3 className="crmSectionHeading">
                <CrmIcon name="document" /> Trao đổi, bằng chứng và công cụ của
                đơn
              </h3>
              {roles.some((r) =>
                ["OWNER", "OPERATIONS_MANAGER", "SUPPORT", "BUYER"].includes(r),
              ) && (
                <OrderConversation
                  key={`conversation-${selected.id}`}
                  orderId={selected.id}
                  staff
                />
              )}
              {roles.some((r) =>
                ["OWNER", "OPERATIONS_MANAGER"].includes(r),
              ) && (
                <ProposeChange
                  key={`change-${selected.id}`}
                  order={selected}
                  onChanged={() => void load()}
                />
              )}
              {roles.some((role) =>
                ["OWNER", "OPERATIONS_MANAGER", "BUYER", "WAREHOUSE"].includes(
                  role,
                ),
              ) && (
                <OperationsDetails
                  key={`operations-${selected.id}`}
                  orderId={selected.id}
                />
              )}
              <OrderImages
                key={`images-${selected.id}`}
                orderId={selected.id}
                roles={roles}
              />
              {roles.some((r) =>
                ["OWNER", "OPERATIONS_MANAGER", "FINANCE", "SUPPORT"].includes(
                  r,
                ),
              ) && (
                <OrderTools
                  key={`tools-${selected.id}`}
                  order={selected}
                  showImages={false}
                />
              )}
            </section>
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
/** Presentation prerequisite only; the command still authorizes current server state. */
export function claimPurchaseBlockReason(order: Order): string {
  if (order.hold)
    return "Đơn đang tạm giữ. Cần xử lý lý do tạm giữ trước khi nhận việc mua hàng.";
  if (order.stage !== "QUOTE_ACCEPTED")
    return "Đơn chưa ở bước nhận việc mua hàng.";
  try {
    const required = purchaseAmount(order);
    const available =
      order.collected - order.refunded - (order.refundReserved ?? 0);
    if (
      !Number.isSafeInteger(required) ||
      required < 0 ||
      !Number.isSafeInteger(available)
    )
      return "Chưa đủ thông tin thanh toán để nhận việc mua hàng. Tải lại đơn để kiểm tra.";
    if (available < required)
      return order.purchaseKind === "catalog"
        ? "Chưa đủ tiền để mua hàng. Đơn niêm yết cần thanh toán toàn bộ."
        : "Chưa đủ tiền cọc để nhận việc mua hàng.";
    return "";
  } catch {
    return "Chưa đủ thông tin thanh toán để nhận việc mua hàng. Tải lại đơn để kiểm tra.";
  }
}
export function ActionForm({
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
  const actions = Object.keys(actionLabels)
    .filter(
      (a) =>
        order.purchaseKind !== "catalog" ||
        !["issueQuote", "finalize"].includes(a),
    )
    .filter(
      (a) =>
        roles.includes("OWNER") ||
        (roles.includes("BUYER") &&
          ["issueQuote", "claimPurchase", "recordPurchase"].includes(a)) ||
        (roles.includes("WAREHOUSE") &&
          ["receive", "pack", "dispatch"].includes(a)) ||
        (roles.includes("FINANCE") &&
          ["verifyTransfer", "refund"].includes(a)) ||
        (roles.includes("OPERATIONS_MANAGER") &&
          ["issueQuote", "finalize", "track", "hold"].includes(a)),
    );
  const [action, setAction] = useState(actions[0] ?? "");
  const prerequisiteId = useId();
  const prerequisite =
    action === "claimPurchase" ? claimPurchaseBlockReason(order) : "";
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || prerequisite || !actions.includes(action)) return;
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
        shelf: t("shelf"),
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
  if (!actions.length) return null;
  return (
    <form className="form" onSubmit={(e) => void onSubmit(e)}>
      <h3 className="crmSectionHeading">
        <CrmIcon name="arrow" /> Thao tác với đơn
      </h3>
      <fieldset disabled={busy}>
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
              <input
                name="weightGrams"
                type="number"
                min={1}
                step={1}
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
                  step={0.1}
                  required
                />
              </label>
            ))}
            <label>
              <span>
                <input type="checkbox" name="checklist" required /> Đã kiểm tra
                đủ hàng và đóng gói
              </span>
            </label>
          </>
        )}
        {action === "receive" && (
          <>
            <label>
              Vị trí kệ · không bắt buộc
              <input name="shelf" maxLength={80} />
            </label>
            <label>
              Tình trạng
              <select name="condition">
                <option value="good">Đạt kiểm tra</option>
                <option value="damaged">Hỏng · tạm giữ để xử lý</option>
              </select>
            </label>
          </>
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
              Chỉ xác nhận sau khi kiểm tra giao dịch ngân hàng thực tế. Ảnh
              khách gửi chưa chứng minh tiền đã về.
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
        {prerequisite && (
          <p id={prerequisiteId} className="crmActionPrerequisite028">
            {prerequisite}
          </p>
        )}
        <button
          className="primary"
          disabled={busy || !action || Boolean(prerequisite)}
          aria-describedby={prerequisite ? prerequisiteId : undefined}
          type="submit"
        >
          {busy ? "Đang lưu…" : actionLabels[action]}
        </button>
      </fieldset>
    </form>
  );
}
