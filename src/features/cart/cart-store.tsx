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
import {
  cartCommandSchema,
  cartItemsSchema,
  cartSchema,
  mergeCart,
  type Cart,
  type CartCommand,
  type CartItem,
} from "../../../packages/domain/cart";
import { app, auth, callService, db } from "../../shared/firebase";
import {
  guestSchema,
  GuestTransferError,
  readGuestTransfer,
  reconcileGuestTransfer,
  transferGuestCart,
} from "./cart-guest-transfer";

const scope = app?.options.projectId ?? "unconfigured";
export const guestCartKey = `satsunicgo-cart-v1:${scope}:guest`;
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
  changeGuest: (
    change: Exclude<Change, { action: "merge" }>,
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
  retryPending: () => Promise<boolean>;
  mergeGuest: () => Promise<boolean>;
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
  const [merging, setMerging] = useState(false);
  const [online, setOnline] = useState(navigator.onLine),
    [error, setError] = useState(""),
    [storageWarning, setStorageWarning] = useState(""),
    [guestItems, setGuestItems] = useState<CartItem[]>([]),
    [pending, setPending] = useState(false);
  const current = useRef(cart),
    flight = useRef(false),
    live = useRef(true),
    attempt = useRef<CartCommand | null>(null);
  const generation = useRef(0),
    transferFlight = useRef(false),
    identity = useRef(user?.uid ?? "guest");
  identity.current = user?.uid ?? "guest";
  const persistentGuest = useRef(true);
  const pendingKey = `satsunicgo-cart-pending-v1:${scope}:${user?.uid ?? "guest"}`;
  function apply(next: Cart) {
    current.current = next;
    setCart(next);
  }
  useEffect(() => {
    live.current = true;
    const session = ++generation.current;
    const active = () =>
      live.current &&
      generation.current === session &&
      identity.current === (user?.uid ?? "guest") &&
      (auth?.currentUser?.uid ?? "guest") === (user?.uid ?? "guest");
    apply(empty(user?.uid));
    setLoading(true);
    setBusy(false);
    setMerging(false);
    setCached(!!user);
    setError("");
    setStorageWarning("");
    setGuestItems([]);
    setPending(false);
    attempt.current = null;
    flight.current = false;
    transferFlight.current = false;
    persistentGuest.current = true;
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
          if (!active()) return;
          const parsed = snapshot.exists()
            ? cartSchema.safeParse(snapshot.data())
            : { success: true as const, data: empty(user.uid) };
          if (!parsed.success || parsed.data.ownerId !== user.uid) {
            apply(empty(user.uid));
            setError("Chưa đọc được giỏ tài khoản. Thử tải lại.");
          } else if (parsed.data.revision >= current.current.revision) {
            apply(parsed.data);
          }
          setCached(!parsed.success || snapshot.metadata.fromCache);
          setLoading(false);
        },
        () => {
          if (active()) {
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
    const session = generation.current;
    const active = () =>
      live.current &&
      generation.current === session &&
      identity.current === user.uid &&
      auth?.currentUser?.uid === user.uid;
    if (!active()) return;
    try {
      const s = await getDocFromServer(doc(db, "carts", user.uid));
      const c = s.exists() ? cartSchema.parse(s.data()) : empty(user.uid);
      if (c.ownerId !== user.uid) throw Error("OWNER");
      if (active()) {
        if (c.revision >= current.current.revision) apply(c);
        setCached(false);
        setError("");
      }
    } catch {
      if (active())
        setError("Chưa tải lại được giỏ. Kiểm tra kết nối rồi thử lại.");
    }
  }
  async function send(
    command: CartCommand,
    reconcileGuest = true,
  ): Promise<boolean> {
    if (flight.current || !user || !navigator.onLine) return false;
    const session = generation.current;
    const active = () =>
      live.current &&
      generation.current === session &&
      identity.current === user.uid &&
      auth?.currentUser?.uid === user.uid;
    if (!active()) return false;
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
        await callService<Cart>("cartCommand", command, "inline"),
      );
      if (!active()) return false;
      if (result.ownerId !== user.uid) throw Error("OWNER");
      if (result.revision >= current.current.revision) apply(result);
      if (
        command.action === "merge" &&
        reconcileGuest &&
        guestItems.length > 0
      ) {
        reconcileGuestTransfer(localStorage, guestCartKey, command);
        setGuestItems(readGuest().items);
      }
      sessionStorage.removeItem(pendingKey);
      attempt.current = null;
      setPending(false);
      setCached(false);
      return true;
    } catch (e) {
      if (!active()) return false;
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
        if (active()) setError((e as Error).message);
      } else
        setError(
          "Chưa rõ giỏ đã cập nhật chưa. Thử kiểm tra lại cùng lần cập nhật.",
        );
      return false;
    } finally {
      if (active()) {
        flight.current = false;
        setBusy(false);
      }
    }
  }
  async function change(input: Change) {
    if (
      !ready ||
      loading ||
      flight.current ||
      transferFlight.current ||
      attempt.current ||
      identity.current !== (user?.uid ?? "guest")
    )
      return false;
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
    if (
      !user ||
      !ready ||
      loading ||
      cached ||
      !online ||
      transferFlight.current ||
      flight.current
    )
      return false;
    if (!navigator.locks) {
      setError(
        "Mở giỏ bằng trình duyệt mới hơn để tiếp tục với các món đã chọn.",
      );
      return false;
    }
    const session = generation.current;
    const active = () =>
      live.current &&
      generation.current === session &&
      identity.current === user.uid &&
      auth?.currentUser?.uid === user.uid;
    transferFlight.current = true;
    setMerging(true);
    try {
      const existing = readGuestTransfer(localStorage, guestCartKey);
      if (
        attempt.current &&
        attempt.current.operationId !== existing?.command.operationId
      )
        return false;
      const result = await transferGuestCart({
        storage: localStorage,
        key: guestCartKey,
        ownerId: user.uid,
        active,
        current: () => current.current,
        lock: (run) => navigator.locks.request(`${guestCartKey}:transfer`, run),
        send: async (command) => {
          const confirmed = await send(command, false);
          return confirmed
            ? "confirmed"
            : attempt.current
              ? "uncertain"
              : "rejected";
        },
      });
      if (!active()) return false;
      setGuestItems(readGuest().items);
      if (result === "confirmed") setError("");
      return result === "confirmed";
    } catch (e) {
      if (active())
        setError(
          e instanceof GuestTransferError
            ? e.message
            : "Chưa lưu được các món đã chọn vào giỏ. Các món vẫn được giữ lại để thử lại.",
        );
      return false;
    } finally {
      if (active()) {
        transferFlight.current = false;
        setMerging(false);
      }
    }
  }
  async function changeGuest(input: Exclude<Change, { action: "merge" }>) {
    if (!user || pending || busy || merging || transferFlight.current)
      return false;
    const session = generation.current;
    const active = () =>
      live.current &&
      generation.current === session &&
      identity.current === user.uid &&
      auth?.currentUser?.uid === user.uid;
    transferFlight.current = true;
    setMerging(true);
    const edit = async () => {
      if (!active()) return false;
      try {
        if (readGuestTransfer(localStorage, guestCartKey)) {
          setError("Kiểm tra lại lần lưu giỏ trước khi sửa món đã chọn.");
          return false;
        }
        const source = readGuest();
        setGuestItems(source.items);
        if (!source.items.some((item) => item.lineId === input.lineId)) {
          setError("Món đã được cập nhật. Xem lại giỏ trước khi sửa.");
          return false;
        }
        const items = cartItemsSchema.parse(
          input.action === "remove"
            ? source.items.filter((item) => item.lineId !== input.lineId)
            : source.items.map((item) =>
                item.lineId === input.lineId
                  ? { ...item, quantity: input.quantity }
                  : item,
              ),
        );
        localStorage.setItem(
          guestCartKey,
          JSON.stringify({
            version: 1,
            revision: source.revision + 1,
            items,
            appliedMerges: source.appliedMerges,
          }),
        );
        setGuestItems(items);
        setError("");
        return true;
      } catch {
        setError("Chưa sửa được món đã chọn. Thử lại.");
        return false;
      }
    };
    try {
      return await (navigator.locks
        ? navigator.locks.request(`${guestCartKey}:transfer`, edit)
        : edit());
    } finally {
      if (active()) {
        transferFlight.current = false;
        setMerging(false);
      }
    }
  }
  function resetGuest() {
    try {
      if (
        pending ||
        busy ||
        merging ||
        readGuestTransfer(localStorage, guestCartKey)
      ) {
        setError("Kiểm tra lại lần lưu giỏ trước khi xóa bản lưu.");
        return;
      }
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
        cart: cart.ownerId === identity.current ? cart : empty(user?.uid),
        user,
        loading: loading || cart.ownerId !== identity.current,
        busy: busy || merging,
        cached,
        online,
        error,
        storageWarning,
        guestItems,
        pending,
        change,
        changeGuest,
        refresh,
        mergeGuest,
        resetGuest,
        retryPending: async () => {
          if (!attempt.current) return false;
          try {
            if (
              readGuestTransfer(localStorage, guestCartKey)?.command
                .operationId === attempt.current.operationId
            )
              return mergeGuest();
          } catch {
            setError(
              "Chưa đọc được lần lưu giỏ. Các món đã chọn vẫn được giữ lại.",
            );
            return false;
          }
          return send(attempt.current);
        },
        consume: async (orderId, lineId) => {
          if (attempt.current || flight.current || transferFlight.current)
            return false;
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
