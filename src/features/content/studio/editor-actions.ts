import type { EditorState, Transaction } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";

export const slashItems = [
  { id: "h2", label: "Tiêu đề", search: "heading h2 tieu de" },
  { id: "h3", label: "Tiêu đề nhỏ", search: "heading h3 tieu de nho" },
  { id: "list", label: "Danh sách", search: "list danh sach" },
  {
    id: "ordered",
    label: "Danh sách đánh số",
    search: "ordered number danh sach danh so",
  },
  { id: "quote", label: "Trích dẫn", search: "quote trich dan" },
  { id: "table", label: "Bảng", search: "table bang" },
  { id: "image", label: "Ảnh hoặc GIF", search: "image photo anh gif" },
  { id: "code", label: "Khối code", search: "code ma" },
] as const;
export type SlashId = (typeof slashItems)[number]["id"];
export function matchingSlashItems(query: string) {
  const normalized = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");
  return slashItems.filter((item) => item.search.includes(normalized));
}
export function slashRange(state: EditorState) {
  const { $from, empty } = state.selection;
  if (!empty || $from.parent.type.name !== "paragraph" || $from.depth !== 1)
    return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, "", "\ufffc");
  // Only an otherwise empty paragraph is a command, never URLs or normal prose.
  if (
    !/^\/[\p{L}\p{N} ]{0,30}$/u.test(before) ||
    $from.parentOffset !== $from.parent.content.size
  )
    return null;
  return { from: $from.start(), to: $from.pos, query: before.slice(1) };
}
export type BlockAction = "up" | "down" | "duplicate" | "delete";
export function blockTransaction(
  state: EditorState,
  action: BlockAction,
): Transaction | null {
  const index = state.selection.$from.index(0);
  if (index >= state.doc.childCount) return null;
  const node = state.doc.child(index);
  let pos = 0;
  for (let i = 0; i < index; i++) pos += state.doc.child(i).nodeSize;
  const tr = state.tr;
  let target = pos;
  if (action === "up") {
    if (index === 0) return null;
    target = pos - state.doc.child(index - 1).nodeSize;
    tr.delete(pos, pos + node.nodeSize).insert(target, node);
  } else if (action === "down") {
    if (index === state.doc.childCount - 1) return null;
    target = pos + state.doc.child(index + 1).nodeSize;
    tr.delete(pos, pos + node.nodeSize).insert(target, node);
  } else if (action === "duplicate") {
    target = pos + node.nodeSize;
    tr.insert(target, node);
  } else {
    tr.delete(pos, pos + node.nodeSize);
    target = Math.min(pos, tr.doc.content.size);
  }
  tr.setSelection(
    TextSelection.near(
      tr.doc.resolve(Math.min(target + 1, tr.doc.content.size)),
    ),
  );
  return tr.scrollIntoView();
}
export function imageFileError(
  file: Pick<File, "type" | "size">,
): string | null {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
  )
    return "Chọn ảnh JPG, PNG, WebP hoặc GIF.";
  if (file.size > 5 * 1024 * 1024) return "Ảnh cần nhỏ hơn 5 MB.";
  return null;
}
