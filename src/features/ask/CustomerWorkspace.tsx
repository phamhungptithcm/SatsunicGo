import { lazy, Suspense, useId, useState } from "react";
import type { User } from "firebase/auth";
import { LoadingState } from "../../shared/Loading";
import "./customer-workspace.css";
const Profile = lazy(() =>
  import("../profile/Profile").then((module) => ({ default: module.Profile })),
);
export function CustomerWorkspace({
  user,
  language,
}: {
  user: User | null;
  language: "vi" | "en";
}) {
  // Identity remount fences PII; collapsing leaves uncertain operations mounted.
  return (
    <AccountForm
      key={user?.uid ?? "signed-out"}
      user={user}
      language={language}
    />
  );
}
function AccountForm({
  user,
  language,
}: {
  user: User | null;
  language: "vi" | "en";
}) {
  const [open, setOpen] = useState(false),
    [visited, setVisited] = useState(false);
  const id = useId(),
    vi = language === "vi";
  return (
    <section
      className="askCustomerWorkspace"
      aria-label={vi ? "Hồ sơ và địa chỉ" : "Profile and addresses"}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setVisited(true);
          setOpen((value) => !value);
        }}
      >
        {vi ? "Hồ sơ và địa chỉ" : "Profile and addresses"}
      </button>
      <div id={id} hidden={!open} lang="vi">
        {visited && (
          <Suspense
            fallback={
              <LoadingState overlay={false}>
                {vi ? "Đang tải hồ sơ…" : "Loading profile…"}
              </LoadingState>
            }
          >
            <Profile user={user} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
