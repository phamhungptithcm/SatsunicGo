import { createHash, randomUUID } from "node:crypto";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import {
  emailProviderReady,
  MAX_EMAIL_TIMESTAMP,
  type EmailProviderConfig,
} from "./provider-config";
import {
  resendMessageSchema,
  sendResend,
  type ResendMessage,
  type SendOutcome,
} from "./resend";

const SECOND = 1_000;
const DAY = 86_400_000;
// Both workers time out after 300 seconds; the adapter bounds I/O to 10 seconds.
const DISPATCH_LEASE_MS = 330_000;
const protocol = "satsunicgo-email-v1";
const quotaSchema = z
  .object({
    schemaVersion: z.literal(1),
    dayUTC: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    attempts: z.number().int().min(1).max(100),
    lastReservedAtMs: z.number().int().nonnegative().max(MAX_EMAIL_TIMESTAMP),
    dispatchLeaseId: z.uuid().optional(),
    dispatchLeaseExpiresAtMs: z
      .number()
      .int()
      .nonnegative()
      .max(MAX_EMAIL_TIMESTAMP)
      .optional(),
    nextDispatchAtMs: z
      .number()
      .int()
      .nonnegative()
      .max(MAX_EMAIL_TIMESTAMP)
      .optional(),
  })
  .strict()
  .refine(
    (value) =>
      new Date(value.lastReservedAtMs).toISOString().slice(0, 10) ===
      value.dayUTC,
  )
  .refine(
    (value) =>
      (value.dispatchLeaseId === undefined &&
        value.dispatchLeaseExpiresAtMs === undefined) ||
      (value.dispatchLeaseId !== undefined &&
        value.dispatchLeaseExpiresAtMs ===
          value.lastReservedAtMs + DISPATCH_LEASE_MS),
  )
  .refine(
    (value) =>
      value.nextDispatchAtMs === undefined ||
      value.nextDispatchAtMs >= value.lastReservedAtMs + SECOND,
  );

export type EmailDispatchResult =
  | (SendOutcome & { attempted: boolean })
  | {
      state: "deferred";
      attempted: boolean;
      reason:
        | "rate_limit"
        | "daily_limit"
        | "clock_rollback"
        | "quota_unavailable"
        | "claim_unavailable"
        | "provider_rate_limit";
      retryAt: number;
    };

/** Callers persist this identity under their durable queue claim before dispatch. */
export function emailRequestIdentity(message: ResendMessage): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        protocol,
        "resend",
        message.from,
        message.to,
        message.subject,
        message.text,
        message.html,
      ]),
    )
    .digest("hex");
}

export function emailIdempotencyKey(
  stableJobKey: string,
  requestIdentity: string,
): string {
  return `${protocol}/${createHash("sha256")
    .update(JSON.stringify([stableJobKey, requestIdentity]))
    .digest("hex")}`;
}

const deferred = (
  reason:
    | "rate_limit"
    | "daily_limit"
    | "clock_rollback"
    | "quota_unavailable"
    | "claim_unavailable",
  retryAt: number,
): EmailDispatchResult => ({
  state: "deferred",
  attempted: false,
  reason,
  retryAt,
});
const nextDay = (now: number) => Math.floor(now / DAY) * DAY + DAY;

function providerRetryAfterMs(header: string | null, now: number): number {
  const fallback = 60_000;
  if (!header || header.length > 128) return fallback;
  const value = header.trim();
  const delay = /^[0-9]{1,10}$/.test(value)
    ? Number(value) * SECOND
    : /^[A-Z][a-z]{2}, [0-9]{2} [A-Z][a-z]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} GMT$/.test(
          value,
        )
      ? Date.parse(value) - now
      : Number.NaN;
  return Number.isFinite(delay) && delay >= 0
    ? Math.max(SECOND, Math.min(delay, DAY))
    : fallback;
}

/**
 * One shared transactional attempt budget. Durable job claims own replay/unknown safety;
 * this technical record contains no recipient, body, credential or business identifiers.
 */
export async function dispatchResend(deps: {
  db: Firestore;
  config: EmailProviderConfig;
  message: ResendMessage;
  apiKey: string;
  stableJobKey: string;
  now?: () => number;
  request?: typeof fetch;
  /** Final claim/consent fence. A reserved slot is never refunded after uncertainty. */
  beforeSend?: () => Promise<boolean>;
  /** Only isolated fixtures on the exact shared demo emulator may override the singleton. */
  quotaRef?: DocumentReference;
}): Promise<EmailDispatchResult> {
  const clock = deps.now ?? Date.now;
  const now = clock();
  const parsed = resendMessageSchema.safeParse(deps.message);
  if (
    !emailProviderReady(deps.config, now) ||
    !parsed.success ||
    parsed.data.from !== deps.config.from ||
    !/^re_[A-Za-z0-9_-]{16,200}$/.test(deps.apiKey) ||
    !/^[A-Za-z0-9/_-]{1,200}$/.test(deps.stableJobKey)
  ) {
    return { state: "rejected", reason: "configuration", attempted: false };
  }
  if (
    deps.quotaRef &&
    (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
      process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
      Reflect.get(deps.db, "projectId") !== "demo-satsunicgo" ||
      deps.quotaRef.firestore !== deps.db ||
      !/^emailDispatchQuota\/qa-[a-f0-9-]{36}$/.test(deps.quotaRef.path))
  ) {
    return { state: "rejected", reason: "configuration", attempted: false };
  }
  const quota = deps.quotaRef ?? deps.db.doc("emailDispatchQuota/resend");
  const leaseId = randomUUID();
  type Lease = { reservedAtMs: number; expiresAtMs: number };
  let reservation: EmailDispatchResult | Lease;
  try {
    reservation = await deps.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(quota);
      // A transaction may retry or wait behind another worker's reservation.
      const reservedAtMs = clock();
      if (
        !Number.isSafeInteger(reservedAtMs) ||
        reservedAtMs < now ||
        reservedAtMs > MAX_EMAIL_TIMESTAMP - DISPATCH_LEASE_MS - SECOND
      )
        return deferred("clock_rollback", now + SECOND);
      const existing = quotaSchema.safeParse(snapshot.data());
      if (snapshot.exists && !existing.success)
        return deferred("quota_unavailable", reservedAtMs + 30 * 60_000);
      const value = existing.success ? existing.data : undefined;
      const dayUTC = new Date(reservedAtMs).toISOString().slice(0, 10);
      if (
        value &&
        (value.dayUTC > dayUTC ||
          value.lastReservedAtMs > reservedAtMs ||
          (value.nextDispatchAtMs !== undefined &&
            value.nextDispatchAtMs - SECOND > reservedAtMs))
      ) {
        return deferred(
          "clock_rollback",
          Math.max(
            value.lastReservedAtMs + SECOND,
            value.nextDispatchAtMs ?? 0,
          ),
        );
      }
      const attempts = value?.dayUTC === dayUTC ? value.attempts : 0;
      if (attempts >= deps.config.dailyAttemptLimit)
        return deferred("daily_limit", nextDay(reservedAtMs));
      const availableAtMs = Math.max(
        value ? value.lastReservedAtMs + SECOND : 0,
        value?.nextDispatchAtMs ?? 0,
        value?.dispatchLeaseExpiresAtMs !== undefined
          ? value.dispatchLeaseExpiresAtMs + SECOND
          : 0,
      );
      if (reservedAtMs < availableAtMs)
        return deferred("rate_limit", availableAtMs);
      const expiresAtMs = reservedAtMs + DISPATCH_LEASE_MS;
      tx.set(quota, {
        schemaVersion: 1,
        dayUTC,
        attempts: attempts + 1,
        lastReservedAtMs: reservedAtMs,
        dispatchLeaseId: leaseId,
        dispatchLeaseExpiresAtMs: expiresAtMs,
        nextDispatchAtMs: reservedAtMs + SECOND,
      });
      return { reservedAtMs, expiresAtMs };
    });
  } catch {
    // Reservation did not produce provider I/O; leave the caller's job known-unsent/retryable.
    return deferred("quota_unavailable", now + 30 * 60_000);
  }
  if ("state" in reservation) return reservation;
  const lease = reservation;
  let providerStartedAtMs: number | undefined;
  let providerDeferral:
    Extract<EmailDispatchResult, { state: "deferred" }> | undefined;
  try {
    if (deps.beforeSend) {
      try {
        if (!(await deps.beforeSend()))
          return deferred("claim_unavailable", clock() + 30 * 60_000);
      } catch {
        return deferred("quota_unavailable", clock() + 30 * 60_000);
      }
    }
    const key = emailIdempotencyKey(
      deps.stableJobKey,
      emailRequestIdentity(parsed.data),
    );
    let retryAfterMs: number | undefined;
    let attempted = false;
    let refused: EmailDispatchResult | undefined;
    const request: typeof fetch = async (input, options) => {
      const startedAtMs = clock();
      // No await may separate this fence from the actual fetch invocation.
      if (
        !Number.isSafeInteger(startedAtMs) ||
        startedAtMs < lease.reservedAtMs ||
        startedAtMs >= lease.expiresAtMs - SECOND ||
        Math.floor(startedAtMs / DAY) !== Math.floor(lease.reservedAtMs / DAY)
      ) {
        refused = deferred(
          startedAtMs < lease.reservedAtMs ? "clock_rollback" : "rate_limit",
          lease.expiresAtMs + SECOND,
        );
        throw Error("EMAIL_DISPATCH_LEASE_UNAVAILABLE");
      }
      providerStartedAtMs = startedAtMs;
      attempted = true;
      const response = await (deps.request ?? fetch)(input, options);
      if (response.status === 429)
        retryAfterMs = providerRetryAfterMs(
          response.headers.get("Retry-After"),
          clock(),
        );
      return response;
    };
    try {
      const outcome = await sendResend(parsed.data, deps.apiKey, key, request);
      if (refused) return refused;
      if (
        outcome.state === "rejected" &&
        outcome.reason === "provider_rejected" &&
        retryAfterMs !== undefined
      )
        providerDeferral = {
          state: "deferred",
          reason: "provider_rate_limit",
          attempted: true,
          retryAt: clock() + retryAfterMs,
        };
      if (providerDeferral) return providerDeferral;
      return { ...outcome, attempted };
    } catch {
      // Once I/O starts, a future adapter failure must retain the uncertain outcome.
      return (
        refused ??
        (attempted
          ? { state: "unknown", reason: "provider_unknown", attempted: true }
          : deferred("quota_unavailable", clock() + 30 * 60_000))
      );
    }
  } finally {
    let releaseCooldownAtMs = lease.expiresAtMs + SECOND;
    try {
      const releasedAtMs = await deps.db.runTransaction(async (tx) => {
        const current = quotaSchema.safeParse((await tx.get(quota)).data());
        const completedAtMs = clock();
        if (
          !current.success ||
          current.data.dispatchLeaseId !== leaseId ||
          current.data.dispatchLeaseExpiresAtMs !== lease.expiresAtMs ||
          !Number.isSafeInteger(completedAtMs) ||
          completedAtMs < (providerStartedAtMs ?? lease.reservedAtMs) ||
          completedAtMs > MAX_EMAIL_TIMESTAMP - SECOND
        )
          return;
        const nextDispatchAtMs = Math.max(
          current.data.nextDispatchAtMs ?? 0,
          completedAtMs + SECOND,
        );
        tx.set(quota, {
          schemaVersion: 1,
          dayUTC: current.data.dayUTC,
          attempts: current.data.attempts,
          lastReservedAtMs: current.data.lastReservedAtMs,
          nextDispatchAtMs,
        });
        return nextDispatchAtMs;
      });
      if (releasedAtMs !== undefined) releaseCooldownAtMs = releasedAtMs;
    } catch {
      // Keep the lease for conservative expiry recovery; never replace a provider outcome.
    }
    // Include database-release latency in the one finite provider retry's wait.
    if (providerDeferral)
      providerDeferral.retryAt = Math.max(
        providerDeferral.retryAt,
        clock() + SECOND,
        releaseCooldownAtMs,
      );
  }
}
