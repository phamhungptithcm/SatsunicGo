import { useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithCredential,
  type User,
} from "firebase/auth";
import { auth } from "../../shared/firebase";
import { captureMfa } from "./mfa";
type Identity = {
  initialize: (options: {
    client_id: string;
    auto_select: boolean;
    callback: (r: { credential: string }) => void;
  }) => void;
  prompt: () => void;
  cancel: () => void;
};
function identity() {
  return (window as unknown as { google?: { accounts?: { id?: Identity } } })
    .google?.accounts?.id;
}
let loader: Promise<void> | null = null;
function load() {
  if (identity()) return Promise.resolve();
  if (!loader)
    loader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timer = setTimeout(() => {
        script.remove();
        loader = null;
        reject(Error("ONE_TAP_TIMEOUT"));
      }, 10000);
      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        loader = null;
        reject(Error("ONE_TAP_UNAVAILABLE"));
      };
      document.head.appendChild(script);
    });
  return loader;
}
export function OneTap({
  user,
  onError,
}: {
  user: User | null;
  onError: (message: string) => void;
}) {
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (
      !auth ||
      user ||
      !clientId ||
      import.meta.env.VITE_USE_EMULATORS === "true"
    )
      return;
    let active = true;
    void load()
      .then(() => {
        if (!active) return;
        const id = identity();
        if (!id) return;
        id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (r) => {
            if (!active || !auth || !r.credential) return;
            void signInWithCredential(
              auth,
              GoogleAuthProvider.credential(r.credential),
            ).catch((e) => {
              if (!active) return;
              if (captureMfa(e, auth))
                onError(
                  "Cần xác thực hai lớp. Mở Bảo mật tài khoản để tiếp tục.",
                );
              else
                onError(
                  "One Tap chưa đăng nhập được. Dùng nút Đăng nhập với Google để thử lại.",
                );
            });
          },
        });
        id.prompt();
      })
      .catch(() => {
        /* The persistent Google popup/redirect button remains available. */
      });
    return () => {
      active = false;
      identity()?.cancel();
    };
  }, [user, onError]);
  return null;
}
