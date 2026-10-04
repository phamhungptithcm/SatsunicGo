import { useEffect, useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
type Message = {
  id: string;
  text: string;
  createdAt: number;
  fromCustomer: boolean;
};
export function Thread({
  ticket,
  onChanged,
}: {
  ticket: { id: string; version: number; status: string };
  onChanged?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const r = await callService<{ messages: Message[] }>("ticketMessages", {
        id: ticket.id,
      });
      setMessages(r.messages);
    } catch {
      setError("Chưa tải được phản hồi.");
    }
  }
  useEffect(() => {
    setMessages([]);
    setError("");
    void load();
  }, [ticket.id, ticket.version]);
  async function reply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget,
      f = new FormData(form);
    try {
      await callService("workspaceCommand", {
        action: "replyTicket",
        id: ticket.id,
        expectedVersion: ticket.version,
        operationId: crypto.randomUUID(),
        payload: {
          message: String(f.get("message")),
          status: f.get("resolved") === "on" ? "resolved" : "open",
        },
      });
      form.reset();
      await load();
      onChanged?.();
    } catch {
      setError(
        "Chưa gửi được. Tải lại hội thoại để kiểm tra phiên bản rồi thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {messages.map((m) => (
        <div className="panel" key={m.id}>
          <strong>{m.fromCustomer ? "Khách hàng" : "Nhân viên hỗ trợ"}</strong>
          <p>{m.text}</p>
          <time>{new Date(m.createdAt).toLocaleString("vi-VN")}</time>
        </div>
      ))}
      <form className="form" onSubmit={(e) => void reply(e)}>
        <label>
          Phản hồi
          <textarea name="message" minLength={3} maxLength={4000} required />
        </label>
        <label>
          <input type="checkbox" name="resolved" /> Đánh dấu đã giải quyết
        </label>
        <button disabled={busy}>{busy ? "Đang gửi…" : "Gửi phản hồi"}</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function StaffSupport() {
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
  async function load() {
    try {
      const r = await callService<{ rows: typeof tickets }>("listWork", {
        kind: "supportTickets",
      });
      setTickets(r.rows);
    } catch {
      setError("Chưa tải được hàng đợi hỗ trợ.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <section>
      <h2>Hội thoại hỗ trợ</h2>
      <button onClick={() => void load()}>Tải lại hội thoại</button>
      {tickets.map((t) => (
        <details className="panel" key={t.id}>
          <summary>
            {t.subject} ·{" "}
            {t.status === "resolved" ? "Đã giải quyết" : "Đang mở"}
          </summary>
          <p>{t.message}</p>
          <Thread ticket={t} onChanged={() => void load()} />
        </details>
      ))}
      {!tickets.length && <p>Chưa có hội thoại trong trang hiện tại.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
