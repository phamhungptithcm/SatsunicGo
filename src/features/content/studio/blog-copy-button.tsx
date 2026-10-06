"use client";
import { useEffect, useRef, useState } from "react";
import { BlogToast } from "./toast";
import { BlogIcon } from "./source-ui";
export function BlogCopyButton({
  text,
  fragment,
  vi = false,
}: {
  text?: string;
  fragment?: string;
  vi?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "copying" | "done" | "error">(
    "idle",
  );
  const copying = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const label = fragment
    ? vi
      ? "Sao chép link mục này"
      : "Copy section link"
    : vi
      ? "Sao chép code"
      : "Copy code";
  const feedback =
    status === "done"
      ? vi
        ? "Đã sao chép"
        : "Copied"
      : status === "error"
        ? vi
          ? "Chưa sao chép được. Bạn có thể chọn và sao chép thủ công."
          : "Could not copy. Select and copy manually."
        : label;
  return (
    <span className="blog-copy-control">
      <button
        type="button"
        disabled={status === "copying"}
        aria-label={feedback}
        title={feedback}
        onClick={async () => {
          if (copying.current) return;
          copying.current = true;

          setStatus("copying");
          try {
            if (!navigator.clipboard?.writeText)
              throw new Error("CLIPBOARD_UNAVAILABLE");
            let value = text ?? "";
            if (fragment) {
              const url = new URL(window.location.href);
              url.search = "";
              url.hash = fragment;
              value = url.toString();
            }
            await navigator.clipboard.writeText(value);
            if (alive.current) setStatus("done");
          } catch {
            if (alive.current) setStatus("error");
          } finally {
            copying.current = false;
          }
        }}
      >
        <BlogIcon
          name={status === "done" ? "check" : fragment ? "link" : "copy"}
          size={15}
        />
      </button>
      {(status === "done" || status === "error") && (
        <BlogToast
          text={feedback}
          kind={status === "done" ? "success" : "error"}
          language={vi ? "vi" : "en"}
          onClose={() => setStatus("idle")}
        />
      )}
    </span>
  );
}
