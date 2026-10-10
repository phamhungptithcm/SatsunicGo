import type { Firestore, Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import {
  notificationPreferencesSchema,
  notificationState,
} from "../../packages/domain/notification-preferences";
import {
  admitProductionTestPolicy,
  productionTestEnvironment,
} from "./production-test-policy";
import {
  isPurchaseTestRecord,
  matchingPurchaseExecution,
} from "./purchase-test-boundary";
import { purchaseExecutionProvenance } from "../../packages/domain/purchase-checkout";

const timestamp = z.number().int().nonnegative().safe();
export const productionTestEmailPolicySchema = z
  .object({
    approved: z.literal(true),
    enabled: z.literal(true),
    version: z.literal(1),
    cutoverAt: timestamp,
    expiresAt: timestamp,
    testerUids: z.array(z.string().min(1).max(128)).min(1).max(100),
  })
  .strict()
  .refine((p) => new Set(p.testerUids).size === p.testerUids.length);

type TestEmailRequest = {
  ownerId: string;
  recipient: string;
  createdAt: number;
  now: number;
  kind: "order" | "invoice" | "subscription";
  resource?: Record<string, unknown>;
  job?: Record<string, unknown>;
};

/** An additive test boundary; live mail keeps its existing consent contract. */
export async function productionTestEmailAllowed(
  db: Firestore,
  request: TestEmailRequest,
  transaction?: Transaction,
): Promise<boolean> {
  const testResource = isPurchaseTestRecord(request.resource);
  const testJob = isPurchaseTestRecord(request.job);
  const artifactRequested =
    process.env.PURCHASE_PRODUCTION_TEST_ARTIFACT === "v1";
  if (!artifactRequested && !testResource && !testJob) return true;
  if (!productionTestEnvironment(db)) return false;
  const read = (path: string) => {
    const ref = db.doc(path);
    return transaction ? transaction.get(ref) : ref.get();
  };
  const raw = (await read("settings/productionTest")).data();
  // Turning test admission off must not release older customer queues.
  if (!raw || raw.enabled === false) return false;
  const admission = admitProductionTestPolicy(
    raw,
    request.ownerId,
    request.now,
  );
  if (!admission) return false;
  const emailPolicy = productionTestEmailPolicySchema.safeParse(
    (await read("settings/productionTestEmail")).data(),
  );
  if (
    !emailPolicy.success ||
    emailPolicy.data.expiresAt <= request.now ||
    emailPolicy.data.cutoverAt > request.now ||
    !Number.isSafeInteger(request.createdAt) ||
    request.createdAt < emailPolicy.data.cutoverAt ||
    request.createdAt > request.now ||
    !emailPolicy.data.testerUids.includes(request.ownerId)
  )
    return false;
  if (request.kind === "subscription") return true;
  // A test-mode deployment must not drain existing customer queues.
  if (
    !testResource ||
    !testJob ||
    request.resource?.ownerId !== request.ownerId ||
    request.job?.ownerId !== request.ownerId
  )
    return false;
  try {
    if (
      purchaseExecutionProvenance(request.resource)?.executionMode !==
        "production_test" ||
      purchaseExecutionProvenance(request.job)?.executionMode !==
        "production_test"
    )
      return false;
    if (!matchingPurchaseExecution(request.resource, request.job)) return false;
  } catch {
    return false;
  }
  const prefs = notificationPreferencesSchema.safeParse(
    (await read(`notificationPreferences/${request.ownerId}`)).data(),
  );
  return (
    prefs.success &&
    prefs.data.email === request.recipient &&
    notificationState(prefs.data.topics.orderEmail) === "active"
  );
}
