import { z } from "zod";
import {
  catalogProductSchema,
  catalogSelectionSchema,
} from "./catalog-checkout";
import { parseChatDraftEdits } from "./chat-draft";
export type CatalogChatScope = {
  ownerId: string | null;
  conversationId: string | null;
};
export type CatalogChatContext = CatalogChatScope & {
  createdAt: number;
  stale: boolean;
  rows: unknown[];
};
export type CatalogChatChoice = CatalogChatScope & {
  createdAt: number;
  product: z.infer<typeof catalogProductSchema> & { id: string };
  quantity: number;
  variant: string;
};
type Action =
  | { kind: "updated"; choice: CatalogChatChoice }
  | { kind: "confirm"; selection: z.infer<typeof catalogSelectionSchema> }
  | { kind: "clarify" };
const fold = (raw: string) =>
  raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/gu, "d")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
function fresh(
  value: CatalogChatScope & { createdAt: number },
  scope: CatalogChatScope,
  now: number,
) {
  return (
    value.ownerId === scope.ownerId &&
    value.conversationId === scope.conversationId &&
    Number.isSafeInteger(value.createdAt) &&
    Number.isSafeInteger(now) &&
    now >= value.createdAt &&
    now - value.createdAt < 300000
  );
}
export function catalogChatSelection(
  choice: CatalogChatChoice | null,
  scope: CatalogChatScope,
  now = Date.now(),
) {
  if (!choice || !fresh(choice, scope, now)) return null;
  const p = catalogProductSchema.safeParse(choice.product),
    s = catalogSelectionSchema.safeParse({
      productId: choice.product.id,
      productVersion: choice.product.version,
      quantity: choice.quantity,
      variant: choice.variant,
    });
  if (
    !p.success ||
    !s.success ||
    !Number.isSafeInteger(p.data.version) ||
    (p.data.catalogOptions.length
      ? !p.data.catalogOptions.includes(s.data.variant)
      : s.data.variant !== "") ||
    !Number.isFinite(p.data.listedPrice * s.data.quantity) ||
    p.data.listedPrice * s.data.quantity > 1e12
  )
    return null;
  return s.data;
}
/** Select only the visible ordinal list. No fuzzy product/variant matching and
 * no payment authority. Choices expire and are scoped to their conversation. */
export function catalogChatAction(
  raw: string,
  context: CatalogChatContext | null,
  choice: CatalogChatChoice | null,
  scope: CatalogChatScope,
  now = Date.now(),
): Action | null {
  if (raw.length > 1000 || /[?？\n\r]/u.test(raw)) return null;
  const text = fold(raw)
    .replace(/[.!]+$/u, "")
    .trim()
    .replace(/^(?:please|(?:minh|toi|em|anh|chi)(?: muon)?) /u, "")
    .replace(/ (?:nhe|nha|please|giup minh|giup toi)$/u, "");
  const ordinal = text.match(
    /^(?:chon san pham(?: so)?|chon cai(?: thu)?|lay cai thu|select (?:product|item)) (\d+)$/u,
  );
  if (ordinal) {
    const index = Number(ordinal[1]) - 1;
    if (
      !context ||
      !fresh(context, scope, now) ||
      context.stale ||
      !Number.isSafeInteger(index) ||
      index < 0 ||
      index >= 100 ||
      index >= context.rows.length
    )
      return { kind: "clarify" };
    const row = context.rows[index] as { id?: unknown };
    const product = catalogProductSchema.safeParse(row);
    if (
      !product.success ||
      !Number.isSafeInteger(product.data.version) ||
      typeof row?.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/u.test(row.id)
    )
      return { kind: "clarify" };
    return {
      kind: "updated",
      choice: {
        ownerId: scope.ownerId,
        conversationId: scope.conversationId,
        createdAt: context.createdAt,
        product: { ...product.data, id: row.id },
        quantity: 1,
        variant:
          product.data.catalogOptions.length === 1
            ? product.data.catalogOptions[0]
            : "",
      },
    };
  }
  if (
    text === "xac nhan lua chon va tao don" ||
    text === "confirm selection and create order"
  ) {
    const selection = catalogChatSelection(choice, scope, now);
    return selection ? { kind: "confirm", selection } : { kind: "clarify" };
  }
  if (!choice) return null;
  const edits = parseChatDraftEdits(raw);
  if (!edits) return null;
  if (edits.kind === "clarify" || !fresh(choice, scope, now))
    return { kind: "clarify" };
  let next = { ...choice };
  for (const edit of edits.fields) {
    if (edit.field === "market") {
      if (edit.value !== choice.product.market) return { kind: "clarify" };
    }
    if (edit.field === "quantity") next = { ...next, quantity: edit.value };
    if (edit.field === "variant") {
      const options = choice.product.catalogOptions.filter(
        (option) => fold(option) === fold(edit.value),
      );
      if (options.length !== 1) return { kind: "clarify" };
      next = { ...next, variant: options[0] };
    }
  }
  return { kind: "updated", choice: next };
}
