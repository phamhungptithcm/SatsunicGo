import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
import {
  purchaseExecutionProvenance,
  purchaseExecutionProvenanceSchema,
  type PurchaseExecutionProvenance,
} from "../../packages/domain/purchase-checkout";
import { purchaseDemoEnvironment } from "./purchase-environment";

export const PRODUCTION_TEST_ORIGIN = "https://satsunicgo.web.app";
export const productionTestPolicySchema = z
  .object({
    enabled: z.literal(true),
    approved: z.literal(true),
    version: z.number().int().positive().safe(),
    effectiveFrom: z.number().int().nonnegative().safe(),
    expiresAt: z.number().int().positive().safe(),
    origin: z.literal(PRODUCTION_TEST_ORIGIN),
    provider: z.literal("sepay_sandbox"),
    testerUids: z.array(z.string().min(1).max(128)).min(1).max(100),
  })
  .strict()
  .refine(
    (policy) => new Set(policy.testerUids).size === policy.testerUids.length,
  );
export type ProductionTestPolicy = z.infer<typeof productionTestPolicySchema>;

/** Explicit artifact registration is independent of a mutable activation policy. */
export function productionTestArtifactEnvironmentAllowed(
  env: NodeJS.ProcessEnv,
) {
  let config: { projectId?: string };
  try {
    config = JSON.parse(env.FIREBASE_CONFIG ?? "{}");
  } catch {
    return false;
  }
  return (
    env.PURCHASE_PRODUCTION_TEST_ARTIFACT === "v1" &&
    env.GCLOUD_PROJECT === "satsunicgo" &&
    (env.GOOGLE_CLOUD_PROJECT === undefined ||
      env.GOOGLE_CLOUD_PROJECT === "satsunicgo") &&
    config?.projectId === "satsunicgo" &&
    !env.FUNCTIONS_EMULATOR &&
    !env.FIRESTORE_EMULATOR_HOST &&
    !env.FIREBASE_AUTH_EMULATOR_HOST &&
    !env.FIREBASE_STORAGE_EMULATOR_HOST &&
    !env.STORAGE_EMULATOR_HOST &&
    !env.PUBSUB_EMULATOR_HOST &&
    !env.FIREBASE_EMULATOR_HUB &&
    !env.EVENTARC_EMULATOR
  );
}
export function productionTestArtifactEnvironment() {
  return productionTestArtifactEnvironmentAllowed(process.env);
}
export function sepayArtifactEnvironmentAllowed(env: NodeJS.ProcessEnv) {
  return (
    productionTestArtifactEnvironmentAllowed(env) ||
    (env.FUNCTIONS_EMULATOR === "true" &&
      env.GCLOUD_PROJECT === "demo-satsunicgo" &&
      (env.GOOGLE_CLOUD_PROJECT === undefined ||
        env.GOOGLE_CLOUD_PROJECT === "demo-satsunicgo"))
  );
}
export function sepayArtifactEnvironment() {
  return sepayArtifactEnvironmentAllowed(process.env);
}
export function productionTestEnvironment(db = getFirestore()) {
  return (
    productionTestArtifactEnvironment() &&
    (db as unknown as { projectId?: string }).projectId === "satsunicgo"
  );
}
export function admitProductionTestPolicy(
  raw: unknown,
  uid: string,
  now = Date.now(),
): ProductionTestPolicy | null {
  const result = productionTestPolicySchema.safeParse(raw);
  if (
    !result.success ||
    !Number.isSafeInteger(now) ||
    result.data.effectiveFrom > now ||
    result.data.expiresAt <= now ||
    !result.data.testerUids.includes(uid)
  )
    return null;
  return result.data;
}
export async function readProductionTestAdmission(
  db: FirebaseFirestore.Firestore,
  uid: string,
) {
  if (!productionTestEnvironment(db)) return null;
  return admitProductionTestPolicy(
    (await db.doc("settings/productionTest").get()).data(),
    uid,
  );
}
export function productionTestProvenance(
  policy: ProductionTestPolicy,
  testRunId: string,
): PurchaseExecutionProvenance {
  return purchaseExecutionProvenanceSchema.parse({
    executionMode: "production_test",
    executionPolicyVersion: policy.version,
    testRunId,
  });
}
/** Pinned reconciliation survives activation-off; existing mode cannot be relabeled. */
export function assertPurchaseExecutionEnvironment(
  record: unknown,
  db = getFirestore(),
) {
  const provenance = purchaseExecutionProvenance(record);
  if (
    provenance ? !productionTestEnvironment(db) : !purchaseDemoEnvironment(db)
  )
    throw Error("PURCHASE_EXECUTION_ENVIRONMENT");
  return provenance;
}
