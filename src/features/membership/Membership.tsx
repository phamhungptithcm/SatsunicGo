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
import { auth, db, callService } from "../../shared/firebase";
import { z } from "zod";
import { money } from "../../../packages/domain";
import {
  membershipAttemptSchema,
  readMembershipAttempt,
  reserveMembershipAttempt,
  clearMembershipAttempt,
  sameMembershipAttempt,
  admitMembershipResult,
  type MembershipAttempt,
} from "./command-recovery";
type Plan = {
  id: string;
  name: string;
  price: number;
  periodDays: number;
  serviceDiscountBps: number;
  discountCap: number;
};
type Subscription = {
  state: "active" | "expired";
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
const planRead = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
  name: z.string().min(1).max(80),
  price: money,
  periodDays: z.number().int().min(1).max(366),
  serviceDiscountBps: z.number().int().min(0).max(10000),
  discountCap: money,
});
const timestampRead = z.number().int().nonnegative().max(8_640_000_000_000_000);
const subscriptionRead = z.object({
  state: z.enum(["active", "expired"]),
  planId: z.string().optional(),
  endsAt: timestampRead,
  renewalIntent: z.boolean(),
  planSnapshot: z.object({ name: z.string().min(1).max(80) }),
});
const invoiceRead = z.object({
  id: z.string().min(1).max(80),
  amount: money,
  state: z.enum(["pending", "paid", "cancelled"]),
  currency: z.literal("VND").optional(),
  createdAt: timestampRead,
  planSnapshot: z.object({ name: z.string().min(1).max(80) }),
});
const historyRead = z.object({
  id: z.string().min(1).max(80),
  action: z.enum([
    "confirm",
    "activateFree",
    "grant",
    "expired",
    "requestRenewal",
    "cancelRenewal",
  ]),
  createdAt: timestampRead,
});
export function Membership({
  user,
  signIn,
  blocked = false,
  onPendingChange,
}: {
  user: User | null;
  signIn: () => Promise<void>;
  blocked?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [planError, setPlanError] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [privateReady, setPrivateReady] = useState(false);
  const [privateOwner, setPrivateOwner] = useState(user?.uid);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const attempt = useRef<MembershipAttempt | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryBlocked, setRecoveryBlocked] = useState(false);
  const [pendingRevision, setPendingRevision] = useState(0);
  useEffect(() => {
    onPendingChange?.(
      busy ||
        !!attempt.current ||
        recoveryBlocked ||
        (!!user && !recoveryReady),
    );
  }, [
    busy,
    pendingRevision,
    recoveryBlocked,
    recoveryReady,
    user,
    onPendingChange,
  ]);
  useEffect(() => {
    if (!db) {
      setPlanError("Chưa tải được các gói. Tải lại trang để thử lại.");
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
        try {
          setPlans(
            s.docs.map((d) => planRead.parse({ ...d.data(), id: d.id })),
          );
          setPlanError("");
        } catch {
          setPlans([]);
          setPlanError("Thông tin gói chưa hợp lệ. Anh/chị thử lại sau nhé.");
        }
        setLoading(false);
      },
      () => {
        setPlans([]);
        setPlanError("Chưa tải được các gói. Tải lại trang để thử lại.");
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
    setPrivateReady(false);
    setPrivateOwner(user?.uid);
    setRecoveryReady(false);
    setRecoveryBlocked(false);
    if (!db || !user) return;
    const current = generation.current;
    async function restoreAttempt() {
      try {
        const saved = await readMembershipAttempt(user!.uid);
        if (
          current !== generation.current ||
          auth?.currentUser?.uid !== user!.uid
        )
          return;
        // Another tab removing a pointer cannot prove this tab's unknown result.
        // Preserve it until an admitted reply; a manual retry reserves the same ID.
        if (!inFlight.current && (!attempt.current || saved)) {
          attempt.current = saved;
          setPendingRevision((revision) => revision + 1);
        }
        setRecoveryReady(true);
        setRecoveryBlocked(false);
        if (saved)
          setError(
            "Chưa rõ kết quả thao tác trước. Thử lại thao tác đang chờ để kiểm tra.",
          );
      } catch {
        if (
          current !== generation.current ||
          auth?.currentUser?.uid !== user!.uid
        )
          return;
        setRecoveryBlocked(true);
        setRecoveryReady(false);
        setError(
          "Chưa khôi phục được thao tác trước. Liên hệ hỗ trợ trước khi gửi yêu cầu mới.",
        );
      }
    }
    void restoreAttempt();
    const storageChanged = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key.startsWith("satsunicgo.membership-attempt.v1.")
      )
        void restoreAttempt();
    };
    window.addEventListener("storage", storageChanged);
    let failed = false;
    const ready = new Set<string>();
    const observed = (kind: string) => {
      ready.add(kind);
      if (ready.size === 3) setPrivateReady(true);
    };
    const fail = () => {
      if (current === generation.current) {
        failed = true;
        setPrivateReady(false);
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
          if (current === generation.current && !failed) {
            try {
              setSubscription(
                s.exists() ? subscriptionRead.parse(s.data()) : null,
              );
              observed("subscription");
            } catch {
              fail();
            }
          }
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
          if (current === generation.current && !failed) {
            try {
              setInvoices(
                s.docs
                  .map((d) => invoiceRead.parse({ ...d.data(), id: d.id }))
                  .sort((a, b) => b.createdAt - a.createdAt),
              );
              observed("invoices");
            } catch {
              fail();
            }
          }
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
          if (current === generation.current && !failed) {
            try {
              setHistory(
                s.docs
                  .map((d) => historyRead.parse({ ...d.data(), id: d.id }))
                  .sort((a, b) => b.createdAt - a.createdAt),
              );
              observed("history");
            } catch {
              fail();
            }
          }
        },
        fail,
      ),
    ];
    return () => {
      generation.current++;
      window.removeEventListener("storage", storageChanged);
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [user?.uid]);
  async function command(
    action: string,
    payload: Record<string, string> = {},
    retry: MembershipAttempt | null = null,
  ) {
    if (
      !user ||
      auth?.currentUser?.uid !== user.uid ||
      inFlight.current ||
      blocked ||
      !privateReady ||
      privateOwner !== user.uid ||
      !recoveryReady ||
      recoveryBlocked
    )
      return;
    const current = generation.current;
    const saved = attempt.current;
    // A fresh click can race a storage event before the disabled UI renders.
    // Only the explicit recovery control may replay its exact saved envelope.
    if (retry && !saved) return;
    if (saved && (!retry || !sameMembershipAttempt(saved, retry))) {
      setError(
        "Thao tác trước chưa rõ kết quả. Thử lại thao tác đó trước khi gửi yêu cầu khác.",
      );
      return;
    }
    const candidate = membershipAttemptSchema.parse({
      schemaVersion: 1,
      operationId: saved?.operationId ?? crypto.randomUUID(),
      action,
      payload,
    });
    if (saved && !sameMembershipAttempt(saved, candidate)) {
      setError(
        "Thao tác trước chưa rõ kết quả. Thử lại thao tác đó trước khi gửi yêu cầu khác.",
      );
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    let dispatchStarted = false;
    try {
      const reservation = await reserveMembershipAttempt(user.uid, candidate);
      if (current !== generation.current || auth?.currentUser?.uid !== user.uid)
        return;
      attempt.current = reservation.attempt;
      setPendingRevision((revision) => revision + 1);
      if (
        (!saved && !reservation.reserved) ||
        !sameMembershipAttempt(reservation.attempt, candidate)
      ) {
        setError(
          "Chưa rõ kết quả thao tác trước. Thử lại thao tác đang chờ để kiểm tra.",
        );
        return;
      }
      dispatchStarted = true;
      const value = await callService("membershipCommand", {
        action: candidate.action,
        ...candidate.payload,
        operationId: candidate.operationId,
      });
      if (current !== generation.current || auth?.currentUser?.uid !== user.uid)
        return;
      const result = admitMembershipResult(value, candidate, user.uid);
      await clearMembershipAttempt(user.uid, candidate);
      if (current !== generation.current || auth?.currentUser?.uid !== user.uid)
        return;
      attempt.current = null;
      setPendingRevision((revision) => revision + 1);
      notify(
        action === "purchase"
          ? "state" in result && result.state === "active"
            ? "Gói miễn phí của bạn đang có hiệu lực. Không cần chuyển khoản."
            : "Đã tạo yêu cầu mua gói. Membership chỉ kích hoạt sau khi xác nhận thanh toán."
          : action === "cancelInvoice"
            ? "Đã hủy yêu cầu mua gói chưa thanh toán."
            : action === "requestRenewal"
              ? "Đã ghi nhận ý định gia hạn. Không tự động thu tiền."
              : "Đã hủy ý định gia hạn. Quyền lợi hiện tại giữ đến hết kỳ.",
        "success",
      );
    } catch {
      if (current !== generation.current || auth?.currentUser?.uid !== user.uid)
        return;
      if (!dispatchStarted) {
        setRecoveryBlocked(true);
        setError(
          "Chưa lưu được thao tác để khôi phục. Liên hệ hỗ trợ trước khi gửi yêu cầu mới.",
        );
      } else {
        // A rejected replay does not prove an earlier uncertain call never committed.
        setError(
          "Chưa rõ kết quả. Thử lại cùng thao tác để tránh tạo trùng. Nếu vẫn chưa được, liên hệ hỗ trợ.",
        );
      }
    } finally {
      if (current === generation.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  const sameOwner = privateOwner === user?.uid;
  const visibleSubscription = sameOwner ? subscription : null;
  const visibleInvoices = sameOwner ? invoices : [];
  const visibleHistory = sameOwner ? history : [];
  return (
    <section className="page membershipPage">
      <header className="membershipHeading">
        <h1>Chọn gói phù hợp.</h1>
        <p>Quyền lợi rõ ràng cho những lần mua tiếp theo.</p>
      </header>
      {visibleSubscription && (
        <div className="notice">
          <strong>{visibleSubscription.planSnapshot.name}</strong> ·{" "}
          {visibleSubscription.state === "active" &&
          visibleSubscription.endsAt > Date.now()
            ? "Có hiệu lực đến"
            : "Đã hết hạn ngày"}{" "}
          {new Date(visibleSubscription.endsAt).toLocaleDateString("vi-VN")}
          <p>
            {visibleSubscription.renewalIntent
              ? "Bạn muốn tiếp tục gia hạn."
              : "Chưa đăng ký ý định gia hạn."}
          </p>
          <button
            disabled={
              busy ||
              blocked ||
              !privateReady ||
              !recoveryReady ||
              recoveryBlocked ||
              !!attempt.current
            }
            className="textbutton"
            onClick={() =>
              void command(
                visibleSubscription.renewalIntent
                  ? "cancelRenewal"
                  : "requestRenewal",
              )
            }
          >
            {visibleSubscription.renewalIntent
              ? "Hủy ý định gia hạn"
              : "Muốn tiếp tục gia hạn"}
          </button>
        </div>
      )}
      {planError && (
        <p className="error" role="alert">
          {planError}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {user && attempt.current && !busy && (
        <button
          type="button"
          disabled={
            blocked || !privateReady || !recoveryReady || recoveryBlocked
          }
          onClick={() => {
            const saved = attempt.current;
            if (saved) void command(saved.action, saved.payload, saved);
          }}
        >
          Thử lại thao tác đang chờ
        </button>
      )}
      {loading && <LoadingState>Đang tải các gói…</LoadingState>}
      <div className="membershipPlans">
        {plans.map((p) => (
          <article
            className="membershipPlan"
            key={p.id}
            data-current={
              (visibleSubscription?.planId === p.id &&
                visibleSubscription.state === "active" &&
                visibleSubscription.endsAt > Date.now()) ||
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
                disabled={
                  !user ||
                  busy ||
                  blocked ||
                  !privateReady ||
                  !recoveryReady ||
                  recoveryBlocked ||
                  !!attempt.current
                }
                onClick={() => void command("purchase", { planId: p.id })}
              >
                {p.name === "FREE" && p.price === 0
                  ? "Kích hoạt gói miễn phí"
                  : visibleSubscription
                    ? "Yêu cầu mua hoặc gia hạn gói"
                    : "Yêu cầu mua gói"}
              </button>
            )}
          </article>
        ))}
      </div>
      {!loading && !plans.length && !error && !planError && (
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
          open={visibleInvoices.some((invoice) => invoice.state === "pending")}
        >
          <summary>Yêu cầu mua gói và lịch sử</summary>
          <h2>Yêu cầu mua gói của bạn</h2>
          <p>
            Hiển thị tối đa 30 yêu cầu đã tải. Thanh toán membership tách riêng
            với đơn mua hộ. Nếu đã chuyển tiền, liên hệ hỗ trợ trước khi hủy yêu
            cầu.
          </p>
          {visibleInvoices.map((invoice) => (
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
                  disabled={
                    busy ||
                    blocked ||
                    !privateReady ||
                    !recoveryReady ||
                    recoveryBlocked ||
                    !!attempt.current
                  }
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
          {visibleHistory.map((row) => (
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
