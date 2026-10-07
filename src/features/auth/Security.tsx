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

export function Security({ user }: { user: User | null }) {
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
  useEffect(() => {
    const attempt = ++epoch.current;
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
    if (user)
      void user
        .reload()
        .then(() => {
          if (epoch.current === attempt)
            setFactors(multiFactor(user).enrolledFactors.length);
        })
        .catch(() => {
          if (epoch.current === attempt) {
            setStatusFailed(true);
            setError(
              "Chưa tải được trạng thái bảo mật. Tải lại trang để thử lại.",
            );
          }
        });
    return () => {
      ++epoch.current;
    };
  }, [user]);
  const challenge = pendingMfa();
  const challengeFactors =
    challenge?.hints.filter(
      (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID,
    ) ?? [];
  function clearSetup() {
    setSecret(null);
    setQr("");
    setQrFailed(false);
    setCopyState("");
    setCode("");
  }
  function cancel() {
    ++epoch.current;
    clearSetup();
    setBusy(false);
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
    if (!user || busy) return;
    const attempt = ++epoch.current;
    clearSetup();
    setBusy(true);
    setError("");

    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      if (epoch.current !== attempt) return;
      await user.reload();
      if (epoch.current !== attempt) return;
      setFactors(multiFactor(user).enrolledFactors.length);
      setStatusFailed(false);
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
      if (epoch.current === attempt) setBusy(false);
    }
  }
  async function begin() {
    if (!user || busy) return;
    const attempt = ++epoch.current;
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
    } catch {
      if (epoch.current === attempt)
        setError(
          "Chưa tạo được thiết lập. Xác thực lại với Google rồi thử thêm ứng dụng lần nữa.",
        );
    } finally {
      if (epoch.current === attempt) setBusy(false);
    }
  }
  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      busy ||
      !/^[0-9]{6}$/.test(code) ||
      (challenge &&
        !challengeFactors.some(
          (h) => h.uid === String(new FormData(e.currentTarget).get("factor")),
        ))
    )
      return;
    const factor = String(new FormData(e.currentTarget).get("factor") ?? "");
    const attempt = ++epoch.current;
    setBusy(true);
    setVerifying(true);
    setError("");

    let enrolled = false;
    try {
      if (challenge) await verifyMfa(factor, code);
      else if (secret && user) {
        await multiFactor(user).enroll(
          TotpMultiFactorGenerator.assertionForEnrollment(secret, code),
          "Authenticator",
        );
        enrolled = true;
      } else return;
      if (epoch.current !== attempt) return;
      clearSetup();
      if (user) {
        setFactors(null);
        await user.reload();
        if (epoch.current !== attempt) return;
        const count = multiFactor(user).enrolledFactors.length;
        setFactors(count);
        setStatusFailed(false);
        if (enrolled && count === 0) {
          setError(
            "Chưa xác nhận được trạng thái bảo mật. Tải lại trang để kiểm tra.",
          );
          return;
        }
      }
      notify(
        enrolled ? "Đã bật xác thực hai bước." : "Đã xác nhận mã xác thực.",
        "success",
      );
      setRevision((v) => v + 1);
    } catch {
      if (epoch.current !== attempt) return;
      if (enrolled) setStatusFailed(true);
      setError(
        enrolled
          ? "Ứng dụng đã được đăng ký nhưng chưa tải được trạng thái mới. Tải lại trang để kiểm tra."
          : "Mã chưa được xác nhận. Nhập mã mới nhất trong ứng dụng và kiểm tra thời gian trên thiết bị rồi thử lại.",
      );
    } finally {
      if (epoch.current === attempt) {
        setBusy(false);
        setVerifying(false);
      }
    }
  }
  return (
    <section className="securityPage">
      <header className="securityHeading">
        <h1>Bảo mật tài khoản</h1>
      </header>
      {user && (
        <div className="securityOverview">
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
          {!secret && !challenge && factors === 0 && (
            <div className="securityActions">
              <button
                className="securityPrimary"
                disabled={busy}
                onClick={() => void begin()}
              >
                {busy ? "Đang xử lý…" : "Thêm ứng dụng xác thực"}
              </button>
              <button
                className="securitySecondary"
                disabled={busy}
                onClick={() => void reauthenticate()}
              >
                Xác thực lại với Google
              </button>
              {busy && !verifying && (
                <button className="securitySecondary" onClick={cancel}>
                  Hủy thiết lập
                </button>
              )}
            </div>
          )}
          {!secret && !challenge && factors === null && statusFailed && (
            <div className="securityActions">
              <button
                className="securitySecondary"
                disabled={busy}
                onClick={() => void reauthenticate()}
              >
                Xác thực lại với Google
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
                {copyState && (
                  <p
                    className="securityCopyFeedback"
                    role={copyState === "failed" ? "alert" : "status"}
                  >
                    {copyState === "done"
                      ? "Đã sao chép"
                      : copyState === "failed"
                        ? "Không sao chép được. Chọn khóa để sao chép thủ công."
                        : "Đang sao chép…"}
                  </p>
                )}
                <p className="securityPrivacy">
                  Không chia sẻ mã QR hoặc khóa này.
                </p>
              </div>
            </div>
          )}
          <form className="securityForm" onSubmit={(e) => void verify(e)}>
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
              id="security-code"
              name="code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              maxLength={6}
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
              {secret && (
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
