import type { Firestore, Transaction } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { isStringRoleArray } from "./auth/guards";
import { nextStudioRevision } from "../../packages/domain/blog-studio";
export type EditorialRole = "author" | "publisher" | "admin";
export async function studioAuthority(
  db: Firestore,
  tx: Transaction,
  uid: string,
  owner = false,
): Promise<EditorialRole> {
  const [a, u, g] = await Promise.all([
    tx.get(db.doc(`staffAccess/${uid}`)),
    tx.get(db.doc(`users/${uid}`)),
    tx.get(db.doc(`blogEditorialMembers/${uid}`)),
  ]);
  const access = a.data();
  if (
    access?.active !== true ||
    access.locked ||
    u.data()?.locked ||
    !isStringRoleArray(access.roles) ||
    !access.roles.some((r) => ["OWNER", "CONTENT_EDITOR"].includes(r)) ||
    (owner && !access.roles.includes("OWNER"))
  )
    throw new HttpsError("permission-denied", "Cần quyền biên tập nội dung.");
  const role = g.exists
    ? g.get("role")
    : access.roles.includes("OWNER")
      ? "admin"
      : "publisher";
  if (
    g.exists &&
    (g.get("active") !== true ||
      !["author", "publisher", "admin"].includes(role))
  )
    throw new HttpsError("permission-denied", "Quyền Studio đã bị thu hồi.");
  if (owner && role !== "admin")
    throw new HttpsError("permission-denied", "Cần quyền quản trị Studio.");
  return role;
}
export function requireStudioPublisher(role: EditorialRole) {
  if (role === "author")
    throw new HttpsError("permission-denied", "Cần quyền xuất bản nội dung.");
}
export function requireStudioDraft(
  role: EditorialRole,
  uid: string,
  post: { owner?: unknown; assignee?: unknown },
) {
  if (role === "author" && post.owner !== uid && post.assignee !== uid)
    throw new HttpsError("permission-denied", "Không thể truy cập bản thảo.");
}
export function safeStudioSchedule(s: Record<string, unknown> | undefined) {
  return s
    ? {
        dueAt: typeof s.dueAt === "string" ? s.dueAt : null,
        revision: typeof s.revision === "number" ? s.revision : null,
        status: s.status === "blocked" ? "blocked" : "scheduled",
        error: typeof s.code === "string" ? s.code : null,
        ...(typeof s.requestedAt === "string"
          ? { requestedAt: s.requestedAt }
          : {}),
      }
    : null;
}

/** Bind an explicitly invited verified Google identity; this never grants CRM access. */
export async function bindStudioIdentity(
  db: Firestore,
  uid: string,
  email?: string,
) {
  if (email === undefined) return;
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized))
    throw new HttpsError("permission-denied", "Cần email Google đã xác thực.");
  const { createHash } = await import("node:crypto"),
    key = createHash("sha256").update(normalized).digest("hex"),
    inviteRef = db.doc(`blogEditorialInvites/${key}`),
    memberRef = db.doc(`blogEditorialMembers/${uid}`);
  await db.runTransaction(async (tx) => {
    const [a, u, i, m] = await Promise.all([
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(inviteRef),
      tx.get(memberRef),
    ]);
    if (!i.exists) return;
    const access = a.data();
    if (
      access?.active !== true ||
      access.locked ||
      u.data()?.locked ||
      !isStringRoleArray(access.roles) ||
      !access.roles.some((r) => ["OWNER", "CONTENT_EDITOR"].includes(r))
    )
      throw new HttpsError(
        "permission-denied",
        "Cần quyền nhân viên phù hợp để tham gia Studio.",
      );
    if (i.get("email") !== normalized || (i.get("uid") && i.get("uid") !== uid))
      throw new HttpsError(
        "permission-denied",
        "Danh tính Google của lời mời đã thay đổi.",
      );
    if (m.exists) {
      if (i.get("active") !== true && m.get("active") === true)
        tx.update(memberRef, {
          active: false,
          role: "reader",
          revision: nextStudioRevision(m.get("revision") ?? 1),
        });
      return;
    }
    const role = i.get("active") === true ? i.get("role") : "reader";
    if (!["author", "publisher", "admin", "reader"].includes(role))
      throw new HttpsError(
        "failed-precondition",
        "Lời mời Studio không hợp lệ.",
      );
    const name = String(u.get("displayName") ?? "Thành viên").slice(0, 80),
      member = {
        id: uid,
        uid,
        email: normalized,
        name,
        role,
        active: role !== "reader",
        revision: 1,
        inviteId: key,
        updatedAt: new Date().toISOString(),
      };
    tx.create(memberRef, member);
    tx.update(inviteRef, {
      uid,
      name,
      connected: true,
      lastSignInAt: new Date().toISOString(),
    });
  });
}
