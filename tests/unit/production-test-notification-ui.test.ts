import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }));

// Render the actual consumer after its read has completed. This state seam does
// not establish Firestore subscription, authorization or provider integration.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: <S>(initial: S | (() => S)) => {
      const result = actual.useState(initial);
      if (Array.isArray(initial) && initial.length === 0)
        return [fixture.rows, result[1]];
      if (initial === true) return [false, result[1]];
      return result;
    },
  };
});
vi.mock("../../src/shared/firebase", () => ({
  db: null,
  callService: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
}));
import { callService } from "../../src/shared/firebase";
import { Notifications } from "../../src/features/notifications/Notifications";
import { db as previewDb } from "../../docs/reviews/PRODUCTION-TEST-20261010/UI-PREVIEW/synthetic-adapter";
import {
  collection as previewCollection,
  query as previewQuery,
  where as previewWhere,
  orderBy as previewOrderBy,
  limit as previewLimit,
  onSnapshot as previewSnapshot,
  doc as previewDoc,
} from "../../docs/reviews/PRODUCTION-TEST-20261010/UI-PREVIEW/synthetic-firestore";

const base = {
  id: "synthetic-notification",
  orderId: "synthetic-order",
  action: "paymentReceived",
  title: "Đã nhận cập nhật thanh toán",
  read: false,
  createdAt: Date.UTC(2026, 9, 10),
};
const provenance = {
  executionMode: "production_test",
  executionPolicyVersion: 1,
  testRunId: "10000000-0000-4000-8000-000000000001",
};
const testMetadata = [
  provenance,
  { testMode: true },
  { provider: "sepay_sandbox" },
  { paymentProvider: "sepay_sandbox" },
  { provider: "demo" },
  { paymentProvider: "demo" },
  { executionMode: "unknown" },
  { executionPolicyVersion: 1 },
  { testRunId: "partial" },
];

function render(record: Record<string, unknown>, expanded = true) {
  fixture.rows = [{ ...base, ...record }];
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(Notifications, { uid: "synthetic-owner", expanded }),
    ),
  );
}

afterEach(() => {
  fixture.rows = [];
  vi.clearAllMocks();
});

describe("production test notification consumer", () => {
  it.each(testMetadata)(
    "marks persisted test, legacy or partial metadata %j in the actual inbox row",
    (metadata) => {
      const html = render(metadata);
      expect(html).toContain('role="note" aria-label="Đơn test"');
      expect(html).toMatch(/<h3>Đã nhận cập nhật thanh toán .*?>Test<\/span><\/h3>/);
      expect(html).toContain('href="/account/orders/synthetic-order"');
      expect(html).toContain('aria-label="Chưa đọc"');
      expect(html).toContain("Đánh dấu đã đọc");
      expect(html).not.toContain("production_test");
      expect(html).not.toContain(provenance.testRunId);
      expect(callService).not.toHaveBeenCalled();
    },
  );

  it.each([{}, { testMode: false }, { provider: "payos" }])(
    "preserves genuine or untagged notification title, target and read action %j",
    (record) => {
      const html = render(record);
      expect(html).not.toContain("testOrderBadge");
      expect(html).toContain("Đã nhận cập nhật thanh toán");
      expect(html).toContain('href="/account/orders/synthetic-order"');
      expect(html).toContain("Đánh dấu đã đọc");
    },
  );

  it("keeps a test reply's existing destination and read state in the disclosure", () => {
    const html = render(
      {
        ...provenance,
        action: "replyTicket",
        title: "Nhân viên đã trả lời",
        read: true,
      },
      false,
    );
    expect(html).toContain("<summary>Thông báo của bạn</summary>");
    expect(html).toContain('href="/support"');
    expect(html).toContain('aria-label="Đã đọc"');
    expect(html).toContain('aria-label="Đơn test"');
    expect(html).not.toContain("Đánh dấu đã đọc");
    expect(html).not.toContain("<form");
  });
});

describe("read-only notification preview boundary", () => {
  function ownedRead() {
    return previewQuery(
      previewCollection(previewDb, "notifications"),
      previewWhere("ownerId", "==", "preview-synthetic-owner"),
      previewOrderBy("createdAt", "desc"),
      previewLimit(30),
    );
  }

  it("emits only owned synthetic rows and honors unsubscribe before publication", async () => {
    const next = vi.fn();
    const unsubscribe = previewSnapshot(ownedRead(), next);
    unsubscribe();
    await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
    previewSnapshot(ownedRead(), next);
    await Promise.resolve();
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].docs).toHaveLength(4);
    expect(next.mock.calls[0][0].docs[0].data().executionMode).toBe(
      "production_test",
    );
  });

  it.each([
    () => previewCollection({}, "notifications"),
    () => previewCollection(previewDb, "orders"),
    () => previewWhere("ownerId", "==", "another-owner"),
    () => previewWhere("ownerId", "!=", "preview-synthetic-owner"),
    () => previewOrderBy("createdAt", "asc"),
    () => previewLimit(31),
    () => previewQuery(previewCollection(previewDb, "notifications")),
    () => previewDoc(),
  ])("denies every out-of-scope read/provider path", (operation) => {
    expect(operation).toThrow("Preview denies provider access");
  });
});
