// Owned synthetic fixture only; real Firebase SDK, Auth/Firestore/Functions emulator transport.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  inMemoryPersistence,
  setPersistence,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";
declare const __TRACKING_QA_FIXTURE__: {
  orderId: string;
  parcelId: string;
  owner: { uid: string; sub: string; email: string };
  staff: { uid: string; sub: string; email: string };
};
// Injected by the dedicated fixture build; ordinary application builds do not
// depend on an ignored, machine-local JSON file.
const fixture = __TRACKING_QA_FIXTURE__;
if (location.origin !== "http://127.0.0.1:5207")
  throw Error("Owned emulator fixture only");
export const role = new URLSearchParams(location.search).get("role") ?? "owner";
const app = initializeApp(
  { apiKey: "demo-only", projectId: "demo-satsunicgo", appId: "tracking-qa" },
  "tracking-qa-" + role,
);
export const auth = getAuth(app),
  db = getFirestore(app),
  functions = getFunctions(app, "asia-southeast1");
connectAuthEmulator(auth, "http://127.0.0.1:19207", { disableWarnings: true });
connectFirestoreEmulator(db, "127.0.0.1", 18207);
connectFunctionsEmulator(functions, "127.0.0.1", 15207);
export const evidence = {
  calls: {} as Record<string, number>,
  forbiddenSinks: 0,
  faults: [] as { mode: string; operationId: unknown }[],
};
export async function loginFixture() {
  await setPersistence(auth, inMemoryPersistence);
  if (role === "guest") return;
  const actor = role === "crm" ? fixture.staff : fixture.owner;
  await signInWithCredential(
    auth,
    GoogleAuthProvider.credential(
      JSON.stringify({
        sub: actor.sub,
        email: actor.email,
        email_verified: true,
      }),
    ),
  );
  if (auth.currentUser?.uid !== actor.uid) throw Error("Identity mismatch");
}
let nextShippingFault: "before" | "after" | null = null;
export function armShippingFault(mode: "before" | "after") {
  nextShippingFault = mode;
}
export async function callService<T = unknown>(
  name: string,
  data: Record<string, unknown>,
): Promise<T> {
  if (name === "listWork" && !data.id)
    data = {
      ...data,
      id: data.kind === "packages" ? fixture.parcelId : fixture.orderId,
    };
  evidence.calls[name] = (evidence.calls[name] ?? 0) + 1;
  if (name === "shippingCommand" && nextShippingFault) {
    const mode = nextShippingFault;
    nextShippingFault = null;
    const controller = new AbortController();
    if (mode === "before") controller.abort();
    evidence.faults.push({ mode, operationId: data.operationId });
    try {
      const token = await auth.currentUser!.getIdToken();
      const response = await fetch(
        "http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/shippingCommand",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: "Bearer " + token,
          },
          body: JSON.stringify({ data }),
          signal: controller.signal,
        },
      );
      // Abort response-body consumption after the real server acknowledged headers.
      // This tests lost client acknowledgement, not a physical network outage.
      controller.abort();
      await response.json();
      throw Error("Expected aborted body consumption");
    } catch (error) {
      if ((error as Error).name !== "AbortError") throw error;
      throw Object.assign(Error("Synthetic transport acknowledgement loss"), {
        code: "functions/unavailable",
      });
    }
  }
  return (await httpsCallable(functions, name)(data)).data as T;
}
export { fixture };
export const emulatorMode = true;
export function forbidden() {
  evidence.forbiddenSinks++;
  throw Error("Unexpected provider/sink");
}
const commerce = {
  get user() {
    return auth.currentUser;
  },
  conversationId: "synthetic-qa-conversation",
  restorationReady: true,
  busy: false,
  pendingOperation: null,
  draft: {},
  order: null,
  conversation: null,
  error: null,
  resolved: forbidden,
};
export const useAskCommerce = () => commerce;
export const useActionPreview = () => ({
  commerce,
  invalidate() {},
  preview: null,
  hideReview() {},
});
export const useAskImages = () => ({
  photos: [],
  working: false,
  error: null,
  prepare: () => [],
  add() {},
  remove() {},
  markSent() {},
});
export function trackAsk() {} // Isolated fixture does not emit analytics.
export const askService = forbidden;
