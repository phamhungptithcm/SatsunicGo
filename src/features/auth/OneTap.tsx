import { useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithCredential,
  type User,
} from "firebase/auth";
import { auth } from "../../shared/firebase";
import { captureMfa } from "./mfa";
import {
  createOneTapController,
  type OneTapIdentity,
} from "./one-tap-controller";
function identity() {
  return (
    window as unknown as { google?: { accounts?: { id?: OneTapIdentity } } }
  ).google?.accounts?.id;
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
        if (identity()) resolve();
        else {
          script.remove();
          loader = null;
          reject(Error("ONE_TAP_UNAVAILABLE"));
        }
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
    let dispose: (() => void) | undefined;
    void load()
      .then(() => {
        if (!active) return;
        const id = identity();
        if (!id) return;
        dispose = createOneTapController(
          id,
          clientId,
          (credential) =>
            signInWithCredential(
              auth!,
              GoogleAuthProvider.credential(credential),
            ),
          (error) => {
            if (!active) return;
            if (auth && captureMfa(error, auth)) onError("");
            else onError("Chưa đăng nhập được. Mở tài khoản để thử lại.");
          },
        );
      })
      .catch(() => {
        if (active)
          onError("Chưa kết nối được Google. Mở tài khoản để thử lại.");
      });
    return () => {
      active = false;
      dispose?.();
    };
  }, [user, onError]);
  return null;
}
