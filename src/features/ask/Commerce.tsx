import { LoadingState } from "../../shared/Loading";
import { CatalogPurchase } from "./CatalogPurchase";
import { InlineSupport } from "./InlineSupport";
import { CustomerChanges } from "../orders/Changes";
import { InvoiceSummary } from "./InvoiceSummary";
import {
  validatePaymentQr,
  type ChatPayment,
} from "../../../packages/domain/payment-qr";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db, callService, login } from "../../shared/firebase";
import {
  requestSchema,
  orderStageLabel,
  paymentPurpose,
  paymentDue,
  type Order,
} from "../../../packages/domain";
import {
  nextCustomerAction,
  safeCheckout,
  type AskConversation,
  type ShoppingDraft,
} from "../../../packages/domain/ask-workflow";
import type { AskAnswer } from "./knowledge";
import styles from "./Ask.module.css";

type CommerceScope = {
  uid: string | null;
  cid: string | undefined;
  epoch: number;
};
/** Local UI ownership only; durable workflow authority remains on the server. */
export function createCommerceContextFence() {
  let context: CommerceScope = { uid: null, cid: undefined, epoch: 0 };
  let busySequence = 0;
  const current = (scope: CommerceScope, actualUid: string | null) =>
    scope.epoch === context.epoch &&
    scope.uid === context.uid &&
    scope.cid === context.cid &&
    actualUid === scope.uid;
  return {
    snapshot: () => ({ ...context }),
    reset: (uid: string | null, cid: string | undefined) => {
      context = { uid, cid, epoch: context.epoch + 1 };
      busySequence++;
    },
    current,
    begin: () => ++busySequence,
    ownsBusy: (scope: CommerceScope, token: number, actualUid: string | null) =>
      token === busySequence && current(scope, actualUid),
  };
}
type Mutation = {
  action: string;
  payload: unknown;
  expectedOrderVersion?: number;
};
export function useAskCommerce(
  onRestore: (c: AskConversation) => void,
  enabled = true,
) {
  const [user, setUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<AskConversation | null>(
    null,
  );
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [restorationReady, setRestorationReady] = useState(false);
  const [draft, setDraft] = useState<ShoppingDraft>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [catalogSlugs, setCatalogSlugs] = useState<string[]>([]);
  const [clientPending, setClientPending] = useState<string | null>(null);
  const pendingOperation = conversation?.pendingOperation ?? clientPending;
  const [busy, setBusy] = useState(false);
  const version = useRef(0),
    currentUid = useRef<string | null>(null),
    currentCid = useRef<string | undefined>(undefined),
    currentOrderId = useRef<string | undefined>(undefined),
    hydrated = useRef(false),
    restorationEpoch = useRef(0);
  const contextFence = useRef(createCommerceContextFence());
  const renderedScope = {
    ...contextFence.current.snapshot(),
    uid: user?.uid ?? null,
    cid: conversationId,
  };
  const isCurrent = (scope: CommerceScope) =>
    contextFence.current.current(scope, auth?.currentUser?.uid ?? null);
  const ownsBusy = (scope: CommerceScope, token: number) =>
    contextFence.current.ownsBusy(scope, token, auth?.currentUser?.uid ?? null);
  currentOrderId.current = conversation?.orderId;
  const restore = useRef(onRestore);
  restore.current = onRestore;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    if (!auth || !enabled) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      const epoch = ++restorationEpoch.current;
      const previousUid = currentUid.current;
      currentUid.current = u?.uid ?? null;
      contextFence.current.reset(currentUid.current, undefined);
      setBusy(false);
      queue.current = Promise.resolve();
      if (previousUid !== (u?.uid ?? null)) {
        setDraft({});
        setCatalogSlugs([]);
        setError("");
        restore.current({
          ownerId: u?.uid ?? "",
          version: 0,
          updatedAt: 0,
          turns: [],
        });
      }
      currentCid.current = undefined;
      currentOrderId.current = undefined;
      setConversationId(undefined);
      setUser(u);
      setClientPending(null);
      setConversation(null);
      setOrder(null);
      version.current = 0;
      hydrated.current = false;
      setRestorationReady(false);
      if (u) {
        const uid = u.uid;
        void callService<{ conversationId: string | null }>(
          "currentAskConversation",
          {},
        )
          .then((result) => {
            if (
              restorationEpoch.current !== epoch ||
              currentUid.current !== uid ||
              auth?.currentUser?.uid !== uid
            )
              return;
            const id = result.conversationId ?? crypto.randomUUID();
            currentCid.current = id;
            contextFence.current.reset(uid, id);
            setConversationId(id);
          })
          .catch(() => {
            if (
              restorationEpoch.current !== epoch ||
              currentUid.current !== uid ||
              auth?.currentUser?.uid !== uid
            )
              return;
            setError(
              "Chưa tải được hội thoại. Đăng nhập lại hoặc kiểm tra kết nối.",
            );
          });
      } else {
        currentCid.current = undefined;
        setConversationId(undefined);
      }
    });
    return () => {
      ++restorationEpoch.current;
      contextFence.current.reset(null, undefined);
      unsubscribe();
    };
  }, [enabled]);
  useEffect(() => {
    if (!isCurrent(renderedScope)) return;
    setClientPending(null);
    if (!user || !conversationId) return;
    try {
      const saved = sessionStorage.getItem(
        `ask-pending:${user.uid}:${conversationId}`,
      );
      if (saved) setClientPending(JSON.parse(saved).operationId ?? null);
    } catch {
      setError("Chưa đọc được thao tác đang chờ. Liên hệ hỗ trợ để đối chiếu.");
    }
  }, [user, conversationId]);
  useEffect(() => {
    if (!db || !user || !conversationId) return;
    const scope = {
      ...contextFence.current.snapshot(),
      uid: user.uid,
      cid: conversationId,
    };
    let live = true;
    const valid = () => live && isCurrent(scope);
    const unsubscribe = onSnapshot(
      doc(db, "askConversations", `${user.uid}-${conversationId}`),
      { includeMetadataChanges: true },
      (snap) => {
        if (!valid()) return;
        // Cached absence/content cannot finish initial ownership-verified restoration.
        if (!hydrated.current && snap.metadata.fromCache) return;
        const c = snap.data() as AskConversation | undefined;
        if (c) {
          if (currentOrderId.current !== c.orderId) setOrder(null);
          currentOrderId.current = c.orderId;
          version.current = Math.max(version.current, c.version);
          setConversation(c);
          if (!hydrated.current) {
            setDraft(c.draft ?? draftRef.current);
            restore.current(c);
          }
        }
        hydrated.current = true;
        setRestorationReady(true);
      },
      () => {
        if (!valid()) return;
        setError("Chưa tải được hội thoại. Kiểm tra kết nối và thử lại.");
      },
    );
    return () => {
      live = false;
      unsubscribe();
    };
  }, [user, conversationId]);
  useEffect(() => {
    setOrder(null);
    const orderId = conversation?.orderId;
    if (!db || !user || !conversationId || !orderId) return;
    const scope = {
      ...contextFence.current.snapshot(),
      uid: user.uid,
      cid: conversationId,
    };
    let live = true;
    const valid = () =>
      live &&
      isCurrent(scope) &&
      currentUid.current === user.uid &&
      currentCid.current === conversationId &&
      currentOrderId.current === orderId;
    const unsubscribe = onSnapshot(
      doc(db, "orders", orderId),
      (snap) => {
        if (valid()) setOrder((snap.data() as Order) ?? null);
      },
      () => {
        if (valid())
          setError(
            "Chưa cập nhật được đơn. Thông tin đang hiển thị có thể đã cũ.",
          );
      },
    );
    return () => {
      live = false;
      unsubscribe();
    };
  }, [user, conversationId, conversation?.orderId]);
  const mutate = useCallback(
    (input: Mutation) => {
      if (!user || !conversationId)
        return Promise.reject(Error("Đăng nhập để lưu và tiếp tục yêu cầu."));
      const uid = user.uid,
        cid = conversationId,
        scope = renderedScope;
      const job = queue.current
        .catch(() => {})
        .then(async () => {
          if (!isCurrent(scope) || !hydrated.current)
            throw Error("Đang tải hội thoại. Thử lại sau.");
          const key = `ask-pending:${uid}:${cid}`;
          // Non-PII command envelopes survive reload for recovery of unknown results.
          const stored = sessionStorage.getItem(key);
          const envelope = stored
            ? {
                ...JSON.parse(stored),
                payload: JSON.parse(stored).payload ?? input.payload,
              }
            : {
                ...input,
                conversationId: cid,
                operationId: crypto.randomUUID(),
                expectedVersion: version.current,
              };
          if (stored && envelope.action !== input.action)
            throw Error("Cần thử lại thao tác đang chờ trước khi tiếp tục.");
          const durable = [
            "submitRequest",
            "catalogCheckout",
            "acceptQuote",
            "approveFinal",
            "confirmReceipt",
          ].includes(input.action);
          if (durable && !stored) {
            const { payload: _payload, ...identity } = envelope;
            sessionStorage.setItem(
              key,
              JSON.stringify(
                input.action === "catalogCheckout" ? envelope : identity,
              ),
            );
          }
          const retirePending = () => {
            const current = sessionStorage.getItem(key);
            if (
              current &&
              JSON.parse(current).operationId === envelope.operationId
            )
              sessionStorage.removeItem(key);
          };
          if (durable) setClientPending(envelope.operationId);
          try {
            const result = await callService<{ id?: string; version: number }>(
              "askWorkflow",
              envelope,
            );
            if (!isCurrent(scope)) return result;
            version.current = Math.max(version.current, result.version);
            if (durable) {
              retirePending();
              setClientPending(null);
            }
            setError("");
            return result;
          } catch (e) {
            const code = (e as { code?: string }).code;
            if (
              code &&
              [
                "functions/aborted",
                "functions/failed-precondition",
                "functions/permission-denied",
                "functions/invalid-argument",
                "functions/already-exists",
              ].includes(code)
            ) {
              retirePending();
              if (isCurrent(scope)) setClientPending(null);
            }
            throw e;
          }
        });
      queue.current = job;
      return job;
    },
    [user, conversationId, renderedScope.epoch],
  );
  useEffect(() => {
    if (isCurrent(renderedScope) && conversation?.turns.length) {
      const answer = conversation.turns.at(-1)?.answer;
      setCatalogSlugs(
        (answer?.sourceIds ?? [])
          .filter((id) => /^product:[a-z0-9-]{2,100}$/.test(id))
          .map((id) => id.slice(8)),
      );
    }
  }, [conversation?.turns]);
  async function resolved(question: string, answer: AskAnswer) {
    const scope = renderedScope;
    if (!isCurrent(scope)) return;
    setCatalogSlugs(
      answer.sourceIds
        .filter((id) => /^product:[a-z0-9-]{2,100}$/.test(id))
        .map((id) => id.slice(8)),
    );
    const next = answer.shoppingDraft ?? answer.draft;
    if (next) setDraft((previous) => ({ ...previous, ...next }));
    if (!user || !conversationId) return;
    try {
      if (next && !conversation?.orderId)
        await mutate({
          action: "saveDraft",
          payload: { ...draftRef.current, ...next },
        });
      if (!isCurrent(scope)) return;
      await mutate({
        action: "saveTurn",
        payload: { id: crypto.randomUUID(), question, answer },
      });
    } catch {
      if (isCurrent(scope))
        setError(
          "Câu trả lời chưa được lưu vào hội thoại. Thử lại khi có kết nối.",
        );
    }
  }
  async function run(input: Mutation) {
    const scope = renderedScope;
    if (!isCurrent(scope)) return false;
    const token = contextFence.current.begin();
    setBusy(true);
    setError("");
    try {
      await mutate(input);
      return isCurrent(scope);
    } catch (e) {
      if (ownsBusy(scope, token)) setError((e as Error).message);
      return false;
    } finally {
      if (ownsBusy(scope, token)) setBusy(false);
    }
  }
  async function newConversation() {
    const uid = user?.uid,
      scope = renderedScope;
    if (!uid || !isCurrent(scope)) return;
    const id = crypto.randomUUID(),
      token = contextFence.current.begin();
    setBusy(true);
    try {
      const result = await callService<{
        version: number;
        outcome?: "no_operation";
      }>("askWorkflow", {
        conversationId: id,
        operationId: crypto.randomUUID(),
        expectedVersion: 0,
        action: "saveDraft",
        payload: {},
      });
      if (!ownsBusy(scope, token)) return;
      version.current = result.version;
      hydrated.current = false;
      setRestorationReady(false);
      currentCid.current = id;
      contextFence.current.reset(uid, id);
      queue.current = Promise.resolve();
      setBusy(false);
      setConversation(null);
      setOrder(null);
      setDraft({});
      setCatalogSlugs([]);
      setClientPending(null);
      setError("");
      setConversationId(id);
      restore.current({
        ownerId: uid,
        version: result.version,
        updatedAt: 0,
        turns: [],
      });
    } catch {
      if (ownsBusy(scope, token))
        setError("Chưa mở được yêu cầu mới. Thử lại khi có kết nối.");
    } finally {
      if (ownsBusy(scope, token)) setBusy(false);
    }
  }
  async function resume() {
    const uid = user?.uid,
      cid = conversationId,
      scope = renderedScope;
    if (!uid || !cid || !isCurrent(scope)) return;
    const token = contextFence.current.begin();
    setBusy(true);
    try {
      const result = await callService<{
        version: number;
        outcome?: "no_operation";
      }>("askWorkflow", {
        conversationId: cid,
        operationId: crypto.randomUUID(),
        expectedVersion: version.current,
        action: "resume",
        payload: clientPending ? { operationId: clientPending } : {},
      });
      if (!ownsBusy(scope, token)) return;
      version.current = Math.max(version.current, result.version);
      const key = `ask-pending:${uid}:${cid}`;
      const saved = sessionStorage.getItem(key);
      if (saved && JSON.parse(saved).operationId === clientPending)
        sessionStorage.removeItem(key);
      setClientPending(null);
      setError(
        result.outcome === "no_operation"
          ? "Chưa ghi nhận thao tác trước. Kiểm tra lựa chọn rồi gửi lại."
          : "",
      );
    } catch {
      if (isCurrent(scope))
        setError(
          "Chưa đối chiếu được thao tác. Thử lại; không gửi yêu cầu mới.",
        );
    } finally {
      if (ownsBusy(scope, token)) setBusy(false);
    }
  }
  return {
    catalogSlugs,
    pendingOperation,
    newConversation,
    resume,
    user,
    conversation,
    conversationId,
    restorationReady,
    draft,
    setDraft,
    order,
    error,
    setError,
    busy,
    run,
    resolved,
  };
}
export type Commerce = ReturnType<typeof useAskCommerce>;
function AskOrderChanges({ order, vi }: { order: Order; vi: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={styles.manualFallback}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{vi ? "Thay đổi đơn hàng" : "Order changes"}</summary>
      {open && <CustomerChanges order={order} language={vi ? "vi" : "en"} />}
    </details>
  );
}
export function CommercePanel({
  commerce: c,
  language,
  hasMessages = false,
}: {
  hasMessages?: boolean;
  commerce: Commerce;
  language: "vi" | "en";
}) {
  const [identityEpoch, setIdentityEpoch] = useState(0);
  const parentAuthority = useRef(createCommerceContextFence());
  const renderedResource = JSON.stringify([
    c.conversationId ?? null,
    c.order?.id ?? null,
    c.order?.version ?? null,
  ]);
  const resourceRef = useRef(renderedResource);
  const renderedIdentity = JSON.stringify([
    c.user?.uid ?? null,
    renderedResource,
  ]);
  const identityRef = useRef<string | null>(null);
  if (identityRef.current !== renderedIdentity) {
    identityRef.current = renderedIdentity;
    resourceRef.current = renderedResource;
    parentAuthority.current.reset(c.user?.uid ?? null, renderedResource);
  }
  const observedUid = useRef(auth?.currentUser?.uid ?? null);
  useEffect(() => {
    if (!auth) return;
    let live = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!live) return;
      const uid = user?.uid ?? null;
      if (observedUid.current !== uid) {
        observedUid.current = uid;
        parentAuthority.current.reset(uid, resourceRef.current);
        setIdentityEpoch((epoch) => epoch + 1);
      }
    });
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);
  if ((auth?.currentUser?.uid ?? null) !== (c.user?.uid ?? null)) return null;
  return (
    <CommercePanelContext
      key={JSON.stringify([
        c.user?.uid ?? null,
        c.conversationId ?? null,
        c.order?.id ?? null,
        c.order?.version ?? null,
        identityEpoch,
        parentAuthority.current.snapshot().epoch,
      ])}
      commerce={c}
      parentAuthority={parentAuthority.current}
      language={language}
      hasMessages={hasMessages}
    />
  );
}
function CommercePanelContext({
  commerce: c,
  parentAuthority,
  language,
  hasMessages,
}: {
  commerce: Commerce;
  parentAuthority: ReturnType<typeof createCommerceContextFence>;
  language: "vi" | "en";
  hasMessages: boolean;
}) {
  const vi = language === "vi",
    t = (a: string, b: string) => (vi ? a : b);
  const [editing, setEditing] = useState(false),
    [checkout, setCheckout] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [paymentExpiry, setPaymentExpiry] = useState(0),
    [clock, setClock] = useState(Date.now());
  useEffect(() => {
    if (!paymentExpiry) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [paymentExpiry]);
  const [recipientEditing, setRecipientEditing] = useState(false);
  const capturedParentScope = useRef(parentAuthority.snapshot());
  const panelFence = useRef(createCommerceContextFence());
  const panelScope = useRef<CommerceScope | null>(null);
  if (!panelScope.current) {
    panelFence.current.reset(
      c.user?.uid ?? null,
      JSON.stringify([
        c.conversationId ?? null,
        c.order?.id ?? null,
        c.order?.version ?? null,
      ]),
    );
    panelScope.current = panelFence.current.snapshot();
  }
  const livePanel = useRef(true);
  const currentPanel = () =>
    livePanel.current &&
    parentAuthority.current(
      capturedParentScope.current,
      auth?.currentUser?.uid ?? null,
    ) &&
    panelScope.current !== null &&
    panelFence.current.current(
      panelScope.current,
      auth?.currentUser?.uid ?? null,
    );
  const ownsPayment = (token: number) =>
    currentPanel() &&
    panelScope.current !== null &&
    panelFence.current.ownsBusy(
      panelScope.current,
      token,
      auth?.currentUser?.uid ?? null,
    );
  useEffect(() => {
    livePanel.current = true;
    panelFence.current.reset(
      c.user?.uid ?? null,
      JSON.stringify([
        c.conversationId ?? null,
        c.order?.id ?? null,
        c.order?.version ?? null,
      ]),
    );
    panelScope.current = panelFence.current.snapshot();
    return () => {
      livePanel.current = false;
      panelFence.current.reset(null, undefined);
    };
  }, []);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const paymentOp = useRef<string | null>(null);
  const [addresses, setAddresses] = useState<
    { id: string; recipient: string; phone: string; address: string }[]
  >([]);
  const [recipient, setRecipient] = useState({
    recipient: "",
    phone: "",
    address: "",
  });
  useEffect(() => {
    if (!db || !c.user || !currentPanel()) return;
    let live = true;
    const unsubscribe = onSnapshot(
      query(
        collection(db, "addresses"),
        where("ownerId", "==", c.user.uid),
        limit(20),
      ),
      (snap) => {
        if (!live || !currentPanel()) return;
        setAddresses(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as (typeof addresses)[number],
          ),
        );
      },
      () => {},
    );
    return () => {
      live = false;
      unsubscribe();
    };
  }, [c.user?.uid, c.conversationId]);
  useEffect(() => {
    setRecipient({ recipient: "", phone: "", address: "" });
    if (
      !db ||
      !c.user ||
      !c.order ||
      !c.conversation?.recipientSaved ||
      !currentPanel()
    )
      return;
    const uid = c.user.uid,
      orderId = c.order.id;
    let live = true;
    const unsubscribe = onSnapshot(
      doc(db, "orderRecipients", orderId),
      (snap) => {
        if (!live || !currentPanel()) return;
        const saved = snap.data();
        if (saved && saved.ownerId === uid)
          setRecipient({
            recipient: saved.recipient,
            phone: saved.phone,
            address: saved.address,
          });
      },
      () => {
        if (live && currentPanel())
          c.setError(
            "Chưa tải được thông tin nhận hàng. Thử lại khi có kết nối.",
          );
      },
    );
    return () => {
      live = false;
      unsubscribe();
    };
  }, [
    c.user?.uid,
    c.conversationId,
    c.order?.id,
    c.order?.version,
    c.conversation?.recipientSaved,
  ]);
  async function payment() {
    if (!c.order || !currentPanel()) return;
    if (!c.conversation?.recipientSaved) {
      c.setError("Lưu thông tin nhận hàng trước khi thanh toán.");
      return;
    }
    const token = panelFence.current.begin();
    setPaymentBusy(true);
    c.setError("");
    paymentOp.current ??= crypto.randomUUID();
    try {
      const r = await callService<ChatPayment>("createPaymentLink", {
        orderId: c.order.id,
        purpose: paymentPurpose(c.order),
        operationId: paymentOp.current,
      });
      if (!ownsPayment(token)) return;
      const checkoutUrl = safeCheckout(r.checkoutUrl);
      if (!checkoutUrl) throw Error("INVALID_CHECKOUT");
      let image = "";
      if (r.qrCode) {
        if (!r.expiresAt || r.expiresAt <= Date.now())
          throw Error("EXPIRED_PAYMENT");
        const due = paymentDue(c.order);
        if (r.amount !== due || !r.accountNumber || !r.description)
          throw Error("INVALID_PAYMENT");
        validatePaymentQr(r.qrCode, {
          accountNumber: r.accountNumber,
          amount: due,
          description: r.description,
          bin: r.bin,
        });
        const { toDataURL } = await import("qrcode");
        if (!ownsPayment(token)) return;
        image = await toDataURL(r.qrCode, {
          margin: 2,
          width: 216,
          errorCorrectionLevel: "M",
        });
      }
      if (!ownsPayment(token)) return;
      setCheckout(checkoutUrl);
      setQrImage(image);
      setPaymentExpiry(r.expiresAt ?? 0);
      setClock(Date.now());
    } catch {
      if (!ownsPayment(token)) return;
      c.setError(
        t(
          "Chưa tạo được trang thanh toán. Thử lại; đơn chưa được ghi nhận thêm tiền.",
          "Payment page unavailable. Retry; no additional payment has been recorded.",
        ),
      );
    } finally {
      if (ownsPayment(token)) setPaymentBusy(false);
    }
  }
  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPanel()) return;
    const f = new FormData(event.currentTarget);
    const items = c.draft.items?.length
      ? c.draft.items.map((item, i) => ({
          ...item,
          name: String(f.get(`name-${i}`)),
          variant: String(f.get(`variant-${i}`)),
          quantity: Number(f.get(`quantity-${i}`)),
          url: String(f.get(`url-${i}`)),
        }))
      : [
          {
            name: String(f.get("name-0")),
            variant: String(f.get("variant-0")),
            quantity: Number(f.get("quantity-0")),
            url: String(f.get("url-0")),
          },
        ];
    const parsed = requestSchema.safeParse({
      ...c.draft,
      market: f.get("market"),
      items,
      notes: String(f.get("notes")),
    });
    if (!parsed.success) {
      c.setError(
        t(
          "Kiểm tra thị trường, tên sản phẩm, số lượng và link.",
          "Check the market, product names, quantities and links.",
        ),
      );
      return;
    }
    c.setDraft(parsed.data);
    setEditing(false);
    if (c.user) void c.run({ action: "saveDraft", payload: parsed.data });
  }
  const validDraft = requestSchema.safeParse(c.draft),
    order = c.order;
  const action = order ? nextCustomerAction(order) : null;
  const money = (n: number) =>
    new Intl.NumberFormat(vi ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);
  return (
    <section
      className={styles.commerce}
      aria-label={t("Yêu cầu mua hộ trong chat", "Buying request in chat")}
    >
      {c.user && c.conversationId && (
        <InlineSupport
          key={`general-support:${c.user.uid}:${c.conversationId}`}
          uid={c.user.uid}
          conversationId={c.conversationId}
          vi={vi}
          hasOrder={!!order}
          disabled={c.busy || !!c.pendingOperation}
          beforeSend={async () =>
            c.conversation
              ? true
              : c.run({ action: "saveDraft", payload: c.draft })
          }
        />
      )}
      {!order && (
        <>
          {c.catalogSlugs.length > 0 && (
            <CatalogPurchase commerce={c} vi={vi} />
          )}
          {(hasMessages || !!c.draft.items?.length) && (
            <details className={styles.manualFallback}>
              <summary onClick={() => setEditing(true)}>
                {t("Điền thông tin nếu cần", "Enter details if needed")}
              </summary>
              {editing && (
                <form onSubmit={saveDraft} className={styles.inlineForm}>
                  <label>
                    <span className="formLabelText">
                      {t("Mua từ", "Source market")}{" "}
                      <span className="requiredMark" aria-hidden="true">
                        *
                      </span>
                    </span>
                    <select
                      name="market"
                      defaultValue={c.draft.market ?? ""}
                      required
                    >
                      <option value="">
                        {t("Chọn thị trường", "Choose market")}
                      </option>
                      <option value="US">US</option>
                      <option value="JP">JP</option>
                      <option value="KR">KR</option>
                    </select>
                  </label>
                  {(c.draft.items?.length
                    ? c.draft.items
                    : [{ name: "", variant: "", quantity: 1, url: "" }]
                  ).map((item, i) => (
                    <fieldset key={i}>
                      <legend>{t(`Sản phẩm ${i + 1}`, `Item ${i + 1}`)}</legend>
                      <label>
                        <span className="formLabelText">
                          {t("Tên sản phẩm", "Product name")}{" "}
                          <span className="requiredMark" aria-hidden="true">
                            *
                          </span>
                        </span>
                        <input
                          name={`name-${i}`}
                          defaultValue={item.name}
                          required
                          minLength={2}
                          maxLength={200}
                        />
                      </label>
                      <label>
                        {t("Link", "Link")}
                        <input
                          name={`url-${i}`}
                          defaultValue={item.url ?? ""}
                          type="url"
                          maxLength={2048}
                        />
                      </label>
                      <label>
                        {t("Màu / size / phiên bản", "Color / size / variant")}
                        <input
                          name={`variant-${i}`}
                          defaultValue={item.variant}
                          maxLength={200}
                        />
                      </label>
                      <label>
                        <span className="formLabelText">
                          {t("Số lượng", "Quantity")}{" "}
                          <span className="requiredMark" aria-hidden="true">
                            *
                          </span>
                        </span>
                        <input
                          name={`quantity-${i}`}
                          type="number"
                          defaultValue={item.quantity}
                          min={1}
                          max={100}
                          required
                        />
                      </label>
                    </fieldset>
                  ))}
                  <label>
                    {t("Ghi chú", "Notes")}
                    <textarea
                      name="notes"
                      defaultValue={c.draft.notes ?? ""}
                      maxLength={2000}
                    />
                  </label>
                  <button disabled={c.busy}>
                    {t("Lưu bản nháp", "Save draft")}
                  </button>
                </form>
              )}
            </details>
          )}
          {c.draft.items?.map((i, n) => (
            <p key={n}>
              {i.name} ·{" "}
              {i.variant || t("Chưa chọn phiên bản", "Variant unspecified")} ·{" "}
              {i.quantity}
            </p>
          ))}
          {c.draft.market && (
            <p>
              {t("Thị trường", "Market")}: {c.draft.market}
            </p>
          )}
          {c.draft.budget !== undefined && (
            <p>
              {t("Ngân sách", "Budget")}: {money(c.draft.budget)}
            </p>
          )}
          {c.draft.notes && <p>{c.draft.notes}</p>}
          {validDraft.success && (
            <p>
              {t(
                "Kiểm tra sản phẩm trước khi gửi. Đây là yêu cầu báo giá, chưa mua hoặc thanh toán.",
                "Review the items before sending. This requests a quote; it does not purchase or pay.",
              )}
            </p>
          )}
          {validDraft.success && c.user && (
            <button
              disabled={c.busy}
              type="button"
              onClick={() =>
                void c.run({
                  action: "submitRequest",
                  payload: validDraft.data,
                })
              }
            >
              {t("Gửi yêu cầu mua hộ", "Send buying request")}
            </button>
          )}
        </>
      )}
      {!c.user && (
        <button
          type="button"
          onClick={() =>
            void login().catch(
              () =>
                currentPanel() &&
                c.setError(
                  t(
                    "Chưa đăng nhập được. Thử lại.",
                    "Sign-in failed. Try again.",
                  ),
                ),
            )
          }
        >
          {t("Đăng nhập để lưu và gửi yêu cầu", "Sign in to save and send")}
        </button>
      )}
      {order && (
        <article className={styles.invoiceCard}>
          <div className={styles.invoiceHeading}>
            <h2>{t("Đơn mua hộ", "Buying order")}</h2>
            <p role="status" className={styles.orderBadge}>
              {vi
                ? orderStageLabel(order)
                : {
                    REQUESTED: "Request sent",
                    QUOTED: "Review quote",
                    QUOTE_ACCEPTED:
                      order.purchaseKind === "catalog"
                        ? paymentDue(order)
                          ? "Awaiting full payment"
                          : "Paid · awaiting purchase"
                        : "Awaiting deposit",
                    PURCHASING: "Purchasing",
                    PURCHASED: "Purchased",
                    ORIGIN_RECEIVED: "Received at source warehouse",
                    PACKED:
                      order.purchaseKind === "catalog"
                        ? "Packed"
                        : "Awaiting remaining payment",
                    READY_TO_SHIP: "Ready to ship",
                    IN_TRANSIT: "In transit",
                    DELIVERED: "Delivered",
                    COMPLETED: "Completed",
                    CANCELLED: "Cancelled",
                  }[order.stage]}
            </p>
          </div>
          {order.hold && (
            <p>
              {t(
                "Đơn đang tạm giữ. Nhân viên sẽ xử lý bước tiếp theo.",
                "Order on hold. Staff will handle the next step.",
              )}
            </p>
          )}
          <div className={styles.orderItems}>
            {order.items.map((i, n) => (
              <div key={n}>
                <strong>{i.name}</strong>
                <span>
                  {i.variant} · {vi ? "Số lượng" : "Quantity"} {i.quantity} ·{" "}
                  {order.market}
                </span>
              </div>
            ))}
          </div>
          <InvoiceSummary order={order} vi={vi} money={money} />
          {(!c.conversation?.recipientSaved || recipientEditing) &&
            (["REQUESTED", "QUOTED"].includes(order.stage) ||
              (order.purchaseKind === "catalog" &&
                order.stage === "QUOTE_ACCEPTED" &&
                order.collected === 0 &&
                order.refunded === 0)) && (
              <form
                className={styles.inlineForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!currentPanel()) return;
                  void c.run({
                    action: "saveRecipient",
                    expectedOrderVersion: order.version,
                    payload: recipient,
                  });
                }}
              >
                <h3>{t("Thông tin nhận hàng", "Delivery details")}</h3>
                {!!addresses.length && (
                  <label>
                    {t("Dùng địa chỉ đã lưu", "Use saved address")}
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const a = addresses.find(
                          (a) => a.id === e.target.value,
                        );
                        if (a)
                          setRecipient({
                            recipient: a.recipient,
                            phone: a.phone,
                            address: a.address,
                          });
                      }}
                    >
                      <option value="">
                        {t("Chọn địa chỉ", "Choose address")}
                      </option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.recipient} · {a.address}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  <span className="formLabelText">
                    {t("Người nhận", "Recipient")}{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    value={recipient.recipient}
                    onChange={(e) =>
                      setRecipient({ ...recipient, recipient: e.target.value })
                    }
                    minLength={2}
                    maxLength={120}
                    required
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span className="formLabelText">
                    {t("Số điện thoại", "Phone")}{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <input
                    value={recipient.phone}
                    onChange={(e) =>
                      setRecipient({ ...recipient, phone: e.target.value })
                    }
                    minLength={8}
                    maxLength={20}
                    required
                    type="tel"
                    autoComplete="tel"
                  />
                </label>
                <label>
                  <span className="formLabelText">
                    {t("Địa chỉ nhận", "Delivery address")}{" "}
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <textarea
                    value={recipient.address}
                    onChange={(e) =>
                      setRecipient({ ...recipient, address: e.target.value })
                    }
                    minLength={10}
                    maxLength={500}
                    required
                    autoComplete="street-address"
                  />
                </label>
                <p>
                  {t(
                    order.purchaseKind === "catalog"
                      ? "Thông tin này dùng để giao hàng, không gửi cho AI. Kiểm tra trước khi thanh toán."
                      : "Thông tin này dùng để giao hàng, không gửi cho AI. Kiểm tra trước khi chốt báo giá.",
                    order.purchaseKind === "catalog"
                      ? "These details are used for delivery, not sent to AI. Review before payment."
                      : "These details are used for delivery, not sent to AI. Review before accepting the quote.",
                  )}
                </p>
                <button disabled={c.busy}>
                  {t("Lưu thông tin nhận hàng", "Save delivery details")}
                </button>
              </form>
            )}
          {c.conversation?.recipientSaved && (
            <details className={styles.deliveryDetails}>
              <summary>
                {t("Giao đến", "Delivery address")} · {recipient.recipient}
              </summary>
              <p>
                {t("Thông tin nhận hàng đã lưu", "Saved delivery details")}:{" "}
                {recipient.recipient} · {recipient.phone}
                <br />
                {recipient.address}
              </p>
              {(["REQUESTED", "QUOTED"].includes(order.stage) ||
                (order.purchaseKind === "catalog" &&
                  order.stage === "QUOTE_ACCEPTED" &&
                  order.collected === 0 &&
                  order.refunded === 0)) && (
                <button
                  type="button"
                  onClick={() => setRecipientEditing(!recipientEditing)}
                >
                  {t("Kiểm tra / sửa địa chỉ", "Review / edit address")}
                </button>
              )}
            </details>
          )}
          {action === "acceptQuote" && order.quote && (
            <button
              className={styles.primaryAction}
              type="button"
              disabled={
                c.busy ||
                !c.conversation?.recipientSaved ||
                recipientEditing ||
                order.quote.expiresAt <= Date.now()
              }
              onClick={() =>
                void c.run({
                  action: "acceptQuote",
                  expectedOrderVersion: order.version,
                  payload: { quoteVersion: order.quoteVersion },
                })
              }
            >
              {t("Chấp nhận báo giá và mức cọc", "Accept quote and deposit")}
            </button>
          )}
          {order.quote &&
            action === "acceptQuote" &&
            order.quote.expiresAt <= Date.now() && (
              <p>
                {t(
                  "Báo giá đã hết hạn. Cần báo giá mới từ nhân viên.",
                  "Quote expired. Staff must provide a new quote.",
                )}
              </p>
            )}
          {action === "approveFinal" && (
            <button
              className={styles.primaryAction}
              disabled={c.busy}
              type="button"
              onClick={() =>
                void c.run({
                  action: "approveFinal",
                  expectedOrderVersion: order.version,
                  payload: {},
                })
              }
            >
              {t("Duyệt tổng phí cuối", "Approve final total")}
            </button>
          )}
          {action === "payment" && (
            <>
              <p className={styles.amountDue}>
                {t("Còn cần thanh toán", "Amount due")}:{" "}
                {money(paymentDue(order))}
              </p>
              <button
                className={styles.primaryAction}
                disabled={
                  c.busy ||
                  !c.conversation?.recipientSaved ||
                  recipientEditing ||
                  paymentBusy ||
                  (!!paymentExpiry && paymentExpiry <= clock)
                }
                type="button"
                onClick={() => void payment()}
              >
                {t("Mở bước thanh toán", "Prepare payment")}
              </button>
            </>
          )}
          {checkout &&
            action === "payment" &&
            (!paymentExpiry || paymentExpiry > clock) && (
              <div className={styles.paymentCard}>
                {qrImage && (
                  <img
                    src={qrImage}
                    alt={t(
                      "QR thanh toán cho khoản đang cần thanh toán",
                      "QR for the current amount due",
                    )}
                    width={216}
                    height={216}
                  />
                )}
                <p>
                  <a href={checkout} target="_blank" rel="noopener noreferrer">
                    {t(
                      "Kiểm tra và thanh toán tại payOS",
                      "Review and pay at payOS",
                    )}
                  </a>
                  <br />
                  {t(
                    "Quay lại chat để theo dõi. Tiền chỉ được xác nhận sau khi hệ thống đối chiếu.",
                    "Return to chat to track progress. Payment is confirmed only after verification.",
                  )}
                </p>
              </div>
            )}
          {!!paymentExpiry &&
            paymentExpiry <= clock &&
            action === "payment" && (
              <p role="status">
                {t(
                  "QR đã hết hạn. Gửi yêu cầu hỗ trợ để nhân viên đối chiếu trước khi thanh toán lại.",
                  "QR expired. Ask staff to reconcile before paying again.",
                )}
              </p>
            )}
          {action === "waiting" && (
            <p>
              {t(
                "Đang chờ nhân viên hoặc đơn vị vận chuyển xử lý. Tiến độ sẽ cập nhật tại đây.",
                "Waiting for staff or the carrier. Progress will update here.",
              )}
            </p>
          )}
          {action === "confirmReceipt" && (
            <button
              className={styles.primaryAction}
              type="button"
              disabled={c.busy}
              onClick={() =>
                void c.run({
                  action: "confirmReceipt",
                  expectedOrderVersion: order.version,
                  payload: { received: true },
                })
              }
            >
              {t("Xác nhận đã nhận đủ hàng", "Confirm all items received")}
            </button>
          )}
          {order.tracking && (
            <p className={styles.trackingLine}>
              {t("Mã vận chuyển", "Tracking reference")}: {order.tracking}
            </p>
          )}
          {c.user?.uid === order.ownerId && (
            <AskOrderChanges
              key={"changes:" + c.user.uid + ":" + order.id}
              order={order}
              vi={vi}
            />
          )}
          <InlineSupport
            key={`order-support:${c.user?.uid}:${order.id}`}
            uid={c.user?.uid}
            orderId={order.id}
            vi={vi}
          />
        </article>
      )}
      {c.pendingOperation && (
        <button type="button" disabled={c.busy} onClick={() => void c.resume()}>
          {t("Đối chiếu thao tác đang chờ", "Recover pending action")}
        </button>
      )}
      {order &&
        ["COMPLETED", "CANCELLED", "DELIVERED"].includes(order.stage) &&
        c.user &&
        !c.busy &&
        !c.pendingOperation && (
          <button
            className={styles.secondaryAction}
            type="button"
            onClick={() => void c.newConversation()}
          >
            {t("Bắt đầu yêu cầu khác", "Start another request")}
          </button>
        )}
      {(c.busy || paymentBusy) && (
        <LoadingState overlay={false}>
          {t("Đang xử lý…", "Processing…")}
        </LoadingState>
      )}
      {c.error && (
        <p role="alert">
          {vi
            ? c.error
            : "This step could not finish. Check your connection and retry."}
        </p>
      )}
    </section>
  );
}
