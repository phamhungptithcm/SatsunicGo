import { nextCustomerAction } from "./ask-workflow";
import { requestSchema, type Order } from "./index";
export function customerChatAction(
  text: string,
  order: Order | null,
  draft: unknown,
) {
  // A question is not action consent, including full-width punctuation.
  if (text.length > 1000 || /[?？]/u.test(text)) return null;
  const value = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/gu, "d")
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .replace(/[.!]+$/gu, "")
    .trim()
    .replace(/^(?:(?:minh|toi|anh|chi) (?:dong y )?|dong y |please )/u, "")
    .replace(/ (?:nhe|nha|giup minh|giup toi)$/u, "");
  if (
    !order &&
    /^(gui yeu cau( mua ho)?|submit( buying)? request)$/.test(value) &&
    requestSchema.safeParse(draft).success
  )
    return "submitRequest";
  if (!order) return null;
  const next = nextCustomerAction(order);
  if (
    next === "acceptQuote" &&
    /^(chap nhan bao gia|duyet bao gia|accept quote)$/.test(value)
  )
    return "acceptQuote";
  if (
    next === "approveFinal" &&
    /^(duyet tong phi cuoi|approve final total)$/.test(value)
  )
    return "approveFinal";
  if (
    next === "confirmReceipt" &&
    /^(minh da nhan du hang|toi da nhan du hang|da nhan du hang|confirm all items received)$/.test(
      value,
    )
  )
    return "confirmReceipt";
  return null;
}
