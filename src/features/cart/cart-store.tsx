import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { doc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { z } from "zod";
import {
  cartCommandSchema,
  cartItemsSchema,
  cartSchema,
  consumeCart,
  mergeCart,
  type Cart,
  type CartCommand,
  type CartItem,
} from "../../../packages/domain/cart";
import { app, callService, db } from "../../shared/firebase";

const scope = app?.options.projectId ?? "unconfigured";
export const guestCartKey = `satsunicgo-cart-v1:${scope}:guest`;
const guestSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  items: cartItemsSchema,
  appliedMerges: z.array(z.string().uuid()).max(100).default([]),
});
const empty = (ownerId = "guest"): Cart => ({
  ownerId,
  revision: 0,
  updatedAt: 0,
  items: [],
});
type GuestCart = Cart & { appliedMerges: string[] };
function readGuest(): GuestCart {
  const saved = localStorage.getItem(guestCartKey);
  if (!saved) return { ...empty(), appliedMerges: [] };
  const parsed = guestSchema.safeParse(JSON.parse(saved));
  if (!parsed.success)
    throw Error(
      "Giỏ đã lưu chưa đọc được. Bạn có thể xóa bản lưu để chọn lại.",
    );
  return {
    ...empty(),
    revision: parsed.data.revision,
    items: parsed.data.items,
    appliedMerges: parsed.data.appliedMerges,
  };
}
type Change =
  | { action: "merge"; items: CartItem[] }
  | { action: "quantity"; lineId: string; quantity: number }
  | { action: "remove"; lineId: string };
type CartContextValue = {
  cart: Cart;
  user: User | null;
  loading: boolean;
  busy: boolean;
  cached: boolean;
  online: boolean;
  error: string;
  storageWarning: string;
  guestItems: CartItem[];
  pending: boolean;
  change: (change: Change) => Promise<boolean>;
  refresh: () => Promise<void>;
  retryPending: () => Promise<boolean>;
  mergeGuest: () => Promise<void>;
  resetGuest: () => void;
  consume: (orderId: string, lineId: string) => Promise<boolean>;
};
const CartContext = createContext<CartContextValue | null>(null);
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw Error("CartProvider required");
  return context;
}
export function CartProvider({
  user,
  ready,
  children,
}: {
  user: User | null;
  ready: boolean;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart>(() => empty(user?.uid)),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [cached, setCached] = useState(!!user);
  const [online, setOnline] = useState(navigator.onLine),
    [error, setError] = useState(""),
    [storageWarning, setStorageWarning] = useState(""),
    [guestItems, setGuestItems] = useState<CartItem[]>([]),
    [pending, setPending] = useState(false);
  const current = useRef(cart),
    flight = useRef(false),
    live = useRef(true),
    attempt = useRef<CartCommand | null>(null);
  const persistentGuest = useRef(true);
  const pendingKey = `satsunicgo-cart-pending-v1:${scope}:${user?.uid ?? "guest"}`;
  function apply(next: Cart) {
    current.current = next;
    setCart(next);
  }
  useEffect(() => {
    live.current = true;
    if (!ready)
      return () => {
        live.current = false;
      };
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    function guest() {
      try {
        const saved = readGuest();
        if (user) setGuestItems(saved.items);
        else apply(saved);
      } catch (e) {
        setStorageWarning(
          e instanceof Error && e.name !== "SecurityError"
            ? e.message
            : "Chưa đọc được giỏ trên trình duyệt. Thay đổi sẽ chỉ giữ trong trang này.",
        );
        if (e instanceof Error && e.name === "SecurityError")
          persistentGuest.current = false;
      }
    }
    guest();
    const storage = (e: StorageEvent) => {
      if (e.key === guestCartKey) guest();
    };
    window.addEventListener("storage", storage);
    let stop = () => {};
    if (user && db) {
      stop = onSnapshot(
        doc(db, "carts", user.uid),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!live.current) return;
          const parsed = snapshot.exists()
            ? cartSchema.safeParse(snapshot.data())
            : { success: true as const, data: empty(user.uid) };
          if (!parsed.success || parsed.data.ownerId !== user.uid) {
            apply(empty(user.uid));
            setError("Chưa đọc được giỏ tài khoản. Thử tải lại.");
          } else if (parsed.data.revision >= current.current.revision)
            apply(parsed.data);
          setCached(!parsed.success || snapshot.metadata.fromCache);
          setLoading(false);
        },
        () => {
          if (live.current) {
            apply(empty(user.uid));
            setError(
              "Chưa mở được giỏ tài khoản. Kiểm tra kết nối và quyền truy cập rồi tải lại.",
            );
            setLoading(false);
            setCached(true);
          }
        },
      );
      // Recover exact uncertain mutation; private commands are scoped to this account.
      try {
        const value = sessionStorage.getItem(pendingKey);
        if (value) {
          const parsed = cartCommandSchema.parse(JSON.parse(value));
          attempt.current = parsed;
          setPending(true);
        }
      } catch {
        setError(
          "Chưa đọc được lần cập nhật đang chờ. Kiểm tra giỏ trước khi thay đổi.",
        );
      }
    } else {
      setLoading(false);
      if (user) setError("Chưa kết nối được giỏ tài khoản.");
    }
    return () => {
      live.current = false;
      stop();
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("storage", storage);
    };
  }, [ready, user, pendingKey]);
  async function refresh() {
    if (!user || !db) return;
    try {
      const s = await getDocFromServer(doc(db, "carts", user.uid));
      const c = s.exists() ? cartSchema.parse(s.data()) : empty(user.uid);
      if (c.ownerId !== user.uid) throw Error("OWNER");
      if (live.current) {
        if (c.revision >= current.current.revision) apply(c);
        setCached(false);
        setError("");
      }
    } catch {
      if (live.current)
        setError("Chưa tải lại được giỏ. Kiểm tra kết nối rồi thử lại.");
    }
  }
  async function send(command: CartCommand): Promise<boolean> {
    if (flight.current || !user || !navigator.onLine) return false;
    try {
      sessionStorage.setItem(pendingKey, JSON.stringify(command));
    } catch {
      setError(
        "Chưa lưu được lần cập nhật để thử lại an toàn. Cho phép lưu phiên rồi thử lại.",
      );
      return false;
    }
    attempt.current = command;
    flight.current = true;
    setPending(true);
    setBusy(true);
    setError("");
    try {
      const result = cartSchema.parse(
        await callService<Cart>("cartCommand", command),
      );
      if (!live.current) return false;
      if (result.ownerId !== user.uid) throw Error("OWNER");
      if (result.revision >= current.current.revision) apply(result);
      if (command.action === "merge" && guestItems.length > 0) {
        const guest = readGuest();
        const shared = command.items.filter((item) =>
          guest.items.some((g) => g.lineId === item.lineId),
        );
        if (
          shared.length &&
          !guest.appliedMerges.includes(command.operationId)
        ) {
          let remaining = guest.items;
          for (const item of shared)
            remaining = consumeCart(remaining, item, item.lineId);
          const appliedMerges = [
            ...guest.appliedMerges,
            command.operationId,
          ].slice(-100);
          // Persist reconciliation before dropping the pending command, including retries.
          if (remaining.length)
            localStorage.setItem(
              guestCartKey,
              JSON.stringify({
                version: 1,
                revision: guest.revision + 1,
                items: remaining,
                appliedMerges,
              }),
            );
          else localStorage.removeItem(guestCartKey);
          setGuestItems(remaining);
        }
      }
      sessionStorage.removeItem(pendingKey);
      attempt.current = null;
      setPending(false);
      setCached(false);
      return true;
    } catch (e) {
      if (!live.current) return false;
      const code = (e as { code?: string }).code ?? "";
      if (
        [
          "functions/aborted",
          "functions/invalid-argument",
          "functions/failed-precondition",
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/already-exists",
        ].includes(code)
      ) {
        attempt.current = null;
        setPending(false);
        sessionStorage.removeItem(pendingKey);
        await refresh();
        setError((e as Error).message);
      } else
        setError(
          "Chưa rõ giỏ đã cập nhật chưa. Thử kiểm tra lại cùng lần cập nhật.",
        );
      return false;
    } finally {
      flight.current = false;
      if (live.current) setBusy(false);
    }
  }
  async function change(input: Change) {
    if (!ready || loading || flight.current || attempt.current) return false;
    if (user) {
      if (!navigator.onLine || cached) {
        setError("Kết nối và tải lại giỏ trước khi thay đổi.");
        return false;
      }
      return send({
        ...input,
        operationId: crypto.randomUUID(),
        expectedRevision: current.current.revision,
      });
    }
    try {
      let previous: Cart & { appliedMerges?: string[] } = current.current;
      if (persistentGuest.current) previous = readGuest();
      if (previous.revision !== current.current.revision) {
        apply(previous);
        setError("Giỏ đã thay đổi ở tab khác. Xem lại rồi thử lại.");
        return false;
      }
      const items =
        input.action === "merge"
          ? mergeCart(previous.items, input.items)
          : input.action === "remove"
            ? previous.items.filter((i) => i.lineId !== input.lineId)
            : previous.items.map((i) =>
                i.lineId === input.lineId
                  ? { ...i, quantity: input.quantity }
                  : i,
              );
      cartItemsSchema.parse(items);
      const next = { ...previous, items, revision: previous.revision + 1 };
      try {
        localStorage.setItem(
          guestCartKey,
          JSON.stringify({
            version: 1,
            revision: next.revision,
            items,
            appliedMerges: previous.appliedMerges ?? [],
          }),
        );
        setStorageWarning("");
      } catch {
        persistentGuest.current = false;
        setStorageWarning(
          "Giỏ chỉ được giữ trong trang này vì trình duyệt chưa cho phép lưu.",
        );
      }
      apply(next);
      setError("");
      return true;
    } catch {
      setError(
        "Chưa cập nhật được giỏ. Giỏ tối đa 30 mẫu, mỗi mẫu từ 1 đến 100 sản phẩm.",
      );
      return false;
    }
  }
  async function mergeGuest() {
    let source: GuestCart;
    try {
      source = readGuest();
    } catch {
      setError("Chưa đọc được giỏ trên trình duyệt.");
      return;
    }
    if (source.items.length)
      await change({ action: "merge", items: source.items });
  }
  function resetGuest() {
    try {
      localStorage.removeItem(guestCartKey);
      persistentGuest.current = true;
      setGuestItems([]);
      if (!user) apply(empty());
      setStorageWarning("");
    } catch {
      setStorageWarning("Chưa xóa được bản giỏ trên trình duyệt.");
    }
  }
  return (
    <CartContext.Provider
      value={{
        cart,
        user,
        loading,
        busy,
        cached,
        online,
        error,
        storageWarning,
        guestItems,
        pending,
        change,
        refresh,
        mergeGuest,
        resetGuest,
        retryPending: async () =>
          attempt.current ? send(attempt.current) : false,
        consume: async (orderId, lineId) => {
          if (attempt.current || flight.current) return false;
          return send({
            action: "consume",
            operationId: crypto.randomUUID(),
            orderId,
            lineId,
          });
        },
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
