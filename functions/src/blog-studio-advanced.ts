import { createHash, randomUUID } from "node:crypto";
import {
  getFirestore,
  Filter,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle, isStringRoleArray } from "./auth/guards";
import {
  studioAuthority,
  requireStudioDraft,
  safeStudioSchedule,
  bindStudioIdentity,
} from "./blog-studio-access";
import {
  studioAdvancedReadSchema,
  studioAdvancedCommandSchema,
  taxonomyKey,
  studioSearchTokens,
  googleStudioAvatar,
  studioCursor,
  readStudioCursor,
} from "../../packages/domain/blog-studio-advanced";
import {
  defaultStudioSettings,
  studioSettingsSchema,
  nextStudioRevision,
  studioIdSchema,
  type StudioPost,
} from "../../packages/domain/blog-studio";
import {
  publicBlogComment,
  type BlogComment,
} from "../../packages/domain/blog-comments";
const opts = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 10,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
function safeReport(id: string, r: Record<string, unknown>) {
  return {
    id,
    commentId: String(r.commentId ?? ""),
    reason: String(r.reason ?? ""),
    state: r.state,
    createdAt: r.createdAt ?? r.at ?? null,
    revision: r.revision ?? 1,
  };
}
function invalid() {
  return new HttpsError("invalid-argument", "Thông tin Studio không hợp lệ.");
}
function parse<T>(schema: z.ZodType<T>, value: unknown) {
  const r = schema.safeParse(value);
  if (!r.success) throw invalid();
  return r.data;
}
function cas(actual: unknown, expected: unknown) {
  if (!Number.isSafeInteger(actual) || actual !== expected)
    throw new HttpsError(
      "aborted",
      "Thông tin đã thay đổi. Tải lại để tiếp tục.",
    );
}
function eligibleIdentity(user: UserRecord) {
  if (
    user.disabled ||
    !user.emailVerified ||
    !user.providerData.some((p) => p.providerId === "google.com")
  )
    throw new HttpsError(
      "failed-precondition",
      "Cần tài khoản Google đang hoạt động và đã xác thực.",
    );
}
async function eligibleTarget(db: Firestore, tx: Transaction, uid: string) {
  const [a, u] = await Promise.all([
    tx.get(db.doc(`staffAccess/${uid}`)),
    tx.get(db.doc(`users/${uid}`)),
  ]);
  const v = a.data();
  if (
    v?.active !== true ||
    v.locked ||
    u.data()?.locked ||
    !isStringRoleArray(v.roles) ||
    !v.roles.some((r) => ["OWNER", "CONTENT_EDITOR"].includes(r))
  )
    throw new HttpsError(
      "failed-precondition",
      "Thành viên cần quyền nhân viên phù hợp trước khi tham gia Studio.",
    );
  return { access: v, user: u.data() };
}
function settingsValue(s: Record<string, unknown> | undefined) {
  return parse(
    studioSettingsSchema,
    Object.fromEntries(
      Object.keys(defaultStudioSettings).map((k) => [
        k,
        s?.[k] ??
          defaultStudioSettings[k as keyof typeof defaultStudioSettings],
      ]),
    ),
  );
}
export async function readAdvancedStudio(
  db: Firestore,
  uid: string,
  input: unknown,
) {
  const d = parse(studioAdvancedReadSchema, input);
  if (d.kind !== "reports" && ["open", "resolved"].includes(d.state ?? ""))
    throw invalid();
  return db.runTransaction(async (tx) => {
    const role = await studioAuthority(
      db,
      tx,
      uid,
      ["members", "export"].includes(d.kind),
    );
    if (d.kind === "reports") {
      if (role === "author")
        throw new HttpsError("permission-denied", "Cần quyền kiểm duyệt.");
      let q = db
        .collection("blogCommentReports")
        .where(
          "state",
          "==",
          d.reportState ?? (d.state === "resolved" ? "resolved" : "open"),
        )
        .orderBy("__name__");
      if (d.after) {
        if (!/^[a-zA-Z0-9_-]{1,200}$/u.test(d.after)) throw invalid();
        q = q.startAfter(d.after);
      }
      const reports = await tx.get(q.limit(101)),
        page = reports.docs.slice(0, 100);
      const commentIds = [
        ...new Set(
          page
            .map((x) => x.get("commentId"))
            .filter(
              (value): value is string =>
                studioIdSchema.safeParse(value).success,
            ),
        ),
      ];
      const comments = new Map(
        await Promise.all(
          commentIds.map(async (id) => {
            const snapshot = await tx.get(db.doc(`blogComments/${id}`));
            return [
              id,
              snapshot.exists && snapshot.get("status") === "approved"
                ? publicBlogComment({ ...snapshot.data(), id } as BlogComment)
                : null,
            ] as const;
          }),
        ),
      );
      return {
        items: page.map((x) => ({
          ...safeReport(x.id, x.data()),
          comment: comments.get(x.get("commentId")) ?? null,
        })),
        next: reports.size > 100 ? page.at(-1)!.id : null,
      };
    }
    if (d.kind === "export") {
      const collections: Record<string, unknown[]> = {};
      for (const name of [
        "blogDrafts",
        "blogPublished",
        "blogAuthors",
        "blogCategories",
        "blogSlugs",
        "contentMedia",
      ]) {
        const docs = await tx.get(
          (name === "contentMedia"
            ? db.collection(name).where("studioMedia", "==", true)
            : db.collection(name)
          )
            .orderBy("__name__")
            .limit(1001),
        );
        if (docs.size > 1000)
          throw new HttpsError(
            "resource-exhausted",
            "Dữ liệu vượt giới hạn xuất. Dùng quy trình sao lưu của quản trị viên.",
          );
        collections[name] = docs.docs.map((x) => ({ id: x.id, ...x.data() }));
      }
      return {
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        collections,
      };
    }
    if (d.kind === "catalog") {
      if (!d.catalog) throw invalid();
      let q = db
        .collection(d.catalog === "authors" ? "blogAuthors" : "blogCategories")
        .orderBy("__name__");
      if (d.after) {
        if (!/^[a-zA-Z0-9-]{1,80}$/u.test(d.after)) throw invalid();
        q = q.startAfter(d.after);
      }
      const s = await tx.get(q.limit(101));
      if (s.size > 100)
        throw new HttpsError(
          "failed-precondition",
          "Danh mục vượt giới hạn 100 mục.",
        );
      return {
        items: s.docs.map((x) => ({ id: x.id, ...x.data() })),
        next: null,
      };
    }
    if (d.kind === "members" || d.kind === "assignable") {
      if (d.kind === "assignable" && role === "author")
        throw new HttpsError(
          "permission-denied",
          "Cần quyền xuất bản nội dung.",
        );
      const inviteStage =
        d.kind === "members" && d.after?.startsWith("invite:");
      const items: Record<string, unknown>[] = [];
      let next: string | null = null;
      if (!inviteStage) {
        let query = db.collection("staffAccess").orderBy("__name__");
        if (d.after) {
          if (!/^[a-zA-Z0-9_-]{1,128}$/u.test(d.after)) throw invalid();
          query = query.startAfter(d.after);
        }
        const page = await tx.get(query.limit(101)),
          raw = page.docs.slice(0, 100);
        for (const staff of raw) {
          const a = staff.data();
          if (
            a.active !== true ||
            a.locked ||
            !isStringRoleArray(a.roles) ||
            !a.roles.some((r) => ["OWNER", "CONTENT_EDITOR"].includes(r))
          )
            continue;
          const [u, g] = await Promise.all([
            tx.get(db.doc(`users/${staff.id}`)),
            tx.get(db.doc(`blogEditorialMembers/${staff.id}`)),
          ]);
          if (u.get("locked")) continue;
          const active = !g.exists || g.get("active") === true,
            grant =
              g.get("role") ??
              (a.roles.includes("OWNER") ? "admin" : "publisher");
          if (d.kind === "assignable") {
            if (active && ["author", "publisher", "admin"].includes(grant))
              items.push({
                id: staff.id,
                name: String(
                  u.get("displayName") ?? g.get("name") ?? "Thành viên",
                ).slice(0, 80),
              });
          } else {
            const invitation =
              typeof g.get("inviteId") === "string"
                ? await tx.get(
                    db.doc(`blogEditorialInvites/${g.get("inviteId")}`),
                  )
                : null;
            items.push({
              id: invitation?.exists ? invitation.id : staff.id,
              uid: staff.id,
              email: String(g.get("email") ?? ""),
              name: String(
                g.get("name") ?? u.get("displayName") ?? "Thành viên",
              ).slice(0, 80),
              role: grant,
              active,
              connected: true,
              revision: invitation?.exists
                ? invitation.get("revision")
                : g.exists
                  ? g.get("revision")
                  : 1,
              uidRevision: g.exists ? g.get("revision") : 1,
            });
          }
        }
        next = page.size > 100 ? raw.at(-1)!.id : null;
      }
      if (d.kind === "members" && !next) {
        const after = inviteStage ? d.after!.slice(7) : "";
        if (after && !/^[a-f0-9]{64}$/u.test(after)) throw invalid();
        const capacity = 100 - items.length;
        if (capacity <= 0) next = "invite:";
        else {
          let query = db
            .collection("blogEditorialInvites")
            .where("connected", "==", false)
            .orderBy("__name__");
          if (after) query = query.startAfter(after);
          const page = await tx.get(query.limit(capacity + 1)),
            shown = page.docs.slice(0, capacity);
          items.push(
            ...shown.map((x) => ({
              id: x.id,
              email: x.get("email"),
              name: x.get("name"),
              role: x.get("role"),
              active: x.get("active"),
              connected: false,
              revision: x.get("revision"),
            })),
          );
          if (page.size > capacity) next = `invite:${shown.at(-1)!.id}`;
        }
      }
      return { items, next };
    }
    let q = db
      .collection("blogDrafts")
      .orderBy("updatedAt", "desc")
      .orderBy("__name__", "asc");
    if (role === "author")
      q = q.where(
        Filter.or(
          Filter.where("owner", "==", uid),
          Filter.where("assignee", "==", uid),
        ),
      );
    if (d.kind === "summary") {
      const counts: Record<string, number | null> = {};
      for (const state of ["draft", "review", "published", "archived"]) {
        const result = await tx.get(q.where("state", "==", state).count());
        counts[state] = result.data().count;
      }
      counts.pending =
        role === "author"
          ? null
          : (
              await tx.get(
                db
                  .collection("blogComments")
                  .where("status", "==", "pending")
                  .count(),
              )
            ).data().count;
      return counts;
    }
    if (d.state) q = q.where("state", "==", d.state);
    if (d.category) q = q.where("category", "==", d.category);
    const token = studioSearchTokens(d.q ?? "")[0];
    if (token) q = q.where("tokens", "array-contains", token);
    if (d.q?.trim() && !token) return { items: [], next: null };
    if (d.after) {
      try {
        q = q.startAfter(...readStudioCursor(d.after));
      } catch {
        throw invalid();
      }
    }
    const s = await tx.get(q.limit(21)),
      page = s.docs.slice(0, 20),
      schedules = await Promise.all(
        page.map((p) => tx.get(db.doc(`blogSchedules/${p.id}`))),
      );
    return {
      items: page.map((p, i) => ({
        ...p.data(),
        id: p.id,
        schedule: safeStudioSchedule(schedules[i].data()),
      })),
      next:
        s.size > 20
          ? studioCursor(page.at(-1)!.get("updatedAt"), page.at(-1)!.id)
          : null,
    };
  });
}
export const studioAdvancedRead = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore();
  await bindStudioIdentity(
    db,
    uid,
    typeof req.auth?.token.email === "string"
      ? req.auth.token.email
      : undefined,
  );
  return readAdvancedStudio(db, uid, req.data);
});
export async function commandAdvancedStudio(
  db: Firestore,
  uid: string,
  input: unknown,
) {
  const d = parse(studioAdvancedCommandSchema, input);
  if (
    d.id &&
    d.action !== "reportResolve" &&
    !/^[a-zA-Z0-9-]{1,80}$/u.test(d.id)
  )
    throw invalid();
  if (
    ["memberSave", "memberRevoke"].includes(d.action) &&
    d.payload &&
    typeof d.payload === "object" &&
    "email" in d.payload
  )
    return memberByEmail(db, uid, d);
  const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
    receipt = db.doc(`blogStudioOperations/${uid}_${d.operationId}`),
    now = new Date().toISOString();
  let identity: UserRecord | undefined;
  if (["memberSave", "memberRevoke", "catalogUpdate"].includes(d.action))
    await db.runTransaction((tx) => studioAuthority(db, tx, uid, true));
  if (d.action === "memberSave" || d.action === "memberRevoke") {
    const target = parse(
      z
        .object({
          targetUid: z
            .string()
            .min(1)
            .max(128)
            .regex(/^[a-zA-Z0-9_-]+$/),
          role: z.enum(["author", "publisher", "admin"]).optional(),
          active: z.literal(true).optional(),
        })
        .strict(),
      d.payload,
    );
    if (target.targetUid === uid)
      throw new HttpsError(
        "failed-precondition",
        "Không thể thay đổi quyền của chính bạn.",
      );
    try {
      identity = await getAuth().getUser(target.targetUid);
    } catch (e) {
      if (
        d.action !== "memberRevoke" ||
        !e ||
        typeof e !== "object" ||
        !("code" in e) ||
        e.code !== "auth/user-not-found"
      )
        throw e;
    }
    if (d.action === "memberSave") eligibleIdentity(identity!);
  }
  if (d.action === "catalogUpdate") {
    const p = parse(
      z
        .object({
          kind: z.enum(["authors", "taxonomy"]),
          name: z.string().trim().min(1).max(80),
          bio: z.string().max(500).optional(),
          email: z.email().optional(),
        })
        .strict(),
      d.payload,
    );
    if (p.kind === "authors" && p.email) {
      identity = await getAuth().getUserByEmail(p.email.trim().toLowerCase());
      eligibleIdentity(identity);
    }
  }
  return db.runTransaction(async (tx) => {
    const role = await studioAuthority(
        db,
        tx,
        uid,
        !["cancelSchedule", "reportResolve"].includes(d.action),
      ),
      done = await tx.get(receipt);
    if (d.action === "memberSave")
      await eligibleTarget(
        db,
        tx,
        (d.payload as { targetUid: string }).targetUid,
      );
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return done.get("result");
    }
    let result: Record<string, unknown>;
    if (d.action === "reportResolve") {
      if (role === "author" || !d.id)
        throw new HttpsError("permission-denied", "Cần quyền kiểm duyệt.");
      const ref = db.doc(`blogCommentReports/${d.id}`),
        old = await tx.get(ref);
      if (!old.exists)
        throw new HttpsError("not-found", "Không tìm thấy báo cáo.");
      cas(old.get("revision") ?? 1, d.expectedVersion);
      const report = {
        ...old.data(),
        state: "resolved",
        revision: nextStudioRevision(old.get("revision") ?? 1),
        resolvedAt: now,
        resolvedBy: uid,
      };
      tx.update(ref, report);
      result = { report: safeReport(d.id, report) };
    } else if (d.action === "cancelSchedule") {
      if (!d.id) throw invalid();
      const ref = db.doc(`blogDrafts/${d.id}`),
        [p, s] = await Promise.all([
          tx.get(ref),
          tx.get(db.doc(`blogSchedules/${d.id}`)),
        ]);
      if (!p.exists)
        throw new HttpsError("not-found", "Không tìm thấy bản thảo.");
      requireStudioDraft(role, uid, p.data()!);
      if (role === "author")
        throw new HttpsError(
          "permission-denied",
          "Cần quyền xuất bản nội dung.",
        );
      cas(p.get("revision"), d.expectedVersion);
      const draft = { ...p.data() } as StudioPost;
      delete draft.scheduledAt;
      tx.set(ref, draft);
      if (s.exists) tx.delete(s.ref);
      result = { draft, schedule: null };
    } else if (d.action === "memberSave" || d.action === "memberRevoke") {
      const p = parse(
        z
          .object({
            targetUid: z.string(),
            role: z.enum(["author", "publisher", "admin"]).optional(),
            active: z.literal(true).optional(),
          })
          .strict(),
        d.payload,
      );
      if (d.action === "memberSave") await eligibleTarget(db, tx, p.targetUid);
      const ref = db.doc(`blogEditorialMembers/${p.targetUid}`),
        old = await tx.get(ref);
      cas(old.exists ? old.get("revision") : 1, d.expectedVersion);
      if (d.action === "memberSave" && !p.role) throw invalid();
      const member = {
        id: p.targetUid,
        uid: p.targetUid,
        email: identity?.email ?? String(old.get("email") ?? ""),
        name: identity?.displayName ?? String(old.get("name") ?? "Thành viên"),
        role: d.action === "memberRevoke" ? "reader" : p.role!,
        active: d.action !== "memberRevoke",
        revision: nextStudioRevision(old.exists ? old.get("revision") : 1),
        updatedAt: now,
        updatedBy: uid,
      };
      if (d.action === "memberRevoke" && !old.exists) {
        const staff = await tx.get(db.doc(`staffAccess/${p.targetUid}`));
        if (!staff.exists)
          throw new HttpsError("not-found", "Không tìm thấy thành viên.");
      }
      let invitation;
      if (member.email) {
        const inviteId = createHash("sha256")
          .update(member.email.trim().toLowerCase())
          .digest("hex");
        invitation = await tx.get(db.doc(`blogEditorialInvites/${inviteId}`));
        if (invitation.get("uid") && invitation.get("uid") !== p.targetUid)
          throw new HttpsError(
            "failed-precondition",
            "Danh tính Google của lời mời đã thay đổi.",
          );
        tx.set(invitation.ref, {
          ...invitation.data(),
          ...member,
          id: inviteId,
          uid: p.targetUid,
          connected: true,
          revision: nextStudioRevision(
            invitation.exists ? invitation.get("revision") : 1,
          ),
        });
        tx.set(ref, { ...member, inviteId });
      } else tx.set(ref, member);
      result = {
        member: {
          ...member,
          id: invitation?.id ?? member.id,
          revision: invitation
            ? nextStudioRevision(
                invitation.exists ? invitation.get("revision") : 1,
              )
            : member.revision,
          uidRevision: member.revision,
          uid: p.targetUid,
          connected: true,
        },
      };
    } else {
      const p =
        d.action === "categoryCreate"
          ? parse(
              z.object({ name: z.string().trim().min(1).max(80) }).strict(),
              d.payload,
            )
          : parse(
              z
                .object({
                  kind: z.enum(["authors", "taxonomy"]),
                  name: z.string().trim().min(1).max(80),
                  bio: z.string().max(500).optional(),
                  email: z.email().optional(),
                })
                .strict(),
              d.payload,
            );
      const kind =
          d.action === "categoryCreate"
            ? "taxonomy"
            : "kind" in p
              ? String(p.kind)
              : "taxonomy",
        collection = kind === "authors" ? "blogAuthors" : "blogCategories",
        key = taxonomyKey(p.name),
        records = await tx.get(
          db.collection(collection).orderBy("__name__").limit(101),
        ),
        settingsRef = db.doc("blogStudioSettings/main"),
        settingsSnap = await tx.get(settingsRef),
        settings = settingsValue(settingsSnap.data());
      if (records.size > 100)
        throw new HttpsError(
          "failed-precondition",
          "Danh mục vượt giới hạn 100 mục.",
        );
      const match =
        kind === "taxonomy"
          ? records.docs.find((x) => taxonomyKey(String(x.get("name"))) === key)
          : undefined;
      if (d.action === "categoryCreate" && match) {
        result = { category: { id: match.id, ...match.data() } };
      } else {
        if (kind === "taxonomy" && match && match.id !== d.id)
          throw new HttpsError("already-exists", "Chuyên mục đã tồn tại.");
        if (!d.id && records.size >= 100)
          throw new HttpsError(
            "resource-exhausted",
            "Danh mục có tối đa 100 mục.",
          );
        let id =
          d.id ??
          (kind === "authors"
            ? randomUUID()
            : `category-${createHash("sha256").update(key).digest("hex")}`);
        let ref = db.doc(`${collection}/${id}`),
          old = await tx.get(ref);
        if (!d.id && old.exists) {
          for (let n = 1; n <= 100; n++) {
            const candidate = `${id.slice(0, 74)}-${n}`;
            if (!records.docs.some((x) => x.id === candidate)) {
              id = candidate;
              ref = db.doc(`${collection}/${id}`);
              old = await tx.get(ref);
              break;
            }
          }
        }
        if (d.id) {
          if (!old.exists)
            throw new HttpsError("not-found", "Không tìm thấy mục danh mục.");
          cas(old.get("revision") ?? 1, d.expectedVersion);
        }
        const record = {
          ...old.data(),
          id,
          name:
            d.action === "categoryCreate"
              ? (settings.categories.find(
                  (name) => taxonomyKey(name) === key,
                ) ?? p.name)
              : p.name,
          revision: old.exists
            ? nextStudioRevision(old.get("revision") ?? 1)
            : 1,
          updatedAt: now,
          avatarId: kind === "authors" ? String(old.get("avatarId") ?? "") : "",
          ...(kind === "authors"
            ? {
                bio: ((p as { bio?: string }).bio ?? "").trim(),
                ...(identity
                  ? {
                      linkedUid: identity.uid,
                      email: identity.email,
                      googleAvatar: googleStudioAvatar(identity.photoURL) ?? "",
                    }
                  : {}),
              }
            : {}),
        };
        const value = {
          ...settings,
          revision: nextStudioRevision(settingsSnap.get("revision") ?? 1),
        };
        if (kind === "authors") {
          const item = {
            id,
            name: record.name,
            bio: String(record.bio ?? ""),
            ...(record.googleAvatar
              ? { googleAvatar: record.googleAvatar }
              : {}),
            ...(record.avatarId ? { avatarId: record.avatarId } : {}),
          };
          value.authors = [
            ...settings.authors.filter((a) => a.id !== id),
            item,
          ];
        } else
          value.categories = [
            ...settings.categories.filter(
              (name) =>
                name !== old.get("name") &&
                taxonomyKey(name) !== taxonomyKey(record.name),
            ),
            record.name,
          ];
        tx.set(ref, record);
        tx.set(settingsRef, value);
        result =
          d.action === "categoryCreate" ? { category: record } : { record };
      }
    }
    tx.create(receipt, { hash, result, actor: uid, action: d.action, at: now });
    return result;
  });
}
export const studioAdvancedCommand = onCall(opts, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore();
  await bindStudioIdentity(
    db,
    uid,
    typeof req.auth?.token.email === "string"
      ? req.auth.token.email
      : undefined,
  );
  return commandAdvancedStudio(db, uid, req.data);
});
async function memberByEmail(
  db: Firestore,
  uid: string,
  d: z.infer<typeof studioAdvancedCommandSchema>,
) {
  const p = parse(
      z
        .object({
          email: z.email(),
          role: z.enum(["author", "publisher", "admin"]).optional(),
          active: z.literal(true).optional(),
        })
        .strict(),
      d.payload,
    ),
    email = p.email.trim().toLowerCase();
  await db.runTransaction((tx) => studioAuthority(db, tx, uid, true));
  const self = await getAuth().getUser(uid);
  if (self.email?.trim().toLowerCase() === email)
    throw new HttpsError(
      "failed-precondition",
      "Không thể thay đổi quyền của chính bạn.",
    );
  const key = createHash("sha256").update(email).digest("hex"),
    ref = db.doc(`blogEditorialInvites/${key}`),
    receipt = db.doc(`blogStudioOperations/${uid}_${d.operationId}`),
    hash = createHash("sha256").update(JSON.stringify(d)).digest("hex"),
    now = new Date().toISOString();
  return db.runTransaction(async (tx) => {
    await studioAuthority(db, tx, uid, true);
    const [old, done] = await Promise.all([tx.get(ref), tx.get(receipt)]);
    const bound =
      typeof old.get("uid") === "string"
        ? (old.get("uid") as string)
        : undefined;
    let existing;
    if (bound) {
      existing = await tx.get(db.doc(`blogEditorialMembers/${bound}`));
      if (bound === uid)
        throw new HttpsError(
          "failed-precondition",
          "Không thể thay đổi quyền của chính bạn.",
        );
      if (d.action === "memberSave") await eligibleTarget(db, tx, bound);
    }
    if (done.exists) {
      if (done.get("hash") !== hash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return done.get("result");
    }
    cas(old.exists ? old.get("revision") : 1, d.expectedVersion);
    if (d.action === "memberSave" && !p.role) throw invalid();
    const role = d.action === "memberRevoke" ? "reader" : p.role!,
      member = {
        id: key,
        email,
        name: String(old.get("name") ?? "Chưa đăng nhập"),
        role,
        active: role !== "reader",
        connected: !!bound,
        revision: nextStudioRevision(old.exists ? old.get("revision") : 1),
        updatedAt: now,
        ...(bound ? { uid: bound } : {}),
      };
    if (bound) {
      tx.set(db.doc(`blogEditorialMembers/${bound}`), {
        ...existing?.data(),
        id: bound,
        uid: bound,
        inviteId: key,
        email,
        name: member.name,
        role,
        active: member.active,
        revision: nextStudioRevision(existing?.get("revision") ?? 1),
        updatedAt: now,
        updatedBy: uid,
      });
    }
    tx.set(ref, member);
    const result = { member };
    tx.create(receipt, { hash, result, actor: uid, action: d.action, at: now });
    return result;
  });
}
