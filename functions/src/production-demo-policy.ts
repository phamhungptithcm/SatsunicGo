import { getFirestore, type Transaction } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle, recentMfa } from "./auth/guards";
import { productionTestEnvironment } from "./production-test-policy";
import { purchaseDemoEnvironment } from "./purchase-environment";

export const demoProvider = "production_demo" as const;
export const demoMerchant = "satsunicgo-production-demo";
export const demoSessionSchema = z
  .object({
    id: z.string().uuid(),
    ownerId: z.string().min(1),
    enabled: z.boolean(),
    version: z.literal(1),
    createdAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
    checkoutIds: z.array(z.string().uuid()).max(5),
    artifact: z.literal("production-demo-v1"),
    revision: z.string().min(1),
  })
  .strict()
  .refine(
    (s) =>
      s.expiresAt > s.createdAt &&
      s.expiresAt - s.createdAt <= 4 * 3600000 &&
      new Set(s.checkoutIds).size === s.checkoutIds.length,
  );
export type DemoSession = z.infer<typeof demoSessionSchema>;
export function demoEnvironment() {
  return productionTestEnvironment() || purchaseDemoEnvironment();
}
export function demoAuth(req: CallableRequest) {
  if (!demoEnvironment())
    throw new HttpsError("permission-denied", "Chế độ demo chưa khả dụng.");
  if (!purchaseDemoEnvironment() && !req.app)
    throw new HttpsError("unauthenticated", "Không thể xác minh ứng dụng.");
  return requireVerifiedGoogle(req.auth);
}
export async function demoOwner(tx: Transaction, uid: string) {
  const db = getFirestore();
  const [profile, access] = await tx.getAll(
    db.doc(`users/${uid}`),
    db.doc(`staffAccess/${uid}`),
  );
  if (
    profile.data()?.locked ||
    access.data()?.locked ||
    access.data()?.active !== true ||
    !Array.isArray(access.data()?.roles) ||
    !access.data()!.roles.includes("OWNER")
  )
    throw new HttpsError(
      "permission-denied",
      "Phiên demo chỉ dành cho chủ tài khoản được phép.",
    );
}
export function demoMfa(req: CallableRequest) {
  if (!req.auth || !recentMfa(req.auth.token, Date.now()))
    throw new HttpsError(
      "failed-precondition",
      "Xác thực hai lớp lại để mở hoặc dừng phiên demo.",
      { reason: "RECENT_MFA_REQUIRED" },
    );
}
export async function demoSession(
  tx: Transaction,
  runId: string,
  uid: string,
  active = true,
) {
  const row = await tx.get(
    getFirestore().doc(`productionDemoSessions/${runId}`),
  );
  const parsed = demoSessionSchema.safeParse(row.data());
  if (!parsed.success || parsed.data.ownerId !== uid)
    throw new HttpsError("permission-denied", "Không mở được phiên demo này.");
  if (
    active &&
    (!parsed.data.enabled ||
      parsed.data.createdAt > Date.now() ||
      parsed.data.expiresAt <= Date.now())
  )
    throw new HttpsError(
      "failed-precondition",
      "Phiên demo đã dừng hoặc hết hạn. Bạn vẫn có thể xem kết quả đã lưu.",
    );
  return parsed.data;
}
export function demoExecution(session: DemoSession) {
  return {
    executionMode: "production_test" as const,
    executionPolicyVersion: session.version,
    testRunId: session.id,
    testMode: true as const,
  };
}
export function assertDemoRecord(
  record: Record<string, unknown> | undefined,
  session: DemoSession,
) {
  if (
    !record ||
    record.ownerId !== session.ownerId ||
    record.provider !== demoProvider ||
    record.executionMode !== "production_test" ||
    record.executionPolicyVersion !== session.version ||
    record.testRunId !== session.id ||
    record.testMode !== true
  )
    throw new HttpsError(
      "permission-denied",
      "Bản ghi không thuộc phiên demo này.",
    );
}
