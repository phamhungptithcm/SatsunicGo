export function notificationTarget(action: string, orderId?: string) {
  if (
    action === "staffConversationUpdate" &&
    orderId &&
    /^[a-zA-Z0-9-]{1,80}$/.test(orderId)
  )
    return {
      path: `/crm/orders?order=${orderId}`,
      label: "Mở cuộc trao đổi của đơn",
    };
  if (action === "replyTicket")
    return { path: "/support", label: "Xem phản hồi" };
  if (
    action === "membershipActivated" ||
    action === "membershipExpired" ||
    action === "membershipExpiring"
  )
    return { path: "/membership", label: "Xem membership" };
  if (orderId && /^[a-zA-Z0-9-]{1,80}$/.test(orderId))
    return { path: `/account/orders/${orderId}`, label: "Xem đơn" };
  return { path: "/account", label: "Xem tài khoản" };
}
