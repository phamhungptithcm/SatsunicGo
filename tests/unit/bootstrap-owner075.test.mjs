/* global structuredClone */
import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  validateEnvironment,
  validateIdentity,
  prepareTotp,
  enableTotp,
  bootstrapOwner,
  createProductionStore,
} from "../../scripts/release/bootstrap-owner.mjs";

const email = "owner@example.test",
  uid = "fixture-owner075",
  operatorHash = "a".repeat(64);
const valid = () => ({
  email,
  localId: uid,
  emailVerified: true,
  disabled: false,
  providerUserInfo: [{ providerId: "google.com" }],
  mfaInfo: [{ mfaEnrollmentId: "factor1", totpInfo: {} }],
});
const code = (expected) => (error) => error.code === expected;
const dbFixture = () => {
  const rows = new Map();
  let commits = 0;
  const snapshot = (path) => ({
    exists: rows.has(path),
    data: () => structuredClone(rows.get(path)),
  });
  const db = {
    doc: (path) => ({ path, get: async () => snapshot(path) }),
    collection: () => ({ where: () => ({ limit: () => ({ query: true }) }) }),
    runTransaction: async (callback) => {
      const staged = [];
      const result = await callback({
        get: async (ref) =>
          ref.query
            ? {
                docs: [...rows]
                  .filter(
                    ([path, value]) =>
                      path.startsWith("staffAccess/") &&
                      value.roles?.includes("OWNER"),
                  )
                  .slice(0, 2)
                  .map(([path]) => ({ id: path.split("/")[1] })),
              }
            : snapshot(ref.path),
        create: (ref, data) => staged.push([ref.path, data]),
      });
      if (staged.some(([path]) => rows.has(path))) throw Error("conflict");
      for (const [path, data] of staged) rows.set(path, data);
      if (staged.length) commits++;
      return result;
    },
  };
  return { rows, db, commits: () => commits };
};
const run = (fixture, options = {}) =>
  bootstrapOwner({
    db: fixture.db,
    lookup: async () => [valid()],
    email,
    expectedUid: uid,
    operatorHash,
    ...options,
  });

test("exact project and clean environment required", () => {
  validateEnvironment("satsunicgo", {});
  assert.throws(
    () => validateEnvironment("demo-satsunicgo", {}),
    code("WRONG_PROJECT"),
  );
  for (const env of [
    { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
    { FUNCTIONS_EMULATOR: "false" },
    { FIREBASE_CONFIG: "{}" },
    { GCLOUD_PROJECT: "foreign" },
  ])
    assert.throws(
      () => validateEnvironment("satsunicgo", env),
      code("UNSAFE_ENVIRONMENT"),
    );
});

test("identity validation rejects absent, duplicate, wrong UID and wrong email", () => {
  assert.equal(validateIdentity([valid()], email, uid), uid);
  for (const users of [[], [valid(), valid()], null])
    assert.throws(
      () => validateIdentity(users, email, uid),
      code("ACCOUNT_NOT_UNIQUE_OR_MISSING"),
    );
  assert.throws(
    () => validateIdentity([valid()], "other@example.test", uid),
    code("EMAIL_MISMATCH"),
  );
  assert.throws(
    () => validateIdentity([valid()], email, "other-id"),
    code("UID_MISMATCH"),
  );
  assert.throws(
    () => validateIdentity([{ ...valid(), localId: "../other" }], email),
    code("UID_MISMATCH"),
  );
});

test("requires verified enabled Google identity and enrolled TOTP", () => {
  for (const patch of [
    { emailVerified: false },
    { emailVerified: "true" },
    { disabled: true },
    { disabled: "false" },
  ])
    assert.throws(
      () => validateIdentity([{ ...valid(), ...patch }], email),
      code("ACCOUNT_NOT_VERIFIED_OR_DISABLED"),
    );
  for (const patch of [
    { providerUserInfo: [] },
    { providerUserInfo: [{ providerId: "password" }] },
  ])
    assert.throws(
      () => validateIdentity([{ ...valid(), ...patch }], email),
      code("GOOGLE_REQUIRED"),
    );
  for (const mfaInfo of [
    [],
    [{ phoneInfo: "+10000000000", mfaEnrollmentId: "sms" }],
    [{ totpInfo: {} }],
  ])
    assert.throws(
      () => validateIdentity([{ ...valid(), mfaInfo }], email),
      code("TOTP_REQUIRED"),
    );
  assert.throws(
    () => validateIdentity([{ ...valid(), tenantId: "tenant1" }], email),
    code("TENANT_NOT_SUPPORTED"),
  );
});

test("Firestore adapter uses explicit OAuth credential and quota project", async () => {
  const db = await createProductionStore("fixture-token-only");
  assert.equal(db._settings.projectId, "satsunicgo");
  assert.equal(db._settings.databaseId, "(default)");
  assert.equal(
    db._settings.authClient.credentials.access_token,
    "fixture-token-only",
  );
  assert.equal(db._settings.authClient.quotaProjectId, "satsunicgo");
  const headers = await db._settings.authClient.getRequestHeaders(
    "https://firestore.googleapis.com",
  );
  assert.equal(headers.get("authorization"), "Bearer fixture-token-only");
  await db.terminate();
});

test("TOTP config preserves other factors and cannot downgrade mandatory MFA", () => {
  const config = {
    mfa: {
      state: "DISABLED",
      enabledProviders: ["PHONE_SMS"],
      providerConfigs: [{ state: "ENABLED", smsProviderConfig: {} }],
    },
  };
  const before = structuredClone(config),
    after = prepareTotp(config);
  assert.deepEqual(config, before);
  assert.equal(after.state, "ENABLED");
  assert.deepEqual(after.enabledProviders, ["PHONE_SMS"]);
  assert.deepEqual(after.providerConfigs[0], before.mfa.providerConfigs[0]);
  assert.deepEqual(after.providerConfigs[1], {
    state: "ENABLED",
    totpProviderConfig: { adjacentIntervals: 1 },
  });
  assert.throws(
    () => prepareTotp({ mfa: { state: "MANDATORY" } }),
    code("MFA_STATE_UNSUPPORTED"),
  );
  assert.throws(
    () => prepareTotp({ mfa: { state: "OPTIONAL" } }),
    code("MFA_STATE_UNSUPPORTED"),
  );
  assert.throws(
    () =>
      prepareTotp({
        mfa: {
          state: "ENABLED",
          providerConfigs: [{ totpProviderConfig: { adjacentIntervals: 11 } }],
        },
      }),
    code("MFA_INTERVALS_INVALID"),
  );
});

test("MFA defaults read-only; apply patches only mfa and is idempotent", async () => {
  let config = {
      name: "projects/satsunicgo/config",
      authorizedDomains: ["satsunicgo.web.app"],
      mfa: { state: "DISABLED" },
    },
    patches = 0;
  const api = {
    read: async () => structuredClone(config),
    patch: async (body) => {
      patches++;
      assert.deepEqual(Object.keys(body), ["mfa"]);
      config = { ...config, ...body };
    },
  };
  assert.equal((await enableTotp(api, false)).status, "READ_ONLY");
  assert.equal(patches, 0);
  assert.equal((await enableTotp(api, true)).status, "TOTP_ENABLED");
  assert.equal((await enableTotp(api, true)).status, "ALREADY_CONFIGURED");
  assert.equal(patches, 1);
});

test("MFA refuses concurrent config change, readback mismatch and unrelated changes", async () => {
  let reads = 0;
  await assert.rejects(
    enableTotp(
      {
        read: async () => ({ mfa: { state: "DISABLED" }, revision: reads++ }),
        patch: async () => assert.fail("no mutation"),
      },
      true,
    ),
    code("AUTH_CONFIG_CHANGED"),
  );
  const config = { mfa: { state: "DISABLED" } };
  await assert.rejects(
    enableTotp({ read: async () => config, patch: async () => {} }, true),
    code("MFA_READBACK_MISMATCH"),
  );
  let stored = config;
  await assert.rejects(
    enableTotp(
      {
        read: async () => stored,
        patch: async (body) => {
          stored = { ...body, authorizedDomains: ["evil.test"] };
        },
      },
      true,
    ),
    code("MFA_READBACK_MISMATCH"),
  );
});

test("bootstrap read-only never writes; apply creates role and audit, repeated apply never writes again", async () => {
  const fixture = dbFixture();
  assert.equal((await run(fixture)).status, "READ_ONLY_READY");
  assert.equal(fixture.rows.size, 0);
  assert.equal((await run(fixture, { apply: true })).status, "BOOTSTRAPPED");
  assert.equal(fixture.rows.size, 2);
  assert.deepEqual(fixture.rows.get("staffAccess/" + uid).roles, ["OWNER"]);
  assert.equal(
    (await run(fixture, { apply: true })).status,
    "ALREADY_BOOTSTRAPPED",
  );
  assert.equal(fixture.commits(), 1);
});

test("explicit UID, locked profile, unrelated rights and other OWNER block writes", async () => {
  await assert.rejects(
    run(dbFixture(), { apply: true, expectedUid: undefined }),
    code("EXPECTED_UID_REQUIRED"),
  );
  for (const [path, row, reason] of [
    ["users/" + uid, { locked: true }, "PROFILE_LOCKED"],
    [
      "staffAccess/" + uid,
      { roles: ["SUPPORT"], active: true },
      "EXISTING_RIGHTS_NOT_OWNED",
    ],
    [
      "staffAccess/other",
      { roles: ["OWNER"], active: false },
      "DIFFERENT_OWNER_EXISTS",
    ],
    [
      "auditEvents/first-owner-bootstrap-075",
      { resourceId: "other" },
      "AUDIT_CONFLICT_OR_OPERATOR_MISSING",
    ],
  ]) {
    const fixture = dbFixture();
    fixture.rows.set(path, row);
    await assert.rejects(run(fixture, { apply: true }), code(reason));
    assert.equal(fixture.rows.size, 1);
    assert.equal(fixture.commits(), 0);
  }
});

test("identity revoked before commit aborts both writes", async () => {
  const fixture = dbFixture();
  let calls = 0;
  await assert.rejects(
    run(fixture, {
      apply: true,
      lookup: async () => (calls++ ? [] : [valid()]),
    }),
    code("ACCOUNT_NOT_UNIQUE_OR_MISSING"),
  );
  assert.equal(fixture.rows.size, 0);
});

test("CLI rejects unknown arguments and missing exact project without printing identifiers", () => {
  for (const args of [["--unknown"], []]) {
    const child = spawnSync(
      process.execPath,
      ["scripts/release/bootstrap-owner.mjs", ...args],
      { encoding: "utf8", env: { PATH: process.env.PATH } },
    );
    assert.equal(child.status, 1);
    assert.equal(JSON.parse(child.stderr).status, "BLOCKED");
    assert.equal(child.stderr.includes(email), false);
    assert.equal(child.stdout, "");
  }
});
