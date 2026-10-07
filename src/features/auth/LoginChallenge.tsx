import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { TotpMultiFactorGenerator } from "firebase/auth";
import { clearMfa, pendingMfa, subscribeMfa, verifyMfa } from "./mfa";
import "./login-challenge.css";
import { notify } from "../../shared/feedback";

export function LoginChallenge({ onOpen }: { onOpen: () => void }) {
  const challenge = useSyncExternalStore(subscribeMfa, pendingMfa, () => null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const sending = useRef<typeof challenge>(null);
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const opened = useRef(onOpen);
  useEffect(() => {
    opened.current = onOpen;
  }, [onOpen]);
  useEffect(() => {
    const element = dialog.current;
    if (!challenge || !element) return;
    const previous = document.activeElement;
    opened.current();
    setCode("");
    setError("");
    setBusy(false);
    sending.current = null;
    setFactor(
      challenge.hints.find(
        (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
      )?.uid ?? "",
    );
    element.showModal();
    requestAnimationFrame(() => {
      if (pendingMfa() === challenge) input.current?.focus();
    });
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [challenge]);
  useEffect(() => {
    // Focus after React has committed the enabled input, not in a frame that
    // can run while it is still disabled by the previous verification.
    if (challenge && !busy && error) input.current?.focus();
  }, [challenge, busy, error]);
  function cancel() {
    if (sending.current === challenge) return;
    setCode("");
    setError("");
    clearMfa();
  }
  async function submit(event?: FormEvent, nextCode = code) {
    event?.preventDefault();
    if (
      !challenge ||
      sending.current === challenge ||
      !factor ||
      !/^[0-9]{6}$/.test(nextCode)
    )
      return;
    const current = challenge;
    sending.current = current;
    setBusy(true);
    setError("");
    try {
      await verifyMfa(factor, nextCode);
      if (pendingMfa() === current) setCode("");
    } catch (failure) {
      if (pendingMfa() !== current) return;
      const expired = [
        "auth/invalid-multi-factor-session",
        "auth/multi-factor-info-not-found",
        "auth/session-expired",
      ].includes((failure as { code?: string }).code ?? "");
      setError(
        expired
          ? "Phiên đăng nhập đã hết hạn. Hủy rồi đăng nhập lại."
          : (failure as { code?: string }).code ===
              "auth/network-request-failed"
            ? "Chưa kết nối được. Kiểm tra mạng rồi thử lại."
            : "Mã chưa đúng hoặc đã hết hạn. Nhập mã mới để thử lại.",
      );
      notify(
        expired
          ? "Phiên xác thực đã hết hạn. Hủy rồi thử lại."
          : "Mã chưa đúng hoặc chưa kết nối được. Thử lại.",
        "error",
      );
      setCode("");
    } finally {
      if (sending.current === current) {
        sending.current = null;
        setBusy(false);
      }
    }
  }
  if (!challenge) return null;
  const factors = challenge.hints.filter(
    (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
  );
  return (
    <dialog
      ref={dialog}
      className="loginChallenge"
      aria-labelledby="login-challenge-title"
      aria-describedby="login-challenge-description"
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <form onSubmit={(event) => void submit(event)}>
        <h2 id="login-challenge-title">Xác nhận đăng nhập</h2>
        <p id="login-challenge-description">Nhập 6 số từ ứng dụng xác thực.</p>
        {factors.length > 1 && (
          <label>
            Ứng dụng xác thực
            <select
              value={factor}
              onChange={(event) => {
                setFactor(event.target.value);
                setCode("");
                setError("");
              }}
              disabled={busy}
            >
              {factors.map((hint, index) => (
                <option key={hint.uid} value={hint.uid}>
                  {hint.displayName || `Ứng dụng ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}
        {factors.length > 0 ? (
          <label>
            <span className="formLabelText">
              Mã xác thực{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              ref={input}
              value={code}
              onChange={(event) => {
                const next = event.target.value
                  .replace(/[^0-9]/g, "")
                  .slice(0, 6);
                setCode(next);
                setError("");
                if (next.length === 6) void submit(undefined, next);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              disabled={busy}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-challenge-error" : undefined}
              placeholder="000000"
            />
          </label>
        ) : (
          <p role="alert">
            Phương thức xác thực này chưa được hỗ trợ. Hủy để chọn cách đăng
            nhập khác.
          </p>
        )}
        {error && (
          <p
            id="login-challenge-error"
            role="alert"
            className="loginChallengeError"
          >
            {error}
          </p>
        )}
        <div className="loginChallengeActions">
          <button type="button" disabled={busy} onClick={cancel}>
            Hủy
          </button>
          <button
            type="submit"
            className="primary"
            disabled={busy || !factor || code.length !== 6}
          >
            {busy ? "Đang xác nhận…" : "Tiếp tục"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
