import { z } from "zod";
import type { Firestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  notificationChannel,
  notificationConsentVersion,
  notificationState,
  notificationTopics,
} from "../../packages/domain/notification-preferences";
import {
  queueSubscriptionJob,
  readSubscriptionData,
  subscriptionDestination,
  subscriptionHash,
} from "./notification-preferences-service";
export const subscriptionChallengeSchema = z
  .object({
    ownerId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[^/]+$/),
    kind: z.enum(["confirm", "unsubscribe"]),
    channel: z.enum(["email", "sms"]),
    scopes: z
      .array(
        z
          .object({
            topic: z.enum(notificationTopics),
            generation: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .min(1)
      .max(3),
    destinationHash: z.string().regex(/^[a-f0-9]{64}$/),
    expiresAt: z.number().int().positive(),
    consumedAt: z.number().int().nonnegative().nullable(),
  })
  .strict();
export type SubscriptionIdentity = {
  email: string;
  verified: boolean;
  disabled: boolean;
};
const invalid = () =>
  new HttpsError(
    "failed-precondition",
    "Liên kết không còn hiệu lực. Yêu cầu xác nhận lại trong Thông báo.",
  );
/** Token possession grants only confirmation/revocation. It grants no account or order access. */
export async function applySubscriptionToken(
  db: Firestore,
  token: string,
  action: "confirm" | "unsubscribe",
  now: number,
  resolveIdentity: (uid: string) => Promise<SubscriptionIdentity>,
) {
  const challengeRef = db.doc(
    `notificationChallenges/${subscriptionHash(token)}`,
  );
  const initial = subscriptionChallengeSchema.safeParse(
    (await challengeRef.get()).data(),
  );
  if (!initial.success || initial.data.kind !== action) throw invalid();
  const identity = await resolveIdentity(initial.data.ownerId).catch(
    () => null,
  );
  if (!identity || (action === "confirm" && identity.disabled)) throw invalid();
  return db.runTransaction(async (tx) => {
    const uid = initial.data.ownerId,
      ref = db.doc(`notificationPreferences/${uid}`);
    const [challenge, row, user] = await tx.getAll(
      challengeRef,
      ref,
      db.doc(`users/${uid}`),
    );
    const parsed = subscriptionChallengeSchema.safeParse(challenge.data());
    if (
      !parsed.success ||
      parsed.data.ownerId !== uid ||
      parsed.data.kind !== action ||
      parsed.data.expiresAt <= now
    )
      throw invalid();
    const c = parsed.data;
    if (c.scopes.some((s) => notificationChannel(s.topic) !== c.channel))
      throw invalid();
    if (c.consumedAt !== null) return { status: "already_processed" as const };
    if (!row.exists || (action === "confirm" && user.data()?.locked))
      throw invalid();
    const p = readSubscriptionData(row.data(), identity.email);
    if (
      subscriptionHash(subscriptionDestination(p, c.channel)) !==
        c.destinationHash ||
      (action === "confirm" &&
        c.channel === "email" &&
        (!identity.verified || p.email !== identity.email))
    )
      throw invalid();
    const eligible = c.scopes.filter(
      (s) =>
        p.topics[s.topic].generation === s.generation &&
        p.topics[s.topic].requested,
    );
    if (!eligible.length) throw invalid();
    const changed = eligible.filter(
      (s) =>
        action === "unsubscribe" ||
        notificationState(p.topics[s.topic]) !== "active",
    );
    for (const { topic } of changed) {
      if (action === "confirm")
        p.topics[topic].confirmedGeneration = p.topics[topic].generation;
      else
        p.topics[topic] = {
          requested: false,
          generation: p.topics[topic].generation + 1,
          confirmedGeneration: null,
        };
    }
    tx.update(challengeRef, { consumedAt: now });
    if (changed.length) {
      p.version++;
      p.updatedAt = now;
      tx.set(ref, p);
      tx.create(
        db.doc(
          `notificationConsentEvents/${subscriptionHash(token + ":" + action)}`,
        ),
        {
          ownerId: uid,
          version: p.version,
          consentVersion: notificationConsentVersion,
          source: action,
          topics: changed.map((s) => s.topic),
          createdAt: now,
        },
      );
      if (changed.some((s) => s.topic === "promotionsEmail") && user.exists)
        tx.update(user.ref, {
          marketingConsent: action === "confirm",
          marketingConsentVersion: notificationConsentVersion,
          marketingConsentAt: now,
          version: Number(user.data()?.version ?? 0) + 1,
        });
      if (action === "confirm")
        queueSubscriptionJob(
          tx,
          db,
          uid,
          p,
          c.channel,
          changed,
          "welcome",
          subscriptionHash(token),
          now,
        );
    }
    return {
      status:
        action === "confirm"
          ? ("confirmed" as const)
          : ("unsubscribed" as const),
    };
  });
}
