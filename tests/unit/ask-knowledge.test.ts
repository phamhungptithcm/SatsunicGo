import { expect, test } from "vitest";
import {
  knowledgeLimits,
  chunkKnowledge,
  publishedKnowledge,
  retrieveKnowledge,
} from "../../functions/src/ai/knowledge-retrieval";

function post(slug: string, title: string, body: string) {
  return publishedKnowledge({ slug, title, body, status: "published" })!;
}
test("only valid published documents become public evidence", () => {
  const valid = {
    slug: "van-chuyen",
    title: "Vận chuyển",
    body: "Nội dung",
    status: "published",
  };
  expect(publishedKnowledge(valid)?.id).toBe("post:van-chuyen");
  for (const change of [
    { status: "draft" },
    { slug: "../private" },
    { title: " " },
    { body: null },
    { title: "x".repeat(201) },
  ])
    expect(publishedKnowledge({ ...valid, ...change })).toBeNull();
});
test("Vietnamese accents and no accents rank the relevant policy first", () => {
  const rows = [
    post("mua-ho", "Mua hộ", "Gửi yêu cầu"),
    post("van-chuyen", "Vận chuyển", "Đóng gói hàng hóa"),
  ];
  for (const query of [
    "vận chuyển",
    "van chuyen",
    "VẬN CHUYỂN",
    "van chuyen?",
    "vận chuyển",
  ])
    expect(retrieveKnowledge(rows, query)[0]?.id).toBe("post:van-chuyen");
  expect(retrieveKnowledge(rows, "toi co the hoi gi khong")).toEqual([]);
  expect(retrieveKnowledge(rows, "refund")).toEqual([]);
});
test("English whole tokens avoid accidental substring evidence", () => {
  const rows = [
    post("policy-one", "Policy", "Shipment delays"),
    post("policy-two", "Policy", "Refund policy"),
  ];
  expect(retrieveKnowledge(rows, "What is the refund policy?")[0]?.id).toBe(
    "post:policy-two",
  );
  expect(retrieveKnowledge(rows, "fund")).toEqual([]);
});
test("finds original evidence beyond the old 1800-character cutoff", () => {
  const row = post(
    "returns-policy",
    "Policy",
    "intro ".repeat(600) + "RETURNELIGIBILITY details",
  );
  const [result] = retrieveKnowledge([row], "returneligibility");
  expect(result.text).toContain("RETURNELIGIBILITY");
  expect(row.body).toContain(result.text);
  expect(result.id).toBe(row.id);
});
test("bounded document pool, excerpts and context; sources are unique", () => {
  const rows = Array.from({ length: 120 }, (_, index) =>
    post(`policy-${index}`, "Policy", "refund ".repeat(4000)),
  );
  const results = retrieveKnowledge(rows, "refund");
  expect(results).toHaveLength(8);
  expect(new Set(results.map((row) => row.id)).size).toBe(8);
  expect(results.every((row) => row.text.length <= 1200)).toBe(true);
  expect(
    results.reduce(
      (n, row) => n + row.text.length + row.title.length + row.id.length,
      0,
    ),
  ).toBeLessThanOrEqual(knowledgeLimits.contextCharacters);
  expect(retrieveKnowledge(rows, "refund", 5)).toHaveLength(5);
  expect(retrieveKnowledge(rows, "refund", 0)).toEqual([]);
  expect(retrieveKnowledge([], "refund")).toEqual([]);
  rows[100] = post("late-doc", "Policy", "uniqueoutside");
  expect(retrieveKnowledge(rows, "uniqueoutside")).toEqual([]);
  expect(
    publishedKnowledge({
      status: "published",
      slug: "long-policy",
      title: "Policy",
      body: "x".repeat(20000) + "secretterm",
    })?.body,
  ).not.toContain("secretterm");
});

test("happy case: retrieves eligibility and exception from the same policy", () => {
  const row = post(
    "returns-conditions",
    "Returns",
    "Return eligibility: unused goods.\n\n" +
      "Packaging instructions. ".repeat(60) +
      "\n\nReturn exception: custom goods are excluded.",
  );
  const results = retrieveKnowledge([row], "return eligibility exception");
  expect(results.some((row) => row.text.includes("eligibility"))).toBe(true);
  expect(results.some((row) => row.text.includes("exception"))).toBe(true);
  expect(results).toHaveLength(2);
  expect(results.every((result) => row.body.includes(result.text))).toBe(true);
});

test("bad case: conflicting publications cannot share one authoritative citation", () => {
  const first = post("policy-one", "Policy", "refund eligible");
  expect(
    retrieveKnowledge(
      [first, { ...first, body: "refund prohibited" }],
      "refund",
    ),
  ).toEqual([]);
  expect(retrieveKnowledge([first, first], "refund")).toHaveLength(1);
});

test("chunk spans preserve source paragraphs and UTF-16 characters within bounded size", () => {
  const body =
    "# Shipping\n\n" +
    "a".repeat(1186) +
    "😀" +
    "\n\n# Exceptions\n\n" +
    "Refund only after review. ".repeat(140);
  const spans = chunkKnowledge(body);
  expect(spans.map((span) => span.text).join("")).toBe(body);
  for (const span of spans) {
    expect(span.text).toBe(
      body.slice(span.position, span.position + span.text.length),
    );
    expect(span.text.length).toBeLessThanOrEqual(
      knowledgeLimits.excerptCharacters,
    );
    expect(span.text).not.toMatch(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/u);
  }
  expect(chunkKnowledge("")).toEqual([]);
  expect(
    chunkKnowledge("a".repeat(30000))
      .map((span) => span.text)
      .join(""),
  ).toHaveLength(20000);
});

test.each([NaN, Infinity, -1])(
  "bad case: invalid retrieval count %s cannot bypass bounds",
  (maximum) => {
    expect(
      retrieveKnowledge(
        [post("policy-one", "Policy", "refund")],
        "refund",
        maximum,
      ),
    ).toEqual([]);
  },
);

test("bad case: document hard bound never retains half an emoji", () => {
  const body = "a".repeat(19999) + "😀";
  const row = post("unicode-bound", "Policy", body);
  expect(row.body).toHaveLength(19999);
  expect(
    chunkKnowledge(body)
      .map((span) => span.text)
      .join(""),
  ).toBe(row.body);
});
