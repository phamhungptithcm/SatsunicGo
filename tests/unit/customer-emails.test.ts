import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  customerEmailCatalog,
  parseCustomerEvent,
  customerEmailEligible,
  customerEventTarget,
  type CustomerTemplateId,
} from "../../packages/domain/customer-notification";
import { renderCustomerEmail } from "../../functions/src/email-content";
import {
  customerEvent,
  customerSnapshotHash,
  customerEventFields,
  orderCustomerEvent,
  parcelCustomerEvent,
} from "../../functions/src/customer-notification-events";
import { prepareCustomerEmail as prepareCustomerEmailRaw } from "../../functions/src/customer-email-job";
import { projectCustomerNotification } from "../../functions/src/customer-notification-delivery";
import type { Firestore } from "firebase-admin/firestore";
import { emptyNotificationPreferences } from "../../packages/domain/notification-preferences";
const confirmedPreference = emptyNotificationPreferences(
  "fixture@example.invalid",
);
confirmedPreference.topics.orderEmail = {
  requested: true,
  generation: 1,
  confirmedGeneration: 1,
};
const prepareCustomerEmail = (
  db: Firestore,
  job: Record<string, unknown>,
  now: number,
) => prepareCustomerEmailRaw(db, job, now, "fixture@example.invalid");
import type { Order } from "../../packages/domain";
import type { Parcel } from "../../packages/domain/shipping";
const fixture = JSON.parse(
  readFileSync(
    "docs/reviews/CUSTOMER-EMAILS-20261009/PREVIEW-FIXTURES.json",
    "utf8",
  ),
);
const money = new Set([
  "quotedTotal",
  "paidAmount",
  "differenceAmount",
  "previousTotal",
  "proposedTotal",
  "balanceDue",
  "finalTotal",
  "netPaid",
  "zeroAmount",
  "excessAmount",
  "refundAmount",
]);
const dates = new Set(["observedAt", "refundRecordedAt", "endsAt"]);
export function exampleEvent(id: CustomerTemplateId) {
  const common = { ...fixture.common, ...fixture.overrides[id] };
  const payload = Object.fromEntries(
    customerEmailCatalog[id].fields.map((field) => [
      field,
      money.has(field)
        ? Number(common[field].replace(/[^0-9]/g, ""))
        : dates.has(field)
          ? 1791554400000
          : field === "paymentScope"
            ? "custom_initial"
            : common[field],
    ]),
  );
  return parseCustomerEvent({
    schemaVersion: 1,
    templateVersion: 2,
    templateId: id,
    ownerId: "owner",
    entityId: "entity",
    entityVersion: 2,
    eventId: "event",
    occurredAt: 1791554400000,
    orderId: "order",
    payload,
  });
}
describe("approved customer email catalog", () => {
  it.each(Object.keys(customerEmailCatalog) as CustomerTemplateId[])(
    "renders %s as concise safe HTML and matching plain text",
    (id) => {
      const event = exampleEvent(id),
        output = renderCustomerEmail(event);
      expect(output.html).toContain(customerEmailCatalog[id].heading);
      expect(output.text).toContain(customerEmailCatalog[id].heading);
      expect(output.html).not.toMatch(/\{\{|<script|<iframe|<form|<img/i);
      expect(output.subject).not.toMatch(/[\r\n]/);
      expect(Buffer.byteLength(output.html)).toBeLessThan(50000);
      const links = [...output.html.matchAll(/href="([^"]+)"/g)].map(
        (m) => new URL(m[1]),
      );
      expect(
        links.every((url) => url.origin === "https://satsunicgo.web.app"),
      ).toBe(true);
      expect(output.text).toContain(
        "https://satsunicgo.web.app" + customerEventTarget(event),
      );
      for (const value of Object.values(event.payload))
        if (typeof value === "number" && value < 1e12)
          expect(output.text).toContain(
            new Intl.NumberFormat("vi-VN").format(value) + " ₫",
          );
    },
  );
  it("keeps all 42 approved layouts byte-identical to the reviewed authoring templates", () => {
    expect(Object.keys(customerEmailCatalog)).toHaveLength(42);
    for (const [id, row] of Object.entries(customerEmailCatalog)) {
      expect(row.html.replace(";overflow-wrap:anywhere", "")).toBe(
        readFileSync(
          `docs/reviews/CUSTOMER-EMAILS-20261009/templates/${id}.html`,
          "utf8",
        ),
      );
      expect(row.text).toBe(
        readFileSync(
          `docs/reviews/CUSTOMER-EMAILS-20261009/templates/${id}.txt`,
          "utf8",
        ),
      );
    }
  });
  it("escapes hostile text, rejects header controls and never accepts a supplied CTA", () => {
    const event = exampleEvent("price_change_proposed");
    const hostile = {
      ...event,
      payload: {
        ...event.payload,
        customerReason: '<img src=x onerror="alert(1)">&',
      },
    };
    const out = renderCustomerEmail(hostile);
    expect(out.html).toContain("&lt;img");
    expect(out.html).not.toContain("<img");
    expect(out.text).toContain("<img");
    expect(() =>
      renderCustomerEmail({
        ...hostile,
        payload: { ...hostile.payload, orderRef: "x\r\nBcc: stolen" },
      }),
    ).toThrow();
    expect(() =>
      renderCustomerEmail({ ...event, ctaUrl: "https://evil.invalid" }),
    ).toThrow();
  });
  it.each([null, undefined, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "0"])(
    "rejects unknown/invalid money %s instead of showing zero",
    (amount) => {
      const event = exampleEvent("payment_confirmed");
      expect(() =>
        renderCustomerEmail({
          ...event,
          payload: { ...event.payload, paidAmount: amount },
        }),
      ).toThrow();
    },
  );
  it("rejects missing fields, new versions, excessive text and arbitrary payment promises", () => {
    const event = exampleEvent("payment_confirmed");
    expect(() =>
      parseCustomerEvent({ ...event, templateVersion: 3 }),
    ).toThrow();
    expect(() =>
      parseCustomerEvent({ ...event, payload: { paidAmount: 10 } }),
    ).toThrow();
    expect(() =>
      parseCustomerEvent({
        ...event,
        payload: { ...event.payload, orderRef: "x".repeat(1001) },
      }),
    ).toThrow();
    expect(() =>
      parseCustomerEvent({
        ...event,
        payload: { ...event.payload, paymentScope: "Đã mua hàng xong" },
      }),
    ).toThrow();
  });
  it("keeps conditional/unread/receipt/progress policy closed without evidence", () => {
    for (const id of [
      "order_reply",
      "support_reply",
      "delivery_estimate_changed",
      "order_hold",
      "financial_adjustment",
      "receipt_ready",
      "purchase_completed",
      "payment_failed",
    ] as const)
      expect(customerEmailEligible(exampleEvent(id))).toBe(false);
    expect(customerEmailEligible(exampleEvent("payment_confirmed"))).toBe(true);
  });
  it("hashes persisted snapshots independently of Firestore field ordering", () => {
    const event = exampleEvent("payment_confirmed"),
      reordered = Object.fromEntries(Object.entries(event).reverse());
    reordered.payload = Object.fromEntries(
      Object.entries(event.payload).reverse(),
    );
    expect(customerSnapshotHash(parseCustomerEvent(reordered))).toBe(
      customerSnapshotHash(event),
    );
    expect(customerSnapshotHash({ ...event, entityVersion: 3 })).not.toBe(
      customerSnapshotHash(event),
    );
  });
});
const order: Order = {
  id: "order",
  ownerId: "owner",
  market: "JP",
  notes: "private operational detail",
  stage: "PACKED",
  version: 2,
  createdAt: 1,
  collected: 1000,
  refunded: 100,
  finalTotal: 1200,
  finalApproved: true,
  items: [
    { name: "Áo", variant: "M", quantity: 2, url: "https://example.com" },
  ],
};
it("uses net collections, blocks reserved final balance and preserves refund-recorded semantics", () => {
  const due = orderCustomerEvent("approveFinal", order, 100);
  expect(due?.payload).toEqual({
    orderRef: "order",
    finalTotal: 1200,
    netPaid: 900,
    balanceDue: 300,
  });
  expect(
    orderCustomerEvent("approveFinal", { ...order, refundReserved: 200 }, 100),
  ).toBeNull();
  expect(
    orderCustomerEvent("approveFinal", { ...order, finalApproved: false }, 100),
  ).toBeNull();
  expect(
    orderCustomerEvent("approveFinal", { ...order, finalTotal: 900 }, 100)
      ?.templateId,
  ).toBe("final_no_balance");
  expect(
    orderCustomerEvent("approveFinal", { ...order, finalTotal: 800 }, 100)
      ?.templateId,
  ).toBe("excess_payment_review");
  const refund = orderCustomerEvent("refund", order, 100, 100)!;
  expect(renderCustomerEmail(refund).text).not.toContain("ngân hàng đã ghi có");
  expect(orderCustomerEvent("claimPurchase", order, 100)).toBeNull();
});
it("projects only the recipient's parcel allocations and distinguishes partial/full delivery", () => {
  const parcel: Parcel = {
    id: "parcel",
    version: 2,
    state: "delivered",
    route: "JP-VN",
    warehouse: "JP",
    weightGrams: 10,
    allocations: [
      { orderId: "order", line: 0, quantity: 1 },
      { orderId: "other", line: 0, quantity: 1 },
    ],
  };
  const others: Order = {
    ...order,
    id: "other",
    ownerId: "other-owner",
    items: [
      {
        name: "PRIVATE OTHER ITEM",
        variant: "M",
        quantity: 1,
        url: "https://example.com",
      },
    ],
  };
  const event = parcelCustomerEvent(
    parcel,
    [order, others],
    "owner",
    "trackParcel",
    100,
  )!;
  expect(event.templateId).toBe("parcel_delivered_partial");
  expect(JSON.stringify(event)).not.toContain("PRIVATE OTHER");
  expect(
    parcelCustomerEvent(
      parcel,
      [{ ...order, stage: "DELIVERED" }, others],
      "owner",
      "trackParcel",
      100,
    )?.templateId,
  ).toBe("order_delivered");
  expect(
    parcelCustomerEvent(
      parcel,
      [order, others],
      "missing-owner",
      "trackParcel",
      100,
    ),
  ).toBeNull();
});
it("stable business keys do not depend on retry timestamp", () => {
  const a = customerEvent(
    "request_received",
    { ownerId: "owner", entityId: "order", entityVersion: 2, occurredAt: 100 },
    { orderRef: "order" },
  );
  const b = customerEvent(
    "request_received",
    { ownerId: "owner", entityId: "order", entityVersion: 2, occurredAt: 101 },
    { orderRef: "order" },
  );
  expect(a.eventId).toBe(b.eventId);
});
function fakeDb(records: Record<string, unknown>) {
  records = {
    "notificationPreferences/owner": confirmedPreference,
    ...records,
  };
  return {
    doc: (path: string) => ({
      get: async () => ({ data: () => records[path] }),
    }),
  } as unknown as Firestore;
}
it("requires cutover and authoritative owner; suppresses renewed membership and stale proposals before send", async () => {
  const event = exampleEvent("membership_expiring"),
    job = {
      ownerId: event.ownerId,
      customerEvent: event,
      customerSnapshotHash: customerSnapshotHash(event),
    };
  const policy = { approved: true, emailEnabled: true, cutoverAt: 0 };
  const records = {
    "settings/customerNotifications": policy,
    "membershipSubscriptions/entity": {
      ownerId: "owner",
      state: "active",
      endsAt: 1791554400000,
    },
  };
  await expect(
    prepareCustomerEmail(fakeDb(records), job, 100),
  ).resolves.toHaveProperty("html");
  await expect(
    prepareCustomerEmail(
      fakeDb({
        ...records,
        "settings/customerNotifications": {
          ...policy,
          cutoverAt: 1791554400001,
        },
      }),
      job,
      100,
    ),
  ).rejects.toThrow("blocked_policy");
  await expect(
    prepareCustomerEmail(
      fakeDb({
        ...records,
        "membershipSubscriptions/entity": {
          ownerId: "owner",
          state: "active",
          endsAt: 1792554400000,
        },
      }),
      job,
      100,
    ),
  ).rejects.toThrow("suppressed_obsolete");
  await expect(
    prepareCustomerEmail(
      fakeDb({
        ...records,
        "membershipSubscriptions/entity": { ownerId: "another" },
      }),
      job,
      100,
    ),
  ).rejects.toThrow("blocked_recipient");
  await expect(
    prepareCustomerEmail(
      fakeDb(records),
      { ...job, customerSnapshotHash: "changed" },
      100,
    ),
  ).rejects.toThrow("blocked_policy");
});

it("invalid notification projection never aborts the enclosing business command", () => {
  expect(
    customerEventFields(() => {
      throw Error("bad financial display snapshot");
    }),
  ).toEqual({
    customerContentState: "blocked_invalid_snapshot",
    emailState: "blocked_content",
  });
});
it("batch parcel projection links only orders actually present in the parcel", () => {
  const unrelated = { ...order, id: "not-in-parcel" };
  const parcel: Parcel = {
    id: "parcel",
    version: 2,
    state: "delivered",
    route: "JP-VN",
    warehouse: "JP",
    weightGrams: 10,
    allocations: [{ orderId: "order", line: 0, quantity: 2 }],
  };
  const event = parcelCustomerEvent(
    parcel,
    [unrelated, { ...order, stage: "DELIVERED" }],
    "owner",
    "trackParcel",
    100,
  )!;
  expect(event.orderId).toBe("order");
  expect(event.templateId).toBe("order_delivered");
  expect(JSON.stringify(event.payload)).not.toContain("not-in-parcel");
});

it("rejects inconsistent customer-visible financial arithmetic", () => {
  const price = exampleEvent("price_change_proposed"),
    final = exampleEvent("final_balance_due");
  expect(() =>
    parseCustomerEvent({
      ...price,
      payload: { ...price.payload, differenceAmount: 1 },
    }),
  ).toThrow("INVALID_PRICE_DIFFERENCE");
  expect(() =>
    parseCustomerEvent({
      ...final,
      payload: { ...final.payload, balanceDue: 1 },
    }),
  ).toThrow("INVALID_FINAL_BALANCE");
});

it("suppresses obsolete refund requests, cleared warehouse issues and stale proposals", async () => {
  for (const [id, entity] of [
    ["refund_requested", { ownerId: "owner", version: 3 }],
    ["warehouse_issue", { ownerId: "owner", version: 2 }],
    ["price_change_proposed", { ownerId: "owner", version: 3 }],
  ] as const) {
    const event = exampleEvent(id),
      job = {
        ownerId: event.ownerId,
        customerEvent: event,
        customerSnapshotHash: customerSnapshotHash(event),
      };
    await expect(
      prepareCustomerEmail(
        fakeDb({
          "settings/customerNotifications": {
            approved: true,
            emailEnabled: true,
            cutoverAt: 0,
          },
          "orders/order": entity,
        }),
        job,
        100,
      ),
    ).rejects.toThrow("suppressed_obsolete");
  }
});

it("does not request final payment during a hold or invent missing warehouse quantity", () => {
  expect(
    orderCustomerEvent("approveFinal", { ...order, hold: "needs review" }, 100),
  ).toBeNull();
  expect(orderCustomerEvent("receive", order, 100)).toBeNull();
});

it("rechecks confirmed optional order-email purpose and destination; opt-out never falls back to promotions", async () => {
  const event = exampleEvent("order_delivered"),
    job = {
      ownerId: event.ownerId,
      customerEvent: event,
      customerSnapshotHash: customerSnapshotHash(event),
    };
  const base = {
    "settings/customerNotifications": {
      approved: true,
      emailEnabled: true,
      cutoverAt: 0,
    },
    "orders/order": { ownerId: "owner", version: 2 },
    "customerShipments/owner-entity": { ownerId: "owner", version: 2 },
  };
  await expect(
    prepareCustomerEmail(fakeDb(base), job, 100),
  ).resolves.toHaveProperty("html");
  for (const preferences of [
    undefined,
    { ...confirmedPreference, email: "other@example.invalid" },
    {
      ...confirmedPreference,
      topics: {
        ...confirmedPreference.topics,
        orderEmail: {
          requested: false,
          generation: 2,
          confirmedGeneration: null,
        },
        promotionsEmail: {
          requested: true,
          generation: 1,
          confirmedGeneration: 1,
        },
      },
    },
    {
      ...confirmedPreference,
      topics: {
        ...confirmedPreference.topics,
        orderEmail: { requested: true, generation: 2, confirmedGeneration: 1 },
      },
    },
  ]) {
    await expect(
      prepareCustomerEmail(
        fakeDb({ ...base, "notificationPreferences/owner": preferences }),
        job,
        100,
      ),
    ).rejects.toThrow("suppressed_preference");
  }
});

it("preserves required financial confirmation independently of optional update preferences", async () => {
  const event = exampleEvent("payment_confirmed"),
    job = {
      ownerId: event.ownerId,
      customerEvent: event,
      customerSnapshotHash: customerSnapshotHash(event),
    };
  await expect(
    prepareCustomerEmail(
      fakeDb({
        "settings/customerNotifications": {
          approved: true,
          emailEnabled: true,
          cutoverAt: 0,
        },
        "orders/order": { ownerId: "owner", version: 2 },
        "notificationPreferences/owner": undefined,
      }),
      job,
      100,
    ),
  ).resolves.toHaveProperty("html");
});

describe("forward-only customer notification projection", () => {
  const eventTime = 1_791_554_400_000;
  const projectionTime = eventTime + 1_000;
  let records: Map<string, Record<string, unknown>>;
  let databaseProject: unknown;
  const config = () => ({
    approved: true,
    provider: "resend",
    enabled: true,
    subscriptionsEnabled: true,
    from: "contact@hunpeolabs.com",
    verifiedDomain: "hunpeolabs.com",
    domainVerificationEvidenceId: "qa-authenticated-domain-receipt",
    domainVerifiedAt: eventTime - 10,
    cutoverAt: eventTime - 1,
    dailyAttemptLimit: 100,
  });
  function projectionDb() {
    const doc = (path: string) => ({ path });
    const snapshot = (ref: { path: string }) => ({
      exists: records.has(ref.path),
      data: () => structuredClone(records.get(ref.path)),
    });
    return {
      get projectId() {
        return databaseProject;
      },
      doc,
      runTransaction: async (callback: (transaction: unknown) => unknown) =>
        callback({
          get: async (ref: { path: string }) => snapshot(ref),
          getAll: async (...refs: { path: string }[]) => refs.map(snapshot),
          update: (ref: { path: string }, fields: Record<string, unknown>) =>
            records.set(ref.path, { ...records.get(ref.path), ...fields }),
          create: (ref: { path: string }, fields: Record<string, unknown>) => {
            if (records.has(ref.path)) throw Error("ALREADY_EXISTS");
            records.set(ref.path, fields);
          },
        }),
    } as unknown as Firestore;
  }
  function mutate(path: string, fields: Record<string, unknown>) {
    records.set(path, { ...records.get(path), ...fields });
  }
  const project = () =>
    projectCustomerNotification(projectionDb(), "event", projectionTime);
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(projectionTime);
    for (const name of [
      "FUNCTIONS_EMULATOR",
      "FIRESTORE_EMULATOR_HOST",
      "FIREBASE_AUTH_EMULATOR_HOST",
      "GOOGLE_CLOUD_PROJECT",
    ])
      vi.stubEnv(name, undefined);
    vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
    databaseProject = "satsunicgo";
    const event = exampleEvent("payment_confirmed");
    records = new Map<string, Record<string, unknown>>([
      [
        "outboxJobs/event",
        {
          state: "queued",
          ownerId: "owner",
          action: "verifyTransfer",
          customerEvent: event,
          customerSnapshotHash: customerSnapshotHash(event),
        },
      ],
      ["orders/order", { ownerId: "owner", version: 2 }],
      [
        "settings/customerNotifications",
        { approved: true, emailEnabled: true, cutoverAt: eventTime - 1 },
      ],
      ["settings/email", config()],
    ]);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("queues one validated post-cutover event and projects one inbox item on duplicate delivery", async () => {
    await expect(project()).resolves.toBe(true);
    expect(records.get("outboxJobs/event")).toMatchObject({
      state: "inAppDelivered",
      emailState: "queued",
    });
    expect(records.get("notifications/event")).toMatchObject({
      ownerId: "owner",
      templateId: "payment_confirmed",
      read: false,
    });
    await expect(project()).resolves.toBe(false);
    expect(
      [...records.keys()].filter((key) => key.startsWith("notifications/")),
    ).toHaveLength(1);
    expect(
      [...records.keys()].filter((key) =>
        key.startsWith("emailDispatchQuota/"),
      ),
    ).toHaveLength(0);
  });
  it.each([
    { enabled: false },
    { approved: false },
    { provider: "smtp" },
    { domainVerificationEvidenceId: undefined },
    { domainVerifiedAt: undefined },
    { cutoverAt: eventTime },
  ])(
    "unready transport %j still creates an inbox item while email remains blocked",
    async (fields) => {
      mutate("settings/email", fields);
      await project();
      expect(records.get("outboxJobs/event")).toMatchObject({
        state: "inAppDelivered",
        emailState: "blocked_external",
      });
      expect(records.has("notifications/event")).toBe(true);
    },
  );
  it.each([undefined, null, "demo-satsunicgo", "other-project"])(
    "actual database %s cannot queue a customer email",
    async (projectId) => {
      databaseProject = projectId;
      await project();
      expect(records.get("outboxJobs/event")?.emailState).toBe(
        "blocked_external",
      );
      expect(records.has("notifications/event")).toBe(true);
    },
  );
  it("emulator environment cannot queue even with a production database identity", async () => {
    vi.stubEnv("FUNCTIONS_EMULATOR", "true");
    await project();
    expect(records.get("outboxJobs/event")?.emailState).toBe(
      "blocked_external",
    );
  });
  it("pre-cutover events remain blocked when both settings use the new boundary", async () => {
    mutate("settings/email", { cutoverAt: eventTime + 1 });
    mutate("settings/customerNotifications", { cutoverAt: eventTime + 1 });
    await project();
    expect(records.get("outboxJobs/event")?.emailState).toBe("blocked_policy");
    expect(records.has("notifications/event")).toBe(true);
  });
  it.each([
    { offset: 0, emailState: "queued" },
    { offset: 1, emailState: "blocked_policy" },
  ])(
    "event at projection time +$offset ms has email state $emailState",
    async ({ offset, emailState }) => {
      const event = {
        ...exampleEvent("payment_confirmed"),
        occurredAt: projectionTime + offset,
      };
      mutate("outboxJobs/event", {
        customerEvent: event,
        customerSnapshotHash: customerSnapshotHash(event),
      });
      await project();
      expect(records.get("outboxJobs/event")?.emailState).toBe(emailState);
    },
  );
  it.each([
    { approved: false },
    { emailEnabled: false },
    { cutoverAt: undefined },
  ])("unapproved customer policy %j cannot queue", async (fields) => {
    mutate("settings/customerNotifications", fields);
    await project();
    expect(records.get("outboxJobs/event")?.emailState).toBe("blocked_policy");
  });
  it("invalid immutable content cannot enter either notification delivery channel", async () => {
    mutate("outboxJobs/event", { customerSnapshotHash: "tampered" });
    await project();
    expect(records.get("outboxJobs/event")).toMatchObject({
      state: "blocked_content",
      emailState: "blocked_content",
    });
    expect(records.has("notifications/event")).toBe(false);
  });
  it.each(["owner", "locked"])(
    "current %s authorization prevents projection",
    async (change) => {
      if (change === "owner")
        mutate("orders/order", { ownerId: "another-owner" });
      else records.set("users/owner", { locked: true });
      await project();
      expect(records.get("outboxJobs/event")).toMatchObject({
        state: "blocked_recipient",
        emailState: "blocked_recipient",
      });
      expect(records.has("notifications/event")).toBe(false);
    },
  );
});
