import { useEffect, useState, type ReactNode } from "react";
import { beginProgress } from "./feedback";
import "./loading.css";

/** Shared indeterminate visual; the surrounding status supplies its accessible name. */
export function LoadingBar() {
  return (
    <span className="loadingBar" aria-hidden="true">
      <span />
    </span>
  );
}

/** Mounted load ownership is released on success, failure, route change and unmount. */
export function LoadingState({
  children,
  className = "",
  overlay = false,
  variant = "inline",
}: {
  children: ReactNode;
  className?: string;
  overlay?: boolean;
  variant?: "inline" | "panel" | "overlay";
}) {
  useEffect(() => (overlay ? beginProgress() : undefined), [overlay]);
  if (variant === "overlay") {
    return (
      <div className={`loadingOverlay ${className}`}>
        <div
          className="loadingOverlayCard"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-busy="true"
        >
          <LoadingBar />
          <div>{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`loadingState loadingState--${variant} ${className}`}
      role="status"
      aria-busy="true"
    >
      <LoadingBar />
      <div>{children}</div>
    </div>
  );
}

/** Visual waiting layer; recovery controls beneath stay reachable without a focus trap. */
export function LoadingOverlay() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setSlow(true), 10_000);
    return () => clearTimeout(timeout);
  }, []);
  return (
    <LoadingState variant="overlay">
      <strong>Đang xử lý…</strong>
      <p>
        {slow
          ? "Thao tác đang cần thêm thời gian."
          : "Thông tin sẽ cập nhật khi có kết quả."}
      </p>
    </LoadingState>
  );
}
