import { useEffect, useState } from "react";
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
export function Membership({ user }: { user: User | null }) {
  const [plans, setPlans] = useState<Plan[]>([]),
    [endsAt, setEndsAt] = useState<number | null>(null),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      query(
        collection(db, "membershipPlans"),
        where("status", "==", "published"),
        limit(10),
      ),
      (s) => setPlans(s.docs.map((d) => ({ ...d.data(), id: d.id }) as Plan)),
      () => setError("Chưa tải được các gói."),
    );
  }, []);
  useEffect(() => {
    setEndsAt(null);
    setName("");
    if (!db || !user) return;
    return onSnapshot(
      doc(db, "membershipSubscriptions", user.uid),
      (s) => {
        setEndsAt(s.data()?.endsAt ?? null);
        setName(s.data()?.planSnapshot?.name ?? "");
      },
      () => setError("Chưa tải được membership của bạn."),
    );
  }, [user]);
  async function purchase(id: string) {
    setBusy(true);
    setError("");
    try {
      const r = await callService<{ id: string }>("membershipCommand", {
        action: "purchase",
        planId: id,
        operationId: crypto.randomUUID(),
      });
      setPending(r.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <h1>Mua thường xuyên, quyền lợi rõ ràng.</h1>
      <p>
        Membership trả trước. Chỉ kích hoạt sau khi tiền được xác nhận hoặc được
        chủ doanh nghiệp cấp tặng có ghi nhận.
      </p>
      {endsAt && (
        <div className="notice">
          {name} · {endsAt > Date.now() ? "Có hiệu lực đến" : "Đã hết hạn ngày"}{" "}
          {new Date(endsAt).toLocaleDateString("vi-VN")}
          <button
            className="textbutton"
            onClick={() =>
              void callService("membershipCommand", {
                action: "cancelRenewal",
                operationId: crypto.randomUUID(),
              }).catch((e) => setError(e.message))
            }
          >
            Không tiếp tục gia hạn
          </button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <p role="status" className="notice">
          Đã tạo yêu cầu membership {pending}. Chờ đối soát thanh toán; gói chưa
          được kích hoạt.
        </p>
      )}
      <div className="featureRow">
        {plans.map((p) => (
          <article className="panel" key={p.id}>
            <h2>{p.name}</h2>
            <p>
              <strong>{p.price.toLocaleString("vi-VN")} ₫</strong> /{" "}
              {p.periodDays} ngày
            </p>
            <p>
              Giảm {p.serviceDiscountBps / 100}% phí mua hộ, tối đa{" "}
              {p.discountCap.toLocaleString("vi-VN")} ₫. Không giảm giá hàng và
              thuế.
            </p>
            <button
              className="primary"
              disabled={!user || busy}
              onClick={() => void purchase(p.id)}
            >
              Yêu cầu mua gói
            </button>
          </article>
        ))}
      </div>
      {!plans.length && (
        <div className="empty">
          <h2>Chưa có gói mở bán</h2>
          <p>Giá và quyền lợi đang chờ đơn vị vận hành duyệt.</p>
        </div>
      )}
    </section>
  );
}
