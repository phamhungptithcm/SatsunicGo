import { CrmIcon, CrmReference, CrmState } from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
import type { Parcel } from "../../../packages/domain/shipping";
import {
  readRecords,
  requireSettled,
  recordIds,
  selectionIds,
  useFormIntent,
  useResultFocus,
  useWorkQueue,
  versionMap,
  type ShippingLock,
} from "./queue-state";
import type { Batch } from "../../../packages/domain/consolidation";
export function consolidationSelection(
  parcels: Parcel[],
  orders: Pick<Order, "id">[],
  selected: string[],
) {
  const selectedParcels = parcels.filter(
    (p) => selected.includes(p.id) && p.state === "packed" && !p.batchId,
  );
  const orderIds = [
    ...new Set(
      selectedParcels.flatMap((p) => p.allocations.map((a) => a.orderId)),
    ),
  ];
  return {
    orderIds,
    weightGrams: selectedParcels.reduce((sum, p) => sum + p.weightGrams, 0),
    missingOrders: orderIds.some((id) => !orders.some((o) => o.id === id)),
  };
}
export function Consolidation({ lock, onAuthorityDenied }: { lock: ShippingLock; onAuthorityDenied: () => void }) {
  const parcelQueue = useWorkQueue<Parcel>("packages"),
    batchQueue = useWorkQueue<Batch>("consolidationBatches");
  const parcels = parcelQueue.rows,
    batches = batchQueue.rows;
  const [orders, setOrders] = useState<Order[]>([]);
  const [tray, setTray] = useState<Parcel[]>([]);
  const [result, setResult] = useState<Batch | null>(null);
  const [resultId, setResultId] = useState("");
  const [resultError, setResultError] = useState(false);
  const [ackNotice, setAckNotice] = useState("");
  const [reconcile, setReconcile] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [authorityDenied, setAuthorityDenied] = useState(false);
  function noteAuthority(cause: unknown) {
    const code = String((cause as { code?: string })?.code ?? "").replace("functions/", "");
    if (["permission-denied", "unauthenticated"].includes(code)) {
      setAuthorityDenied(true);
      onAuthorityDenied();
    }
  }
  const [pendingChoice, setPendingChoice] = useState<{ id: string; checked: boolean } | null>(null);
  const [failedChoice, setFailedChoice] = useState("");
  const lockRef = useRef(lock);
  lockRef.current = lock;
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [message, setMessage] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [uncertain, setUncertain] = useState(false);
  const mounted = useRef(true),
    generation = useRef(0),
    sending = useRef(false);
  const pending = useRef<Record<string, unknown> | null>(null);
  const submittedForm = useRef<HTMLFormElement | null>(null);
  const needsFinalReview = useRef(false);
  const root = useRef<HTMLElement | null>(null);
  const formIntent = useFormIntent(root);
  const resultTarget = useRef<HTMLDivElement | null>(null);
  useResultFocus(
    resultId ? `${resultId}:${result?.version ?? "unavailable"}` : "",
    resultTarget,
  );
  async function load() {
    lockRef.current.beginRead();
    const current = ++generation.current;
    setLoading(true);
    setLoadError("");
    try {
      const settled = await Promise.allSettled([
        parcelQueue.load(),
        batchQueue.load(),
      ]);
      requireSettled(settled);
      if (current !== generation.current) return false;
      return true;
    } catch (cause) {
      if (current !== generation.current) return;
      if (mounted.current) noteAuthority(cause);
      setOrders([]);

      parcelQueue.clear();
      batchQueue.clear();
      setResult(null);
      setUnavailable(true);
      setReconcile(true);
      setLoadError("Chưa tải được lô gom. Thử tải lại.");
      return false;
    } finally {
      lockRef.current.endRead();
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
    queue: typeof parcelQueue | typeof batchQueue,
    direction: "forward" | "back",
  ) {
    if (lockRef.current.blocked || loading || !lockRef.current.acquire())
      return;
    setLoadError("");
    try {
      await queue[direction]();
    } catch (cause) {
      if (mounted.current) noteAuthority(cause);
      parcelQueue.clear();
      batchQueue.clear();
      setResult(null);
      setUnavailable(true);
      setReconcile(true);
      if (mounted.current) setLoadError("Chưa tải được trang. Thử tải lại.");
    } finally {
      lockRef.current.release();
    }
  }
  async function refresh() {
    if (lockRef.current.blocked || !lockRef.current.acquire()) return;
    try {
      await load();
    } finally {
      lockRef.current.release();
    }
  }
  async function selectParcel(parcel: Parcel, checked: boolean) {
    if (lockRef.current.blocked || loading || !lockRef.current.acquire())
      return;
    setBusy(true);
    setMessage("");
    const current = generation.current;
    try {
      const ids = selectionIds(selected, parcel.id, checked, 20);
      const next = ids.map((id) =>
        id === parcel.id ? parcel : tray.find((p) => p.id === id)!,
      );
      if (!checked) {
        setSelected(ids);
        setTray(next);
        setOrders((rows) =>
          rows.filter((o) =>
            next.some((p) => p.allocations.some((a) => a.orderId === o.id)),
          ),
        );
        return;
      }
      const references = [
        ...new Set(next.flatMap((p) => p.allocations.map((a) => a.orderId))),
      ];
      if (references.length) recordIds(references, 10);
      setPendingChoice({ id: parcel.id, checked });
      setFailedChoice("");
      const snapshots = references.length
        ? await readRecords<Order>("orders", references, 10)
        : [];
      if (current !== generation.current) return;
      setSelected(ids);
      setTray(next);
      setOrders(snapshots);
    } catch (cause) {
      if (mounted.current && current === generation.current) noteAuthority(cause);
      if (current === generation.current) {
        const code = String((cause as { code?: string }).code ?? "").replace("functions/", "");
        if (["permission-denied", "unauthenticated"].includes(code)) {
          setOrders([]);
          setUnavailable(true);
          parcelQueue.clear();
          batchQueue.clear();
          setResult(null);
        }
        setFailedChoice(parcel.id);
        setReconcile(true);
        setMessage(
          "Chưa thêm được kiện. Đối chiếu dữ liệu để tiếp tục; giữ tối đa 20 kiện, 10 đơn.",
        );
      }
    } finally {
      lockRef.current.release();
      if (mounted.current && current === generation.current) {
        setPendingChoice(null);
        setBusy(false);
      }
    }
  }
  async function readResult(id: string) {
    lockRef.current.beginRead();
    setResultError(false);
    const current = generation.current;
    try {
      const [row] = await readRecords<Batch>("consolidationBatches", [id], 1);
      if (current !== generation.current) return false;
      setResult(row);
      return true;
    } catch (cause) {
      if (mounted.current && current === generation.current) noteAuthority(cause);
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
          parcelQueue.clear();
          batchQueue.clear();
          setOrders([]);
        }
      }
      return false;
    } finally {
      lockRef.current.endRead();
    }
  }
  async function reconcileRecords() {
    if (lockRef.current.blocked || !lockRef.current.acquire()) return;
    setBusy(true);
    setMessage("");
    try {
      const updated = selected.length
        ? await readRecords<Parcel>("packages", selected, 20)
        : [];
      const references = [
        ...new Set(updated.flatMap((p) => p.allocations.map((a) => a.orderId))),
      ];
      const snapshots = references.length
        ? await readRecords<Order>("orders", references, 10)
        : [];
      if (!(await load())) throw Error("READ_FAILED");
      if (!mounted.current) return;
      setTray(updated);
      setOrders(snapshots);
      setReconcile(false);
      setFailedChoice("");
      setUnavailable(false);
      if (resultId && !(await readResult(resultId))) throw Error("RESULT_READ_FAILED");
      setAuthorityDenied(false);
    } catch (cause) {
      if (mounted.current) noteAuthority(cause);
      if (mounted.current) {
        setUnavailable(true);
        parcelQueue.clear();
        batchQueue.clear();
        setResult(null);
        setOrders([]);
        setMessage("Chưa đối chiếu được dữ liệu. Giữ nội dung và thử lại.");
      }
    } finally {
      lockRef.current.release();
      if (mounted.current) setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>, batch?: Batch) {
    event.preventDefault();
    if (
      sending.current ||
      uncertain ||
      loading ||
      parcelQueue.loading ||
      batchQueue.loading ||
      reconcile ||
      unavailable ||
      lockRef.current.blocked ||
      !lockRef.current.acquire()
    )
      return;
    submittedForm.current = event.currentTarget;
    formIntent.capture(event.currentTarget);
    const f = new FormData(event.currentTarget);
    const context = generation.current;
    setBusy(true);
    setMessage("");
    try {
      const parcelIds = batch ? batch.parcelIds : selected;
      const currentParcels = await readRecords<Parcel>(
        "packages",
        parcelIds,
        20,
      );
      if (
        !batch &&
        currentParcels.some(
          (p) => p.version !== tray.find((old) => old.id === p.id)?.version,
        )
      )
        throw Error("STALE_SELECTION");
      const members = new Set(
        currentParcels.flatMap((p) => p.allocations.map((a) => a.orderId)),
      );
      const currentOrders = await readRecords<Order>(
        "orders",
        [...members],
        10,
      );
      if (
        !batch &&
        currentOrders.some(
          (o) => o.version !== orders.find((old) => old.id === o.id)?.version,
        )
      )
        throw Error("STALE_SELECTION");
      if (!mounted.current || context !== generation.current) {
        lockRef.current.release();
        return;
      }
      if (!batch)
        needsFinalReview.current = currentOrders.some(
          (order) => order.purchaseKind !== "catalog",
        );
      pending.current = {
        action: batch ? "dispatch" : "seal",
        operationId: crypto.randomUUID(),
        ...(batch ? { batchId: batch.id, expectedVersion: batch.version } : {}),
        orderVersions: versionMap(currentOrders),
        parcelVersions: versionMap(currentParcels),
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
      };
      await execute();
    } catch (cause) {
      if (mounted.current) noteAuthority(cause);
      lockRef.current.release();
      if (mounted.current) {
        setBusy(false);
        setUnavailable(true);
        parcelQueue.clear();
        batchQueue.clear();
        setResult(null);
        setOrders([]);
        setReconcile(true);
        setMessage(
          "Chưa tải đủ dữ liệu kiện và đơn. Đối chiếu dữ liệu trước khi gửi lại.",
        );
      }
    }
  }
  async function execute() {
    if (!pending.current || sending.current) return;
    const current = generation.current;
    sending.current = true;
    setBusy(true);
    setMessage("");
    try {
      const command = pending.current;
      const acknowledged = await callService<{ id: string; version: number }>(
        "consolidationCommand",
        command,
      );
      pending.current = null;
      if (current !== generation.current) return;
      if (command.action === "seal") {
        setSelected([]);
        setTray([]);
        setOrders([]);
      }
      formIntent.clear(submittedForm.current);
      submittedForm.current?.reset();
      setUncertain(false);
      setAckNotice(
        command.action === "dispatch"
          ? "Đã ghi nhận bàn giao toàn bộ lô."
          : needsFinalReview.current
            ? "Đã chốt phân bổ cước. Tổng cuối của đơn mua hộ cần được khách duyệt trước khi xuất gửi."
            : "Đã chốt phân bổ cước cho lô.",
      );
      setResultId(acknowledged.id);
      if (result?.id !== acknowledged.id) setResult(null);
      await load();
      await readResult(acknowledged.id);
      lockRef.current.release();
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
        parcelQueue.clear();
        batchQueue.clear();
        setOrders([]);
        setResult(null);
      }
      if (rejected) {
        pending.current = null;
        setReconcile(true);
        lockRef.current.release();
      }
      setUncertain(!rejected);
      setMessage(
        rejected
          ? "Chưa lưu được. Kiểm tra kiện, phân bổ cước, quyền và phiên bản."
          : "Chưa xác nhận được kết quả. Nội dung lô đang được giữ nguyên để thử lại đúng thao tác.",
      );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const {
    orderIds: selectedOrderIds,
    weightGrams,
    missingOrders,
  } = consolidationSelection(tray, orders, selected);
  const invalidSelection = tray.some(
    (p) => p.state !== "packed" || Boolean(p.batchId),
  );
  if (authorityDenied) return (
    <section ref={root} className="workbench">
      <p role="alert">Không có quyền xem dữ liệu này. Đối chiếu lại sau khi được cấp quyền.</p>
      <button disabled={lock.blocked || loading || busy} onClick={() => void reconcileRecords()}>Đối chiếu dữ liệu lô</button>
    </section>
  );
  return (
    <section ref={root} className="workbench">
      <h2 className="crmSectionHeading">
        <CrmIcon name="box" /> Gom kiện và phân bổ cước
      </h2>
      <p className="muted">
        Mỗi trang hiển thị tối đa 30 bản ghi. Mỗi lô phải gồm toàn bộ kiện của
        các đơn tham gia, cùng kho và tuyến. Chốt lô chưa ghi nhận thu tiền.
      </p>
      <div className="crmActions">
        <button
          disabled={
            lock.blocked ||
            busy ||
            loading ||
            parcelQueue.loading ||
            batchQueue.loading
          }
          onClick={() => void refresh()}
        >
          <CrmIcon name="refresh" /> Tải lại lô gom
        </button>
      </div>
      {loading && <CrmState kind="loading" title="Đang tải lô gom…" />}
      {loadError && (
        <CrmState
          kind="error"
          title="Chưa tải được lô gom"
          action={
            <button
              disabled={
                lock.blocked ||
                busy ||
                loading ||
                parcelQueue.loading ||
                batchQueue.loading
              }
              onClick={() => void refresh()}
            >
              Thử lại
            </button>
          }
        >
          {batches.length > 0 &&
            "Các lô đang hiển thị là dữ liệu đã tải trước đó."}
        </CrmState>
      )}
      {!loading && !loadError && !batches.length && (
        <CrmState kind="empty" title="Chưa có lô gom trong phạm vi đang xem" />
      )}
      <details className="crmItemDetails" name="crm-shipping-actions">
        <summary>
          <CrmIcon name="box" /> Tạo lô gom
        </summary>
        <form
          className="form panel"
          data-intent="seal"
          onChange={(e) => formIntent.capture(e.currentTarget)}
          onSubmit={(e) => void submit(e)}
        >
          <fieldset
            style={{ minWidth: 0 }}
            className="form"
            disabled={
              lock.blocked ||
              busy ||
              loading ||
              uncertain ||
              parcelQueue.loading ||
              batchQueue.loading
            }
          >
            <div className="crmActions" aria-label="Trang kiện gom lô">
              <button
                type="button"
                disabled={parcelQueue.page === 1}
                onClick={() => void pageQueue(parcelQueue, "back")}
              >
                Trang kiện gom trước
              </button>
              <span>
                Trang {parcelQueue.page} · {parcels.length} kiện
              </span>
              <button
                type="button"
                disabled={!parcelQueue.next}
                onClick={() => void pageQueue(parcelQueue, "forward")}
              >
                Trang kiện gom sau
              </button>
            </div>
            {parcels
              .filter((p) => p.state === "packed" && !p.batchId)
              .map((p) => (
                <label key={p.id}>
                  <input
                    type="checkbox"
                    name="parcel"
                    value={p.id}
                    checked={pendingChoice?.id === p.id ? pendingChoice.checked : selected.includes(p.id)}
                    onChange={(e) => void selectParcel(p, e.target.checked)}
                  />
                  <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    {p.id} · {p.weightGrams} g · {p.route}
                  </span>
                </label>
              ))}
            <p className="muted">
              Đã chọn {selected.length}/20 kiện · {selectedOrderIds.length}/10
              đơn
            </p>
            {pendingChoice && <p role="status">Đang kiểm tra kiện…</p>}
            {failedChoice && <p role="alert" style={{ overflowWrap: "anywhere" }}>Kiện {failedChoice} chưa được thêm. Các kiện đã chọn được giữ lại.</p>}
            {tray.map((p) => (
              <div key={p.id}>
                <CrmReference label="Kiện đã chọn" value={p.id} />
                <button
                  type="button"
                  aria-label={`Bỏ kiện ${p.id}`}
                  onClick={() => void selectParcel(p, false)}
                >
                  Bỏ kiện
                </button>
              </div>
            ))}
            {(unavailable ? [] : orders)
              .filter((o) => selectedOrderIds.includes(o.id))
              .map((o) => (
                <label key={o.id}>
                  Khối lượng phân bổ cho đơn {o.id} (g)
                  <input
                    name={`weight:${o.id}`}
                    type="number"
                    min={1}
                    max={1000000}
                    required
                  />
                </label>
              ))}
            {!selectedOrderIds.length && (
              <p className="muted">Chọn kiện để nhập khối lượng phân bổ.</p>
            )}
            {invalidSelection && (
              <p role="alert">
                Có kiện không còn đủ điều kiện gom. Bỏ kiện đó trước khi chốt
                lô.
              </p>
            )}
            {missingOrders && (
              <p role="alert">
                Chưa tải đủ đơn của kiện đã chọn. Tải lại và kiểm tra trước khi
                chốt lô.
              </p>
            )}
            <p>
              Tổng khối lượng kiện đã chọn:{" "}
              {weightGrams.toLocaleString("vi-VN")} g. Khối lượng phân bổ phải
              bằng tổng này.
            </p>
            <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              Tổng cước quốc tế (₫)
              <input name="freight" type="number" min={0} step={1} required />
            </label>
            <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              Hub đích
              <input name="hub" minLength={2} required />
            </label>
            <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              Dịch vụ vận chuyển
              <input name="service" minLength={2} required />
            </label>
            <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              Hạn bàn giao theo giờ địa phương
              <input name="cutoff" type="datetime-local" required />
            </label>
            <button
              className="primary"
              disabled={
                lock.blocked ||
                busy ||
                loading ||
                parcelQueue.loading ||
                batchQueue.loading ||
                reconcile ||
                uncertain ||
                invalidSelection ||
                unavailable ||
                missingOrders ||
                !selectedOrderIds.length
              }
            >
              <CrmIcon name="check" /> Chốt lô và phân bổ cước
            </button>
          </fieldset>
        </form>
      </details>
      {uncertain && (
        <div className="crmActions">
          <CrmReference
            label="Lô đang xử lý"
            value={String(pending.current?.batchId ?? "Lô mới")}
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
      {reconcile && (
        <div className="crmActions">
          <p role="alert">
            Dữ liệu cần được đối chiếu trước thao tác mới. Nội dung đang được
            giữ nguyên.
          </p>
          <button
            disabled={lock.blocked || loading}
            onClick={() => void reconcileRecords()}
          >
            Đối chiếu dữ liệu lô
          </button>
        </div>
      )}
      <div className="crmActions" aria-label="Trang lô gom">
        <button
          disabled={
            lock.blocked ||
            loading ||
            batchQueue.loading ||
            batchQueue.page === 1
          }
          onClick={() => void pageQueue(batchQueue, "back")}
        >
          Trang lô trước
        </button>
        <span>
          Trang {batchQueue.page} · {batches.length} lô
        </span>
        <button
          disabled={
            lock.blocked || loading || batchQueue.loading || !batchQueue.next
          }
          onClick={() => void pageQueue(batchQueue, "forward")}
        >
          Trang lô sau
        </button>
      </div>
      {resultId && (
        <div
          className="panel"
          ref={resultTarget}
          tabIndex={-1}
          role="region"
          aria-label="Lô vừa lưu"
        >
          <CrmReference label="Lô vừa lưu" value={resultId} />
          {ackNotice && <p role="status">{ackNotice}</p>}
          {resultError && (
            <>
              <p role="alert">Đã lưu lô. Chưa tải được chi tiết.</p>
              <button
                disabled={lock.blocked || loading}
                onClick={() => void readResult(resultId)}
              >
                Tải chi tiết lô
              </button>
            </>
          )}
        </div>
      )}
      {[
        ...(result && !batches.some((b) => b.id === result.id) ? [result] : []),
        ...batches.filter((row) => !resultError || row.id !== resultId),
      ].map((b) => (
        <article className="panel order crmItem" key={b.id}>
          <h3 className="crmItemTitle">
            <CrmIcon name="box" /> Lô gom
          </h3>
          <CrmReference label="Lô" value={b.id} />
          <p>
            {b.state === "sealed" ? "Chờ bàn giao" : "Đã bàn giao"} · {b.route}{" "}
            · {b.hub} · {b.service}
          </p>
          <p>Hạn bàn giao: {new Date(b.cutoff).toLocaleString("vi-VN")}</p>
          <p>Tổng cước: {b.freight.toLocaleString("vi-VN")} ₫</p>
          <details className="crmItemDetails">
            <summary>Chi tiết phân bổ cước</summary>
            {Object.entries(b.shares).map(([id, share]) => (
              <p key={id}>
                Đơn {id}: {share.toLocaleString("vi-VN")} ₫
              </p>
            ))}
          </details>
          {b.state === "sealed" && (
            <details className="crmItemDetails" name="crm-shipping-actions">
              <summary>
                <CrmIcon name="check" /> Bàn giao toàn bộ lô
              </summary>
              <form
                className="form"
                data-intent={`dispatch:${b.id}`}
                onChange={(e) => formIntent.capture(e.currentTarget)}
                onSubmit={(e) => void submit(e, b)}
              >
                <fieldset
                  style={{ minWidth: 0 }}
                  className="form"
                  disabled={
                    lock.blocked ||
                    busy ||
                    loading ||
                    uncertain ||
                    parcelQueue.loading ||
                    batchQueue.loading
                  }
                >
                  <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    Hãng vận chuyển
                    <input name="carrier" minLength={2} required />
                  </label>
                  <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    Mã vận đơn lô
                    <input name="tracking" minLength={3} required />
                  </label>
                  <label style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    Bằng chứng bàn giao
                    <textarea name="evidence" minLength={5} required />
                  </label>
                  <button
                    className="primary"
                    disabled={
                      reconcile ||
                      unavailable ||
                      lock.blocked ||
                      busy ||
                      loading ||
                      uncertain ||
                      parcelQueue.loading ||
                      batchQueue.loading
                    }
                  >
                    <CrmIcon name="check" /> Xác nhận xuất gửi toàn bộ lô
                  </button>
                </fieldset>
              </form>
            </details>
          )}
        </article>
      ))}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
