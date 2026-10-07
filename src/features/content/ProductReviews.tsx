import { LoadingState } from "../../shared/Loading";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, callService, login } from "../../shared/firebase";
import { commentRetry } from "./comments-ui/state";
import {
  reviewDraftSchema,
  type EligibilityPage,
  type ReviewPage,
} from "../../../packages/domain/product-reviews";
export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      className="sgReviewStars"
      role="img"
      aria-label={`${rating.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} trên 5 sao`}
    >
      <span aria-hidden="true">☆☆☆☆☆</span>
      <span
        className="sgReviewStarsFill"
        aria-hidden="true"
        style={{ width: `${Math.max(0, Math.min(5, rating)) * 20}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}
export function ProductReviews({ productId }: { productId: string }) {
  const [uid, setUid] = useState(auth?.currentUser?.uid ?? ""),
    [page, setPage] = useState<ReviewPage | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [eligibility, setEligibility] = useState<EligibilityPage | null>(null),
    [orderId, setOrderId] = useState(""),
    [name, setName] = useState(""),
    [text, setText] = useState(""),
    [rating, setRating] = useState(0),
    [pending, setPending] = useState<Record<string, unknown> | null>(null),
    [withdraw, setWithdraw] = useState(false);
  const epoch = useRef(0),
    sequence = useRef(0),
    running = useRef(false),
    retry = useRef(commentRetry()),
    currentUid = useRef(uid),
    inputId = useId();
  const valid = useCallback(
    (generation: number, owner: string) =>
      generation === epoch.current && owner === (auth?.currentUser?.uid ?? ""),
    [],
  );
  useEffect(
    () =>
      auth
        ? onAuthStateChanged(auth, (user) => {
            const next = user?.uid ?? "";
            if (next === currentUid.current) return;
            currentUid.current = next;
            epoch.current++;
            sequence.current++;
            running.current = false;
            retry.current.clear();
            setUid(next);
            setPage(null);
            setEligibility(null);
            setOrderId("");
            setName("");
            setText("");
            setRating(0);
            setPending(null);
            setOpen(false);
            setBusy(false);
            setWithdraw(false);
            setNotice("");
            setError("");
          })
        : undefined,
    [],
  );
  const load = useCallback(
    async (after?: string) => {
      const generation = epoch.current,
        owner = auth?.currentUser?.uid ?? "",
        seq = ++sequence.current;
      setLoading(true);
      setError("");
      try {
        const r = await callService<ReviewPage>("productReviewRead", {
          productId,
          ...(after ? { after } : {}),
        });
        if (!valid(generation, owner) || seq !== sequence.current) return;
        setPage((old) =>
          after && old
            ? {
                ...r,
                items: [
                  ...old.items,
                  ...r.items.filter(
                    (x) => !old.items.some((y) => y.id === x.id),
                  ),
                ],
              }
            : r,
        );
      } catch {
        if (valid(generation, owner) && seq === sequence.current) {
          setPage(null);
          setEligibility(null);
          setOpen(false);
          setOrderId("");
          setName("");
          setText("");
          setRating(0);
          setWithdraw(false);
          setNotice("");
          setError("Chưa tải được đánh giá. Anh/chị thử tải lại nhé.");
        }
      } finally {
        if (valid(generation, owner) && seq === sequence.current)
          setLoading(false);
      }
    },
    [productId, valid],
  );
  useEffect(() => {
    void load();
    return () => {
      epoch.current++;
      sequence.current++;
    };
  }, [load, uid]);
  async function check(after?: string) {
    const generation = epoch.current,
      owner = auth?.currentUser?.uid ?? "";
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await callService<EligibilityPage>("productReviewEligibility", {
        productId,
        ...(after ? { after } : {}),
      });
      if (!valid(generation, owner)) return;
      setEligibility((old) =>
        after && old
          ? {
              ...r,
              orders: [
                ...old.orders,
                ...r.orders.filter(
                  (x) => !old.orders.some((y) => y.id === x.id),
                ),
              ],
            }
          : r,
      );
      setOpen(true);
      if (page?.mine) {
        setName(page.mine.draft.name);
        setText(page.mine.draft.text);
        setRating(page.mine.draft.rating);
      }
    } catch {
      if (valid(generation, owner)) {
        setPage(null);
        setEligibility(null);
        setOpen(false);
        setName("");
        setText("");
        setRating(0);
        setOrderId("");
        setPending(null);
        retry.current.clear();
        setError("Chưa kiểm tra được quyền đánh giá. Anh/chị thử lại nhé.");
      }
    } finally {
      if (valid(generation, owner)) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  async function write(payload: Record<string, unknown>) {
    if (running.current) return;
    const generation = epoch.current,
      owner = auth?.currentUser?.uid ?? "";
    if (!owner) return;
    running.current = true;
    setBusy(true);
    setError("");
    let request: Record<string, unknown>;
    try {
      request = { ...payload, operationId: retry.current.begin(payload) };
    } catch {
      setError("Thử lại thao tác đang chờ trước khi thay đổi nội dung.");
      running.current = false;
      setBusy(false);
      return;
    }
    setPending(payload);
    try {
      const result = await callService<{ mine: ReviewPage["mine"] }>(
        "productReviewWrite",
        request,
      );
      if (!valid(generation, owner)) return;
      retry.current.clear();
      setPending(null);
      setPage((old) => (old ? { ...old, mine: result.mine } : old));
      setNotice(
        payload.action === "withdraw"
          ? "Đã gỡ đánh giá."
          : "Đã gửi đánh giá, đang chờ duyệt.",
      );
      setOpen(false);
      setWithdraw(false);
      await load();
    } catch (e) {
      if (!valid(generation, owner)) return;
      const code = String((e as { code?: string }).code ?? "");
      if (
        [
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/not-found",
        ].includes(code)
      ) {
        setPage(null);
        setEligibility(null);
        setOpen(false);
        setOrderId("");
        setName("");
        setText("");
        setRating(0);
        setWithdraw(false);
        setNotice("");
      }
      if (
        [
          "functions/invalid-argument",
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/not-found",
          "functions/failed-precondition",
          "functions/aborted",
          "functions/already-exists",
          "functions/resource-exhausted",
        ].includes(code)
      ) {
        retry.current.clear();
        setPending(null);
        setError(
          code === "functions/not-found"
            ? "Sản phẩm hiện không còn nhận đánh giá."
            : code === "functions/aborted"
              ? "Đánh giá đã thay đổi. Tải lại trước khi gửi."
              : "Chưa gửi được đánh giá. Kiểm tra đơn đã nhận và thử lại.",
        );
      } else
        setError("Chưa nhận được kết quả. Thử lại để kiểm tra cùng thao tác.");
    } finally {
      if (valid(generation, owner)) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!reviewDraftSchema.safeParse({ name, text, rating }).success) {
      setError("Chọn số sao, tên hiển thị và nhận xét từ 10 đến 2.000 ký tự.");
      return;
    }
    void write({
      action: "submit",
      productId,
      expectedVersion: page?.mine?.version ?? 0,
      ...(!page?.mine ? { orderId } : {}),
      draft: { name, text, rating },
    });
  }
  const mine = page?.mine;
  return (
    <section className="sgProductReviews" aria-label="Đánh giá sản phẩm">
      <div className="sgReviewHeader">
        <div>
          <h2>Đánh giá</h2>
          {page?.summary ? (
            page.summary.count ? (
              <p className="sgReviewScore">
                <ReviewStars rating={page.summary.average!} />
                <span>
                  {page.summary.average!.toLocaleString("vi-VN", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  / 5 · {page.summary.count.toLocaleString("vi-VN")} đánh giá
                </span>
              </p>
            ) : (
              <p className="sgReviewNotice">Chưa có đánh giá.</p>
            )
          ) : (
            page && (
              <p className="sgReviewNotice">Chưa tải được điểm tổng hợp.</p>
            )
          )}
        </div>
        <button
          disabled={busy || loading || !!pending}
          onClick={() =>
            uid
              ? void check()
              : void login().catch(() =>
                  setError("Chưa đăng nhập được. Anh/chị thử lại nhé."),
                )
          }
        >
          {uid
            ? mine
              ? "Sửa đánh giá"
              : "Viết đánh giá"
            : "Đăng nhập để đánh giá"}
        </button>
      </div>
      {loading && (
        <LoadingState className="sgReviewNotice" overlay={false}>
          Đang tải đánh giá…
        </LoadingState>
      )}
      {busy && (
        <LoadingState className="sgReviewNotice" overlay={false}>
          Đang xử lý…
        </LoadingState>
      )}
      {error && (
        <p className="sgReviewNotice" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="sgReviewNotice" role="status">
          {notice}
        </p>
      )}
      {error && !pending && (
        <button disabled={loading || busy} onClick={() => void load()}>
          Tải lại
        </button>
      )}
      {pending && (
        <button disabled={busy} onClick={() => void write(pending)}>
          Thử lại thao tác
        </button>
      )}
      {mine && (
        <p className="sgReviewNotice">
          {
            (
              {
                pending: "Đánh giá của anh/chị đang chờ duyệt.",
                approved: "Đánh giá của anh/chị đã đăng.",
                rejected: "Đánh giá chưa được duyệt.",
                withdrawn: "Đánh giá của anh/chị đã gỡ.",
                hidden: "Đánh giá của anh/chị đã ẩn.",
              } as Record<string, string>
            )[mine.status]
          }
          {mine.reason && ` ${mine.reason}`}
        </p>
      )}
      {open && eligibility && (
        <form className="sgReviewForm" onSubmit={submit}>
          {!mine && (
            <>
              <label>
                Đơn đã nhận sản phẩm
                <select
                  value={orderId}
                  required
                  disabled={busy || !!pending}
                  onChange={(e) => setOrderId(e.target.value)}
                >
                  <option value="">Chọn đơn hàng</option>
                  {eligibility.orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {eligibility.next && (
                <button
                  type="button"
                  disabled={busy || !!pending}
                  onClick={() => void check(eligibility.next!)}
                >
                  Xem thêm đơn
                </button>
              )}
              <p className="sgReviewNotice">
                Chỉ đánh giá sản phẩm đã nhận tại SatsunicGo. Quyền được kiểm
                tra khi gửi.
              </p>
              {!eligibility.orders.length && !eligibility.next && (
                <p className="sgReviewNotice">
                  Chưa tìm thấy đơn có thể đối chiếu với sản phẩm này.
                </p>
              )}
            </>
          )}
          <fieldset disabled={busy || !!pending}>
            <legend>Số sao</legend>
            <div className="sgReviewChoices">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input
                    type="radio"
                    name={`${inputId}-rating`}
                    value={n}
                    required
                    checked={rating === n}
                    onChange={() => setRating(n)}
                  />
                  {n}
                  <span aria-hidden="true">★</span>
                  <span className="sr-only"> sao</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Tên hiển thị
            <input
              required
              minLength={2}
              maxLength={40}
              value={name}
              disabled={busy || !!pending}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="sgReviewTextField">
            <label htmlFor={`${inputId}-text`}>Nhận xét</label>
            <textarea
              id={`${inputId}-text`}
              required
              minLength={10}
              maxLength={2000}
              value={text}
              disabled={busy || !!pending}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <p className="sgReviewNotice">
            Nội dung được duyệt trước khi đăng. Không đưa thông tin riêng tư vào
            nhận xét.
          </p>
          <div>
            <button
              className="primary"
              disabled={busy || !!pending || (!mine && !orderId)}
            >
              {busy ? "Đang gửi…" : "Gửi đánh giá"}
            </button>
            <button
              type="button"
              disabled={busy || !!pending}
              onClick={() => setOpen(false)}
            >
              Đóng
            </button>
          </div>
        </form>
      )}
      {mine && mine.status !== "withdrawn" && !pending && (
        <div>
          {withdraw ? (
            <p className="sgReviewNotice">
              Gỡ đánh giá khỏi trang sản phẩm?{" "}
              <button
                disabled={busy}
                onClick={() =>
                  void write({
                    action: "withdraw",
                    productId,
                    expectedVersion: mine.version,
                  })
                }
              >
                Gỡ đánh giá
              </button>
              <button disabled={busy} onClick={() => setWithdraw(false)}>
                Giữ lại
              </button>
            </p>
          ) : (
            <button
              disabled={busy || loading}
              onClick={() => setWithdraw(true)}
            >
              Gỡ đánh giá
            </button>
          )}
        </div>
      )}
      {page?.items.map((r) => (
        <article className="sgReviewItem" key={r.id}>
          <header>
            <strong>{r.name}</strong>
            <span className="sgReviewBadge">Đã mua tại SatsunicGo</span>
          </header>
          <ReviewStars rating={r.rating} />
          <p>{r.text}</p>
          {r.variant && <p className="sgReviewNotice">Mẫu: {r.variant}</p>}
          <time dateTime={new Date(r.publishedAt).toISOString()}>
            {new Date(r.publishedAt).toLocaleDateString("vi-VN")}
          </time>
          {r.reply && (
            <div className="sgReviewReply">
              <strong>SatsunicGo</strong>
              <p>{r.reply}</p>
            </div>
          )}
        </article>
      ))}
      {page?.next && (
        <button
          disabled={loading || busy}
          onClick={() => void load(page.next!)}
        >
          Xem thêm đánh giá
        </button>
      )}
    </section>
  );
}
