import { HttpsError } from "firebase-functions/v2/https";
import { type Transaction, type Firestore } from "firebase-admin/firestore";
import {
  productionTestEnvironment,
  admitProductionTestPolicy,
} from "./production-test-policy";
/** Server-only symbol: JSON callable payloads cannot forge this delegation fence. */
export const askSandboxFence = Symbol("askSandboxFence");
export async function assertAskSandboxMutation(
  req: object,
  tx: Transaction,
  db: Firestore,
  uid: string,
  record?: unknown,
) {
  if ((req as { [askSandboxFence]?: boolean })[askSandboxFence] !== true)
    return;
  const [commerce, policy] = await Promise.all([
    tx.get(db.doc("settings/askCommerce")),
    tx.get(db.doc("settings/productionTest")),
  ]);
  if (
    commerce.data()?.enabled !== true ||
    commerce.data()?.approved !== true ||
    commerce.data()?.executionMode !== "production_test" ||
    !productionTestEnvironment(db) ||
    !admitProductionTestPolicy(policy.data(), uid)
  )
    throw new HttpsError(
      "unavailable",
      "Mua hộ trong chat chưa được kích hoạt. Anh/chị vẫn có thể dùng trang yêu cầu.",
    );
  if (record !== undefined) {
    if (
      !isPurchaseTestRecord(record) ||
      (record as { executionMode?: unknown }).executionMode !== "production_test" ||
      (record as { ownerId?: unknown }).ownerId !== uid
    )
      throw new HttpsError("permission-denied", "Không thể mở hội thoại này.");
    purchaseExecutionFields(record);
  }
}
import { isPurchaseTestRecord, purchaseExecutionFields, requireLivePurchaseRecord } from "./purchase-test-boundary";
/** Artifact v1 must never fall through to live creation after failed test admission. */
export function productionTestCommandAdmissionRequired(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return environment.PURCHASE_PRODUCTION_TEST_ARTIFACT === "v1";
}
/** These transitions simulate decisions; physical and financial actions stay unavailable. */
const simulatedActions = new Set([
  "issueQuote", "acceptQuote", "cancelRequest", "claimPurchase", "hold",
  "releaseHold", "finalize", "approveFinal",
]);
export function assertProductionTestCommand(record: unknown, action: string) {
  if (!isPurchaseTestRecord(record)) return;
  purchaseExecutionFields(record);
  if (!simulatedActions.has(action)) requireLivePurchaseRecord(record);
}
