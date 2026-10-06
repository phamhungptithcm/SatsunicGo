import { z } from "zod";
import { studioIdSchema } from "./blog-studio";
import { googleStudioAvatar } from "./blog-studio-advanced";
export const blogCommentSubmitSchema = z
  .object({
    postId: studioIdSchema,
    parentId: z.union([studioIdSchema, z.literal("")]).default(""),
    text: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .refine(
        (v) =>
          v.normalize("NFKC").replace(/[\u200b-\u200d\ufeff\s]/gu, "").length >
          0,
      ),
    name: z.string().trim().min(1).max(80),
    operationId: studioIdSchema,
  })
  .strict();
export const blogCommentListSchema = z
  .object({
    postId: studioIdSchema,
    parentId: z.union([studioIdSchema, z.literal("")]).default(""),
    sort: z.enum(["newest", "oldest"]).default("newest"),
    commentId: studioIdSchema.optional(),
    after: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,256}$/)
      .optional(),
  })
  .strict();
export type BlogComment = {
  id: string;
  postId: string;
  parentId: string;
  uid: string;
  name: string;
  text: string;
  status: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  badge?: string;
  avatar?: string;
  approvedReplyCount?: number;
};
/** Explicit public fields, no UID/email/avatar/anti-abuse metadata. Text is rendered as text by caller. */
export function publicBlogComment(c: BlogComment) {
  const deleted = ["deleted", "deleted_private"].includes(c.status);
  return {
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    name: deleted ? "" : c.name,
    text: deleted ? "" : c.text,
    status: deleted ? "deleted" : c.status,
    revision: c.revision,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    ...(!deleted && googleStudioAvatar(c.avatar)
      ? { avatar: googleStudioAvatar(c.avatar) }
      : {}),
    badge: deleted ? "" : (c.badge ?? ""),
    approvedReplyCount:
      Number.isSafeInteger(c.approvedReplyCount) &&
      Number(c.approvedReplyCount) >= 0
        ? c.approvedReplyCount!
        : 0,
  };
}
export function commentRate(recent: unknown, now: number): number[] {
  if (
    recent !== undefined &&
    (!Array.isArray(recent) ||
      recent.length > 5 ||
      recent.some((t) => !Number.isSafeInteger(t) || t < 0 || t > now + 30000))
  )
    throw new Error("INVALID_RATE_LEDGER");
  const times = ((recent ?? []) as number[])
    .filter((t) => now - t < 3600000)
    .sort((a, b) => a - b);
  if (times.length >= 5 || times.some((t) => now - t < 30000))
    throw new Error("COMMENT_RATE_LIMIT");
  return [...times, now];
}

export const blogCommentCommandSchema = z
  .object({
    action: z.enum(["edit", "delete"]),
    id: studioIdSchema,
    expectedVersion: z
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER - 1),
    operationId: studioIdSchema,
    text: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();
export const blogCommentReportSchema = z
  .object({
    id: studioIdSchema,
    reason: z.string().trim().min(1).max(500),
    operationId: studioIdSchema,
  })
  .strict();
