/** Approved ASK039 candidate; pure retrieval helpers; integration not installed.
 * Search representations cannot grant authorization or change raw identifiers. */
export function searchViews(raw: string) {
  if (typeof raw !== "string" || raw.length > 1000)
    throw Error("INVALID_QUERY");
  const original = raw.normalize("NFC");
  const unicode = original
    .normalize("NFKC")
    .toLocaleLowerCase("vi")
    .replace(/(?:\u200b|\u200c|\u200d|\ufeff)/g, "")
    .replace(/\s+/gu, " ")
    .trim();
  const folded = unicode
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
  return { raw, original, unicode, folded };
}
export function searchPhrase(raw: string) {
  let s = searchViews(raw)
    .folded.replace(/[^\p{L}\p{N},.%-]+/gu, " ")
    .trim();
  s = s.replace(
    /\b(?:cho c|cho chi|cho anh|em tim giup|tim giup|cho em xin)\b/g,
    " ",
  );
  const parts = s.split(/\s+/u);
  s = parts
    .map((w, i) =>
      ["ko", "khum", "hong"].includes(w) ||
      (w === "k" && !/^\d/.test(parts[i - 1] ?? ""))
        ? "khong"
        : w,
    )
    .join(" ");
  // Purpose aliases improve retrieval only, never medical/treatment equivalence.
  return s
    .replace(/\b(?:cong dung|chuc nang|tac dung|ten san pham)\b/g, " ")
    .replace(/\b(?:cap am|giu am|moisturizer|moisturiser)\b/g, "duong am")
    .replace(/\b(?:khong mui|khong huong lieu)\b/g, "khong huong lieu")
    .replace(/\s+/g, " ")
    .trim();
}
const polite = new Set(
  "em anh chi toi minh ban a ah nhe nha oi xin giup tim cho can muon co loai nao thi la san pham please find search product products buy looking for need want me i do you have show".split(
    " ",
  ),
);
export function productQuery(raw: string) {
  const phrase = searchPhrase(raw);
  const negativeQuestion =
    /\bco\b.*\bkhong(?:\s+(?:em|anh|chi|a|nhe|nha))*[?.!]*$/.test(phrase);
  const accentAware = searchViews(raw).unicode;
  const withoutFragrance = phrase.replace(
    /\bkhong (?:co )?(?:huong lieu|mui)\b/g,
    " ",
  );
  // Folded dung conflates dùng/đúng/đừng: explicit accents disambiguate;
  // unresolved unaccented commands still require interpretation.
  const negativeCommand =
    /\bkhong\s+(?:muon|can|mua|lay|chon|phai|thich|dung|nhan)\b/.test(phrase);
  const explicitRefusal = /(?:^|\s)đừng(?:\s|$)/u.test(accentAware);
  const ambiguousDung =
    /\bdung\b/.test(phrase) &&
    !/(?:^|\s)(?:dùng|đúng)(?:\s|$)/u.test(accentAware);
  const negativeOccurrences = withoutFragrance.match(/\bkhong\b/g)?.length ?? 0;
  const negativeIntent =
    negativeCommand ||
    explicitRefusal ||
    ambiguousDung ||
    /\b(?:chua|not|without|no)\b/.test(withoutFragrance) ||
    (/\bkhong\b/.test(withoutFragrance) &&
      (!negativeQuestion || negativeOccurrences > 1));
  // Ratios/pack arithmetic must be resolved by a typed variant parser,
  // never flattened into a qualified dosage match.
  const comparison = /\b(?:hay|hoac|or|versus|vs|loai nao tot|so sanh)\b/.test(
    phrase,
  );
  const adviceQuestion =
    /\b(?:co nen|nen dung|nen uong|mang thai|bau|cho con bu|tuong tac|tac dung phu|should i|pregnant|breastfeeding|interaction|side effects)\b/.test(
      searchViews(raw).folded,
    );
  const ratioQuantity =
    /\d\s*(?:mcg|mg|g|ml|iu|%)\s*(?:\/|tren|per|moi)\s*(?:\d+(?:[.,]\d+)?\s*)?(?:mcg|mg|g|ml|iu|%)\b/iu.test(
      searchViews(raw).folded,
    );
  const usageAdvice =
    /\b(?:dung|su dung|uong)\b.*\b(?:duoc khong|co duoc|an toan|safe)\b/.test(
      phrase,
    );
  const complexQuantity =
    /\d\s*(?:mcg|mg|g|ml|iu|%)?\s*[/×x]\s*\d/iu.test(searchViews(raw).folded) ||
    /\d\s*(?:hop|lo|chai|vien|tablets|capsules|softgels|pack)\b/iu.test(phrase);

  const strengths = strengthsIn(phrase);
  const fragranceFree = /\bkhong (?:co )?(?:huong lieu|mui)\b/.test(phrase);
  const main = phrase
    .replace(/\bkhong (?:co )?(?:huong lieu|mui)\b/g, " ")
    .replace(/\b(?:hay|thi|bao nhieu|het bn|ship|gui|van chuyen)\b.*$/, " ");
  const words = main
    .split(/\s+/)
    .filter((w) => w && !polite.has(w) && w !== "khong");
  return {
    phrase,
    terms: [...new Set(words)].slice(0, 12),
    constraints: { fragranceFree },
    strengths,
    requiresInterpretation:
      negativeIntent ||
      complexQuantity ||
      comparison ||
      usageAdvice ||
      adviceQuestion ||
      ratioQuantity,
  };
}
function near(a: string, b: string) {
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
  // Distance<=1 needs only a linear two-pointer comparison, not a DP matrix.
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (i < a.length ? 1 : 0) + (j < b.length ? 1 : 0) <= 1;
}
function strengthsIn(text: string) {
  return [
    ...text.matchAll(
      /(?<![\p{L}\p{N}])([0-9]+(?:[.,][0-9]+)?)\s*(mcg|mg|ml|iu|g|%)(?![\p{L}\p{N}])/gu,
    ),
  ].map((m) => m[1].replace(",", ".") + m[2]);
}
export function candidateScore(
  raw: string,
  row: {
    title: string;
    functions?: string;
    usage?: string;
    category?: string;
    body?: string;
  },
) {
  const q = productQuery(raw);
  // Bound each approved metadata projection. Long rows degrade independently.
  const fields = [row.title, row.category, row.functions, row.usage, row.body];
  if (
    fields.some(
      (f) => f !== undefined && (typeof f !== "string" || f.length > 1000),
    )
  )
    return 0;
  const text = fields
    .filter((f): f is string => typeof f === "string")
    .map(searchPhrase)
    .join(" ");
  if (q.requiresInterpretation) return 0;
  const strengths = strengthsIn(text);
  if (q.strengths.some((s) => !strengths.includes(s))) return 0;
  if (q.terms.some((t) => /\d/.test(t) && !text.split(/\s+/).includes(t)))
    return 0;
  if (q.constraints.fragranceFree && !/\bkhong (?:co )?huong lieu\b/.test(text))
    return 0;
  const tokens = text.split(/\s+/);
  const matched = q.terms.filter((term) => tokens.some((t) => near(term, t)));
  if (!matched.length || matched.length < Math.ceil(q.terms.length * 0.7))
    return 0;
  const titleTokens = searchPhrase(row.title).split(/\s+/);
  return matched.reduce(
    (score, term) => score + (titleTokens.includes(term) ? 3 : 1),
    0,
  );
}
export function explicitOrderReferences(raw: string) {
  searchViews(raw);
  const ids = new Set<string>();
  const re =
    /(?:m[ãa]\s+[đd][ơo]n(?:\s+h[àa]ng)?|[đd][ơo]n|order\s+(?:id|code)|(?<![\p{L}\p{N}\p{M}\p{Pc}-])track\s+(?:my\s+)?order(?=\s|$|[:#]))\s*[:#]?\s*([^\s,;:!?()[\]{}]+)(?=$|[\s,;:!?()[\]{}])/giu;
  for (const match of raw.matchAll(re)) {
    const token = match[1].replace(/[.。]$/u, "");
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,79}$/.test(token) && /[0-9-]/.test(token))
      ids.add(token);
  }
  for (const match of raw.matchAll(
    /(?<![\p{L}\p{N}\p{M}_-])[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?![\p{L}\p{N}\p{M}_-])/giu,
  ))
    ids.add(match[0]);
  return [...ids];
}
export function preferredLanguage(raw: string, current: "vi" | "en" = "vi") {
  const s = searchViews(raw).folded;
  // Explicit preference beats heuristics; sparse brand/commerce English doesn't flip VI.
  if (/\b(?:tra loi bang tieng anh|answer in english)\b/.test(s)) return "en";
  if (/\b(?:tra loi bang tieng viet|answer in vietnamese)\b/.test(s))
    return "vi";
  if (
    /\b(?:chi|anh|em|muon|gui|ve|don|hang|khong|duong|mua|giup|bao nhieu)\b/.test(
      s,
    )
  )
    return "vi";
  if (
    /\b(?:can you|could you|where is|track my|track order|how much|looking for|please find)\b/.test(
      s,
    )
  )
    return "en";
  return current;
}
