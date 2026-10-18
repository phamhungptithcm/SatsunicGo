import { CatalogOption } from "../products/CatalogOption";
import {
  catalogChatSelection,
  type CatalogChatChoice,
  type CatalogChatScope,
} from "../../../packages/domain/catalog-chat";
import type { Commerce } from "./Commerce";
import styles from "./Ask.module.css";
export function CatalogChat({
  choice,
  scope,
  onChange,
  onConfirm,
  commerce,
  vi,
}: {
  choice: CatalogChatChoice;
  scope: CatalogChatScope;
  onChange: (choice: CatalogChatChoice) => void;
  onConfirm: () => void;
  commerce: Commerce;
  vi: boolean;
}) {
  const valid = catalogChatSelection(choice, scope),
    p = choice.product;
  const money = (amount: number) =>
    `${amount.toLocaleString(vi ? "vi-VN" : "en-US")} ₫`;
  return (
    <section
      className={styles.commerce}
      aria-label={vi ? "Sản phẩm đang chọn" : "Selected product"}
    >
      <h3>{p.title}</h3>
      <p>
        {vi ? "Mua từ" : "Source market"}: {p.market} ·{" "}
        {vi ? "Giá mỗi sản phẩm" : "Price per item"}: {money(p.listedPrice)}
      </p>
      <form
        className={styles.inlineForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (
            valid &&
            commerce.user &&
            !commerce.busy &&
            !commerce.pendingOperation
          )
            onConfirm();
        }}
      >
        <CatalogOption
          options={p.catalogOptions}
          value={choice.variant}
          vi={vi}
          disabled={commerce.busy || !!commerce.pendingOperation}
          onChange={(variant) => onChange({ ...choice, variant })}
        />
        <label>
          <span className="formLabelText">
            {vi ? "Số lượng" : "Quantity"}{" "}
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
            value={choice.quantity || ""}
            disabled={commerce.busy || !!commerce.pendingOperation}
            onChange={(event) =>
              onChange({ ...choice, quantity: event.target.valueAsNumber || 0 })
            }
          />
        </label>
        {valid && (
          <p>
            <strong>
              {vi ? "Tổng tiền" : "Total"}:{" "}
              {money(p.listedPrice * choice.quantity)}
            </strong>
          </p>
        )}
        <p>
          {vi
            ? "Anh/chị có thể nhắn để sửa mẫu hoặc số lượng. Kiểm tra lựa chọn trước khi thêm vào giỏ."
            : "Ask to change the variant or quantity. Review your selection before adding it to the cart."}
        </p>
        <p>
          {vi
            ? "Giá được kiểm tra lại trước khi thêm vào giỏ và khi đặt mua. Chưa tạo đơn hoặc thanh toán ở bước này."
            : "The price is checked before adding to cart and at checkout. This step does not place or pay for an order."}{" "}
          {vi ? "Điều khoản" : "Terms"}: {p.termsVersion}
        </p>
        {!valid && (
          <p role="status">
            {vi
              ? "Chọn quy cách hợp lệ và số lượng từ 1 đến 100. Nếu lựa chọn đã cũ, hãy tìm sản phẩm lại."
              : "Choose an available product option and a quantity from 1 to 100. Search again if this selection has expired."}
          </p>
        )}
        <button
          type="submit"
          disabled={
            !valid ||
            !commerce.user ||
            commerce.busy ||
            !!commerce.pendingOperation
          }
        >
          {vi ? "Thêm vào giỏ" : "Add to cart"}
        </button>
      </form>
    </section>
  );
}
