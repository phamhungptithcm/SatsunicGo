/** Only safe UI messages are retained; no credentials, provider payloads or OTPs. */
export function loginFeedback(cause: unknown): string {
  const code = String((cause as { code?: unknown } | null)?.code ?? "");
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Đã đóng cửa sổ đăng nhập. Bạn có thể thử lại.";
    case "auth/cancelled-popup-request":
      return "Một cửa sổ đăng nhập đang được mở. Tiếp tục trong cửa sổ đó.";
    case "auth/network-request-failed":
      return "Chưa kết nối được Google. Kiểm tra mạng rồi thử lại.";
    case "auth/unauthorized-domain":
    case "auth/operation-not-allowed":
      return "Đăng nhập Google chưa sẵn sàng trên trang này. Liên hệ quản trị viên.";
    case "auth/user-disabled":
      return "Tài khoản chưa thể đăng nhập. Liên hệ quản trị viên.";
    default:
      return "Chưa đăng nhập được. Hãy thử lại.";
  }
}
let feedback = "";
const listeners = new Set<() => void>();
export const authFeedbackSnapshot = () => feedback;
export function subscribeAuthFeedback(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function publishAuthFailure(cause: unknown) {
  feedback = loginFeedback(cause);
  listeners.forEach((listener) => listener());
}
export function clearAuthFeedback() {
  feedback = "";
  listeners.forEach((listener) => listener());
}
