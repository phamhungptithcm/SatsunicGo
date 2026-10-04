import { useSyncExternalStore } from "react";
import {
  collection,
  limit,
  onSnapshot,
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
  status: string;
  version: number;
  referencePrice?: number;
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
    return onSnapshot(
      query(
        collection(db, kind),
        where("status", "==", "published"),
        limit(30),
      ),
      { includeMetadataChanges: true },
      (snapshot) =>
        next(
          snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as ContentRow),
          snapshot.metadata.fromCache,
        ),
      (error) =>
        fail(
          error.code === "permission-denied" ||
            error.code === "unauthenticated",
        ),
    );
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
