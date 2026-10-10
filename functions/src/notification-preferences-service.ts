import { createHash } from "node:crypto";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  changeNotificationPreferences,
  emptyNotificationPreferences,
  notificationChannel,
  notificationConsentVersion,
  notificationPreferencesSchema,
  notificationState,
  notificationTopics,
  type NotificationChannel,
  type NotificationPreferencesData,
  type NotificationRequest,
  type NotificationTopic,
} from "../../packages/domain/notification-preferences";
export const subscriptionHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const subscriptionCollection = (channel: NotificationChannel) =>
  channel === "email" ? "notificationEmailJobs" : "notificationSmsJobs";
export const subscriptionDestination = (
  p: NotificationPreferencesData,
  channel: NotificationChannel,
) => (channel === "email" ? p.email : p.phone);
export function readSubscriptionData(data: unknown, email: string) {
  return data === undefined
    ? emptyNotificationPreferences(email)
    : notificationPreferencesSchema.parse(data);
}
export type SubscriptionScope = {
  topic: NotificationTopic;
  generation: number;
};
export function subscriptionScopes(
  p: NotificationPreferencesData,
  channel: NotificationChannel,
  state: "pending" | "active",
) {
  return notificationTopics
    .filter(
      (k) =>
        notificationChannel(k) === channel &&
        notificationState(p.topics[k]) === state,
    )
    .map((topic) => ({ topic, generation: p.topics[topic].generation }));
}
export function scopesCurrent(
  p: NotificationPreferencesData,
  scopes: SubscriptionScope[],
  channel: NotificationChannel,
  state: "pending" | "active",
) {
  return (
    scopes.length > 0 &&
    scopes.every(
      (s) =>
        notificationChannel(s.topic) === channel &&
        p.topics[s.topic].generation === s.generation &&
        notificationState(p.topics[s.topic]) === state,
    )
  );
}
export function queueSubscriptionJob(
  tx: Transaction,
  db: Firestore,
  uid: string,
  p: NotificationPreferencesData,
  channel: NotificationChannel,
  scopes: SubscriptionScope[],
  kind: "confirm" | "welcome",
  key: string,
  now: number,
) {
  if (!scopes.length) return;
  tx.create(
    db.doc(
      `${subscriptionCollection(channel)}/${subscriptionHash(JSON.stringify([uid, key, kind, channel]))}`,
    ),
    {
      ownerId: uid,
      channel,
      kind,
      scopes,
      destinationHash: subscriptionHash(subscriptionDestination(p, channel)),
      state: "queued",
      createdAt: now,
    },
  );
}
function unlocked(user: Record<string, unknown> | undefined) {
  if (user?.locked)
    throw new HttpsError(
      "permission-denied",
      "Tài khoản chưa thể thay đổi thông báo.",
    );
}
export async function getNotificationPreferences(
  db: Firestore,
  uid: string,
  email: string,
) {
  const [row, user] = await db.getAll(
    db.doc(`notificationPreferences/${uid}`),
    db.doc(`users/${uid}`),
  );
  unlocked(user.data());
  return readSubscriptionData(row.data(), email);
}
/** All inputs already parsed. No provider I/O or account identity change in this transaction. */
export async function saveNotificationPreferences(
  db: Firestore,
  uid: string,
  email: string,
  command: Extract<NotificationRequest, { action: "save" | "resend" }>,
  now: number,
) {
  const ref = db.doc(`notificationPreferences/${uid}`),
    op = db.doc(
      `notificationPreferenceOperations/${subscriptionHash(uid + ":" + command.operationId)}`,
    );
  const fingerprint = subscriptionHash(JSON.stringify(command));
  return db.runTransaction(async (tx) => {
    const [row, operation, user] = await tx.getAll(
      ref,
      op,
      db.doc(`users/${uid}`),
    );
    unlocked(user.data());
    const previous = readSubscriptionData(row.data(), email);
    if (operation.exists) {
      if (operation.data()?.fingerprint !== fingerprint)
        throw new HttpsError(
          "already-exists",
          "Lần lưu này không khớp lựa chọn đã gửi.",
        );
      return previous;
    }
    if (previous.version !== command.expectedVersion)
      throw new HttpsError(
        "aborted",
        "Tùy chọn đã thay đổi. Tải lại trước khi lưu.",
      );
    const next =
      command.action === "save"
        ? changeNotificationPreferences(
            previous,
            email,
            command.phone,
            command.selected,
            now,
          )
        : previous;
    const channels: NotificationChannel[] =
      command.action === "resend" ? [command.channel] : ["email", "sms"];
    const pending = channels
      .map((channel) => ({
        channel,
        scopes: subscriptionScopes(next, channel, "pending").filter(
          (scope) =>
            command.action === "resend" ||
            previous.topics[scope.topic].generation !== scope.generation,
        ),
      }))
      .filter(
        (x) =>
          x.scopes.length &&
          (command.action === "resend" || next.version !== previous.version),
      );
    // Bounded per-owner and per-destination confirmation requests, including across accounts.
    const quotaRefs = pending.map((x) =>
      db.doc(
        `notificationRecipientQuotas/${subscriptionHash(x.channel + ":" + subscriptionDestination(next, x.channel))}`,
      ),
    );
    const ownerQuota = db.doc(
      `notificationRecipientQuotas/${subscriptionHash("owner:" + uid)}`,
    );
    const quotas = await tx.getAll(ownerQuota, ...quotaRefs);
    const consume = (q: (typeof quotas)[number], limit: number) => {
      const data = q.data(),
        inWindow =
          typeof data?.windowAt === "number" && now - data.windowAt < 3600000;
      const count = inWindow ? Number(data?.count ?? 0) : 0;
      if (
        !Number.isSafeInteger(count) ||
        count < 0 ||
        count >= limit ||
        (command.action === "resend" &&
          typeof data?.lastAt === "number" &&
          now - data.lastAt < 60000)
      )
        throw new HttpsError(
          "resource-exhausted",
          "Chờ một lúc rồi yêu cầu xác nhận lại.",
        );
      return {
        windowAt: inWindow ? data!.windowAt : now,
        count: count + 1,
        lastAt: now,
      };
    };
    const quotaWrites = pending.length
      ? [
          consume(quotas[0], 10),
          ...pending.map((_, i) => consume(quotas[i + 1], 5)),
        ]
      : [];
    if (next.version !== previous.version) {
      tx.set(ref, next);
      // Mirror only a current explicit preference change; never import historical consent.
      if (
        user.exists &&
        (next.topics.promotionsEmail.requested !==
          previous.topics.promotionsEmail.requested ||
          next.email !== previous.email)
      )
        tx.update(user.ref, {
          marketingConsent: false,
          marketingConsentVersion: notificationConsentVersion,
          marketingConsentAt: now,
          version: Number(user.data()?.version ?? 0) + 1,
        });
      tx.create(
        db.doc(
          `notificationConsentEvents/${subscriptionHash(uid + ":" + command.operationId)}`,
        ),
        {
          ownerId: uid,
          version: next.version,
          consentVersion: notificationConsentVersion,
          source: command.action === "save" ? command.source : "profile",
          selected: Object.fromEntries(
            notificationTopics.map((k) => [k, next.topics[k].requested]),
          ),
          createdAt: now,
        },
      );
    }
    if (quotaWrites.length) {
      tx.set(ownerQuota, quotaWrites[0]);
      pending.forEach((_, i) => tx.set(quotaRefs[i], quotaWrites[i + 1]));
    }
    for (const { channel, scopes } of pending)
      queueSubscriptionJob(
        tx,
        db,
        uid,
        next,
        channel,
        scopes,
        "confirm",
        command.operationId,
        now,
      );
    tx.create(op, {
      ownerId: uid,
      fingerprint,
      resultVersion: next.version,
      createdAt: now,
    });
    return next;
  });
}
