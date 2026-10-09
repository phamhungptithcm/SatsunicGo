import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { ActionPreview } from "../../../packages/domain/action-preview";
import type { ShoppingDraft } from "../../../packages/domain/ask-workflow";
import type { z } from "zod";
import type { itemSchema } from "../../../packages/domain";
import styles from "./ActionWindow.module.css";
export function actionLabel(action: string, vi: boolean) {
  const labels: Record<string, [string, string]> = {
    submitRequest: ["Gửi yêu cầu mua hộ", "Send buying request"],
    catalogCheckout: ["Tạo đơn sản phẩm", "Create product order"],
    acceptQuote: ["Chấp nhận báo giá", "Accept quote"],
    approveFinal: ["Xác nhận tổng tiền cuối", "Confirm final total"],
    confirmReceipt: ["Xác nhận đã nhận đủ hàng", "Confirm all items received"],
  };
  return (
    labels[action]?.[vi ? 0 : 1] ?? (vi ? "Kiểm tra tác vụ" : "Review task")
  );
}
export function ActionWindow({
  children,
  title,
  visible,
  vi,
  preview,
  status,
  notice,
  blocked,
  readOnly,
  onBack,
  onEdit,
  onConfirm,
  onRendered,
  pending,
  onResume,
}: {
  children: ReactNode;
  title: string;
  visible: boolean;
  vi: boolean;
  preview: ActionPreview | null;
  status: "editing" | "reviewing" | "executing" | "unknown" | "confirmed";
  notice: "unavailable" | "stale" | null;
  blocked: boolean;
  readOnly: boolean;
  onBack: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onRendered: (id: string) => void;
  pending: boolean;
  onResume: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const renderedCallback = useRef(onRendered);
  renderedCallback.current = onRendered;
  useLayoutEffect(() => {
    if (!visible || readOnly) return;
    heading.current?.focus({ preventScroll: true });
  }, [visible, preview?.id, readOnly]);
  useLayoutEffect(() => {
    if (visible && !readOnly && preview && status === "reviewing")
      renderedCallback.current(preview.id);
  }, [visible, preview?.id, readOnly, status]);
  const t = (a: string, b: string) => (vi ? a : b);
  const locked =
    blocked || readOnly || status === "executing" || status === "unknown";
  return (
    <section
      className={styles.window}
      aria-labelledby="ask-task-heading"
      data-visible={visible}
      data-review={!!preview}
    >
      <header className={styles.heading}>
        <div>
          <span>{t("Tác vụ hiện tại", "Current task")}</span>
          <h2 id="ask-task-heading" ref={heading} tabIndex={-1}>
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          aria-label={t("Về hội thoại", "Back to conversation")}
        >
          ↩
        </button>
      </header>
      <div className={styles.body}>
        {readOnly && (
          <p role="status">
            {t(
              "Đang xem lịch sử. Về tác vụ hiện tại để tiếp tục.",
              "Viewing history. Return to the current task to continue.",
            )}
          </p>
        )}
        {preview && (
          <div
            className={styles.review}
            aria-label={t("Nội dung cần xác nhận", "Details to confirm")}
          >
            <h3>{actionLabel(preview.command.action, vi)}</h3>
            {preview.command.action === "confirmReceipt" && (
              <p>
                {t(
                  "Xác nhận đã nhận đủ hàng sẽ hoàn tất đơn hàng.",
                  "Confirming receipt of every item completes the order.",
                )}
              </p>
            )}
            {preview.command.action === "submitRequest" && (
              <>
                <p>
                  {t("Mua từ", "Source market")}:{" "}
                  {(preview.command.payload as ShoppingDraft).market}
                </p>
                <ul>
                  {(
                    preview.command.payload as {
                      items: z.infer<typeof itemSchema>[];
                    }
                  ).items.map((item, index) => (
                    <li key={index}>
                      {item.name} ·{" "}
                      {item.variant ||
                        t("Chưa chọn phiên bản", "Variant unspecified")}{" "}
                      · {item.quantity}
                      {item.condition && (
                        <>
                          {" "}
                          ·{" "}
                          {item.condition === "new"
                            ? t("Hàng mới", "New")
                            : item.condition === "used"
                              ? t("Đã qua sử dụng", "Used")
                              : t("Mới hoặc đã qua sử dụng", "New or used")}
                        </>
                      )}
                      {item.url && (
                        <div>
                          {t("Link sản phẩm", "Product link")}: {item.url}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {(preview.command.payload as ShoppingDraft).notes && (
                  <p>
                    {t("Ghi chú", "Notes")}:{" "}
                    {(preview.command.payload as ShoppingDraft).notes}
                  </p>
                )}
                {(preview.command.payload as ShoppingDraft).preferredStore && (
                  <p>
                    {t("Nơi mua ưu tiên", "Preferred store")}:{" "}
                    {(preview.command.payload as ShoppingDraft).preferredStore}
                  </p>
                )}
                {(preview.command.payload as ShoppingDraft).budget !==
                  undefined && (
                  <p>
                    {t("Ngân sách dự kiến", "Requested budget")}:{" "}
                    {new Intl.NumberFormat(vi ? "vi-VN" : "en-US", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(
                      (preview.command.payload as ShoppingDraft).budget!,
                    )}
                  </p>
                )}
                {(preview.command.payload as ShoppingDraft).desiredAt && (
                  <p>
                    {t("Ngày muốn nhận", "Requested delivery date")}:{" "}
                    {new Date(
                      (preview.command.payload as ShoppingDraft).desiredAt!,
                    ).toLocaleDateString(vi ? "vi-VN" : "en-US")}
                  </p>
                )}
              </>
            )}
            <dl className={styles.details}>
              {preview.details
                .filter((detail) => !detail.secondary)
                .map((detail, index) => (
                  <div
                    key={index}
                    data-wide={
                      index === 0 ||
                      detail.kind === "time" ||
                      preview.command.action === "confirmReceipt"
                    }
                  >
                    <dt>{vi ? detail.vi : detail.en}</dt>
                    <dd>
                      {detail.kind === "money"
                        ? new Intl.NumberFormat(vi ? "vi-VN" : "en-US", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(Number(detail.value))
                        : detail.kind === "time"
                          ? new Date(Number(detail.value)).toLocaleString(
                              vi ? "vi-VN" : "en-US",
                            )
                          : detail.value}
                    </dd>
                  </div>
                ))}
            </dl>
            <p>
              {preview.command.action === "submitRequest"
                ? t(
                    "Gửi nhân viên kiểm tra và báo giá. Chưa mua hoặc thanh toán.",
                    "Send to staff for review and quotation. No purchase or payment yet.",
                  )
                : preview.command.action === "catalogCheckout"
                  ? t(
                      "Tạo đơn theo lựa chọn đã kiểm tra. Kiểm tra thông tin nhận hàng trước khi thanh toán toàn bộ. Bước này chưa thu tiền.",
                      "Create an order for the reviewed selection. Review delivery details before paying in full. This step does not collect payment.",
                    )
                  : preview.command.action === "confirmReceipt"
                    ? t(
                        "Chỉ xác nhận khi đã nhận đủ mọi sản phẩm trong đơn. Xác nhận sẽ hoàn tất đơn hàng.",
                        "Confirm only after receiving every item in the order. This completes the order.",
                      )
                    : t(
                        "Kiểm tra đơn hàng và số tiền trước khi xác nhận. Bước này chưa thu tiền.",
                        "Review the order and amount before confirming. This step does not collect payment.",
                      )}
            </p>
            {status === "reviewing" && !readOnly && (
              <p>
                {t(
                  "Nhắn “đồng ý” để xác nhận, hoặc “chưa” để quay lại kiểm tra.",
                  "Reply “yes” to confirm, or “not yet” to return to review.",
                )}
              </p>
            )}{" "}
            {preview.details.some((detail) => detail.secondary) && (
              <details>
                <summary>
                  {t("Thông tin tham chiếu", "Reference details")}
                </summary>
                <dl className={styles.details}>
                  {preview.details
                    .filter((detail) => detail.secondary)
                    .map((detail, index) => (
                      <div key={index}>
                        <dt>{vi ? detail.vi : detail.en}</dt>
                        <dd>{detail.value}</dd>
                      </div>
                    ))}
                </dl>
              </details>
            )}
          </div>
        )}
        {notice && (
          <p role="status">
            {notice === "stale"
              ? t(
                  "Thông tin đã đổi. Kiểm tra lại trước khi xác nhận.",
                  "Details changed. Review again before confirming.",
                )
              : t(
                  "Chưa thể xác nhận. Kiểm tra kết nối và thông tin đã lưu trước khi thử lại.",
                  "Confirmation is unavailable. Check the connection and saved details before retrying.",
                )}
          </p>
        )}
        <fieldset
          className={styles.fields}
          disabled={locked || !!preview}
          inert={locked || !!preview}
        >
          {children}
        </fieldset>
      </div>
      <footer className={styles.footer}>
        {pending ? (
          <>
            <p role="status">
              {t(
                "Tác vụ đang chờ đối chiếu. Về hội thoại không hủy tác vụ đã gửi.",
                "This action needs reconciliation. Returning to chat does not cancel it.",
              )}
            </p>
            <button
              type="button"
              onClick={onResume}
              disabled={readOnly || blocked}
            >
              {t("Đối chiếu tác vụ", "Reconcile action")}
            </button>
          </>
        ) : status === "executing" || status === "unknown" ? (
          <p role="status">
            {status === "executing"
              ? t("Đang gửi tác vụ…", "Sending this action…")
              : t(
                  "Kết quả chưa rõ. Đối chiếu thao tác đang chờ trước khi gửi lại.",
                  "The result is unknown. Reconcile the pending action before retrying.",
                )}
          </p>
        ) : status === "confirmed" ? (
          <p role="status">
            {t(
              "Tác vụ đã được ghi nhận. Xem trạng thái đơn để tiếp tục.",
              "The action was recorded. Check the order status for the next step.",
            )}
          </p>
        ) : preview ? (
          <>
            <button type="button" onClick={onEdit} disabled={locked}>
              {t("Sửa thông tin", "Edit details")}
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={onConfirm}
              disabled={locked || status !== "reviewing"}
            >
              {actionLabel(preview.command.action, vi)}
            </button>
          </>
        ) : (
          <p>
            {t(
              "Kiểm tra và chỉnh thông tin tại đây.",
              "Review and edit the details here.",
            )}
          </p>
        )}
      </footer>
    </section>
  );
}
