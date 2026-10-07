import { notify } from "../../shared/feedback";
import { useEffect, useRef, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import {
  GoogleAuthProvider,
  multiFactor,
  reauthenticateWithPopup,
  TotpMultiFactorGenerator,
  type TotpSecret,
  type User,
} from "firebase/auth";
import { auth } from "../../shared/firebase";
import { captureMfa, pendingMfa, verifyMfa } from "./mfa";
import {
  enrollTotp,
  waitForEnrollment,
  publishEnrollment,
  subscribeEnrollment,
} from "./enrollment";
import { useOptionalMfaAccess } from "./staff-mfa-context";

export function Security({
  user,
  required = false,
  onReady,
}: {
  user: User | null;
  required?: boolean;
  onReady?: () => void;
}) {
  const optionalAccess = useOptionalMfaAccess(user);
  const blocked = !required && optionalAccess.blocked;
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qr, setQr] = useState("");
  const [qrFailed, setQrFailed] = useState(false);
  const [copyState, setCopyState] = useState<
    "" | "pending" | "done" | "failed"
  >("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const [statusFailed, setStatusFailed] = useState(false);
  const [factors, setFactors] = useState<number | null>(null);
  const [, setRevision] = useState(0);
  const epoch = useRef(0);
  const flight = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const ready = useRef(onReady);
  const acknowledged = useRef(false);
  const uncertain = useRef(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  useEffect(() => {
    ready.current = onReady;
  }, [onReady]);
  useEffect(() => {
    const attempt = ++epoch.current;
    flight.current = null;
    acknowledged.current = false;
    uncertain.current = false;
    setNeedsReauth(false);
    setSecret(null);
    setQr("");
    setQrFailed(false);
    setCopyState("");
    setCode("");
    setBusy(false);
    setVerifying(false);
    setError("");

    setFactors(null);
    setStatusFailed(false);
    if (blocked)
      return () => {
        ++epoch.current;
        flight.current = null;
      };
    if (user)
      void waitForEnrollment(user)
        .then(() => (epoch.current === attempt ? user.reload() : undefined))
        .then(async () => {
          if (epoch.current !== attempt) return;
          const count = multiFactor(user).enrolledFactors.length;
          setFactors(count);
          if (required) {
            if (count > 0) {
              await user.getIdToken(true);
              if (epoch.current === attempt) ready.current?.();
            } else void begin();
          }
        })
        .catch(() => {
          if (epoch.current === attempt) {
            setStatusFailed(true);
            setError("Chưa tải được trạng thái bảo mật. Kiểm tra lại.");
          }
        });
    return () => {
      ++epoch.current;
      flight.current = null;
    };
    // Identity is the lifecycle boundary; operation guards handle all late replies.
  }, [user, required, blocked]);
  const challenge = pendingMfa();
  const challengeFactors =
    challenge?.hints.filter(
      (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID,
    ) ?? [];
  useEffect(() => {
    if (secret && !busy) input.current?.focus();
  }, [secret, busy, error]);
  function clearSetup() {
    setSecret(null);
    setQr("");
    setQrFailed(false);
    setCopyState("");
    setCode("");
  }
  useEffect(
    () =>
      subscribeEnrollment((current, count) => {
        if (current !== user) return;
        ++epoch.current;
        flight.current = null;
        clearSetup();
        setFactors(count);
        setStatusFailed(false);
        setBusy(false);
        setVerifying(false);
        setError("");
      }),
    [user],
  );
  function cancel() {
    ++epoch.current;
    flight.current = null;
    clearSetup();
    setBusy(false);
    setVerifying(false);
    setError("");
  }
  async function copyKey() {
    if (!secret || copyState === "pending") return;
    const attempt = epoch.current;
    setCopyState("pending");
    try {
      await navigator.clipboard.writeText(secret.secretKey);
      if (epoch.current === attempt) setCopyState("done");
    } catch {
      if (epoch.current === attempt) setCopyState("failed");
    }
  }
  async function reauthenticate() {
    if (!user || flight.current !== null) return;
    const attempt = ++epoch.current;
    flight.current = attempt;
    clearSetup();
    setBusy(true);
    setError("");
    let restart = false;

    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      if (epoch.current !== attempt) return;
      await user.reload();
      if (epoch.current !== attempt) return;
      const count = multiFactor(user).enrolledFactors.length;
      setFactors(count);
      restart = required && count === 0;
      if (required && count > 0) ready.current?.();
      setStatusFailed(false);
      setNeedsReauth(false);
      notify(
        "Đã xác thực lại với Google. Bạn có thể tiếp tục thiết lập.",
        "success",
      );
    } catch (e) {
      if (epoch.current !== attempt) return;
      if (captureMfa(e, auth)) setRevision((v) => v + 1);
      else {
        if (factors === null) setStatusFailed(true);
        setError("Chưa xác thực lại được. Thử đăng nhập lại với Google.");
      }
    } finally {
      if (epoch.current === attempt) {
        flight.current = null;
        setBusy(false);
        if (restart) void begin();
      }
    }
  }
  async function begin() {
    if (!user || blocked || flight.current !== null || acknowledged.current)
      return;
    const attempt = ++epoch.current;
    flight.current = attempt;
    clearSetup();
    setBusy(true);
    setError("");

    try {
      const session = await multiFactor(user).getSession();
      if (epoch.current !== attempt) return;
      const next = await TotpMultiFactorGenerator.generateSecret(session);
      if (epoch.current !== attempt) return;
      setSecret(next);
      try {
        const data = await QRCode.toDataURL(
          next.generateQrCodeUrl(user.email ?? user.uid, "SatsunicGo"),
          { width: 224, margin: 4, errorCorrectionLevel: "M" },
        );
        if (epoch.current === attempt) setQr(data);
      } catch {
        if (epoch.current === attempt) setQrFailed(true);
      }
    } catch (failure) {
      if (epoch.current === attempt) {
        const recent =
          (failure as { code?: string }).code === "auth/requires-recent-login";
        setNeedsReauth(recent);
        setError(
          recent
            ? "Xác thực lại với Google để tiếp tục thiết lập."
            : "Chưa tạo được thiết lập. Thử lại.",
        );
      }
    } finally {
      if (epoch.current === attempt) {
        flight.current = null;
        setBusy(false);
        requestAnimationFrame(() => {
          if (epoch.current === attempt) input.current?.focus();
        });
      }
    }
  }
  async function verify(e?: FormEvent<HTMLFormElement>, nextCode = code) {
    e?.preventDefault();
    const factor = String(
      form.current ? (new FormData(form.current).get("factor") ?? "") : "",
    );
    if (
      blocked ||
      flight.current !== null ||
      acknowledged.current ||
      !/^[0-9]{6}$/.test(nextCode) ||
      (challenge && !challengeFactors.some((h) => h.uid === factor))
    )
      return;
    const attempt = ++epoch.current;
    flight.current = attempt;
    setBusy(true);
    setVerifying(true);
    setError("");

    let enrolled = false;
    try {
      if (challenge) await verifyMfa(factor, nextCode);
      else if (secret && user) {
        await enrollTotp(user, secret, nextCode);
        enrolled = true;
      } else return;
      if (epoch.current !== attempt) return;
      acknowledged.current = enrolled;
      clearSetup();
      if (user) {
        setFactors(null);
        await user.reload();
        if (epoch.current !== attempt) return;
        await user.getIdToken(true);
        if (epoch.current !== attempt) return;
        const count = multiFactor(user).enrolledFactors.length;
        setFactors(count);
        setStatusFailed(false);
        if (enrolled && count === 0) {
          setError("Chưa xác nhận được trạng thái bảo mật. Kiểm tra lại.");
          return;
        }
        if (required && count > 0) ready.current?.();
      }
      notify(
        enrolled ? "Đã bật xác thực hai bước." : "Đã xác nhận mã xác thực.",
        "success",
      );
      if (enrolled && user)
        publishEnrollment(user, multiFactor(user).enrolledFactors.length);
      setRevision((v) => v + 1);
    } catch (failure) {
      if (epoch.current !== attempt) return;
      if (enrolled) setStatusFailed(true);
      const failureCode = (failure as { code?: string }).code;
      const expired = [
        "auth/requires-recent-login",
        "auth/invalid-multi-factor-session",
        "auth/session-expired",
      ].includes(failureCode ?? "");
      const invalidCode = [
        "auth/invalid-verification-code",
        "auth/code-expired",
      ].includes(failureCode ?? "");
      if (!enrolled && !expired && !invalidCode && !challenge) {
        // A transport/service failure may follow server acceptance. Read back
        // before permitting another enrollment, instead of assuming rejection.
        uncertain.current = true;
        acknowledged.current = true;
        clearSetup();
        setFactors(null);
        setStatusFailed(true);
      }
      if (!enrolled && expired) {
        clearSetup();
        setNeedsReauth(true);
      }
      setError(
        enrolled
          ? "Ứng dụng đã được đăng ký nhưng chưa tải được trạng thái mới. Kiểm tra lại."
          : uncertain.current
            ? "Chưa xác nhận được thiết lập. Kiểm tra lại trạng thái để tiếp tục."
            : expired
              ? "Phiên thiết lập đã hết hạn. Xác thực lại với Google để tiếp tục."
              : failureCode === "auth/network-request-failed"
                ? "Chưa kết nối được. Kiểm tra mạng rồi thử lại."
                : "Mã chưa đúng hoặc đã hết hạn. Nhập mã mới để thử lại.",
      );
      setCode("");
      requestAnimationFrame(() => {
        if (epoch.current === attempt) input.current?.focus();
      });
    } finally {
      if (epoch.current === attempt) {
        flight.current = null;
        setBusy(false);
        setVerifying(false);
      }
    }
  }
  async function refreshStatus() {
    if (!user || flight.current !== null) return;
    const attempt = ++epoch.current;
    flight.current = attempt;
    setBusy(true);
    setError("");
    try {
      await user.reload();
      if (epoch.current !== attempt) return;
      await user.getIdToken(true);
      if (epoch.current !== attempt) return;
      const count = multiFactor(user).enrolledFactors.length;
      setFactors(count);
      setStatusFailed(false);
      if (acknowledged.current && count === 0) {
        if (uncertain.current) {
          acknowledged.current = false;
          uncertain.current = false;
          setError("Chưa đăng ký ứng dụng xác thực. Thử thiết lập lại.");
        } else {
          setStatusFailed(true);
          setError("Chưa xác nhận được trạng thái bảo mật. Kiểm tra lại.");
        }
      } else if (count > 0) {
        notify("Đã bật xác thực hai bước.", "success");
        ready.current?.();
        publishEnrollment(user, count);
      }
    } catch {
      if (epoch.current === attempt) {
        setStatusFailed(true);
        setError("Chưa tải được trạng thái bảo mật. Kiểm tra lại.");
      }
    } finally {
      if (epoch.current === attempt) {
        flight.current = null;
        setBusy(false);
      }
    }
  }
  if (blocked)
    return (
      <section className="securityPage">
        <header className="securityHeading">
          <h1>Bảo mật tài khoản</h1>
        </header>
        <p role="status">
          {optionalAccess.status === "setup"
            ? "Hoàn tất thiết lập trong cửa sổ bảo mật."
            : optionalAccess.status === "checking"
              ? "Đang kiểm tra bảo mật…"
              : "Chưa kiểm tra được bảo mật."}
        </p>
        {optionalAccess.status === "unavailable" && (
          <button
            type="button"
            className="securitySecondary"
            onClick={optionalAccess.retry}
          >
            Kiểm tra lại quyền
          </button>
        )}
      </section>
    );
  return (
    <section className="securityPage">
      {!required && (
        <header className="securityHeading">
          <h1>Bảo mật tài khoản</h1>
        </header>
      )}
      {user && (
        <div className="securityOverview">
          {required && factors === null && !error && !busy && (
            <p role="status">Đang kiểm tra bảo mật…</p>
          )}
          {!required && (
            <div className="securityOverviewRow">
              <h2>Xác thực hai bước</h2>
              <span
                role={factors ? "status" : undefined}
                className={`securityBadge ${factors ? "isEnabled" : ""}`}
              >
                {factors === null
                  ? statusFailed
                    ? "Chưa xác định"
                    : "Đang kiểm tra"
                  : factors
                    ? "Đã bật"
                    : "Chưa bật"}
              </span>
            </div>
          )}
          {!secret && !challenge && factors === 0 && !acknowledged.current && (
            <div className="securityActions">
              <button
                className="securityPrimary"
                disabled={busy}
                onClick={() => void begin()}
              >
                {busy ? "Đang xử lý…" : "Thêm ứng dụng xác thực"}
              </button>
              {(!required || needsReauth) && (
                <button
                  className="securitySecondary"
                  disabled={busy}
                  onClick={() => void reauthenticate()}
                >
                  Xác thực lại với Google
                </button>
              )}
              {!required && busy && !verifying && (
                <button className="securitySecondary" onClick={cancel}>
                  Hủy thiết lập
                </button>
              )}
            </div>
          )}
          {!secret && !challenge && (statusFailed || acknowledged.current) && (
            <div className="securityActions">
              <button
                className="securitySecondary"
                disabled={busy}
                onClick={() => void refreshStatus()}
              >
                {busy ? "Đang kiểm tra…" : "Kiểm tra lại"}
              </button>
            </div>
          )}
        </div>
      )}
      {!user && !challenge && (
        <div className="securityCard">
          <p>Đăng nhập với Google để quản lý bảo mật tài khoản.</p>
        </div>
      )}
      {secret && (
        <div className="securityCard">
          {secret && (
            <div className="securitySetup">
              <div className="securityQr">
                {qr ? (
                  <img
                    src={qr}
                    width="224"
                    height="224"
                    alt="Mã QR để thêm tài khoản vào ứng dụng xác thực"
                  />
                ) : (
                  <p role="status">
                    {qrFailed
                      ? "Không tạo được mã QR. Bạn có thể nhập khóa bên dưới."
                      : "Đang tạo mã QR…"}
                  </p>
                )}
              </div>
              <div className="securityManual">
                <span className="securityManualLabel">Khóa nhập thủ công</span>
                <div className="securityKeyRow">
                  <code className="securityKey">{secret.secretKey}</code>
                  <button
                    type="button"
                    className="securityCopy"
                    onClick={() => void copyKey()}
                    disabled={copyState === "pending" || verifying}
                    aria-label="Sao chép khóa thiết lập"
                    title="Sao chép khóa"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="8" y="8" width="12" height="12" rx="2" />
                      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                    </svg>
                  </button>
                </div>
                <p
                  className="securityCopyFeedback"
                  role={copyState === "failed" ? "alert" : "status"}
                >
                  {copyState === "done"
                    ? "Đã sao chép"
                    : copyState === "failed"
                      ? "Không sao chép được. Chọn khóa để sao chép thủ công."
                      : copyState === "pending"
                        ? "Đang sao chép…"
                        : ""}
                </p>
                <p className="securityPrivacy">
                  Không chia sẻ mã QR hoặc khóa này.
                </p>
              </div>
            </div>
          )}
          <form
            ref={form}
            className="securityForm"
            onSubmit={(e) => void verify(e)}
          >
            <p>
              {challenge
                ? "Nhập mã từ ứng dụng xác thực."
                : "Quét QR hoặc nhập khóa vào ứng dụng xác thực."}
            </p>
            {challenge && !challengeFactors.length && (
              <p role="alert">
                Tài khoản cần phương thức xác thực khác. Quay lại trang đăng
                nhập để tiếp tục.
              </p>
            )}
            {challenge && (
              <label>
                Ứng dụng xác thực
                <select name="factor" disabled={busy}>
                  {challenge.hints
                    .filter(
                      (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID,
                    )
                    .map((h) => (
                      <option key={h.uid} value={h.uid}>
                        {h.displayName ?? "Ứng dụng xác thực"}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label htmlFor="security-code">
              <span className="formLabelText">
                Mã xác thực 6 chữ số{" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
            </label>
            <input
              ref={input}
              id="security-code"
              name="code"
              value={code}
              onChange={(e) => {
                const next = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setCode(next);
                setError("");
                if (next.length === 6) void verify(undefined, next);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              placeholder="000000"
              disabled={busy}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "security-error" : undefined}
            />
            <div className="securityActions">
              <button
                className="securityPrimary"
                disabled={
                  busy ||
                  code.length !== 6 ||
                  Boolean(challenge && !challengeFactors.length)
                }
              >
                {verifying
                  ? "Đang xác nhận…"
                  : challenge
                    ? "Xác nhận mã"
                    : "Bật xác thực hai bước"}
              </button>
              {secret && !required && (
                <button
                  type="button"
                  className="securitySecondary"
                  disabled={verifying}
                  onClick={cancel}
                >
                  Hủy thiết lập
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      {error && (
        <p id="security-error" role="alert" className="securityNotice isError">
          {error}
        </p>
      )}
    </section>
  );
}
