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
        {p.catalogOptions.length > 0 && (
          <label>
            <span className="formLabelText">
              {vi ? "Màu / size / phiên bản" : "Color / size / variant"}{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <select
              value={choice.variant}
              required
              disabled={commerce.busy || !!commerce.pendingOperation}
              onChange={(event) =>
                onChange({ ...choice, variant: event.target.value })
              }
            >
              <option value="">
                {vi ? "Chọn phiên bản" : "Choose variant"}
              </option>
              {p.catalogOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
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
            ? "Anh/chị có thể sửa bằng chat, ví dụ “số lượng 2”. Kiểm tra mẫu và tổng tiền, rồi nhắn “xác nhận lựa chọn và tạo đơn”."
            : "Edit by chat: “quantity 2”. Review the variant and total, then type “confirm selection and create order”."}
        </p>
        <p>
          {vi
            ? "Giá được kiểm tra lại khi tạo đơn. Hàng trong danh mục thanh toán đủ trước khi xử lý."
            : "The price is checked again when creating the order. Catalog orders require full payment before processing."}{" "}
          {vi ? "Điều khoản" : "Terms"}: {p.termsVersion}
        </p>
        {!valid && (
          <p role="status">
            {vi
              ? "Chọn mẫu hợp lệ và số lượng từ 1 đến 100. Nếu lựa chọn đã cũ, hãy tìm sản phẩm lại."
              : "Choose an available variant and a quantity from 1 to 100. Search again if this selection has expired."}
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
          {vi ? "Kiểm tra lựa chọn" : "Review selection"}
        </button>
      </form>
    </section>
  );
}
