import { LoadingState } from "../../shared/Loading";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { callService, db } from "../../shared/firebase";
import styles from "./Ask.module.css";
export function InlineSupport({
  uid,
  orderId,
  conversationId,
  beforeSend,
  disabled = false,
  hasOrder = false,
  vi,
}: {
  uid?: string;
  orderId?: string;
  conversationId?: string;
  beforeSend?: () => Promise<boolean>;
  disabled?: boolean;
  hasOrder?: boolean;
  vi: boolean;
}) {
  const [open, setOpen] = useState(false),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [readAttempt, setReadAttempt] = useState(0),
    [ticket, setTicket] = useState<{
      id: string;
      version: number;
      message: string;
      status: string;
    } | null>(null),
    [messages, setMessages] = useState<
      { id: string; text: string; fromCustomer: boolean }[]
    >([]);
  const subject = orderId
    ? `Ask · ${orderId}`
    : `Ask · hội thoại ${conversationId}`;
  const storageKey =
    !orderId && uid && conversationId
      ? `ask-support-pending:${uid}:${conversationId}`
      : null;
  const scope = useRef("");
  scope.current = `${uid}:${subject}`;
  const sending = useRef(false);
  const language = useRef(vi);
  language.current = vi;
  const pending = useRef<{
    scope: string;
    data: unknown;
    digest?: string;
  } | null>(null);
  useEffect(() => {
    setTicket(null);
    setMessages([]);
    setReady(false);
    setError("");
    setNotice("");
    setBusy(false);
    sending.current = false;
    pending.current = null;
    if (!db || !uid || (!orderId && !conversationId)) return;
    const owner = scope.current;
    return onSnapshot(
      query(
        collection(db, "supportTickets"),
        where("ownerId", "==", uid),
        where("subject", "==", subject),
        limit(1),
      ),
      (snap) => {
        if (scope.current !== owner) return;
        const d = snap.docs.find((d) => d.data().subject === subject);
        if (d && storageKey && !sending.current) {
          try {
            const raw = sessionStorage.getItem(storageKey);
            if (raw && JSON.parse(raw).action === "openTicket")
              sessionStorage.removeItem(storageKey);
          } catch {
            setError(
              language.current
                ? "Chưa đọc được thao tác hỗ trợ. Thử lại."
                : "Could not read the support action. Retry.",
            );
            setReady(false);
            return;
          }
        }
        setReady(true);
        setTicket(
          d
            ? ({ id: d.id, ...d.data() } as {
                id: string;
                version: number;
                message: string;
                status: string;
              })
            : null,
        );
      },
      () => {
        if (scope.current === owner) {
          setReady(false);
          setError(
            language.current
              ? "Chưa tải được hỗ trợ. Thử lại."
              : "Support unavailable. Retry.",
          );
        }
      },
    );
  }, [uid, subject, storageKey, readAttempt]);
  useEffect(() => {
    setText("");
    setOpen(false);
  }, [uid, subject]);
  useEffect(() => {
    if (!ticket || !uid) return;
    const owner = scope.current;
    void callService<{
      messages: { id: string; text: string; fromCustomer: boolean }[];
    }>("ticketMessages", { id: ticket.id })
      .then((r) => {
        if (scope.current === owner) setMessages(r.messages);
      })
      .catch(() => {
        if (scope.current === owner)
          setError(
            vi
              ? "Chưa tải được phản hồi. Thử lại."
              : "Replies unavailable. Retry.",
          );
      });
  }, [ticket?.id, ticket?.version, uid, vi]);
  async function submit() {
    if (!uid || !ready || disabled || sending.current || text.trim().length < 3)
      return;
    sending.current = true;
    const owner = scope.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (beforeSend && !(await beforeSend()))
        throw Error("Context unavailable");
      if (scope.current !== owner) return;
      const message = orderId
        ? (vi ? "Đơn mua hộ" : "Buying order") +
          ": " +
          orderId +
          "\n" +
          text.trim()
        : text.trim();
      const previous = pending.current?.data as
        { action?: string; payload?: { message?: string } } | undefined;
      if (
        ticket &&
        previous?.action === "openTicket" &&
        ticket?.message === previous.payload?.message
      ) {
        pending.current = null;
        if (storageKey) sessionStorage.removeItem(storageKey);
        if (message === ticket.message) {
          setText("");
          setNotice(
            vi
              ? "Yêu cầu đã được ghi nhận."
              : "Your request has been recorded.",
          );
          return;
        }
      }
      const digest = storageKey
        ? Array.from(
            new Uint8Array(
              await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(message),
              ),
            ),
            (b) => b.toString(16).padStart(2, "0"),
          ).join("")
        : undefined;
      if (scope.current !== owner) return;
      let saved: {
        operationId: string;
        action: string;
        id?: string;
        expectedVersion?: number;
        digest?: string;
      } | null = null;
      if (storageKey && !pending.current) {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const value = JSON.parse(raw);
          if (
            typeof value.operationId !== "string" ||
            !["openTicket", "replyTicket"].includes(value.action)
          )
            throw Error("Pending support unavailable");
          // A current matching ticket proves the earlier open committed.
          if (value.action === "openTicket" && ticket)
            sessionStorage.removeItem(storageKey);
          else saved = value;
        }
      }
      const expectedDigest = pending.current?.digest ?? saved?.digest;
      if (
        storageKey &&
        ((saved && !saved.digest) ||
          (expectedDigest && expectedDigest !== digest))
      )
        throw Object.assign(new Error("Original message required"), {
          code: "support/original-message-required",
        });
      pending.current ??= {
        scope: owner,
        digest,
        data: {
          action: saved?.action ?? (ticket ? "replyTicket" : "openTicket"),
          operationId: saved?.operationId ?? crypto.randomUUID(),
          ...(saved?.id
            ? { id: saved.id, expectedVersion: saved.expectedVersion }
            : ticket
              ? { id: ticket.id, expectedVersion: ticket.version }
              : {}),
          payload: ticket
            ? { message: text.trim(), status: "open" }
            : {
                subject,
                message: orderId
                  ? `${vi ? "Đơn mua hộ" : "Buying order"}: ${orderId}\n${text.trim()}`
                  : text.trim(),
                topic: "purchase",
              },
        },
      };
      if (storageKey) {
        const { action, operationId, id, expectedVersion } = pending.current
          .data as {
          action: string;
          operationId: string;
          id?: string;
          expectedVersion?: number;
        };
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            action,
            operationId,
            id,
            expectedVersion,
            digest: pending.current.digest,
          }),
        );
      }
      await callService("workspaceCommand", pending.current.data);
      if (scope.current !== owner) return;
      pending.current = null;
      if (storageKey) sessionStorage.removeItem(storageKey);
      setText("");
    } catch (e) {
      if (scope.current !== owner) return;
      const code = (e as { code?: string })?.code;
      if (
        [
          "functions/aborted",
          "functions/permission-denied",
          "functions/invalid-argument",
        ].includes(code ?? "")
      ) {
        pending.current = null;
        if (storageKey) sessionStorage.removeItem(storageKey);
      }
      setError(
        code === "support/original-message-required"
          ? vi
            ? "Nhập lại đúng nội dung đã gửi để đối chiếu thao tác chưa rõ kết quả."
            : "Reenter the original message to reconcile the uncertain action."
          : vi
            ? "Chưa gửi được. Kiểm tra lại và thử lại; yêu cầu cần nhân viên xử lý."
            : "Could not send. Review and retry; staff will handle this request.",
      );
    } finally {
      if (scope.current === owner) {
        sending.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <div className={styles.inlineSupport}>
      <button type="button" onClick={() => setOpen(!open)}>
        {orderId
          ? vi
            ? "Hỗ trợ / đổi trả trong chat"
            : "Support / returns in chat"
          : hasOrder
            ? vi
              ? "Hỗ trợ hội thoại"
              : "Conversation support"
            : vi
              ? "Hỗ trợ trong chat"
              : "Support in chat"}
      </button>
      {open && (
        <>
          <p className={styles.smallPrint}>
            {orderId
              ? vi
                ? "Gửi yêu cầu cho nhân viên. Hoàn tiền hoặc đổi trả cần được kiểm tra theo chính sách."
                : "Send a request to staff. Refunds or returns require policy review."
              : hasOrder
                ? vi
                  ? "Trao đổi chung của hội thoại. Yêu cầu về đơn dùng mục Hỗ trợ / đổi trả trong chat."
                  : "General conversation support. For order requests, use Support / returns in chat."
                : vi
                  ? "Gửi câu hỏi riêng cho nhân viên. Thao tác này không tạo đơn mua hộ."
                  : "Send a private question to staff. This does not create a buying order."}
          </p>
          {!ready && !error && (
            <LoadingState overlay={false}>{vi ? "Đang tải hỗ trợ…" : "Loading support…"}</LoadingState>
          )}
          {!ready && error && (
            <button type="button" onClick={() => setReadAttempt((n) => n + 1)}>
              {vi ? "Tải lại hỗ trợ" : "Reload support"}
            </button>
          )}
          {ticket && (
            <>
              <p role="status">
                {vi
                  ? ticket.status === "resolved"
                    ? "Đã xử lý"
                    : "Đang chờ hỗ trợ"
                  : ticket.status === "resolved"
                    ? "Resolved"
                    : "Awaiting support"}
              </p>
              <p>{ticket.message}</p>
              {messages.map((m) => (
                <p key={m.id}>
                  <strong>
                    {vi
                      ? m.fromCustomer
                        ? "Anh/chị"
                        : "Nhân viên"
                      : m.fromCustomer
                        ? "You"
                        : "Staff"}
                    :{" "}
                  </strong>
                  {m.text}
                </p>
              ))}
            </>
          )}
          <form
            className={styles.inlineForm}
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label>
              {vi ? "Nội dung cần hỗ trợ" : "How can staff help?"}
              <textarea
                value={text}
                disabled={busy || (!!orderId && !!pending.current)}
                minLength={3}
                maxLength={3500}
                required
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <button disabled={busy || !uid || !ready || disabled}>
              {vi ? "Gửi cho nhân viên" : "Send to staff"}
            </button>
          </form>
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
        </>
      )}
    </div>
  );
}
