import { useState, type FormEvent } from "react";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth, emulatorMode } from "../../shared/firebase";
export function EmulatorLogin() {
  const [identity, setIdentity] = useState("owner"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!import.meta.env.DEV || !emulatorMode) return null;
  async function signIn(e: FormEvent) {
    e.preventDefault();
    if (!auth || !emulatorMode) return;
    setBusy(true);
    setError("");
    try {
      await signInWithCredential(
        auth,
        GoogleAuthProvider.credential(
          JSON.stringify({
            sub: `e2e005-${identity}`,
            email: `${identity}@satsunicgo.example.invalid`,
            email_verified: true,
          }),
        ),
      );
    } catch {
      setError(
        "Chưa đăng nhập được tài khoản thử. Chạy seed emulator rồi thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form panel demoLogin" onSubmit={(e) => void signIn(e)}>
      <h2>Tài khoản thử nghiệm</h2>
      <p>
        Dữ liệu chỉ nằm trong emulator, không có giao dịch thật. Phiên Google
        được mô phỏng để kiểm tra quyền; đây không phải đăng nhập Google thật.
      </p>
      <label>
        Vai trò thử
        <select value={identity} onChange={(e) => setIdentity(e.target.value)}>
          {[
            ["owner", "Chủ vận hành"],
            ["manager", "Quản lý vận hành"],
            ["buyer", "Nhân viên mua hàng"],
            ["warehouse", "Nhân viên kho"],
            ["finance", "Nhân viên tài chính"],
            ["support", "Nhân viên hỗ trợ"],
            ["editor", "Biên tập viên"],
            ["customer-a", "Khách hàng A"],
            ["customer-b", "Khách hàng B"],
            ["revoked", "Đã thu hồi quyền"],
            ["locked", "Tài khoản đã khóa"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button disabled={busy}>
        {busy ? "Đang đăng nhập…" : "Đăng nhập thử nghiệm"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
