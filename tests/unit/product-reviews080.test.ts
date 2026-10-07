import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ProductDetails } from "../../src/features/content/ProductDetail";
vi.mock("../../src/shared/firebase", () => ({
  app: null,
  db: null,
  auth: null,
  callService: vi.fn(),
  login: vi.fn(),
}));
import type { Firestore } from "firebase-admin/firestore";
import {
  purchaseEligibility,
  reviewDraftSchema,
  reviewWriteSchema,
  ratingSummary,
  updateRating,
  publicReview,
} from "../../packages/domain/product-reviews";
import {
  productInformationSchema,
  productSourceUrl,
  usageLines,
} from "../../packages/domain/product-information";
import {
  readProductReviews,
  readProductEligibility,
  writeProductReview,
  moderateProductReview,
  adminProductReviews,
  productReviewId,
} from "../../functions/src/product-reviews";
const uid = "buyer-a",
  pid = "product-1",
  oid = "order-1",
  staff = "editor-a",
  now = 1800000000000;
const draft = {
  rating: 1,
  name: "Khách thử",
  text: "Cập nhật đơn chưa kịp thời.",
};
function fixture() {
  const order = {
    ownerId: uid,
    purchaseKind: "catalog",
    stage: "DELIVERED",
    acceptedAt: now - 100000,
    finalTotal: 200000,
    collected: 200000,
    refunded: 0,
    catalogSnapshot: {
      productId: pid,
      variant: "500 viên",
      quantity: 2,
      total: 200000,
    },
    items: [{ quantity: 2 }],
  };
  const parcel = {
    id: "parcel-1",
    version: 2,
    state: "delivered",
    allocations: [{ orderId: oid, line: 0, quantity: 1 }],
  };
  const allocation = {
    parcelIds: [parcel.id],
    allocations: parcel.allocations,
  };
  const projection = { ...parcel, ownerId: uid };
  const data = new Map<string, Record<string, unknown>>([
    [`users/${uid}`, { locked: false }],
    [`users/${staff}`, { locked: false }],
    [`staffAccess/${staff}`, { active: true, roles: ["CONTENT_EDITOR"] }],
    [`products/${pid}`, { status: "published", title: "Sản phẩm thử" }],
    [`orders/${oid}`, order],
    [`packages/${parcel.id}`, parcel],
    [`customerShipments/${uid}-${parcel.id}`, projection],
    [`packageAllocations/${oid}`, allocation],
  ]);
  const field = (
    v: Record<string, unknown> | undefined,
    key: string,
  ): unknown =>
    key
      .split(".")
      .reduce<unknown>(
        (x, k) =>
          x && typeof x === "object"
            ? (x as Record<string, unknown>)[k]
            : undefined,
        v,
      );
  let serial = 0,
    chain = Promise.resolve();
  const snap = (path: string) => ({
    id: path.split("/").at(-1)!,
    exists: data.has(path),
    data: () => data.get(path),
    get: (key: string) => field(data.get(path), key),
  });
  type Query = {
    path: string;
    filters: [string, unknown][];
    after: string;
    cap: number;
  };
  const query = (
    path: string,
    filters: [string, unknown][] = [],
    after = "",
    cap = 21,
  ): unknown => ({
    path,
    filters,
    after,
    cap,
    where: (key: string, _: string, v: unknown) =>
      query(path, [...filters, [key, v]], after, cap),
    orderBy: () => query(path, filters, after, cap),
    startAfter: (v: string) => query(path, filters, v, cap),
    limit: (n: number) => query(path, filters, after, n),
    doc: () => ({ path: `${path}/auto-${++serial}` }),
  });
  const db = {
    doc: (path: string) => ({ path }),
    collection: (path: string) => query(path),
    runTransaction: (fn: (tx: unknown) => Promise<unknown>) => {
      const run = chain.then(async () => {
        let writing = false;
        const writes: (() => void)[] = [];
        const tx = {
          get: async (r: { path: string } & Partial<Query>) => {
            if (writing) throw Error("READ_AFTER_WRITE");
            if (r.filters) {
              const docs = [...data.keys()]
                .filter(
                  (p) =>
                    p.startsWith(r.path + "/") &&
                    p.split("/").length === r.path.split("/").length + 1,
                )
                .sort()
                .filter(
                  (p) =>
                    p.split("/").at(-1)! > (r.after ?? "") &&
                    r.filters!.every(([k, v]) => field(data.get(p), k) === v),
                )
                .slice(0, r.cap)
                .map(snap);
              return { docs, size: docs.length };
            }
            return snap(r.path);
          },
          set: (r: { path: string }, v: Record<string, unknown>) => {
            writing = true;
            writes.push(() => data.set(r.path, structuredClone(v)));
          },
          create: (r: { path: string }, v: Record<string, unknown>) => {
            writing = true;
            if (data.has(r.path)) throw Error("DUPLICATE");
            writes.push(() => data.set(r.path, structuredClone(v)));
          },
          delete: (r: { path: string }) => {
            writing = true;
            writes.push(() => data.delete(r.path));
          },
        };
        const result = await fn(tx);
        writes.forEach((w) => w());
        return result;
      });
      chain = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  } as unknown as Firestore;
  return {
    data,
    db,
    order,
    parcel,
    projection,
    allocation,
    input: {
      uid,
      productId: pid,
      orderId: oid,
      order,
      allocation,
      parcels: [parcel],
      projections: [projection],
    },
  };
}
const submit = (version = 0, operationId = "submit-1", rating = 1) => ({
  action: "submit",
  productId: pid,
  orderId: oid,
  operationId,
  expectedVersion: version,
  draft: { ...draft, rating },
});
const mod = (
  version = 1,
  operationId = "mod-1",
  action = "approve",
  reason = "",
) => ({
  id: productReviewId(uid, pid),
  expectedVersion: version,
  operationId,
  action,
  reason,
});
describe("product080 provenance and input", () => {
  it("distinguishes origin, market and retailer and legacy dosage is never split", () => {
    expect(
      productInformationSchema.parse({
        retailer: "Costco",
        usageSteps: ["Đọc nhãn"],
      }).retailer,
    ).toBe("Costco");
    expect(usageLines({ usage: "Một đoạn\nliều dùng nguyên văn" })).toEqual([
      "Một đoạn\nliều dùng nguyên văn",
    ]);
    expect(usageLines({ usageSteps: [], usage: "Nhãn cũ" })).toEqual([
      "Nhãn cũ",
    ]);
  });
  it.each([
    "javascript:alert(1)",
    "https://user:pass@example.com",
    "data:text/html,hi",
  ])("reject unsafe source %s", (url) =>
    expect(productSourceUrl.safeParse(url).success).toBe(false),
  );
  it.each([0, 6, 1.5, NaN, Infinity])("reject rating %s", (rating) =>
    expect(reviewDraftSchema.safeParse({ ...draft, rating }).success).toBe(
      false,
    ),
  );
  it("limits instructions and comments, disallows client badge/owner claims", () => {
    expect(
      productInformationSchema.safeParse({
        usageSteps: Array(21).fill("Một dòng"),
      }).success,
    ).toBe(false);
    expect(
      reviewDraftSchema.safeParse({ ...draft, text: " ".repeat(15) }).success,
    ).toBe(false);
    expect(
      reviewDraftSchema.safeParse({ ...draft, text: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(
      reviewWriteSchema.safeParse({
        ...submit(),
        uid: "victim",
        verifiedPurchase: true,
      }).success,
    ).toBe(false);
  });
  it("public DTO removes identifiers and proof", () => {
    const p = publicReview({
      ...draft,
      id: "review-1",
      productId: pid,
      variant: "",
      verifiedPurchase: true,
      publishedAt: now,
      uid: "secret",
      orderId: oid,
      email: "private",
    } as never);
    expect(p).not.toHaveProperty("uid");
    expect(p).not.toHaveProperty("orderId");
    expect(p).not.toHaveProperty("email");
  });
});
describe("product080 actual purchase authority", () => {
  it("allows one delivered unit from correct catalog identity", () =>
    expect(purchaseEligibility(fixture().input)).toBe("eligible"));
  it.each([
    "owner",
    "product",
    "unpaid",
    "custom",
    "missing",
    "projection",
    "version",
    "line",
    "quantity",
    "duplicate",
  ])("rejects/unknown %s evidence", (kind) => {
    const f = fixture();
    if (kind === "owner") f.order.ownerId = "buyer-b";
    if (kind === "product") f.order.catalogSnapshot.productId = "product-other";
    if (kind === "unpaid") f.order.collected = 0;
    if (kind === "custom") f.order.purchaseKind = "custom";
    if (kind === "missing") f.input.parcels = [];
    if (kind === "projection") f.projection.ownerId = "buyer-b";
    if (kind === "version") f.projection.version = 3;
    if (kind === "line") f.parcel.allocations[0].line = 1;
    if (kind === "quantity") f.parcel.allocations[0].quantity = 3;
    if (kind === "duplicate") f.allocation.parcelIds.push("parcel-1");
    expect(purchaseEligibility(f.input)).toBe("unknown");
  });
  it("in transit is not delivered; cancelled is not eligible", () => {
    const f = fixture();
    f.parcel.state = "in_transit";
    f.projection.state = "in_transit";
    expect(purchaseEligibility(f.input)).toBe("not_received");
    f.order.stage = "CANCELLED";
    expect(purchaseEligibility(f.input)).toBe("unknown");
  });
});
describe("product080 transaction lifecycle", () => {
  it("pending invisible then legitimate one-star approval counted", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    expect(
      (await readProductReviews(f.db, { productId: pid }, uid)).items,
    ).toHaveLength(0);
    await moderateProductReview(f.db, staff, mod(), now);
    const p = await readProductReviews(f.db, { productId: pid }, uid);
    expect(p.summary?.average).toBe(1);
    expect(p.items[0].rating).toBe(1);
    expect(p.items[0]).not.toHaveProperty("uid");
  });
  it("same operation retry exactly once, changed replay refused", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await writeProductReview(f.db, uid, submit(), now);
    expect(
      f.data.get(`productReviews/${productReviewId(uid, pid)}`)?.version,
    ).toBe(1);
    await expect(
      writeProductReview(f.db, uid, submit(0, "submit-1", 5), now),
    ).rejects.toMatchObject({ code: "already-exists" });
  });
  it("moderation replay cannot double count", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    expect(f.data.get(`productRatingSummaries/${pid}`)?.count).toBe(1);
  });
  it("two tabs stale version cannot replace current pending", async () => {
    const f = fixture();
    const r = await Promise.allSettled([
      writeProductReview(f.db, uid, submit(0, "tab-a"), now),
      writeProductReview(f.db, uid, submit(0, "tab-b", 5), now),
    ]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(r.filter((x) => x.status === "rejected")).toHaveLength(1);
  });
  it("pending edits retain published revision then replace rating exactly", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    await writeProductReview(f.db, uid, submit(2, "edit-1", 5), now + 31000);
    expect(
      (await readProductReviews(f.db, { productId: pid })).items[0].rating,
    ).toBe(1);
    await expect(
      moderateProductReview(f.db, staff, mod(2, "stale-approve"), now),
    ).rejects.toMatchObject({ code: "aborted" });
    await moderateProductReview(
      f.db,
      staff,
      mod(3, "edit-approve"),
      now + 31000,
    );
    expect(
      (await readProductReviews(f.db, { productId: pid })).summary?.average,
    ).toBe(5);
    expect(f.data.get(`productRatingSummaries/${pid}`)?.count).toBe(1);
  });
  it("reject edit keeps earlier approval and requires reason", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    await writeProductReview(f.db, uid, submit(2, "edit-1", 5), now + 31000);
    await expect(
      moderateProductReview(f.db, staff, mod(3, "reject-1", "reject"), now),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    await moderateProductReview(
      f.db,
      staff,
      mod(3, "reject-2", "reject", "Thông tin riêng tư"),
      now,
    );
    expect(
      (await readProductReviews(f.db, { productId: pid })).items[0].rating,
    ).toBe(1);
  });
  it("withdraw removes vote once and preserves purchase audit", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    const w = {
      action: "withdraw",
      productId: pid,
      expectedVersion: 2,
      operationId: "withdraw-1",
    };
    await writeProductReview(f.db, uid, w, now);
    await writeProductReview(f.db, uid, w, now);
    const p = await readProductReviews(f.db, { productId: pid }, uid);
    expect(p.items).toHaveLength(0);
    expect(p.summary).toMatchObject({ count: 0, average: null });
    expect(
      (await readProductEligibility(f.db, uid, { productId: pid })).state,
    ).toBe("eligible");
  });
  it("postdelivery refund does not suppress bad review or remove editing eligibility", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    f.data.set(`orders/${oid}`, { ...f.order, collected: 0, refunded: 200000 });
    expect(
      (await readProductReviews(f.db, { productId: pid })).items[0].rating,
    ).toBe(1);
    await writeProductReview(f.db, uid, submit(2, "afterrefund"), now + 31000);
  });
  it("staff reply neither rewrites customer nor increments votes", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    await moderateProductReview(
      f.db,
      staff,
      mod(2, "reply-1", "reply", "Em sẽ kiểm tra đơn giúp anh/chị."),
      now,
    );
    const p = await readProductReviews(f.db, { productId: pid });
    expect(p.items[0].text).toBe(draft.text);
    expect(p.items[0].reply).toContain("Em sẽ");
    expect(p.summary?.count).toBe(1);
  });
  it("hide removes public revision and aggregate, staff action audited", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    await moderateProductReview(
      f.db,
      staff,
      mod(2, "hide-1", "hide", "Thông tin cá nhân"),
      now,
    );
    expect(
      (await readProductReviews(f.db, { productId: pid })).items,
    ).toHaveLength(0);
    expect(
      [...f.data.keys()].some((x) => x.startsWith("productReviewAudit/")),
    ).toBe(true);
  });
  it("revoked/locked staff cannot replay privileged approval", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    f.data.set(`staffAccess/${staff}`, { active: false, roles: ["OWNER"] });
    await expect(
      moderateProductReview(f.db, staff, mod(), now),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it("locked buyer cannot write/replay/read private draft", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    f.data.set(`users/${uid}`, { locked: true });
    await expect(
      writeProductReview(f.db, uid, submit(), now),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      readProductReviews(f.db, { productId: pid }, uid),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it("order owner guessing and fake transfer cannot grant review", async () => {
    const f = fixture();
    f.data.set("users/buyer-b", { locked: false });
    await expect(
      writeProductReview(f.db, "buyer-b", submit(), now),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    f.order.collected = 0;
    await expect(
      writeProductReview(f.db, uid, submit(), now),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
  it("product archived blocks reads and writes but permits withdrawal", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    f.data.set(`products/${pid}`, { status: "archived" });
    await expect(
      readProductReviews(f.db, { productId: pid }),
    ).rejects.toMatchObject({ code: "not-found" });
    await writeProductReview(
      f.db,
      uid,
      {
        action: "withdraw",
        productId: pid,
        operationId: "withdraw",
        expectedVersion: 1,
      },
      now,
    );
  });
  it("corrupt summary is unavailable and never silently reset", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    f.data.set(`productRatingSummaries/${pid}`, {
      count: 5,
      sum: 1,
      histogram: [1, 0, 0, 0, 0],
    });
    await expect(
      moderateProductReview(f.db, staff, mod(), now),
    ).rejects.toThrow();
    expect(
      (await readProductReviews(f.db, { productId: pid })).summary,
    ).toBeNull();
    expect(
      f.data.get(`productReviews/${productReviewId(uid, pid)}`)?.status,
    ).toBe("pending");
  });
  it("rate limits edits but allows withdraw", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await expect(
      writeProductReview(f.db, uid, submit(1, "edit-rapid"), now + 1000),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
    await writeProductReview(
      f.db,
      uid,
      {
        action: "withdraw",
        productId: pid,
        expectedVersion: 1,
        operationId: "withdraw",
      },
      now + 1000,
    );
  });
  it("bounded pages private eligibility/admin no customer proof leakage", async () => {
    const f = fixture();
    for (let i = 0; i < 25; i++)
      f.data.set(`orders/order-${String(i + 2).padStart(2, "0")}`, {
        ...f.order,
      });
    const e = await readProductEligibility(f.db, uid, { productId: pid });
    expect(e.orders).toHaveLength(20);
    expect(e.next).not.toBeNull();
    await writeProductReview(f.db, uid, submit(), now);
    const a = await adminProductReviews(f.db, staff, {});
    expect(a.items[0]).not.toHaveProperty("orderId");
    expect(a.items[0]).not.toHaveProperty("uid");
    await expect(adminProductReviews(f.db, uid, {})).rejects.toMatchObject({
      code: "permission-denied",
    });
  });
  it("summary replacement conserves histogram and rejects negative/corrupt vote", () => {
    expect(
      updateRating({ count: 1, sum: 1, histogram: [1, 0, 0, 0, 0] }, 1, 5),
    ).toEqual({ count: 1, sum: 5, histogram: [0, 0, 0, 0, 1] });
    expect(() =>
      updateRating({ count: 0, sum: 0, histogram: [0, 0, 0, 0, 0] }, 1),
    ).toThrow();
    expect(() =>
      ratingSummary({ count: 0, sum: 5, histogram: [0, 0, 0, 0, 0] }),
    ).toThrow();
  });
});

describe("product080 review cycle counter corruption regressions", () => {
  it("missing summary with another published vote cannot restart at zero", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    f.data.set(`products/${pid}/reviewPublic/other`, {
      ...draft,
      id: "other",
      productId: pid,
      variant: "",
      verifiedPurchase: true,
      publishedAt: now,
    });
    await expect(
      moderateProductReview(f.db, staff, mod(), now),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(
      (await readProductReviews(f.db, { productId: pid, after: "zzzz" }))
        .summary,
    ).toBeNull();
  });
  it("mismatched published revision blocks withdrawal and rating replacement", async () => {
    const f = fixture();
    await writeProductReview(f.db, uid, submit(), now);
    await moderateProductReview(f.db, staff, mod(), now);
    const path = `products/${pid}/reviewPublic/${productReviewId(uid, pid)}`;
    f.data.set(path, { ...f.data.get(path), rating: 5 });
    await expect(
      writeProductReview(
        f.db,
        uid,
        {
          action: "withdraw",
          productId: pid,
          expectedVersion: 2,
          operationId: "withdraw-bad",
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await writeProductReview(
      f.db,
      uid,
      submit(2, "edit-mismatch", 3),
      now + 31000,
    );
    await expect(
      moderateProductReview(f.db, staff, mod(3, "approve-mismatch"), now),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
  it("invalid zero summary with public votes is unavailable", async () => {
    const f = fixture();
    f.data.set(`products/${pid}/reviewPublic/other`, {
      ...draft,
      id: "other",
      productId: pid,
      variant: "",
      verifiedPurchase: true,
      publishedAt: now,
    });
    f.data.set(`productRatingSummaries/${pid}`, {
      count: 0,
      sum: 0,
      histogram: [0, 0, 0, 0, 0],
    });
    expect(
      (await readProductReviews(f.db, { productId: pid })).summary,
    ).toBeNull();
  });
  it("inconsistent pre-shipping stage cannot be treated as delivered", () => {
    const f = fixture();
    f.order.stage = "PURCHASED";
    expect(purchaseEligibility(f.input)).toBe("unknown");
  });
});

describe("product detail content semantics without a browser or listener", () => {
  const row = {
    id: "product-1",
    title: "Fixture",
    slug: "fixture",
    body: "",
    status: "published",
    version: 1,
  };
  const render = (
    extra: Partial<import("../../src/shared/public-content").ContentRow>,
  ) =>
    renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(ProductDetails, { row: { ...row, ...extra } }),
      ),
    );
  it("omits empty detail heading and region instead of inventing description", () => {
    const html = render({ body: "  ", origin: " ", functions: "" });
    expect(html).not.toContain("Chi tiết sản phẩm");
    expect(html).not.toContain("sgProductInformation");
  });
  it("retains actual product description", () => {
    const html = render({ body: "Thông tin được hãng cung cấp." });
    expect(html).toContain("Chi tiết sản phẩm");
    expect(html).toContain("Thông tin được hãng cung cấp.");
  });
  it("retains instructions when general description is absent", () => {
    const html = render({ usageSteps: ["Đọc hướng dẫn trên nhãn."] });
    expect(html).not.toContain("Chi tiết sản phẩm");
    expect(html).toContain("Hướng dẫn sử dụng");
    expect(html).toContain("<li>Đọc hướng dẫn trên nhãn.</li>");
  });
  it("missing retailer and manufacturing source never imply active verification", () => {
    const html = render({});
    expect(html.match(/Chưa xác minh/g)).toHaveLength(2);
    expect(html).not.toContain("Đang xác minh");
  });
});
