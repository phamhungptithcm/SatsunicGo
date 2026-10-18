import { getAuth } from "firebase-admin/auth";
import { createHash, randomUUID } from "node:crypto";
import {
  FieldPath,
  getFirestore,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { z } from "zod";
import {
  requireVerifiedGoogle,
  recentMfa,
  isStringRoleArray,
} from "./auth/guards";
import {
  googleAvatarUrl,
  invitationCommand,
  invitationEmail,
  invitationId,
  invitationRecord,
  invitationState,
  INVITATION_TTL,
  INVITATION_COOLDOWN,
  type StaffInvitation,
  type InvitationView,
} from "../../packages/domain/staff-invitation";
const opts = {
  region: "asia-southeast1",
  maxInstances: 4,
  concurrency: 20,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export const invitationRef = (db: Firestore, id: string) =>
  db.doc(`staffInvitations/invite-${id}`);
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function invitationActor(
  db: Firestore,
  tx: Transaction,
  req: Pick<CallableRequest, "auth">,
  owner: boolean,
  mutation: boolean,
  now: number,
) {
  const uid = requireVerifiedGoogle(req.auth);
  const [user, access] = await Promise.all([
    tx.get(db.doc(`users/${uid}`)),
    tx.get(db.doc(`staffAccess/${uid}`)),
  ]);
  if (
    user.get("locked") ||
    access.get("locked") ||
    (owner &&
      (access.get("active") !== true ||
        !isStringRoleArray(access.get("roles")) ||
        !access.get("roles").includes("OWNER")))
  )
    throw new HttpsError(
      "permission-denied",
      "Không thể thực hiện thao tác với lời mời.",
    );
  if (owner && mutation && !recentMfa(req.auth!.token, now))
    throw new HttpsError(
      "failed-precondition",
      "Xác thực hai lớp gần đây để tiếp tục.",
      { reason: "RECENT_MFA_REQUIRED" },
    );
  return uid;
}
export async function runInvitationCommand(
  db: Firestore,
  req: Pick<CallableRequest, "auth" | "data">,
  now = Date.now(),
) {
  requireVerifiedGoogle(req.auth);
  const parsed = invitationCommand.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Kiểm tra email và lời mời.");
  const input = parsed.data;
  const newId = randomUUID();
  return db.runTransaction(async (tx) => {
    const uid = await invitationActor(db, tx, req, true, true, now);
    const op = db.doc(
      `idempotencyKeys/staff-invite-${uid}-${input.operationId}`,
    );
    const previous = await tx.get(op),
      hash = digest(JSON.stringify(input));
    if (previous.exists) {
      if (previous.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return previous.get("result") as { id: string };
    }
    const quotaRef = db.doc(`staffInvitations/quota-${digest(uid)}`),
      quota = await tx.get(quotaRef);
    const day = Math.floor(now / 86_400_000),
      attempts = quota.get("day") === day ? Number(quota.get("attempts")) : 0;
    let value: StaffInvitation;
    if (input.action === "create") {
      const lock = db.doc(`staffInvitations/email-${digest(input.email)}`),
        oldLock = await tx.get(lock);
      const old = oldLock.exists
        ? await tx.get(invitationRef(db, oldLock.get("id")))
        : null;
      if (old?.exists) {
        const stored = invitationRecord.parse(old.data());
        if (
          stored.state === "accepted" ||
          invitationState(stored, now) === "pending"
        )
          throw new HttpsError(
            "already-exists",
            "Email đã có lời mời hoặc đã tham gia. Tải lại danh sách.",
          );
        const job = await tx.get(
          db.doc(`staffInvitationMailJobs/${stored.jobId}`),
        );
        if (["sending", "unknown"].includes(job.get("state")))
          throw new HttpsError(
            "failed-precondition",
            "Cần kiểm tra kết quả gửi trước khi tạo lời mời mới.",
          );
      }
      if (
        attempts >= 20 ||
        (quota.exists && now - Number(quota.get("lastAt")) < 5_000)
      )
        throw new HttpsError(
          "resource-exhausted",
          "Đã đạt giới hạn gửi lời mời. Thử lại sau.",
        );
      value = {
        id: newId,
        email: input.email,
        state: "pending",
        version: 1,
        createdAt: now,
        expiresAt: now + INVITATION_TTL,
        lastSentAt: now,
        createdBy: uid,
        jobId: `${newId}-1`,
      };
      tx.set(lock, { id: newId });
    } else {
      const snapshot = await tx.get(invitationRef(db, input.id));
      if (!snapshot.exists)
        throw new HttpsError("not-found", "Lời mời không còn khả dụng.");
      value = invitationRecord.parse(snapshot.data());
      if (value.version !== input.version)
        throw new HttpsError(
          "aborted",
          "Lời mời đã thay đổi. Tải lại danh sách.",
        );
      if (value.state !== "pending")
        throw new HttpsError(
          "failed-precondition",
          "Lời mời không còn chờ chấp nhận.",
        );
      const emailLock = await tx.get(
        db.doc(`staffInvitations/email-${digest(value.email)}`),
      );
      if (input.action === "resend" && emailLock.get("id") !== value.id)
        throw new HttpsError(
          "failed-precondition",
          "Lời mời đã được thay thế. Tải lại danh sách để dùng lời mời mới.",
        );
      const jobRef = db.doc(`staffInvitationMailJobs/${value.jobId}`),
        job = await tx.get(jobRef);
      if (input.action === "revoke") {
        value = { ...value, state: "revoked", version: value.version + 1 };
        // Keep ambiguous dispatch visible: revocation cannot unsend an in-flight email.
        if (job.get("state") === "queued")
          tx.update(jobRef, { state: "cancelled" });
      } else {
        if (["sending", "unknown", "queued"].includes(job.get("state")))
          throw new HttpsError(
            "failed-precondition",
            "Lần gửi trước đang chờ hoặc chưa xác nhận. Tải lại để kiểm tra.",
          );
        if (now - value.lastSentAt < INVITATION_COOLDOWN || attempts >= 20)
          throw new HttpsError(
            "resource-exhausted",
            "Chưa thể gửi lại. Thử lại sau.",
          );
        value = {
          ...value,
          version: value.version + 1,
          lastSentAt: now,
          expiresAt: now + INVITATION_TTL,
          jobId: `${value.id}-${value.version + 1}`,
        };
      }
    }
    tx.set(invitationRef(db, value.id), value);
    if (input.action !== "revoke") {
      tx.create(db.doc(`staffInvitationMailJobs/${value.jobId}`), {
        invitationId: value.id,
        requestedBy: uid,
        state: "queued",
        createdAt: now,
        attempts: 0,
      });
      tx.set(quotaRef, { day, attempts: attempts + 1, lastAt: now });
    }
    const result = { id: value.id };
    tx.create(op, { hash, result, createdAt: now });
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: `staffInvitation.${input.action}`,
      entityId: value.id,
      createdAt: now,
    });
    return result;
  });
}
export async function runListInvitations(
  db: Firestore,
  req: Pick<CallableRequest, "auth" | "data">,
  now = Date.now(),
) {
  const input = z
    .object({ after: invitationId.optional() })
    .strict()
    .safeParse(req.data);
  if (!input.success)
    throw new HttpsError("invalid-argument", "Không thể tải danh sách.");
  return db.runTransaction(async (tx) => {
    await invitationActor(db, tx, req, true, false, now);
    let query = db
      .collection("staffInvitations")
      .orderBy(FieldPath.documentId())
      .startAt("invite-")
      .endBefore("invite-~")
      .limit(21);
    if (input.data.after)
      query = query.startAfter(`invite-${input.data.after}`);
    const rows = await tx.get(query),
      items: InvitationView[] = [];
    for (const row of rows.docs.slice(0, 20)) {
      const v = invitationRecord.parse(row.data());
      const job = await tx.get(db.doc(`staffInvitationMailJobs/${v.jobId}`));
      const access = v.acceptedUid
        ? await tx.get(db.doc(`staffAccess/${v.acceptedUid}`))
        : null;
      items.push({
        id: v.id,
        email: v.email,
        state: invitationState(v, now),
        version: v.version,
        expiresAt: v.expiresAt,
        ...(v.acceptedUid ? { acceptedUid: v.acceptedUid } : {}),
        ...(v.displayName ? { displayName: v.displayName } : {}),
        delivery: job.get("state") ?? "unknown",
        hasAccess:
          access?.get("active") === true &&
          !access.get("locked") &&
          isStringRoleArray(access.get("roles")) &&
          access.get("roles").length > 0,
      });
    }
    return { items, next: rows.size > 20 ? items.at(-1)!.id : null };
  });
}
export async function runRecipientInvitation(
  db: Firestore,
  req: Pick<CallableRequest, "auth" | "data">,
  accept: boolean,
  now = Date.now(),
) {
  requireVerifiedGoogle(req.auth);
  const input = z.object({ id: invitationId }).strict().safeParse(req.data);
  const email = invitationEmail.safeParse(req.auth?.token.email);
  if (!input.success || !email.success)
    throw new HttpsError("invalid-argument", "Lời mời không hợp lệ.");
  return db.runTransaction(async (tx) => {
    const uid = await invitationActor(db, tx, req, false, false, now);
    const ref = invitationRef(db, input.data.id),
      snapshot = await tx.get(ref);
    if (!snapshot.exists)
      throw new HttpsError(
        "permission-denied",
        "Lời mời không dành cho tài khoản này hoặc không còn khả dụng.",
      );
    const v = invitationRecord.parse(snapshot.data());
    if (v.email !== email.data || (v.acceptedUid && v.acceptedUid !== uid))
      throw new HttpsError(
        "permission-denied",
        "Lời mời không dành cho tài khoản này hoặc không còn khả dụng.",
      );
    let state = invitationState(v, now);
    if (accept && state !== "accepted") {
      if (state !== "pending")
        throw new HttpsError(
          "failed-precondition",
          "Lời mời đã hết hạn hoặc bị thu hồi.",
        );
      tx.update(ref, {
        state: "accepted",
        acceptedUid: uid,
        acceptedAt: now,
        version: v.version + 1,
        displayName:
          typeof req.auth!.token.name === "string"
            ? req.auth!.token.name.slice(0, 160)
            : "",
      });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: "staffInvitation.accept",
        entityId: v.id,
        createdAt: now,
      });
      state = "accepted";
    }
    return { state };
  });
}
export const staffInvitationCommand = onCall(opts, (req) =>
  runInvitationCommand(getFirestore(), req),
);
export const listStaffInvitations = onCall(opts, (req) =>
  runListInvitations(getFirestore(), req),
);
export const readStaffInvitation = onCall(opts, (req) =>
  runRecipientInvitation(getFirestore(), req, false),
);
export const acceptStaffInvitation = onCall(opts, (req) =>
  runRecipientInvitation(getFirestore(), req, true),
);

const profileText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, 320) : null;

/** All existing grants, including inactive/locked/departed staff, then accepted
 * invitees with no grant. Cursor is bounded; UI can page through the entire directory. */
export async function runListStaffMembers(
  db: Firestore,
  req: Pick<CallableRequest, "auth" | "data">,
  now = Date.now(),
) {
  const input = z
    .object({
      after: z
        .string()
        .regex(/^(staff|invite):[a-zA-Z0-9-]{0,128}$/)
        .optional(),
    })
    .strict()
    .safeParse(req.data);
  if (!input.success)
    throw new HttpsError(
      "invalid-argument",
      "Không thể tải danh sách nhân viên.",
    );
  const page = await db.runTransaction(async (tx) => {
    await invitationActor(db, tx, req, true, false, now);
    const [stage, cursor] = input.data.after?.split(":") ?? ["staff", ""];
    const members: import("../../packages/domain/staff-invitation").StaffMemberView[] =
      [];
    let next: string | null = null;
    if (stage === "staff") {
      let query = db
        .collection("staffAccess")
        .orderBy(FieldPath.documentId())
        .limit(21);
      if (cursor) query = query.startAfter(cursor);
      const rows = await tx.get(query);
      for (const row of rows.docs.slice(0, 20)) {
        const profile = await tx.get(db.doc(`users/${row.id}`));
        members.push({
          uid: row.id,
          avatarUrl: null,
          fullName: profileText(profile.get("displayName")),
          email: profileText(profile.get("email")),
          joinedAt: Number.isSafeInteger(row.get("joinedAt"))
            ? row.get("joinedAt")
            : null,
          departedAt: Number.isSafeInteger(row.get("departedAt"))
            ? row.get("departedAt")
            : null,
          roles: isStringRoleArray(row.get("roles")) ? row.get("roles") : [],
          active: row.get("active") === true,
          locked: Boolean(row.get("locked") || profile.get("locked")),
          version: Number.isSafeInteger(row.get("version"))
            ? row.get("version")
            : null,
        });
      }
      next = rows.size > 20 ? `staff:${rows.docs[19].id}` : "invite:";
    } else {
      let query = db
        .collection("staffInvitations")
        .where("state", "==", "accepted")
        .orderBy(FieldPath.documentId())
        .limit(21);
      if (cursor) query = query.startAfter(`invite-${cursor}`);
      const rows = await tx.get(query);
      for (const row of rows.docs.slice(0, 20)) {
        const v = invitationRecord.parse(row.data());
        if (!v.acceptedUid) continue;
        const access = await tx.get(db.doc(`staffAccess/${v.acceptedUid}`));
        if (access.exists) continue;
        const profile = await tx.get(db.doc(`users/${v.acceptedUid}`));
        members.push({
          uid: v.acceptedUid,
          avatarUrl: null,
          fullName: v.displayName || profileText(profile.get("displayName")),
          email: v.email,
          joinedAt: v.acceptedAt ?? null,
          departedAt: null,
          roles: [],
          active: false,
          locked: Boolean(profile.get("locked")),
          version: null,
          invitationId: v.id,
        });
      }
      next = rows.size > 20 ? `invite:${rows.docs[19].get("id")}` : null;
    }
    return { members, next };
  });
  // Read Google provider identity on each bounded page so stale customer-profile
  // fields do not override the employee's Google name or avatar.
  if (page.members.length) {
    const result = await getAuth().getUsers(
      page.members.map((row) => ({ uid: row.uid })),
    );
    for (const row of page.members) {
      const user = result.users.find((user) => user.uid === row.uid);
      const google = user?.providerData.find(
        (provider) => provider.providerId === "google.com",
      );
      row.fullName =
        profileText(google?.displayName) ??
        row.fullName ??
        profileText(user?.displayName);
      row.avatarUrl = googleAvatarUrl(
        google?.photoURL ?? (google ? user?.photoURL : null),
      );
      row.email ??= user?.email ?? null;
    }
  }
  // Authorization is rechecked after the separate Auth lookup before returning PII.
  await db.runTransaction((tx) =>
    invitationActor(db, tx, req, true, false, Date.now()),
  );
  return page;
}
export async function runDepartStaffMember(
  db: Firestore,
  req: Pick<CallableRequest, "auth" | "data">,
  now = Date.now(),
) {
  const input = z
    .object({
      uid: z.string().regex(/^[a-zA-Z0-9-]{1,128}$/),
      expectedVersion: z.number().int().nonnegative().nullable(),
      operationId: z.uuid(),
    })
    .strict()
    .safeParse(req.data);
  if (!input.success)
    throw new HttpsError("invalid-argument", "Kiểm tra lại nhân viên.");
  const d = input.data;
  return db.runTransaction(async (tx) => {
    const actor = await invitationActor(db, tx, req, true, true, now);
    if (actor === d.uid)
      throw new HttpsError(
        "failed-precondition",
        "Không thể tự ghi nhận nghỉ việc cho tài khoản đang quản trị.",
      );
    const opRef = db.doc(
        `idempotencyKeys/staff-depart-${actor}-${d.operationId}`,
      ),
      op = await tx.get(opRef),
      hash = digest(JSON.stringify(d));
    if (op.exists) {
      if (op.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return op.get("result") as { departedAt: number };
    }
    const ref = db.doc(`staffAccess/${d.uid}`),
      staff = await tx.get(ref);
    if (!staff.exists)
      throw new HttpsError(
        "not-found",
        "Nhân viên chưa được cấp quyền làm việc.",
      );
    if ((staff.get("version") ?? null) !== d.expectedVersion)
      throw new HttpsError(
        "aborted",
        "Quyền nhân viên đã thay đổi. Tải lại danh sách.",
      );
    if (staff.get("departedAt"))
      throw new HttpsError(
        "failed-precondition",
        "Nhân viên đã được ghi nhận nghỉ việc.",
      );
    const version = staff.get("version") ?? 0;
    if (
      !Number.isSafeInteger(version) ||
      version < 0 ||
      version >= Number.MAX_SAFE_INTEGER
    )
      throw new HttpsError("failed-precondition", "Dữ liệu quyền chưa hợp lệ.");
    tx.update(ref, {
      active: false,
      departedAt: now,
      version: version + 1,
      changedAt: now,
      changedBy: actor,
    });
    const result = { departedAt: now };
    tx.create(opRef, { hash, result, createdAt: now });
    tx.create(db.collection("auditEvents").doc(), {
      actor,
      action: "staff.depart",
      entityId: d.uid,
      createdAt: now,
    });
    return result;
  });
}
export const listStaffMembers = onCall(opts, (req) =>
  runListStaffMembers(getFirestore(), req),
);
export const departStaffMember = onCall(opts, (req) =>
  runDepartStaffMember(getFirestore(), req),
);
