import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db, callService } from "../../shared/firebase";
import { createRequestSequence } from "../content/editor-state";
import { notificationTarget } from "../content/notification-target";
import { notificationLabels as labels } from "../../../packages/domain/notification-content";
export function Notifications({
  uid,
  expanded = false,
}: {
  uid: string;
  expanded?: boolean;
}) {
  const [rows, setRows] = useState<
      {
        id: string;
        orderId?: string;
        action: string;
        read: boolean;
        createdAt: number;
      }[]
    >([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [reading, setReading] = useState<string | null>(null);
  const requests = useRef(createRequestSequence()),
    mutations = useRef(createRequestSequence());
  useEffect(() => {
    const revision = requests.current.next();
    setRows([]);
    setError("");
    setLoading(true);
    setReading(null);
    mutations.current.invalidate();
    if (!db) {
      setLoading(false);
      setError("Thông báo chưa kết nối được. Thử lại sau.");
      return;
    }
    const unsubscribe = onSnapshot(
      query(
        collection(db, "notifications"),
        where("ownerId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(30),
      ),
      (s) => {
        if (!requests.current.current(revision)) return;
        setError("");
        setLoading(false);
        setRows(
          s.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as (typeof rows)[number],
          ),
        );
      },
      () => {
        if (requests.current.current(revision)) {
          setRows([]);
          setLoading(false);
          setError("Chưa tải được thông báo.");
        }
      },
    );
    return () => {
      requests.current.invalidate();
      mutations.current.invalidate();
      unsubscribe();
    };
  }, [uid, retry]);
  async function read(id: string) {
    if (reading) return;
    const revision = mutations.current.next();
    setReading(id);
    setError("");
    try {
      await callService("readNotification", { id });
    } catch {
      if (mutations.current.current(revision))
        setError("Chưa đánh dấu đã đọc được.");
    } finally {
      if (mutations.current.current(revision)) setReading(null);
    }
  }
  return (
    <details className="panel" open={expanded || undefined}>
      <summary>Thông báo của bạn · 30 thông báo mới nhất</summary>
      {loading && <p role="status">Đang tải thông báo…</p>}
      {rows.map((n) => (
        <article className="order" key={n.id}>
          <p>
            {labels[n.action] ?? "Bạn có cập nhật mới"} ·{" "}
            {new Date(n.createdAt).toLocaleString("vi-VN")}
          </p>
          <Link to={notificationTarget(n.action, n.orderId).path}>
            {notificationTarget(n.action, n.orderId).label}
          </Link>
          {!n.read && (
            <button disabled={!!reading} onClick={() => void read(n.id)}>
              Đánh dấu đã đọc
            </button>
          )}
        </article>
      ))}
      {!loading && !error && !rows.length && (
        <p>Chưa có thông báo được gửi vào hộp thư.</p>
      )}
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setRetry((value) => value + 1)}>
            Tải lại
          </button>
        </p>
      )}
    </details>
  );
}
