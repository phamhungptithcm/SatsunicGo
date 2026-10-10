import { isDeepStrictEqual } from "node:util";
import { randomBytes, randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import type { NotificationChannel } from "../../packages/domain/notification-preferences";
import { notificationTopics } from "../../packages/domain/notification-preferences";
import {
  readSubscriptionData,
  scopesCurrent,
  subscriptionCollection,
  subscriptionDestination,
  subscriptionHash,
} from "./notification-preferences-service";
import type { SubscriptionIdentity } from "./notification-token-service";
import { subscriptionContent } from "./subscription-content";
const jobSchema = z.object({
  ownerId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[^/]+$/),
  channel: z.enum(["email", "sms"]),
  kind: z.enum(["confirm", "welcome"]),
  scopes: z
    .array(
      z.object({
        topic: z.enum(notificationTopics),
        generation: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(3),
  destinationHash: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.string(),
  createdAt: z.number().int().nonnegative(),
});
export type SubscriptionSendResult =
  | "accepted"
  | "rejected"
  | "unknown"
  | {
      state: "accepted" | "rejected" | "unknown" | "deferred";
      providerId?: string;
      attempted?: boolean;
      retryAt?: number;
    };
export type SubscriptionSender = {
  available: (channel: NotificationChannel) => boolean;
  send: (
    channel: NotificationChannel,
    destination: string,
    content: ReturnType<typeof subscriptionContent>,
    idempotencyKey: string,
    authorize?: (requestIdentity: string, from: string) => Promise<boolean>,
  ) => Promise<SubscriptionSendResult>;
};
export type SubscriptionIdentityReader = (
  uid: string,
) => Promise<SubscriptionIdentity | null>;
/** Provider-agnostic boundary; SMS remains unavailable until a provider is approved/configured. */
export async function deliverSubscriptionJob(
  db: Firestore,
  channel: NotificationChannel,
  id: string,
  origin: string,
  now: number,
  sender: SubscriptionSender,
  resolveIdentity: SubscriptionIdentityReader,
  minimumCreatedAt = 0,
) {
  if (!sender.available(channel)) return "unavailable";
  const site = new URL(origin);
  if (
    site.protocol !== "https:" ||
    site.username ||
    site.password ||
    site.pathname !== "/" ||
    site.search ||
    site.hash
  )
    throw Error("INVALID_SUBSCRIPTION_ORIGIN");
  const ref = db.doc(`${subscriptionCollection(channel)}/${id}`);
  const initialData = (await ref.get()).data();
  // Retire only the exact queued snapshot examined here; a newer claim/result always wins.
  const retireQueued = async (
    state:
      "blocked_content" | "blocked_recipient" | "blocked_policy" | "expired",
  ) =>
    db.runTransaction(async (tx) => {
      const current = (await tx.get(ref)).data();
      if (
        current?.state !== "queued" ||
        !isDeepStrictEqual(current, initialData)
      )
        return "suppressed" as const;
      tx.update(ref, { state, finishedAt: now });
      return state;
    });
  if (initialData?.state !== "queued") return "suppressed";
  const initial = jobSchema.safeParse(initialData);
  if (!initial.success || initial.data.channel !== channel)
    return retireQueued("blocked_content");
  if (initial.data.createdAt < minimumCreatedAt)
    return retireQueued("blocked_policy");
  if (typeof initialData.retryAt === "number" && initialData.retryAt > now)
    return "deferred";
  if (
    (initialData.providerAttempts ?? 0) >= 3 ||
    (typeof initialData.firstProviderAttemptAt === "number" &&
      now - initialData.firstProviderAttemptAt >= 86400000)
  )
    return retireQueued("expired");
  if (
    initial.data.createdAt > now ||
    now - initial.data.createdAt >
      (initial.data.kind === "confirm" ? 86400000 : 604800000)
  ) {
    await retireQueued("expired");
    return "suppressed";
  }
  let identity: SubscriptionIdentity | null;
  try {
    identity = await resolveIdentity(initial.data.ownerId);
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    if (code === "auth/user-not-found" || code === "auth/invalid-uid")
      return retireQueued("blocked_recipient");
    // Auth outages, quotas and unknown errors are dependency failures, never proof of deletion.
    return "identity_unavailable";
  }
  if (
    !identity ||
    identity.disabled ||
    (channel === "email" && (!identity.verified || !identity.email))
  )
    return retireQueued("blocked_recipient");
  const raw = randomBytes(32).toString("hex"),
    hash = subscriptionHash(raw),
    claimId = randomUUID();
  const claimed = await db.runTransaction(async (tx) => {
    const [row, prefs, user] = await tx.getAll(
      ref,
      db.doc(`notificationPreferences/${initial.data.ownerId}`),
      db.doc(`users/${initial.data.ownerId}`),
    );
    const parsed = jobSchema.safeParse(row.data());
    if (
      !isDeepStrictEqual(row.data(), initialData) ||
      !parsed.success ||
      parsed.data.state !== "queued" ||
      parsed.data.ownerId !== initial.data.ownerId ||
      parsed.data.channel !== channel
    )
      return null;
    const job = parsed.data;
    if (
      job.createdAt > now ||
      now - job.createdAt > (job.kind === "confirm" ? 86400000 : 604800000)
    ) {
      tx.update(ref, { state: "expired", finishedAt: now });
      return null;
    }
    let p;
    try {
      p = readSubscriptionData(prefs.data(), identity.email);
    } catch {
      // Invalid persisted consent cannot authorize delivery or poison the bounded queue.
      tx.update(ref, { state: "blocked_content", finishedAt: now });
      return null;
    }
    if (
      user.data()?.locked ||
      subscriptionHash(subscriptionDestination(p, channel)) !==
        job.destinationHash ||
      (channel === "email" && p.email !== identity.email) ||
      !scopesCurrent(
        p,
        job.scopes,
        channel,
        job.kind === "confirm" ? "pending" : "active",
      )
    ) {
      tx.update(ref, { state: "suppressed", finishedAt: now });
      return null;
    }
    const kind = job.kind === "confirm" ? "confirm" : "unsubscribe";
    tx.create(db.doc(`notificationChallenges/${hash}`), {
      ownerId: job.ownerId,
      kind,
      channel,
      scopes: job.scopes,
      destinationHash: job.destinationHash,
      expiresAt: now + (kind === "confirm" ? 86400000 : 7776000000),
      consumedAt: null,
    });
    tx.update(ref, { state: "sending", claimId, startedAt: now });
    return {
      destination: subscriptionDestination(p, channel),
      kind: job.kind,
      topics: job.scopes.map((s) => s.topic),
      link: `${site.origin}/account/profile#notification-${kind}=${raw}`,
    };
  });
  if (!claimed) return "suppressed";
  // Recheck the owned claim, consent and account lock immediately before provider I/O.
  // An external send cannot be atomic with Firestore; never replay uncertain outcomes.
  let result:
    | "accepted"
    | "rejected"
    | "unknown"
    | "suppressed"
    | "queued"
    | "blocked_recipient" = "suppressed";
  let providerId: string | undefined, retryAt: number | undefined;
  let preIoState: "unknown" | "suppressed" | "blocked_recipient" | undefined;
  const authorize = async (requestIdentity: string, from: string) => {
    const liveIdentity = await resolveIdentity(initial.data.ownerId);
    if (
      !liveIdentity ||
      liveIdentity.disabled ||
      !liveIdentity.verified ||
      liveIdentity.email !== identity.email
    ) {
      preIoState = "blocked_recipient";
      return false;
    }
    return db.runTransaction(async (tx) => {
      const [row, prefs, user] = await tx.getAll(
        ref,
        db.doc(`notificationPreferences/${initial.data.ownerId}`),
        db.doc(`users/${initial.data.ownerId}`),
      );
      const current = row.data();
      if (current?.state !== "sending" || current.claimId !== claimId)
        return false;
      if (
        current.createdAt > Date.now() ||
        Date.now() - current.createdAt >=
          (claimed.kind === "confirm" ? 86400000 : 604800000)
      ) {
        preIoState = "suppressed";
        return false;
      }
      if (
        current.firstProviderAttemptAt !== undefined &&
        (!Number.isSafeInteger(current.firstProviderAttemptAt) ||
          current.firstProviderAttemptAt > Date.now() ||
          Date.now() - current.firstProviderAttemptAt >= 86400000)
      ) {
        preIoState = "unknown";
        return false;
      }
      if (
        (current.providerRequestIdentity &&
          current.providerRequestIdentity !== requestIdentity) ||
        (current.providerFrom && current.providerFrom !== from)
      ) {
        preIoState = "unknown";
        return false;
      }
      let p;
      try {
        p = readSubscriptionData(prefs.data(), liveIdentity.email);
      } catch {
        preIoState = "suppressed";
        return false;
      }
      if (
        user.data()?.locked ||
        subscriptionHash(subscriptionDestination(p, channel)) !==
          initial.data.destinationHash ||
        !scopesCurrent(
          p,
          initial.data.scopes,
          channel,
          claimed.kind === "confirm" ? "pending" : "active",
        ) ||
        (current.providerAttempts ?? 0) >= 3
      ) {
        preIoState = "suppressed";
        return false;
      }
      for (const field of [
        "ownerId",
        "channel",
        "kind",
        "scopes",
        "destinationHash",
        "createdAt",
      ])
        if (!isDeepStrictEqual(current[field], initialData[field])) {
          preIoState = "suppressed";
          return false;
        }
      tx.update(ref, {
        providerRequestIdentity: requestIdentity,
        providerFrom: from,
        provider: "resend",
        providerAttempts: (current.providerAttempts ?? 0) + 1,
        firstProviderAttemptAt: current.firstProviderAttemptAt ?? Date.now(),
      });
      return true;
    });
  };
  try {
    const [job, prefs, user] = await db.getAll(
      ref,
      db.doc(`notificationPreferences/${initial.data.ownerId}`),
      db.doc(`users/${initial.data.ownerId}`),
    );
    if (job.data()?.state !== "sending" || job.data()?.claimId !== claimId)
      return "suppressed";
    const parsed = (() => {
      try {
        return readSubscriptionData(prefs.data(), identity.email);
      } catch {
        return null;
      }
    })();
    const current =
      parsed &&
      !user.data()?.locked &&
      scopesCurrent(
        parsed,
        initial.data.scopes,
        channel,
        claimed.kind === "confirm" ? "pending" : "active",
      ) &&
      subscriptionHash(subscriptionDestination(parsed, channel)) ===
        initial.data.destinationHash;
    if (current) {
      const sent = await sender.send(
        channel,
        claimed.destination,
        subscriptionContent(
          channel,
          claimed.kind,
          claimed.topics,
          claimed.link,
        ),
        `subscription-${id}`,
        authorize,
      );
      if (typeof sent === "string") result = sent;
      else {
        providerId = sent.providerId;
        retryAt = sent.retryAt;
        result =
          preIoState ?? (sent.state === "deferred" ? "queued" : sent.state);
      }
    }
  } catch {
    // Dependency/provider ambiguity is visible and terminal until reconciliation.
    result = "unknown";
  }
  return db.runTransaction(async (tx) => {
    const row = await tx.get(ref);
    if (row.data()?.state !== "sending" || row.data()?.claimId !== claimId)
      return "suppressed";
    // A pinned token body exists only in this invocation's memory. Never queue a
    // fresh body under its identity, even when the final dispatch fence did no I/O.
    if (result === "queued" && row.data()?.providerRequestIdentity)
      result = "rejected";
    // Never persist raw confirmation tokens/body. A never-transmitted retry creates a fresh challenge.
    if (result === "queued" && !row.data()?.providerRequestIdentity)
      tx.delete(db.doc(`notificationChallenges/${hash}`));
    tx.update(ref, {
      state: result,
      finishedAt: Date.now(),
      reconciliationRequired: result === "unknown",
      ...(providerId
        ? { providerId, providerState: "accepted", acceptedAt: Date.now() }
        : {}),
      ...(typeof retryAt === "number" ? { retryAt } : {}),
    });
    return result;
  });
}
