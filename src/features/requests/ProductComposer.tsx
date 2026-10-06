import { useEffect, useRef, useState } from "react";
export type RequestImage = {
  line?: number;
  id: string;
  name: string;
  mime: string;
  base64: string;
  hash: string;
};
// Anonymous images survive the deliberate auth remount, never a private-account switch.
export const anonymousImageHandoff: { images: RequestImage[] } = { images: [] };
export function ProductComposer({
  value,
  onChange,
  images,
  onImages,
  disabled = false,
  readOnly = false,
  onReadingChange,
  limit = 6,
}: {
  value: string;
  onChange: (text: string) => void;
  images: RequestImage[];
  onImages: (images: RequestImage[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  onReadingChange?: (reading: boolean) => void;
  limit?: number;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false),
    [error, setError] = useState(""),
    [reading, setReading] = useState(false);
  const current = useRef(images),
    mounted = useRef(true),
    readingRef = useRef(false);
  current.current = images;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function add(files: File[]) {
    if (disabled || readingRef.current) return;
    readingRef.current = true;
    setReading(true);
    onReadingChange?.(true);
    setError("");
    const next = [...current.current];
    try {
      for (const file of files) {
        if (
          !file.size ||
          file.size > 2 * 1024 * 1024 ||
          !["image/png", "image/jpeg", "image/webp"].includes(file.type)
        )
          throw Error("Chọn PNG, JPEG hoặc WebP tối đa 2 MB mỗi ảnh.");
        if (next.length >= limit)
          throw Error("Mỗi yêu cầu nhận tối đa 6 ảnh ở bước này.");
        const bytes = await file.arrayBuffer();
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
        if (next.some((x) => x.hash === hash)) continue;
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () =>
            reject(Error("Chưa đọc được ảnh. Thử chọn lại."));
          reader.readAsDataURL(file);
        });
        next.push({
          id: crypto.randomUUID(),
          name: file.name || "Ảnh sản phẩm",
          mime: file.type,
          base64,
          hash,
        });
      }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      readingRef.current = false;
      if (mounted.current) {
        onImages(next);
        setReading(false);
        onReadingChange?.(false);
      }
    }
  }
  return (
    <div
      className="productComposer"
      data-dragging={dragging || undefined}
      onDragOver={(e) => {
        if (!disabled && Array.from(e.dataTransfer.types).includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragging(false);
      }}
      onDrop={(e) => {
        setDragging(false);
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          void add(Array.from(e.dataTransfer.files));
        }
      }}
    >
      <textarea
        aria-label="Tên, link hoặc ảnh sản phẩm"
        readOnly={readOnly}
        placeholder="Tên, link hoặc ảnh sản phẩm…"
        maxLength={2400}
        value={value}
        disabled={disabled || reading}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.items)
            .filter((x) => x.kind === "file")
            .map((x) => x.getAsFile())
            .filter((x): x is File => Boolean(x));
          if (files.length) {
            e.preventDefault();
            void add(files);
            const text = e.clipboardData.getData("text/plain");
            if (text && !readOnly) {
              const t = e.currentTarget;
              onChange(
                value.slice(0, t.selectionStart) +
                  text +
                  value.slice(t.selectionEnd),
              );
            }
          }
        }}
      />
      {!!images.length && (
        <div className="composerImages">
          {images.map((image) => (
            <div key={image.id}>
              <img
                src={`data:${image.mime};base64,${image.base64}`}
                alt={image.name}
              />
              <button
                type="button"
                disabled={disabled || reading}
                aria-label={`Xóa ${image.name}`}
                onClick={() =>
                  onImages(images.filter((x) => x.id !== image.id))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="composerBar">
        <button
          type="button"
          className="composerAttach"
          title="Thêm ảnh"
          aria-label="Thêm ảnh sản phẩm"
          disabled={disabled || reading}
          onClick={() => picker.current?.click()}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="9" cy="9" r="1.5" />
            <path d="m4 17 5-5 4 4 3-3 4 4" />
          </svg>
        </button>
        {reading && <span role="status">Đang đọc ảnh…</span>}
      </div>
      <input
        ref={picker}
        type="file"
        hidden
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          void add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {dragging && (
        <span className="composerDrop" aria-hidden="true">
          Thả ảnh vào đây
        </span>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
