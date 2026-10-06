import { HttpsError } from "firebase-functions/v2/https";

type VerifiedGoogleAuth = {
  uid: string;
  token: {
    email_verified?: unknown;
    firebase?: { sign_in_provider?: unknown };
  };
};

/** Only accepts auth already verified by the Firebase callable runtime. */
export function requireVerifiedGoogle(
  auth: VerifiedGoogleAuth | null | undefined,
): string {
  if (!auth?.uid)
    throw new HttpsError(
      "unauthenticated",
      "Đăng nhập với Google để tiếp tục.",
    );
  // Linked identities alone do not prove the provider of this session.
  // MFA adds sign_in_second_factor; it does not replace sign_in_provider.
  if (
    auth.token.email_verified !== true ||
    auth.token.firebase?.sign_in_provider !== "google.com"
  )
    throw new HttpsError(
      "permission-denied",
      "Cần tài khoản Google đã xác thực để tiếp tục.",
    );
  return auth.uid;
}

export function recentMfa(
  token: {
    auth_time?: unknown;
    firebase?: { sign_in_second_factor?: unknown };
  },
  now: number,
) {
  const seconds = Number(token.auth_time);
  return (
    Number.isSafeInteger(seconds) &&
    seconds > 0 &&
    seconds * 1000 <= now + 30000 &&
    now - seconds * 1000 < 300000 &&
    typeof token.firebase?.sign_in_second_factor === "string" &&
    token.firebase.sign_in_second_factor.length > 0
  );
}

/** Validate stored role metadata without narrowing the supported string union. */
export function isStringRoleArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((role: unknown) => typeof role === "string")
  );
}
