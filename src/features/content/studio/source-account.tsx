"use client";
import { sourceMessage as message, type SourceRouter } from "./source-adapter";
import { BlogToast } from "./toast";
import { SourceLink as Link } from "./source-link";

import { useId, useState } from "react";
import { googleAvatar } from "./source-adapter";
import styles from "./source-account.module.css";
export function Account({
  name,
  avatar,
  staff = false,
  embedded = false,
  compact = false,
  onSignedOut,
  onNavigate,
  headingId,
  router,
  signOut,
}: {
  router: SourceRouter & { replace: (path: string) => void };
  signOut: () => Promise<void>;
  name: string;
  avatar?: string;
  staff?: boolean;
  embedded?: boolean;
  compact?: boolean;
  onSignedOut?: () => void;
  onNavigate?: () => void;
  headingId?: string;
}) {
  const generatedHeadingId = useId();
  const titleId = headingId ?? generatedHeadingId;

  const copy = (vi: string, en: string) => (embedded ? vi : en);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState("");
  const image = googleAvatar(avatar);
  return (
    <section
      className={`${styles.account}${embedded ? ` ${styles.embedded}` : ""}${compact ? ` ${styles.compact}` : ""}`}
      aria-labelledby={titleId}
      aria-busy={busy}
    >
      <header className={styles.heading}>
        <h1 id={titleId}>{copy("Tài khoản", "Account")}</h1>
        <p>{copy("Thông tin đăng nhập của bạn.", "Your sign-in details.")}</p>
      </header>
      <div className={styles.panel}>
        <div className={styles.profile}>
          {image && image !== failedAvatar ? (
            <img
              className={styles.avatar}
              src={image}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setFailedAvatar(image)}
            />
          ) : (
            <span className={styles.avatar} aria-hidden="true">
              {name.trim().slice(0, 1).toUpperCase() || "?"}
            </span>
          )}
          <div>
            <h2>{name}</h2>
            <p>{copy("Đăng nhập bằng Google", "Signed in with Google")}</p>
          </div>
        </div>
        <div className={styles.actions}>
          <div className={styles.links}>
            {staff && (
              <Link
                navigate={router.push}
                className={styles.primary}
                href="/crm/studio"
                onClick={onNavigate}
              >
                {copy("Mở Studio", "Open Studio")}{" "}
                <span aria-hidden="true">↗</span>
              </Link>
            )}
            <Link
              navigate={router.push}
              className={styles.link}
              href="/posts"
              onClick={onNavigate}
            >
              {copy("Đọc blog", "Read the blog")}{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <button
            className={styles.logout}
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              setNotice("");
              try {
                await signOut();
                // Go signOut owns One Tap/session cleanup.

                if (onSignedOut) {
                  onSignedOut();
                  router.refresh();
                  return;
                }
                router.replace("/posts");
                router.refresh();
              } catch (e) {
                setNotice(message(e));
                setBusy(false);
              }
            }}
          >
            {busy
              ? copy("Đang đăng xuất…", "Signing out…")
              : copy("Đăng xuất", "Sign out")}
          </button>
        </div>
      </div>
      {notice && (
        <BlogToast
          text={notice}
          kind="error"
          language={embedded ? "vi" : "en"}
          onClose={() => setNotice("")}
        />
      )}
    </section>
  );
}
