import {
  multiFactor,
  TotpMultiFactorGenerator,
  type TotpSecret,
  type User,
} from "firebase/auth";

// Track only running operations by account ID, so reauthentication creating a
// new User object cannot open a competing enrollment. Always release on settle.
const flights = new Map<string, Promise<void>>();
export async function waitForEnrollment(user: User) {
  await flights.get(user.uid)?.catch(() => {});
}
export async function enrollTotp(user: User, secret: TotpSecret, code: string) {
  if (flights.has(user.uid)) throw Error("ENROLLMENT_PENDING");
  const operation = multiFactor(user).enroll(
    TotpMultiFactorGenerator.assertionForEnrollment(secret, code),
    "Authenticator",
  );
  flights.set(user.uid, operation);
  try {
    await operation;
  } finally {
    if (flights.get(user.uid) === operation) flights.delete(user.uid);
  }
}

// Notify currently mounted security views only after provider readback. Retain
// neither a User/token nor an enrollment record beyond the notification.
const listeners = new Set<(user: User, count: number) => void>();
export function subscribeEnrollment(
  listener: (user: User, count: number) => void,
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function publishEnrollment(user: User, count: number) {
  if (count > 0) listeners.forEach((listener) => listener(user, count));
}
