import { test } from "vitest";
import assert from "node:assert/strict";
import {
  searchViews,
  productQuery,
  candidateScore,
  explicitOrderReferences,
  preferredLanguage,
} from "../../packages/domain/ask-language-query";
const row = {
  title: "CeraVe Kem dưỡng ẩm",
  functions: "Dưỡng ẩm cho da khô",
  usage: "Không hương liệu",
};
test("retains raw message and normalizes decomposed/compatibility search only", () => {
  assert.equal(searchViews("ＴÌＭ ＣｅｒａＶｅ").folded, "tim cerave");
  assert.equal(searchViews("vận chuyển").folded, "van chuyen");
  assert.equal(searchViews("ABC-123 10000mcg").original, "ABC-123 10000mcg");
});
test("polite/noaccent/alias/ordinary label typo candidates remain reachable", () => {
  for (const q of [
    "chị cần kem dưỡng ẩm cho da khô ạ",
    "cho c xin kem duong aam",
    "kem giữ ẩm",
    "có kem cấp ẩm không em",
    "em tìm giúp chị CeraVe dưỡng ẩm nhé",
    "ＴÌＭ ＣｅｒａＶｅ",
    "kem duong am ko mui",
  ])
    assert.ok(candidateScore(q, row) > 0, q);
});
test("fragrance constraint must exist in approved row", () => {
  assert.equal(
    candidateScore("kem duong am ko mui", {
      title: "Kem dưỡng ẩm",
      usage: "Có hương liệu",
    }),
    0,
  );
  assert.equal(productQuery("kem ko mui").constraints.fragranceFree, true);
});
test("noaccent explicit order prefix retains exact original ID", () => {
  for (const q of ["ma don ABC-123 toi dau roi", "đơn ABC-123 đến chưa em"])
    assert.deepEqual(explicitOrderReferences(q), ["ABC-123"]);
  assert.deepEqual(explicitOrderReferences("đơn này"), []);
});
test("multiple references do not silently pick an order", () =>
  assert.deepEqual(
    explicitOrderReferences("mã đơn ABC-123 và mã đơn DEF-456"),
    ["ABC-123", "DEF-456"],
  ));
test("wrong/fullwidth order ID is not fuzzy repaired", () => {
  assert.deepEqual(explicitOrderReferences("ma don ＡＢＣ-１２３"), []);
  assert.deepEqual(explicitOrderReferences("ma don ABC-124"), ["ABC-124"]);
});
test("Vietnamese main sentence survives sparse English; English supported", () => {
  assert.equal(preferredLanguage("chị muốn buy chai này"), "vi");
  assert.equal(preferredLanguage("what kem dưỡng ẩm có không em"), "vi");
  assert.equal(preferredLanguage("Can you track my order?"), "en");
});
test("explicit language preference supersedes prior locale", () => {
  assert.equal(preferredLanguage("em tra loi bang tieng anh"), "en");
  assert.equal(preferredLanguage("answer in vietnamese", "en"), "vi");
});
test("input bound rejects oversized text", () =>
  assert.throws(() => searchViews("x".repeat(1001))));
test("negative selection waits semantic interpretation rather than stripping no", () => {
  assert.equal(
    productQuery("chị không muốn kem dưỡng ẩm").requiresInterpretation,
    true,
  );
  assert.equal(candidateScore("chị không muốn kem dưỡng ẩm", row), 0);
});
test("numeric strength is never softened by partial/fuzzy match", () =>
  assert.equal(
    candidateScore("vitamin 10000mcg", { title: "vitamin 1000mg" }),
    0,
  ));
test("separated or attached strength units never imply dosage equivalence", () => {
  for (const q of [
    "vitamin c 1000 mg",
    "vitamin c 1000mg",
    "vitamin c 1,5 mg",
    "vitamin c 1.5 mg",
    "vitamin c 10 %",
    "vitamin c 10 IU",
  ])
    assert.equal(candidateScore(q, { title: "vitamin c 1000 mcg" }), 0);
  assert.ok(
    candidateScore("vitamin c 1000 mg", { title: "vitamin c 1000 mg" }) > 0,
  );
});
test("general refusal cannot become positive product intent", () => {
  for (const q of [
    "không cần kem dưỡng ẩm",
    "không mua kem dưỡng ẩm",
    "đừng lấy kem dưỡng ẩm",
    "không phải kem này",
    "chưa nhận được kem",
    "not moisturizing cream",
  ]) {
    assert.equal(productQuery(q).requiresInterpretation, true);
    assert.equal(
      candidateScore(q, { title: "kem dưỡng ẩm moisturizing cream" }),
      0,
    );
  }
});
test("whole raw Unicode identifier rejected rather than truncated", () => {
  for (const q of [
    "ma don ABC-123４",
    "ma don ＡBC-123",
    "ma don ABC-123é",
    "ma don ABC-123\u0301",
    "ma don ABC-123_4",
  ])
    assert.deepEqual(explicitOrderReferences(q), []);
  assert.deepEqual(explicitOrderReferences("ma don ABC-123, ma don DEF-456"), [
    "ABC-123",
    "DEF-456",
  ]);
});
test("bounded metadata does not throw or lose exact raw input", () => {
  assert.doesNotThrow(() =>
    candidateScore("kem dưỡng ẩm", {
      title: "kem dưỡng ẩm",
      functions: "x".repeat(900),
      usage: "x".repeat(900),
    }),
  );
  assert.equal(candidateScore("kem", { title: "x".repeat(1001) }), 0);
  const raw = "e\u0301";
  assert.equal(searchViews(raw).raw, raw);
});
test("fragrance-free constraint does not mask separate refusal", () => {
  for (const q of [
    "không mua kem dưỡng ẩm không hương liệu",
    "không cần kem không mùi",
    "không lấy cerave không hương liệu",
  ]) {
    assert.equal(productQuery(q).requiresInterpretation, true);
    assert.equal(
      candidateScore(q, { title: "kem dưỡng ẩm cerave không hương liệu" }),
      0,
    );
  }
});
test("accented dùng differs from refusal đừng; unaccented remains ambiguous", () => {
  assert.equal(
    productQuery("cho chị kem dùng dưỡng ẩm").requiresInterpretation,
    false,
  );
  assert.ok(
    candidateScore("cho chị kem dùng dưỡng ẩm", {
      title: "kem dùng dưỡng ẩm",
    }) > 0,
  );
  for (const q of ["đừng lấy kem dưỡng ẩm", "dung lay kem duong am"])
    assert.equal(productQuery(q).requiresInterpretation, true);
});
test("ratio and pack syntax require variant interpretation", () => {
  for (const q of [
    "vitamin c 1000 mcg/1 ml",
    "vitamin c 1000 mg x 2",
    "vitamin c 1000 mg × 2",
    "vitamin c 200 viên",
  ])
    assert.equal(productQuery(q).requiresInterpretation, true);
});
test("explicit refusal dominates a later question or ingredient exception", () => {
  for (const q of [
    "chị không muốn kem dưỡng ẩm không hương liệu",
    "không muốn kem dưỡng ẩm, có loại khác không em",
    "có kem không em nhưng chị không mua",
    "có kem không hương liệu nhưng không cần kem dưỡng ẩm",
  ]) {
    assert.equal(productQuery(q).requiresInterpretation, true);
    assert.equal(
      candidateScore(q, { title: "kem dưỡng ẩm không hương liệu" }),
      0,
    );
  }
});

test("bilingual ordinary purpose alias remains retrieval only", () => {
  assert.ok(candidateScore("CeraVe moisturizer cho da khô", row) > 0);
});
test("comparison and usage advice do not become single-product match", () => {
  for (const q of [
    "kem dưỡng ẩm hay dầu cá loại nào tốt",
    "em dùng cerave được không",
    "cerave hoặc cetaphil",
    "cerave vs cetaphil",
  ]) {
    assert.equal(productQuery(q).requiresInterpretation, true);
    assert.equal(candidateScore(q, row), 0);
  }
});
test("exact title weight3 and context weight1 survive search upgrade", () => {
  assert.equal(candidateScore("cerave", { title: "cerave" }), 3);
  assert.equal(candidateScore("cerave", { title: "kem", body: "cerave" }), 1);
  assert.equal(
    candidateScore("cerave", { title: "kem", category: "cerave" }),
    1,
  );
});
test("published category and body provide bounded purpose evidence", () => {
  assert.ok(
    candidateScore("kem dưỡng ẩm không hương liệu", {
      title: "kem",
      category: "dưỡng ẩm",
      body: "không hương liệu",
    }) > 0,
  );
  assert.equal(
    candidateScore("kem", { title: "kem", body: "x".repeat(1001) }),
    0,
  );
});
test("sentence punctuation keeps raw ASCII ID while Unicode suffix stays rejected", () => {
  assert.deepEqual(explicitOrderReferences("Order ID: order-42."), [
    "order-42",
  ]);
  for (const q of [
    "ma don ABC-123４.",
    "ma don ABC-123.４",
    "ma don ABC-123é.",
  ])
    assert.deepEqual(explicitOrderReferences(q), []);
});
test("published purpose phrases and English polite-only inputs preserve original behavior", () => {
  assert.ok(
    candidateScore("công dụng dưỡng ẩm", {
      title: "kem",
      functions: "dưỡng ẩm",
    }) > 0,
  );
  assert.deepEqual(productQuery("please find products").terms, []);
});
test("concentration ratios keep relation even without denominator number", () => {
  for (const q of [
    "vitamin c 1000 mcg / ml",
    "vitamin c 1000mcg/ml",
    "vitamin c 1000 mcg trên 1 ml",
    "vitamin c 1000 mcg per ml",
  ]) {
    assert.equal(productQuery(q).requiresInterpretation, true);
    assert.equal(candidateScore(q, { title: "vitamin c 1000 mcg 1 ml" }), 0);
  }
});
test("advice or pregnancy questions cannot be ordinary purchase matches", () => {
  for (const q of [
    "có nên dùng kem dưỡng ẩm không",
    "chị đang mang thai dùng cerave được không",
    "should i use cerave",
    "vitamin c có tác dụng phụ không",
  ]) {
    assert.equal(productQuery(q).requiresInterpretation, true);
    assert.equal(
      candidateScore(q, { title: "cerave kem dưỡng ẩm vitamin c" }),
      0,
    );
  }
});

test("linear edit matcher agrees with reference DP on exhaustive small words", () => {
  const words: string[] = [];
  const build = (s: string, n: number) => {
    if (!n) {
      words.push(s);
      return;
    }
    for (const c of ["a", "b", "c"]) build(s + c, n - 1);
  };
  build("", 4);
  for (const word of ["aaaab", "bbbba", "cccca"]) words.push(word);
  const reference = (a: string, b: string) => {
    if (a === b) return true;
    if (
      !/\d/.test(a + b) &&
      a.length >= 3 &&
      /([a-z])\1/.test(a) &&
      a.replace(/([a-z])\1/g, "$1") === b
    )
      return true;
    if (
      a.length < 4 ||
      b.length < 4 ||
      /\d/.test(a + b) ||
      Math.abs(a.length - b.length) > 1
    )
      return false;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const curr = [i];
      for (let j = 1; j <= b.length; j++)
        curr[j] = Math.min(
          curr[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      prev = curr;
    }
    return prev[b.length] <= 1;
  };
  for (const a of words)
    for (const b of words)
      assert.equal(
        candidateScore(a, { title: b }) > 0,
        reference(a, b),
        a + " " + b,
      );
});

test("ratios protect complete multi-digit and decimal denominator grammar", () => {
  for (const q of [
    "vitamin c 1000 mcg trên 10 ml",
    "vitamin c 1000 mcg per 1.5 ml",
    "vitamin c 1000 mcg mỗi 1,5 ml",
    "vitamin c 1000mcg/100ml",
  ]) {
    assert.equal(productQuery(q).requiresInterpretation, true, q);
    assert.equal(
      candidateScore(q, {
        title: "vitamin c 1000 mcg 10 ml 1.5 ml 1,5 ml 100ml",
      }),
      0,
      q,
    );
  }
});
