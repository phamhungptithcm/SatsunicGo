import { expect, test } from "vitest";
import {
  discoveryMarket,
  webDiscoveryInputSchema,
  webDiscoveryResultSchema,
  webChatSelection,
} from "../../packages/domain/ask-web";
import { discoveryLedgerAdmission } from "../../functions/src/ai/research-live";
import { contextTask } from "../../functions/src/ai/server-context";
import { inboxRow } from "../../functions/src/ai/feedback-lifecycle";
import { evaluateRetrievalHoldout } from "../../functions/src/ai/feedback-evaluation";
const hash = "a".repeat(64);
test("web market: explicit market only, English my is not Vietnamese Mỹ, conflict clarifies", () => {
  for (const [text, expected] of [
    ["my headphones", null],
    ["find shoes", null],
    ["Mỹ", "US"],
    ["ở Mỹ", "US"],
    ["o my", "US"],
    ["Nhật", "JP"],
    ["in Japan", "JP"],
    ["Hàn Quốc", "KR"],
    ["US or JP", null],
  ] as const)
    expect(discoveryMarket(text)).toBe(expected);
});
test("web budget: missing/corrupt/under-import/exhausted ledgers never create a fresh allowance", () => {
  const base = {
    maxBudgetVnd: 50000,
    reservedVnd: 25000,
    importedReservedVnd: 25000,
    importHash: hash,
  };
  expect(
    discoveryLedgerAdmission(
      base,
      hash,
      Date.parse("2026-10-08T06:00:00Z"),
      25000,
    ),
  ).toBe(50000);
  for (const row of [
    undefined,
    {},
    { ...base, reservedVnd: 0 },
    { ...base, reservedVnd: 50000 },
    { ...base, importHash: "b".repeat(64) },
    { ...base, reservedVnd: 0.5 },
  ])
    expect(() =>
      discoveryLedgerAdmission(row, hash, Date.parse("2026-10-08T06:00:00Z")),
    ).toThrow();
});
test("context projection retains task authority and removes all recipient/notes/URL fields", () => {
  const value = {
    ownerId: "qa-owner",
    version: 5,
    updatedAt: Date.now(),
    turns: [],
    orderId: "qa-order",
    pendingOperation: "11111111-1111-4111-8111-111111111111",
    recipientSaved: true,
    draft: {
      market: "US",
      notes: "private address",
      preferredStore: "private email",
      budget: 123456,
      items: [
        {
          name: "Item",
          quantity: 2,
          variant: "Black",
          url: "https://example.test/private",
        },
      ],
    },
    recipient: { address: "PRIVATE_ADDRESS", phone: "PRIVATE_PHONE" },
  };
  const task = contextTask(value, "qa-owner");
  expect(task).toMatchObject({
    version: 5,
    orderId: "qa-order",
    pendingOperation: value.pendingOperation,
    recipientSaved: true,
  });
  expect(JSON.stringify(task)).not.toMatch(/private|PRIVATE|123456|https:/);
  expect(() => contextTask(value, "foreign-owner")).toThrow();
});
test("feedback inbox: withdrawn/expired/malformed rows excluded, only allowed metadata returned", () => {
  const now = Date.now(),
    row = {
      category: "helpful",
      consent: true,
      reviewVersion: 1,
      createdAt: now,
      expiresAt: { toMillis: () => now + 1000 },
      disposition: "unreviewed",
      rawChat: "PRIVATE",
    };
  const doc = {
    id: "qa-owner-11111111-1111-4111-8111-111111111111",
    data: () => row,
  };
  expect(inboxRow(doc, now)?.ownerId).toBe("qa-owner");
  expect(JSON.stringify(inboxRow(doc, now))).not.toContain("PRIVATE");
  expect(inboxRow(doc, now + 1000)).toBeNull();
  expect(
    inboxRow({ ...doc, data: () => ({ ...row, withdrawn: true }) }, now),
  ).toBeNull();
});
test("web contracts: strict customer input and no invented offer prices", () => {
  expect(
    webDiscoveryInputSchema.safeParse({
      query: "public item",
      market: "US",
      conversationId: "11111111-1111-4111-8111-111111111111",
      expectedVersion: 0,
      price: 1,
    }).success,
  ).toBe(false);
  expect(webDiscoveryResultSchema.safeParse({}).success).toBe(false);
});

test("current paid budget baseline cannot be imported as zero outside a synthetic demo", () => {
  expect(() =>
    discoveryLedgerAdmission(
      {
        maxBudgetVnd: 50000,
        reservedVnd: 0,
        importedReservedVnd: 0,
        importHash: hash,
      },
      hash,
      Date.parse("2026-10-08T06:00:00Z"),
    ),
  ).toThrow();
});

test("chat web selection requires explicit source, quantity and variant; never defaults or selects from a question", () => {
  expect(webChatSelection("chọn nguồn 1, số lượng 2, mẫu Đen", 2)).toEqual({
    kind: "select",
    index: 0,
    quantity: 2,
    variant: "Đen",
  });
  expect(
    webChatSelection("choose source 2, quantity 1, variant Black", 2),
  ).toEqual({ kind: "select", index: 1, quantity: 1, variant: "Black" });
  expect(webChatSelection("nguồn 1 có tốt không?", 2)).toBeNull();
  for (const text of [
    "chọn nguồn 1",
    "chọn nguồn 5, số lượng 2, mẫu Đen",
    "chọn nguồn 1, số lượng 100, mẫu Đen",
    "chọn nguồn 1, số lượng 2, mẫu Đen?",
  ])
    expect(webChatSelection(text, 2)).toEqual({ kind: "clarify" });
});
test("reviewed learning: actual chunk retrieval supports frozen text/source expectations and rejects regressions", () => {
  const docs = [
    {
      id: "post:qa-guide",
      title: "Returns",
      body: "Unused goods only. Customs charges excluded.",
    },
  ];
  const holdout = {
    version: 1,
    approved: true,
    expiresAt: Date.now() + 60000,
    cases: [
      {
        id: "returns",
        question: "Returns unused",
        expected: [
          { documentId: "post:qa-guide", requiredText: "Unused goods only." },
        ],
      },
      { id: "unrelated", question: "astronomy quasars", expected: [] },
    ],
  };
  const result = evaluateRetrievalHoldout(docs, holdout);
  expect(result).toMatchObject({
    decision: "REVIEW_REQUIRED",
    scope: "retrieval_only",
    passed: 2,
    total: 2,
    automaticPromotion: false,
  });
  expect(
    evaluateRetrievalHoldout(
      [{ ...docs[0], body: "Different terms." }],
      holdout,
    ).decision,
  ).toBe("REJECTED");
  expect(() =>
    evaluateRetrievalHoldout(docs, { ...holdout, expiresAt: Date.now() - 1 }),
  ).toThrow();
  expect(result.datasetHash).toMatch(/^[a-f0-9]{64}$/);
});
