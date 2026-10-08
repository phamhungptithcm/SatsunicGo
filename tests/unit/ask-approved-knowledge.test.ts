import { expect, test } from "vitest";
import {
  activeKnowledge,
  knowledgeCommandSchema,
} from "../../packages/domain/ask-knowledge";
import { knowledgeSource } from "../../functions/src/ai/approved-knowledge";
const approved = {
  schemaVersion: 1,
  source: "posts",
  sourceId: "guide",
  version: 1,
  active: true,
  language: "vi",
  effectiveFrom: 100,
  effectiveTo: 200,
  contentHash: "a".repeat(64),
  reviewedBy: "synthetic-owner",
  reviewedAt: 90,
};
test("happy: public evidence hashes are deterministic and content-bound", () => {
  const post = {
    status: "published",
    slug: "guide-one",
    title: "Guide",
    body: "Refund conditions",
  };
  expect(knowledgeSource(post)?.hash).toBe(
    knowledgeSource({ ...post, internal: "ignored" })?.hash,
  );
  expect(knowledgeSource({ ...post, body: "Changed" })?.hash).not.toBe(
    knowledgeSource(post)?.hash,
  );
  expect(knowledgeSource({ ...post, status: "draft" })).toBeNull();
  expect(knowledgeSource({ ...post, body: "x".repeat(20001) })).toBeNull();
  expect(
    knowledgeSource({ ...post, body: undefined, content: post.body }),
  ).toEqual(knowledgeSource(post));
});
test("happy: approval has exact start-inclusive/end-exclusive validity", () => {
  expect(activeKnowledge(approved, "vi", 100)).toEqual(approved);
  expect(activeKnowledge(approved, "vi", 199)).toEqual(approved);
});
test.each([
  { now: 99 },
  { now: 200 },
  { now: NaN },
  { now: 150, language: "en" },
  { now: 150, active: false },
  { now: 150, effectiveTo: 50 },
  { now: 150, reviewedBy: "" },
  { now: 150, version: 0 },
])("bad: invalid/inactive/expired/locale mismatch %j", (change) => {
  const { now, language = "vi", ...fields } = change;
  expect(
    activeKnowledge({ ...approved, ...fields }, language as "vi" | "en", now),
  ).toBeNull();
});
test("bad: approval input requires exact hash, explicit dates and valid source paths", () => {
  const input = {
    action: "approve",
    operationId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    source: "posts",
    sourceId: "guide",
    expectedVersion: 0,
    contentHash: "a".repeat(64),
    language: "vi",
    effectiveFrom: 100,
    effectiveTo: 200,
  };
  expect(knowledgeCommandSchema.safeParse(input).success).toBe(true);
  for (const change of [
    { sourceId: "../users" },
    { effectiveTo: 99 },
    { contentHash: "fake" },
    { source: "users" },
    { expectedVersion: -1 },
    { effectiveFrom: undefined },
    { approved: true },
  ])
    expect(
      knowledgeCommandSchema.safeParse({ ...input, ...change }).success,
    ).toBe(false);
});

test("rich text keeps headings, lists and repeats table units on every row", async () => {
  const { knowledgeBody } =
    await import("../../packages/domain/ask-knowledge-body");
  const text = (value: string) => ({ type: "text", text: value });
  const cell = (value: string, type = "tableCell") => ({
    type,
    content: [{ type: "paragraph", content: [text(value)] }],
  });
  const document = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [text("Conditions")] },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [text("Review required")] },
            ],
          },
        ],
      },
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              cell("Market", "tableHeader"),
              cell("Unit: kg", "tableHeader"),
            ],
          },
          { type: "tableRow", content: [cell("US"), cell("Synthetic")] },
          { type: "tableRow", content: [cell("JP"), cell("Synthetic")] },
        ],
      },
    ],
  };
  const body = knowledgeBody(document);
  expect(body).toContain("## Conditions");
  expect(body).toContain("- Review required");
  expect(body.match(/Unit: kg/g)).toHaveLength(2);
  expect(
    knowledgeSource({
      status: "published",
      slug: "rich-policy",
      title: "Policy",
      body: document,
    })?.document.body,
  ).toBe(body);
  const missingHeaders = {
    ...document,
    content: [
      {
        type: "table",
        content: [{ type: "tableRow", content: [cell("Ambiguous")] }],
      },
    ],
  };
  expect(
    knowledgeSource({
      status: "published",
      slug: "bad-policy",
      title: "Policy",
      body: missingHeaders,
      content: "Flattened fallback must not mask malformed structure",
    }),
  ).toBeNull();
});

test("citation contract supports allowed 100-character slugs without unbounded IDs", async () => {
  const { askAnswerSchema } = await import("../../packages/domain/ask-stream");
  const input = {
    language: "vi",
    title: "Guide",
    paragraphs: ["Evidence"],
    bullets: [],
    sourceIds: ["post:" + "a".repeat(100)],
    action: "workflow",
  };
  expect(askAnswerSchema.safeParse(input).success).toBe(true);
  expect(
    askAnswerSchema.safeParse({
      ...input,
      sourceIds: ["product:" + "a".repeat(100)],
      action: "product:" + "a".repeat(100),
    }).success,
  ).toBe(true);
  expect(
    askAnswerSchema.safeParse({ ...input, sourceIds: ["x".repeat(109)] })
      .success,
  ).toBe(false);
});
