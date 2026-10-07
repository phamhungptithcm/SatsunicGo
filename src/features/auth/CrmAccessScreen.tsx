import { Link } from "react-router-dom";
import { LoadingBar } from "../../shared/Loading";
import "./crm-access-screen.css";

type AccessState = "anonymous" | "restoring" | "checking" | "denied" | "error";
export function CrmAccessScreen({
  state = "anonymous",
  busy = false,
  mfa = false,
  error = "",
  signIn,
  signOut,
  retry,
}: {
  state?: AccessState;
  busy?: boolean;
  mfa?: boolean;
  error?: string;
  signIn?: () => void;
  signOut?: () => void;
  retry?: () => void;
}) {
  const waiting = state === "checking" || state === "restoring";
  const title =
    state === "denied"
      ? "Chưa có quyền CRM"
      : state === "error"
        ? "Chưa thể mở CRM"
        : "Không gian làm việc";
  const description =
    state === "denied"
      ? "Liên hệ chủ doanh nghiệp để được cấp quyền nhân viên."
      : state === "error"
        ? "Chưa kiểm tra được quyền truy cập. Thử lại để tiếp tục."
        : "Đăng nhập bằng tài khoản nhân viên để vào CRM.";
  return (
    <section className="crmAccess097" aria-label="Truy cập CRM">
      <div className="entry">
        <div className="brand" aria-label="SatsunicGo CRM">
          <div className="wordmark">
            Satsunic<span className="go">Go</span>
            <span className="crm">CRM</span>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="card-heading">
              <div className="mark" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1.8" />
                  <rect x="14" y="3" width="7" height="7" rx="1.8" />
                  <rect x="3" y="14" width="7" height="7" rx="1.8" />
                  <path d="M14 17.5h7m-3.5-3.5v7" />
                </svg>
              </div>
              <h1>{title}</h1>
            </div>
            <p className="description">{description}</p>
            {waiting ? (
              <div className="entry-status" role="status">
                <LoadingBar />
                {state === "restoring"
                  ? "Đang khôi phục phiên đăng nhập…"
                  : "Đang kiểm tra quyền CRM…"}
              </div>
            ) : state === "anonymous" ? (
              <>
                <button
                  className="google"
                  type="button"
                  onClick={signIn}
                  disabled={busy || mfa || !signIn}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M43.61 24.46c0-1.36-.12-2.67-.35-3.93H24v7.44h11c-.48 2.4-1.84 4.44-3.89 5.81v4.83h6.3c3.69-3.4 6.2-8.43 6.2-14.15Z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 44c5.4 0 9.93-1.79 13.24-4.85l-6.3-4.83c-1.79 1.2-4.08 1.93-6.94 1.93-5.22 0-9.66-3.52-11.24-8.27H6.25v5A20 20 0 0 0 24 44Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12.76 27.98a12 12 0 0 1 0-7.96v-5H6.25a20 20 0 0 0 0 17.96l6.51-5Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M24 11.75c2.94 0 5.56 1.01 7.65 3L37.35 9C33.89 5.78 29.4 4 24 4A20 20 0 0 0 6.25 15.02l6.51 5c1.58-4.75 6.02-8.27 11.24-8.27Z"
                    />
                  </svg>
                  <span>
                    {busy ? "Đang mở đăng nhập…" : "Tiếp tục với Google"}
                  </span>
                </button>
                {mfa && (
                  <p className="entry-status" role="status">
                    Nhập mã xác thực để hoàn tất đăng nhập.
                  </p>
                )}
                <p className="access">Dành cho tài khoản được cấp quyền</p>
              </>
            ) : (
              <div className="entry-actions">
                {state === "error" && (
                  <button
                    type="button"
                    className="google"
                    disabled={busy || !retry}
                    onClick={retry}
                  >
                    Kiểm tra lại quyền
                  </button>
                )}
                <button
                  type="button"
                  className="google"
                  disabled={busy}
                  onClick={signOut}
                >
                  Dùng tài khoản khác
                </button>
                <Link className="entry-secondary" to="/account/security">
                  Bảo mật tài khoản
                </Link>
              </div>
            )}
            {error && (
              <p role="alert" className="entry-error">
                {error}
              </p>
            )}
          </div>
          <div className="customer">
            <Link to="/account">
              Tài khoản khách hàng <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="footer">
          <Link to="/">← Về website</Link>
        </div>
      </div>
    </section>
  );
}
