import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  createCountdown,
  dismissNotice,
  noticeSnapshot,
  progressSnapshot,
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
  const [showPending, setShowPending] = useState(false),
    [remaining, setRemaining] = useState(5000);
  const [host, setHost] = useState<Element>(document.body);
  const timer = useRef<ReturnType<typeof createCountdown> | null>(null);
  const element = useRef<HTMLDivElement>(null),
    hovered = useRef(false);
  useEffect(() => {
    if (!pending) {
      setShowPending(false);
      return;
    }
    const timeout = setTimeout(() => setShowPending(true), 400);
    return () => clearTimeout(timeout);
  }, [pending]);
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
  const text = notice?.text ?? (showPending ? "Đang xử lý…" : "");
  if (!text) return null;
  return createPortal(
    <div
      ref={element}
      className="siteToast"
      data-kind={notice?.kind ?? "info"}
      aria-busy={pending}
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
      <span
        className={pending ? "toastSpinner" : "toastSymbol"}
        aria-hidden="true"
      >
        {pending
          ? ""
          : notice?.kind === "success"
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
      {notice && !pending && (
        <>
          <span className="toastSeconds" aria-hidden="true">
            {Math.ceil(remaining / 1000)}s
          </span>
          <button
            type="button"
            title="Ẩn thông báo"
            aria-label="Ẩn thông báo"
            onClick={() => dismissNotice(notice.id)}
          >
            ×
          </button>
          <span className="toastTrack">
            <span style={{ transform: `scaleX(${remaining / 5000})` }} />
          </span>
        </>
      )}
    </div>,
    host,
  );
}
