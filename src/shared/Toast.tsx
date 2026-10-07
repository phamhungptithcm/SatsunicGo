import "./toast.css";
import { LoadingOverlay } from "./Loading";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  createCountdown,
  dismissNotice,
  noticeSnapshot,
  progressSnapshot,
  overlayProgressSnapshot,
  subscribeNotice,
  subscribeProgress,
} from "./feedback";
export function ToastHost() {
  const notice = useSyncExternalStore(
    subscribeNotice,
    noticeSnapshot,
    noticeSnapshot,
  );
  const pending =
    useSyncExternalStore(
      subscribeProgress,
      progressSnapshot,
      progressSnapshot,
    ) > 0;
  const overlayPending =
    useSyncExternalStore(
      subscribeProgress,
      overlayProgressSnapshot,
      overlayProgressSnapshot,
    ) > 0;
  const [showPending, setShowPending] = useState(false),
    [remaining, setRemaining] = useState(5000);
  const [host, setHost] = useState<Element>(document.body);
  const timer = useRef<ReturnType<typeof createCountdown> | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const element = useRef<HTMLDivElement>(null),
    hovered = useRef(false);
  useEffect(() => {
    if (!overlayPending) {
      setShowPending(false);
      return;
    }
    const timeout = setTimeout(() => setShowPending(true), 400);
    return () => clearTimeout(timeout);
  }, [overlayPending]);
  useEffect(() => {
    const update = () =>
      setHost(document.querySelector("dialog[open]") ?? document.body);
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && !element.current?.contains(active))
      returnFocus.current = active;
    const countdown = createCountdown(5000, setRemaining, () =>
      dismissNotice(notice.id),
    );
    timer.current = countdown;
    countdown.hold("pending", pending);
    countdown.hold("hover", hovered.current);
    countdown.hold(
      "focus",
      !!element.current?.contains(document.activeElement),
    );
    const visibility = () => countdown.hold("hidden", document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      countdown.dispose();
      timer.current = null;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [notice?.id]);
  useEffect(() => {
    timer.current?.hold("pending", pending);
  }, [pending]);
  useEffect(() => {
    hovered.current = element.current?.matches(":hover") ?? false;
    timer.current?.hold("hover", hovered.current);
    timer.current?.hold(
      "focus",
      !!element.current?.contains(document.activeElement),
    );
  }, [host, notice?.id, showPending]);
  const text = notice?.text ?? "";
  if (!text)
    return overlayPending && showPending
      ? createPortal(<LoadingOverlay />, host)
      : null;
  return createPortal(
    <>
      {overlayPending && showPending && <LoadingOverlay />}
      <div
        ref={element}
        className="siteToast"
        data-kind={notice?.kind ?? "info"}
        onMouseEnter={() => {
          hovered.current = true;
          timer.current?.hold("hover", true);
        }}
        onMouseLeave={() => {
          hovered.current = false;
          timer.current?.hold("hover", false);
        }}
        onFocusCapture={() => timer.current?.hold("focus", true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget))
            timer.current?.hold("focus", false);
        }}
      >
        <span className="toastSymbol" aria-hidden="true">
          {notice?.kind === "success"
            ? "✓"
            : notice?.kind === "error"
              ? "!"
              : "i"}
        </span>
        <p
          role={notice?.kind === "error" ? "alert" : "status"}
          aria-atomic="true"
        >
          {text}
        </p>
        {notice && (
          <>
            <span className="toastSeconds" aria-hidden="true">
              {Math.ceil(remaining / 1000)}s
            </span>
            <button
              type="button"
              title="Ẩn thông báo"
              aria-label="Ẩn thông báo"
              onClick={() => {
                const focused = element.current?.contains(
                  document.activeElement,
                );
                dismissNotice(notice.id);
                if (focused && returnFocus.current?.isConnected)
                  returnFocus.current.focus();
              }}
            >
              ×
            </button>
            <span className="toastTrack">
              <span style={{ transform: `scaleX(${remaining / 5000})` }} />
            </span>
          </>
        )}
      </div>
    </>,
    host,
  );
}
