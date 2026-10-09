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

function boundedBody(body: string) {
  const text = body.slice(0, knowledgeLimits.documentCharacters);
  return /[\uD800-\uDBFF]$/.test(text) ? text.slice(0, -1) : text;
}

/** Original text spans, measured in characters, not model tokens. */
export function chunkKnowledge(
  body: string,
): { text: string; position: number }[] {
  const bounded = boundedBody(body);
  const chunks: { text: string; position: number }[] = [];
  let position = 0;
  while (position < bounded.length) {
    let paragraphBoundary = false;
    let end = Math.min(
      position + knowledgeLimits.excerptCharacters,
      bounded.length,
    );
    if (end < bounded.length) {
      const window = bounded.slice(position, end);
      // Keep sections/paragraphs intact where possible. Never rewrite policy evidence.
      let paragraph = window.lastIndexOf("\n\n");
      // A heading alone has no policy meaning; keep its original first paragraph.
      if (
        paragraph >= 0 &&
        window
          .slice(0, paragraph)
          .trim()
          .split("\n")
          .every((line) => /^\s*#{1,6}\s+/.test(line))
      )
        paragraph = -1;
      const line = window.lastIndexOf("\n");
      const sentence = Math.max(
        window.lastIndexOf(". "),
        window.lastIndexOf("。"),
      );
      const boundary =
        paragraph >= 0
          ? paragraph + 2
          : line >= 600
            ? line + 1
            : sentence >= 600
              ? sentence + 1
              : window.lastIndexOf(" ") + 1;
      if (paragraph >= 0 || boundary >= 400) {
        end = position + boundary;
        paragraphBoundary = paragraph >= 0;
      }
      // Avoid splitting UTF-16 surrogate pairs at the hard bound.
      if (/^[\uDC00-\uDFFF]$/.test(bounded[end] ?? "")) end--;
    }
    chunks.push({ text: bounded.slice(position, end), position });
    // Long sections retain a small contiguous context window. Small paragraph
    // chunks stay disjoint; every iteration must advance beyond its start.
    let next = end;
    if (!paragraphBoundary && end < bounded.length && end - position >= 600) {
      const overlapStart = end - 160;
      const space = bounded.indexOf(" ", overlapStart);
      next = space >= overlapStart && space < end ? space + 1 : overlapStart;
      if (/^[\uDC00-\uDFFF]$/.test(bounded[next] ?? "")) next++;
    }
    position = next;
  }
  return chunks;
}

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

/** Retrieval tolerance only: never rewrite identifiers, numbers or evidence. */
function nearTerm(a: string, b: string) {
  if (
    a.length < 5 ||
    b.length < 5 ||
    /\p{N}/u.test(a + b) ||
    Math.abs(a.length - b.length) > 1
  )
    return false;
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
  return edits + Number(i < a.length) + Number(j < b.length) <= 1;
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
    body: boundedBody(row.body),
  };
}

export function retrieveKnowledge(
  documents: readonly KnowledgeDocument[],
  question: string,
  maximum: number = knowledgeLimits.excerpts,
  selection: "diverse" | "coverage" = "diverse",
): KnowledgeExcerpt[] {
  const terms = [...new Set(tokens(question.slice(0, 1000)))].filter(
    (term) => term.length > 1 && !stopwords.has(term),
  );
  if (!terms.length) return [];
  const candidates: (KnowledgeExcerpt & {
    score: number;
    position: number;
    matched: string[];
  })[] = [];
  const unique = new Map<string, KnowledgeDocument>();
  const conflicts = new Set<string>();
  for (const document of documents.slice(0, knowledgeLimits.documents)) {
    const previous = unique.get(document.id);
    if (
      previous &&
      (previous.title !== document.title || previous.body !== document.body)
    )
      conflicts.add(document.id);
    else unique.set(document.id, document);
  }
  // Resolve typo candidates once against eligible evidence. Competing spellings
  // are ambiguous; an exact corpus term always disables fuzzy expansion.
  const vocabulary = new Set<string>();
  for (const document of unique.values()) {
    if (conflicts.has(document.id)) continue;
    for (const word of tokens(
      document.title + " " + boundedBody(document.body),
    ))
      vocabulary.add(word);
  }
  const resolved = terms.map((term) => {
    if (vocabulary.has(term)) return { term, fuzzy: false };
    let match: string | undefined;
    for (const word of vocabulary) {
      if (!nearTerm(term, word)) continue;
      if (match !== undefined) return { term, fuzzy: false };
      match = word;
    }
    return { term: match ?? term, fuzzy: match !== undefined };
  });
  // Two publications with the same citation but different content are ambiguous.
  for (const document of unique.values()) {
    if (conflicts.has(document.id)) continue;
    const titleTokens = new Set(tokens(document.title));
    for (const { text, position } of chunkKnowledge(document.body)) {
      if (!text.trim()) continue;
      const bodyTokens = new Set(tokens(text));
      const score = resolved.reduce(
        (total, { term, fuzzy }) =>
          total +
          (titleTokens.has(term) ? (fuzzy ? 1 : 2) : 0) +
          (bodyTokens.has(term) ? (fuzzy ? 1 : 3) : 0),
        0,
      );
      if (score)
        candidates.push({
          id: document.id,
          title: document.title,
          text,
          score,
          position,
          matched: resolved
            .filter(({ term }) => bodyTokens.has(term))
            .map(({ term }) => term),
        });
    }
  }
  candidates.sort(
    (a, b) =>
      b.score - a.score || a.id.localeCompare(b.id) || a.position - b.position,
  );
  const result: KnowledgeExcerpt[] = [];
  const seen = new Map<string, number>();
  let characters = 0;
  const limit = Number.isFinite(maximum)
    ? Math.max(0, Math.min(Math.floor(maximum), knowledgeLimits.excerpts))
    : 0;
  if (selection === "coverage") {
    const covered = new Set<string>();
    const remaining = [...candidates];
    while (result.length < limit && remaining.length) {
      const gain = (candidate: (typeof candidates)[number]) =>
        candidate.matched.filter((term) => !covered.has(term)).length;
      remaining.sort(
        (a, b) =>
          gain(b) - gain(a) ||
          (seen.get(a.id) ?? 0) - (seen.get(b.id) ?? 0) ||
          b.score - a.score ||
          a.id.localeCompare(b.id) ||
          a.position - b.position,
      );
      const candidate = remaining.shift()!;
      if (
        (seen.get(candidate.id) ?? 0) >= 2 ||
        result.some(
          (row) => row.id === candidate.id && row.text === candidate.text,
        )
      )
        continue;
      const size =
        candidate.id.length + candidate.title.length + candidate.text.length;
      if (characters + size > knowledgeLimits.contextCharacters) continue;
      characters += size;
      candidate.matched.forEach((term) => covered.add(term));
      seen.set(candidate.id, (seen.get(candidate.id) ?? 0) + 1);
      result.push({
        id: candidate.id,
        title: candidate.title,
        text: candidate.text,
      });
    }
    return result;
  }
  // First diversify sources; then add one complementary span per source.
  for (const pass of [0, 1])
    for (const candidate of candidates) {
      if (result.length >= limit) break;
      if ((seen.get(candidate.id) ?? 0) !== pass) continue;
      if (
        result.some(
          (row) => row.id === candidate.id && row.text === candidate.text,
        )
      )
        continue;
      const size =
        candidate.id.length + candidate.title.length + candidate.text.length;
      if (characters + size > knowledgeLimits.contextCharacters) continue;
      characters += size;
      seen.set(candidate.id, pass + 1);
      result.push({
        id: candidate.id,
        title: candidate.title,
        text: candidate.text,
      });
    }
  return result;
}
