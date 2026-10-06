export const IMAGE_BYTES = 5 * 1024 * 1024;
export function imageDimension(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 10000
    ? Math.round(value)
    : null;
}
export function transferFiles(
  data: Pick<DataTransfer, "files" | "items">,
): File[] {
  const direct = Array.from(data.files);
  if (direct.length) return direct;
  return Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}
export function singleImageUrl(html: string, text: string): string | null {
  if (html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const images = doc.querySelectorAll("img");
    if (images.length !== 1 || doc.body.textContent?.trim()) return null;
    return images[0].getAttribute("src");
  }
  return /^https:\/\/\S+\.(png|jpe?g|webp|gif)(?:[?#]\S*)?$/i.test(text)
    ? text
    : null;
}
export async function fetchImageFile(
  src: string,
  signal?: AbortSignal,
): Promise<File> {
  const url = new URL(src);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Lưu ảnh về máy rồi kéo vào bài nhé.");
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    if (!response.ok || !response.body) throw new Error("Không tải được ảnh.");
    const type =
      response.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type))
      throw new Error("Chọn ảnh JPG, PNG, WebP hoặc GIF.");
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > IMAGE_BYTES) throw new Error("Ảnh tối đa 5 MB.");
        chunks.push(new Uint8Array(value));
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    return new File(chunks, "pasted-image", { type });
  } catch (error) {
    if (
      error instanceof Error &&
      ["Ảnh tối đa 5 MB.", "Chọn ảnh JPG, PNG, WebP hoặc GIF."].includes(
        error.message,
      )
    )
      throw error;
    throw new Error(
      "Không lấy được ảnh từ trang này. Lưu ảnh về máy rồi kéo vào bài nhé.",
    );
  } finally {
    clearTimeout(timeout);
    controller.abort();
    signal?.removeEventListener("abort", abort);
  }
}
