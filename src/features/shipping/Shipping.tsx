import {
  CrmHeading,
  CrmIcon,
  CrmReference,
  CrmState,
} from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Consolidation } from "./Consolidation";
import { callService } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
import {
  readRecords,
  requireSettled,
  selectionIds,
  useFormIntent,
  useResultFocus,
  useWorkQueue,
  versionMap,
} from "./queue-state";
import {
  DeliveryEstimate,
  DeliveryEstimateForm,
  estimatePayload,
  type EstimateDraft,
} from "./DeliveryEstimate";
import type { Parcel, Allocation } from "../../../packages/domain/shipping";
export function parcelDecision(
  parcel: Parcel,
  mayPack: boolean,
  mayTrack: boolean,
) {
  if (parcel.state === "packed" && !parcel.batchId && mayPack)
    return "dispatch";
  if (mayTrack && ["in_transit", "failed"].includes(parcel.state))
    return "track";
  return null;
}
export function Shipping({ roles }: { roles: string[] }) {
  const mayPack = roles.some((r) => ["OWNER", "WAREHOUSE"].includes(r));
  const mayTrack = roles.some((r) =>
    ["OWNER", "OPERATIONS_MANAGER"].includes(r),
  );
  const orderQueue = useWorkQueue<Order>("orders"),
    parcelQueue = useWorkQueue<Parcel>("packages");
  const orders = orderQueue.rows,
    parcels = parcelQueue.rows;
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [lookup, setLookup] = useState("");
  const [result, setResult] = useState<Parcel | null>(null);
  const [resultId, setResultId] = useState("");
  const [resultError, setResultError] = useState(false);
  const [reconcile, setReconcile] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [authorityDenied, setAuthorityDenied] = useState(false);
  function noteAuthority(cause: unknown) {
    const code = String((cause as { code?: string })?.code ?? "").replace(
      "functions/",
      "",
    );
    if (["permission-denied", "unauthenticated"].includes(code))
      setAuthorityDenied(true);
  }
  const lockOwner = useRef<"shipping" | "batch" | null>(null);
  const [mutationLocked, setLocked] = useState(false);
  const readers = useRef(0);
  const [reading, setReading] = useState(false);
  const locked = mutationLocked || reading;
  function beginRead() {
    readers.current++;
    if (mounted.current) setReading(true);
  }
  function endRead() {
    readers.current = Math.max(0, readers.current - 1);
    if (mounted.current) setReading(readers.current > 0);
  }
  function acquire(owner: "shipping" | "batch") {
    if (lockOwner.current || readers.current > 0) return false;
    lockOwner.current = owner;
    setLocked(true);
    return true;
  }
  function release(owner: "shipping" | "batch") {
    if (lockOwner.current !== owner) return;
    lockOwner.current = null;
    if (mounted.current) setLocked(false);
  }
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [message, setMessage] = useState(""),
    [uncertain, setUncertain] = useState(false);
  const mounted = useRef(true);
  const generation = useRef(0),
    sending = useRef(false);
  const pending = useRef<Record<string, unknown> | null>(null);
  const submittedForm = useRef<HTMLFormElement | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const formIntent = useFormIntent(root);
  const estimateDrafts = useRef(new Map<string, EstimateDraft>());
  const resultTarget = useRef<HTMLDivElement | null>(null);
  useResultFocus(
    resultId ? `${resultId}:${result?.version ?? "unavailable"}` : "",
    resultTarget,
  );
  async function load() {
    beginRead();
    const current = ++generation.current;
    setLoading(true);
    setLoadError("");
    try {
      const settled = await Promise.allSettled([
        orderQueue.load(),
        parcelQueue.load(),
      ]);
      requireSettled(settled);
      if (current !== generation.current) return false;
      return true;
    } catch (cause) {
      if (current !== generation.current) return;
      if (mounted.current) noteAuthority(cause);

      orderQueue.clear();
      parcelQueue.clear();
      setResult(null);
      setUnavailable(true);
      setReconcile(true);
      setLoadError("Chưa tải được hàng đợi kiện.");
      return false;
    } finally {
      endRead();
      if (current === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, []);
  async function pageQueue(
    queue: typeof orderQueue | typeof parcelQueue,
    direction: "forward" | "back",
  ) {
    if (lockOwner.current || loading || !acquire("shipping")) return;
    setLoadError("");
    try {
      await queue[direction]();
    } catch (cause) {
      if (mounted.current) noteAuthority(cause);
      orderQueue.clear();
      parcelQueue.clear();
      setResult(null);
      setUnavailable(true);
      setReconcile(true);
      if (mounted.current) setLoadError("Chưa tải được trang. Thử tải lại.");
    } finally {
      release("shipping");
    }
  }
  async function refresh() {
    if (!acquire("shipping")) return;
    try {
      await load();
    } finally {
      release("shipping");
    }
  }
  async function addOrder(order?: Order) {
    if (lockOwner.current || loading || !acquire("shipping")) return;
    setBusy(true);
    setError("");
    const current = generation.current;
    try {
      const row =
        order ?? (await readRecords<Order>("orders", [lookup.trim()], 1))[0];
      if (current !== generation.current) return;
      if (!row.packingComplete || row.hold) throw Error("NOT_READY");
      const ids = selectionIds(
        selectedOrders.map((o) => o.id),
        row.id,
        true,
        10,
      );
      setSelectedOrders((previous) =>
        ids.map((id) =>
          id === row.id ? row : previous.find((o) => o.id === id)!,
        ),
      );
      setLookup("");
    } catch (cause) {
      if (mounted.current) noteAuthority(cause);
      if (current === generation.current)
        setError(
          "Chưa thêm được đơn. Chọn tối đa 10 đơn đã đóng gói, không bị giữ.",
        );
    } finally {
      release("shipping");
      if (mounted.current) setBusy(false);
    }
  }
  async function readResult(id: string) {
    beginRead();
    setResultError(false);
    const current = generation.current;
    try {
      const [row] = await readRecords<Parcel>("packages", [id], 1);
      if (current !== generation.current) return false;
      setResult(row);
      return true;
    } catch (cause) {
      if (mounted.current && current === generation.current)
        noteAuthority(cause);
      if (current === generation.current) {
        setResult(null);
        setResultError(true);
        if (
          ["permission-denied", "unauthenticated"].includes(
            String((cause as { code?: string }).code ?? "").replace(
              "functions/",
              "",
            ),
          )
        ) {
          setUnavailable(true);
          setReconcile(true);
          orderQueue.clear();
          parcelQueue.clear();
        }
      }
      return false;
    } finally {
      endRead();
    }
  }
  async function reconcileRecords() {
    if (lockOwner.current || !acquire("shipping")) return;
    setBusy(true);
    setError("");
    const current = generation.current;
    try {
      const selected = selectedOrders.length
        ? await readRecords<Order>(
            "orders",
            selectedOrders.map((o) => o.id),
            10,
          )
        : [];
      if (!(await load())) throw Error("READ_FAILED");
      if (!mounted.current) return;
      setSelectedOrders(selected);
      setReconcile(false);
      setUnavailable(false);
      if (resultId && !(await readResult(resultId)))
        throw Error("RESULT_READ_FAILED");
      setAuthorityDenied(false);
    } catch (cause) {
      if (mounted.current) noteAuthority(cause);
      if (mounted.current && current <= generation.current) {
        setUnavailable(true);
        orderQueue.clear();
        parcelQueue.clear();
        setResult(null);
        setError("Chưa đối chiếu được dữ liệu. Giữ nội dung và thử lại.");
      }
    } finally {
      release("shipping");
      if (mounted.current) setBusy(false);
    }
  }
  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: string,
    parcel?: Parcel,
  ) {
    event.preventDefault();
    if (
      sending.current ||
      uncertain ||
      loading ||
      orderQueue.loading ||
      parcelQueue.loading ||
      reconcile ||
      unavailable ||
      !acquire("shipping")
    )
      return;
    submittedForm.current = event.currentTarget;
    formIntent.capture(event.currentTarget);
    const f = new FormData(event.currentTarget);
    const context = generation.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let payload: unknown;
      if (action === "packParcel") {
        const allocations: Allocation[] = [];
        for (const order of selectedOrders)
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
      } else if (action === "setDeliveryEstimate") {
        const submitter = (event.nativeEvent as SubmitEvent)
          .submitter as HTMLButtonElement | null;
        payload = estimatePayload(
          event.currentTarget,
          submitter?.value === "remove",
        );
      } else
        payload =
          action === "dispatchParcel"
            ? {
                carrier: String(f.get("carrier")),
                tracking: String(f.get("tracking")),
                handoffEvidence: String(f.get("evidence")),
              }
            : { state: String(f.get("state")), event: String(f.get("event")) };
      const references =
        action === "packParcel"
          ? (payload as { allocations: Allocation[] }).allocations.map(
              (a) => a.orderId,
            )
          : parcel!.allocations.map((a) => a.orderId);
      const snapshots = await readRecords<Order>("orders", references, 10);
      if (
        action === "packParcel" &&
        snapshots.some(
          (o) =>
            o.version !==
            selectedOrders.find((old) => old.id === o.id)?.version,
        )
      )
        throw Error("STALE_SELECTION");
      if (!mounted.current || context !== generation.current) {
        release("shipping");
        return;
      }
      pending.current = {
        action,
        operationId: crypto.randomUUID(),
        orderVersions: versionMap(snapshots),
        ...(parcel
          ? { parcelId: parcel.id, expectedVersion: parcel.version }
          : {}),
        payload,
      };
      await execute();
    } catch (cause) {
      if (mounted.current) noteAuthority(cause);
      release("shipping");
      if (mounted.current) {
        setBusy(false);
        setUnavailable(true);
        orderQueue.clear();
        parcelQueue.clear();
        setResult(null);
        setReconcile(true);
        setError(
          "Chưa tải đủ đơn liên quan. Đối chiếu dữ liệu trước khi gửi lại.",
        );
      }
    }
  }
  async function execute() {
    if (!pending.current || sending.current) return;
    sending.current = true;
    const current = generation.current;
    const estimateCommand = pending.current.action === "setDeliveryEstimate";
    setBusy(true);
    setError("");
    try {
      const acknowledgedAction = pending.current.action;
      const estimateRemoved =
        acknowledgedAction === "setDeliveryEstimate" &&
        (pending.current.payload as { estimate?: unknown })?.estimate === null;
      const acknowledged = await callService<{ id: string; version: number }>(
        "shippingCommand",
        pending.current,
      );
      if (acknowledgedAction === "setDeliveryEstimate")
        estimateDrafts.current.delete(acknowledged.id);
      pending.current = null;
      if (current !== generation.current) return;
      formIntent.clear(submittedForm.current);
      submittedForm.current?.reset();
      setUncertain(false);
      setMessage(
        acknowledgedAction === "setDeliveryEstimate"
          ? estimateRemoved
            ? "Đã gỡ thời gian giao dự kiến."
            : "Đã lưu thời gian giao dự kiến."
          : "Đã lưu kiện và lịch sử vận chuyển.",
      );
      setResultId(acknowledged.id);
      if (result?.id !== acknowledged.id) setResult(null);
      await load();
      await readResult(acknowledged.id);
      release("shipping");
    } catch (e) {
      if (current !== generation.current) return;
      noteAuthority(e);
      const rejected = [
        "invalid-argument",
        "permission-denied",
        "unauthenticated",
        "failed-precondition",
        "aborted",
        "already-exists",
      ].includes(
        String((e as { code?: string }).code ?? "").replace("functions/", ""),
      );
      if (
        ["permission-denied", "unauthenticated"].includes(
          String((e as { code?: string }).code ?? "").replace("functions/", ""),
        )
      ) {
        setUnavailable(true);
        orderQueue.clear();
        parcelQueue.clear();
        setResult(null);
      }
      if (rejected) {
        pending.current = null;
        setReconcile(true);
        release("shipping");
      }
      setUncertain(!rejected);
      setError(
        rejected
          ? estimateCommand
            ? "Chưa lưu được thời gian dự kiến. Đối chiếu quyền và dữ liệu kiện."
            : "Chưa lưu được. Kiểm tra số lượng, quyền và phiên bản đơn."
          : "Chưa xác nhận được kết quả. Nội dung đang được giữ nguyên; thử lại đúng thao tác đã gửi.",
      );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  if (authorityDenied)
    return (
      <section ref={root} className="workbench">
        <p role="alert">
          Không có quyền xem dữ liệu này. Đối chiếu lại sau khi được cấp quyền.
        </p>
        <button
          disabled={locked || loading || busy}
          onClick={() => void reconcileRecords()}
        >
          Đối chiếu dữ liệu kiện
        </button>
      </section>
    );
  return (
    <section ref={root} className="workbench">
      <CrmHeading
        title="Kiện hàng và xuất gửi"
        description="Tạo kiện, bàn giao và ghi nhận hành trình vận chuyển."
        actions={
          <button
            disabled={
              locked || loading || orderQueue.loading || parcelQueue.loading
            }
            onClick={() => void refresh()}
          >
            <CrmIcon name="refresh" /> Tải lại kiện
          </button>
        }
      />
      <p className="muted">
        Kiện nội bộ không phải shipping label của hãng vận chuyển. Mỗi trang
        hiển thị tối đa 30 bản ghi.
      </p>
      {loading && <CrmState kind="loading" title="Đang tải đơn và kiện…" />}
      {loadError && (
        <CrmState
          kind="error"
          title="Chưa tải được hàng đợi kiện"
          action={
            <button
              disabled={
                locked || loading || orderQueue.loading || parcelQueue.loading
              }
              onClick={() => void refresh()}
            >
              Thử lại
            </button>
          }
        >
          {parcels.length > 0 &&
            "Các kiện đang hiển thị là dữ liệu đã tải trước đó."}
        </CrmState>
      )}
      {!loading && !loadError && !parcels.length && (
        <CrmState kind="empty" title="Chưa có kiện trong phạm vi đang xem" />
      )}
      {mayPack && (
        <details className="crmItemDetails" name="crm-shipping-actions">
          <summary>
            <CrmIcon name="box" /> Đóng kiện từ hàng đã kiểm và đóng gói
          </summary>
          <form
            className="form panel"
            data-intent="pack"
            onChange={(e) => formIntent.capture(e.currentTarget)}
            onSubmit={(e) => void submit(e, "packParcel")}
          >
            <fieldset
              style={{ minWidth: 0 }}
              className="form"
              disabled={
                locked ||
                loading ||
                uncertain ||
                orderQueue.loading ||
                parcelQueue.loading
              }
            >
              <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                Mã đơn
                <input
                  value={lookup}
                  onChange={(e) => setLookup(e.target.value)}
                  maxLength={80}
                />
              </label>
              <button
                type="button"
                disabled={!lookup.trim()}
                onClick={() => void addOrder()}
              >
                Thêm đơn
              </button>
              <div className="crmActions" aria-label="Trang đơn đóng kiện">
                <button
                  type="button"
                  disabled={orderQueue.page === 1}
                  onClick={() => void pageQueue(orderQueue, "back")}
                >
                  Trang đơn trước
                </button>
                <span>
                  Trang {orderQueue.page} · {orders.length} đơn
                </span>
                <button
                  type="button"
                  disabled={!orderQueue.next}
                  onClick={() => void pageQueue(orderQueue, "forward")}
                >
                  Trang đơn sau
                </button>
              </div>
              {orders
                .filter((o) => o.packingComplete && !o.hold)
                .map((o) => (
                  <label key={o.id}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.some(
                        (selected) => selected.id === o.id,
                      )}
                      onChange={(e) =>
                        e.target.checked
                          ? void addOrder(o)
                          : setSelectedOrders((rows) =>
                              rows.filter((row) => row.id !== o.id),
                            )
                      }
                    />
                    <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                      {o.id}
                    </span>
                  </label>
                ))}
              <p className="muted">Đã chọn {selectedOrders.length}/10 đơn</p>
              {unavailable &&
                selectedOrders.map((o) => (
                  <div key={o.id}>
                    <CrmReference label="Đơn đã chọn" value={o.id} />
                    <button
                      type="button"
                      aria-label={`Bỏ đơn ${o.id}`}
                      onClick={() =>
                        setSelectedOrders((rows) =>
                          rows.filter((row) => row.id !== o.id),
                        )
                      }
                    >
                      Bỏ đơn
                    </button>
                  </div>
                ))}
              {(unavailable ? [] : selectedOrders)
                .filter((o) => o.packingComplete && !o.hold)
                .map((o) => (
                  <fieldset key={o.id} style={{ minWidth: 0 }}>
                    <legend style={{ overflowWrap: "anywhere" }}>{o.id}</legend>
                    <button
                      type="button"
                      aria-label={`Bỏ đơn ${o.id}`}
                      onClick={() =>
                        setSelectedOrders((rows) =>
                          rows.filter((row) => row.id !== o.id),
                        )
                      }
                    >
                      Bỏ đơn
                    </button>
                    {o.items.map((item, line) => (
                      <label key={line}>
                        {item.name} · {item.variant} · số lượng theo đơn{" "}
                        {item.quantity}
                        <input
                          name={`${o.id}:${line}`}
                          type="number"
                          min={0}
                          max={Math.min(item.quantity, 100)}
                          step={1}
                          defaultValue={0}
                        />
                      </label>
                    ))}
                  </fieldset>
                ))}
              <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                Kho nguồn
                <input name="warehouse" required minLength={2} />
              </label>
              <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                Tuyến và hub đích
                <input name="route" required minLength={2} />
              </label>
              <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
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
              <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                Bằng chứng kiểm/đóng gói
                <textarea name="evidence" minLength={5} required />
              </label>
              <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <input name="checklist" type="checkbox" required /> Đã kiểm sản
                phẩm, số lượng, điều kiện vận chuyển và đóng gói
              </label>
              <button
                className="primary"
                disabled={
                  reconcile ||
                  unavailable ||
                  locked ||
                  loading ||
                  uncertain ||
                  orderQueue.loading ||
                  parcelQueue.loading
                }
              >
                <CrmIcon name="box" /> Tạo kiện nội bộ
              </button>
            </fieldset>
          </form>
        </details>
      )}
      {(mayPack || mayTrack) && (
        <Consolidation
          onAuthorityDenied={() => {
            setAuthorityDenied(true);
            setUnavailable(true);
            setReconcile(true);
            orderQueue.clear();
            parcelQueue.clear();
            setResult(null);
          }}
          lock={{
            blocked: locked,
            acquire: () => acquire("batch"),
            release: () => release("batch"),
            beginRead,
            endRead,
          }}
        />
      )}
      {reconcile && (
        <div className="crmActions">
          <p role="alert">
            Dữ liệu cần được đối chiếu trước thao tác mới. Nội dung đang được
            giữ nguyên.
          </p>
          <button
            disabled={locked || loading}
            onClick={() => void reconcileRecords()}
          >
            Đối chiếu dữ liệu kiện
          </button>
        </div>
      )}
      <div className="crmActions" aria-label="Trang kiện hàng">
        <button
          disabled={
            locked || loading || parcelQueue.loading || parcelQueue.page === 1
          }
          onClick={() => void pageQueue(parcelQueue, "back")}
        >
          Trang kiện trước
        </button>
        <span>
          Trang {parcelQueue.page} · {parcels.length} kiện
        </span>
        <button
          disabled={
            locked || loading || parcelQueue.loading || !parcelQueue.next
          }
          onClick={() => void pageQueue(parcelQueue, "forward")}
        >
          Trang kiện sau
        </button>
      </div>
      {resultId && (
        <div
          className="panel"
          ref={resultTarget}
          tabIndex={-1}
          role="region"
          aria-label="Kiện vừa lưu"
        >
          <CrmReference label="Kiện vừa lưu" value={resultId} />
          {message && <p role="status">{message}</p>}
          {resultError && (
            <>
              <p role="alert">Đã lưu kiện. Chưa tải được chi tiết.</p>
              <button
                disabled={locked || loading}
                onClick={() => void readResult(resultId)}
              >
                Tải chi tiết kiện
              </button>
            </>
          )}
        </div>
      )}
      {[
        ...(result && !parcels.some((p) => p.id === result.id) ? [result] : []),
        ...parcels.filter((row) => !resultError || row.id !== resultId),
      ].map((p) => (
        <article key={p.id} className="panel order crmItem">
          <h3 className="crmItemTitle">
            <CrmIcon name="box" /> Kiện hàng
          </h3>
          <CrmReference label="Kiện" value={p.id} />
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
          <details className="crmItemDetails">
            <summary>
              <CrmIcon name="document" /> Hàng trong kiện
            </summary>
            <p>
              {p.allocations
                .map((a) => `${a.orderId}, dòng ${a.line + 1}: ${a.quantity}`)
                .join("; ")}
            </p>
          </details>
          {parcelDecision(p, mayPack, mayTrack) === "dispatch" ? (
            <details className="crmItemDetails" name="crm-shipping-actions">
              <summary>
                <CrmIcon name="check" /> Bàn giao kiện
              </summary>
              <form
                className="form"
                data-intent={`dispatch:${p.id}`}
                onChange={(e) => formIntent.capture(e.currentTarget)}
                onSubmit={(e) => void submit(e, "dispatchParcel", p)}
              >
                <fieldset
                  style={{ minWidth: 0 }}
                  className="form"
                  disabled={
                    locked ||
                    loading ||
                    uncertain ||
                    orderQueue.loading ||
                    parcelQueue.loading
                  }
                >
                  <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    Hãng vận chuyển
                    <input name="carrier" required minLength={2} />
                  </label>
                  <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    Mã vận đơn
                    <input name="tracking" required minLength={3} />
                  </label>
                  <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    Bằng chứng bàn giao
                    <textarea name="evidence" required minLength={5} />
                  </label>
                  <button
                    className="primary"
                    disabled={
                      reconcile ||
                      unavailable ||
                      locked ||
                      loading ||
                      uncertain ||
                      orderQueue.loading ||
                      parcelQueue.loading
                    }
                  >
                    <CrmIcon name="check" /> Xác nhận bàn giao xuất gửi
                  </button>
                </fieldset>
              </form>
            </details>
          ) : (
            parcelDecision(p, mayPack, mayTrack) === "track" && (
              <>
                <DeliveryEstimate
                  value={p.deliveryEstimate}
                  state={p.state}
                  observedAt={Date.now()}
                />
                <DeliveryEstimateForm
                  parcel={p}
                  drafts={estimateDrafts.current}
                  capture={formIntent.capture}
                  disabled={
                    locked ||
                    loading ||
                    uncertain ||
                    orderQueue.loading ||
                    parcelQueue.loading ||
                    reconcile ||
                    unavailable
                  }
                  onSubmit={(e) => void submit(e, "setDeliveryEstimate", p)}
                />
                <details className="crmItemDetails" name="crm-shipping-actions">
                  <summary>
                    <CrmIcon name="clock" /> Cập nhật hành trình
                  </summary>
                  <form
                    className="form"
                    data-intent={`track:${p.id}`}
                    onChange={(e) => formIntent.capture(e.currentTarget)}
                    onSubmit={(e) => void submit(e, "trackParcel", p)}
                  >
                    <fieldset
                      style={{ minWidth: 0 }}
                      className="form"
                      disabled={
                        locked ||
                        loading ||
                        uncertain ||
                        orderQueue.loading ||
                        parcelQueue.loading
                      }
                    >
                      <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                        Kết quả cập nhật thủ công
                        <select name="state">
                          <option value="in_transit">Đang vận chuyển</option>
                          <option value="delivered">Đã giao kiện này</option>
                          <option value="failed">Giao không thành công</option>
                          <option value="returned">Đã trả lại</option>
                        </select>
                      </label>
                      <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                        Nội dung sự kiện
                        <textarea name="event" minLength={3} required />
                      </label>
                      <button
                        className="primary"
                        disabled={
                          reconcile ||
                          unavailable ||
                          locked ||
                          loading ||
                          uncertain ||
                          orderQueue.loading ||
                          parcelQueue.loading
                        }
                      >
                        <CrmIcon name="check" /> Lưu cập nhật vận chuyển
                      </button>
                    </fieldset>
                  </form>
                </details>
              </>
            )
          )}
        </article>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {uncertain && (
        <div className="crmActions">
          <CrmReference
            label="Kiện đang xử lý"
            value={String(pending.current?.parcelId ?? "Kiện mới")}
          />
          <button
            className="primary"
            disabled={busy}
            onClick={() => void execute()}
          >
            {busy ? "Đang kiểm tra…" : "Thử lại thao tác đã gửi"}
          </button>
        </div>
      )}
    </section>
  );
}
