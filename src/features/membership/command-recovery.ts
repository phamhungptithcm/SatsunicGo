import { z } from "zod";
const id = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
const common = { schemaVersion: z.literal(1), operationId: z.string().uuid() };
export const membershipAttemptSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...common,
      action: z.literal("purchase"),
      payload: z.object({ planId: id }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      action: z.literal("cancelInvoice"),
      payload: z.object({ invoiceId: id }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      action: z.literal("requestRenewal"),
      payload: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      action: z.literal("cancelRenewal"),
      payload: z.object({}).strict(),
    })
    .strict(),
]);
export type MembershipAttempt = z.infer<typeof membershipAttemptSchema>;
export function sameMembershipAttempt(
  a: MembershipAttempt,
  b: MembershipAttempt,
) {
  return (
    JSON.stringify(membershipAttemptSchema.parse(a)) ===
    JSON.stringify(membershipAttemptSchema.parse(b))
  );
}
async function key(owner: string) {
  if (!owner || owner.length > 128) throw Error("MEMBERSHIP_OWNER_INVALID");
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(owner),
  );
  return `satsunicgo.membership-attempt.v1.${Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
function read(storageKey: string) {
  const value = localStorage.getItem(storageKey);
  if (value === null) return null;
  if (value.length > 1000) throw Error("MEMBERSHIP_ATTEMPT_INVALID");
  return membershipAttemptSchema.parse(JSON.parse(value));
}
export async function readMembershipAttempt(owner: string) {
  return read(await key(owner));
}
export async function reserveMembershipAttempt(
  owner: string,
  value: MembershipAttempt,
) {
  const candidate = membershipAttemptSchema.parse(value),
    storageKey = await key(owner);
  if (!navigator.locks) throw Error("MEMBERSHIP_RECOVERY_UNAVAILABLE");
  return navigator.locks.request(storageKey, () => {
    const previous = read(storageKey);
    if (previous) return { attempt: previous, reserved: false };
    localStorage.setItem(storageKey, JSON.stringify(candidate));
    // A restricted storage implementation must not silently drop the reservation.
    const stored = read(storageKey);
    if (!stored || !sameMembershipAttempt(stored, candidate))
      throw Error("MEMBERSHIP_RECOVERY_UNAVAILABLE");
    return { attempt: candidate, reserved: true };
  });
}
export async function clearMembershipAttempt(
  owner: string,
  candidate: MembershipAttempt,
) {
  const storageKey = await key(owner);
  if (!navigator.locks) throw Error("MEMBERSHIP_RECOVERY_UNAVAILABLE");
  await navigator.locks.request(storageKey, () => {
    const previous = read(storageKey);
    if (previous === null) return;
    if (!sameMembershipAttempt(previous, candidate))
      throw Error("MEMBERSHIP_ATTEMPT_CHANGED");
    localStorage.removeItem(storageKey);
    if (read(storageKey) !== null)
      throw Error("MEMBERSHIP_RECOVERY_UNAVAILABLE");
  });
}
export function admitMembershipResult(
  value: unknown,
  attempt: MembershipAttempt,
  owner: string,
) {
  const resultId = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
  const result =
    attempt.action === "purchase"
      ? z
          .object({ id: resultId, state: z.enum(["active", "pending"]) })
          .strict()
          .parse(value)
      : z.object({ id: resultId }).strict().parse(value);
  if (
    (attempt.action === "purchase" &&
      "state" in result &&
      result.state === "active" &&
      result.id !== owner) ||
    ((attempt.action === "requestRenewal" ||
      attempt.action === "cancelRenewal") &&
      result.id !== owner) ||
    (attempt.action === "cancelInvoice" &&
      result.id !== attempt.payload.invoiceId)
  )
    throw Error("INVALID_MEMBERSHIP_RESULT");
  return result;
}
