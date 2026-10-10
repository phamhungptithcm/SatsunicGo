import { afterEach, expect, it, vi } from "vitest";
import {
  CONSENT_VERSION,
  SESSION_IDLE,
  WORKING_RETENTION,
  utcDay,
} from "../../packages/domain/analytics";

const ports = vi.hoisted(() => ({ db: vi.fn() }));
vi.mock("firebase-admin/firestore", async (original) => ({
  ...(await original<typeof import("firebase-admin/firestore")>()),
  getFirestore: ports.db,
}));
vi.mock("firebase-functions/v2/https", async (original) => ({
  ...(await original<typeof import("firebase-functions/v2/https")>()),
  onCall: (_options: unknown, handler: unknown) => handler,
}));
import { analyticsSession, digest } from "../../functions/src/analytics-ingest";

type Ref = { path: string };
type Row = Record<string, unknown>;
const browser = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
const winner = "33333333-3333-4333-8333-333333333333";
const receipt = `analyticsSessionRequests/${digest(`${browser}:null:${requestId}`)}`;
const call = analyticsSession as unknown as (
  request: unknown,
) => Promise<{ session: string; startedAt: number }>;

// The first attempt is discarded, then a later concurrent request commits.
// This makes the losing request's retry ordering deterministic without sleeps.
function conflict(
  start: number,
  sessionOverrides: Row = {},
  aliases = 1,
  policyEnabled = true,
) {
  let now = start;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  const rows = new Map<string, Row>([
    ["analyticsConfig/current", { enabled: true, startedAt: start - 10_000 }],
  ]);
  const reads: string[][] = [];
  const attempts: ReturnType<typeof transaction>[] = [];
  function transaction() {
    const paths: string[] = [];
    reads.push(paths);
    return {
      get: async (ref: Ref) => {
        paths.push(ref.path);
        return { exists: rows.has(ref.path), data: () => rows.get(ref.path) };
      },
      create: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
    };
  }
  ports.db.mockReturnValue({
    doc: (path: string): Ref => ({ path }),
    runTransaction: async <T>(
      callback: (tx: ReturnType<typeof transaction>) => Promise<T>,
    ) => {
      const first = transaction();
      attempts.push(first);
      await callback(first);
      rows.set(receipt, { sessionId: winner, aliases });
      rows.set("analyticsConfig/current", {
        enabled: policyEnabled,
        startedAt: start - 10_000,
      });
      rows.set(`analyticsSessions/${winner}`, {
        subject: null,
        startedAt: start + 1,
        lastSeenAt: start + 1,
        ...sessionOverrides,
      });
      now = start + 2;
      const retry = transaction();
      attempts.push(retry);
      return callback(retry);
    },
  });
  return { attempts, reads };
}
const request = () => ({
  data: { version: 1, consent: CONSENT_VERSION, browserId: browser, requestId },
});
afterEach(() => {
  vi.restoreAllMocks();
  ports.db.mockReset();
});

it.each([
  Date.parse("2026-10-09T12:00:00Z"),
  Date.parse("2026-10-09T23:59:59.999Z"),
])(
  "aliases the later winning session on retry, including a UTC day boundary (%s)",
  async (start) => {
    const h = conflict(start);
    const result = await call(request());
    expect(result.startedAt).toBe(start + 1);
    const retry = h.attempts[1];
    expect(retry.create).toHaveBeenCalledTimes(1);
    expect(retry.create).toHaveBeenCalledWith(
      { path: `analyticsCapabilities/${digest(result.session)}` },
      expect.objectContaining({ sessionId: winner }),
    );
    expect(retry.update).toHaveBeenCalledExactlyOnceWith(
      { path: receipt },
      { aliases: 2 },
    );
    expect(retry.set).not.toHaveBeenCalled();
    expect(h.reads[1]).toContain(
      `analyticsSubjects/${utcDay(start + 2)}-${digest(browser)}`,
    );
  },
);

it.each([
  { revoked: true },
  { closed: true },
  { subject: "another-account" },
  { startedAt: Date.parse("2026-10-09T12:00:00Z") + 3 },
  { lastSeenAt: Date.parse("2026-10-09T12:00:00Z") - SESSION_IDLE },
  { startedAt: Date.parse("2026-10-09T12:00:00Z") - WORKING_RETENTION },
])(
  "still rejects an ineligible winning session on retry: %j",
  async (overrides) => {
    const h = conflict(Date.parse("2026-10-09T12:00:00Z"), overrides);
    await expect(call(request())).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(h.attempts[1].create).not.toHaveBeenCalled();
    expect(h.attempts[1].update).not.toHaveBeenCalled();
  },
);

it("keeps the eight-alias limit on a retried request", async () => {
  const h = conflict(Date.parse("2026-10-09T12:00:00Z"), {}, 8);
  await expect(call(request())).rejects.toMatchObject({
    code: "resource-exhausted",
  });
  expect(h.attempts[1].create).not.toHaveBeenCalled();
  expect(h.attempts[1].update).not.toHaveBeenCalled();
});

it("rechecks disabled analytics policy before creating a retry alias", async () => {
  const h = conflict(Date.parse("2026-10-09T12:00:00Z"), {}, 1, false);
  await expect(call(request())).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(h.attempts[1].create).not.toHaveBeenCalled();
  expect(h.attempts[1].update).not.toHaveBeenCalled();
});
