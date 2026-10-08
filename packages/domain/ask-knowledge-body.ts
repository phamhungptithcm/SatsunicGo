import { validateBody, type RichNode } from "./blog-studio";

/** Preserve structure; tables repeat explicit headers with each atomic row. */
export function knowledgeBody(value: unknown): string {
  const root = validateBody(value);
  const inline = (node: RichNode): string =>
    node.type === "hardBreak"
      ? "\n"
      : [node.text ?? "", ...(node.content ?? []).map(inline)].join("");
  const block = (node: RichNode): string => {
    if (node.type === "table") {
      const rows = node.content ?? [];
      const headers = rows.filter(
        (row) =>
          row.content?.length &&
          row.content.every((cell) => cell.type === "tableHeader"),
      );
      if (!headers.length) throw Error("KNOWLEDGE_TABLE_REQUIRES_HEADERS");
      const header = headers
        .map((row) => row.content!.map(inline).join(" | "))
        .join("\n");
      return rows
        .filter((row) => !headers.includes(row))
        .map((row) => {
          const text = `${header}\n${(row.content ?? []).map(inline).join(" | ")}`;
          if (text.length > 1000) throw Error("KNOWLEDGE_TABLE_ROW_TOO_LONG");
          return text;
        })
        .join("\n\n");
    }
    if (node.type === "heading")
      return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${inline(node)}`;
    if (node.type === "paragraph" || node.type === "codeBlock")
      return inline(node);
    if (node.type === "listItem")
      return `- ${(node.content ?? []).map(block).join("\n")}`;
    return (node.content ?? []).map(block).filter(Boolean).join("\n\n");
  };
  return block(root);
}
