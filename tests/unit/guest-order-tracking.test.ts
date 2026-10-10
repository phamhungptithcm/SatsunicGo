import { writeFileSync } from "node:fs";
import { it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  publicTrackingSchema,
  projectPublicTracking,
  guestTrackingQuery,
  useGuestTracking,
} from "../../packages/domain/public-order-tracking";
import { GuestOrderTracking } from "../../src/features/ask/GuestOrderTracking";
import { readGuestTracking } from "../../src/features/ask/guest-tracking-request";
const now = 1800000000000,
  code = "SGT-" + "a".repeat(64);
function fixture() {
  const window = {
    source: "staff",
    startAt: now + 1000,
    endAt: now + 2000,
    recordedAt: now - 100,
  };
  const parcels = [0, 1].map((i) => ({
    id: `p${i}`,
    version: 1,
    state: "in_transit",
    allocations: [{ orderId: "order", line: 0, quantity: 1 }],
    deliveryEstimate: { ...window },
  }));
  return {
    orderId: "order",
    order: {
      ownerId: "customer",
      stage: "IN_TRANSIT",
      items: [{ quantity: 2 }],
      phone: "PII_CANARY",
      address: "PII_CANARY",
      notes: "PII_CANARY",
    } as Record<string, unknown>,
    allocation: {
      parcelIds: parcels.map((p) => p.id),
      allocations: parcels.flatMap((p) => p.allocations),
    },
    parcels,
    projections: parcels.map((p) => ({
      ...p,
      ownerId: "customer",
      updatedAt: now - 100,
    })),
    timeline: [
      { action: "dispatch", createdAt: now - 100, actor: "PII_CANARY" },
    ],
    observedAt: now,
  };
}
it("reconstructs exact allowlist with complete ETA; canaries cannot leak", () => {
  const v = projectPublicTracking(fixture());
  expect(Object.keys(v).sort()).toEqual([
    "eta",
    "observedAt",
    "publicStatus",
    "updatedAt",
  ]);
  expect(v).toMatchObject({
    publicStatus: "shipping",
    updatedAt: now - 100,
    eta: { source: "staff", endAt: now + 2000 },
  });
  expect(JSON.stringify(v)).not.toContain("PII_CANARY");
});
it.each([
  "REQUESTED",
  "QUOTED",
  "QUOTE_ACCEPTED",
  "PURCHASING",
  "PURCHASED",
  "ORIGIN_RECEIVED",
  "PACKED",
  "READY_TO_SHIP",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
])("stage %s never exposes financial/PII details", (stage) => {
  const input = fixture();
  input.order.stage = stage;
  const v = projectPublicTracking(input);
  expect(JSON.stringify(v)).not.toMatch(
    /payment|balance|deposit|PII_CANARY|customer/,
  );
  if (stage !== "IN_TRANSIT") expect(v.eta).toBeNull();
});
it.each([
  "hold",
  "failed",
  "returned",
  "expired",
  "reversed",
  "future-recording",
  "missing",
  "stale-version",
  "foreign-owner",
  "duplicate",
  "overallocated",
  "future-parcel",
])("%s suppresses ETA", (scenario) => {
  const f = fixture();
  if (scenario === "hold") f.order.hold = "PII_CANARY";
  if (scenario === "failed" || scenario === "returned")
    f.parcels[0].state = scenario;
  if (scenario === "expired") f.parcels[0].deliveryEstimate.endAt = now - 1;
  if (scenario === "reversed")
    f.parcels[0].deliveryEstimate.startAt = now + 3000;
  if (scenario === "future-recording")
    f.parcels[0].deliveryEstimate.recordedAt = now + 1;
  if (scenario === "missing") f.projections.pop();
  if (scenario === "stale-version") f.projections[0].version++;
  if (scenario === "foreign-owner") f.projections[0].ownerId = "foreign";
  if (scenario === "duplicate") f.allocation.parcelIds[1] = "p0";
  if (scenario === "overallocated") f.parcels[0].allocations[0].quantity = 2;
  if (scenario === "future-parcel") f.projections[0].updatedAt = now + 1;
  expect(projectPublicTracking(f).eta).toBeNull();
});
it("one delivered parcel does not invent whole-order delivery", () => {
  const f = fixture();
  f.parcels[0].state = "delivered";
  f.projections[0].state = "delivered";
  expect(projectPublicTracking(f).publicStatus).toBe("shipping");
});
it("missing/future/financial history never invents milestone activity", () => {
  const f = fixture();
  f.timeline = [
    { action: "verifyTransfer", createdAt: now - 50, actor: "private" },
    { action: "dispatch", createdAt: now + 1, actor: "private" },
  ];
  expect(projectPublicTracking(f).updatedAt).toBeNull();
});
it.each(["vi", "en"] as const)(
  "%s public renderer has no private sections/deep link",
  (language) => {
    const text = renderToStaticMarkup(
      createElement(GuestOrderTracking, {
        tracking: projectPublicTracking(fixture()),
        language,
      }),
    );
    expect(text).not.toMatch(
      /PII_CANARY|href=|customer|p0|p1|Mã kiện|Shipping route|Lịch sử cập nhật/,
    );
    expect(text).toContain('aria-current="step"');
  },
);
it.each([
  { ownerId: "private" },
  {
    eta: {
      source: "carrier",
      startAt: now + 1,
      endAt: now + 2,
      recordedAt: now,
    },
  },
  { updatedAt: now + 1 },
  { publicStatus: "PACKED" },
])("rejects tampered public DTO", (delta) => {
  expect(
    publicTrackingSchema.safeParse({
      ...projectPublicTracking(fixture()),
      ...delta,
    }).success,
  ).toBe(false);
});
it("exact code, followup, multiple codes and mixed question stay in public path", () => {
  expect(guestTrackingQuery(`Đơn ${code} tới đâu?`, null)).toEqual({
    kind: "tracking",
    code,
    ambiguous: false,
  });
  expect(guestTrackingQuery("Khi nào giao?", code)).toEqual({
    kind: "tracking",
    code,
    ambiguous: false,
  });
  expect(
    guestTrackingQuery(`${code} SGT-${"b".repeat(64)}`, null),
  ).toMatchObject({ ambiguous: true });
  expect(
    guestTrackingQuery(`Show address ${code} and shipping fees`, null),
  ).toMatchObject({ kind: "tracking", code });
  expect(guestTrackingQuery("tìm áo thun", null)).toEqual({ kind: "none" });
});
it("malformed token suffix cannot silently turn into another valid code", () => {
  expect(guestTrackingQuery(code + "g", null)).toMatchObject({
    kind: "tracking",
    code: null,
  });
});
it("abort settles hanging SDK read immediately; late result cannot publish", async () => {
  const c = new AbortController();
  let resolve!: (v: unknown) => void;
  const promise = readGuestTracking(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
    c.signal,
  );
  c.abort(new Error("cancelled"));
  await expect(promise).rejects.toThrow("cancelled");
  resolve(projectPublicTracking(fixture()));
});
it("offline rejection can retry, pre-aborted never issues SDK read", async () => {
  await expect(
    readGuestTracking(
      () => Promise.reject(Error("offline")),
      new AbortController().signal,
    ),
  ).rejects.toThrow("offline");
  await expect(
    readGuestTracking(
      () => Promise.resolve(projectPublicTracking(fixture())),
      new AbortController().signal,
    ),
  ).resolves.toMatchObject({ publicStatus: "shipping" });
  const c = new AbortController();
  c.abort();
  let called = false;
  await expect(
    readGuestTracking(async () => {
      called = true;
      return {};
    }, c.signal),
  ).rejects.toBeDefined();
  expect(called).toBe(false);
});

it("keeps authenticated owner queries private, while guest requests need a code", () => {
  for (const text of [
    "tra đơn",
    "đơn của tôi đang ở đâu",
    "Đơn của tôi đang ở đâu?",
    "order status",
  ]) {
    const q = guestTrackingQuery(text, null);
    expect(q.kind).toBe("tracking");
    expect(useGuestTracking(q, true, true)).toBe(false);
    expect(useGuestTracking(q, false, true)).toBe(true);
  }
  expect(useGuestTracking(guestTrackingQuery(code, null), true, false)).toBe(
    true,
  );
  expect(
    useGuestTracking(guestTrackingQuery("khi nào giao", code), true, false),
  ).toBe(true);
  expect(
    useGuestTracking(
      guestTrackingQuery("áo giá bao nhiêu", null),
      false,
      false,
    ),
  ).toBe(false);
});

it("intercepts malformed guest markers even for signed-in users", () => {
  expect(
    useGuestTracking(
      guestTrackingQuery("SGT-invalid", null),
      true,
      false,
      true,
    ),
  ).toBe(true);
});
it("bounded maximum60-parcel50-event public projection remains minimal", () => {
  const f = fixture();
  const base = f.parcels[0];
  f.order.items = [{ quantity: 60, name: "PII_CANARY" }];
  f.parcels = Array.from({ length: 60 }, (_, i) => ({ ...base, id: `p${i}` }));
  f.projections = f.parcels.map((p) => ({
    ...p,
    ownerId: "customer",
    updatedAt: now - 100,
  }));
  f.allocation = {
    parcelIds: f.parcels.map((p) => p.id),
    allocations: f.parcels.flatMap((p) => p.allocations),
  };
  f.timeline = Array.from({ length: 50 }, (_, i) => ({
    action: "track",
    createdAt: now - i - 1,
    actor: "PII_CANARY",
  }));
  const samples: number[] = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    const v = projectPublicTracking(f);
    samples.push(performance.now() - start);
    expect(v.eta).not.toBeNull();
    expect(JSON.stringify(v)).not.toContain("PII_CANARY");
    expect(JSON.stringify(v).length).toBeLessThan(300);
  }
  samples.sort((a, b) => a - b);
  if (process.env.GUEST_TRACKING_BENCH_REPORT === "1")
    writeFileSync(
      "docs/reviews/ASK-GUEST-TRACKING-20261010/PERFORMANCE.json",
      JSON.stringify(
        {
          benchmark: "public60parcels50events",
          samples: 100,
          p50ms: samples[50],
          p95ms: samples[95],
          maxms: samples[99],
          environment: "local CPU only; not provider SLA",
        },
        null,
        2,
      ),
    );
});
