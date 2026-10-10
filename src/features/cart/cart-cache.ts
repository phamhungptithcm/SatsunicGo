import {
  collection,
  documentId,
  getDocsFromServer,
  query,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { app, db } from "../../shared/firebase";
import type { ContentRow } from "../../shared/public-content";

const key = `satsunicgo-cart-products-v1:${app?.options.projectId ?? "unconfigured"}`;
const ttl = 5 * 60_000;
const cache = new Map<string, { row: ContentRow; at: number }>();
const flights = new Map<string, Promise<ProductResult>>();
export type ProductResult = {
  rows: Record<string, ContentRow>;
  cached: boolean;
  error: string;
};
function hydrate() {
  if (cache.size) return;
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    if (!Array.isArray(saved)) return;
    for (const entry of saved.slice(-100)) {
      if (
        entry &&
        typeof entry.at === "number" &&
        entry.at <= Date.now() &&
        entry.row?.status === "published" &&
        typeof entry.row.id === "string" &&
        typeof entry.row.title === "string"
      )
        cache.set(entry.row.id, entry);
    }
  } catch {
    /* Product previews remain optional. */
  }
}
async function readProducts(
  database: NonNullable<typeof db>,
  ids: string[],
): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  try {
    const snapshot = await getDocsFromServer(
      query(
        collection(database, "products"),
        where("status", "==", "published"),
        where(documentId(), "in", ids),
      ),
    );
    return snapshot.docs;
  } catch (e) {
    if ((e as { code?: string }).code !== "permission-denied") throw e;
    // A removed/private ID can reject a whole public query. Isolate unreadable
    // rows without inferring private details or hiding other current prices.
    if (ids.length === 1) return [];
    const docs = [];
    for (let offset = 0; offset < ids.length; offset += 4) {
      const rows = await Promise.all(
        ids.slice(offset, offset + 4).map((id) => readProducts(database, [id])),
      );
      docs.push(...rows.flat());
    }
    return docs;
  }
}
export async function cartProducts(ids: string[]): Promise<ProductResult> {
  // Account and not-yet-transferred guest carts can each contain30 choices.
  const bounded = [...new Set(ids)].sort().slice(0, 60);
  if (!bounded.length) return { rows: {}, cached: false, error: "" };
  hydrate();
  const signature = JSON.stringify(bounded);
  const existing = flights.get(signature);
  if (existing) return existing;
  const load = (async () => {
    const old = Object.fromEntries(
      bounded.flatMap((id) =>
        cache.has(id) ? [[id, cache.get(id)!.row]] : [],
      ),
    );
    try {
      if (!db || !navigator.onLine) throw Error("OFFLINE");
      const database = db;
      const batches = [bounded.slice(0, 30), bounded.slice(30)].filter(
        (batch) => batch.length,
      );
      const snapshots = await Promise.all(
        batches.map((batch) => readProducts(database, batch)),
      );
      const rows: Record<string, ContentRow> = {};
      snapshots.flat().forEach((d) => {
        const data = d.data();
        // Cache only public fields used by the cart; never retain arbitrary records.
        const row = {
          id: d.id,
          title: data.title,
          slug: data.slug,
          body: "",
          status: data.status,
          version: data.version,
          market: data.market,
          listedPrice: data.listedPrice,
          orderable: data.orderable,
          termsVersion: data.termsVersion,
          catalogOptions: data.catalogOptions ?? [],
          variants: data.variants,
          mediaId: data.mediaId,
          mediaAlt: data.mediaAlt,
        } as ContentRow;
        rows[d.id] = row;
        cache.delete(d.id);
        cache.set(d.id, { row, at: Date.now() });
      });
      bounded.filter((id) => !rows[id]).forEach((id) => cache.delete(id));
      while (cache.size > 100) cache.delete(cache.keys().next().value!);
      try {
        sessionStorage.setItem(key, JSON.stringify([...cache.values()]));
      } catch {
        /* Memory cache remains usable. */
      }
      return { rows, cached: false, error: "" };
    } catch {
      // Expired previews may still be shown offline, always labeled unverified.
      return {
        rows: old,
        cached: true,
        error: navigator.onLine
          ? "Chưa tải được giá mới. Thử lại để tiếp tục."
          : "Kết nối mạng để cập nhật giá.",
      };
    }
  })();
  flights.set(signature, load);
  try {
    return await load;
  } finally {
    flights.delete(signature);
  }
}
export function productPreviewFresh(id: string) {
  const entry = cache.get(id);
  return !!entry && Date.now() - entry.at < ttl;
}
