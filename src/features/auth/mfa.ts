import {
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type MultiFactorResolver,
  type MultiFactorError,
  type Auth,
} from "firebase/auth";

let resolver: MultiFactorResolver | null = null;
export function captureMfa(error: unknown, auth: Auth | null) {
  if (
    auth &&
    (error as { code?: string }).code === "auth/multi-factor-auth-required"
  ) {
    resolver = getMultiFactorResolver(auth, error as MultiFactorError);
    return true;
  }
  return false;
}
export function pendingMfa() {
  return resolver;
}
export async function verifyMfa(enrollmentId: string, code: string) {
  if (!resolver) throw Error("NO_CHALLENGE");
  await resolver.resolveSignIn(
    TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, code),
  );
  resolver = null;
}
export function clearMfa() {
  resolver = null;
}
