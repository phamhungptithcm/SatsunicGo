import { notify } from "../../shared/feedback";
import { LoadingState } from "../../shared/Loading";
import { useEffect, useId, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, callService } from "../../shared/firebase";
import { commentRetry } from "./comments-ui/state";
import { ReviewStars } from "./ProductReviews";
import type { ProductReview } from "../../../packages/domain/product-reviews";
type Item = Pick<
  ProductReview,
  "id" | "productId" | "version" | "status" | "draft" | "reason"
> & { hasPublished: boolean; productTitle: string; productSlug: string | null };
type Page = { items: Item[]; next: string | null };
export function ProductReviewModeration() {
  const inputId = useId();
  const [page, setPage] = useState<Page | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reasons, setReasons] = useState<Record<string, string>>({}),
    [pending, setPending] = useState<Record<string, unknown> | null>(null);
  const epoch = useRef(0),
    seq = useRef(0),
    running = useRef(false),
    identity = useRef(auth?.currentUser?.uid ?? ""),
    retry = useRef(commentRetry());
  const valid = (e: number, uid: string) =>
    e === epoch.current && uid === (auth?.currentUser?.uid ?? "");
  async function load(after?: string) {
    const e = epoch.current,
      uid = auth?.currentUser?.uid ?? "",
      s = ++seq.current;
    setBusy(true);
    setError("");
    try {
      const r = await callService<Page>(
        "productReviewAdmin",
        after ? { after } : {},
      );
      if (valid(e, uid) && s === seq.current)
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
      if (valid(e, uid) && s === seq.current) {
        setPage(null);
        setReasons({});

        setError("Chưa tải được đánh giá. Kiểm tra quyền và tải lại.");
      }
    } finally {
      if (valid(e, uid) && s === seq.current) setBusy(false);
    }
  }
  useEffect(() => {
    void load();
    const stop = auth
      ? onAuthStateChanged(auth, (user) => {
          const uid = user?.uid ?? "";
          if (uid === identity.current) return;
          identity.current = uid;
          epoch.current++;
          seq.current++;
          running.current = false;
          retry.current.clear();
          setPage(null);
          setReasons({});
          setPending(null);

          setError("");
          setBusy(false);
        })
      : undefined;
    return () => {
      epoch.current++;
      seq.current++;
      stop?.();
    };
  }, []);
  async function act(payload: Record<string, unknown>) {
    if (running.current) return;
    const e = epoch.current,
      uid = auth?.currentUser?.uid ?? "";
    running.current = true;
    setBusy(true);
    setError("");
    let request: Record<string, unknown>;
    try {
      request = { ...payload, operationId: retry.current.begin(payload) };
    } catch {
      setError("Thử lại thao tác đang chờ trước khi đổi nội dung.");
      running.current = false;
      setBusy(false);
      return;
    }
    setPending(payload);
    try {
      await callService("productReviewModerate", request);
      if (!valid(e, uid)) return;
      retry.current.clear();
      setPending(null);
      notify("Đã lưu quyết định.", "success");
      await load();
    } catch (error) {
      if (!valid(e, uid)) return;
      const code = String((error as { code?: string }).code ?? "");
      if (
        ["functions/permission-denied", "functions/unauthenticated"].includes(
          code,
        )
      ) {
        setPage(null);
        setReasons({});
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
        ].includes(code)
      ) {
        retry.current.clear();
        setPending(null);
        setError("Chưa lưu được quyết định. Tải lại và kiểm tra nội dung.");
      } else setError("Chưa nhận được kết quả. Thử lại cùng thao tác.");
    } finally {
      if (valid(e, uid)) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  function command(r: Item, action: string) {
    const reason = reasons[r.id]?.trim() ?? "";
    if (action !== "approve" && reason.length < 3) {
      setError("Nhập lý do hoặc nội dung phản hồi trước khi lưu.");
      return;
    }
    void act({ id: r.id, expectedVersion: r.version, action, reason });
  }
  return (
    <section className="sgReviewAdmin">
      <h2>Đánh giá sản phẩm</h2>
      <p className="notice">
        Giữ nguyên lời nhận xét và số sao. Không từ chối chỉ vì đánh giá thấp.
      </p>
      <button disabled={busy || !!pending} onClick={() => void load()}>
        Tải lại
      </button>
      {error && <p role="alert">{error}</p>}
      {busy && <LoadingState overlay={false}>Đang xử lý…</LoadingState>}

      {pending && (
        <button disabled={busy} onClick={() => void act(pending)}>
          Thử lại thao tác
        </button>
      )}
      {page && !page.items.length && <p>Chưa có đánh giá.</p>}
      {page?.items.map((r) => (
        <article key={r.id}>
          <h3>{r.productTitle}</h3>
          <strong>{r.draft.name}</strong> ·{" "}
          <ReviewStars rating={r.draft.rating} />
          <p>{r.draft.text}</p>
          <p className="notice">
            {
              (
                {
                  pending: "Chờ duyệt",
                  approved: "Đã đăng",
                  rejected: "Chưa được duyệt",
                  withdrawn: "Đã gỡ",
                  hidden: "Đã ẩn",
                } as Record<string, string>
              )[r.status]
            }{" "}
            ·{" "}
            {r.productSlug && (
              <a href={`/products/${r.productSlug}`}>Xem sản phẩm</a>
            )}
          </p>
          {r.reason && <p>{r.reason}</p>}
          <div>
            <label htmlFor={`${inputId}-${r.id}`}>Lý do / phản hồi</label>
            <textarea
              id={`${inputId}-${r.id}`}
              maxLength={1000}
              disabled={busy || !!pending}
              value={reasons[r.id] ?? ""}
              onChange={(e) =>
                setReasons((old) => ({ ...old, [r.id]: e.target.value }))
              }
            />
          </div>
          <div>
            {r.status === "pending" && (
              <>
                <button
                  className="primary"
                  disabled={busy || !!pending}
                  onClick={() => command(r, "approve")}
                >
                  Cho hiển thị
                </button>
                <button
                  disabled={busy || !!pending}
                  onClick={() => command(r, "reject")}
                >
                  Từ chối
                </button>
              </>
            )}
            {r.hasPublished && (
              <>
                <button
                  disabled={busy || !!pending}
                  onClick={() => command(r, "reply")}
                >
                  Phản hồi
                </button>
                <button
                  disabled={busy || !!pending}
                  onClick={() => command(r, "hide")}
                >
                  Ẩn đánh giá
                </button>
              </>
            )}
          </div>
        </article>
      ))}
      {page?.next && (
        <button
          disabled={busy || !!pending}
          onClick={() => void load(page.next!)}
        >
          Xem thêm đánh giá
        </button>
      )}
    </section>
  );
}
