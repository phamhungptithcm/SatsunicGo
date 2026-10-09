import { linkAnalyticsOrder } from "../../shared/analytics";
import { LoadingState } from "../../shared/Loading";
import {
  admitAskCommandResult,
  admitAskRecoveryResult,
  admitAskPendingEnvelope,
} from "../../../packages/domain/ask-command-result";
import { askConversationSchema } from "../../../packages/domain/ask-workflow";
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
  useLayoutEffect,
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
  recipientSchema,
  shoppingDraftSchema,
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
export type CommerceMutation = {
  action: string;
  payload: unknown;
  expectedOrderVersion?: number;
};
type Mutation = CommerceMutation;
type ReadinessIssue =
  | "draft-conflict"
  | "manual-unsaved"
  | "recipient-unsaved"
  | "recipient-unverified";
export function askReadinessMessage(
  issue: ReadinessIssue,
  language: "vi" | "en",
) {
  const messages = {
    "draft-conflict": [
      "Bản nháp đã thay đổi ở nơi khác. Tải lại và kiểm tra bản mới trước khi lưu hoặc gửi.",
      "The draft changed elsewhere. Reload and review the latest draft before saving or sending.",
    ],
    "manual-unsaved": [
      "Thông tin đang sửa chưa được lưu. Lưu bản nháp, kiểm tra lại rồi gửi yêu cầu.",
      "Your edits are not saved. Save the draft, review it, then send the request.",
    ],
    "recipient-unsaved": [
      "Thông tin nhận hàng đang được sửa. Lưu và kiểm tra lại trước khi tiếp tục.",
      "Delivery details are being edited. Save and review them before continuing.",
    ],
    "recipient-unverified": [
      "Chưa xác minh được thông tin nhận hàng đã lưu. Chờ tải xong hoặc kiểm tra kết nối.",
      "Saved delivery details are not verified yet. Wait for them to load or check your connection.",
    ],
  };
  return messages[issue][language === "vi" ? 0 : 1];
}
function readinessFromError(value: string): ReadinessIssue | null {
  const issue = value.replace(/^ASK_READINESS:/, "");
  return value.startsWith("ASK_READINESS:") &&
    [
      "draft-conflict",
      "manual-unsaved",
      "recipient-unsaved",
      "recipient-unverified",
    ].includes(issue)
    ? (issue as ReadinessIssue)
    : null;
}
const draftSignature = (value: unknown) => {
  const parsed = shoppingDraftSchema.safeParse(value ?? {});
  return JSON.stringify(parsed.success ? parsed.data : (value ?? {}));
};
type EditorReadiness = {
  manualDirty: boolean;
  recipientEditing: boolean;
  recipientVerified: boolean;
  recipientVersion?: number;
};
export function useAskCommerce(
  onRestore: (c: AskConversation) => void,
  enabled = true,
) {
  const [user, setUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<AskConversation | null>(
    null,
  );
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [restorationReady, setRestorationReady] = useState(false);
  const [draft, updateDraft] = useState<ShoppingDraft>({});
  const draftBase = useRef({ signature: draftSignature({}), version: 0 });
  const draftConflict = useRef(false);
  const [, refreshDraftReadiness] = useState(0);
  const editorReadiness = useRef<{ owner?: object; state: EditorReadiness }>({
    state: {
      manualDirty: false,
      recipientEditing: false,
      recipientVerified: false,
    },
  });
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
  const setDraft = useCallback(
    (next: ShoppingDraft | ((previous: ShoppingDraft) => ShoppingDraft)) => {
      const value = typeof next === "function" ? next(draftRef.current) : next;
      draftRef.current = value;
      updateDraft(value);
      if (draftSignature(value) === draftBase.current.signature)
        draftConflict.current = false;
    },
    [],
  );
  const publishEditorReadiness = useCallback(
    (owner: object, state: EditorReadiness | null) => {
      if (!isCurrent(renderedScope)) return;
      const previous = editorReadiness.current;
      if (state) editorReadiness.current = { owner, state };
      else if (previous.owner === owner)
        editorReadiness.current = {
          state: {
            manualDirty: false,
            recipientEditing: false,
            recipientVerified: false,
          },
        };
      if (
        JSON.stringify(previous.state) !==
        JSON.stringify(editorReadiness.current.state)
      )
        refreshDraftReadiness((value) => value + 1);
    },
    [user, conversationId, renderedScope.epoch],
  );
  const readinessIssue = useCallback(
    (action: string): ReadinessIssue | null => {
      if (
        ["saveDraft", "submitRequest"].includes(action) &&
        draftConflict.current
      )
        return "draft-conflict";
      if (
        action === "submitRequest" &&
        editorReadiness.current.state.manualDirty
      )
        return "manual-unsaved";
      if (["acceptQuote", "payment"].includes(action)) {
        if (!conversationRef.current?.recipientSaved)
          return "recipient-unsaved";
        if (
          !editorReadiness.current.state.recipientVerified ||
          editorReadiness.current.state.recipientVersion !== version.current
        )
          return "recipient-unverified";
        if (editorReadiness.current.state.recipientEditing)
          return "recipient-unsaved";
      }
      return null;
    },
    [],
  );
  const recipientRevisionCurrent = useCallback(
    (verifiedVersion: number) => verifiedVersion === version.current,
    [],
  );
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const verifiedConversationVersion = useRef<number | null>(null);
  const verifiedOrderVersion = useRef<number | null>(null);
  const liveOrder = useRef(order);
  liveOrder.current = order;
  useEffect(() => {
    if (!auth || !enabled) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      const epoch = ++restorationEpoch.current;
      const previousUid = currentUid.current;
      currentUid.current = u?.uid ?? null;
      contextFence.current.reset(currentUid.current, undefined);
      verifiedConversationVersion.current = null;
      verifiedOrderVersion.current = null;
      setBusy(false);
      queue.current = Promise.resolve();
      draftBase.current = { signature: draftSignature({}), version: 0 };
      draftConflict.current = false;
      editorReadiness.current = {
        state: {
          manualDirty: false,
          recipientEditing: false,
          recipientVerified: false,
        },
      };
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
      if (saved)
        setClientPending(
          admitAskPendingEnvelope(JSON.parse(saved), conversationId)
            .operationId,
        );
    } catch {
      setClientPending("invalid-pending-identity");
      setError("ASK_PENDING_UNVERIFIED");
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
        const raw = snap.data();
        const parsed = askConversationSchema.safeParse(raw);
        if (
          raw !== undefined &&
          (!parsed.success || parsed.data.ownerId !== user.uid)
        ) {
          hydrated.current = false;
          setRestorationReady(false);
          setConversation(null);
          verifiedConversationVersion.current = null;
          setOrder(null);
          setDraft({});
          restore.current({
            ownerId: user.uid,
            version: 0,
            updatedAt: 0,
            turns: [],
          });
          setError("ASK_CONVERSATION_UNVERIFIED");
          return;
        }
        const c = parsed.success ? parsed.data : undefined;
        setError((previous) =>
          previous === "ASK_CONVERSATION_UNVERIFIED" ? "" : previous,
        );
        if (c) {
          if (c.version < draftBase.current.version) return;
          if (currentOrderId.current !== c.orderId) setOrder(null);
          currentOrderId.current = c.orderId;
          version.current = Math.max(version.current, c.version);
          conversationRef.current = c;
          if (!snap.metadata.fromCache)
            verifiedConversationVersion.current = c.version;
          setConversation(c);
          const signature = draftSignature(c.draft);
          if (!hydrated.current) {
            setDraft(c.draft ?? draftRef.current);
            restore.current(c);
          } else if (signature !== draftBase.current.signature) {
            const localDirty =
              editorReadiness.current.state.manualDirty ||
              draftSignature(draftRef.current) !== draftBase.current.signature;
            if (localDirty && signature !== draftSignature(draftRef.current))
              draftConflict.current = true;
            else {
              draftConflict.current = false;
              setDraft(c.draft ?? {});
            }
            refreshDraftReadiness((value) => value + 1);
          }
          draftBase.current = { signature, version: c.version };
        }
        hydrated.current = true;
        setRestorationReady(true);
      },
      () => {
        if (!valid()) return;
        verifiedConversationVersion.current = null;
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
    liveOrder.current = null;
    verifiedOrderVersion.current = null;
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
      { includeMetadataChanges: true },
      (snap) => {
        if (valid()) {
          const value = (snap.data() as Order) ?? null;
          liveOrder.current = value;
          verifiedOrderVersion.current =
            !snap.metadata.fromCache && value?.ownerId === user.uid
              ? value.version
              : null;
          setOrder(value);
        }
      },
      () => {
        if (valid()) verifiedOrderVersion.current = null;
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
  function commandScope() {
    const scope = contextFence.current.snapshot();
    const currentOrder = liveOrder.current;
    if (
      !isCurrent(scope) ||
      !scope.uid ||
      !scope.cid ||
      !hydrated.current ||
      verifiedConversationVersion.current !== version.current ||
      (currentOrderId.current &&
        (!currentOrder ||
          currentOrder.ownerId !== scope.uid ||
          currentOrder.id !== currentOrderId.current ||
          verifiedOrderVersion.current !== currentOrder.version))
    )
      return null;
    return {
      ownerId: scope.uid,
      conversationId: scope.cid,
      epoch: scope.epoch,
      conversationVersion: version.current,
      orderId: currentOrder?.id ?? null,
      orderVersion: currentOrder?.version ?? null,
      draftSignature: draftSignature(draftRef.current),
    };
  }
  function commandIdentity() {
    const value = contextFence.current.snapshot();
    // View identity also binds anonymous drafts; commandScope still requires
    // authenticated, hydrated metadata before any consequential action.
    return isCurrent(value)
      ? {
          ownerId: value.uid,
          conversationId: value.cid ?? null,
          epoch: value.epoch,
        }
      : null;
  }
  function reviewBarrier() {
    const scope = renderedScope;
    const job = queue.current
      .catch(() => {})
      .then(() => (isCurrent(scope) ? commandScope() : null));
    queue.current = job;
    return job;
  }
  const mutate = useCallback(
    (input: Mutation, admit?: () => boolean) => {
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
          const issue = readinessIssue(input.action);
          if (issue) throw Error(`ASK_READINESS:${issue}`);
          if (
            input.action === "submitRequest" &&
            draftSignature(input.payload) !== draftSignature(draftRef.current)
          )
            throw Error("ASK_READINESS:draft-conflict");
          const key = `ask-pending:${uid}:${cid}`;
          // Non-PII command envelopes survive reload for recovery of unknown results.
          const stored = sessionStorage.getItem(key);
          const pending = stored
            ? admitAskPendingEnvelope(JSON.parse(stored), cid)
            : null;
          if (pending && pending.action !== "catalogCheckout")
            throw Error("ASK_COMMAND_RESULT_UNVERIFIED");
          // Preview consent is local metadata: never put it in the RPC envelope.
          // A pending catalog command must be reconciled, not replayed by new consent.
          if (admit && (pending || !admit())) throw Error("ASK_PREVIEW_STALE");
          const envelope = pending
            ? {
                ...pending,
                payload: pending.payload,
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
            const rawResult = await callService<unknown>(
              "askWorkflow",
              envelope,
            );
            const result = admitAskCommandResult(rawResult, {
              action: envelope.action,
              expectedVersion: envelope.expectedVersion,
              ...(conversation?.orderId
                ? { orderId: conversation.orderId }
                : {}),
            });
            if (!isCurrent(scope)) return result;
            if (
              ["submitRequest", "catalogCheckout"].includes(envelope.action) &&
              result.id
            )
              linkAnalyticsOrder(result.id);
            version.current = Math.max(version.current, result.version);
            if (
              envelope.action === "saveDraft" &&
              result.version >= draftBase.current.version
            ) {
              draftBase.current = {
                signature: draftSignature(envelope.payload),
                version: result.version,
              };
              draftConflict.current = false;
              refreshDraftReadiness((value) => value + 1);
            }
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
    [user, conversationId, renderedScope.epoch, conversation?.orderId],
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
  async function run(input: Mutation, admit?: () => boolean) {
    const scope = renderedScope;
    if (!isCurrent(scope)) return false;
    const token = contextFence.current.begin();
    setBusy(true);
    setError("");
    try {
      await mutate(input, admit);
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
      version.current = admitAskCommandResult(result, {
        action: "saveDraft",
        expectedVersion: 0,
      }).version;
      hydrated.current = false;
      setRestorationReady(false);
      currentCid.current = id;
      contextFence.current.reset(uid, id);
      verifiedConversationVersion.current = null;
      verifiedOrderVersion.current = null;
      queue.current = Promise.resolve();
      setBusy(false);
      setConversation(null);
      setOrder(null);
      setDraft({});
      draftBase.current = {
        signature: draftSignature({}),
        version: result.version,
      };
      draftConflict.current = false;
      editorReadiness.current = {
        state: {
          manualDirty: false,
          recipientEditing: false,
          recipientVerified: false,
        },
      };
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
      const key = `ask-pending:${uid}:${cid}`;
      const saved = sessionStorage.getItem(key);
      const original = saved
        ? admitAskPendingEnvelope(JSON.parse(saved), cid)
        : undefined;
      const rawResult = await callService<unknown>("askWorkflow", {
        conversationId: cid,
        operationId: crypto.randomUUID(),
        expectedVersion: version.current,
        action: "resume",
        payload: clientPending ? { operationId: clientPending } : {},
      });
      if (!ownsBusy(scope, token)) return;
      const result = admitAskRecoveryResult(
        rawResult,
        original
          ? {
              action: original.action,
              expectedVersion: original.expectedVersion,
              ...(conversation?.orderId
                ? { orderId: conversation.orderId }
                : {}),
            }
          : undefined,
        conversation?.orderId,
      );
      if (
        original &&
        ["submitRequest", "catalogCheckout"].includes(original.action) &&
        "id" in result &&
        result.id
      )
        linkAnalyticsOrder(result.id);
      version.current = Math.max(version.current, result.version);
      const current = sessionStorage.getItem(key);
      if (current && JSON.parse(current).operationId === original?.operationId)
        sessionStorage.removeItem(key);
      setClientPending(null);
      setError(
        "outcome" in result && result.outcome === "no_operation"
          ? "Chưa ghi nhận thao tác trước. Kiểm tra lựa chọn rồi gửi lại."
          : "",
      );
      return "outcome" in result && result.outcome === "no_operation"
        ? ("no_operation" as const)
        : ("recorded" as const);
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
    commandScope,
    commandIdentity,
    reviewBarrier,
    draft,
    setDraft,
    readinessIssue,
    publishEditorReadiness,
    recipientRevisionCurrent,
    order,
    error,
    setError,
    busy,
    run,
    resolved,
  };
}
export type Commerce = ReturnType<typeof useAskCommerce>;
type PanelDraftView = {
  manualFields?: Record<string, string>;
  manualBaseFields?: Record<string, string>;
  observedDraftFields?: Record<string, string>;
  manualDirty?: boolean;
  editing?: boolean;
  recipient?: { recipient: string; phone: string; address: string };
  recipientEditing?: boolean;
};
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
  catalogFocused = false,
}: {
  hasMessages?: boolean;
  catalogFocused?: boolean;
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
  const viewIdentity = JSON.stringify([
    c.user?.uid ?? null,
    c.conversationId ?? null,
    c.order?.id ?? null,
    identityEpoch,
  ]);
  const viewDraft = useRef<{ identity: string; value: PanelDraftView }>({
    identity: viewIdentity,
    value: {},
  });
  if (viewDraft.current.identity !== viewIdentity)
    viewDraft.current = { identity: viewIdentity, value: {} };
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
      catalogFocused={catalogFocused}
      viewDraft={viewDraft.current.value}
    />
  );
}
function CommercePanelContext({
  commerce: c,
  parentAuthority,
  language,
  hasMessages,
  catalogFocused,
  viewDraft,
}: {
  commerce: Commerce;
  parentAuthority: ReturnType<typeof createCommerceContextFence>;
  language: "vi" | "en";
  hasMessages: boolean;
  catalogFocused: boolean;
  viewDraft: PanelDraftView;
}) {
  const vi = language === "vi",
    t = (a: string, b: string) => (vi ? a : b);
  const [editing, setEditing] = useState(viewDraft.editing ?? false),
    [checkout, setCheckout] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [paymentExpiry, setPaymentExpiry] = useState(0),
    [clock, setClock] = useState(Date.now());
  useEffect(() => {
    if (!paymentExpiry) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [paymentExpiry]);
  const [recipientEditing, setRecipientEditing] = useState(
    viewDraft.recipientEditing ?? false,
  );
  const [manualDirty, setManualDirty] = useState(
    viewDraft.manualDirty ?? false,
  );
  const draftFields: Record<string, string> = {
    market: c.draft.market ?? "",
    notes: c.draft.notes ?? "",
  };
  (c.draft.items?.length
    ? c.draft.items
    : [{ name: "", variant: "", quantity: 1, url: "" }]
  ).forEach((item, index) => {
    for (const field of ["name", "variant", "quantity", "url"] as const)
      draftFields[`${field}-${index}`] = String(item[field] ?? "");
  });
  function manualValue(name: string) {
    // A newer chat edit wins for that field; unrelated unsaved form edits stay.
    if (viewDraft.observedDraftFields?.[name] !== draftFields[name])
      return draftFields[name];
    return viewDraft.manualBaseFields?.[name] === draftFields[name]
      ? (viewDraft.manualFields?.[name] ?? draftFields[name])
      : draftFields[name];
  }
  const manualRevision = useRef(0),
    recipientRevision = useRef(0);
  const recipientEditingRef = useRef(viewDraft.recipientEditing ?? false);
  const [recipientVerification, setRecipientVerification] = useState<{
    version: number;
    data: { recipient: string; phone: string; address: string };
  } | null>(null);
  const savedRecipient =
    recipientVerification &&
    recipientVerification.version === c.conversation?.version &&
    c.recipientRevisionCurrent(recipientVerification.version)
      ? (recipientVerification?.data ?? null)
      : null;
  const savedRecipientRef = useRef<typeof recipientVerification>(null);
  const [recipientLoadFailed, setRecipientLoadFailed] = useState(false);
  const [recipientReload, setRecipientReload] = useState(0);
  const recipientSave = useRef<{
    revision: number;
    signature: string;
    acknowledged: boolean;
  } | null>(null);
  function closeVerifiedRecipient() {
    const pending = recipientSave.current;
    if (
      pending?.acknowledged &&
      pending.revision === recipientRevision.current &&
      savedRecipientRef.current !== null &&
      c.recipientRevisionCurrent(savedRecipientRef.current.version) &&
      JSON.stringify(savedRecipientRef.current.data) === pending.signature
    ) {
      recipientSave.current = null;
      recipientEditingRef.current = false;
      viewDraft.recipientEditing = false;
      viewDraft.recipient = undefined;
      setRecipientEditing(false);
    }
  }
  const editorOwner = useRef({});
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
  useLayoutEffect(() => {
    if (!currentPanel()) return;
    const previous = viewDraft.observedDraftFields;
    if (previous)
      for (const name of Object.keys(previous)) {
        if (previous[name] !== draftFields[name]) {
          // Retire the old override after a committed replacement. Comparing
          // only values would resurrect it when chat returns to its old value.
          if (viewDraft.manualFields) delete viewDraft.manualFields[name];
          if (viewDraft.manualBaseFields)
            delete viewDraft.manualBaseFields[name];
        }
      }
    viewDraft.observedDraftFields = { ...draftFields };
  });
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
  const [recipient, updateRecipient] = useState(
    viewDraft.recipient ?? {
      recipient: "",
      phone: "",
      address: "",
    },
  );
  function setRecipient(value: typeof recipient) {
    viewDraft.recipient = value;
    updateRecipient(value);
  }
  useLayoutEffect(() => {
    if (currentPanel())
      c.publishEditorReadiness?.(editorOwner.current, {
        manualDirty,
        recipientEditing,
        recipientVerified: savedRecipient !== null,
        recipientVersion: savedRecipient
          ? recipientVerification?.version
          : undefined,
      });
    const owner = editorOwner.current;
    return () => c.publishEditorReadiness?.(owner, null);
  }, [
    c.publishEditorReadiness,
    manualDirty,
    recipientEditing,
    savedRecipient,
    recipientVerification?.version,
  ]);
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
    if (!recipientEditingRef.current)
      setRecipient({ recipient: "", phone: "", address: "" });
    setRecipientVerification(null);
    savedRecipientRef.current = null;
    setRecipientLoadFailed(false);
    if (
      !db ||
      !c.user ||
      !c.order ||
      !c.conversation?.recipientSaved ||
      !currentPanel()
    )
      return;
    const uid = c.user.uid,
      orderId = c.order.id,
      subscriptionVersion = c.conversation.version;
    let live = true;
    const valid = () =>
      live && currentPanel() && c.recipientRevisionCurrent(subscriptionVersion);
    const unsubscribe = onSnapshot(
      doc(db, "orderRecipients", orderId),
      { includeMetadataChanges: true },
      (snap) => {
        if (!valid()) return;
        if (snap.metadata.fromCache) return;
        const saved = snap.data();
        const parsed = recipientSchema.safeParse({
          recipient: saved?.recipient,
          phone: saved?.phone,
          address: saved?.address,
        });
        if (saved?.ownerId === uid && parsed.success) {
          if (
            recipientSave.current &&
            JSON.stringify(parsed.data) !== recipientSave.current.signature
          )
            return;
          const verification = {
            version: subscriptionVersion,
            data: parsed.data,
          };
          savedRecipientRef.current = verification;
          setRecipientVerification(verification);
          setRecipientLoadFailed(false);
          if (!recipientEditingRef.current) setRecipient(parsed.data);
          closeVerifiedRecipient();
        } else {
          savedRecipientRef.current = null;
          setRecipientVerification(null);
          setRecipientLoadFailed(true);
        }
      },
      () => {
        if (valid()) {
          live = false;
          savedRecipientRef.current = null;
          setRecipientVerification(null);
          setRecipientLoadFailed(true);
        }
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
    c.conversation?.version,
    recipientReload,
  ]);
  async function payment() {
    if (!c.order || !currentPanel()) return;
    const readiness = c.readinessIssue("payment");
    if (readiness) {
      c.setError(`ASK_READINESS:${readiness}`);
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
  async function saveDraft(event: FormEvent<HTMLFormElement>) {
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
    const revision = manualRevision.current;
    const saved =
      !c.user || (await c.run({ action: "saveDraft", payload: parsed.data }));
    if (saved && currentPanel() && manualRevision.current === revision) {
      setManualDirty(false);
      setEditing(false);
      viewDraft.manualDirty = false;
      viewDraft.editing = false;
      viewDraft.manualFields = undefined;
      viewDraft.manualBaseFields = undefined;
    }
  }
  const validDraft = requestSchema.safeParse(c.draft),
    order = c.order;
  const errorReadiness = readinessFromError(c.error);
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
      {!order && !catalogFocused && (
        <>
          {c.catalogSlugs.length > 0 && (
            <CatalogPurchase commerce={c} vi={vi} />
          )}
          {(hasMessages || !!c.draft.items?.length) && (
            <details className={styles.manualFallback}>
              <summary
                onClick={() => {
                  viewDraft.editing = true;
                  setEditing(true);
                }}
              >
                {t("Điền thông tin nếu cần", "Enter details if needed")}
              </summary>
              {editing && (
                <form
                  onSubmit={saveDraft}
                  onChange={(event) => {
                    manualRevision.current++;
                    viewDraft.manualFields = Object.fromEntries(
                      Array.from(
                        new FormData(event.currentTarget),
                        ([key, value]) => [key, String(value)],
                      ),
                    );
                    viewDraft.manualBaseFields = { ...draftFields };
                    viewDraft.manualDirty = true;
                    setManualDirty(true);
                  }}
                  className={styles.inlineForm}
                >
                  <label>
                    <span className="formLabelText">
                      {t("Mua từ", "Source market")}{" "}
                      <span className="requiredMark" aria-hidden="true">
                        *
                      </span>
                    </span>
                    <select
                      key={c.draft.market ?? ""}
                      name="market"
                      defaultValue={manualValue("market")}
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
                          key={`name-${i}-${item.name}`}
                          name={`name-${i}`}
                          defaultValue={manualValue(`name-${i}`)}
                          required
                          minLength={2}
                          maxLength={200}
                        />
                      </label>
                      <label>
                        {t("Link", "Link")}
                        <input
                          key={`url-${i}-${item.url}`}
                          name={`url-${i}`}
                          defaultValue={manualValue(`url-${i}`)}
                          type="url"
                          maxLength={2048}
                        />
                      </label>
                      <label>
                        {t("Màu / size / phiên bản", "Color / size / variant")}
                        <input
                          key={`variant-${i}-${item.variant}`}
                          name={`variant-${i}`}
                          defaultValue={manualValue(`variant-${i}`)}
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
                          key={`quantity-${i}-${item.quantity}`}
                          name={`quantity-${i}`}
                          type="number"
                          defaultValue={manualValue(`quantity-${i}`)}
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
                      key={c.draft.notes ?? ""}
                      name="notes"
                      defaultValue={manualValue("notes")}
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
              disabled={
                c.busy || manualDirty || !!c.readinessIssue?.("submitRequest")
              }
              type="button"
              onClick={() =>
                void c.run({
                  action: "submitRequest",
                  payload: validDraft.data,
                })
              }
            >
              {t("Kiểm tra yêu cầu", "Review request")}
            </button>
          )}
          {validDraft.success && c.readinessIssue?.("submitRequest") && (
            <p role="status">
              {askReadinessMessage(
                c.readinessIssue("submitRequest")!,
                language,
              )}
            </p>
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!currentPanel()) return;
                  const revision = recipientRevision.current;
                  const parsed = recipientSchema.safeParse(recipient);
                  recipientSave.current = {
                    revision,
                    signature: JSON.stringify(
                      parsed.success ? parsed.data : recipient,
                    ),
                    acknowledged: false,
                  };
                  savedRecipientRef.current = null;
                  setRecipientVerification(null);
                  const saved = await c.run({
                    action: "saveRecipient",
                    expectedOrderVersion: order.version,
                    payload: recipient,
                  });
                  if (!currentPanel()) return;
                  if (saved && recipientSave.current?.revision === revision) {
                    recipientSave.current.acknowledged = true;
                    closeVerifiedRecipient();
                  } else if (
                    !saved &&
                    recipientSave.current?.revision === revision
                  )
                    recipientSave.current = null;
                }}
                onChange={() => {
                  recipientRevision.current++;
                  viewDraft.recipientEditing = true;
                  recipientEditingRef.current = true;
                  setRecipientEditing(true);
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
          {c.conversation?.recipientSaved && !savedRecipient && (
            <p role={recipientLoadFailed ? "alert" : "status"}>
              {recipientLoadFailed
                ? t(
                    "Chưa tải được thông tin nhận hàng. Thử tải lại; phần đang sửa vẫn được giữ.",
                    "Delivery details could not load. Retry loading; your edits are kept.",
                  )
                : askReadinessMessage("recipient-unverified", language)}
            </p>
          )}
          {recipientLoadFailed && (
            <button
              type="button"
              onClick={() => setRecipientReload((value) => value + 1)}
            >
              {t("Thử tải lại", "Retry loading")}
            </button>
          )}
          {c.conversation?.recipientSaved && savedRecipient && (
            <details className={styles.deliveryDetails}>
              <summary>
                {t("Giao đến", "Delivery address")} · {savedRecipient.recipient}
              </summary>
              <p>
                {t("Thông tin nhận hàng đã lưu", "Saved delivery details")}:{" "}
                {savedRecipient.recipient} · {savedRecipient.phone}
                <br />
                {savedRecipient.address}
              </p>
              {(["REQUESTED", "QUOTED"].includes(order.stage) ||
                (order.purchaseKind === "catalog" &&
                  order.stage === "QUOTE_ACCEPTED" &&
                  order.collected === 0 &&
                  order.refunded === 0)) && (
                <button
                  type="button"
                  onClick={() => {
                    recipientEditingRef.current = !recipientEditing;
                    viewDraft.recipientEditing = !recipientEditing;
                    setRecipientEditing(!recipientEditing);
                  }}
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
                !savedRecipient ||
                !!c.readinessIssue("acceptQuote") ||
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
              {t("Kiểm tra báo giá và mức cọc", "Review quote and deposit")}
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
              {t("Kiểm tra tổng tiền cuối", "Review final total")}
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
                  !savedRecipient ||
                  !!c.readinessIssue("payment") ||
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
              {t("Kiểm tra xác nhận nhận hàng", "Review receipt confirmation")}
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
          {errorReadiness
            ? askReadinessMessage(errorReadiness, language)
            : c.error === "ASK_PENDING_UNVERIFIED"
              ? t(
                  "Chưa đọc được thao tác đang chờ. Liên hệ hỗ trợ để đối chiếu.",
                  "The pending action could not be read. Contact support to reconcile it.",
                )
              : c.error === "ASK_CONVERSATION_UNVERIFIED"
                ? t(
                    "Chưa xác minh được hội thoại. Hãy tải lại hoặc liên hệ hỗ trợ.",
                    "The conversation could not be verified. Reload or contact support.",
                  )
                : c.error === "ASK_COMMAND_RESULT_UNVERIFIED"
                  ? t(
                      "Chưa xác minh được kết quả. Hãy đối chiếu thao tác đang chờ trước khi thử lại.",
                      "The result could not be verified. Recover the pending action before trying again.",
                    )
                  : c.error ===
                      "Chưa đối chiếu được thao tác. Thử lại; không gửi yêu cầu mới."
                    ? t(
                        c.error,
                        "The pending action could not be recovered. Retry recovery before sending a new request.",
                      )
                    : vi
                      ? c.error
                      : "This step could not finish. Check your connection and retry."}
        </p>
      )}
    </section>
  );
}
