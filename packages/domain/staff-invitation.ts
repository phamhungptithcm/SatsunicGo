import { z } from "zod";

export const INVITATION_TTL = 7 * 24 * 60 * 60 * 1000;
export const INVITATION_COOLDOWN = 60_000;
export const invitationEmail = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((v) => v.toLowerCase());
export const invitationId = z.string().uuid();
export const invitationCommand = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create"),
      email: invitationEmail,
      operationId: z.uuid(),
    })
    .strict(),
  z
    .object({
      action: z.enum(["resend", "revoke"]),
      id: invitationId,
      version: z.number().int().positive(),
      operationId: z.uuid(),
    })
    .strict(),
]);
export const invitationRecord = z.object({
  id: invitationId,
  email: invitationEmail,
  state: z.enum(["pending", "accepted", "revoked"]),
  version: z.number().int().positive(),
  createdAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
  lastSentAt: z.number().int().nonnegative(),
  createdBy: z.string().min(1),
  acceptedUid: z.string().min(1).optional(),
  acceptedAt: z.number().int().nonnegative().optional(),
  displayName: z.string().max(160).optional(),
  jobId: z.string().min(1),
});
export type StaffInvitation = z.infer<typeof invitationRecord>;
export type InvitationView = Pick<
  StaffInvitation,
  "id" | "email" | "version" | "expiresAt" | "displayName" | "acceptedUid"
> & {
  state: "pending" | "accepted" | "revoked" | "expired";
  delivery:
    "queued" | "sending" | "accepted" | "failed" | "unknown" | "cancelled";
  hasAccess: boolean;
};
export function invitationState(
  value: StaffInvitation,
  now: number,
): InvitationView["state"] {
  return value.state === "pending" && value.expiresAt <= now
    ? "expired"
    : value.state;
}
export const invitationStateLabel = {
  pending: "Chờ chấp nhận",
  accepted: "Đã tham gia",
  revoked: "Đã thu hồi",
  expired: "Đã hết hạn",
};
export const invitationDeliveryLabel = {
  queued: "Đang chờ gửi email",
  sending: "Đang gửi email",
  accepted: "Dịch vụ email đã nhận yêu cầu gửi",
  failed: "Chưa gửi được email",
  unknown: "Chưa xác nhận được kết quả gửi",
  cancelled: "Đã dừng gửi email",
};

export type StaffMemberView = {
  uid: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  joinedAt: number | null;
  departedAt: number | null;
  roles: string[];
  active: boolean;
  locked: boolean;
  version: number | null;
  invitationId?: string;
};

/** Display only HTTPS avatar hosts used by Google; never proxy arbitrary profile URLs. */
export function googleAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443")
    )
      return null;
    return ["googleusercontent.com", "ggpht.com"].some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    )
      ? url.href
      : null;
  } catch {
    return null;
  }
}
