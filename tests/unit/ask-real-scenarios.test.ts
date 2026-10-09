import { expect, test } from "vitest";
import {
  chunkKnowledge,
  publishedKnowledge,
  retrieveKnowledge,
} from "../../functions/src/ai/knowledge-retrieval";
import { knowledgeSource } from "../../functions/src/ai/approved-knowledge";

const corpus = [
  {
    slug: "qa-shipping",
    title: "Vận chuyển | Shipping",
    body: "Vận chuyển: shipping requires a confirmed direction and weight. Không cam kết ngày nhận hàng. No delivery guarantee.",
  },
  {
    slug: "qa-returns",
    title: "Đổi trả | Returns",
    body: "Đổi trả: return eligibility requires review. Ngoại lệ: custom goods are excluded. Refund approval is separate from payment.",
  },
  {
    slug: "qa-membership",
    title: "Membership",
    body: "Membership: paid purchase creates a pending invoice. Gói miễn phí được kích hoạt theo điều kiện. Renewal intent does not extend entitlement.",
  },
  {
    slug: "qa-address",
    title: "Địa chỉ | Address",
    body: "Hồ sơ và địa chỉ: address save requires verified owner access. Unknown save outcomes must be resolved before another save.",
  },
  {
    slug: "qa-invoice",
    title: "Hóa đơn | Invoice",
    body: "Hóa đơn: invoice pending is not paid. Thanh toán chỉ được xác nhận qua luồng thanh toán đã xác minh.",
  },
].map((row) => publishedKnowledge({ ...row, status: "published" })!);

const happyQueries: [string, string, string][] = [
  ["Q01", "vận chuyển", "qa-shipping"],
  ["Q02", "van chuyen", "qa-shipping"],
  ["Q03", "VẬN CHUYỂN?", "qa-shipping"],
  ["Q04", "vận chuyển", "qa-shipping"],
  ["Q05", "shipping", "qa-shipping"],
  ["Q06", "shippng", "qa-shipping"],
  ["Q07", "Cho mình hỏi về vận chuyển với", "qa-shipping"],
  ["Q08", "đổi trả", "qa-returns"],
  ["Q09", "doi tra", "qa-returns"],
  ["Q10", "return eligibility", "qa-returns"],
  ["Q11", "return exceptions", "qa-returns"],
  ["Q12", "membership", "qa-membership"],
  ["Q13", "membershp", "qa-membership"],
  ["Q14", "renewal intent", "qa-membership"],
  ["Q15", "địa chỉ", "qa-address"],
  ["Q16", "dia chi", "qa-address"],
  ["Q17", "address save", "qa-address"],
  ["Q18", "addresss", "qa-address"],
  ["Q19", "hóa đơn", "qa-invoice"],
  ["Q20", "hoa don", "qa-invoice"],
  ["Q21", "invoice", "qa-invoice"],
  ["Q22", "invoce", "qa-invoice"],
];
test.each(happyQueries)(
  "%s natural query %s retrieves original evidence",
  (_id, question, slug) => {
    const result = retrieveKnowledge(corpus, question);
    expect(result[0]?.id).toBe(`post:${slug}`);
    for (const excerpt of result) {
      const source = corpus.find((row) => row.id === excerpt.id)!;
      expect(source.body).toContain(excerpt.text);
      expect(excerpt.title).toBe(source.title);
    }
  },
);

test.each([
  "",
  "toi co the hoi gi khong",
  "xylophoniczz",
  "còn cái đó thì sao?",
  "what about that?",
  "vc",
  "order12346",
])("no support: %s produces no invented excerpt", (question) => {
  expect(retrieveKnowledge(corpus, question)).toEqual([]);
});

test.each(["١٢٣٤٥", "１２３４５", "१२३४५"])(
  "Unicode numeric reference %s is never typo-corrected",
  (digits) => {
    const row = publishedKnowledge({
      status: "published",
      slug: "numeric-reference",
      title: "Guide",
      body: `order${digits}`,
    })!;
    const altered = `order${digits.slice(0, -1)}${digits[0]}`;
    expect(retrieveKnowledge([row], altered)).toEqual([]);
  },
);

test("atomic rich table rows never become orphaned overlap tails", () => {
  const cell = (text: string, type = "tableCell") => ({
    type,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });
  const root = {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              cell("Route", "tableHeader"),
              cell("Weight kg", "tableHeader"),
              cell("Price VND", "tableHeader"),
            ],
          },
          ...Array.from({ length: 4 }, (_, i) => ({
            type: "tableRow",
            content: [
              cell(`QA-route-${i} ` + "detail ".repeat(100)),
              cell("2 kg"),
              cell("Synthetic price only"),
            ],
          })),
        ],
      },
    ],
  };
  const source = knowledgeSource({
    status: "published",
    slug: "table-guide",
    title: "Synthetic rates",
    body: root,
  })!;
  expect(source).not.toBeNull();
  const spans = chunkKnowledge(source.document.body);
  for (const span of spans) {
    expect(span.text.trimStart()).toMatch(/^Route \| Weight kg \| Price VND/);
    expect(source.document.body).toContain(span.text);
  }
});

test("multi-goal query keeps both relevant source families", () => {
  const result = retrieveKnowledge(corpus, "shipping và membership");
  expect(result.map((row) => row.id)).toContain("post:qa-shipping");
  expect(result.map((row) => row.id)).toContain("post:qa-membership");
});

test("negated question preserves the source refusal; retrieval is not action consent", () => {
  const result = retrieveKnowledge(corpus, "không muốn renewal membership");
  expect(result[0].text).toContain("does not extend entitlement");
  expect(result.every((row) => !("action" in row))).toBe(true);
});

test("deterministic long Unicode corpus keeps contiguous provenance and bounds", () => {
  for (let length = 0; length < 22000; length += 337) {
    const body = "Điều kiện 😀 abc\n\nNgoại lệ é | kg | VND\n"
      .repeat(600)
      .slice(0, length);
    const spans = chunkKnowledge(body),
      limit = Math.min(length, 20000);
    if (!limit) {
      expect(spans).toEqual([]);
      continue;
    }
    expect(spans[0].position).toBe(0);
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      expect(span.text.length).toBeGreaterThan(0);
      expect(span.text.length).toBeLessThanOrEqual(1200);
      expect(span.text).toBe(
        body.slice(span.position, span.position + span.text.length),
      );
      if (i) {
        expect(span.position).toBeGreaterThan(spans[i - 1].position);
        expect(span.position).toBeLessThanOrEqual(
          spans[i - 1].position + spans[i - 1].text.length,
        );
      }
    }
    const actualEnd = spans.at(-1)!.position + spans.at(-1)!.text.length;
    expect(actualEnd).toBeGreaterThanOrEqual(limit - 1);
    expect(actualEnd).toBeLessThanOrEqual(limit);
  }
});
