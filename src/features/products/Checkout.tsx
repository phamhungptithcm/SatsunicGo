import { LoadingState } from "../../shared/Loading";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  catalogProductSchema,
  catalogSelectionSchema,
  type CatalogSelection,
} from "../../../packages/domain/catalog-checkout";
import { callService, db } from "../../shared/firebase";
import type { ContentRow } from "../../shared/public-content";
import { useCart } from "../cart/cart-store";
import { notify } from "../../shared/feedback";

type Attempt = {
  key: string;
  operationId: string;
  product: ContentRow;
  selection: CatalogSelection;
  cartLine?: string;
};
export function ProductCheckout({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => void;
}) {
  const { slug } = useParams(),
    navigate = useNavigate();
  const [params] = useSearchParams();
  const { consume } = useCart();
  const cartLine = /^[0-9a-f-]{36}$/i.test(params.get("cartLine") ?? "")
    ? params.get("cartLine")!
    : undefined;
  const initialQuantity = Number(params.get("quantity") ?? 1);
  const initialVariant = params.get("variant") ?? "";
  const initialVersion = Number(params.get("productVersion") ?? 0);
  const [needsPriceReview, setNeedsPriceReview] = useState(false);
  const [product, setProduct] = useState<ContentRow | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [quantity, setQuantity] = useState(1),
    [variant, setVariant] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const attempt = useRef<Attempt | null>(null);
  const [pending, setPending] = useState<Attempt | null>(null);
  const storageKey = user ? `catalog-checkout-${user.uid}-${slug}` : "";
  useEffect(() => {
    attempt.current = null;
    setPending(null);
    if (!storageKey) return;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) ?? "null",
      ) as Attempt | null;
      if (
        saved &&
        catalogProductSchema.safeParse(saved.product).success &&
        catalogSelectionSchema.safeParse(saved.selection).success &&
        saved.product.id === saved.selection.productId &&
        saved.product.slug === slug &&
        /^[0-9a-f-]{36}$/.test(saved.operationId) &&
        (saved.cartLine === undefined ||
          /^[0-9a-f-]{36}$/i.test(saved.cartLine))
      ) {
        attempt.current = saved;
        setPending(saved);
        setQuantity(saved.selection.quantity);
        setVariant(saved.selection.variant);
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey, slug]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    setProduct(null);
    if (!db) {
      setLoading(false);
      setError("Chưa kết nối được danh mục.");
      return;
    }
    void getDocs(
      query(
        collection(db, "products"),
        where("status", "==", "published"),
        where("slug", "==", slug ?? ""),
        limit(1),
      ),
    )
      .then((s) => {
        if (!live) return;
        const row = s.empty
          ? null
          : ({ ...s.docs[0].data(), id: s.docs[0].id } as ContentRow);
        setProduct(row);
        setVariant(attempt.current?.selection.variant ?? initialVariant);
        setQuantity(
          attempt.current?.selection.quantity ??
            (Number.isInteger(initialQuantity) &&
            initialQuantity >= 1 &&
            initialQuantity <= 100
              ? initialQuantity
              : 1),
        );
        setNeedsPriceReview(
          !!cartLine &&
            initialVersion > 0 &&
            row?.version !== initialVersion &&
            !attempt.current,
        );
      })
      .catch(() => {
        if (live)
          setError("Chưa tải được sản phẩm. Kiểm tra kết nối rồi tải lại.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [slug, retry, initialQuantity, initialVariant, initialVersion, cartLine]);
  const displayedProduct = pending?.product ?? product;
  const parsed = catalogProductSchema.safeParse(displayedProduct);
  const total = parsed.success ? parsed.data.listedPrice * quantity : 0;
  const selectionValid =
    parsed.success &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 100 &&
    total <= 1000000000000 &&
    (parsed.data.catalogOptions.length
      ? parsed.data.catalogOptions.includes(variant)
      : variant === "");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      busy ||
      !user ||
      !displayedProduct ||
      needsPriceReview ||
      (!selectionValid && !pending)
    )
      return;
    const selection = pending?.selection ?? {
      productId: displayedProduct.id,
      productVersion: displayedProduct.version,
      quantity,
      variant,
    };
    const key = JSON.stringify({ uid: user.uid, ...selection });
    if (attempt.current?.key !== key)
      attempt.current = {
        key,
        operationId: crypto.randomUUID(),
        product: displayedProduct,
        selection,
        ...(cartLine ? { cartLine } : {}),
      };
    const current = attempt.current!;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(current));
    } catch {
      setError(
        "Chưa lưu được lựa chọn để đặt mua an toàn. Cho phép lưu phiên trên trình duyệt rồi thử lại.",
      );
      return;
    }
    setPending(current);
    setBusy(true);
    setError("");
    try {
      const result = await callService<{ id: string }>("catalogCheckout", {
        ...selection,
        operationId: attempt.current!.operationId,
      });
      sessionStorage.removeItem(storageKey);
      setPending(null);
      attempt.current = null;
      navigate(`/account/orders/${encodeURIComponent(result.id)}`);
      if (current.cartLine)
        void consume(result.id, current.cartLine).then((removed) => {
          if (!removed)
            notify(
              "Đơn đã tạo. Giỏ chưa cập nhật; mở giỏ để kiểm tra lại.",
              "info",
            );
        });
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (
        [
          "functions/aborted",
          "functions/failed-precondition",
          "functions/invalid-argument",
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/already-exists",
        ].includes(code)
      ) {
        sessionStorage.removeItem(storageKey);
        setPending(null);
        attempt.current = null;
        setError((e as Error).message);
      } else
        setError(
          "Chưa rõ kết quả đặt mua. Giữ lựa chọn và thử lại để kiểm tra cùng đơn, hoặc xem đơn trong tài khoản.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <Link to="/products">← Sản phẩm</Link>
      <h1>Đặt mua sản phẩm</h1>
      {cartLine && <Link to="/cart">← Quay lại giỏ hàng</Link>}
      {loading ? (
        <LoadingState>Đang tải sản phẩm…</LoadingState>
      ) : parsed.success && displayedProduct ? (
        <form className="form" onSubmit={(e) => void submit(e)}>
          <h2>{displayedProduct.title}</h2>
          <p>
            Giá trọn gói: {parsed.data.listedPrice.toLocaleString("vi-VN")} ₫ /
            sản phẩm. Bao gồm phí mua hộ và giao hàng.
          </p>
          {parsed.data.catalogOptions.length > 0 && (
            <label>
              <span className="formLabelText">
                Mẫu sản phẩm{" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <select
                value={variant}
                disabled={busy || !!pending}
                required
                onChange={(e) => setVariant(e.target.value)}
              >
                <option value="">Chọn mẫu</option>
                {parsed.data.catalogOptions.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className="formLabelText">
              Số lượng{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              required
              value={quantity}
              disabled={busy || !!pending}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <p>
            Tổng thanh toán:{" "}
            <strong>
              {Number.isSafeInteger(total) &&
              total >= 0 &&
              total <= 1000000000000
                ? `${total.toLocaleString("vi-VN")} ₫`
                : "Chưa xác định"}
            </strong>
          </p>
          <p>
            Thanh toán toàn bộ một lần. Nhân viên mua hộ sau khi tiền được xác
            nhận. Điều khoản: {parsed.data.termsVersion}.
          </p>
          {needsPriceReview && (
            <div className="cartNotice107" role="status">
              <span>
                Sản phẩm đã cập nhật từ lúc bạn xem giỏ. Xem lại giá và mẫu
                trước khi đặt mua.
              </span>
              <button type="button" onClick={() => setNeedsPriceReview(false)}>
                Đã xem thông tin mới
              </button>
            </div>
          )}
          {!selectionValid && !pending && (
            <p role="status">Chọn mẫu và số lượng hợp lệ để tiếp tục.</p>
          )}
          {user ? (
            <button
              className="primary"
              disabled={
                busy || needsPriceReview || (!selectionValid && !pending)
              }
            >
              {busy
                ? "Đang tạo đơn…"
                : pending
                  ? "Kiểm tra lại đơn và tiếp tục"
                  : "Đặt mua và tiếp tục thanh toán"}
            </button>
          ) : (
            <button type="button" className="primary" onClick={signIn}>
              Đăng nhập để đặt mua
            </button>
          )}
        </form>
      ) : (
        !error && (
          <p role="status">
            Sản phẩm này chưa mở đặt mua. Bạn có thể chọn sản phẩm khác trong
            danh mục.
          </p>
        )
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button
        disabled={busy || loading || !!pending}
        onClick={() => setRetry((n) => n + 1)}
      >
        Tải lại sản phẩm và giá
      </button>
    </section>
  );
}
