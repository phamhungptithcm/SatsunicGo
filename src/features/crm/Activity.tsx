import { PageTabs } from "../../shared/PageTabs";
import "../settings/admin-workbench096.css";
import { CrmHeading, CrmIcon, CrmState, CrmReference } from "./CrmPresentation";
import { useEffect, useRef, useState } from "react";
import { callService } from "../../shared/firebase";
const actionLabels: Record<string, string> = {
  submitRequest: "Gửi yêu cầu",
  issueQuote: "Gửi báo giá",
  acceptQuote: "Duyệt báo giá",
  verifyTransfer: "Xác nhận tiền",
  refund: "Hoàn tiền",
  recordPurchase: "Ghi nhận mua hàng",
  saveCustomerNotes: "Lưu hồ sơ nội bộ",
  saveProfile: "Cập nhật hồ sơ",
  replyTicket: "Phản hồi hỗ trợ",
  packParcel: "Đóng kiện",
  dispatchParcel: "Xuất gửi",
  trackParcel: "Cập nhật vận chuyển",
  saveContent: "Lưu nội dung",
  saveStaffAccess: "Cập nhật quyền",
  publishScheduled: "Xuất bản theo lịch",
  invoiceIssued: "Email chứng từ đơn hàng",
  "invoice:createDraft": "Tạo nháp chứng từ",
  "invoice:refreshDraft": "Cập nhật nháp chứng từ",
  "invoice:issue": "Xuất chứng từ",
  "invoice:void": "Hủy chứng từ",
  "invoice:createShare": "Tạo link chia sẻ chứng từ",
  "invoice:revokeShare": "Thu hồi link chứng từ",
  "invoice:queueEmail": "Xếp lịch email chứng từ",
  "invoice:configure": "Cập nhật người bán",
};
const states: Record<string, string> = {
  queued: "Chờ xử lý",
  inAppDelivered: "Đã tạo thông báo",
  sent: "Đã gửi email",
  sending: "Đang gửi email",
  unknown: "Chưa rõ kết quả gửi · cần đối soát",
  failed: "Gửi thất bại",
  blocked_external: "Email chưa được cấu hình",
  blocked_recipient: "Chưa đủ điều kiện nhận email",
  blocked_document: "Chứng từ không còn đủ điều kiện gửi",
  not_queued: "Chưa xếp email",
};
type Row = {
  id: string;
  action: string;
  resourceId?: string;
  createdAt: number;
  state?: string;
  emailState?: string;
  attempts?: number;
  version?: number;
};
export function activityLabel(value: string, type: "action" | "state") {
  const labels = type === "action" ? actionLabels : states;
  return Object.hasOwn(labels, value)
    ? labels[value]
    : type === "action"
      ? "Cập nhật nghiệp vụ"
      : "Chưa xác định";
}
export function outboxRejection(cause: unknown) {
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
export function outboxDecision(
  row: Row,
  operationId: string,
  outcome?: string,
  evidence?: string,
) {
  if (outcome) {
    if (
      row.emailState !== "unknown" ||
      !["confirmed_sent", "confirmed_not_sent"].includes(outcome) ||
      !evidence?.trim()
    )
      throw new Error("Cần kết quả và bằng chứng đối soát.");
  } else if (!["failed", "blocked_external"].includes(row.emailState ?? ""))
    throw new Error("Bản ghi chưa đủ điều kiện xếp lịch thử lại.");
  return {
    id: row.id,
    expectedVersion: row.version ?? 0,
    operationId,
    action: outcome ? "resolveUnknown" : "retry",
    ...(outcome ? { outcome, evidence: evidence!.trim() } : {}),
  };
}
export function Activity() {
  const request = useRef(0),
    context = useRef(0),
    mutating = useRef(false);
  const pending = useRef<ReturnType<typeof outboxDecision> | null>(null);
  const cursors = useRef<Record<string, string | undefined>>({});
  const [kind, setKind] = useState("auditEvents"),
    [rows, setRows] = useState<Row[]>([]),
    [next, setNext] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [notice, setNotice] = useState("");
  async function load(after: string | undefined = cursors.current[kind]) {
    if (pending.current) return;
    cursors.current[kind] = after;
    const current = ++request.current;
    setBusy(true);
    setError("");
    try {
      const r = await callService<{ rows: Row[]; next: string | null }>(
        "listWork",
        { kind, ...(after ? { after } : {}) },
      );
      if (current !== request.current) return;
      setRows(r.rows);
      setNext(r.next);
    } catch {
      if (current !== request.current) return;
      setRows([]);
      setNext(null);
      setError("Chưa tải được nhật ký. Kiểm tra kết nối và tải lại.");
    } finally {
      if (current === request.current) setBusy(false);
    }
  }
  useEffect(() => {
    mutating.current = false;
    void load();
    return () => {
      request.current++;
      context.current++;
    };
  }, [kind]);
  async function retry(row?: Row, outcome?: string, evidence?: string) {
    if (mutating.current || (!pending.current && !row)) return;
    if (!pending.current && row) {
      try {
        pending.current = outboxDecision(
          row,
          crypto.randomUUID(),
          outcome,
          evidence,
        );
      } catch {
        setError("Kiểm tra kết quả và bằng chứng trước khi lưu.");
        return;
      }
    }
    mutating.current = true;
    const current = context.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const action = pending.current!.action;
      await callService("outboxCommand", pending.current!);
      if (current !== context.current) return;
      pending.current = null;
      setUncertain(false);
      setNotice(
        action === "resolveUnknown"
          ? "Đã lưu đối soát, chưa gửi lại email."
          : "Đã xếp lịch thử lại email.",
      );
      await load();
    } catch (cause) {
      if (current !== context.current) return;
      const unknown = !outboxRejection(cause);
      if (!unknown) pending.current = null;
      setUncertain(unknown);
      setError(
        unknown
          ? "Chưa xác nhận được kết quả. Thử lại đúng thao tác đang chờ."
          : "Thao tác chưa được chấp nhận. Tải lại bản ghi trước khi thử lại.",
      );
    } finally {
      if (current === context.current) {
        mutating.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section className="admin096">
      <CrmHeading
        title="Nhật ký & thông báo"
        actions={
          <button disabled={busy || uncertain} onClick={() => void load()}>
            <CrmIcon name="refresh" />
            Tải lại
          </button>
        }
      />
      <PageTabs
        id="activity"
        label="Nhóm nhật ký"
        value={kind}
        disabled={busy || uncertain}
        items={[
          { value: "auditEvents", label: "Nhật ký thao tác" },
          { value: "outboxJobs", label: "Thông báo" },
        ]}
        onChange={(value) => {
          if (value === kind || mutating.current || pending.current) return;
          context.current++;
          request.current++;
          setRows([]);
          setNext(null);
          setNotice("");
          setError("");
          setKind(value);
        }}
      />
      <div
        id={`activity-panel-${kind}`}
        role="tabpanel"
        aria-labelledby={`activity-tab-${kind}`}
        tabIndex={0}
      >
        <p className="muted">
          Nhật ký thao tác chỉ đọc. Email chưa rõ kết quả cần quản lý vận hành
          đối soát trước khi xếp lịch lại.
        </p>
        {busy && (
          <CrmState
            kind="loading"
            title={
              mutating.current ? "Đang xử lý thao tác…" : "Đang tải nhật ký…"
            }
          />
        )}
        {notice && <p role="status">{notice}</p>}
        {error && <CrmState kind="error" title={error} />}
        {uncertain && (
          <button disabled={busy} onClick={() => void retry()}>
            Thử lại thao tác đang chờ
          </button>
        )}
        <div className="tableWrap crmRecordTable crmActivityTable">
          <table role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">
                  Thời gian
                </th>
                <th scope="col" role="columnheader">
                  Thao tác
                </th>
                <th scope="col" role="columnheader">
                  {kind === "auditEvents" ? "Đối tượng" : "Kết quả"}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((r) => (
                <tr key={r.id} role="row">
                  <td role="cell" data-label="Thời gian">
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td role="cell" data-label="Thao tác">
                    {activityLabel(r.action, "action")}
                  </td>
                  <td
                    role="cell"
                    data-label={
                      kind === "auditEvents" ? "Đối tượng" : "Kết quả"
                    }
                  >
                    {kind === "auditEvents" ? (
                      <CrmReference
                        label="Mã đối tượng"
                        value={r.resourceId ?? "Chưa xác định"}
                      />
                    ) : (
                      <>
                        <div>{activityLabel(r.state ?? "", "state")}</div>
                        <p className="muted">
                          {r.emailState
                            ? activityLabel(r.emailState, "state")
                            : "Chưa xác định email"}
                        </p>
                        <CrmReference label="Mã thông báo" value={r.id} />
                        {["failed", "blocked_external"].includes(
                          r.emailState ?? "",
                        ) && (
                          <div className="crmActions">
                            <button
                              disabled={busy || uncertain}
                              onClick={() => void retry(r)}
                            >
                              Xếp lịch thử lại
                            </button>
                          </div>
                        )}
                        {r.emailState === "unknown" && (
                          <details className="crmItemDetails">
                            <summary>Ghi nhận đối soát</summary>
                            <p>
                              Đối chiếu với nhà cung cấp trước. Không xác nhận
                              theo suy đoán; gửi lại khi chưa rõ có thể gửi
                              trùng.
                            </p>
                            <form
                              className="form"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const f = new FormData(e.currentTarget);
                                void retry(
                                  r,
                                  String(f.get("outcome")),
                                  String(f.get("evidence")),
                                );
                              }}
                            >
                              <fieldset
                                className="form"
                                disabled={busy || uncertain}
                              >
                                <label>
                                  <span className="formLabelText">
                                    Kết quả{" "}
                                    <span
                                      className="requiredMark"
                                      aria-hidden="true"
                                    >
                                      *
                                    </span>
                                  </span>
                                  <select name="outcome" required>
                                    <option value="">Chọn kết quả</option>
                                    <option value="confirmed_sent">
                                      Nhà cung cấp xác nhận đã nhận email
                                    </option>
                                    <option value="confirmed_not_sent">
                                      Nhà cung cấp xác nhận chưa nhận email
                                    </option>
                                  </select>
                                </label>
                                <label>
                                  <span className="formLabelText">
                                    Bằng chứng đối soát{" "}
                                    <span
                                      className="requiredMark"
                                      aria-hidden="true"
                                    >
                                      *
                                    </span>
                                  </span>
                                  <input
                                    name="evidence"
                                    minLength={5}
                                    maxLength={500}
                                    required
                                  />
                                </label>
                                <button disabled={busy || uncertain}>
                                  Lưu đối soát, chưa gửi lại
                                </button>
                              </fieldset>
                            </form>
                          </details>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!busy && !error && !rows.length && (
          <p>Chưa có bản ghi trong trang này.</p>
        )}
        {next && (
          <button disabled={busy || uncertain} onClick={() => void load(next)}>
            Trang tiếp theo
          </button>
        )}
      </div>
      <div
        id={`activity-panel-${kind === "auditEvents" ? "outboxJobs" : "auditEvents"}`}
        role="tabpanel"
        aria-labelledby={`activity-tab-${kind === "auditEvents" ? "outboxJobs" : "auditEvents"}`}
        hidden
      />
    </section>
  );
}
