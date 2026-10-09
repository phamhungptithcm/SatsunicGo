import { lazy, Suspense, useEffect, useId, useState } from "react";
import type { User } from "firebase/auth";
import { LoadingState } from "../../shared/Loading";
import "./customer-workspace.css";
const Profile = lazy(() =>
  import("../profile/Profile").then((module) => ({ default: module.Profile })),
);
const Membership = lazy(() =>
  import("../membership/Membership").then((module) => ({
    default: module.Membership,
  })),
);
export function CustomerWorkspace({
  user,
  language,
  task,
  blocked = false,
  readOnly = false,
  onTaskChange,
  onPendingChange,
}: {
  user: User | null;
  language: "vi" | "en";
  task?: "profile" | "membership" | null;
  blocked?: boolean;
  readOnly?: boolean;
  onTaskChange?: (task: "profile" | "membership" | null) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  return (
    <AccountForm
      key={user?.uid ?? "signed-out"}
      user={user}
      language={language}
      task={task}
      blocked={blocked}
      readOnly={readOnly}
      onTaskChange={onTaskChange}
      onPendingChange={onPendingChange}
    />
  );
}
function AccountForm({
  user,
  language,
  task,
  blocked,
  readOnly,
  onTaskChange,
  onPendingChange,
}: {
  user: User | null;
  language: "vi" | "en";
  task?: "profile" | "membership" | null;
  blocked: boolean;
  readOnly: boolean;
  onTaskChange?: (task: "profile" | "membership" | null) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [localOpen, setOpen] = useState<"profile" | "membership" | null>(null),
    [visited, setVisited] = useState({ profile: false, membership: false });
  const [profilePending, setProfilePending] = useState(false),
    [membershipPending, setMembershipPending] = useState(false);
  const open = task === undefined ? localOpen : task;
  useEffect(() => {
    if (open) setVisited((value) => ({ ...value, [open]: true }));
  }, [open]);
  useEffect(() => {
    onPendingChange?.(profilePending || membershipPending);
  }, [profilePending, membershipPending, onPendingChange]);
  const [signInError, setSignInError] = useState("");
  async function signIn() {
    if (readOnly || blocked) return;
    setSignInError("");
    try {
      const { login } = await import("../../shared/firebase");
      await login();
    } catch {
      setSignInError(
        language === "vi"
          ? "Chưa đăng nhập được. Anh/chị thử lại nhé."
          : "Sign-in did not finish. Please try again.",
      );
    }
  }
  const id = useId(),
    vi = language === "vi";
  function canToggle(kind: "profile" | "membership") {
    if (readOnly || blocked || (profilePending && membershipPending))
      return false;
    const pending = profilePending
      ? "profile"
      : membershipPending
        ? "membership"
        : null;
    return pending === null || pending === kind;
  }
  function show(kind: "profile" | "membership") {
    if (!canToggle(kind)) return;
    setVisited((value) => ({ ...value, [kind]: true }));
    const next = open === kind ? null : kind;
    if (onTaskChange) onTaskChange(next);
    else setOpen(next);
  }
  return (
    <section
      className="askCustomerWorkspace"
      aria-label={vi ? "Tác vụ tài khoản" : "Account tasks"}
    >
      <div className="askWorkspaceControls">
        <button
          type="button"
          aria-expanded={open === "profile"}
          aria-controls={`${id}-profile`}
          disabled={!canToggle("profile")}
          onClick={() => show("profile")}
        >
          {vi ? "Hồ sơ và địa chỉ" : "Profile and addresses"}
        </button>
        <button
          type="button"
          aria-expanded={open === "membership"}
          aria-controls={`${id}-membership`}
          disabled={!canToggle("membership")}
          onClick={() => show("membership")}
        >
          Membership
        </button>
      </div>
      {signInError && <p role="alert">{signInError}</p>}
      <div id={`${id}-profile`} hidden={open !== "profile"} lang="vi">
        {visited.profile && (
          <Suspense
            fallback={
              <LoadingState overlay={false}>Đang tải hồ sơ…</LoadingState>
            }
          >
            <Profile
              user={user}
              blocked={membershipPending || blocked || readOnly}
              onPendingChange={setProfilePending}
            />
          </Suspense>
        )}
      </div>
      <div id={`${id}-membership`} hidden={open !== "membership"} lang="vi">
        {visited.membership && (
          <Suspense
            fallback={
              <LoadingState overlay={false}>Đang tải membership…</LoadingState>
            }
          >
            <Membership
              user={user}
              signIn={signIn}
              blocked={profilePending || blocked || readOnly}
              onPendingChange={setMembershipPending}
            />
          </Suspense>
        )}
      </div>
    </section>
  );
}
