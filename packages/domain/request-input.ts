/** One product per composer; never infer multiple order lines or product identity. */
export function normalizeRequestInput(text: string, hasImages = false) {
  const trimmed = text.trim();
  const match = trimmed.match(/https?:\/\/[^\s]*/i);
  const url = match?.[0].replace(/[),.;!?]+$/, "") ?? "";
  let host = "link sản phẩm";
  if (url) {
    try {
      host = new URL(url).hostname;
    } catch {
      /* Schema reports malformed URL on submit. */
    }
  }
  const name =
    (url ? trimmed.replace(match![0], "").trim() : trimmed) ||
    (url ? `Sản phẩm từ ${host}` : hasImages ? "Sản phẩm theo ảnh" : "");
  return { name, url };
}
export function requestInputText(item: { name: string; url?: string }) {
  return [item.name, item.url].filter(Boolean).join("\n");
}
