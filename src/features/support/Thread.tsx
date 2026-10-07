import "../crm/customer-workspace095.css";
import { LoadingState } from "../../shared/Loading";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { callService, db } from "../../shared/firebase";
import { doc, getDocFromServer } from "firebase/firestore";
import { createRequestSequence } from "../content/editor-state";
import { CrmHeading, CrmIcon, CrmState } from "../crm/CrmPresentation";
type Message = {
  id: string;
  text: string;
  createdAt: number;
  fromCustomer: boolean;
};
export function supportRejection(cause: unknown) {
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
export function supportReply(
  form: FormData,
  ticket: { id: string; version: number },
  operationId: string,
) {
  return {
    action: "replyTicket",
    id: ticket.id,
    expectedVersion: ticket.version,
    operationId,
    payload: {
      message: String(form.get("message") ?? ""),
      status: form.get("resolved") === "on" ? "resolved" : "open",
    },
  };
}
export function supportTicketVersion(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value >= Number.MAX_SAFE_INTEGER
  )
    throw new Error("Ticket version unavailable");
  return value;
}
export function Thread({
  ticket,
  onChanged,
  onBusyChange,
  staff = false,
}: {
  ticket: { id: string; version: number; status: string };
  onChanged?: () => void;
  onBusyChange?: (busy: boolean) => void;
  staff?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [readError, setReadError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [mustReload, setMustReload] = useState(false);
  const version = useRef(ticket.version);
  const request = useRef(0);
  const mutations = useRef(createRequestSequence());
  const submitting = useRef(false);
  const pending = useRef<ReturnType<typeof supportReply> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const callback = useRef(onBusyChange);
  callback.current = onBusyChange;
  async function load(refreshVersion = false) {
    const current = ++request.current;
    setLoading(true);
    setReadError("");
    try {
      let latest = version.current;
      if (refreshVersion) {
        if (staff) {
          const result = await callService<{
            rows: { id: string; version: unknown }[];
          }>("listWork", { kind: "supportTickets", id: ticket.id });
          latest = supportTicketVersion(
            result.rows.find((row) => row.id === ticket.id)?.version,
          );
        } else {
          if (!db) throw new Error("Ticket unavailable");
          const result = await getDocFromServer(
            doc(db, "supportTickets", ticket.id),
          );
          latest = supportTicketVersion(
            result.exists() ? result.data().version : undefined,
          );
        }
      }
      if (current !== request.current) return;
      const r = await callService<{ messages: Message[] }>("ticketMessages", {
        id: ticket.id,
      });
      if (current === request.current) {
        setMessages(r.messages);
        if (refreshVersion) {
          version.current = latest;
          setMustReload(false);
          setError("");
        }
      }
    } catch {
      if (current === request.current) {
        setMessages([]);
        setReadError("Chưa tải được phản hồi. Bạn có thể thử tải lại.");
      }
    } finally {
      if (current === request.current) setLoading(false);
    }
  }
  useEffect(() => {
    mutations.current.invalidate();
    submitting.current = false;
    pending.current = null;
    setBusy(false);
    setUncertain(false);
    setMustReload(false);
    version.current = ticket.version;
    setMessages([]);
    setError("");
    setReadError("");
    setNotice("");
    callback.current?.(false);
    return () => {
      request.current++;
      mutations.current.invalidate();
      callback.current?.(false);
    };
  }, [ticket.id]);
  useEffect(() => {
    version.current = ticket.version;
    void load();
    return () => {
      request.current++;
    };
  }, [ticket.id, ticket.version]);
  async function send(form?: HTMLFormElement) {
    if (submitting.current) return;
    if (!pending.current && (!form || mustReload)) return;
    submitting.current = true;
    const revision = mutations.current.next();
    if (!pending.current && form)
      pending.current = supportReply(
        new FormData(form),
        { id: ticket.id, version: version.current },
        crypto.randomUUID(),
      );
    setBusy(true);
    setError("");
    setNotice("");
    callback.current?.(true);
    let unresolved = false;
    try {
      await callService("workspaceCommand", pending.current!);
      if (!mutations.current.current(revision)) return;
      pending.current = null;
      setUncertain(false);
      formRef.current?.reset();
      setNotice("Đã gửi phản hồi.");
      await load();
      if (mutations.current.current(revision)) {
        callback.current?.(false);
        onChanged?.();
      }
    } catch (cause) {
      if (!mutations.current.current(revision)) return;
      unresolved = !supportRejection(cause);
      if (!unresolved) {
        pending.current = null;
        setMustReload(true);
      }
      setUncertain(unresolved);
      setError(
        unresolved
          ? "Chưa xác nhận được kết quả gửi. Thử lại để kiểm tra đúng phản hồi đang chờ."
          : "Phản hồi chưa được chấp nhận. Tải lại hội thoại trước khi gửi lại.",
      );
    } finally {
      if (mutations.current.current(revision)) {
        submitting.current = false;
        setBusy(false);
        callback.current?.(unresolved);
      }
    }
  }
  function reply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(e.currentTarget);
  }
  return (
    <div className="customerWorkspace095-thread">
      {loading && (
        <LoadingState overlay={false}>Đang tải phản hồi…</LoadingState>
      )}
      {!loading && !readError && !messages.length && (
        <p className="muted">Chưa có phản hồi.</p>
      )}
      {messages.map((m) => (
        <div
          className="panel crmMessage"
          data-sender={m.fromCustomer ? "customer" : "staff"}
          key={m.id}
        >
          <strong>{m.fromCustomer ? "Khách hàng" : "Nhân viên hỗ trợ"}</strong>
          <p>{m.text}</p>
          <time>{new Date(m.createdAt).toLocaleString("vi-VN")}</time>
        </div>
      ))}
      {notice && <p role="status">{notice}</p>}
      <form ref={formRef} key={ticket.id} className="form" onSubmit={reply}>
        <fieldset className="form" disabled={busy || uncertain || mustReload}>
          <label>
            <span className="formLabelText">
              Phản hồi{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <textarea name="message" minLength={3} maxLength={4000} required />
          </label>
          <label className="customerWorkspace095-resolved">
            <input type="checkbox" name="resolved" /> Đánh dấu đã giải quyết
          </label>
          <button disabled={busy || uncertain || mustReload}>
            {busy ? "Đang gửi…" : "Gửi phản hồi"}
          </button>
        </fieldset>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {readError && (
        <p className="error" role="alert">
          {readError}
        </p>
      )}
      {uncertain ? (
        <button disabled={busy} onClick={() => void send()}>
          Thử lại phản hồi đang chờ
        </button>
      ) : (
        (readError || error) && (
          <button disabled={busy || loading} onClick={() => void load(true)}>
            Tải lại phản hồi
          </button>
        )
      )}
    </div>
  );
}
function StaffTicket({
  ticket,
  onChanged,
  onBusyChange,
  initiallyOpen,
}: {
  ticket: {
    id: string;
    subject: string;
    message: string;
    version: number;
    status: string;
  };
  onChanged: () => void;
  onBusyChange: (busy: boolean) => void;
  initiallyOpen: boolean;
}) {
  const [visited, setVisited] = useState(initiallyOpen);
  const [pendingReply, setPendingReply] = useState(false);
  return (
    <details
      className="panel crmTicket"
      open={initiallyOpen}
      onToggle={(event) => {
        if (event.currentTarget.open) setVisited(true);
      }}
    >
      <summary>
        <span className="crmItemTitle">
          <CrmIcon name="message" />
          {ticket.subject}
        </span>
        <span className="crmBadge">
          {pendingReply
            ? "Phản hồi chờ xác nhận"
            : ticket.status === "resolved"
              ? "Đã giải quyết"
              : ticket.status === "open"
                ? "Đang mở"
                : "Cần kiểm tra trạng thái"}
        </span>
      </summary>
      <p>{ticket.message}</p>
      {visited && (
        <Thread
          ticket={ticket}
          staff
          onChanged={onChanged}
          onBusyChange={(busy) => {
            setPendingReply(busy);
            onBusyChange(busy);
          }}
        />
      )}
    </details>
  );
}
export function StaffSupport() {
  const [params] = useSearchParams();
  const target = params.get("ticket");
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<
      {
        id: string;
        subject: string;
        message: string;
        version: number;
        status: string;
      }[]
    >([]),
    [error, setError] = useState("");
  const listRequest = useRef(0);
  const locks = useRef(new Set<string>());
  const [locked, setLocked] = useState(false);
  function lock(id: string, busy: boolean) {
    if (busy) locks.current.add(id);
    else locks.current.delete(id);
    setLocked(locks.current.size > 0);
  }
  async function load(after?: string) {
    if (locks.current.size) return;
    const current = ++listRequest.current;
    setLoading(true);
    setError("");
    setTickets([]);
    setNext(null);
    try {
      const r = await callService<{
        rows: typeof tickets;
        next: string | null;
      }>("listWork", {
        kind: "supportTickets",
        ...(target ? { id: target } : {}),
        ...(after ? { after } : {}),
      });
      if (current !== listRequest.current) return;
      setTickets(r.rows);
      setNext(r.next);
    } catch {
      if (current !== listRequest.current) return;
      setTickets([]);
      setError("Chưa tải được hàng đợi hỗ trợ.");
    } finally {
      if (current === listRequest.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      listRequest.current++;
    };
  }, [target]);
  return (
    <section
      className="customerWorkspace095 customerWorkspace095--support"
      aria-label="Hội thoại hỗ trợ"
    >
      <CrmHeading
        title="Hội thoại hỗ trợ"
        description="Mở hội thoại để xem nội dung, phản hồi và cập nhật trạng thái giải quyết."
        actions={
          <>
            {target && <Link to="/crm/support">← Tất cả hội thoại</Link>}
            <button disabled={loading || locked} onClick={() => void load()}>
              <CrmIcon name="refresh" />
              Tải lại hội thoại
            </button>
          </>
        }
      />
      <div
        className="customerWorkspace095-surface customerWorkspace095-supportList"
        aria-busy={loading}
      >
        <div className="customerWorkspace095-resultHeading">
          <h2>{target ? "Hội thoại được chọn" : "Danh sách hội thoại"}</h2>
          {!loading && !error && (
            <span>{tickets.length} hội thoại trong trang</span>
          )}
        </div>
        {loading && <CrmState kind="loading" title="Đang tải hội thoại…" />}
        {tickets.map((t) => (
          <StaffTicket
            key={t.id}
            ticket={t}
            initiallyOpen={!!target}
            onChanged={() => void load()}
            onBusyChange={(busy) => lock(t.id, busy)}
          />
        ))}
        {!loading && !error && !tickets.length && (
          <CrmState
            kind="empty"
            title={
              target
                ? "Chưa tìm thấy hội thoại được chọn"
                : "Chưa có hội thoại trong trang hiện tại"
            }
          >
            {target
              ? "Thử tải lại hoặc quay về danh sách hội thoại."
              : "Bạn có thể tải lại để kiểm tra hội thoại mới."}
          </CrmState>
        )}
        {next && (
          <div className="crmPagination">
            <span>Đang xem một phần danh sách hội thoại</span>
            <button
              disabled={loading || locked}
              onClick={() => void load(next)}
            >
              Trang tiếp theo
            </button>
          </div>
        )}
        {error && (
          <CrmState
            kind="error"
            title={error}
            action={
              <button disabled={loading || locked} onClick={() => void load()}>
                <CrmIcon name="refresh" />
                Thử tải lại
              </button>
            }
          />
        )}
      </div>
    </section>
  );
}
