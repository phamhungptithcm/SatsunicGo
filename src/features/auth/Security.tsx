import { useEffect, useState, type FormEvent } from "react";
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
  const [secret, setSecret] = useState<TotpSecret | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    setSecret(null);
    setError("");
    setMessage("");
  }, [user?.uid]);
  const challenge = pendingMfa();
  async function reauthenticate() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      setMessage("Đã xác thực lại. Tác vụ nhạy cảm vẫn cần yếu tố thứ hai.");
    } catch (e) {
      if (captureMfa(e, auth)) setRevision(revision + 1);
      else
        setError(
          "Chưa xác thực lại được. Thử lại khi Google sign-in đã được cấu hình.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function begin() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const session = await multiFactor(user).getSession();
      setSecret(await TotpMultiFactorGenerator.generateSecret(session));
    } catch {
      setError(
        "Chưa thể thêm xác thực hai lớp. Project cần Identity Platform/TOTP được chủ dự án bật và tài khoản cần xác thực gần đây.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      code = String(f.get("code"));
    setBusy(true);
    setError("");
    try {
      if (challenge) await verifyMfa(String(f.get("factor")), code);
      else if (secret && user)
        await multiFactor(user).enroll(
          TotpMultiFactorGenerator.assertionForEnrollment(secret, code),
          "Authenticator",
        );
      else throw Error("NO_CHALLENGE");
      setSecret(null);
      setMessage("Đã xác nhận yếu tố thứ hai.");
      setRevision(revision + 1);
    } catch {
      setError(
        "Mã chưa được xác nhận. Kiểm tra mã mới nhất và thời gian thiết bị rồi thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <h1>Bảo mật tài khoản</h1>
      <p>
        Tác vụ tiền và cấp quyền yêu cầu đăng nhập gần đây và xác thực hai lớp.
        Thiết lập này chỉ hoạt động khi cấu hình Firebase tương ứng đã được xác
        minh.
      </p>
      {user && (
        <>
          <button disabled={busy} onClick={() => void reauthenticate()}>
            Xác thực lại với Google
          </button>
          <p>
            {multiFactor(user).enrolledFactors.length} yếu tố thứ hai đã đăng ký
          </p>
          {!secret && !challenge && (
            <button disabled={busy} onClick={() => void begin()}>
              Thêm ứng dụng xác thực TOTP
            </button>
          )}
        </>
      )}
      {!user && !challenge && <p>Đăng nhập với Google để quản lý tài khoản.</p>}
      {secret && (
        <div className="panel">
          <p>
            Nhập khóa này trong ứng dụng xác thực trên thiết bị của bạn. Không
            gửi hoặc chụp chia sẻ khóa này.
          </p>
          <code>{secret.secretKey}</code>
          <button onClick={() => setSecret(null)}>Hủy thiết lập</button>
        </div>
      )}
      {(secret || challenge) && (
        <form className="form panel" onSubmit={(e) => void verify(e)}>
          {challenge && (
            <label>
              Yếu tố xác thực
              <select name="factor">
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
          <label>
            Mã xác thực hiện tại
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              maxLength={6}
            />
          </label>
          <button disabled={busy}>Xác nhận mã</button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
