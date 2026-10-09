import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { notificationRequestSchema } from "../../packages/domain/notification-preferences";
import { requireVerifiedGoogle } from "./auth/guards";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "./notification-preferences-service";
import {
  applySubscriptionToken,
  type SubscriptionIdentity,
} from "./notification-token-service";
import {
  parseEmailProviderConfig,
  emailProviderReady,
} from "./email/provider-config";
import { releaseCapabilityAllowed } from "./provider-release-gate";
export async function subscriptionIdentity(
  uid: string,
): Promise<SubscriptionIdentity> {
  const user = await getAuth().getUser(uid);
  return {
    email: user.email ?? "",
    verified: user.emailVerified,
    disabled: user.disabled,
  };
}
export const notificationPreferences = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 5,
    concurrency: 20,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const parsed = notificationRequestSchema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Lựa chọn thông báo chưa hợp lệ.",
      );
    const command = parsed.data,
      db = getFirestore();
    if (command.action === "confirm" || command.action === "unsubscribe")
      return applySubscriptionToken(
        db,
        command.token,
        command.action,
        Date.now(),
        subscriptionIdentity,
      );
    const uid = requireVerifiedGoogle(req.auth),
      identity = await subscriptionIdentity(uid);
    if (identity.disabled || !identity.verified || !identity.email)
      throw new HttpsError(
        "permission-denied",
        "Đăng nhập lại để quản lý thông báo.",
      );
    const preferences =
      command.action === "read"
        ? await getNotificationPreferences(db, uid, identity.email)
        : await saveNotificationPreferences(
            db,
            uid,
            identity.email,
            command,
            Date.now(),
          );
    const config = parseEmailProviderConfig(
      (await db.doc("settings/email").get()).data(),
    );
    return {
      ...preferences,
      availability: {
        email:
          releaseCapabilityAllowed(
            "email",
            process.env,
            Reflect.get(db, "projectId"),
          ) &&
          emailProviderReady(config) &&
          config.subscriptionsEnabled,
        sms: false,
      },
    };
  },
);
