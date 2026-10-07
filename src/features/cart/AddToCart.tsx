import { useState } from "react";
import { Link } from "react-router-dom";
import { catalogProductSchema } from "../../../packages/domain/catalog-checkout";
import type { ContentRow } from "../../shared/public-content";
import { useCart } from "./cart-store";
import "./cart.css";

export function CartIcon() {
  return (
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
      <path d="M3 3h2l2.4 11.5a2 2 0 0 0 2 1.5H18a2 2 0 0 0 2-1.5L22 7H6" />
      <circle cx="10" cy="21" r="1" />
      <circle cx="18" cy="21" r="1" />
    </svg>
  );
}
export function AddToCart({ product }: { product: ContentRow }) {
  const { change, busy, pending, loading, user, cached, online } = useCart();
  const [variant, setVariant] = useState(""),
    [quantity, setQuantity] = useState(1),
    [message, setMessage] = useState("");
  const parsed = catalogProductSchema.safeParse(product);
  if (!parsed.success) return null;
  const options = parsed.data.catalogOptions;
  const valid =
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 100 &&
    (!options.length || options.includes(variant));
  return (
    <div className="cartAdd107">
      {options.length > 0 && (
        <label>
          <span>Mẫu sản phẩm</span>
          <select
            value={variant}
            disabled={busy || pending}
            onChange={(e) => {
              setVariant(e.target.value);
              setMessage("");
            }}
          >
            <option value="">Chọn mẫu</option>
            {options.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        <span>Số lượng</span>
        <input
          type="number"
          min={1}
          max={100}
          step={1}
          value={quantity}
          disabled={busy || pending}
          onChange={(e) => {
            setQuantity(Number(e.target.value));
            setMessage("");
          }}
        />
      </label>
      <button
        type="button"
        className="cartAddButton107"
        disabled={
          !valid ||
          loading ||
          busy ||
          pending ||
          (!!user && (cached || !online))
        }
        onClick={async () => {
          if (
            await change({
              action: "merge",
              items: [
                {
                  productId: product.id,
                  variant,
                  quantity,
                  lineId: crypto.randomUUID(),
                },
              ],
            })
          )
            setMessage("Đã thêm vào giỏ.");
          else setMessage("Chưa thêm được. Mở giỏ để kiểm tra và thử lại.");
        }}
      >
        <CartIcon />
        {busy ? "Đang lưu…" : "Thêm vào giỏ"}
      </button>
      {message && (
        <p role="status">
          {message} <Link to="/cart">Xem giỏ hàng</Link>
        </p>
      )}
    </div>
  );
}
