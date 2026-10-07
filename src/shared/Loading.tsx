import { useEffect, useState, type ReactNode } from "react";
import { beginProgress } from "./feedback";
import "./loading.css";

/** Mounted load ownership is released on success, failure, route change and unmount. */
export function LoadingState({
  children,
  className = "",
  overlay = false,
}: {
  children: ReactNode;
  className?: string;
  overlay?: boolean;
}) {
  useEffect(() => (overlay ? beginProgress() : undefined), [overlay]);
  return (
    <div className={`loadingState ${className}`} role="status" aria-busy="true">
      <span className="loadingRing loadingRing--inline" aria-hidden="true" />
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
    <div className="loadingOverlay">
      <div
        className="loadingOverlayCard"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="loadingBeam" aria-hidden="true">
          <span />
        </span>
        <strong>Đang xử lý…</strong>
        <p>
          {slow
            ? "Thao tác đang cần thêm thời gian."
            : "Thông tin sẽ cập nhật khi có kết quả."}
        </p>
      </div>
    </div>
  );
}
