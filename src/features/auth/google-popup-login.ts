import { loginFeedback } from "./auth-feedback";

type LoginState = { open: boolean; busy: boolean; error: string };
let state: LoginState = { open: false, busy: false, error: "" };
let flight: Promise<void> | null = null;
const listeners = new Set<() => void>();
export const googleLoginSnapshot = () => state;
export function subscribeGoogleLogin(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function publish(next: LoginState) {
  state = next;
  listeners.forEach((listener) => listener());
}
export function dismissGoogleLogin() {
  // Dismissal leaves the provider request owned until its actual completion.
  // The Firebase SDK does not expose cancellation of signInWithPopup.
  publish({ ...state, open: false });
}
export function googlePopupLogin(
  popup: () => Promise<unknown>,
  captureChallenge: (error: unknown) => boolean,
): Promise<void> {
  if (flight) {
    publish({ ...state, open: true });
    return flight;
  }
  publish({ open: true, busy: true, error: "" });
  // Invoke before any await so Safari receives the original click activation.
  let result: Promise<unknown>;
  try { result = popup(); }
  catch (error) { result = Promise.reject(error); }
  flight = result.then(() => {
    publish({ open: false, busy: false, error: "" });
  }).catch((error: unknown) => {
    let captured = false;
    try { captured = captureChallenge(error); }
    catch { /* An invalid provider challenge is a recoverable login failure. */ }
    if (captured) {
      publish({ open: false, busy: false, error: "" });
      return;
    }
    const message = loginFeedback(error);
    publish({ ...state, busy: false, error: message });
    throw Object.assign(new Error(message), {
      code: (error as { code?: string } | null)?.code,
    });
  }).finally(() => { flight = null; });
  return flight;
}
