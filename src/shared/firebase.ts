import {
  loginFeedback,
  publishAuthFailure,
} from "../features/auth/auth-feedback";
import { requestActionMfa } from "../features/auth/ActionMfa";
import { runWithMfaRecovery } from "./mfa-recovery";
import { notify, withProgress } from "./feedback";
import { serviceError } from "./service-error";
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
export const emulatorMode =
  local && env.VITE_FIREBASE_PROJECT_ID === "demo-satsunicgo";
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
if (app && !local && env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY)
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY,
    ),
    isTokenAutoRefreshEnabled: true,
  });
if (local && auth && db && functions) {
  connectAuthEmulator(
    auth,
    `http://127.0.0.1:${Number(env.VITE_AUTH_EMULATOR_PORT ?? 9198)}`,
    { disableWarnings: true },
  );
  connectFirestoreEmulator(
    db,
    "127.0.0.1",
    Number(env.VITE_FIRESTORE_EMULATOR_PORT ?? 8181),
  );
  connectFunctionsEmulator(
    functions,
    "127.0.0.1",
    Number(env.VITE_FUNCTIONS_EMULATOR_PORT ?? 5101),
  );
}
export async function login() {
  if (!auth) throw Error("Đăng nhập chưa được kích hoạt.");
  const p = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, p);
  } catch (e) {
    if (captureMfa(e, auth)) return;
    const code = (e as { code?: string }).code;
    if (code === "auth/popup-blocked") {
      try {
        await signInWithRedirect(auth, p);
      } catch (failure) {
        throw Object.assign(new Error(loginFeedback(failure)), {
          code: (failure as { code?: string }).code,
        });
      }
    } else throw Object.assign(new Error(loginFeedback(e)), { code });
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
    if (!captureMfa(error, auth)) publishAuthFailure(error);
  });
export async function sendCommand(
  action: string,
  payload: unknown,
  orderId?: string,
  expectedVersion?: number,
  operationId: string = crypto.randomUUID(),
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
    return (await recoverCallable("command", data)).data as {
      id: string;
      version: number;
    };
  } catch (e) {
    const error = serviceError(e, "Chưa lưu được. Thử lại sau.");
    notify(error.message, "error");
    throw error;
  }
}
const readServices = new Set([
  "purchaseCheckoutSetup",
  "purchaseOrderRead",
  "purchaseReceipt",
  "currentAskConversation",
  "listWork",
  "readOwnerConfiguration",
  "ticketMessages",
  "publicPage",
  "readNotification",
  "readOrderConversation",
  "orderHistory",
  "readStaffAccess",
  "readCustomer",
  "listCustomers",
  "listFollowUps",
  "listCrmStaff",
  "operationalDashboard",
  "listOrderImages",
  "readOrderImage",
  "financeReview",
  "readOrderOperations",
  "invoiceList",
  "invoiceDetail",
  "customerOrderTracking",
  "shippingRatesPublic",
  "studioRead",
  "studioAdvancedRead",
  "studioMediaRead",
  "blogCommentList",
  "productReviewRead",
  "productReviewEligibility",
  "productReviewAdmin",
]);
export async function callService<T>(
  name: string,
  data: unknown,
  feedback: "global" | "inline" = "global",
): Promise<T> {
  if (!functions || !navigator.onLine)
    throw Error("Không thể kết nối lúc này. Kiểm tra kết nối và thử lại.");
  const readOnly =
    readServices.has(name) ||
    (name === "purchaseCheckout" &&
      (data as { action?: string })?.action === "status") ||
    (name === "purchaseDraftImage" &&
      (data as { action?: string })?.action === "read") ||
    (name === "shippingRatesAdmin" &&
      (data as { action?: string })?.action === "read");
  try {
    return (await recoverCallable(name, data, readOnly, feedback === "inline"))
      .data as T;
  } catch (e) {
    const error = serviceError(e, "Chưa xử lý được. Thử lại sau.");
    if (feedback === "global") notify(error.message, "error");
    throw error;
  }
}
async function recoverCallable(
  name: string,
  data: unknown,
  readOnly = false,
  inline = false,
) {
  const uid = auth?.currentUser?.uid;
  const path = window.location.pathname;
  const payload = structuredClone(data);
  const execute = () =>
    withProgress(
      () =>
        httpsCallable(functions!, name, { timeout: readOnly ? 15000 : 60000 })(
          payload,
        ),
      { overlay: !readOnly && !inline },
    );
  return runWithMfaRecovery(
    execute,
    async () => {
      if (!auth || !uid || auth.currentUser?.uid !== uid)
        throw Error("Đăng nhập lại để tiếp tục.");
      await requestActionMfa(auth);
    },
    () => auth?.currentUser?.uid === uid && window.location.pathname === path,
  );
}
