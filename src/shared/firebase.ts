import { withProgress } from "./feedback";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { captureMfa, clearMfa } from "../features/auth/mfa";
const env = import.meta.env;
export const betaRelease = env.VITE_BETA_RELEASE === "true";
export const configured =
  !betaRelease &&
  !!(
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID
  );
const local = env.DEV && env.VITE_USE_EMULATORS === "true";
if (env.VITE_USE_EMULATORS === "true" && !env.DEV)
  throw Error("Emulators cannot be enabled in a production build");
if (local && !env.VITE_FIREBASE_PROJECT_ID?.startsWith("demo-"))
  throw Error("Emulator mode requires a demo- project ID");
export const app = configured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      appId: env.VITE_FIREBASE_APP_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    })
  : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const functions = app
  ? getFunctions(app, env.VITE_FIREBASE_REGION ?? "asia-southeast1")
  : null;
if (app && env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY)
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY,
    ),
    isTokenAutoRefreshEnabled: true,
  });
if (local && auth && db && functions) {
  connectAuthEmulator(auth, "http://127.0.0.1:9198", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8181);
  connectFunctionsEmulator(functions, "127.0.0.1", 5101);
}
export async function login() {
  if (!auth) throw Error("Đăng nhập chưa được kích hoạt.");
  const p = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, p);
  } catch (e) {
    if (captureMfa(e, auth))
      throw Error(
        "Cần xác thực hai lớp. Mở Bảo mật tài khoản để nhập mã xác thực.",
      );
    const code = (e as { code?: string }).code;
    if (code === "auth/popup-blocked") await signInWithRedirect(auth, p);
    else throw Error("Chưa đăng nhập được. Hãy thử lại.");
  }
}
export async function logout() {
  clearMfa();
  if (auth) await signOut(auth);
  for (const key of Object.keys(sessionStorage))
    if (key.startsWith("request-")) sessionStorage.removeItem(key);
}
if (auth)
  void getRedirectResult(auth).catch((error) => {
    captureMfa(error, auth);
  });
export async function sendCommand(
  action: string,
  payload: unknown,
  orderId?: string,
  expectedVersion?: number,
  operationId = crypto.randomUUID(),
) {
  if (!functions || !navigator.onLine)
    throw Error("Không thể gửi lúc này. Kiểm tra kết nối và thử lại.");
  const data = {
    action,
    payload,
    operationId,
    ...(orderId ? { orderId, expectedVersion } : {}),
  };
  try {
    return (
      await withProgress(() => httpsCallable(functions!, "command")(data))
    ).data as {
      id: string;
      version: number;
    };
  } catch (e) {
    throw Object.assign(
      new Error(
        (e as { message?: string }).message ?? "Chưa lưu được. Thử lại sau.",
      ),
      { code: (e as { code?: string }).code },
    );
  }
}
export async function callService<T>(name: string, data: unknown): Promise<T> {
  if (!functions || !navigator.onLine)
    throw Error("Không thể kết nối lúc này. Kiểm tra kết nối và thử lại.");
  try {
    return (await withProgress(() => httpsCallable(functions!, name)(data)))
      .data as T;
  } catch (e) {
    throw Error(
      (e as { message?: string }).message ?? "Chưa xử lý được. Thử lại sau.",
    );
  }
}
