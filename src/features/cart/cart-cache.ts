import {
  collection,
  documentId,
  getDocsFromServer,
  query,
  where,
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
export async function cartProducts(ids: string[]): Promise<ProductResult> {
  hydrate();
  const bounded = [...new Set(ids)].sort().slice(0, 30);
  if (!bounded.length) return { rows: {}, cached: false, error: "" };
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
      const snapshot = await getDocsFromServer(
        query(
          collection(db, "products"),
          where("status", "==", "published"),
          where(documentId(), "in", bounded),
        ),
      );
      const rows: Record<string, ContentRow> = {};
      snapshot.docs.forEach((d) => {
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
        error: "Chưa kiểm tra được sản phẩm và giá. Kết nối rồi tải lại.",
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
