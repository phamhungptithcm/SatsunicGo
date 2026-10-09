import { shoppingDraftSchema, type ShoppingDraft } from "./ask-workflow";
export type ChatDraftChange =
  { kind: "updated"; draft: ShoppingDraft } | { kind: "clarify" };
export type FieldEdit =
  | { field: "quantity"; value: number }
  | { field: "variant"; value: string }
  | { field: "market"; value: "US" | "JP" | "KR" };
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/gu, "d")
    .toLowerCase();
function fieldEdit(raw: string): FieldEdit | null {
  const text = raw
    .trim()
    .replace(/[.!]+$/u, "")
    .trim()
    .replace(
      /^(?:please|(?:mình|minh|tôi|toi|em|anh|chị|chi)(?: (?:muốn|muon))?)\s+/iu,
      "",
    )
    .replace(/^(?:chọn|chon)\s+(?=(?:size|mẫu|mau|variant)\b)/iu, "")
    .replace(
      /\s+(?:nhé|nhe|nha|please|giúp mình|giup minh|giúp tôi|giup toi)$/iu,
      "",
    );
  const normalized = fold(text).replace(/\s+/gu, " ");
  const quantity =
    normalized.match(
      /^(?:(?:doi )?so luong(?: thanh)?|quantity|make it)\s*[:=]?\s*(\d+)(?:\s+(?:cai|hop|chai|units|items))?$/u,
    ) ??
    normalized.match(/^(?:lay|mua|cho minh|cho toi) (\d+) (?:cai|hop|chai)$/u);
  if (quantity) return { field: "quantity", value: Number(quantity[1]) };
  const market = normalized.match(
    /^(?:thi truong|market|mua tu|dat tu|order from)(?:\s*[:=]\s*|\s+)(us|my|jp|nhat|japan|kr|han|han quoc|korea|south korea)$/u,
  );
  if (market)
    return {
      field: "market",
      value: ["us", "my"].includes(market[1])
        ? "US"
        : ["jp", "nhat", "japan"].includes(market[1])
          ? "JP"
          : "KR",
    };
  const variant = text.match(
    /^(?:đổi |doi )?(?:mẫu|mau|size|variant)(?: (?:thành|thanh|to))?(?:\s*[:=]\s*|\s+)(.+)$/iu,
  );
  return variant ? { field: "variant", value: variant[1].trim() } : null;
}
/** Explicit field clauses only. Validate the whole message before editing;
 * never execute a purchase, infer a product/price or extract private details. */
export function parseChatDraftEdits(
  raw: string,
): { kind: "fields"; fields: FieldEdit[] } | { kind: "clarify" } | null {
  if (raw.length > 1000 || /[?？\n\r]/u.test(raw)) return null;
  const clauses = raw.normalize("NFC").split(/[,;]|\s+(?:và|va|and)\s+/iu);
  const edits = clauses.map(fieldEdit);
  if (!edits.some(Boolean)) return null;
  if (clauses.length > 3 || edits.some((edit) => !edit))
    return { kind: "clarify" };
  const fields = edits as FieldEdit[];
  if (new Set(fields.map((edit) => edit.field)).size !== fields.length)
    return { kind: "clarify" };
  for (const edit of fields) {
    if (
      edit.field === "quantity" &&
      (!Number.isSafeInteger(edit.value) || edit.value < 1 || edit.value > 100)
    )
      return { kind: "clarify" };
    if (
      edit.field === "variant" &&
      (edit.value.length > 200 ||
        /\b(?:khong|not|quantity|so luong|market|thi truong|gui yeu cau|submit request|accept quote|thanh toan|refund|gia|price|paid|address|dia chi)\b/u.test(
          fold(edit.value),
        ))
    )
      return { kind: "clarify" };
  }
  return { kind: "fields", fields };
}
export function chatDraftChange(
  raw: string,
  current: unknown,
): ChatDraftChange | null {
  const edits = parseChatDraftEdits(raw);
  if (!edits || edits.kind === "clarify") return edits;
  const fields = edits.fields;
  const parsed = shoppingDraftSchema.safeParse(current);
  if (!parsed.success || !parsed.data.items?.length) return { kind: "clarify" };
  const draft = parsed.data;
  if (
    fields.some((edit) => edit.field !== "market") &&
    draft.items!.length !== 1
  )
    return { kind: "clarify" };
  let next: ShoppingDraft = draft;
  for (const edit of fields) {
    if (edit.field === "market") {
      next = { ...next, market: edit.value };
    } else {
      next = {
        ...next,
        items: [{ ...next.items![0], [edit.field]: edit.value }],
      };
    }
  }
  return { kind: "updated", draft: next };
}
