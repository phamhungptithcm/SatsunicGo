import { beforeEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
import type { Cart, CartItem } from "../../packages/domain/cart";

type Row = Record<string, unknown>;
type Ref = {
  path: string;
  collection: (name: string) => { doc: (id: string) => Ref };
};
type Write = { kind: "set" | "create"; path: string; data: Row };
const fixture = vi.hoisted(() => {
  const rows = new Map<string, Row>(),
    writes: Write[] = [];
  const ref = (path: string): Ref => ({
    path,
    collection: (name) => ({ doc: (id) => ref(`${path}/${name}/${id}`) }),
  });
  return {
    rows,
    writes,
    db: {
      doc: ref,
      async runTransaction(
        run: (tx: {
          get: (
            ref: Ref,
          ) => Promise<{ exists: boolean; data: () => Row | undefined }>;
          set: (ref: Ref, data: Row) => void;
          create: (ref: Ref, data: Row) => void;
        }) => Promise<unknown>,
      ) {
        // Snapshot reads and atomic staged writes model the retry needed when
        // simultaneous consumes race on their shared completion document.
        for (let attempt = 0; attempt < 5; attempt++) {
          const reads = new Map<string, string | undefined>(),
            staged: Write[] = [];
          const stage = (kind: Write["kind"], ref: Ref, data: Row) =>
            staged.push({ kind, path: ref.path, data: structuredClone(data) });
          const result = await run({
            get: async (ref) => {
              if (staged.length) throw Error("Read after transaction write");
              const value = structuredClone(rows.get(ref.path));
              reads.set(ref.path, JSON.stringify(value));
              return {
                exists: value !== undefined,
                data: () => structuredClone(value),
              };
            },
            set: (ref, data) => {
              stage("set", ref, data);
            },
            create: (ref, data) => {
              stage("create", ref, data);
            },
          });
          if (
            [...reads].some(
              ([path, value]) => JSON.stringify(rows.get(path)) !== value,
            )
          )
            continue;
          if (
            staged.some(
              (write) => write.kind === "create" && rows.has(write.path),
            )
          )
            throw Error("Create precondition failed");
          for (const write of staged)
            rows.set(write.path, structuredClone(write.data));
          writes.push(...staged);
          return result;
        }
        throw Error("Synthetic transaction retries exhausted");
      },
    },
  };
});
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => fixture.db }));
import { cartCommand } from "../../functions/src/cart";

const uid = "synthetic-cart-consume-owner",
  orderId = randomUUID(),
  lineId = randomUUID(),
  cartPath = `carts/${uid}`,
  orderPath = `orders/${orderId}`,
  completionPath = `${cartPath}/checkouts/${orderId}`;
const line: CartItem = {
  lineId,
  productId: "synthetic-product",
  variant: "Blue",
  quantity: 2,
};
const other: CartItem = {
  lineId: randomUUID(),
  productId: "synthetic-other",
  variant: "",
  quantity: 1,
};
const snapshot = {
  productId: line.productId,
  productVersion: 3,
  slug: "synthetic-product",
  title: "Synthetic catalog item",
  variant: line.variant,
  unitPrice: 100000,
  quantity: 2,
  total: 200000,
  termsVersion: "synthetic-terms",
};
function request(
  operationId = randomUUID(),
  overrides: Record<string, unknown> = {},
) {
  return {
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data: { action: "consume", operationId, orderId, lineId, ...overrides },
  } as CallableRequest;
}
function cart() {
  return fixture.rows.get(cartPath) as Cart;
}
beforeEach(() => {
  fixture.rows.clear();
  fixture.writes.length = 0;
  fixture.rows.set(cartPath, {
    ownerId: uid,
    revision: 7,
    updatedAt: 1,
    items: [line, other],
  });
  fixture.rows.set(orderPath, {
    ownerId: uid,
    purchaseKind: "catalog",
    catalogSnapshot: structuredClone(snapshot),
  });
});

it("consumes a rich server catalog snapshot and preserves unrelated choices with one atomic completion", async () => {
  const input = request(),
    orderBefore = structuredClone(fixture.rows.get(orderPath));
  const result = await cartCommand.run(input);
  expect(result).toMatchObject({ ownerId: uid, revision: 8, items: [other] });
  expect(result.updatedAt).toBeGreaterThan(1);
  expect(cart()).toEqual(result);
  expect(fixture.rows.get(orderPath)).toEqual(orderBefore);
  expect(fixture.writes.map((write) => [write.kind, write.path])).toEqual([
    ["set", cartPath],
    ["create", `idempotencyKeys/cart-${uid}-${input.data.operationId}`],
    ["create", completionPath],
  ]);
  expect(fixture.rows.get(completionPath)).toEqual({
    createdAt: result.updatedAt,
  });
});
it("subtracts the order quantity from the current increased cart without losing a later addition", async () => {
  fixture.rows.set(cartPath, {
    ...cart(),
    revision: 9,
    items: [{ ...line, quantity: 5 }, other],
  });
  expect(await cartCommand.run(request())).toMatchObject({
    revision: 10,
    items: [{ ...line, quantity: 3 }, other],
  });
});
it("concurrent different operations for the same order complete once after transactional retry", async () => {
  const results = await Promise.all([
    cartCommand.run(request()),
    cartCommand.run(request()),
  ]);
  expect(results[0]).toEqual(results[1]);
  expect(cart()).toMatchObject({ revision: 8, items: [other] });
  expect(fixture.writes).toHaveLength(3);
  expect(
    fixture.writes.filter((write) => write.path === completionPath),
  ).toHaveLength(1);
});
it("same-operation and fresh-operation replay return the current cart without consuming a re-added choice", async () => {
  const input = request();
  await cartCommand.run(input);
  const current = {
    ...cart(),
    revision: 9,
    items: [{ ...line, lineId: randomUUID(), quantity: 5 }, other],
  };
  fixture.rows.set(cartPath, structuredClone(current));
  expect(await cartCommand.run(input)).toEqual(current);
  expect(await cartCommand.run(request())).toEqual(current);
  expect(fixture.writes).toHaveLength(3);
});
it("a changed payload cannot reuse a consumed operation ID", async () => {
  const input = request();
  await cartCommand.run(input);
  await expect(
    cartCommand.run(request(input.data.operationId, { lineId: randomUUID() })),
  ).rejects.toMatchObject({ code: "already-exists" });
  expect(fixture.writes).toHaveLength(3);
});

it.each([
  ["product mismatch", { ...line, productId: "synthetic-new-product" }],
  ["variant mismatch", { ...line, variant: "White" }],
  ["reduced quantity", { ...line, quantity: 1 }],
  ["removed and re-added line", { ...line, lineId: randomUUID() }],
] as const)(
  "preserves the current choice after %s while fencing the completed order",
  async (_name, currentLine) => {
    const items = [currentLine, other];
    fixture.rows.set(cartPath, { ...cart(), items: structuredClone(items) });
    expect(await cartCommand.run(request())).toMatchObject({
      revision: 8,
      items,
    });
    expect(fixture.rows.has(completionPath)).toBe(true);
  },
);
it.each([
  { productId: "../invalid" },
  { productId: "a".repeat(81) },
  { quantity: 0 },
  { quantity: 1.5 },
  { quantity: 101 },
  { quantity: "2" },
  { quantity: undefined },
  { variant: "a".repeat(201) },
])(
  "rejects invalid selected snapshot values without any write: %j",
  async (invalid) => {
    fixture.rows.set(orderPath, {
      ownerId: uid,
      purchaseKind: "catalog",
      catalogSnapshot: { ...snapshot, ...invalid },
    });
    const before = structuredClone(cart());
    await expect(cartCommand.run(request())).rejects.toMatchObject({
      code: "failed-precondition",
      message: "Thông tin đơn chưa đủ để cập nhật giỏ.",
    });
    expect(fixture.writes).toEqual([]);
    expect(cart()).toEqual(before);
    expect(fixture.rows.has(completionPath)).toBe(false);
  },
);
it.each([
  ["missing order", undefined],
  [
    "foreign order",
    {
      ownerId: "synthetic-foreign-owner",
      purchaseKind: "catalog",
      catalogSnapshot: snapshot,
    },
  ],
  [
    "custom order",
    { ownerId: uid, purchaseKind: "custom", catalogSnapshot: snapshot },
  ],
  ["missing snapshot", { ownerId: uid, purchaseKind: "catalog" }],
] as const)("denies %s before any writes", async (_name, order) => {
  if (order) fixture.rows.set(orderPath, structuredClone(order));
  else fixture.rows.delete(orderPath);
  await expect(cartCommand.run(request())).rejects.toMatchObject({
    code: "permission-denied",
  });
  expect(fixture.writes).toEqual([]);
});
it("denies a foreign stored cart before consuming an otherwise own order", async () => {
  fixture.rows.set(cartPath, { ...cart(), ownerId: "synthetic-foreign-owner" });
  await expect(cartCommand.run(request())).rejects.toMatchObject({
    code: "permission-denied",
  });
  expect(fixture.writes).toEqual([]);
});
it.each(["users", "staffAccess"])(
  "retains the locked %s authorization fence",
  async (collection) => {
    fixture.rows.set(`${collection}/${uid}`, { locked: true });
    await expect(cartCommand.run(request())).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(fixture.writes).toEqual([]);
  },
);
it("retains the paired custom-kind refinement on the stored cart", async () => {
  fixture.rows.set(cartPath, {
    ...cart(),
    items: [{ ...line, kind: "custom" }],
  });
  await expect(cartCommand.run(request())).rejects.toMatchObject({
    code: "failed-precondition",
    message: "Giỏ đã lưu chưa đọc được. Liên hệ hỗ trợ để kiểm tra.",
  });
  expect(fixture.writes).toEqual([]);
});
it("retains pending-checkout blocking before reconciliation", async () => {
  fixture.rows.set(cartPath, { ...cart(), activeCheckoutId: randomUUID() });
  await expect(cartCommand.run(request())).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(fixture.writes).toEqual([]);
});
