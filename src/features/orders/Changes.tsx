import { StepForm, StepStage } from "../../shared/StepForm";
import { OperationsEmpty } from "../operations/OperationsPresentation";
import "../operations/operations-workbench.css";
import { LoadingState } from "../../shared/Loading";
import { Link } from "react-router-dom";
import {
  CrmHeading,
  CrmIcon,
  CrmState,
  CrmReference,
} from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, callService } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
import {
  proposalSchema,
  type ChangeProposal,
} from "../../../packages/domain/changes";
import { createRequestSequence } from "../content/editor-state";
type Change = {
  id: string;
  orderId: string;
  state: string;
  proposal: Omit<ChangeProposal, "evidence">;
};
const labels = {
  substitution: "Thay sản phẩm/biến thể",
  partialCancellation: "Hủy phần chưa mua",
  cancellation: "Hủy đơn và đối soát chi phí",
  return: "Trả hàng và đối soát",
};
export function changeRejection(cause: unknown) {
  const code = (cause as { code?: string })?.code?.replace(/^functions\//, "");
  return [
    "invalid-argument",
    "permission-denied",
    "unauthenticated",
    "failed-precondition",
    "not-found",
    "already-exists",
    "aborted",
  ].includes(code ?? "");
}
export function changeProposalInput(form: FormData, order: Order) {
  const kind = String(form.get("kind"));
  const lines = order.items
    .map((item, line) => {
      const name = String(form.get(`name-${line}`) ?? "").trim();
      const variant = String(form.get(`variant-${line}`) ?? item.variant);
      const changedVariant = variant !== item.variant;
      return kind === "substitution"
        ? {
            line,
            cancelQuantity: 0,
            ...(name ? { replacementName: name } : {}),
            ...(name || changedVariant ? { replacementVariant: variant } : {}),
          }
        : { line, cancelQuantity: Number(form.get(`cancel-${line}`) ?? 0) };
    })
    .filter(
      (line) =>
        line.cancelQuantity > 0 ||
        "replacementName" in line ||
        "replacementVariant" in line,
    );
  if (
    kind === "substitution" &&
    !lines.some((line) => "replacementName" in line)
  )
    throw new Error("NO_SUBSTITUTION");
  return proposalSchema.parse({
    kind,
    resolveHold: form.get("resolveHold") === "on",
    reason: String(form.get("reason") ?? ""),
    termsVersion:
      order.catalogSnapshot?.termsVersion ?? order.quote?.termsVersion,
    lines,
    finalPayable: Number(form.get("total")),
    actualCosts: Number(form.get("costs")),
    evidence: String(form.get("evidence") ?? ""),
  });
}
function useChangeMutation(identity: string, vi = true) {
  const sequence = useRef(createRequestSequence());
  const sending = useRef(false);
  const pending = useRef<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    sequence.current.invalidate();
    sending.current = false;
    pending.current = null;
    setBusy(false);
    setUncertain(false);
    setError("");
    setNotice("");
    return () => {
      sequence.current.invalidate();
    };
  }, [identity]);
  async function run(
    build?: () => Record<string, unknown> | Promise<Record<string, unknown>>,
    confirmed?: () => void | Promise<void>,
  ) {
    if (sending.current || (!pending.current && !build)) return;
    sending.current = true;
    const revision = sequence.current.next();
    setBusy(true);
    setError("");
    setNotice("");
    let acknowledged = false;
    try {
      if (!pending.current && build) {
        const command = await build();
        if (!sequence.current.current(revision)) return;
        pending.current = { ...command, operationId: crypto.randomUUID() };
      }
      await callService("changeCommand", pending.current!);
      if (!sequence.current.current(revision)) return;
      pending.current = null;
      acknowledged = true;
      setUncertain(false);
      setNotice(
        vi
          ? "Đã ghi nhận thao tác thay đổi."
          : "Your change action has been recorded.",
      );
      if (confirmed) await confirmed();
    } catch (cause) {
      if (!sequence.current.current(revision)) return;
      if (acknowledged) {
        setError(
          vi
            ? "Thao tác đã được ghi nhận, nhưng chưa tải được dữ liệu mới. Hãy tải lại."
            : "The action was recorded, but updated data could not be loaded. Reload to check.",
        );
      } else {
        const unknown = !!pending.current && !changeRejection(cause);
        if (!unknown) pending.current = null;
        setUncertain(unknown);
        setError(
          unknown
            ? vi
              ? "Chưa xác nhận được kết quả. Thử lại đúng thao tác đang chờ."
              : "The result is unconfirmed. Retry the same pending action."
            : vi
              ? "Chưa thực hiện được. Tải lại đơn và kiểm tra điều khoản, phần hàng, chi phí trước khi thử lại."
              : "The action could not be completed. Reload the order and check its terms, items and costs before retrying.",
        );
      }
    } finally {
      if (sequence.current.current(revision)) {
        sending.current = false;
        setBusy(false);
      }
    }
  }
  return { busy, uncertain, error, notice, run, pending };
}
function ChangeFeedback({
  mutation,
  retry,
  vi = true,
}: {
  mutation: ReturnType<typeof useChangeMutation>;
  retry: () => void;
  vi?: boolean;
}) {
  return (
    <>
      {mutation.notice && <p role="status">{mutation.notice}</p>}
      {mutation.error && (
        <p className="error" role="alert">
          {mutation.error}
        </p>
      )}
      {mutation.uncertain && (
        <button disabled={mutation.busy} onClick={retry}>
          {vi ? "Thử lại thao tác đang chờ" : "Retry pending action"}
        </button>
      )}
    </>
  );
}
export function CustomerChanges({
  order,
  language = "vi",
}: {
  order: Order;
  language?: "vi" | "en";
}) {
  const vi = language === "vi";
  const mutation = useChangeMutation(order.id, vi);
  const [changes, setChanges] = useState<Change[]>([]),
    [readAttempt, setReadAttempt] = useState(0),
    [readState, setReadState] = useState<
      "loading" | "ready" | "offline" | "error"
    >("loading");
  useEffect(() => {
    let active = true;
    let requiresRetry = !navigator.onLine;
    setChanges([]);
    setReadState(navigator.onLine ? "loading" : "offline");
    if (!db) {
      setReadState("error");
      return;
    }
    const offline = () => {
      requiresRetry = true;
      if (active) setReadState("offline");
    };
    const online = () => {
      if (active) setReadState(requiresRetry ? "error" : "loading");
    };
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    const unsubscribe = onSnapshot(
      query(
        collection(db, "orderChanges"),
        where("ownerId", "==", order.ownerId),
        where("orderId", "==", order.id),
        limit(20),
      ),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return;
        setChanges(
          snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Change),
        );
        setReadState(
          requiresRetry
            ? navigator.onLine
              ? "error"
              : "offline"
            : !navigator.onLine
              ? "offline"
              : snapshot.metadata.fromCache
                ? "loading"
                : "ready",
        );
      },
      () => {
        if (active) {
          setReadState("error");
          setChanges([]);
        }
      },
    );
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, [order.id, order.ownerId, readAttempt]);
  const amount = (value: number) =>
    value.toLocaleString(vi ? "vi-VN" : "en-US") + " ₫";
  const englishLabels = {
    substitution: "Replace product or variant",
    partialCancellation: "Cancel unpurchased items",
    cancellation: "Cancel order and reconcile costs",
    return: "Return items and reconcile costs",
  };
  async function review(change: Change, action: "accept" | "reject") {
    if (mutation.busy || mutation.uncertain || readState !== "ready") return;
    await mutation.run(() => ({
      action,
      orderId: order.id,
      expectedVersion: order.version,
      proposalId: change.id,
    }));
  }
  return (
    <>
      {readState === "loading" && (
        <LoadingState>
          {vi ? "Đang tải đề xuất thay đổi…" : "Loading change proposals…"}
        </LoadingState>
      )}
      {(readState === "offline" || readState === "error") && (
        <>
          <p role="alert" className="error">
            {vi
              ? "Chưa tải được đề xuất thay đổi."
              : "Could not load change proposals."}
            {readState === "offline" &&
              (vi
                ? " Anh/chị đang mất kết nối. Kết nối lại rồi tải lại đề xuất."
                : " You are offline. Reconnect, then retry proposals.")}
          </p>
          <button
            disabled={mutation.busy || mutation.uncertain}
            onClick={() => setReadAttempt((attempt) => attempt + 1)}
          >
            {vi ? "Tải lại đề xuất" : "Retry proposals"}
          </button>
        </>
      )}
      {readState === "ready" && changes.length === 0 && (
        <p>
          {vi
            ? "Chưa có đề xuất thay đổi cho đơn này."
            : "No change proposals for this order."}
        </p>
      )}
      {changes.map((c) => (
        <article className="panel order" key={c.id}>
          <h3>
            {vi ? labels[c.proposal.kind] : englishLabels[c.proposal.kind]}
          </h3>
          <p>{c.proposal.reason}</p>
          <p>
            {vi ? "Tổng phải trả sau thay đổi:" : "Total payable after change:"}{" "}
            {amount(c.proposal.finalPayable)} ·{" "}
            {vi ? "chi phí thật được ghi nhận:" : "recorded actual costs:"}{" "}
            {amount(c.proposal.actualCosts)}
          </p>
          <p>
            {order.purchaseKind === "catalog"
              ? vi
                ? "Đơn này cần thanh toán toàn bộ theo giá niêm yết."
                : "This order requires full payment at the listed price."
              : vi
                ? `Cọc đã chấp nhận: ${amount(order.deposit ?? 0)}. Thay đổi tổng tiền không sửa nghĩa vụ cọc đã chấp nhận.`
                : `Accepted deposit: ${amount(order.deposit ?? 0)}. Changing the total does not change the accepted deposit obligation.`}{" "}
            {vi
              ? "Tiền đã thu được giữ trong lịch sử; hoàn tiền được đối soát riêng."
              : "Collected payments remain in the history; refunds are reconciled separately."}
          </p>
          <p>
            {vi ? "Điều khoản đã chấp nhận:" : "Accepted terms:"}{" "}
            {c.proposal.termsVersion}
          </p>
          {c.proposal.lines.map((l) => (
            <p key={l.line}>
              {vi ? "Dòng" : "Line"} {l.line + 1}:{" "}
              {c.proposal.kind === "substitution"
                ? l.replacementName || l.replacementVariant !== undefined
                  ? `${vi ? "Đổi thành" : "Replace with"} ${l.replacementName ?? order.items[l.line]?.name ?? (vi ? "sản phẩm hiện tại" : "current product")}${l.replacementVariant !== undefined ? ` · ${vi ? "Biến thể" : "Variant"}: ${l.replacementVariant || (vi ? "chưa ghi" : "not specified")}` : ""}`
                  : vi
                    ? "Giữ nguyên sản phẩm/biến thể"
                    : "Keep the current product and variant"
                : `${c.proposal.kind === "return" ? (vi ? "trả" : "return") : vi ? "hủy" : "cancel"} ${l.cancelQuantity}`}
            </p>
          ))}
          <p>
            {c.state === "pending"
              ? vi
                ? "Chờ anh/chị duyệt"
                : "Waiting for your approval"
              : c.state === "accepted"
                ? vi
                  ? "Anh/chị đã duyệt · chờ nhân viên áp dụng"
                  : "Approved by you · waiting for staff to apply"
                : c.state === "rejected"
                  ? vi
                    ? "Anh/chị đã từ chối"
                    : "Rejected by you"
                  : c.state === "applied"
                    ? vi
                      ? "Đã áp dụng và ghi lịch sử"
                      : "Applied and recorded in the history"
                    : vi
                      ? "Cần kiểm tra trạng thái thay đổi"
                      : "Change status needs verification"}
            .{" "}
            {vi
              ? "Quyết định này không tự chuyển hoặc hoàn tiền."
              : "This decision does not transfer or refund money automatically."}
          </p>
          {c.state === "pending" && readState === "ready" && (
            <>
              <button
                disabled={mutation.busy || mutation.uncertain}
                onClick={() => void review(c, "accept")}
              >
                {vi
                  ? "Đồng ý thay đổi và tổng phải trả"
                  : "Accept change and final amount"}
              </button>
              <button
                disabled={mutation.busy || mutation.uncertain}
                onClick={() => void review(c, "reject")}
              >
                {vi ? "Từ chối thay đổi" : "Reject change"}
              </button>
            </>
          )}
        </article>
      ))}
      <ChangeFeedback
        mutation={mutation}
        vi={vi}
        retry={() => void mutation.run()}
      />
    </>
  );
}
export function ProposeChange({
  order,
  onChanged,
}: {
  order: Order;
  onChanged: () => void;
}) {
  const mutation = useChangeMutation(order.id);
  const [kind, setKind] = useState("substitution");
  async function propose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mutation.uncertain) return;
    const form = new FormData(e.currentTarget);
    await mutation.run(
      () => ({
        action: "propose",
        orderId: order.id,
        expectedVersion: order.version,
        payload: changeProposalInput(form, order),
      }),
      onChanged,
    );
  }
  return (
    <details>
      <summary>Đề xuất thay đổi để khách duyệt</summary>
      <StepForm
        steps={["Hàng thay đổi", "Giá trị & lý do", "Kiểm tra"]}
        disabled={mutation.busy || mutation.uncertain}
        resetKey={kind}
        className="form"
        onSubmit={(e) => void propose(e)}
      >
        <fieldset
          className="form"
          disabled={mutation.busy || mutation.uncertain}
        >
          <StepStage index={0}>
            <label>
              Loại thay đổi
              <select
                name="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                {Object.entries(labels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {order.items.map((item, line) => (
              <fieldset key={`${kind}:${line}`}>
                <legend>
                  {item.name} · {item.variant} · {item.quantity}
                </legend>
                {kind === "substitution" ? (
                  <>
                    <label>
                      Tên thay thế
                      <input name={`name-${line}`} maxLength={200} />
                    </label>
                    <label>
                      Biến thể thay thế
                      <input
                        name={`variant-${line}`}
                        maxLength={200}
                        defaultValue={item.variant}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      {kind === "return" ? "Số lượng trả" : "Số lượng hủy"}
                      <input
                        name={`cancel-${line}`}
                        type="number"
                        min={0}
                        max={item.quantity}
                        defaultValue={
                          kind === "cancellation" ? item.quantity : 0
                        }
                      />
                    </label>
                  </>
                )}
              </fieldset>
            ))}
          </StepStage>
          <StepStage index={1}>
            <label>
              <span className="formLabelText">
                Lý do hiển thị cho khách{" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <textarea name="reason" minLength={5} maxLength={1000} required />
            </label>
            <label>
              <span className="formLabelText">
                Tổng phải trả sau thay đổi (₫){" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                name="total"
                type="number"
                min={0}
                max={1000000000000}
                required
              />
            </label>
            <label>
              <span className="formLabelText">
                Chi phí thực tế đã phát sinh (₫){" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                name="costs"
                type="number"
                min={0}
                max={1000000000000}
                required
              />
            </label>
          </StepStage>
          <StepStage index={2}>
            <label>
              <input type="checkbox" name="resolveHold" /> Đề xuất đã xử lý
              nguyên nhân hold trước đó
            </label>
            <label>
              <span className="formLabelText">
                Bằng chứng nội bộ · khách không đọc trường này{" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <textarea
                name="evidence"
                minLength={5}
                maxLength={1000}
                required
              />
            </label>
            <p>
              Không mặc định tịch thu cọc hoặc hứa hoàn tiền. Cần chi phí thật,
              điều khoản đã chấp nhận và quyết định của khách.
            </p>
            <button disabled={mutation.busy || mutation.uncertain}>
              Gửi đề xuất và tạm giữ xử lý
            </button>
          </StepStage>
        </fieldset>
      </StepForm>
      <ChangeFeedback
        mutation={mutation}
        retry={() => void mutation.run(undefined, onChanged)}
      />
    </details>
  );
}
export function ChangeQueue() {
  const mutation = useChangeMutation("crm-change-queue");
  const [changes, setChanges] = useState<Change[]>([]),
    [error, setError] = useState(""),
    [reading, setReading] = useState(false),
    [ready, setReady] = useState(false),
    [next, setNext] = useState<string | null>(null);
  const epoch = useRef(0),
    mounted = useRef(false),
    readLocked = useRef(false);
  async function load(after?: string) {
    if (!mounted.current || readLocked.current || mutation.pending.current)
      return;
    readLocked.current = true;
    const request = ++epoch.current;
    setReading(true);
    if (!after) setReady(false);
    setError("");
    if (!after) {
      setChanges([]);
      setNext(null);
    }
    try {
      const result = await callService<{ rows: Change[]; next: string | null }>(
        "listWork",
        {
          kind: "orderChanges",
          changeState: "accepted",
          ...(after ? { after } : {}),
        },
      );
      if (!mounted.current || epoch.current !== request) return;
      setChanges((previous) => {
        const rows = after ? [...previous, ...result.rows] : result.rows;
        return [...new Map(rows.map((row) => [row.id, row])).values()];
      });
      setNext(result.next ?? null);
      setReady(true);
    } catch {
      if (mounted.current && epoch.current === request) {
        setChanges([]);
        setNext(null);
        setReady(false);
        setError("Chưa tải được đề xuất thay đổi.");
      }
    } finally {
      if (mounted.current && epoch.current === request) {
        readLocked.current = false;
        setReading(false);
      }
    }
  }
  useEffect(() => {
    mounted.current = true;
    readLocked.current = false;
    void load();
    return () => {
      mounted.current = false;
      ++epoch.current;
      readLocked.current = false;
    };
  }, []);
  async function apply(c: Change) {
    if (
      !mounted.current ||
      mutation.busy ||
      mutation.uncertain ||
      readLocked.current ||
      !ready
    )
      return;
    await mutation.run(
      async () => {
        const current = await callService<{ order: Order }>("orderHistory", {
          orderId: c.orderId,
        });
        return {
          action: "apply",
          orderId: c.orderId,
          expectedVersion: current.order.version,
          proposalId: c.id,
        };
      },
      () => load(),
    );
  }
  return (
    <section className="operations095 operationsChanges">
      <CrmHeading
        title="Thay đổi chờ áp dụng"
        description="Kiểm tra đề xuất khách đã duyệt trước khi áp dụng vào đơn."
        actions={
          <button
            disabled={reading || mutation.busy || mutation.uncertain}
            onClick={() => void load()}
          >
            <CrmIcon name="refresh" />
            Tải lại đề xuất
          </button>
        }
      />
      <ChangeFeedback
        mutation={mutation}
        retry={() => void mutation.run(undefined, () => load())}
      />
      {reading && <CrmState kind="loading" title="Đang tải đề xuất…" />}
      {ready && changes.length === 0 && (
        <OperationsEmpty title="Chưa có thay đổi đã duyệt cần xử lý">
          Đề xuất xuất hiện tại đây sau khi khách chấp nhận.
        </OperationsEmpty>
      )}
      <div className="crmList">
        {ready &&
          changes.map((c) => (
            <article className="crmItem" key={c.id}>
              <div className="crmItemMain">
                <div className="crmItemMeta">
                  <h2 className="crmItemTitle">{labels[c.proposal.kind]}</h2>
                  <span className="crmBadge">
                    <CrmIcon name="check" />
                    Khách đã duyệt
                  </span>
                </div>
                <p>{c.proposal.reason}</p>
                <dl className="crmFacts">
                  <div>
                    <dt>Tổng phải trả sau thay đổi</dt>
                    <dd>{c.proposal.finalPayable.toLocaleString("vi-VN")} ₫</dd>
                  </div>
                  <div>
                    <dt>Chi phí thực tế</dt>
                    <dd>{c.proposal.actualCosts.toLocaleString("vi-VN")} ₫</dd>
                  </div>
                </dl>
                <div className="crmItemMeta">
                  <Link to={"/crm/orders?order=" + c.orderId}>
                    <CrmIcon name="box" />
                    Mở đơn mua hộ
                  </Link>
                  <CrmReference label="Mã đơn" value={c.orderId} />
                </div>
                <details className="crmItemDetails">
                  <summary>Chi tiết thay đổi</summary>
                  <CrmReference label="Mã đề xuất" value={c.id} />
                  <p>Điều khoản đã chấp nhận: {c.proposal.termsVersion}</p>
                  {c.proposal.lines.map((line) => (
                    <p key={line.line}>
                      Dòng {line.line + 1}:{" "}
                      {c.proposal.kind === "substitution"
                        ? `${line.replacementName ?? "Giữ nguyên sản phẩm"}${line.replacementVariant !== undefined ? ` · Biến thể: ${line.replacementVariant || "chưa ghi"}` : ""}`
                        : `${c.proposal.kind === "return" ? "trả" : "hủy"} ${line.cancelQuantity}`}
                    </p>
                  ))}
                </details>
              </div>
              <div className="crmActions">
                <button
                  className="primary"
                  disabled={mutation.busy || mutation.uncertain || reading}
                  onClick={() => void apply(c)}
                >
                  <CrmIcon name="check" />
                  Áp dụng quyết định đã duyệt
                </button>
              </div>
            </article>
          ))}
      </div>
      {ready && next && (
        <div className="crmActions">
          <button
            disabled={reading || mutation.busy || mutation.uncertain}
            onClick={() => void load(next)}
          >
            <CrmIcon name="arrow" />
            Xem thêm đề xuất
          </button>
        </div>
      )}
      {error && <CrmState kind="error" title={error} />}
    </section>
  );
}
