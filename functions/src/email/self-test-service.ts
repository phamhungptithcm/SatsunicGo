import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { sendResend, type SendOutcome } from "./resend";
import { selfTestContent, selfTestTemplateVersion } from "./self-test-content";

export const selfTestInput = z.object({ operationId: z.uuid().transform(id => id.toLowerCase()) }).strict();
export const selfTestRecipient = z.email().max(254);
const operationSchema = z.object({
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum(["processing", "accepted", "rejected", "unknown"]),
  claimedAtMs: z.number().int().nonnegative(),
  completedAtMs: z.number().int().nonnegative().optional(),
  providerId: z.uuid().optional(),
  reason: z.enum(["configuration", "provider_rejected", "provider_unknown"]).optional(),
}).strict();
const quotaSchema = z.object({
  dayUTC: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attempts: z.number().int().min(1).max(3),
  lastClaimedAtMs: z.number().int().nonnegative(),
}).strict();

export class SelfTestError extends Error {
  constructor(public readonly code: "CONFIGURATION" | "OPERATION_CONFLICT" | "COOLDOWN" | "DAILY_LIMIT" | "INVALID_STATE") {
    super(code);
  }
}

export type SelfTestResult = { operationId: string; replay: boolean } &
  (SendOutcome | { state: "processing" });

/** Only technical records; no customer/commerce reads and no recipient/body/key persistence. */
export async function runSelfTest(deps: {
  db: Firestore;
  recipient: string;
  operationId: string;
  readKey: () => string;
  send?: typeof sendResend;
  now?: () => number;
}): Promise<SelfTestResult> {
  const recipient = selfTestRecipient.parse(deps.recipient);
  const { operationId } = selfTestInput.parse({ operationId: deps.operationId });
  const now = (deps.now ?? Date.now)();
  const dayUTC = new Date(now).toISOString().slice(0, 10);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([recipient, selfTestTemplateVersion, selfTestContent])).digest("hex");
  const operation = deps.db.doc(`emailTestOperations/${operationId}`);
  const quota = deps.db.doc("technicalQuotas/emailSelfTest");
  const claim = await deps.db.runTransaction(async tx => {
    const existing = await tx.get(operation);
    if (existing.exists) {
      const parsed = operationSchema.safeParse(existing.data());
      if (!parsed.success) throw new SelfTestError("INVALID_STATE");
      const value = parsed.data;
      if (value.fingerprint !== fingerprint) throw new SelfTestError("OPERATION_CONFLICT");
      if (value.state === "processing" && now - value.claimedAtMs >= 60_000) {
        tx.update(operation, { state: "unknown", reason: "provider_unknown", completedAtMs: now });
        return { claimed: false as const, result: { state: "unknown" as const, reason: "provider_unknown" as const } };
      }
      if (value.state === "accepted") {
        if (!value.providerId) throw new SelfTestError("INVALID_STATE");
        return { claimed: false as const, result: { state: "accepted" as const, providerId: value.providerId } };
      }
      if (value.state === "rejected") {
        if (!value.reason || value.reason === "provider_unknown") throw new SelfTestError("INVALID_STATE");
        return { claimed: false as const, result: { state: "rejected" as const, reason: value.reason } };
      }
      return { claimed: false as const, result: value.state === "processing"
        ? { state: "processing" as const }
        : { state: "unknown" as const, reason: "provider_unknown" as const } };
    }
    const existingQuota = await tx.get(quota);
    const parsed = quotaSchema.safeParse(existingQuota.data());
    if (existingQuota.exists && !parsed.success) throw new SelfTestError("INVALID_STATE");
    const value = parsed.success ? parsed.data : undefined;
    // Applies across midnight and clock rollback, not just inside the current day.
    if (value && now - value.lastClaimedAtMs < 60_000) throw new SelfTestError("COOLDOWN");
    const attempts = value?.dayUTC === dayUTC ? value.attempts : 0;
    if (attempts >= 3) throw new SelfTestError("DAILY_LIMIT");
    tx.create(operation, { fingerprint, state: "processing", claimedAtMs: now });
    tx.set(quota, { dayUTC, attempts: attempts + 1, lastClaimedAtMs: now });
    return { claimed: true as const };
  });
  if (!claim.claimed) return { operationId, replay: true, ...claim.result };

  let outcome: SendOutcome;
  try {
    const key = deps.readKey();
    outcome = await (deps.send ?? sendResend)({
      from: "onboarding@resend.dev", to: recipient, ...selfTestContent,
    }, key, `satsunicgo-email-test/${operationId}/${selfTestTemplateVersion}`);
  } catch {
    outcome = { state: "unknown", reason: "provider_unknown" };
  }
  try {
    return await deps.db.runTransaction(async tx => {
      const current = operationSchema.safeParse((await tx.get(operation)).data());
      if (!current.success || current.data.fingerprint !== fingerprint || current.data.state !== "processing") {
        return { operationId, replay: false, state: "unknown" as const, reason: "provider_unknown" as const };
      }
      tx.update(operation, { ...outcome, completedAtMs: (deps.now ?? Date.now)() });
      return { operationId, replay: false, ...outcome };
    });
  } catch {
    // Claim survives uncertain persistence; replay must never perform provider I/O.
    return { operationId, replay: false, state: "unknown", reason: "provider_unknown" };
  }
}
