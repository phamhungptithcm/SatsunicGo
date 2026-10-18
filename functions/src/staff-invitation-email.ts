import { isStringRoleArray } from "./auth/guards";
import { randomUUID } from "node:crypto";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { warn } from "firebase-functions/logger";
import {
  invitationRecord,
  invitationState,
} from "../../packages/domain/staff-invitation";
import { invitationRef } from "./staff-invitations";
import { CUSTOMER_EMAIL_ORIGIN } from "./email-content";
import {
  dispatchResend,
  emailRequestIdentity,
  type EmailDispatchResult,
} from "./email/dispatch";
import {
  parseEmailProviderConfig,
  emailProviderReady,
} from "./email/provider-config";
import {
  emailProductionEnvironmentAllowed,
  releaseCapabilityAllowed,
} from "./provider-release-gate";
import type { ResendMessage } from "./email/resend";
const key = defineSecret("SFTP_PASSWORD");
const LEASE = 360_000;
export function staffInvitationMessage(
  id: string,
  recipient: string,
  from: string,
): ResendMessage {
  const link = `${CUSTOMER_EMAIL_ORIGIN}/join-staff?id=${encodeURIComponent(id)}`;
  return {
    from,
    to: recipient,
    subject: "Lời mời tham gia SatsunicGo",
    text: `Bạn được mời tham gia đội ngũ SatsunicGo. Mở ${link} và đăng nhập bằng tài khoản Google nhận email này để chấp nhận. Lời mời có hiệu lực tối đa 7 ngày. Sau khi chấp nhận, chủ doanh nghiệp sẽ phân quyền. Nếu không mong đợi lời mời này, bạn có thể bỏ qua email.`,
    html: `<h1>Lời mời tham gia SatsunicGo</h1><p>Đăng nhập bằng tài khoản Google nhận email này để chấp nhận.</p><p><a href="${link}">Xem lời mời</a></p><p>Lời mời có hiệu lực tối đa 7 ngày. Sau khi chấp nhận, chủ doanh nghiệp sẽ phân quyền.</p><p>Nếu không mong đợi lời mời này, bạn có thể bỏ qua email.</p>`,
  };
}
export async function deliverStaffInvitationJob(deps: {
  db: Firestore;
  jobId: string;
  from: string;
  now?: () => number;
  send: (
    message: ResendMessage,
    jobId: string,
    beforeSend: () => Promise<boolean>,
  ) => Promise<EmailDispatchResult>;
}) {
  const { db } = deps,
    clock = deps.now ?? Date.now,
    now = clock(),
    claimId = randomUUID();
  const jobRef = db.doc(`staffInvitationMailJobs/${deps.jobId}`);
  const claimed = await db.runTransaction(async (tx) => {
    const job = await tx.get(jobRef);
    if (!job.exists) return null;
    if (
      job.get("state") === "sending" &&
      now - Number(job.get("claimedAt")) >= LEASE
    ) {
      tx.update(jobRef, { state: "unknown", reconciliationRequired: true });
      return null;
    }
    if (job.get("state") !== "queued" || (job.get("retryAt") ?? 0) > now)
      return null;
    const snapshot = await tx.get(invitationRef(db, job.get("invitationId")));
    const parsed = invitationRecord.safeParse(snapshot.data());
    if (
      !parsed.success ||
      invitationState(parsed.data, now) !== "pending" ||
      parsed.data.jobId !== deps.jobId
    ) {
      tx.update(jobRef, { state: "cancelled" });
      return null;
    }
    if (
      typeof job.get("requestedBy") !== "string" ||
      !/^[a-zA-Z0-9-]{1,128}$/.test(job.get("requestedBy"))
    ) {
      tx.update(jobRef, { state: "failed" });
      return null;
    }
    const creator = await tx.get(
      db.doc(`staffAccess/${job.get("requestedBy")}`),
    );
    const user = await tx.get(db.doc(`users/${job.get("requestedBy")}`));
    if (
      creator.get("active") !== true ||
      creator.get("locked") ||
      user.get("locked") ||
      !isStringRoleArray(creator.get("roles")) ||
      !creator.get("roles").includes("OWNER")
    ) {
      tx.update(jobRef, { state: "cancelled" });
      return null;
    }
    if (Number(job.get("attempts") ?? 0) >= 3) {
      tx.update(jobRef, { state: "failed" });
      return null;
    }
    const message = staffInvitationMessage(
      parsed.data.id,
      parsed.data.email,
      deps.from,
    );
    tx.update(jobRef, {
      state: "sending",
      claimId,
      claimedAt: now,
      requestIdentity: emailRequestIdentity(message),
      attempts: Number(job.get("attempts") ?? 0) + 1,
    });
    return message;
  });
  if (!claimed) return;
  const beforeSend = () =>
    db.runTransaction(async (tx) => {
      const job = await tx.get(jobRef);
      if (
        job.get("state") !== "sending" ||
        job.get("claimId") !== claimId ||
        clock() - now >= LEASE
      )
        return false;
      const invite = await tx.get(invitationRef(db, job.get("invitationId")));
      const parsed = invitationRecord.safeParse(invite.data());
      if (
        !parsed.success ||
        invitationState(parsed.data, clock()) !== "pending" ||
        parsed.data.jobId !== deps.jobId
      )
        return false;
      const creator = await tx.get(
          db.doc(`staffAccess/${job.get("requestedBy")}`),
        ),
        user = await tx.get(db.doc(`users/${job.get("requestedBy")}`));
      return (
        creator.get("active") === true &&
        !creator.get("locked") &&
        !user.get("locked") &&
        isStringRoleArray(creator.get("roles")) &&
        creator.get("roles").includes("OWNER")
      );
    });
  let result: EmailDispatchResult;
  if (!(await beforeSend()))
    result = { state: "rejected", reason: "configuration", attempted: false };
  else {
    try {
      result = await deps.send(claimed, deps.jobId, beforeSend);
    } catch {
      result = {
        state: "unknown",
        reason: "provider_unknown",
        attempted: true,
      };
    }
  }
  await db.runTransaction(async (tx) => {
    const job = await tx.get(jobRef);
    if (job.get("state") !== "sending" || job.get("claimId") !== claimId)
      return;
    tx.update(jobRef, {
      state:
        result.state === "rejected"
          ? "failed"
          : result.state === "deferred"
            ? "queued"
            : result.state,
      ...(result.state === "accepted" ? { providerId: result.providerId } : {}),
      ...(result.state === "deferred"
        ? {
            retryAt: result.retryAt,
            attempts: result.attempted
              ? job.get("attempts")
              : Math.max(0, job.get("attempts") - 1),
          }
        : {}),
      ...(result.state === "unknown" ? { reconciliationRequired: true } : {}),
      completedAt: clock(),
    });
  });
}
export const deliverStaffInvitations = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "asia-southeast1",
    maxInstances: 1,
    timeoutSeconds: 300,
    secrets: [key],
  },
  async () => {
    // Explicit activation is a release operation. Local execution never reads a secret or sends mail.
    if (
      process.env.STAFF_INVITATION_EMAIL_ENABLED !== "true" ||
      !emailProductionEnvironmentAllowed(process.env)
    )
      return;
    const db = getFirestore();
    if (
      !releaseCapabilityAllowed(
        "email",
        process.env,
        Reflect.get(db, "projectId"),
      )
    )
      return;
    const config = parseEmailProviderConfig(
      (await db.doc("settings/email").get()).data(),
    );
    if (!emailProviderReady(config)) return;
    const rows = await db
      .collection("staffInvitationMailJobs")
      .where("state", "in", ["queued", "sending"])
      .limit(20)
      .get();
    for (const row of rows.docs) {
      try {
        await deliverStaffInvitationJob({
          db,
          jobId: row.id,
          from: config!.from,
          send: (message, jobId, beforeSend) =>
            dispatchResend({
              db,
              config: config!,
              message,
              apiKey: key.value(),
              stableJobKey: `staff-${jobId}`,
              beforeSend,
            }),
        });
      } catch {
        warn("staff_invitation_dispatch_incomplete", { jobId: row.id });
      }
    }
  },
);
