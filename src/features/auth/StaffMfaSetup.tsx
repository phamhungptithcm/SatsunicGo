import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { multiFactor, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../shared/firebase";
import { staffRoles } from "../../shared/staff-access";
import { pendingMfa, subscribeMfa } from "./mfa";
import { StaffMfaContext, type StaffMfaState } from "./staff-mfa-context";
export { useStaffMfaReady, useStaffMfaRecovery } from "./staff-mfa-context";
import "./login-challenge.css";
import "../../styles/security.css";
const Security = lazy(() =>
  import("./Security").then((module) => ({ default: module.Security })),
);

type State = Omit<StaffMfaState, "retry">;

// This onboarding gate complements, and never replaces, server authorization
// or token-based recent-MFA checks. Missing access is not evidence of staff.
export function StaffMfaSetup({
  user,
  signOut,
  busy,
  children,
}: {
  user: User | null;
  signOut: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  const [state, setState] = useState<State>({ user: null, status: "checking" });
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const challenge = useSyncExternalStore(subscribeMfa, pendingMfa, () => null);
  useEffect(() => {
    let active = true;
    let authorized = false;
    let accessVersion: string | undefined;
    const initial = ++generation.current;
    setState({ user, status: user ? "checking" : "customer" });
    if (!user || !db) return;
    const stop = onSnapshot(
      doc(db, "staffAccess", user.uid),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return;
        const roles = staffRoles(snapshot.data());
        // Cached roles cannot establish current staff access. A later server
        // snapshot is required before showing mandatory onboarding or Workspace.
        if (snapshot.metadata.fromCache) {
          // Do not leave first-time/offline CRM entry on an endless spinner.
          // Public/customer screens still receive no required enrollment prompt.
          if (!authorized) setState({ user, status: "unavailable" });
          return;
        }
        const version = JSON.stringify(roles);
        if (version === accessVersion) return;
        accessVersion = version;
        const attempt = ++generation.current;
        authorized = Boolean(roles?.length);
        if (!roles?.length) {
          setState({ user, status: "customer" });
          return;
        }
        setState({ user, status: "checking" });
        void user
          .reload()
          .then(() => {
            if (!active || generation.current !== attempt) return;
            setState({
              user,
              status: multiFactor(user).enrolledFactors.length
                ? "ready"
                : "setup",
            });
          })
          .catch(() => {
            if (active && generation.current === attempt)
              setState({ user, status: "error" });
          });
      },
      () => {
        if (!active) return;
        ++generation.current;
        // An unavailable lookup cannot establish staff identity. Public/customer
        // screens remain usable; Staff's own access lookup fails closed.
        setState({ user, status: authorized ? "error" : "unavailable" });
      },
    );
    return () => {
      active = false;
      if (generation.current >= initial) ++generation.current;
      stop();
    };
  }, [user, revision]);
  const current = state.user === user;
  const accessGeneration = generation.current;
  function retry() {
    setState({ user, status: "checking" });
    setRevision((value) => value + 1);
  }
  const show =
    current &&
    !challenge &&
    (state.status === "setup" || state.status === "error");
  useEffect(() => {
    const element = dialog.current;
    if (!show || !element) return;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [show]);
  return (
    <StaffMfaContext.Provider
      value={{
        ...(current ? state : { user, status: "checking" as const }),
        retry,
      }}
    >
      {children}
      {show && user && (
        <dialog
          ref={dialog}
          className="loginChallenge staffMfaSetup"
          aria-labelledby="staff-mfa-title"
          aria-describedby="staff-mfa-description"
          onCancel={(event) => event.preventDefault()}
        >
          <h2 id="staff-mfa-title">Bảo mật tài khoản nhân viên</h2>
          <p id="staff-mfa-description">
            {state.status === "error"
              ? "Chưa kiểm tra được bảo mật và quyền truy cập. Thử lại."
              : "Thêm ứng dụng xác thực để tiếp tục vào không gian nhân viên."}
          </p>
          {state.status === "setup" ? (
            <Suspense fallback={<p role="status">Đang mở thiết lập…</p>}>
              <Security
                key={user.uid}
                user={user}
                required
                onReady={() => {
                  setState((previous) =>
                    previous.user === user &&
                    previous.status === "setup" &&
                    generation.current === accessGeneration
                      ? { user, status: "ready" }
                      : previous,
                  );
                }}
              />
            </Suspense>
          ) : (
            <button type="button" className="primary" onClick={retry}>
              Thử lại
            </button>
          )}
          <div className="staffMfaExit">
            <button type="button" disabled={busy} onClick={signOut}>
              {busy ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </dialog>
      )}
    </StaffMfaContext.Provider>
  );
}
