import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import type { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  documentId,
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
  const defaultTopic = ["data-export", "data-deletion"].includes(topic ?? "")
    ? topic!
    : "purchase";
  const [selectedTopic, setSelectedTopic] = useState(defaultTopic);
  useEffect(() => {
    setSelectedTopic(defaultTopic);
  }, [defaultTopic]);
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
        orderBy("createdAt", "desc"),
        orderBy(documentId(), "desc"),
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
      setSelectedTopic(defaultTopic);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page supportPage">
      <div className="supportIntro">
        <span className="editorialEyebrow">Hỗ trợ · SatsunicGo</span>
        <h1>
          Bạn cần
          <br />
          <span>hỗ trợ gì?</span>
        </h1>
        <p>
          Gửi câu hỏi về mua hộ hoặc đơn của bạn. Xem và trao đổi phản hồi ngay
          tại đây.
        </p>
        <div className="supportGuide">
          <span className="supportGuideIcon" aria-hidden="true">
            ↗
          </span>
          <div>
            <h2>Thêm một chút thông tin</h2>
            <p>
              Nếu câu hỏi liên quan đến đơn hàng, bạn có thể ghi kèm mã đơn để
              nhân viên dễ kiểm tra.
            </p>
          </div>
        </div>
        <p className="supportHours">
          Giờ nhân viên trực đang chờ đơn vị vận hành xác nhận.
        </p>
        {tickets.length > 0 && (
          <h2 className="supportTicketsHeading">Yêu cầu gần đây</h2>
        )}
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
      <form
        className="form panel supportForm"
        onSubmit={(e) => void submit(e)}
        aria-labelledby="support-form-title"
        aria-busy={busy}
      >
        <div className="supportFormHeading">
          <h2 id="support-form-title">Gửi yêu cầu hỗ trợ</h2>
          <p>Mô tả điều bạn cần giúp trong biểu mẫu dưới đây.</p>
        </div>
        <label>
          Loại yêu cầu
          <select
            name="topic"
            value={selectedTopic}
            onChange={(event) => setSelectedTopic(event.target.value)}
            aria-describedby={
              selectedTopic !== "purchase" ? "support-data-note" : undefined
            }
          >
            <option value="purchase">Hỗ trợ mua hộ</option>
            <option value="data-export">Yêu cầu xuất dữ liệu cá nhân</option>
            <option value="data-deletion">Yêu cầu xóa dữ liệu cá nhân</option>
          </select>
        </label>
        {selectedTopic !== "purchase" && (
          <p className="supportDataNote" id="support-data-note">
            Nhân viên sẽ kiểm tra danh tính và phạm vi xử lý. Gửi yêu cầu không
            có nghĩa là dữ liệu đã được xuất hoặc xóa; chứng từ có thể cần lưu
            theo chính sách được duyệt.
          </p>
        )}
        <label>
          <span className="formLabelText">
            Chủ đề{" "}
            <span className="requiredMark" aria-hidden="true">
              *
            </span>
          </span>
          <input
            name="subject"
            placeholder={
              selectedTopic === "purchase"
                ? "Ví dụ: Cần kiểm tra thông tin món hàng"
                : "Ví dụ: Yêu cầu về dữ liệu cá nhân"
            }
            required
            minLength={3}
            maxLength={160}
          />
        </label>
        <label>
          <span className="formLabelText">
            Nội dung{" "}
            <span className="requiredMark" aria-hidden="true">
              *
            </span>
          </span>
          <textarea
            name="message"
            placeholder={
              selectedTopic === "purchase"
                ? "Mô tả câu hỏi của bạn, kèm link món hàng hoặc mã đơn nếu có…"
                : "Mô tả dữ liệu bạn cần xuất hoặc xóa…"
            }
            required
            minLength={3}
            maxLength={4000}
          />
        </label>
        {!user && (
          <p className="notice supportSignIn">
            Đăng nhập để gửi và xem phản hồi riêng của bạn.
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary" disabled={!configured || !user || busy}>
          {busy ? "Đang gửi…" : "Gửi yêu cầu hỗ trợ"}
        </button>
      </form>
    </section>
  );
}
