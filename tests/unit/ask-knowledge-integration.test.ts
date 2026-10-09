import { expect, test } from "vitest";
import {
  chunkKnowledge,
  publishedKnowledge,
  retrieveKnowledge,
} from "../../functions/src/ai/knowledge-retrieval";
import { retrieveSelection } from "../../src/features/ask/knowledge";
import {
  quotedKnowledgeAnswer,
  guidanceAnchor,
  guidanceFollowup,
} from "../../functions/src/ai/approved-knowledge";
const doc = (slug: string, title: string, body: string) =>
  publishedKnowledge({ slug, title, body, status: "published" })!;
test("customer four-excerpt limit retains requested eligibility and exception under source pressure", () => {
  const policy = doc(
    "returns-policy",
    "Returns",
    "Return eligibility: unused goods.\n\n" +
      "Packaging instructions. ".repeat(60) +
      "\n\nReturn exception: custom goods are excluded.",
  );
  const rows = [
    policy,
    ...[1, 2, 3].map((n) =>
      doc(`generic-return-${n}`, "Returns", "Return contact instructions."),
    ),
  ];
  const answer = quotedKnowledgeAnswer(
    rows,
    "return eligibility exception",
    "en",
  );
  expect(answer?.paragraphs.some((row) => row.includes("eligibility"))).toBe(
    true,
  );
  expect(answer?.paragraphs.some((row) => row.includes("exception"))).toBe(
    true,
  );
  // Preserve the default diversity contract; the customer caller opts into coverage.
  expect(
    new Set(
      retrieveKnowledge(rows, "return eligibility exception", 4).map(
        (row) => row.id,
      ),
    ).size,
  ).toBe(4);
});
test("a leading heading stays with its first policy paragraph rather than an orphan chunk", () => {
  const body = "# Catalog\n\n" + "Original policy qualifier. ".repeat(80);
  const chunks = chunkKnowledge(body);
  expect(chunks[0].text).toContain("Original policy qualifier.");
  expect(
    chunks.every(
      (chunk) =>
        body.slice(chunk.position, chunk.position + chunk.text.length) ===
        chunk.text,
    ),
  ).toBe(true);
});
test.each(["cọc và số dư tính thế nào?", "coc va so du tinh the nao?"])(
  "natural Vietnamese FAQ spelling %s",
  (question) => {
    expect(
      retrieveSelection({
        question,
        history: [],
        language: "vi",
        sessionId: "synthetic",
      }).topic,
    ).toBe("deposit");
  },
);
test.each([
  "How does a network work?",
  "Help me with homework",
  "What item is in the periodic table?",
])("unrelated substring is not a SatsunicGo FAQ: %s", (question) => {
  expect(
    retrieveSelection({
      question,
      history: [],
      language: "en",
      sessionId: "synthetic",
    }).topic,
  ).toBe("outside");
});
test("owned single public citation is a hint only while freshly admitted and same locale", () => {
  const policy = doc(
    "return-guide",
    "Return guide",
    "Exception: custom goods are excluded.",
  );
  const conversation = {
    ownerId: "synthetic-owner",
    version: 3,
    updatedAt: 1,
    turns: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        question: "Returns?",
        answer: {
          language: "en",
          title: "Guide",
          paragraphs: ["Synthetic excerpt"],
          bullets: [],
          sourceIds: [policy.id],
          action: "workflow",
        },
      },
    ],
  };
  expect(guidanceAnchor(conversation, "synthetic-owner", "en", [policy])).toBe(
    policy.id,
  );
  expect(
    guidanceAnchor(conversation, "other-owner", "en", [policy]),
  ).toBeNull();
  expect(
    guidanceAnchor(conversation, "synthetic-owner", "vi", [policy]),
  ).toBeNull();
  expect(guidanceAnchor(conversation, "synthetic-owner", "en", [])).toBeNull();
  expect(
    guidanceAnchor(
      {
        ...conversation,
        turns: [
          {
            ...conversation.turns[0],
            answer: {
              ...conversation.turns[0].answer,
              sourceIds: [policy.id, "post:other-guide"],
            },
          },
        ],
      },
      "synthetic-owner",
      "en",
      [policy],
    ),
  ).toBeNull();
  expect(
    quotedKnowledgeAnswer([policy], "What about exceptions?", "en")?.sourceIds,
  ).toEqual([policy.id]);
});
test.each([
  "còn ngoại lệ thì sao?",
  "vậy điều đó áp dụng thế nào?",
  "What about exceptions?",
  "And exceptions?",
])("narrow follow-up requires a persisted anchor: %s", (question) =>
  expect(
    guidanceFollowup(
      question,
      /^(?:còn|thế|vậy)/iu.test(question) ? "vi" : "en",
    ),
  ).toBe(true),
);
test.each([
  "shipping rates",
  "Tìm sản phẩm mới",
  "How do I pay for a catalog item?",
])("explicit new topic does not reuse an old anchor: %s", (question) =>
  expect(guidanceFollowup(question)).toBe(false),
);
test("false premise evidence retains order-type qualifier; no numeric or policy inventions", () => {
  const body =
    "Sản phẩm trong danh mục thanh toán toàn bộ. Sản phẩm ngoài danh mục cần báo giá trước khi thanh toán hai đợt.";
  const answer = quotedKnowledgeAnswer(
    [doc("payment-guide", "Thanh toán", body)],
    "đồ trong danh mục cũng cọc trước hả?",
    "vi",
  );
  expect(answer?.paragraphs).toContain(`Thanh toán\n${body}`);
  expect(answer?.paragraphs.join(" ")).not.toContain("50%");
  expect(
    quotedKnowledgeAnswer([], "hoàn tiền bao nhiêu ngày?", "vi"),
  ).toBeNull();
});

test.each([
  "The shipping rate for Japan",
  "The catalog payment policy",
  "What about shipping rates for Japan",
])(
  "explicit English new topic does not inherit previous citation: %s",
  (question) => expect(guidanceFollowup(question, "en")).toBe(false),
);
test("Vietnamese thế and English the have different topic meaning", () => {
  expect(guidanceFollowup("thế ngoại lệ thì sao?", "vi")).toBe(true);
  expect(guidanceFollowup("The exceptions for shipping in Japan", "en")).toBe(
    false,
  );
});
