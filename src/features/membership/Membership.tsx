import { notify } from "../../shared/feedback";
import { LoadingState } from "../../shared/Loading";
import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, callService } from "../../shared/firebase";
type Plan = {
  id: string;
  name: string;
  price: number;
  periodDays: number;
  serviceDiscountBps: number;
  discountCap: number;
};
type Subscription = {
  planId?: string;
  endsAt: number;
  renewalIntent: boolean;
  planSnapshot: { name: string };
};
type Invoice = {
  id: string;
  amount: number;
  state: string;
  createdAt: number;
  planSnapshot: { name: string };
};
type History = { id: string; action: string; createdAt: number };
const historyLabels: Record<string, string> = {
  confirm: "Đã xác nhận thanh toán",
  activateFree: "Đã kích hoạt gói miễn phí",
  grant: "Đã cấp tặng",
  expired: "Đã hết hạn",
  requestRenewal: "Muốn tiếp tục gia hạn",
  cancelRenewal: "Đã hủy ý định gia hạn",
};
export function Membership({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => Promise<void>;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const inFlight = useRef(false);
  // Keep an operation across uncertain network results; clear after a durable result.
  const attempt = useRef<{ key: string; operationId: string } | null>(null);
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      query(
        collection(db, "membershipPlans"),
        where("status", "==", "published"),
        limit(10),
      ),
      (s) => {
        setPlans(s.docs.map((d) => ({ ...d.data(), id: d.id }) as Plan));
        setLoading(false);
      },
      () => {
        setError("Chưa tải được các gói. Tải lại trang để thử lại.");
        setLoading(false);
      },
    );
  }, []);
  useEffect(() => {
    generation.current++;
    attempt.current = null;
    inFlight.current = false;
    setSubscription(null);
    setInvoices([]);
    setHistory([]);
    setError("");

    setBusy(false);
    if (!db || !user) return;
    const current = generation.current;
    const fail = () => {
      if (current === generation.current) {
        setSubscription(null);
        setInvoices([]);
        setHistory([]);
        setError("Chưa tải được membership của bạn. Tải lại trang để thử lại.");
      }
    };
    const subscriptions = [
      onSnapshot(
        doc(db, "membershipSubscriptions", user.uid),
        (s) => {
          if (current === generation.current)
            setSubscription(s.exists() ? (s.data() as Subscription) : null);
        },
        fail,
      ),
      onSnapshot(
        query(
          collection(db, "membershipInvoices"),
          where("ownerId", "==", user.uid),
          limit(30),
        ),
        (s) => {
          if (current === generation.current)
            setInvoices(
              s.docs
                .map((d) => ({ ...d.data(), id: d.id }) as Invoice)
                .sort((a, b) => b.createdAt - a.createdAt),
            );
        },
        fail,
      ),
      onSnapshot(
        query(
          collection(db, "membershipHistory"),
          where("ownerId", "==", user.uid),
          limit(30),
        ),
        (s) => {
          if (current === generation.current)
            setHistory(
              s.docs
                .map((d) => ({ ...d.data(), id: d.id }) as History)
                .sort((a, b) => b.createdAt - a.createdAt),
            );
        },
        fail,
      ),
    ];
    return () => {
      generation.current++;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [user?.uid]);
  async function command(action: string, payload: Record<string, string> = {}) {
    if (!user || inFlight.current) return;
    const current = generation.current;
    const key = JSON.stringify({ action, ...payload });
    if (attempt.current && attempt.current.key !== key) {
      setError(
        "Thao tác trước chưa rõ kết quả. Thử lại thao tác đó trước khi gửi yêu cầu khác.",
      );
      return;
    }
    attempt.current ??= { key, operationId: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    setError("");

    try {
      const result = await callService<{ state?: "active" | "pending" }>(
        "membershipCommand",
        {
          action,
          ...payload,
          operationId: attempt.current.operationId,
        },
      );
      if (current !== generation.current) return;
      attempt.current = null;
      notify(
        action === "purchase"
          ? result.state === "active"
            ? "Gói miễn phí của bạn đang có hiệu lực. Không cần chuyển khoản."
            : "Đã tạo yêu cầu mua gói. Membership chỉ kích hoạt sau khi xác nhận thanh toán."
          : action === "cancelInvoice"
            ? "Đã hủy yêu cầu mua gói chưa thanh toán."
            : action === "requestRenewal"
              ? "Đã ghi nhận ý định gia hạn. Không tự động thu tiền."
              : "Đã hủy ý định gia hạn. Quyền lợi hiện tại giữ đến hết kỳ.",
        "success",
      );
    } catch (e) {
      if (current !== generation.current) return;
      const code = (e as { code?: string }).code;
      if (
        code &&
        ![
          "functions/unavailable",
          "functions/internal",
          "functions/deadline-exceeded",
          "functions/unknown",
        ].includes(code)
      )
        attempt.current = null;
      setError(
        (e as Error).message ||
          "Chưa rõ kết quả. Thử lại cùng thao tác để tránh tạo trùng.",
      );
    } finally {
      if (current === generation.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section className="page membershipPage">
      <header className="membershipHeading">
        <h1>Chọn gói phù hợp.</h1>
        <p>Quyền lợi rõ ràng cho những lần mua tiếp theo.</p>
      </header>
      {subscription && (
        <div className="notice">
          <strong>{subscription.planSnapshot.name}</strong> ·{" "}
          {subscription.endsAt > Date.now()
            ? "Có hiệu lực đến"
            : "Đã hết hạn ngày"}{" "}
          {new Date(subscription.endsAt).toLocaleDateString("vi-VN")}
          <p>
            {subscription.renewalIntent
              ? "Bạn muốn tiếp tục gia hạn."
              : "Chưa đăng ký ý định gia hạn."}
          </p>
          <button
            disabled={busy}
            className="textbutton"
            onClick={() =>
              void command(
                subscription.renewalIntent ? "cancelRenewal" : "requestRenewal",
              )
            }
          >
            {subscription.renewalIntent
              ? "Hủy ý định gia hạn"
              : "Muốn tiếp tục gia hạn"}
          </button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading && <LoadingState>Đang tải các gói…</LoadingState>}
      <div className="membershipPlans">
        {plans.map((p) => (
          <article
            className="membershipPlan"
            key={p.id}
            data-current={
              (subscription?.planId === p.id &&
                subscription.endsAt > Date.now()) ||
              undefined
            }
          >
            <h2>{p.name}</h2>
            <div className="membershipPrice">
              {p.price.toLocaleString("vi-VN")} ₫{" "}
              <small>/ {p.periodDays} ngày</small>
            </div>
            <ul className="membershipBenefits">
              {p.serviceDiscountBps > 0 && (
                <li>Giảm {p.serviceDiscountBps / 100}% phí mua hộ</li>
              )}
              {p.serviceDiscountBps > 0 && (
                <li>
                  Mức giảm tối đa {p.discountCap.toLocaleString("vi-VN")} ₫
                </li>
              )}
              {p.price === 0 && <li>Không thu phí membership</li>}
              <li>Theo dõi gói trong tài khoản</li>
            </ul>
            {!user ? (
              <button className="primary" onClick={() => void signIn()}>
                Đăng nhập để chọn gói
              </button>
            ) : (
              <button
                className="primary"
                disabled={!user || busy}
                onClick={() => void command("purchase", { planId: p.id })}
              >
                {p.name === "FREE" && p.price === 0
                  ? "Kích hoạt gói miễn phí"
                  : subscription
                    ? "Yêu cầu mua hoặc gia hạn gói"
                    : "Yêu cầu mua gói"}
              </button>
            )}
          </article>
        ))}
      </div>
      {!loading && !plans.length && !error && (
        <div className="empty">
          <h2>Chưa có gói mở bán</h2>
          <p>Giá và quyền lợi đang chờ đơn vị vận hành duyệt.</p>
        </div>
      )}
      <details className="membershipTerms">
        <summary>Điều cần biết</summary>
        <p>
          Giảm phí mua hộ, không giảm giá hàng và thuế. Gói miễn phí kích hoạt
          khi bạn chọn; gói có phí chỉ kích hoạt sau khi xác nhận thanh toán
          hoặc được cấp tặng. Không tự động thu tiền gia hạn.
        </p>
      </details>
      {user && (
        <details
          className="membershipAccount"
          open={invoices.some((invoice) => invoice.state === "pending")}
        >
          <summary>Yêu cầu mua gói và lịch sử</summary>
          <h2>Yêu cầu mua gói của bạn</h2>
          <p>
            Hiển thị tối đa 30 yêu cầu đã tải. Thanh toán membership tách riêng
            với đơn mua hộ. Nếu đã chuyển tiền, liên hệ hỗ trợ trước khi hủy yêu
            cầu.
          </p>
          {invoices.map((invoice) => (
            <article className="panel" key={invoice.id}>
              <h3>{invoice.planSnapshot.name}</h3>
              <p>
                {invoice.amount.toLocaleString("vi-VN")} ₫ ·{" "}
                {invoice.state === "paid"
                  ? "Đã xác nhận thanh toán"
                  : invoice.state === "cancelled"
                    ? "Đã hủy yêu cầu"
                    : "Chờ xác nhận thanh toán"}
              </p>
              <p>Mã yêu cầu: {invoice.id}</p>
              {invoice.state === "pending" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void command("cancelInvoice", { invoiceId: invoice.id })
                  }
                >
                  Hủy yêu cầu chưa thanh toán
                </button>
              )}
            </article>
          ))}
          <h2>Lịch sử membership</h2>
          <p>Hiển thị tối đa 30 sự kiện đã tải.</p>
          {history.map((row) => (
            <p key={row.id}>
              {historyLabels[row.action] ?? "Đã cập nhật membership"} ·{" "}
              {new Date(row.createdAt).toLocaleString("vi-VN")}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}
