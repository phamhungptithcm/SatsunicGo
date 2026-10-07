import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  onAuthStateChanged,
  type Auth,
} from "firebase/auth";
import { captureMfa, clearMfa, pendingMfa, waitForMfaResult } from "./mfa";
import { notify } from "../../shared/feedback";
import "./login-challenge.css";
let state: "opening" | "blocked" | "challenge" | null = null;
const listeners = new Set<() => void>();
const snapshot = () => state;
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const change = (next: typeof state) => {
  state = next;
  listeners.forEach((fn) => fn());
};
let current: {
  auth: Auth;
  uid: string;
  resolve: () => void;
  reject: (error: unknown) => void;
  running: boolean;
  owned: boolean;
} | null = null;
let flight: Promise<void> | null = null;
const cancelled = () =>
  Object.assign(new Error("Đã hủy xác thực. Thao tác chưa được tiếp tục."), {
    code: "auth/cancelled",
  });
function cancel() {
  current?.reject(cancelled());
}
async function openGoogle() {
  const task = current;
  if (!task || task.running) return;
  task.running = true;
  change("opening");
  try {
    const user = task.auth.currentUser;
    if (!user || user.uid !== task.uid) throw cancelled();
    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    } catch (error) {
      if (current !== task) return;
      if (
        ["auth/popup-blocked", "auth/internal-error"].includes(
          (error as { code?: string }).code ?? "",
        )
      ) {
        change("blocked");
        return;
      }
      if (!captureMfa(error, task.auth)) throw error;
      task.owned = true;
      change("challenge");
      await waitForMfaResult();
    }
    if (current !== task || task.auth.currentUser?.uid !== task.uid)
      throw cancelled();
    const token = await user.getIdTokenResult(true);
    const firebase = token.claims.firebase as
      { sign_in_second_factor?: string } | undefined;
    const age = Date.now() - Date.parse(token.authTime);
    if (!firebase?.sign_in_second_factor || age < -30000 || age >= 300000)
      throw new Error(
        "Cần xác thực hai lớp để tiếp tục. Kiểm tra ứng dụng xác thực của tài khoản.",
      );
    task.resolve();
  } catch (error) {
    if (current === task) task.reject(error);
  } finally {
    task.running = false;
  }
}
export function requestActionMfa(auth: Auth) {
  if (flight) return flight;
  if (!auth.currentUser || pendingMfa())
    return Promise.reject(
      new Error("Hoàn tất phiên xác thực đang mở rồi thử lại."),
    );
  let timeout: ReturnType<typeof setTimeout>;
  let stopIdentity: (() => void) | undefined;
  const promise = new Promise<void>((resolve, reject) => {
    current = {
      auth,
      uid: auth.currentUser!.uid,
      resolve,
      reject,
      running: false,
      owned: false,
    };
    timeout = setTimeout(
      () => reject(new Error("Phiên xác thực đã hết hạn. Thử lại thao tác.")),
      180000,
    );
    stopIdentity = onAuthStateChanged(auth, (user) => {
      if (user?.uid !== current?.uid) cancel();
    });
    void openGoogle();
  });
  flight = promise.finally(() => {
    clearTimeout(timeout);
    stopIdentity?.();
    if (current?.owned && pendingMfa()) clearMfa();
    current = null;
    flight = null;
    change(null);
  });
  return flight;
}
export function ActionMfa({ pageKey }: { pageKey?: string }) {
  const phase = useSyncExternalStore(subscribe, snapshot, () => null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !phase || phase === "challenge") return;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [phase]);
  useEffect(() => () => cancel(), [pageKey]);
  return (
    <dialog
      ref={dialog}
      className="loginChallenge"
      aria-labelledby="action-mfa-title"
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
    >
      <h2 id="action-mfa-title">Xác thực để tiếp tục</h2>
      <p>
        {phase === "blocked"
          ? "Chưa mở được Google. Bấm nút bên dưới để xác thực; thông tin đang nhập được giữ nguyên."
          : "Đang mở Google để xác thực thao tác của bạn…"}
      </p>
      <div className="loginChallengeActions">
        <button type="button" onClick={cancel}>
          Hủy thao tác
        </button>
        {phase === "blocked" && (
          <button
            type="button"
            className="primary"
            onClick={() => {
              void openGoogle().catch(() =>
                notify("Chưa xác thực được. Thử lại.", "error"),
              );
            }}
          >
            Tiếp tục với Google
          </button>
        )}
      </div>
    </dialog>
  );
}
