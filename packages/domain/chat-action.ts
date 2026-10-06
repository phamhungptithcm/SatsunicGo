import { nextCustomerAction } from "./ask-workflow";
import { requestSchema, type Order } from "./index";
export function customerChatAction(
  text: string,
  order: Order | null,
  draft: unknown,
) {
  const value = text
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "");
  if (
    !order &&
    /^(gửi yêu cầu( mua hộ)?|submit( buying)? request)$/.test(value) &&
    requestSchema.safeParse(draft).success
  )
    return "submitRequest";
  if (!order) return null;
  const next = nextCustomerAction(order);
  if (
    next === "acceptQuote" &&
    /^(chấp nhận báo giá|duyệt báo giá|accept quote)$/.test(value)
  )
    return "acceptQuote";
  if (
    next === "approveFinal" &&
    /^(duyệt tổng phí cuối|approve final total)$/.test(value)
  )
    return "approveFinal";
  if (
    next === "confirmReceipt" &&
    /^(mình đã nhận đủ hàng|tôi đã nhận đủ hàng|đã nhận đủ hàng|confirm all items received)$/.test(
      value,
    )
  )
    return "confirmReceipt";
  return null;
}
