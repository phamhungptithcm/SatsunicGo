/** Request-local lexical retrieval; never treats a bounded scan as a full corpus. */
export const knowledgeLimits = {
  documents: 100,
  documentCharacters: 20_000,
  excerptCharacters: 1_200,
  excerpts: 8,
  contextCharacters: 12_000,
} as const;

export type KnowledgeDocument = { id: string; title: string; body: string };
export type KnowledgeExcerpt = { id: string; title: string; text: string };

const stopwords = new Set(
  "a an the is are to of for and or how what i my you can do does please la va cua cho toi minh ban co khong nhu the nao gi voi mot nhung duoc xin hoi".split(
    " ",
  ),
);
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}
function tokens(value: string) {
  return normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function publishedKnowledge(value: unknown): KnowledgeDocument | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    row.status !== "published" ||
    typeof row.slug !== "string" ||
    !/^[a-z0-9-]{2,100}$/.test(row.slug) ||
    typeof row.title !== "string" ||
    !row.title.trim() ||
    row.title.length > 200 ||
    typeof row.body !== "string" ||
    !row.body.trim()
  )
    return null;
  return {
    id: `post:${row.slug}`,
    title: row.title,
    body: row.body.slice(0, knowledgeLimits.documentCharacters),
  };
}

export function retrieveKnowledge(
  documents: readonly KnowledgeDocument[],
  question: string,
  maximum: number = knowledgeLimits.excerpts,
): KnowledgeExcerpt[] {
  const terms = [...new Set(tokens(question.slice(0, 1000)))].filter(
    (term) => term.length > 1 && !stopwords.has(term),
  );
  if (!terms.length) return [];
  const candidates: (KnowledgeExcerpt & { score: number; position: number })[] =
    [];
  for (const document of documents.slice(0, knowledgeLimits.documents)) {
    const titleTokens = new Set(tokens(document.title));
    const body = document.body.slice(0, knowledgeLimits.documentCharacters);
    // Overlap preserves phrases across window boundaries, without rewriting evidence.
    for (let position = 0; position < body.length; position += 1000) {
      const text = body.slice(
        position,
        position + knowledgeLimits.excerptCharacters,
      );
      const bodyTokens = new Set(tokens(text));
      const score = terms.reduce(
        (total, term) =>
          total +
          (titleTokens.has(term) ? 2 : 0) +
          (bodyTokens.has(term) ? 1 : 0),
        0,
      );
      if (score)
        candidates.push({
          id: document.id,
          title: document.title,
          text,
          score,
          position,
        });
    }
  }
  candidates.sort(
    (a, b) =>
      b.score - a.score || a.id.localeCompare(b.id) || a.position - b.position,
  );
  const result: KnowledgeExcerpt[] = [];
  const seen = new Set<string>();
  let characters = 0;
  const limit = Number.isFinite(maximum)
    ? Math.max(0, Math.min(Math.floor(maximum), knowledgeLimits.excerpts))
    : 0;
  for (const candidate of candidates) {
    if (result.length >= limit) break;
    // One best excerpt per source prevents repeated title matches crowding out sources.
    if (seen.has(candidate.id)) continue;
    const size =
      candidate.id.length + candidate.title.length + candidate.text.length;
    if (characters + size > knowledgeLimits.contextCharacters) continue;
    characters += size;
    seen.add(candidate.id);
    result.push({
      id: candidate.id,
      title: candidate.title,
      text: candidate.text,
    });
  }
  return result;
}
