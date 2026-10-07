declare global {
  interface Window {
    product080DelayWrite: boolean;
    product080ReleaseWrite: () => void;
    product080Render: (kind?: string, long?: boolean) => void;
    product080Mock: {
      scenario: string;
      uid: string;
      delay: boolean;
      failWrite: boolean;
      calls: { name: string; data: Record<string, unknown>; uid: string }[];
      change: (uid: string) => void;
      release: () => void;
    };
  }
}
export const auth = { currentUser: { uid: "buyer-a" } };
export const db = null;
export const betaRelease = false;
const listeners = new Set<(u: unknown) => void>();
export function onAuthStateChanged(_: unknown, fn: (u: unknown) => void) {
  listeners.add(fn);
  fn(auth.currentUser);
  return () => listeners.delete(fn);
}
const w = window as unknown as {
  product080Mock: {
    scenario: string;
    uid: string;
    delay: boolean;
    failWrite: boolean;
    calls: { name: string; data: Record<string, unknown>; uid: string }[];
    change: (uid: string) => void;
    release: () => void;
  };
};
let writeRelease: ((v: unknown) => void) | null = null;
let release: ((v: unknown) => void) | null = null;
window.product080ReleaseWrite = () => {
  writeRelease?.({
    mine: {
      version: 1,
      status: "pending",
      draft: { name: "Khách A", rating: 5, text: "Bản riêng A" },
      reason: "",
    },
  });
  writeRelease = null;
};
w.product080Mock = {
  scenario: "default",
  uid: "buyer-a",
  delay: false,
  failWrite: false,
  calls: [],
  change(uid) {
    auth.currentUser = uid ? { uid } : (null as never);
    w.product080Mock.uid = uid;
    listeners.forEach((fn) => fn(auth.currentUser));
  },
  release() {
    release?.(page);
    release = null;
  },
};
const review = {
  id: "review-1",
  productId: "product-1",
  name: "Khách thử",
  text: "Thông tin đơn rõ ràng, đóng gói cẩn thận.",
  rating: 4,
  variant: "500 viên",
  verifiedPurchase: true,
  publishedAt: 1800000000000,
};
const page = {
  items: [review],
  summary: { count: 1, average: 4, histogram: [0, 0, 0, 1, 0] },
  next: null,
  mine: null,
};
export async function login() {
  w.product080Mock.change("buyer-a");
}
export async function callService(name: string, data: Record<string, unknown>) {
  w.product080Mock.calls.push({ name, data, uid: auth.currentUser?.uid ?? "" });
  if (name === "productReviewRead") {
    if (w.product080Mock.delay)
      return new Promise((r) => {
        release = r;
      });
    if (w.product080Mock.scenario === "read-error") throw Error("weak network");
    return w.product080Mock.scenario === "empty"
      ? {
          ...page,
          items: [],
          summary: { count: 0, average: null, histogram: [0, 0, 0, 0, 0] },
        }
      : w.product080Mock.scenario === "summary-error"
        ? { ...page, summary: null }
        : page;
  }
  if (name === "productReviewEligibility")
    return {
      state: "unknown",
      orders: [{ id: "order-1", label: "Đơn thử" }],
      next: null,
    };
  if (
    (name === "productReviewWrite" || name === "productReviewModerate") &&
    w.product080Mock.scenario === "write-denied"
  )
    throw Object.assign(Error("revoked"), {
      code: "functions/permission-denied",
    });
  if (
    name === "productReviewWrite" &&
    w.product080Mock.scenario === "write-not-found"
  )
    throw Object.assign(Error("archived"), { code: "functions/not-found" });
  if (name === "productReviewWrite") {
    if (window.product080DelayWrite)
      return new Promise((r) => {
        writeRelease = r;
      });
    if (w.product080Mock.failWrite) {
      w.product080Mock.failWrite = false;
      throw Error("lost ACK");
    }
    return {
      mine: { version: 1, status: "pending", draft: data.draft, reason: "" },
    };
  }
  if (
    name === "productReviewAdmin" &&
    w.product080Mock.scenario === "read-error"
  )
    throw Object.assign(Error("revoked"), {
      code: "functions/permission-denied",
    });
  if (name === "productReviewAdmin")
    return {
      items: [
        {
          id: "review-1",
          productId: "product-1",
          productTitle: "Vitamin E 180 mg",
          productSlug: "vitamin-e",
          version: 1,
          status: "pending",
          draft: {
            name: "Khách thử",
            text: "Cập nhật đơn chưa kịp thời.",
            rating: 1,
          },
          reason: "",
          hasPublished: false,
        },
      ],
      next: null,
    };
  if (name === "productReviewModerate") return { ok: true };
  if (name === "listWork") return { rows: [], next: null };
  if (name === "workspaceCommand") return { id: "mock-product", version: 1 };
  return { rows: [], next: null };
}
