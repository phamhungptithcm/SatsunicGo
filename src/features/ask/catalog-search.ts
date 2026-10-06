import {
  productQuery,
  searchViews,
} from "../../../packages/domain/ask-language-query";
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { catalogMatchScore } from "../../../packages/domain/catalog-search";
import { db } from "../../shared/firebase";
import type { ContentRow } from "../../shared/public-content";
export type CatalogSearchResult = {
  rows: ContentRow[];
  cursor: string | null;
  hasMore: boolean;
  stale: boolean;
};
type Page = {
  rows: ContentRow[];
  cursor: string | null;
  hasMore: boolean;
  stale: boolean;
  expires: number;
};
// Published content only. Bounded in-memory TTL; never stores orders or identity.
const pages = new Map<string, Page>();
const inflight = new Map<string, Promise<Page>>();
const searches = new Map<
  string,
  { result: CatalogSearchResult; expires: number }
>();
function boundedRead<T>(read: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      finished = true;
      reject(new Error("CATALOG_READ_TIMEOUT"));
    }, 5000);
    read.then(
      (value) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
function forConsumer<T>(read: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      signal.removeEventListener("abort", cancel);
      reject(signal.reason);
    };
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) cancel();
    read.then(
      (value) => {
        signal.removeEventListener("abort", cancel);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", cancel);
        reject(error);
      },
    );
  });
}
async function page(after: string | null): Promise<Page> {
  const key = after ?? "";
  const cached = pages.get(key);
  if (cached && cached.expires > Date.now() && navigator.onLine) return cached;
  const pending = inflight.get(key);
  if (pending) return pending;
  if (!db) throw Error("CATALOG_UNAVAILABLE");
  if (inflight.size >= 10) throw Error("CATALOG_BUSY");
  const request = boundedRead(
    getDocs(
      query(
        collection(db, "products"),
        where("status", "==", "published"),
        orderBy(documentId()),
        ...(after ? [startAfter(after)] : []),
        limit(100),
      ),
    ),
  )
    .then((snapshot) => {
      const result: Page = {
        rows: snapshot.docs.flatMap((d) => {
          const row = d.data();
          // Legacy or malformed public records must not break unrelated search.
          return typeof row.title === "string" &&
            row.title.trim() &&
            typeof row.slug === "string" &&
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) &&
            row.slug.length >= 2 &&
            row.slug.length <= 100
            ? [{ ...row, id: d.id } as ContentRow]
            : [];
        }),
        cursor: snapshot.docs.at(-1)?.id ?? after,
        hasMore: snapshot.size === 100,
        stale: snapshot.metadata.fromCache || !navigator.onLine,
        expires: Date.now() + 60_000,
      };
      if (!result.stale) {
        if (pages.size >= 10) pages.delete(pages.keys().next().value!);
        pages.set(key, result);
      }
      return result;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}
export async function searchPublishedCatalog(
  question: string,
  signal: AbortSignal,
  after: string | null = null,
): Promise<CatalogSearchResult> {
  signal.throwIfAborted();
  if (question.length > 1000) throw Error("INVALID_QUERY");
  const parsed = productQuery(question);
  const key = JSON.stringify([
    "language-v2",
    searchViews(question).folded,
    parsed.constraints,
    parsed.strengths,
    parsed.requiresInterpretation,
    after,
  ]);
  const cached = searches.get(key);
  if (cached && cached.expires > Date.now() && navigator.onLine)
    return { ...cached.result, rows: [...cached.result.rows] };
  let cursor = after,
    hasMore = true,
    stale = false;
  const matches: ContentRow[] = [];
  // Yield results quickly; explicit continuation keeps later products reachable.
  for (let count = 0; count < 5 && hasMore && matches.length < 8; count++) {
    signal.throwIfAborted();
    const result = await forConsumer(page(cursor), signal);
    signal.throwIfAborted();
    hasMore = result.hasMore;
    stale ||= result.stale;
    for (const row of result.rows) {
      cursor = row.id;
      if (catalogMatchScore(question, row) > 0) matches.push(row);
      if (matches.length === 8) {
        hasMore = result.rows.at(-1)?.id !== cursor || result.hasMore;
        break;
      }
    }
    if (matches.length < 8) cursor = result.cursor;
  }
  const result: CatalogSearchResult = {
    rows: matches.sort(
      (a, b) => catalogMatchScore(question, b) - catalogMatchScore(question, a),
    ),
    cursor,
    hasMore,
    stale,
  };
  if (!stale) {
    if (searches.size >= 20) searches.delete(searches.keys().next().value!);
    searches.set(key, { result, expires: Date.now() + 60_000 });
  }
  return { ...result, rows: [...result.rows] };
}
