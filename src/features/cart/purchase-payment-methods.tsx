import { useId } from "react";
import type { PurchasePaymentMethod } from "./purchase-payment-selection";

const methods = [
  {
    value: "BANK_TRANSFER",
    label: "QR chuyển khoản ngân hàng",
    description: "Quét mã bằng ứng dụng ngân hàng.",
  },
  {
    value: "NAPAS_BANK_TRANSFER",
    label: "QR NAPAS chuyển khoản",
    description: "",
  },
  {
    value: "CARD",
    label: "Thẻ ngân hàng",
    description: "Visa, Mastercard, JCB",
  },
] as const;

function MethodIcon({ method }: { method: PurchasePaymentMethod }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {method === "BANK_TRANSFER" ? (
        <path d="m3 8 9-5 9 5M4 9h16M4 20h16M7 12v5m5-5v5m5-5v5" />
      ) : method === "NAPAS_BANK_TRANSFER" ? (
        <path d="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6v-3m6-3v-3h-3m-6 0v3" />
      ) : (
        <>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M2 10h20M6 15h4" />
        </>
      )}
    </svg>
  );
}

/** Local selection only. The caller obtains availability from the server. */
export function PurchasePaymentMethods({
  value,
  enabledMethods,
  onChange,
  disabled = false,
}: {
  value: PurchasePaymentMethod | null;
  enabledMethods: readonly PurchasePaymentMethod[];
  onChange: (method: PurchasePaymentMethod) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="purchaseMethods" disabled={disabled}>
      <legend>Phương thức thanh toán</legend>
      <div className="purchaseMethodOptions">
        {methods.map((method) => {
          // The first sandbox release supports bank-transfer QR only.
          const available =
            method.value === "BANK_TRANSFER" &&
            enabledMethods.includes(method.value);
          const selected = available && value === method.value;
          const descriptionId = `${id}-${method.value}-description`;
          return (
            <label
              key={method.value}
              className={`purchaseMethod purchaseMethod--${method.value.toLowerCase()}${selected ? " isSelected" : ""}${!available ? " isUnavailable" : ""}`}
            >
              <span className="purchaseMethodIcon">
                <MethodIcon method={method.value} />
              </span>
              <span className="purchaseMethodCopy">
                <span className="purchaseMethodLabel">{method.label}</span>
                <span id={descriptionId} className="purchaseMethodDescription">
                  {method.description}
                  {method.description && !available ? " · " : ""}
                  {!available && "Chưa khả dụng"}
                </span>
              </span>
              <input
                type="radio"
                name={`${id}-payment-method`}
                value={method.value}
                aria-label={method.label}
                aria-describedby={descriptionId}
                checked={selected}
                disabled={!available}
                onChange={() => {
                  if (available && !disabled) onChange(method.value);
                }}
              />
            </label>
          );
        })}
      </div>
      {!enabledMethods.includes("BANK_TRANSFER") && (
        <p className="purchaseMethodNotice" role="status">
          Chưa có phương thức thanh toán khả dụng. Tải lại thông tin để kiểm
          tra.
        </p>
      )}
    </fieldset>
  );
}
