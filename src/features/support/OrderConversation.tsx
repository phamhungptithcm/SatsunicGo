import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { callService } from "../../shared/firebase";
import {
  conversationDrafts,
  type OrderConversationData,
} from "../../../packages/domain/order-conversation";
import "./OrderConversation.css";

type Mutation = {
  action: "message" | "note" | "assign";
  orderId: string;
  operationId: string;
  expectedVersion: number;
  text?: string;
  assigneeId?: string;
};

export function OrderConversation({
  orderId,
  staff = false,
}: {
  orderId: string;
  staff?: boolean;
}) {
  const labelId = useId();
  const [open, setOpen] = useState(false),
    [data, setData] = useState<OrderConversationData | null>(null);
  const [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [readError, setReadError] = useState("");
  const [text, setText] = useState(""),
    [note, setNote] = useState(""),
    [assigneeId, setAssigneeId] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const generation = useRef(0),
    reading = useRef(false),
    writing = useRef(false);
  const pending = useRef<Mutation | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(async () => {
    if (reading.current || writing.current) return;
    const revision = generation.current;
    reading.current = true;
    setLoading(true);
    try {
      const result = await callService<OrderConversationData>(
        "readOrderConversation",
        { orderId },
      );
      if (generation.current === revision) {
        setData(result);
        setReadError("");
      }
    } catch {
      if (generation.current === revision) {
        // Revoke displayed private data on failed authorization/network checks.
        setData(null);
        setReadError(
          "Chưa tải được cuộc trao đổi. Kiểm tra kết nối và quyền truy cập, rồi tải lại.",
        );
      }
    } finally {
      if (generation.current === revision) {
        reading.current = false;
        setLoading(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    generation.current++;
    reading.current = false;
    if (!open) return;
    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    const visible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      generation.current++;
      reading.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [open, load]);

  async function send(
    action: Mutation["action"],
    retry = false,
    targetId?: string,
  ) {
    if (writing.current || reading.current || !data || (uncertain && !retry))
      return;
    const payload = pending.current ?? {
      action,
      orderId,
      expectedVersion: data.version,
      operationId: crypto.randomUUID(),
      ...(action === "assign"
        ? { assigneeId: targetId ?? assigneeId }
        : { text: (action === "note" ? note : text).trim() }),
    };
    pending.current = payload;
    writing.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await callService("orderConversationCommand", payload);
      if (!mounted.current) return;
      pending.current = null;
      setUncertain(false);
      if (payload.action === "message") setText("");
      if (payload.action === "note") setNote("");
      setNotice(
        payload.action === "message"
          ? "Đã lưu tin nhắn trong cuộc trao đổi trên SatsunicGo."
          : payload.action === "note"
            ? "Đã lưu ghi chú nội bộ."
            : "Đã cập nhật người phụ trách.",
      );
    } catch (e) {
      if (!mounted.current) return;
      const code = (e as { code?: string }).code;
      const ambiguous =
        !code ||
        [
          "functions/internal",
          "functions/unknown",
          "functions/unavailable",
          "functions/deadline-exceeded",
        ].includes(code);
      setUncertain(ambiguous);
      if (!ambiguous) pending.current = null;
      setError(
        ambiguous
          ? "Chưa rõ kết quả. Thử lại đúng thao tác này để tránh gửi trùng."
          : "Chưa hoàn tất thao tác. Nội dung vẫn được giữ; tải lại cuộc trao đổi và kiểm tra người phụ trách trước khi thử lại.",
      );
    } finally {
      if (mounted.current) {
        // Refresh data without replacing a failed-send message with a successful-read state.
        const failed = pending.current !== null;
        if (!failed) {
          const result = await callService<OrderConversationData>(
            "readOrderConversation",
            { orderId },
          ).catch(() => null);
          if (mounted.current) {
            if (result) setData(result);
            else {
              setData(null);
              setError(
                "Thao tác đã phản hồi nhưng chưa tải được cuộc trao đổi. Tải lại để kiểm tra.",
              );
            }
          }
        }
      }
      writing.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function submit(event: FormEvent, action: Mutation["action"]) {
    event.preventDefault();
    void send(action);
  }
  const locked = busy || loading || uncertain || !data;
  const staffView = staff && data?.staff;
  return (
    <details
      className="orderConversation"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>{staff ? "Trao đổi với khách" : "Trao đổi về đơn này"}</summary>
      {open && (
        <div className="conversationBody">
          <div className="conversationHeading">
            <span className="statusTag">SatsunicGo</span>
            <button
              type="button"
              disabled={busy || loading}
              onClick={() => void load()}
            >
              Tải lại trao đổi
            </button>
          </div>
          <p className="muted">
            Tin nhắn được lưu tại đây. Cuộc trao đổi tự cập nhật mỗi 15 giây khi
            đang mở.
          </p>
          <p className="conversationChannels">
            Zalo · Chưa kết nối &nbsp; Messenger · Chưa kết nối
          </p>
          {loading && <p role="status">Đang tải cuộc trao đổi…</p>}
          {data && (
            <>
              {staffView && (
                <div className="conversationAssignment">
                  <button
                    type="button"
                    disabled={
                      locked || data.assignee?.id === data.currentStaffId
                    }
                    onClick={() =>
                      void send("assign", false, data.currentStaffId!)
                    }
                  >
                    Nhận phụ trách
                  </button>
                  <p>
                    Người phụ trách:{" "}
                    {data.assignee
                      ? `${data.assignee.name}${data.assignee.available ? "" : " · Hiện không thể nhận việc"}`
                      : "Chưa có người nhận"}
                  </p>
                  <form onSubmit={(e) => submit(e, "assign")}>
                    <div>
                      <label htmlFor={`${labelId}-assignee`}>
                        Nhận hoặc chuyển người phụ trách
                      </label>
                      <select
                        id={`${labelId}-assignee`}
                        value={assigneeId}
                        disabled={locked}
                        onChange={(e) => setAssigneeId(e.target.value)}
                      >
                        <option value="">Chọn nhân viên</option>
                        {data.staffChoices.map((s) => (
                          <option value={s.id} key={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" disabled={locked || !assigneeId}>
                      Lưu người phụ trách
                    </button>
                  </form>
                  {data.staffChoicesTruncated && (
                    <p>Danh sách nhân viên đang hiển thị một phần.</p>
                  )}
                </div>
              )}
              {data.hasEarlierMessages && (
                <p>Đang hiển thị 50 tin nhắn gần nhất.</p>
              )}
              <div
                className="conversationMessages"
                role="log"
                aria-live="polite"
                aria-label="Tin nhắn về đơn hàng"
              >
                {!data.messages.length && (
                  <p>Chưa có tin nhắn. Bạn có thể bắt đầu trao đổi tại đây.</p>
                )}
                {data.messages.map((m) => (
                  <article
                    key={m.id}
                    className={`conversationMessage ${m.fromCustomer ? "fromCustomer" : "fromStaff"}`}
                  >
                    <strong>
                      {m.fromCustomer ? "Khách hàng" : "Nhân viên SatsunicGo"}
                    </strong>
                    <p>{m.text}</p>
                    <time dateTime={new Date(m.createdAt).toISOString()}>
                      {new Date(m.createdAt).toLocaleString("vi-VN")}
                    </time>
                  </article>
                ))}
              </div>
            </>
          )}
          <form className="form" onSubmit={(e) => submit(e, "message")}>
            {staffView && (
              <div className="conversationDrafts" aria-label="Gợi ý soạn tin">
                {conversationDrafts.map((d) => (
                  <button
                    type="button"
                    key={d.label}
                    disabled={locked || !!text}
                    onClick={() => setText(d.text)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            <label htmlFor={labelId}>
              {staff ? "Tin nhắn cho khách" : "Tin nhắn cho SatsunicGo"}
            </label>
            <textarea
              id={labelId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={4000}
              required
              disabled={busy || uncertain}
            />
            <button
              type="submit"
              className="primary"
              disabled={locked || !text.trim()}
            >
              {busy ? "Đang lưu…" : "Gửi trên SatsunicGo"}
            </button>
          </form>
          {staffView && (
            <details className="conversationNotes">
              <summary>Ghi chú nội bộ · khách không thấy</summary>
              {data.hasEarlierNotes && (
                <p>Đang hiển thị 50 ghi chú gần nhất.</p>
              )}
              {!data.notes.length && <p>Chưa có ghi chú nội bộ.</p>}
              {data.notes.map((n) => (
                <article className="conversationMessage" key={n.id}>
                  <p>{n.text}</p>
                  <time>{new Date(n.createdAt).toLocaleString("vi-VN")}</time>
                </article>
              ))}
              <form className="form" onSubmit={(e) => submit(e, "note")}>
                <label>
                  Ghi chú bàn giao
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={4000}
                    required
                    disabled={busy || uncertain}
                  />
                </label>
                <button type="submit" disabled={locked || !note.trim()}>
                  Lưu ghi chú nội bộ
                </button>
              </form>
            </details>
          )}
          {notice && <p role="status">{notice}</p>}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {readError && (
            <p role="alert" className="error">
              {readError}
            </p>
          )}
          {uncertain && (
            <button
              type="button"
              disabled={busy || loading || !data}
              onClick={() => void send(pending.current!.action, true)}
            >
              Thử lại thao tác chưa rõ kết quả
            </button>
          )}
        </div>
      )}
    </details>
  );
}
