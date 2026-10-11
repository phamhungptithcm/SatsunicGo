/* global structuredClone, fetch, AbortSignal */
import process from "node:process";
import console from "node:console";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

export const PROJECT = "satsunicgo";
const PROJECT_NUMBER = "278913913091";
const AUDIT_ID = "first-owner-bootstrap-075";
const exec = promisify(execFile);
const digest = (value) => createHash("sha256").update(value).digest("hex");
export async function createProductionStore(token) {
  const { Firestore } = await import("firebase-admin/firestore");
  const require = createRequire(import.meta.url);
  // Resolve the credential adapter with the SDK's dependency version, not Firebase CLI's older host copy.
  const sdkRequire = createRequire(require.resolve("firebase-admin/firestore"));
  const { OAuth2Client } = sdkRequire("google-auth-library");
  const authClient = new OAuth2Client({
    quotaProjectId: PROJECT,
    eagerRefreshThresholdMillis: 30000,
  });
  authClient.setCredentials({
    access_token: token,
    expiry_date: Date.now() + 300000,
  });
  // Firestore forwards these options to GoogleAuth; the explicit client prevents ambient ADC fallback.
  return new Firestore({
    projectId: PROJECT,
    databaseId: "(default)",
    authClient,
  });
}
export class BootstrapError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
const reject = (code) => {
  throw new BootstrapError(code);
};

export function validateEnvironment(project, environment) {
  if (project !== PROJECT) reject("WRONG_PROJECT");
  for (const [key, value] of Object.entries(environment)) {
    if (
      (/EMULATOR|FIREBASE_CONFIG/.test(key) && value) ||
      (["GCLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT"].includes(key) &&
        value &&
        value !== PROJECT)
    )
      reject("UNSAFE_ENVIRONMENT");
  }
}

export function validateIdentity(users, email, expectedUid) {
  if (!Array.isArray(users) || users.length !== 1)
    reject("ACCOUNT_NOT_UNIQUE_OR_MISSING");
  const user = users[0];
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof user.email !== "string" ||
    user.email.toLowerCase() !== email.toLowerCase()
  )
    reject("EMAIL_MISMATCH");
  if (
    typeof user.localId !== "string" ||
    !/^[A-Za-z0-9-]{1,128}$/.test(user.localId) ||
    (expectedUid !== undefined && user.localId !== expectedUid)
  )
    reject("UID_MISMATCH");
  if (
    user.emailVerified !== true ||
    (user.disabled !== undefined && user.disabled !== false)
  )
    reject("ACCOUNT_NOT_VERIFIED_OR_DISABLED");
  if (
    !Array.isArray(user.providerUserInfo) ||
    !user.providerUserInfo.some((p) => p?.providerId === "google.com")
  )
    reject("GOOGLE_REQUIRED");
  if (
    !Array.isArray(user.mfaInfo) ||
    !user.mfaInfo.some(
      (f) =>
        f?.totpInfo &&
        typeof f.totpInfo === "object" &&
        !Array.isArray(f.totpInfo) &&
        typeof f.mfaEnrollmentId === "string" &&
        f.mfaEnrollmentId.length > 0,
    )
  )
    reject("TOTP_REQUIRED");
  if (user.tenantId) reject("TENANT_NOT_SUPPORTED");
  return user.localId;
}

export function prepareTotp(config) {
  if (
    !config ||
    typeof config !== "object" ||
    !config.mfa ||
    !["DISABLED", "ENABLED"].includes(config.mfa.state)
  )
    reject("MFA_STATE_UNSUPPORTED");
  const mfa = structuredClone(config.mfa);
  mfa.state = "ENABLED";
  const providers = mfa.providerConfigs ?? [];
  if (!Array.isArray(providers)) reject("MFA_PROVIDERS_INVALID");
  const totps = providers.filter(
    (p) => p && Object.hasOwn(p, "totpProviderConfig"),
  );
  if (totps.length > 1) reject("MFA_PROVIDERS_INVALID");
  if (!totps.length)
    providers.push({
      state: "ENABLED",
      totpProviderConfig: { adjacentIntervals: 1 },
    });
  else {
    const intervals = totps[0].totpProviderConfig?.adjacentIntervals;
    if (!Number.isInteger(intervals) || intervals < 0 || intervals > 10)
      reject("MFA_INTERVALS_INVALID");
    totps[0].state = "ENABLED";
  }
  mfa.providerConfigs = providers;
  return mfa;
}

const stable = (value) =>
  JSON.stringify(value, function (_key, item) {
    return item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item;
  });
const unrelatedConfig = (config) =>
  Object.fromEntries(
    Object.entries(config).filter(
      ([key]) => !["mfa", "updateTime", "etag"].includes(key),
    ),
  );

export async function enableTotp(api, apply) {
  const before = await api.read();
  const desired = prepareTotp(before);
  const changed = stable(before.mfa) !== stable(desired);
  if (!apply)
    return {
      status: "READ_ONLY",
      changeRequired: changed,
      priorMfa: before.mfa,
      desiredMfa: desired,
    };
  // Re-read before mutation; never knowingly overwrite concurrent MFA configuration.
  const latest = await api.read();
  if (stable(latest) !== stable(before)) reject("AUTH_CONFIG_CHANGED");
  if (changed) await api.patch({ mfa: desired });
  const after = await api.read();
  if (
    stable(after.mfa) !== stable(desired) ||
    stable(unrelatedConfig(after)) !== stable(unrelatedConfig(before))
  )
    reject("MFA_READBACK_MISMATCH");
  return {
    status: changed ? "TOTP_ENABLED" : "ALREADY_CONFIGURED",
    priorMfa: before.mfa,
    currentMfa: after.mfa,
  };
}

function validateAccess({ target, profile, owners, audit }, uid, operatorHash) {
  if (profile?.locked) reject("PROFILE_LOCKED");
  if (owners.some((owner) => owner.id !== uid))
    reject("DIFFERENT_OWNER_EXISTS");
  if (target) {
    if (
      target.active !== true ||
      target.locked !== false ||
      stable(target.roles) !== '["OWNER"]' ||
      stable(target.orderIds) !== "[]" ||
      target.bootstrapPlan !== "OWNER075" ||
      target.version !== 1 ||
      !audit ||
      audit.resourceId !== uid ||
      audit.action !== "bootstrapFirstOwner" ||
      audit.plan !== "OWNER075" ||
      target.changedBy !== audit.actor ||
      !/^[a-f0-9]{64}$/.test(audit.actor ?? "")
    )
      reject("EXISTING_RIGHTS_NOT_OWNED");
    return "ALREADY_BOOTSTRAPPED";
  }
  if (audit || !/^[a-f0-9]{64}$/.test(operatorHash ?? ""))
    reject("AUDIT_CONFLICT_OR_OPERATOR_MISSING");
  return "READY";
}

export async function bootstrapOwner({
  db,
  lookup,
  email,
  expectedUid,
  operatorHash,
  apply = false,
}) {
  if (
    apply &&
    (typeof expectedUid !== "string" ||
      !/^[A-Za-z0-9-]{1,128}$/.test(expectedUid))
  )
    reject("EXPECTED_UID_REQUIRED");
  const uid = validateIdentity(await lookup(), email, expectedUid);
  const target = db.doc(`staffAccess/${uid}`),
    profile = db.doc(`users/${uid}`);
  const audit = db.doc(`auditEvents/${AUDIT_ID}`);
  const owners = db
    .collection("staffAccess")
    .where("roles", "array-contains", "OWNER")
    .limit(2);
  const status = await db.runTransaction(
    async (tx) => {
      const [staffSnapshot, profileSnapshot, ownerSnapshot, auditSnapshot] =
        await Promise.all([
          tx.get(target),
          tx.get(profile),
          tx.get(owners),
          tx.get(audit),
        ]);
      const state = validateAccess(
        {
          target: staffSnapshot.data(),
          profile: profileSnapshot.data(),
          owners: ownerSnapshot.docs.map((row) => ({ id: row.id })),
          audit: auditSnapshot.data(),
        },
        uid,
        operatorHash,
      );
      // Auth and Firestore are separate services: revalidate on every transaction attempt.
      validateIdentity(await lookup(), email, uid);
      if (state !== "READY" || !apply)
        return state === "READY" ? "READ_ONLY_READY" : state;
      const now = Date.now();
      tx.create(target, {
        roles: ["OWNER"],
        active: true,
        locked: false,
        orderIds: [],
        version: 1,
        createdAt: now,
        changedAt: now,
        changedBy: operatorHash,
        bootstrapPlan: "OWNER075",
      });
      tx.create(audit, {
        actor: operatorHash,
        action: "bootstrapFirstOwner",
        resourceId: uid,
        createdAt: now,
        plan: "OWNER075",
      });
      return "BOOTSTRAPPED";
    },
    { maxAttempts: 3 },
  );
  const [role, receipt] = await Promise.all([target.get(), audit.get()]);
  if (status !== "READ_ONLY_READY")
    validateAccess(
      {
        target: role.data(),
        profile: undefined,
        owners: [],
        audit: receipt.data(),
      },
      uid,
      operatorHash,
    );
  return { status, rolePresent: role.exists, auditPresent: receipt.exists };
}

async function main(args, environment) {
  const apply = args.includes("--apply"),
    totp = args.includes("--enable-totp");
  if (
    args.some((arg) => !["--apply", "--enable-totp"].includes(arg)) ||
    new Set(args).size !== args.length
  )
    reject("INVALID_ARGUMENTS");
  validateEnvironment(environment.OWNER_BOOTSTRAP_PROJECT, environment);
  if (!totp && typeof environment.OWNER_BOOTSTRAP_EMAIL !== "string")
    reject("TARGET_EMAIL_REQUIRED");
  const { stdout: token } = await exec(
    "gcloud",
    ["auth", "print-access-token", "--project", PROJECT],
    { timeout: 20000 },
  );
  async function api(url, body, method = "GET") {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "x-goog-user-project": PROJECT,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) reject(`PROVIDER_HTTP_${response.status}`);
    return response.json();
  }
  const identity = await api(
    `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}`,
  );
  if (
    identity.projectId !== PROJECT ||
    String(identity.projectNumber) !== PROJECT_NUMBER ||
    identity.lifecycleState !== "ACTIVE"
  )
    reject("PROJECT_IDENTITY_MISMATCH");
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`;
  if (totp)
    return enableTotp(
      {
        read: () => api(configUrl),
        patch: (body) => api(`${configUrl}?updateMask=mfa`, body, "PATCH"),
      },
      apply,
    );
  const database = await api(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)`,
  );
  if (
    database.locationId !== "asia-southeast1" ||
    database.type !== "FIRESTORE_NATIVE"
  )
    reject("DATABASE_IDENTITY_MISMATCH");
  const { stdout: account } = await exec(
    "gcloud",
    ["auth", "list", "--filter=status:ACTIVE", "--format=value(account)"],
    { timeout: 20000 },
  );
  if (!account.trim() || account.trim().includes("\n"))
    reject("OPERATOR_NOT_UNIQUE");
  const db = await createProductionStore(token.trim());
  try {
    return await bootstrapOwner({
      db,
      email: environment.OWNER_BOOTSTRAP_EMAIL,
      expectedUid: environment.OWNER_BOOTSTRAP_EXPECTED_UID,
      operatorHash: digest(account.trim()),
      apply,
      lookup: async () =>
        (
          await api(
            `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:lookup`,
            { email: [environment.OWNER_BOOTSTRAP_EMAIL] },
            "POST",
          )
        ).users ?? [],
    });
  } finally {
    await db.terminate();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2), process.env)
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(
        JSON.stringify({
          status: "BLOCKED",
          code:
            error instanceof BootstrapError
              ? error.code
              : "OPERATION_FAILED_NO_AUTOMATIC_MUTATION_RETRY",
        }),
      );
      process.exitCode = 1;
    });
}
