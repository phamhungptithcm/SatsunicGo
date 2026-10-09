import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";

type Row = Record<string, unknown>;
type Ref = { path: string };
type Write = { kind: "create" | "set"; path: string; data: Row };
const fixture = vi.hoisted(() => {
  const rows = new Map<string, Row>();
  const writes: Write[] = [];
  const transaction = (staged: Write[]) => ({
    get: async (ref: Ref) => ({
      exists: rows.has(ref.path),
      data: () => structuredClone(rows.get(ref.path)),
    }),
    getAll: async (...refs: Ref[]) =>
      refs.map((ref) => ({
        exists: rows.has(ref.path),
        data: () => structuredClone(rows.get(ref.path)),
      })),
    create(ref: Ref, data: Row) {
      const write = { kind: "create" as const, path: ref.path, data };
      writes.push(write);
      staged.push(write);
    },
    set(ref: Ref, data: Row) {
      const write = { kind: "set" as const, path: ref.path, data };
      writes.push(write);
      staged.push(write);
    },
  });
  return {
    rows,
    writes,
    db: {
      projectId: "demo-satsunicgo",
      doc: (path: string) => ({ path }),
      async runTransaction(
        run: (tx: ReturnType<typeof transaction>) => Promise<unknown>,
      ) {
        const staged: Write[] = [];
        const result = await run(transaction(staged));
        for (const write of staged)
          rows.set(write.path, structuredClone(write.data));
        return result;
      },
    },
  };
});
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => fixture.db,
}));

const uid = "synthetic-owner-guard";
const cartPath = `carts/${uid}`;
const operationId = "00000000-0000-4000-8000-000000000021";
const existingLine = {
  lineId: "00000000-0000-4000-8000-000000000011",
  productId: "synthetic-existing-product",
  variant: "",
  quantity: 1,
};
let api: typeof import("../../functions/src/purchase-checkout");

beforeAll(async () => {
  vi.stubEnv("FUNCTIONS_EMULATOR", "true");
  vi.stubEnv("GCLOUD_PROJECT", "demo-satsunicgo");
  vi.stubEnv(
    "FIREBASE_CONFIG",
    JSON.stringify({ projectId: "demo-satsunicgo" }),
  );
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207");
  api = await import("../../functions/src/purchase-checkout");
});
afterAll(() => vi.unstubAllEnvs());
beforeEach(() => {
  fixture.rows.clear();
  fixture.writes.length = 0;
  fixture.rows.set(`users/${uid}`, { locked: false });
  fixture.rows.set("settings/upfrontCheckout", {
    enabled: true,
    approved: true,
    version: 1,
    serviceBps: 500,
    termsVersion: "synthetic-terms",
    effectiveFrom: 0,
    expiresAt: Date.now() + 3_600_000,
    rates: {
      USD: { numerator: 250, denominator: 1 },
      JPY: { numerator: 170, denominator: 1 },
      KRW: { numerator: 20, denominator: 1 },
    },
  });
});

function request(expectedRevision: number) {
  return {
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data: {
      action: "addRequest",
      operationId,
      expectedRevision,
      request: {
        market: "US",
        items: [
          {
            name: "Synthetic purchase",
            quantity: 1,
            variant: "",
            unitSourceMinor: 1200,
          },
        ],
        notes: "",
      },
    },
  } as CallableRequest;
}

it("rejects a valid same-revision cart owned by another account before any writes", async () => {
  const stored = {
    ownerId: "synthetic-other-owner",
    revision: 7,
    updatedAt: 0,
    items: [existingLine],
  };
  fixture.rows.set(cartPath, structuredClone(stored));
  const outcome = await api.purchaseCheckout.run(request(7)).then(
    (value) => ({ accepted: true, value }),
    (error: unknown) => ({ accepted: false, error }),
  );
  expect(fixture.writes.map((write) => write.path)).toEqual([]);
  expect(outcome).toMatchObject({
    accepted: false,
    error: { code: "permission-denied", message: "Chưa mở được giỏ." },
  });
  expect(fixture.rows.get(cartPath)).toEqual(stored);
});

it("adds a request to the same-owner cart while preserving existing lines", async () => {
  fixture.rows.set(cartPath, {
    ownerId: uid,
    revision: 7,
    updatedAt: 0,
    items: [existingLine],
  });
  const result = await api.purchaseCheckout.run(request(7));
  expect(result).toMatchObject({ cart: { ownerId: uid, revision: 8 } });
  const cart = fixture.rows.get(cartPath);
  expect(cart?.items).toEqual([
    existingLine,
    expect.objectContaining({
      kind: "custom",
      quantity: 1,
      custom: expect.objectContaining({ name: "Synthetic purchase" }),
    }),
  ]);
  expect(
    fixture.writes.filter((write) => write.path === cartPath),
  ).toHaveLength(1);
  expect(
    fixture.writes.filter((write) => write.path.startsWith("purchaseDrafts/")),
  ).toHaveLength(1);
  expect(
    fixture.writes.filter(
      (write) =>
        write.path === `idempotencyKeys/purchase-${uid}-${operationId}`,
    ),
  ).toHaveLength(1);
  expect(fixture.writes).toHaveLength(3);
});

it("preserves the authenticated owner default when no cart exists", async () => {
  await api.purchaseCheckout.run(request(0));
  expect(fixture.rows.get(cartPath)).toMatchObject({
    ownerId: uid,
    revision: 1,
  });
  expect(fixture.writes).toHaveLength(3);
});
