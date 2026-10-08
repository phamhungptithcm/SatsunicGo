import { contentRow, type RichNode } from "./content-row";
import { selectedProducts } from "../../packages/domain/product-selection";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  documentId,
  getDocs,
  startAfter,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { createLiveCache } from "./live-cache";
export type ContentRow = {
  id: string;
  title: string;
  slug: string;
  body: string;
  richBody?: RichNode;
  summary?: string;
  author?: string;
  authorBio?: string;
  authorAvatarId?: string;
  authorGoogleAvatar?: string;
  publishedAt?: number;
  readingMinutes?: number;
  sources?: { title: string; url: string }[];
  status: string;
  version: number;
  publishAt?: number;
  featured?: boolean;
  featuredOrder?: number;
  manufacturingOrigin?: string;
  brand?: string;
  productSummary?: string;
  retailer?: string;
  sourceUrl?: string;
  usageSteps?: string[];
  origin?: string;
  functions?: string;
  usage?: string;
  referencePrice?: number;
  listedPrice?: number;
  orderable?: boolean;
  termsVersion?: string;
  catalogOptions?: string[];
  market?: string;
  priceCheckedAt?: number;
  mediaId?: string;
  mediaAlt?: string;
  category?: string;
  referenceUrl?: string;
  variants?: string;
  seoTitle?: string;
  seoDescription?: string;
};
function store(kind: "products" | "posts") {
  return createLiveCache<ContentRow>((next, fail) => {
    if (!db) {
      fail();
      return () => {};
    }
    if (kind === "products") {
      let selected: ContentRow[] = [],
        legacy: ContentRow[] = [],
        ready = 0,
        failed = false;
      const caches = [true, true];
      const queries = [
        query(
          collection(db, kind),
          where("status", "==", "published"),
          where("featured", "==", true),
          orderBy("featuredOrder"),
          limit(30),
        ),
        query(
          collection(db, kind),
          where("status", "==", "published"),
          limit(30),
        ),
      ];
      const stops = queries.map((q, index) =>
        onSnapshot(
          q,
          { includeMetadataChanges: true },
          (snapshot) => {
            const rows = snapshot.docs.map(
              (d) => ({ ...d.data(), id: d.id }) as ContentRow,
            );
            if (index === 0) selected = rows;
            else legacy = rows;
            caches[index] = snapshot.metadata.fromCache;
            ready |= 1 << index;
            if (ready === 3 && !failed)
              next(selectedProducts(selected, legacy), caches.some(Boolean));
          },
          () => {
            failed = true;
            fail();
          },
        ),
      );
      return () => stops.forEach((stop) => stop());
    }
    let legacy: ContentRow[] = [],
      studio: ContentRow[] = [],
      ready = 0,
      failed = false;
    const caches = [true, true];
    const stops = ["posts", "blogPublished"].map((source, index) =>
      onSnapshot(
        query(
          collection(db!, source),
          where("status", "==", "published"),
          limit(30),
        ),
        { includeMetadataChanges: true },
        (snapshot) => {
          const rows = snapshot.docs.map((d) => contentRow(d.data(), d.id));
          if (index === 0) legacy = rows;
          else studio = rows;
          ready |= 1 << index;
          caches[index] = snapshot.metadata.fromCache;
          if (ready === 3 && !failed)
            next(
              [
                ...studio,
                ...legacy.filter(
                  (row) => !studio.some((post) => post.slug === row.slug),
                ),
              ],
              caches.some(Boolean),
            );
        },
        (error) => {
          failed = true;
          fail(
            error.code === "permission-denied" ||
              error.code === "unauthenticated",
          );
        },
      ),
    );
    return () => stops.forEach((stop) => stop());
  });
}
const onlineSnapshot = () => navigator.onLine;
const subscribeOnline = (listener: () => void) => {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};
const publicStores = { products: store("products"), posts: store("posts") };
export function usePublicContent(kind: "products" | "posts") {
  const store = publicStores[kind];
  const state = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.snapshot,
  );
  const online = useSyncExternalStore(
    subscribeOnline,
    onlineSnapshot,
    () => true,
  );
  return {
    ...state,
    loading: state.loading && online,
    stale: state.stale || !online,
    error: online
      ? state.error
      : "Bạn đang ngoại tuyến. Nội dung chưa được cập nhật.",
    retry: store.retry,
  };
}

// Read bounded pages; every published product remains reachable, including non-featured rows.
const CATALOG_PAGE_SIZE = 10;
export function useCatalogPages() {
  const [rows, setRows] = useState<ContentRow[]>([]),
    [cached, setCached] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [hasMore, setHasMore] = useState(true);
  const cursor = useRef<string | null>(
      new URLSearchParams(window.location.search).get("after"),
    ),
    active = useRef(false),
    exhausted = useRef(false),
    mounted = useRef(true);
  const load = useCallback(async () => {
    if (active.current || exhausted.current || !mounted.current) return;
    active.current = true;
    setLoading(true);
    setError("");
    try {
      if (!db || !navigator.onLine) throw Error("OFFLINE");
      const snapshot = await getDocs(
        query(
          collection(db, "products"),
          where("status", "==", "published"),
          orderBy(documentId()),
          ...(cursor.current ? [startAfter(cursor.current)] : []),
          limit(CATALOG_PAGE_SIZE),
        ),
      );
      if (!mounted.current) return;
      const page = snapshot.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as ContentRow,
      );
      setRows((old) => [
        ...old,
        ...page.filter((p) => !old.some((r) => r.id === p.id)),
      ]);
      cursor.current = snapshot.docs.at(-1)?.id ?? cursor.current;
      exhausted.current = snapshot.size < CATALOG_PAGE_SIZE;
      setHasMore(!exhausted.current);
      setCached(snapshot.metadata.fromCache);
    } catch {
      if (mounted.current)
        setError("Chưa tải được sản phẩm. Kiểm tra kết nối rồi tải lại.");
    } finally {
      active.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  return {
    rows,
    loading,
    error,
    stale: cached || !navigator.onLine,
    retry: load,
    loadMore: load,
    hasMore,
  };
}
