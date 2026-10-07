import {
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type MultiFactorResolver,
  type MultiFactorError,
  type Auth,
} from "firebase/auth";

let resolver: MultiFactorResolver | null = null;
const listeners = new Set<() => void>();
function update(next: MultiFactorResolver | null) {
  resolver = next;
  listeners.forEach((listener) => listener());
}
export function subscribeMfa(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function captureMfa(error: unknown, auth: Auth | null) {
  if (
    auth &&
    (error as { code?: string } | null)?.code ===
      "auth/multi-factor-auth-required"
  ) {
    update(getMultiFactorResolver(auth, error as MultiFactorError));
    return true;
  }
  return false;
}
export function pendingMfa() {
  return resolver;
}
export async function verifyMfa(enrollmentId: string, code: string) {
  const current = resolver;
  if (!current) throw Error("NO_CHALLENGE");
  if (
    !/^[0-9]{6}$/.test(code) ||
    !current.hints.some(
      (hint) =>
        hint.uid === enrollmentId &&
        hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
    )
  ) {
    throw Error("INVALID_CHALLENGE_INPUT");
  }
  await current.resolveSignIn(
    TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, code),
  );
  if (resolver === current) {
    update(null);
    completions.forEach((receive) => receive(true));
  }
}
export function clearMfa() {
  update(null);
  completions.forEach((receive) => receive(false));
}

const completions = new Set<(completed: boolean) => void>();
export function waitForMfaResult() {
  return new Promise<void>((resolve, reject) => {
    const receive = (completed: boolean) => {
      completions.delete(receive);
      if (completed) resolve();
      else
        reject(
          Object.assign(new Error("Đã hủy xác thực."), {
            code: "auth/cancelled",
          }),
        );
    };
    completions.add(receive);
  });
}
