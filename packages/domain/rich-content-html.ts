import { validateBody, type RichNode } from "./blog-studio";
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
/** Strict validated tree only. Never accepts stored HTML or arbitrary attributes. */
export function richContentHtml(body: unknown): string {
  const root = validateBody(body);
  function render(n: RichNode): string {
    const children = (n.content ?? []).map(render).join("");
    if (n.type === "text") {
      let result = escape(n.text ?? "");
      for (const mark of n.marks ?? []) {
        const tag: Record<string, string> = {
          bold: "strong",
          italic: "em",
          strike: "s",
          underline: "u",
          code: "code",
        };
        if (mark.type === "link")
          result = `<a href="${escape(String(mark.attrs!.href))}" target="_blank" rel="noopener noreferrer">${result}</a>`;
        else result = `<${tag[mark.type]}>${result}</${tag[mark.type]}>`;
      }
      return result;
    }
    if (n.type === "doc") return children;
    if (n.type === "hardBreak") return "<br>";
    if (n.type === "horizontalRule") return "<hr>";
    if (n.type === "image")
      return `<img src="${escape(String(n.attrs!.src))}" alt="${escape(String(n.attrs!.alt ?? ""))}" loading="lazy" style="max-width:100%;height:auto">`;
    if (n.type === "codeBlock") return `<pre><code>${children}</code></pre>`;
    if (n.type === "heading")
      return `<h${Number(n.attrs!.level)}>${children}</h${Number(n.attrs!.level)}>`;
    if (n.type === "orderedList")
      return `<ol start="${Number(n.attrs!.start)}">${children}</ol>`;
    if (n.type === "tableCell" || n.type === "tableHeader") {
      const tag = n.type === "tableCell" ? "td" : "th";
      return `<${tag} colspan="${Number(n.attrs!.colspan)}" rowspan="${Number(n.attrs!.rowspan)}">${children}</${tag}>`;
    }
    const tags: Record<string, string> = {
      paragraph: "p",
      bulletList: "ul",
      listItem: "li",
      blockquote: "blockquote",
      table: "table",
      tableRow: "tr",
    };
    return `<${tags[n.type]}>${n.type === "table" ? `<tbody>${children}</tbody>` : children}</${tags[n.type]}>`;
  }
  return render(root);
}
