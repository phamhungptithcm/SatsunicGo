import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LoadingBar } from "../../shared/Loading";
import { dismissGoogleLogin, googleLoginSnapshot, subscribeGoogleLogin } from "./google-popup-login";
import "./google-login-dialog.css";

export function GoogleLoginDialog({ retry }: { retry: () => void }) {
  const state = useSyncExternalStore(subscribeGoogleLogin, googleLoginSnapshot, googleLoginSnapshot);
  const dialog = useRef<HTMLDialogElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const copyGeneration = useRef(0);
  useEffect(() => {
    const element = dialog.current;
    if (!state.open || !element) return;
    const previous = document.activeElement;
    setCopyStatus("");
    element.showModal();
    element.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    return () => {
      ++copyGeneration.current;
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [state.open]);
  useEffect(() => {
    if (!state.open || state.busy || !dialog.current) return;
    dialog.current.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    dialog.current.scrollTop = 0;
  }, [state.open, state.busy]);
  async function copyLink() {
    const generation = ++copyGeneration.current;
    try {
      // Copy only the public location, never auth state or provider tokens.
      await navigator.clipboard.writeText(window.location.href);
      if (generation === copyGeneration.current) setCopyStatus("Đã sao chép liên kết.");
    } catch {
      if (generation === copyGeneration.current)
        setCopyStatus("Chưa sao chép được. Bạn có thể sao chép liên kết trên thanh địa chỉ.");
    }
  }
  return createPortal(
    <dialog ref={dialog} className="googleLoginDialog" aria-labelledby="google-login-title" aria-describedby="google-login-description" onCancel={dismissGoogleLogin}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        // Keep keyboard navigation predictable even when Safari's system
        // preference excludes buttons from its default tab order.
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        if (!buttons.length) return;
        event.preventDefault();
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }}>
      <h2 id="google-login-title" tabIndex={-1}>Đăng nhập với Google</h2>
      {state.busy ? (
        <div className="googleLoginStatus" role="status" aria-live="polite">
          <LoadingBar />
          <p>Tiếp tục trong cửa sổ Google.</p>
        </div>
      ) : state.error ? <p role="alert">{state.error}</p> : null}
      <p id="google-login-description">
        {state.busy
          ? "Trang này vẫn giữ nguyên. Đóng cửa sổ Google nếu bạn muốn hủy."
          : "Bạn có thể thử lại. Nếu mở từ ứng dụng, sao chép liên kết rồi mở bằng trình duyệt trên điện thoại."}
      </p>
      <div className="googleLoginActions">
        {!state.busy && <button type="button" className="primary" onClick={retry}>Thử lại với Google</button>}
        {!state.busy && <button type="button" onClick={() => void copyLink()}>Sao chép liên kết</button>}
        <button type="button" className={state.busy ? "primary" : undefined} onClick={dismissGoogleLogin}>Quay lại trang</button>
      </div>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </dialog>, document.body,
  );
}
