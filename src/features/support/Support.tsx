import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import type { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { callService, db, configured } from "../../shared/firebase";
import { Thread } from "./Thread";
type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  version: number;
};
export function Support({ user }: { user: User | null }) {
  const topic = new URLSearchParams(useLocation().search).get("topic");
  const [tickets, setTickets] = useState<Ticket[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setTickets([]);
    if (!user || !db) return;
    return onSnapshot(
      query(
        collection(db, "supportTickets"),
        where("ownerId", "==", user.uid),
        limit(30),
      ),
      (s) =>
        setTickets(s.docs.map((d) => ({ ...d.data(), id: d.id }) as Ticket)),
      () => setError("Chưa tải được hội thoại."),
    );
  }, [user]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    setError("");
    setBusy(true);
    try {
      await callService("workspaceCommand", {
        action: "openTicket",
        operationId: crypto.randomUUID(),
        payload: {
          subject: f.get("subject"),
          message: f.get("message"),
          topic: f.get("topic"),
        },
      });
      form.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page requestPage">
      <div>
        <h1>Điều gì cần làm rõ?</h1>
        <p>
          Gửi câu hỏi về yêu cầu mua hộ hoặc đơn của bạn. Giờ nhân viên trực
          đang chờ đơn vị vận hành xác nhận.
        </p>
        {tickets.map((t) => (
          <article className="panel order" key={t.id}>
            <h2>{t.subject}</h2>
            <p>{t.message}</p>
            <details>
              <summary>Xem và gửi phản hồi</summary>
              <Thread ticket={t} />
            </details>
            <span className="statusTag">
              {t.status === "resolved" ? "Đã xử lý" : "Đang mở"}
            </span>
          </article>
        ))}
      </div>
      <form className="form panel" onSubmit={(e) => void submit(e)}>
        <label>
          Loại yêu cầu
          <select
            name="topic"
            defaultValue={
              ["data-export", "data-deletion"].includes(topic ?? "")
                ? topic!
                : "purchase"
            }
          >
            <option value="purchase">Hỗ trợ mua hộ</option>
            <option value="data-export">Yêu cầu xuất dữ liệu cá nhân</option>
            <option value="data-deletion">Yêu cầu xóa dữ liệu cá nhân</option>
          </select>
        </label>
        <p>
          Yêu cầu dữ liệu sẽ được nhân viên kiểm tra danh tính và phạm vi xử lý.
          Gửi ticket chưa phải xác nhận đã xuất hoặc xóa dữ liệu; chứng từ có
          thể cần lưu theo chính sách được duyệt.
        </p>
        <label>
          Chủ đề
          <input name="subject" required minLength={3} maxLength={160} />
        </label>
        <label>
          Nội dung
          <textarea name="message" required minLength={3} maxLength={4000} />
        </label>
        {!user && (
          <p className="notice">
            Đăng nhập để gửi và xem phản hồi riêng của bạn.
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary" disabled={!configured || !user || busy}>
          {busy ? "Đang gửi…" : "Gửi hỗ trợ"}
        </button>
      </form>
    </section>
  );
}
