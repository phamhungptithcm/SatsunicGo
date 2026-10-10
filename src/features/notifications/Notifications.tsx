import { LoadingState } from "../../shared/Loading";
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
import "./notifications.css";
import { notificationLabels as labels } from "../../../packages/domain/notification-content";
import { TestOrderBadge } from "../orders/TestOrderBadge";
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
        title?: string;
        targetPath?: string;
        targetLabel?: string;
        read: boolean;
        createdAt: number;
        executionMode?: unknown;
        executionPolicyVersion?: unknown;
        testRunId?: unknown;
        testMode?: unknown;
        provider?: unknown;
        paymentProvider?: unknown;
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
  const content = (
    <div className="notificationInbox">
      <header className="notificationInboxHeader">
        <span className="notificationBell" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
        </span>
        <h2>Hộp thư của bạn</h2>
      </header>
      {loading && (
        <div className="notificationState">
          <LoadingState>Đang tải thông báo…</LoadingState>
        </div>
      )}
      {!loading &&
        rows.map((n) => {
          const target = notificationTarget(n.action, n.orderId);
          if (
            typeof n.targetPath === "string" &&
            /^(?:\/account(?:\/orders\/[a-zA-Z0-9_-]{1,128}|\/documents)?|\/support|\/membership)$/.test(
              n.targetPath,
            ) &&
            typeof n.targetLabel === "string" &&
            n.targetLabel.length <= 100
          ) {
            target.path = n.targetPath;
            target.label = n.targetLabel;
          }
          const date = new Date(n.createdAt);
          const validDate = Number.isFinite(date.getTime());
          return (
            <article
              className={`notificationItem ${n.read ? "" : "isUnread"}`}
              key={n.id}
            >
              <span
                className="notificationDot"
                aria-label={n.read ? "Đã đọc" : "Chưa đọc"}
              />
              <div className="notificationItemBody">
                <h3>
                  {typeof n.title === "string" && n.title.length <= 200
                    ? n.title
                    : (labels[n.action] ?? "Bạn có cập nhật mới")}{" "}
                  <TestOrderBadge record={n} />
                </h3>
                <time dateTime={validDate ? date.toISOString() : undefined}>
                  {validDate
                    ? date.toLocaleString("vi-VN")
                    : "Chưa có thời gian"}
                </time>
                <div className="notificationItemActions">
                  <Link to={target.path}>
                    {target.label}
                    <span aria-hidden="true"> ↗</span>
                  </Link>
                  {!n.read && (
                    <button
                      disabled={!!reading}
                      onClick={() => void read(n.id)}
                    >
                      {reading === n.id ? "Đang lưu…" : "Đánh dấu đã đọc"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      {!loading && !error && !rows.length && (
        <div className="notificationState">
          <span className="notificationStateIcon" aria-hidden="true">
            ✓
          </span>
          <h3>Chưa có thông báo</h3>
          <p>Thông báo mới sẽ xuất hiện ở đây.</p>
        </div>
      )}
      {error && (
        <div className="notificationState isError" role="alert">
          <span className="notificationStateIcon" aria-hidden="true">
            !
          </span>
          <h3>
            {rows.length ? "Chưa cập nhật được" : "Chưa tải được thông báo"}
          </h3>
          <p>{rows.length ? error : "Thử lại để xem cập nhật mới."}</p>
          <button
            className="notificationRetry"
            onClick={() => setRetry((v) => v + 1)}
          >
            Thử lại
          </button>
        </div>
      )}
      {!loading && !error && rows.length > 0 && (
        <p className="notificationScope">Tối đa 30 thông báo gần nhất</p>
      )}
    </div>
  );
  return expanded ? (
    <section aria-label="Hộp thư thông báo">{content}</section>
  ) : (
    <details className="notificationDisclosure">
      <summary>Thông báo của bạn</summary>
      {content}
    </details>
  );
}
