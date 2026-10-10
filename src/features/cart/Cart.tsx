import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customCartTotal } from "../../../packages/domain/cart";
import { catalogProductSchema } from "../../../packages/domain/catalog-checkout";
import { LoadingState } from "../../shared/Loading";
import { useCart } from "./cart-store";
import { cartProducts, type ProductResult } from "./cart-cache";
import { CartIcon } from "./AddToCart";
import "./cart.css";
import "./purchase-checkout.css";
import { PurchaseThumbnail, purchaseMediaSrc } from "./purchase-thumbnail";
import { PurchaseSignIn } from "./purchase-sign-in";

const money = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
export function CartPage({ signIn }: { signIn: () => void }) {
  const navigate = useNavigate();
  const {
    cart,
    user,
    loading,
    busy,
    cached,
    online,
    error,
    storageWarning,
    guestItems,
    pending,
    change,
    changeGuest,
    mergeGuest,
    resetGuest,
    refresh,
    retryPending,
  } = useCart();
  const [products, setProducts] = useState<ProductResult>({
      rows: {},
      cached: true,
      error: "",
    }),
    [reading, setReading] = useState(true),
    [retry, setRetry] = useState(0);
  const automaticTransfer = useRef("");
  const hasGuestItems = Boolean(user && guestItems.length);
  useEffect(() => {
    if (!online) {
      automaticTransfer.current = "";
      return;
    }
    if (
      !user ||
      !hasGuestItems ||
      loading ||
      busy ||
      pending ||
      cached ||
      cart.activeCheckoutId
    )
      return;
    const signature = JSON.stringify([user.uid, guestItems]);
    if (automaticTransfer.current === signature) return;
    automaticTransfer.current = signature;
    void mergeGuest();
  }, [
    user,
    hasGuestItems,
    guestItems,
    loading,
    busy,
    pending,
    cached,
    online,
    cart.activeCheckoutId,
    mergeGuest,
  ]);
  const ids = JSON.stringify(
    [
      ...new Set(
        [...cart.items, ...(user ? guestItems : [])]
          .filter((item) => item.kind !== "custom")
          .map((item) => item.productId),
      ),
    ].sort(),
  );
  useEffect(() => {
    if (!online || reading) return;
    const timer = setTimeout(() => setRetry((n) => n + 1), 5 * 60_000);
    return () => clearTimeout(timer);
  }, [online, reading, retry]);
  useEffect(() => {
    let live = true;
    setReading(true);
    void cartProducts(JSON.parse(ids) as string[]).then((result) => {
      if (live) {
        setProducts(result);
        setReading(false);
      }
    });
    return () => {
      live = false;
    };
  }, [ids, retry, online]);
  const entries = [
    ...cart.items.map((item) => ({ item, guest: false })),
    ...(user ? guestItems.map((item) => ({ item, guest: true })) : []),
  ].map(({ item, guest }) => {
    const product = item.custom
        ? {
            title: item.custom.name,
            slug: "",
            mediaId: undefined,
            mediaAlt: "",
            version: 1,
            market: item.custom.market,
            catalogOptions: [] as string[],
          }
        : products.rows[item.productId],
      p = catalogProductSchema.safeParse(product);
    const valid =
      item.kind === "custom" ||
      (p.success &&
        (p.data.catalogOptions.length
          ? p.data.catalogOptions.includes(item.variant)
          : item.variant === ""));
    return {
      item,
      guest,
      product,
      valid,
      price: item.custom
        ? customCartTotal(item) / item.quantity
        : p.success
          ? p.data.listedPrice
          : null,
    };
  });
  const summaryEntries = cart.activeCheckoutId
    ? entries.filter((entry) => !entry.guest)
    : entries;
  const quantity = summaryEntries.reduce(
    (sum, { item }) => sum + item.quantity,
    0,
  );
  const total = summaryEntries.every((e) => e.valid && e.price !== null)
    ? summaryEntries.reduce(
        (sum, e) =>
          sum +
          (e.item.custom
            ? customCartTotal(e.item)
            : e.price! * e.item.quantity),
        0,
      )
    : null;
  const canReview =
    online &&
    !reading &&
    !products.cached &&
    !pending &&
    !busy &&
    !hasGuestItems &&
    cart.items.length > 0 &&
    entries.every((entry) => entry.valid) &&
    (!user || !cached);
  const disabled =
    loading ||
    busy ||
    pending ||
    Boolean(cart.activeCheckoutId) ||
    (!!user && (cached || !online));
  const guestDisabled = loading || busy || pending;
  return (
    <section className="page cart107">
      <Link className="cartBack107" to="/products">
        ← Sản phẩm
      </Link>
      <div className="cartHeading107">
        <h1>Giỏ hàng</h1>
      </div>
      {storageWarning && (
        <div className="cartRecovery107" role="status">
          {storageWarning}
          <button type="button" onClick={resetGuest}>
            Xóa bản giỏ trên trình duyệt
          </button>
        </div>
      )}
      {error && !hasGuestItems && (
        <div className="cartRecovery107" role="alert">
          <span>{error}</span>
          {pending ? (
            <button
              type="button"
              disabled={busy || !online}
              onClick={() => void retryPending()}
            >
              Kiểm tra lại lần cập nhật
            </button>
          ) : (
            user && (
              <button
                type="button"
                disabled={busy || !online}
                onClick={() => void refresh()}
              >
                Tải lại giỏ
              </button>
            )
          )}
        </div>
      )}
      {pending && !busy && !error && !hasGuestItems && (
        <p className="cartRecovery107" role="status">
          Có lần cập nhật chưa xác nhận.{" "}
          <button
            type="button"
            disabled={busy || !online}
            onClick={() => void retryPending()}
          >
            Kiểm tra lại lần cập nhật
          </button>
        </p>
      )}
      {loading ? (
        <LoadingState>Đang cập nhật giỏ hàng…</LoadingState>
      ) : entries.length === 0 ? (
        <div className="cartEmpty107">
          <CartIcon />
          <h2>
            {hasGuestItems || error
              ? "Chưa hiển thị được giỏ"
              : "Giỏ hàng đang trống"}
          </h2>
          <p>
            {hasGuestItems
              ? `${guestItems.length} mẫu sản phẩm đã chọn vẫn được giữ lại.`
              : error
                ? "Thử tải lại giỏ."
                : "Chọn sản phẩm để bắt đầu mua hộ."}
          </p>
          <Link className="primary" to="/products">
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <>
          <div className="cartLayout107">
            <div>
              <ul className="cartItems107">
                {entries.map(({ item, product, valid, price, guest }) => (
                  <li
                    className="cartItem107"
                    key={`${guest ? "guest" : "account"}:${item.lineId}`}
                  >
                    <div className="cartImage107">
                      {item.custom ? (
                        <PurchaseThumbnail
                          key={user?.uid}
                          draftId={item.custom.draftId}
                          itemIndex={item.custom.itemIndex}
                        />
                      ) : product?.mediaId ? (
                        <img
                          src={purchaseMediaSrc(product.mediaId)}
                          alt={product.mediaAlt || product.title}
                          loading="lazy"
                          onLoad={(e) => {
                            e.currentTarget.hidden = false;
                          }}
                          onError={(e) => {
                            e.currentTarget.hidden = true;
                          }}
                        />
                      ) : (
                        <CartIcon />
                      )}
                    </div>
                    <div className="cartItemBody107">
                      <h2>
                        {item.custom ? (
                          item.custom.name
                        ) : product ? (
                          <Link to={`/products/${product.slug}`}>
                            {product.title}
                          </Link>
                        ) : (
                          "Sản phẩm chưa có thông tin"
                        )}
                      </h2>
                      <p className="cartVariant107">
                        {item.custom ? "Cần tìm mua · " : ""}
                        {item.variant || "Mẫu mặc định"}
                      </p>
                      <p className="cartUnit107">
                        {price === null
                          ? "Chưa xác định giá"
                          : item.custom
                            ? "Giá bạn đã nhập và phí mua hộ tạm tính"
                            : `${money(price)} / sản phẩm`}
                      </p>
                      {!valid && !reading && !products.cached && (
                        <p className="cartUnavailable107" role="status">
                          Chưa thể đặt mua sản phẩm hoặc mẫu này. Xóa món này
                          hoặc chọn lại trong danh mục.
                        </p>
                      )}
                      {guest && valid && !busy && (
                        <p className="cartUnavailable107">
                          Chưa lưu vào giỏ tài khoản.
                        </p>
                      )}
                      <div className="cartItemActions107">
                        <div className="cartQuantity107">
                          <button
                            type="button"
                            aria-label={`Giảm số lượng ${product?.title ?? "sản phẩm"}`}
                            disabled={
                              (guest ? guestDisabled : disabled) ||
                              item.quantity <= 1
                            }
                            onClick={() =>
                              void (guest ? changeGuest : change)({
                                action: "quantity",
                                lineId: item.lineId,
                                quantity: item.quantity - 1,
                              })
                            }
                          >
                            −
                          </button>
                          <output
                            aria-label={`Số lượng ${product?.title ?? "sản phẩm"}`}
                          >
                            {item.quantity}
                          </output>
                          <button
                            type="button"
                            aria-label={`Tăng số lượng ${product?.title ?? "sản phẩm"}`}
                            disabled={
                              (guest ? guestDisabled : disabled) ||
                              item.quantity >= 100
                            }
                            onClick={() =>
                              void (guest ? changeGuest : change)({
                                action: "quantity",
                                lineId: item.lineId,
                                quantity: item.quantity + 1,
                              })
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="cartRemove107"
                          disabled={guest ? guestDisabled : disabled}
                          aria-label={`Xóa ${product?.title ?? "sản phẩm"} khỏi giỏ`}
                          onClick={() =>
                            void (guest ? changeGuest : change)({
                              action: "remove",
                              lineId: item.lineId,
                            })
                          }
                        >
                          Xóa
                        </button>
                        <strong>
                          {price === null
                            ? "Chưa xác định"
                            : money(
                                item.custom
                                  ? customCartTotal(item)
                                  : price * item.quantity,
                              )}
                        </strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {user &&
                online &&
                !hasGuestItems &&
                !error &&
                (cached || busy) && (
                  <p className="cartSaved107" role="status">
                    {busy
                      ? "Đang lưu…"
                      : "Giỏ chưa được cập nhật. Kết nối để tải lại."}
                  </p>
                )}
              <Link className="cartBack107" to="/products">
                ← Tiếp tục chọn sản phẩm
              </Link>
            </div>
            <aside className="cartSummary107">
              <h2>Tóm tắt</h2>
              <div>
                <span>
                  {cart.activeCheckoutId ? "Đang chờ thanh toán" : "Số lượng"}
                </span>
                <span>{quantity} sản phẩm</span>
              </div>
              <div className="cartTotal107">
                <span>
                  {products.cached
                    ? "Tạm tính · giá chưa cập nhật"
                    : "Tạm tính"}
                </span>
                <strong>
                  {total === null ? "Chưa xác định" : money(total)}
                </strong>
              </div>
              {(hasGuestItems || reading || products.error || !online) && (
                <p className="cartPriceState107" role="status">
                  <span>
                    {hasGuestItems && cart.activeCheckoutId
                      ? "Hoàn tất thanh toán đang chờ để thêm các món đã chọn."
                      : hasGuestItems && busy
                        ? "Đang cập nhật giỏ hàng…"
                        : !online
                          ? "Kết nối mạng để tiếp tục đặt mua."
                          : hasGuestItems
                            ? error ||
                              "Chưa lưu được các món đã chọn. Thử lại hoặc xóa món không cần mua."
                            : reading
                              ? "Đang cập nhật giá…"
                              : products.error}
                  </span>
                  {online &&
                    !busy &&
                    !cart.activeCheckoutId &&
                    (hasGuestItems || products.error) &&
                    !reading && (
                      <button
                        type="button"
                        onClick={() =>
                          hasGuestItems
                            ? void (cached
                                ? refresh()
                                : pending
                                  ? retryPending()
                                  : mergeGuest())
                            : setRetry((n) => n + 1)
                        }
                      >
                        Thử lại
                      </button>
                    )}
                </p>
              )}
              {user ? (
                <button
                  type="button"
                  className="primary"
                  disabled={
                    cart.activeCheckoutId
                      ? loading || !online || busy
                      : !canReview
                  }
                  onClick={() => {
                    navigate(
                      cart.activeCheckoutId
                        ? `/checkout/payment/${cart.activeCheckoutId}`
                        : "/checkout",
                    );
                  }}
                >
                  {cart.activeCheckoutId
                    ? "Tiếp tục thanh toán đang chờ"
                    : "Xem lại để đặt mua"}
                </button>
              ) : (
                <PurchaseSignIn signIn={signIn} />
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
