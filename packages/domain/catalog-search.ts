import {
  candidateScore,
  productQuery,
  searchViews,
} from "./ask-language-query";
export function normalizeCatalogText(value: string) {
  return searchViews(value.slice(0, 1000))
    .folded.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function catalogSearchTerms(question: string) {
  if (question.length > 1000) return [];
  return productQuery(question).terms;
}
export function catalogMatchScore(
  question: string,
  row: {
    title: string;
    category?: string;
    functions?: string;
    usage?: string;
    body?: string;
  },
) {
  if (question.length > 1000) return 0;
  // Search metadata is a bounded projection, never variant/availability authority.
  const projection: {
    title: string;
    category?: string;
    functions?: string;
    usage?: string;
    body?: string;
  } = { title: row.title };
  for (const key of [
    "title",
    "category",
    "functions",
    "usage",
    "body",
  ] as const) {
    const value = row[key];
    if (value !== undefined && typeof value !== "string") return 0;
    if (typeof value === "string") projection[key] = value.slice(0, 1000);
  }
  return candidateScore(question, projection);
}
export function catalogSearchIntent(question: string) {
  if (question.length > 1000) return false;
  const text = normalizeCatalogText(question);
  if (!text || productQuery(question).requiresInterpretation) return false;
  if (
    /\b(?:ma don|don hang|don nay|don do|track my|tracking|order id|order code)\b/.test(
      text,
    )
  )
    return false;
  if (/^(?:xin chao|chao|hello|hi|cam on|thanks|thank you)$/.test(text))
    return false;
  if (
    /\b(?:da thanh toan|chuyen khoan|tien coc|so du|bao gia|payment|paid|deposit|balance|quote)\b/.test(
      text,
    ) &&
    !/\b(?:tim|kiem|find|search|product|san pham)\b/.test(text)
  )
    return false;
  // Polite availability requests remain read-only catalog intent; a match
  // cannot grant buying authority or bypass the explicit checkout workflow.
  const politeProductRequest =
    /\b(?:can|muon|co|xin|cho|need|want|have)\b/.test(text) &&
    /\b(?:kem|duong am|cap am|vitamin|dau ca|sua rua mat|serum|son|cleanser|cream|moisturizer|supplement|san pham)\b/.test(
      text,
    );
  return (
    politeProductRequest ||
    /\b(tim|kiem|mua|san pham|cong dung|find|search|buy|product)\b/.test(
      text,
    ) ||
    (text.split(" ").length <= 6 && !/[?？]/.test(question))
  );
}

// Explicit browsing can continue an incomplete public search without requiring
// an AI answer first. A custom purchase request keeps its draft fallback.
export function catalogBrowseIntent(question: string) {
  return /\b(?:tim|kiem|find|search)\b/.test(normalizeCatalogText(question));
}
