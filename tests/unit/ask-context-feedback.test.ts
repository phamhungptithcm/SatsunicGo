import { expect, test } from "vitest";
import {
  revisionChunks,
  packAskContext,
  boundKnowledgeContext,
  type AskContext,
} from "../../functions/src/ai/knowledge-context";
import { evaluateFeedbackCandidate } from "../../functions/src/ai/feedback-evaluation";
import {
  askFeedbackSchema,
  feedbackReviewSchema,
} from "../../packages/domain/ask-feedback";
const document = {
  id: "post:synthetic-policy",
  revision: "a".repeat(64),
  body: "# Returns\n\nUnused only.\n\n## Exceptions\n\nCustom goods excluded. ".repeat(
    30,
  ),
};
test("context: revision-bound IDs, original text and heading breadcrumbs", () => {
  const chunks = revisionChunks(document);
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks).toEqual(revisionChunks(document));
  for (const c of chunks) {
    expect(document.body.slice(c.position, c.position + c.text.length)).toBe(
      c.text,
    );
    expect(c.id).toMatch(/^[a-f0-9]{64}$/);
  }
  expect(chunks.at(-1)?.headingPath).toContain("Returns");
  expect(
    revisionChunks({ ...document, revision: "b".repeat(64) })[0].id,
  ).not.toBe(chunks[0].id);
});
const context: AskContext = {
  instruction: "trusted boundaries",
  question: "return eligibility",
  task: { pendingOperation: "same-operation", orderId: "qa-order", version: 4 },
  currentFacts: { price: 123, observedAt: 12345 },
  evidence: revisionChunks(document).slice(0, 2),
  recentTurns: ["old ".repeat(40), "recent ".repeat(20)],
};
test("context: full request wrapper counted, trim oldest history before evidence", async () => {
  const seen: string[] = [];
  const result = await packAskContext(
    context,
    { inputTokens: 1500, outputTokens: 500, windowTokens: 2000 },
    async (text) => {
      seen.push(text);
      return text.length;
    },
    new AbortController().signal,
    (c) =>
      JSON.stringify({
        tools: [{ name: "read-only", schema: "full schema" }],
        contents: c,
      }),
  );
  expect(seen[0]).toContain("full schema");
  expect(result.context.task).toEqual(context.task);
  expect(result.context.currentFacts).toEqual(context.currentFacts);
  expect(result.dropped.turns).toBe(2);
  expect(result.tokens).toBeLessThanOrEqual(1500);
  expect(context.recentTurns).toHaveLength(2);
});
test("context: required overflow, malformed count and output reserve cannot pass", async () => {
  await expect(
    packAskContext(
      { ...context, evidence: [], recentTurns: [] },
      { inputTokens: 2, outputTokens: 1, windowTokens: 3 },
      async (text) => text.length,
      new AbortController().signal,
    ),
  ).rejects.toThrow("REQUIRED_CONTEXT_OVERFLOW");
  for (const count of [NaN, Infinity, 0, 1.5, -1])
    await expect(
      packAskContext(
        context,
        { inputTokens: 1500, outputTokens: 500, windowTokens: 2000 },
        async () => count,
        new AbortController().signal,
      ),
    ).rejects.toThrow("INVALID_TOKEN_COUNT");
  await expect(
    packAskContext(
      context,
      { inputTokens: 1500, outputTokens: 501, windowTokens: 2000 },
      async () => 1,
      new AbortController().signal,
    ),
  ).rejects.toThrow("INVALID_CONTEXT_LIMITS");
});
test("context: optional UTF-8 overflow trims before native count; protected byte overflow fails", async () => {
  const counted: string[] = [];
  const limits = {
    inputTokens: 10000,
    outputTokens: 800,
    windowTokens: 10800,
    maximumBytes: 1000,
  };
  const count = async (body: string) => {
    counted.push(body);
    return 100;
  };
  const result = await packAskContext(
    { ...context, evidence: [], recentTurns: ["🎵".repeat(1000)] },
    limits,
    count,
    new AbortController().signal,
  );
  expect(result.dropped.turns).toBe(1);
  expect(counted).toHaveLength(1);
  expect(Buffer.byteLength(counted[0], "utf8")).toBeLessThanOrEqual(1000);
  await expect(
    packAskContext(
      {
        ...context,
        task: "required".repeat(1000),
        evidence: [],
        recentTurns: [],
      },
      limits,
      count,
      new AbortController().signal,
    ),
  ).rejects.toThrow("REQUIRED_CONTEXT_OVERFLOW");
  expect(counted).toHaveLength(1);
});
test("context: cancellation releases stalled counting; UTF-8 is not labelled tokens", async () => {
  const c = new AbortController(),
    pending = packAskContext(
      context,
      { inputTokens: 1500, outputTokens: 500, windowTokens: 2000 },
      () => new Promise(() => {}),
      c.signal,
    );
  c.abort(Error("stop"));
  await expect(pending).rejects.toThrow("stop");
  const row = { id: "one", title: "VI", text: "😀".repeat(1000) };
  expect(boundKnowledgeContext([row, row, row])).toHaveLength(2);
  expect(boundKnowledgeContext([row], NaN)).toEqual([]);
  const exact = Buffer.byteLength(JSON.stringify([row]), "utf8");
  expect(boundKnowledgeContext([row], exact)).toEqual([row]);
  expect(boundKnowledgeContext([row], exact - 1)).toEqual([]);
});
const report = {
  datasetHash: "a".repeat(64),
  candidateHash: "b".repeat(64),
  split: "holdout",
  cases: [
    {
      id: "happy",
      supported: 1,
      retrieval: 1,
      taskSuccess: 1,
      unsafe: false,
      latencyMs: 100,
    },
    {
      id: "bad",
      supported: 1,
      retrieval: 1,
      taskSuccess: 1,
      unsafe: false,
      latencyMs: 200,
    },
  ],
};
test("feedback learning: frozen holdout requires staff review even with no regressions", () => {
  expect(
    evaluateFeedbackCandidate(report, {
      ...report,
      candidateHash: "c".repeat(64),
    }),
  ).toMatchObject({
    decision: "REVIEW_REQUIRED",
    automaticPromotion: false,
    regressions: [],
  });
  for (const change of [
    { unsafe: true },
    { supported: 0.99 },
    { retrieval: 0.8 },
    { taskSuccess: 0 },
  ])
    expect(
      evaluateFeedbackCandidate(report, {
        ...report,
        cases: [{ ...report.cases[0], ...change }, report.cases[1]],
      }),
    ).toMatchObject({ decision: "REJECTED", regressions: ["happy"] });
});
test("feedback learning: changed dataset, split, duplicate or missing cases cannot pass", () => {
  for (const change of [
    { datasetHash: "d".repeat(64) },
    { split: "validation" },
    { cases: [report.cases[0], report.cases[0]] },
    { cases: [report.cases[0]] },
  ])
    expect(() =>
      evaluateFeedbackCandidate(report, { ...report, ...change }),
    ).toThrow();
});
test("feedback: consent required, no raw chat or money fields and resolution needs approved source", () => {
  const value = {
    operationId: "11111111-1111-4111-8111-111111111111",
    conversationId: "22222222-2222-4222-8222-222222222222",
    expectedVersion: 1,
    answerHash: "a".repeat(64),
    submittedAt: Date.now(),
    expectedPolicyVersion: 1,
    consent: true,
    category: "helpful",
  };
  expect(askFeedbackSchema.safeParse(value).success).toBe(true);
  for (const delta of [
    { consent: false },
    { question: "private chat" },
    { payment: 1 },
    { category: "train_from_chat" },
  ])
    expect(askFeedbackSchema.safeParse({ ...value, ...delta }).success).toBe(
      false,
    );
  expect(
    feedbackReviewSchema.safeParse({
      operationId: value.operationId,
      ownerId: "owner",
      feedbackId: value.operationId,
      expectedVersion: 1,
      disposition: "resolved",
    }).success,
  ).toBe(false);
});
