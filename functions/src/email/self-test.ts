import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { info, warn } from "firebase-functions/logger";
import { runSelfTest, SelfTestError, selfTestInput, selfTestRecipient } from "./self-test-service";

// User-confirmed legacy secret name. This contains a Resend key, not an SFTP credential.
const resendKey = defineSecret("SFTP_PASSWORD");

/** Operator-only endpoint; Cloud Run IAM authenticates before this handler. */
export const emailSelfTest = onRequest({
  region: "asia-southeast1", invoker: "private", cors: false,
  minInstances: 0, maxInstances: 1, concurrency: 1,
  timeoutSeconds: 30, memory: "256MiB", secrets: [resendKey],
}, async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (process.env.FUNCTIONS_EMULATOR === "true" ||
      (process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT) !== "satsunicgo" ||
      process.env.EMAIL_TEST_ENABLED !== "true") {
    res.status(403).json({ code: "TEST_DISABLED" }); return;
  }
  if (req.method !== "POST") {
    res.set("Allow", "POST").status(405).json({ code: "METHOD_NOT_ALLOWED" }); return;
  }
  if (!req.is("application/json") || !req.rawBody || req.rawBody.length > 512) {
    res.status(400).json({ code: "INVALID_REQUEST" }); return;
  }
  const input = selfTestInput.safeParse(req.body);
  if (!input.success) { res.status(400).json({ code: "INVALID_REQUEST" }); return; }
  const recipient = selfTestRecipient.safeParse(process.env.EMAIL_TEST_RECIPIENT);
  if (!recipient.success) { res.status(503).json({ code: "CONFIGURATION" }); return; }
  try {
    const result = await runSelfTest({
      db: getFirestore(), recipient: recipient.data, operationId: input.data.operationId,
      readKey: () => resendKey.value(),
    });
    info("email_self_test_outcome", { operationId: result.operationId, state: result.state, replay: result.replay });
    res.status(result.state === "accepted" ? 200 : result.state === "rejected" ? 422 : 202).json(result);
  } catch (error) {
    const code = error instanceof SelfTestError ? error.code : "STATE_UNAVAILABLE";
    warn("email_self_test_blocked", { operationId: input.data.operationId, code });
    res.status(code === "COOLDOWN" || code === "DAILY_LIMIT" ? 429 :
      code === "OPERATION_CONFLICT" ? 409 : 503).json({ code });
  }
});
