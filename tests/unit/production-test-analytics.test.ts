import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { CONSENT_VERSION } from "../../packages/domain/analytics";

const ports = vi.hoisted(() => ({ db: vi.fn() }));
vi.mock("firebase-admin/firestore", async (original) => ({
  ...(await original<typeof import("firebase-admin/firestore")>()),
  getFirestore: ports.db,
}));
vi.mock("firebase-functions/v2/https", async (original) => ({
  ...(await original<typeof import("firebase-functions/v2/https")>()),
  onCall: (_options: unknown, handler: unknown) => handler,
}));
import {
  analyticsSession,
  analyticsIngest,
  analyticsLinkOrder,
  digest,
} from "../../functions/src/analytics-ingest";

const now = Date.parse("2026-10-10T00:00:00Z");
const uid = "test-customer";
const token = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const auth = {
  uid,
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
};
type Row = Record<string, unknown>;
type Ref = { path: string; id: string };
const policy = {
  enabled: true,
  approved: true,
  version: 1,
  effectiveFrom: now - 1000,
  expiresAt: now + 1000,
  origin: "https://satsunicgo.web.app",
  provider: "sepay_sandbox",
  testerUids: [uid],
};
const data = {
  session: {
    version: 1,
    consent: CONSENT_VERSION,
    browserId: token,
    requestId: sessionId,
  },
  ingest: {
    version: 1,
    session: token,
    events: [{ id: sessionId, at: now, kind: "page", route: "home" }],
  },
  link: { session: token, orderId: "order" },
};
const handlers = {
  session: analyticsSession,
  ingest: analyticsIngest,
  link: analyticsLinkOrder,
} as unknown as Record<
  keyof typeof data,
  (request: unknown) => Promise<unknown>
>;
function harness(
  overrides: Record<string, Row> = {},
  subject: string | null = digest(`account:${uid}`),
) {
  const rows = new Map<string, Row>(
    Object.entries({
      "analyticsConfig/current": { enabled: true, startedAt: now - 10000 },
      "settings/productionTest": policy,
      [`analyticsCapabilities/${digest(token)}`]: {
        sessionId,
        expireAt: Timestamp.fromMillis(now + 10000),
      },
      [`analyticsSessions/${sessionId}`]: {
        subject,
        browser: "browser",
        startedAt: now - 1000,
        lastSeenAt: now - 1000,
        events: 0,
        revoked: false,
        closed: false,
      },
      "orders/order": { ownerId: uid, createdAt: now - 500 },
      ...overrides,
    }),
  );
  const writes: unknown[] = [];
  const db = {
    projectId: "satsunicgo",
    doc: (path: string): Ref => ({ path, id: path.split("/").at(-1)! }),
    runTransaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        get: async (ref: Ref) => ({
          exists: rows.has(ref.path),
          data: () => rows.get(ref.path),
          ref,
        }),
        create: (...args: unknown[]) => writes.push(args),
        update: (...args: unknown[]) => writes.push(args),
        set: (...args: unknown[]) => writes.push(args),
      }),
  };
  ports.db.mockReturnValue(db);
  return { rows, writes };
}
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
    "STORAGE_EMULATOR_HOST",
    "PUBSUB_EMULATOR_HOST",
    "FIREBASE_EMULATOR_HUB",
    "EVENTARC_EMULATOR",
  ])
    vi.stubEnv(key, undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  ports.db.mockReset();
});

it.each(["session", "ingest"] as const)(
  "excludes an admitted non-staff tester before %s writes",
  async (kind) => {
    const h = harness();
    await expect(
      handlers[kind]({ data: data[kind], auth }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(h.writes).toHaveLength(0);
  },
);
it.each(["session", "ingest"] as const)(
  "preserves %s for a non-admitted real visitor",
  async (kind) => {
    const h = harness({
      "settings/productionTest": { ...policy, testerUids: ["other"] },
    });
    await expect(
      handlers[kind]({ data: data[kind], auth }),
    ).resolves.toBeDefined();
    expect(h.writes.length).toBeGreaterThan(0);
  },
);
it("preserves anonymous consent sessions", async () => {
  const h = harness({}, null);
  await expect(handlers.session({ data: data.session })).resolves.toBeDefined();
  expect(h.writes.length).toBeGreaterThan(0);
});
it("preserves the legacy artifact's real analytics behavior", async () => {
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", undefined);
  const h = harness();
  await expect(handlers.ingest({ data: data.ingest, auth })).resolves.toEqual({
    accepted: 1,
  });
  expect(h.writes.length).toBeGreaterThan(0);
});
it.each([{ testMode: true }, { executionMode: "production_test" }])(
  "never attributes a classified test order to real analytics: %j",
  async (marker) => {
    const h = harness({
      "orders/order": { ownerId: uid, createdAt: now - 500, ...marker },
    });
    await expect(
      handlers.link({ data: data.link, auth }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(h.writes).toHaveLength(0);
  },
);
it("preserves real order attribution", async () => {
  const h = harness();
  await expect(handlers.link({ data: data.link, auth })).resolves.toEqual({
    linked: true,
  });
  expect(h.writes).toHaveLength(2);
});
