import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  shippingRateConfigSchema,
  vietCargoReferenceRates,
  type ShippingRatesPublicSnapshot,
} from "../../packages/domain/shipping-rates";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "./auth/guards";
const versionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER - 1);
const mutation = {
  operationId: z.string().uuid(),
  expectedVersion: versionSchema,
};
export const shippingRatesAdminInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read") }).strict(),
  z
    .object({
      action: z.literal("save"),
      ...mutation,
      config: shippingRateConfigSchema,
    })
    .strict(),
  z.object({ action: z.literal("publish"), ...mutation }).strict(),
  z.object({ action: z.literal("delete"), ...mutation }).strict(),
]);
const options = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 8,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const privatePath = "settings/shippingRates";
const publicPath = "shippingRatePublic/current";
function storedVersion(value: unknown): number {
  if (value === undefined) return 0;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new HttpsError(
      "failed-precondition",
      "Cấu hình giá cần được kiểm tra trước khi dùng.",
    );
  return value;
}
/** Public-safe read shared by callable and SSR; no writes or private draft reads. */
export async function readPublicShippingRates(
  db = getFirestore(),
): Promise<ShippingRatesPublicSnapshot> {
  const publicDoc = await db.doc(publicPath).get();
  if (!publicDoc.exists)
    return {
      version: null,
      config: vietCargoReferenceRates,
      origin: "reference",
    };
  const data = publicDoc.data()!;
  const version = storedVersion(data.version);
  if (data.disabled === true)
    return { version, config: null, origin: "unavailable" };
  const parsed = shippingRateConfigSchema.safeParse(data.config);
  if (!parsed.success)
    throw new HttpsError(
      "failed-precondition",
      "Bảng giá đang cần kiểm tra. Liên hệ để được báo giá.",
    );
  return { version, config: parsed.data, origin: "published" };
}
export const shippingRatesPublic = onCall(options, async (req) => {
  if (!z.object({}).strict().safeParse(req.data).success)
    throw new HttpsError("invalid-argument", "Tải lại bảng giá để tiếp tục.");
  return readPublicShippingRates();
});

export const shippingRatesAdmin = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth);
  const parsed = shippingRatesAdminInput.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      "Kiểm tra dòng giá, đơn vị và khối lượng trước khi lưu.",
    );
  const p = parsed.data,
    db = getFirestore(),
    now = Date.now();
  return db.runTransaction(async (tx) => {
    const [user, access, draft, publicDoc] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(privatePath)),
      tx.get(db.doc(publicPath)),
    ]);
    const staff = access.data();
    if (
      !user.exists ||
      user.data()?.locked ||
      staff?.locked ||
      staff?.active !== true ||
      !isStringRoleArray(staff?.roles) ||
      !staff.roles.includes("OWNER")
    )
      throw new HttpsError(
        "permission-denied",
        "Cần quyền chủ doanh nghiệp hiện hành để cấu hình bảng giá.",
      );
    const version = storedVersion(draft.data()?.version);
    const configRaw = draft.data()?.config;
    const configParsed =
      configRaw == null ? null : shippingRateConfigSchema.safeParse(configRaw);
    if (configParsed && !configParsed.success)
      throw new HttpsError(
        "failed-precondition",
        "Cấu hình giá cần được kiểm tra trước khi dùng.",
      );
    const config = configParsed?.success ? configParsed.data : null;
    const publishedVersion =
      publicDoc.exists && publicDoc.data()?.disabled !== true
        ? storedVersion(publicDoc.data()?.version)
        : null;
    if (p.action === "read") return { version, config, publishedVersion };
    if (
      process.env.FUNCTIONS_EMULATOR !== "true" &&
      !recentMfa(req.auth!.token, now)
    )
      throw new HttpsError(
        "failed-precondition",
        "Xác thực hai lớp gần đây để thay đổi bảng giá.",
        { reason: "RECENT_MFA_REQUIRED" },
      );
    const op = db.doc(`idempotencyKeys/${uid}-${p.operationId}`),
      previous = await tx.get(op);
    const hash = createHash("sha256")
      .update(JSON.stringify({ kind: "shippingRatesAdmin", ...p }))
      .digest("hex");
    if (previous.exists) {
      if (previous.data()?.hash !== hash)
        throw new HttpsError(
          "already-exists",
          "Mã thao tác đã dùng cho nội dung khác.",
        );
      return previous.data()?.result;
    }
    if (version !== p.expectedVersion)
      throw new HttpsError(
        "aborted",
        "Bảng giá đã thay đổi. Tải lại trước khi lưu.",
      );
    if (version >= Number.MAX_SAFE_INTEGER)
      throw new HttpsError(
        "failed-precondition",
        "Phiên bản bảng giá cần được kiểm tra.",
      );
    if (p.action === "publish" && !config)
      throw new HttpsError(
        "failed-precondition",
        "Lưu bản nháp trước khi công bố bảng giá.",
      );
    const nextVersion = version + 1;
    const nextConfig =
      p.action === "save" ? p.config : p.action === "delete" ? null : config;
    const result = {
      version: nextVersion,
      config: nextConfig,
      publishedVersion:
        p.action === "publish"
          ? nextVersion
          : p.action === "delete"
            ? null
            : publishedVersion,
    };
    tx.set(draft.ref, {
      version: nextVersion,
      config: nextConfig,
      changedAt: now,
      changedBy: uid,
    });
    if (p.action === "publish")
      tx.set(db.doc(publicPath), {
        version: nextVersion,
        config: nextConfig,
        disabled: false,
      });
    if (p.action === "delete")
      tx.set(db.doc(publicPath), { version: nextVersion, disabled: true });
    tx.create(op, { hash, result, createdAt: now });
    tx.create(db.collection("auditEvents").doc(), {
      actor: uid,
      action: `shippingRatesAdmin.${p.action}`,
      resourceId: "shippingRates",
      previousVersion: version,
      version: nextVersion,
      createdAt: now,
    });
    return result;
  });
});
