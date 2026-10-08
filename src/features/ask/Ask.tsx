"use client";
import { customerChatAction } from "../../../packages/domain/chat-action";
import {
  extractOrderTrackingIntent,
  type CustomerOrderTracking,
} from "../../../packages/domain/order-tracking";
import { auth, callService } from "../../shared/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ShippingQuote, shippingQuestionDirection } from "./ShippingQuote";
import type { ShippingRatesPublicSnapshot } from "../../../packages/domain/shipping-rates";
import { OrderTracking } from "./OrderTracking";
import {
  catalogBrowseIntent,
  catalogSearchIntent,
} from "../../../packages/domain/catalog-search";
import {
  searchPublishedCatalog,
  type CatalogSearchResult,
} from "./catalog-search";
import { CatalogSearch } from "./CatalogSearch";
import type { Commerce } from "./Commerce";
import type { AskImage } from "../../../packages/domain/ask-images";

import { requestSchema } from "../../../packages/domain";

import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
function Link({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  sourceLink,
  type AskAnswer,
  type AskLanguage,
  buildAnswer,
  detectLanguage,
  retrieveSelection,
} from "./knowledge";
import styles from "./Ask.module.css";
import { askRateLimited, askService } from "./transport";
import { useAskImages } from "./ImageIntake";
import { CommercePanel, useAskCommerce } from "./Commerce";
import { shoppingIntent } from "../../../packages/domain/ask-workflow";

import {
  collectReadFrame,
  canonicalFrameDetectors,
  type ReadKind,
} from "../../../packages/domain/ask-task-frame";
import {
  productQuery,
  searchViews,
} from "../../../packages/domain/ask-language-query";

function explicitUnsplitReadGoals(text: string) {
  const folded = searchViews(text).folded;
  const catalogCue = /(?:^|\s)(?:tim|kiem|find|search)(?=\s|$|:)/u.test(folded);
  const feesCue = /(?:^|\s)(?:phi|cuoc|shipping|freight)(?=\s|$|:)/u.test(
    folded,
  );
  const tracking = extractOrderTrackingIntent(text);
  // Explicit unsplit goals also enter the parser, which must clarify rather
  // than allow the old first-panel early return to discard another goal.
  return (
    (catalogCue && feesCue) ||
    (tracking.kind !== "none" && (catalogCue || feesCue))
  );
}
function mixedReadCandidate(text: string) {
  return (
    /[,;\n]|\s+(?:và|va|and)\s+/iu.test(text) || explicitUnsplitReadGoals(text)
  );
}

type Turn = {
  id: number;
  question: string;
  answer?: AskAnswer;
  status: "pending" | "answered" | "error" | "stopped";
  rateLimited?: boolean;
  mixed?: {
    language: AskLanguage;
    queries: Partial<Record<ReadKind, string>>;
    pending: ReadKind[];
    failed: ReadKind[];
    signedOut: boolean;
  };
  catalog?: CatalogSearchResult;
  tracking?: CustomerOrderTracking;
  shipping?: {
    snapshot: ShippingRatesPublicSnapshot;
    direction: "VN_US" | "US_VN";
  };
};
const askCommerceEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ASK_COMMERCE_ENABLED === "true";
const subscribeHydration = () => () => {};

function AskIcon({ kind }: { kind: "send" | "close" | "stop" | "chat" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "chat" ? (
        <>
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H9l-5 3v-5a7.5 7.5 0 1 1 16-5.5Z" />
          <path d="M8 10h8M8 14h5" />
        </>
      ) : kind === "send" ? (
        <path d="M12 20V4m-7 7 7-7 7 7" />
      ) : kind === "close" ? (
        <path d="m7 7 10 10M17 7 7 17" />
      ) : (
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="1"
          fill="currentColor"
          stroke="none"
        />
      )}
    </svg>
  );
}

const PublishedAnswer = memo(function PublishedAnswer({
  answer,
}: {
  answer: AskAnswer;
}) {
  const vi = answer.language === "vi";
  const navigate = useNavigate();
  const [draftError, setDraftError] = useState("");
  function reviewDraft() {
    const parsed = requestSchema.safeParse(answer.draft);
    if (!parsed.success) {
      setDraftError(
        vi
          ? "Bản nháp chưa hợp lệ. Tạo yêu cầu mới để kiểm tra sản phẩm."
          : "This draft needs review. Start a new request.",
      );
      return;
    }
    sessionStorage.setItem(
      "request-draft:anonymous",
      JSON.stringify(parsed.data),
    );
    navigate("/request?from=ask");
  }
  const action = sourceLink(answer.action, answer.language);
  return (
    <div className={styles.answer} lang={answer.language}>
      <h2>{answer.title}</h2>
      {answer.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {!!answer.bullets.length && (
        <ul>
          {answer.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {answer.followUp && <p className={styles.followUp}>{answer.followUp}</p>}
      {!!answer.sourceIds.length && (
        <div className={styles.sources}>
          <span>{vi ? "Nguồn:" : "Sources:"}</span>
          {[...new Set(answer.sourceIds)].map((id) => {
            const link = sourceLink(id, answer.language);
            return (
              <Link key={id} href={link.href}>
                {link.label} <span aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </div>
      )}
      {!askCommerceEnabled && answer.draft && (
        <button
          type="button"
          className={styles.nextAction}
          onClick={reviewDraft}
        >
          {vi
            ? "Xem và chỉnh bản nháp · chưa gửi"
            : "Review draft · not submitted"}
        </button>
      )}
      {draftError && <p role="alert">{draftError}</p>}
      {!askCommerceEnabled && (
        <Link className={styles.nextAction} href={action.href}>
          {vi ? "Gửi yêu cầu mua hộ" : "Request an item"}{" "}
          <span aria-hidden="true">↗</span>
        </Link>
      )}
    </div>
  );
});

const ConversationContent = memo(function ConversationContent({
  turns,
  phase,
  language,
  busy,
  visible,
  onRetry,
  commerce,
}: {
  turns: Turn[];
  phase: "retrieving" | "selecting" | "committing";
  language: AskLanguage;
  busy: boolean;
  visible: boolean;
  onRetry: (question: string) => Promise<unknown>;
  commerce: Commerce;
}) {
  const vi = language === "vi";
  return (
    <>
      {turns.map((turn) => (
        <section
          className={styles.turn}
          data-ask-turn={turn.id}
          key={turn.id}
          aria-label={turn.question}
        >
          <div className={styles.question}>
            <p>{turn.question}</p>
          </div>
          {turn.mixed ? (
            <div className={styles.answer} lang={turn.mixed.language}>
              <h2>
                {turn.mixed.language === "vi"
                  ? "Thông tin anh/chị cần"
                  : "Your requested information"}
              </h2>
              {!!turn.mixed.pending.length && turn.status === "pending" && (
                <p role="status">
                  {turn.mixed.language === "vi"
                    ? "Em đang tra cứu các thông tin còn lại…"
                    : "Checking the remaining information…"}
                </p>
              )}
              {turn.tracking && (
                <OrderTracking
                  tracking={turn.tracking}
                  language={turn.mixed.language}
                />
              )}
              {turn.catalog && (
                <CatalogSearch
                  result={turn.catalog}
                  question={turn.mixed.queries.catalog!}
                  commerce={commerce}
                  vi={turn.mixed.language === "vi"}
                  active={visible && turn.id === turns.at(-1)?.id && !busy}
                />
              )}
              {turn.shipping && (
                <ShippingQuote
                  snapshot={turn.shipping.snapshot}
                  direction={turn.shipping.direction}
                  question={turn.mixed.queries.fees!}
                  vi={turn.mixed.language === "vi"}
                />
              )}
              {turn.mixed.signedOut && (
                <p>
                  {turn.mixed.language === "vi"
                    ? "Đăng nhập tài khoản đã đặt đơn để xem tiến độ."
                    : "Sign in with the account that placed the order to track it."}
                </p>
              )}
              {turn.mixed.failed.map((kind) => (
                <p role="alert" key={kind}>
                  {turn.mixed!.language === "vi"
                    ? {
                        tracking:
                          "Em chưa tra cứu được đơn. Anh/chị có thể thử lại.",
                        catalog:
                          "Chưa thể tìm sản phẩm. Kết quả này chưa xác nhận sản phẩm có được niêm yết hay không.",
                        fees: "Chưa tải được biểu phí. Chưa thể xác nhận cước.",
                      }[kind]
                    : {
                        tracking:
                          "Order tracking is unavailable. Check the ID and ordering account.",
                        catalog:
                          "Product search is unavailable. This does not establish whether a product is listed.",
                        fees: "Shipping rates are unavailable. Freight cannot be confirmed yet.",
                      }[kind]}
                </p>
              ))}
              {turn.status === "stopped" && (
                <p role="status">
                  {turn.mixed.language === "vi"
                    ? "Đã dừng tra cứu thông tin còn lại."
                    : "Stopped the remaining lookups."}
                </p>
              )}
              {turn.status === "error" && (
                <p role="alert">
                  {turn.mixed.language === "vi"
                    ? "Em chưa hoàn tất tra cứu. Thông tin đã tải vẫn được giữ lại."
                    : "The lookups could not finish. Loaded information remains available."}
                </p>
              )}
              {(!!turn.mixed.failed.length || turn.status === "error") && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onRetry(turn.question)}
                >
                  {turn.mixed.language === "vi"
                    ? "Tra cứu lại các thông tin"
                    : "Retry these lookups"}
                </button>
              )}
            </div>
          ) : turn.status === "pending" ? (
            <p className={styles.status} role="status">
              <span className={styles.logo} aria-hidden="true">
                SG
              </span>
              {phase === "committing"
                ? vi
                  ? "Đang xác nhận thao tác…"
                  : "Confirming this action…"
                : phase === "selecting"
                  ? vi
                    ? "Em đang tìm thông tin phù hợp…"
                    : "Finding the right information…"
                  : vi
                    ? "Em đang kiểm tra thông tin SatsunicGo…"
                    : "Checking SatsunicGo information…"}
            </p>
          ) : turn.answer ? (
            <>
              <PublishedAnswer answer={turn.answer} />
              {turn.shipping && (
                <ShippingQuote
                  snapshot={turn.shipping.snapshot}
                  direction={turn.shipping.direction}
                  question={turn.question}
                  vi={turn.answer.language === "vi"}
                />
              )}
              {turn.tracking && (
                <OrderTracking
                  tracking={turn.tracking}
                  language={turn.answer.language}
                />
              )}
              {turn.catalog && (
                <CatalogSearch
                  result={turn.catalog}
                  question={turn.question}
                  commerce={commerce}
                  vi={vi}
                  active={visible && turn.id === turns.at(-1)?.id && !busy}
                />
              )}
            </>
          ) : (
            <div
              className={styles.error}
              role={turn.status === "error" ? "alert" : "status"}
            >
              <p>
                {turn.status === "stopped"
                  ? vi
                    ? "Đã dừng câu trả lời."
                    : "Response stopped."
                  : turn.rateLimited
                    ? vi
                      ? "Chưa thể trả lời lúc này. Hãy thử lại sau."
                      : "We can’t answer right now. Please try again later."
                    : vi
                      ? "Em chưa thể trả lời lúc này. Câu hỏi của anh/chị vẫn được giữ lại."
                      : "We couldn’t answer just now. Your question is still here."}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onRetry(turn.question)}
              >
                {vi ? "Thử lại" : "Try again"}
              </button>
              <Link href="/request">
                {vi ? "Gửi yêu cầu mua hộ" : "Request an item"} ↗
              </Link>
            </div>
          )}
        </section>
      ))}
    </>
  );
});

export function Ask({
  aiAvailable = false,
  startCollapsed = false,
}: {
  aiAvailable?: boolean;
  startCollapsed?: boolean;
}) {
  const route = useLocation();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(startCollapsed);
  useEffect(() => {
    document.body.dataset.askDock = open
      ? "modal"
      : dismissed
        ? "launcher"
        : "composer";
    return () => {
      delete document.body.dataset.askDock;
    };
  }, [open, dismissed]);
  const [hintVisible, setHintVisible] = useState(false);
  const [returned, setReturned] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [idleExiting, setIdleExiting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"retrieving" | "selecting" | "committing">(
    "retrieving",
  );
  const [language, setLanguage] = useState<AskLanguage>("vi");
  const dialog = useRef<HTMLDialogElement>(null);
  const chatInput = useRef<HTMLInputElement>(null);
  const idleInput = useRef<HTMLInputElement>(null);
  const sendOrigin = useRef<{ id: number; rect: DOMRect } | null>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const activeId = useRef(0);
  const operationMode = useRef<"read" | "commit" | null>(null);
  const authGeneration = useRef(0);
  const preparationSequence = useRef(0);
  const preparing = useRef<number | null>(null);
  const selectedTracking = useRef<{ uid: string; orderId: string } | null>(
    null,
  );
  const locked = useRef(false);
  const session = useRef<string | null>(null);
  const dialogMotion = useRef<Animation | null>(null);
  const idleMotion = useRef<Animation | null>(null);
  const idleShell = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const outsidePointer = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commerceEnabled =
    import.meta.env.DEV || import.meta.env.VITE_ASK_COMMERCE_ENABLED === "true";
  const commerce = useAskCommerce((saved) => {
    setInput("");
    preparing.current = null;
    selectedTracking.current = null;
    setLanguage(saved.turns.at(-1)?.answer.language === "en" ? "en" : "vi");
    ++activeId.current;
    abort.current?.abort();
    abort.current = null;
    locked.current = false;
    operationMode.current = null;
    setBusy(false);
    setPhase("retrieving");
    if (saved.turns.length) {
      const restored = saved.turns.map((turn) => ({
        id: ++activeId.current,
        question: turn.question,
        answer: turn.answer,
        status: "answered" as const,
      }));
      setTurns(restored);
    } else setTurns([]);
  }, commerceEnabled);
  const latestConversation = useRef(commerce.conversationId);
  latestConversation.current = commerce.conversationId;
  useEffect(() => {
    if (!auth) return;
    let uid = auth.currentUser?.uid ?? null;
    let live = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!live) return;
      const next = user?.uid ?? null;
      if (next === uid) return;
      uid = next;
      authGeneration.current++;
      activeId.current++;
      abort.current?.abort();
      abort.current = null;
      operationMode.current = null;
      locked.current = false;
      selectedTracking.current = null;
      setInput("");
      preparing.current = null;
      setTurns([]);
      setBusy(false);
      setPhase("retrieving");
    });
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);
  const trackedOrderDiffers = Boolean(
    selectedTracking.current &&
    selectedTracking.current.uid === commerce.user?.uid &&
    commerce.order &&
    selectedTracking.current.orderId !== commerce.order.id,
  );
  const images = useAskImages({
    uid: commerce.user?.uid,
    conversationId: commerce.conversationId,
    orderId:
      commerce.order &&
      !trackedOrderDiffers &&
      !["COMPLETED", "CANCELLED"].includes(commerce.order.stage)
        ? commerce.order.id
        : undefined,
    busy: busy || commerce.busy,
    attachmentsBlocked: trackedOrderDiffers,
    vi: language === "vi",
  });
  const imagePicker = useRef<HTMLInputElement>(null);
  const idleImagePicker = useRef<HTMLInputElement>(null);
  const [draggingImage, setDraggingImage] = useState(false);
  const chatReady =
    !commerceEnabled ||
    !commerce.user ||
    (!!commerce.conversationId && commerce.restorationReady);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    setExiting(false);
    element.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const capsule = element.querySelector(`form.${styles.composer}`);
      if (capsule) {
        const panel = element.getBoundingClientRect(),
          box = capsule.getBoundingClientRect();
        const mask = `inset(${box.top - panel.top}px ${panel.right - box.right}px ${panel.bottom - box.bottom}px ${box.left - panel.left}px round 40px)`;
        dialogMotion.current = element.animate(
          [
            {
              clipPath: mask,
              transform: `translateY(${panel.bottom - box.bottom}px)`,
            },
            {
              clipPath: "inset(0px 0px 0px 0px round 28px)",
              transform: "translateY(0)",
            },
          ],
          { duration: 360, easing: "cubic-bezier(.22,1,.36,1)" },
        );
      }
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    chatInput.current?.focus({ preventScroll: true });
    return () => {
      dialogMotion.current?.cancel();
      closing.current = false;
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const newestTurnId = turns.at(-1)?.id;
  useEffect(() => {
    const pane = conversation.current;
    if (!open || !pane || newestTurnId === undefined) return;
    // Read from the submitted question onward. Answer/status updates never
    // yank a visitor away from the passage they are reading.
    let frame = 0;
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
    pane.addEventListener("wheel", cancel, { passive: true });
    pane.addEventListener("touchstart", cancel, { passive: true });
    pane.addEventListener("pointerdown", cancel, { passive: true });
    frame = requestAnimationFrame((started) => {
      const latest = pane.lastElementChild;
      if (!latest || cancelled) return;
      const from = pane.scrollTop;
      const top =
        from +
        latest.getBoundingClientRect().top -
        pane.getBoundingClientRect().top -
        28;
      const target = Math.min(
        Math.max(0, top),
        pane.scrollHeight - pane.clientHeight,
      );
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        pane.scrollTo({ top: target, behavior: "instant" });
        return;
      }
      // Native smooth scrolling has browser-dependent duration. A bounded
      // transition finishes before reading resumes and yields to user input.
      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - started) / 300);
        pane.scrollTo({
          top: from + (target - from) * (1 - (1 - progress) ** 3),
          behavior: "instant",
        });
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancel();
      pane.removeEventListener("wheel", cancel);
      pane.removeEventListener("touchstart", cancel);
      pane.removeEventListener("pointerdown", cancel);
    };
  }, [newestTurnId, open]);

  useEffect(
    () => () => {
      activeId.current++;
      abort.current?.abort();
      dialogMotion.current?.cancel();
      idleMotion.current?.cancel();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (
      !dismissed ||
      open ||
      !hydrated ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let showTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      // A brief invitation, never continuous motion while the visitor reads.
      if (document.visibilityState === "visible") {
        setHintVisible(true);
        clearTimer = setTimeout(() => setHintVisible(false), 2800);
      }
      showTimer = setTimeout(reveal, 22000);
    };
    showTimer = setTimeout(reveal, 5000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(clearTimer);
      setHintVisible(false);
    };
  }, [dismissed, open, hydrated]);

  function interrupt() {
    if (
      operationMode.current === "commit" ||
      commerce.busy ||
      commerce.pendingOperation
    )
      return;
    const id = activeId.current;
    activeId.current++;
    abort.current?.abort();
    abort.current = null;
    operationMode.current = null;
    locked.current = false;
    setBusy(false);
    setTurns((current) =>
      current.map((turn) =>
        turn.id === id && turn.status === "pending"
          ? { ...turn, status: "stopped" }
          : turn,
      ),
    );
  }

  function close() {
    if (!open || closing.current || operationMode.current === "commit") return;
    closing.current = true;
    setExiting(true);
    interrupt();
    setFocused(false);
    const finish = () => {
      setReturned(true);
      setOpen(false);
    };
    const element = dialog.current;
    const currentStyle = element ? getComputedStyle(element) : null;
    const startClip =
      currentStyle?.clipPath === "none"
        ? "inset(0px 0px 0px 0px round 28px)"
        : currentStyle?.clipPath;
    const startTransform = currentStyle?.transform ?? "none";
    dialogMotion.current?.cancel();
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    const capsule = element.querySelector(`form.${styles.composer}`);
    if (!capsule) {
      finish();
      return;
    }
    const panel = element.getBoundingClientRect(),
      box = capsule.getBoundingClientRect();
    const mask = `inset(${box.top - panel.top}px ${panel.right - box.right}px ${panel.bottom - box.bottom}px ${box.left - panel.left}px round 40px)`;
    const motion = element.animate(
      [
        {
          clipPath: startClip ?? "inset(0px 0px 0px 0px round 28px)",
          transform: startTransform,
        },
        {
          clipPath: mask,
          transform: `translateY(${panel.bottom - box.bottom}px)`,
        },
      ],
      { duration: 320, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" },
    );
    dialogMotion.current = motion;
    void motion.finished.then(finish, () => {});
  }

  function isBackdrop(event: ReactPointerEvent<HTMLDialogElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return (
      event.target === event.currentTarget &&
      (event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom)
    );
  }

  function hide() {
    if (idleExiting) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFocused(false);
      setDismissed(true);
      return;
    }
    setIdleExiting(true);
    const shell = idleShell.current;
    if (shell) {
      const box = shell.getBoundingClientRect();
      const targetWidth = 56;
      const deltaX =
        innerWidth - 24 - targetWidth / 2 - (box.left + box.width / 2);
      const capsule = shell
        .querySelector(`form.${styles.composer}`)
        ?.getBoundingClientRect();
      const deltaY =
        (capsule ? capsule.bottom - 28 : box.bottom - 28) -
        (box.top + box.height / 2);
      idleMotion.current = shell.animate(
        [
          { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
          {
            opacity: 0,
            transform: `translate(calc(-50% + ${deltaX}px), ${deltaY}px) scale(${targetWidth / box.width})`,
          },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "forwards",
        },
      );
    }
    hideTimer.current = setTimeout(() => {
      setFocused(false);
      setDismissed(true);
      setIdleExiting(false);
      idleMotion.current?.cancel();
      hideTimer.current = null;
    }, 320);
  }

  const latestTurnId = turns.at(-1)?.id;
  useEffect(() => {
    const origin = sendOrigin.current;
    if (!open || exiting || !origin) return;
    sendOrigin.current = null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let animation: Animation | undefined;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const bubble = conversation.current?.querySelector<HTMLElement>(
          `[data-ask-turn="${origin.id}"] > div`,
        );
        if (!bubble || !dialog.current?.open) return;
        const target = bubble.getBoundingClientRect();
        animation = bubble.animate(
          [
            {
              transform: `translate(${origin.rect.left - target.left}px, ${origin.rect.top - target.top}px)`,
              opacity: 0.2,
            },
            { transform: "translate(0, 0)", opacity: 1 },
          ],
          { duration: 300, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        );
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      animation?.cancel();
    };
  }, [latestTurnId, open, exiting]);
  const ask = useCallback(
    async (question: string, images: AskImage[] = []) => {
      const text = question.trim();
      if (
        !text ||
        !chatReady ||
        text.length > 1000 ||
        commerce.busy ||
        commerce.pendingOperation ||
        locked.current ||
        closing.current ||
        hideTimer.current
      )
        return;
      locked.current = true;
      operationMode.current = "read";
      const controller = new AbortController();
      const requestSignal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(15_000),
      ]);
      abort.current = controller;
      const id = ++activeId.current;
      const requestUid = auth?.currentUser?.uid ?? null;
      const requestCid = latestConversation.current;
      const requestGeneration = authGeneration.current;
      const ownsRequest = () =>
        activeId.current === id &&
        authGeneration.current === requestGeneration &&
        (auth?.currentUser?.uid ?? null) === requestUid &&
        latestConversation.current === requestCid;
      const history = turns
        .filter((turn) => turn.status === "answered")
        .slice(-6)
        .map((turn) => turn.question);
      const composerInput = open ? chatInput.current : idleInput.current;
      if (composerInput && composerInput.value.trim() === text)
        sendOrigin.current = {
          id,
          rect: composerInput.getBoundingClientRect(),
        };
      setTurns((current) => [
        ...current.slice(-11),
        { id, question: text, status: "pending" },
      ]);
      setInput((current) => (current.trim() === text ? "" : current));
      setBusy(true);
      setPhase("retrieving");
      setDismissed(false);
      setOpen(true);
      if (!session.current) session.current = crypto.randomUUID();
      try {
        // Only explicit multi-clause, image-free reads enter this local panel path.
        // Existing standalone commerce actions retain their serial authority below.
        const mixedSyntax = mixedReadCandidate(text);
        if (
          !images.length &&
          mixedSyntax &&
          !customerChatAction(text, commerce.order, commerce.draft)
        ) {
          const frame = collectReadFrame(
            text,
            canonicalFrameDetectors({
              tracking: extractOrderTrackingIntent,
              catalog: catalogSearchIntent,
              product: productQuery,
              direction: shippingQuestionDirection,
              actionOrAmbiguity: (raw) => {
                const folded = searchViews(raw).folded;
                return (
                  !!customerChatAction(raw, commerce.order, commerce.draft) ||
                  /\b(?:thanh toan|tra tien|chuyen tien|chuyen khoan|mua|dat hang|bo vao gio|them vao gio|add to cart|gui yeu cau|chap nhan|duyet|xac nhan|huy don|hoan tien|payment|pay|purchase|checkout|buy|submit|accept|approve|confirm|cancel|refund)\b/u.test(
                    folded,
                  )
                );
              },
            }),
          );
          const duplicate = frame.tasks.some(
            (task, index) =>
              frame.tasks.findIndex((other) => other.kind === task.kind) !==
              index,
          );
          if (
            frame.requiresClarification ||
            duplicate ||
            frame.tasks.some((task) => explicitUnsplitReadGoals(task.span.raw))
          ) {
            if (!ownsRequest() || requestSignal.aborted) return false;
            const nextLanguage = detectLanguage(text, language);
            const answer: AskAnswer = {
              language: nextLanguage,
              title:
                nextLanguage === "vi"
                  ? "Làm rõ yêu cầu"
                  : "Clarify your request",
              paragraphs: [
                nextLanguage === "vi"
                  ? "Nêu rõ từng thông tin cần tra cứu: mã đơn, sản phẩm hoặc chiều gửi hàng. Gửi thao tác mua, thanh toán hoặc xác nhận thành yêu cầu riêng."
                  : "Specify each lookup: an order ID, product or shipping direction. Send purchases, payments or confirmations as a separate request.",
              ],
              bullets: [],
              sourceIds: [],
              action: "home",
            };
            setLanguage(nextLanguage);
            setTurns((current) =>
              ownsRequest() && !requestSignal.aborted
                ? current.map((turn) =>
                    turn.id === id
                      ? { ...turn, answer, status: "answered" }
                      : turn,
                  )
                : current,
            );
            return true;
          }
          if (frame.tasks.length >= 2) {
            const nextLanguage = detectLanguage(text, language);
            const queries = Object.fromEntries(
              frame.tasks.map((task) => [task.kind, task.span.raw]),
            );
            // Full public rates are a LOCAL read-only calculator contract. They
            // never enter the streamed response composer or its byte budget.
            const update = (
              patch: Partial<Turn>,
              finished?: ReadKind,
              failed = false,
            ) => {
              if (!ownsRequest() || requestSignal.aborted) return;
              setTurns((current) => {
                if (!ownsRequest() || requestSignal.aborted) return current;
                return current.map((turn) =>
                  turn.id === id
                    ? {
                        ...turn,
                        ...patch,
                        mixed: turn.mixed && {
                          ...turn.mixed,
                          pending: finished
                            ? turn.mixed.pending.filter(
                                (kind) => kind !== finished,
                              )
                            : turn.mixed.pending,
                          failed:
                            failed && finished
                              ? [...turn.mixed.failed, finished]
                              : turn.mixed.failed,
                        },
                      }
                    : turn,
                );
              });
            };
            if (!ownsRequest() || requestSignal.aborted) return false;
            selectedTracking.current = null;
            setLanguage(nextLanguage);
            setTurns((current) =>
              ownsRequest() && !requestSignal.aborted
                ? current.map((turn) =>
                    turn.id === id
                      ? {
                          ...turn,
                          mixed: {
                            language: nextLanguage,
                            queries,
                            pending: frame.tasks.map((task) => task.kind),
                            failed: [],
                            signedOut:
                              !requestUid &&
                              frame.tasks.some(
                                (task) => task.kind === "tracking",
                              ),
                          },
                        }
                      : turn,
                  )
                : current,
            );
            const boundedRead = <T,>(read: Promise<T>) =>
              new Promise<T>((resolve, reject) => {
                const onAbort = () => reject(requestSignal.reason);
                requestSignal.addEventListener("abort", onAbort, {
                  once: true,
                });
                if (requestSignal.aborted) onAbort();
                void read
                  .then(resolve, reject)
                  .finally(() =>
                    requestSignal.removeEventListener("abort", onAbort),
                  );
              });
            let cursor = 0;
            const worker = async () => {
              while (
                cursor < frame.tasks.length &&
                ownsRequest() &&
                !requestSignal.aborted
              ) {
                const task = frame.tasks[cursor++];
                try {
                  if (task.kind === "tracking") {
                    if (!requestUid) {
                      update({}, task.kind);
                      continue;
                    }
                    const tracking = await boundedRead(
                      callService<CustomerOrderTracking>(
                        "customerOrderTracking",
                        { orderId: task.params.orderId },
                      ),
                    );
                    if (!ownsRequest() || requestSignal.aborted) return;
                    selectedTracking.current = {
                      uid: requestUid,
                      orderId: task.params.orderId,
                    };
                    update({ tracking }, task.kind);
                  } else if (task.kind === "catalog") {
                    const catalog = await boundedRead(
                      searchPublishedCatalog(
                        task.params.question,
                        requestSignal,
                      ),
                    );
                    update({ catalog }, task.kind);
                  } else {
                    const snapshot = await boundedRead(
                      callService<ShippingRatesPublicSnapshot>(
                        "shippingRatesPublic",
                        {},
                      ),
                    );
                    update(
                      {
                        shipping: {
                          snapshot,
                          direction: task.params.direction,
                        },
                      },
                      task.kind,
                    );
                  }
                } catch {
                  update({}, task.kind, true);
                }
              }
            };
            await Promise.all([worker(), worker()]);
            if (!ownsRequest()) return false;
            requestSignal.throwIfAborted();
            update({ status: "answered" });
            return true;
          }
        }
        const trackingIntent = extractOrderTrackingIntent(text);
        const uid = auth?.currentUser?.uid;
        const followUp =
          /(?:đơn này|don nay|đơn đó|don do|this order|that order|when.*arriv|khi nào.*(?:về|giao)|tới đâu|toi dau)/i.test(
            text,
          );
        const trackingId =
          trackingIntent.kind === "order"
            ? trackingIntent.orderId
            : trackingIntent.kind === "none" &&
                followUp &&
                selectedTracking.current &&
                selectedTracking.current.uid === uid
              ? selectedTracking.current.orderId
              : undefined;
        if (
          !images.length &&
          (trackingId || trackingIntent.kind === "ambiguous")
        ) {
          const nextLanguage = detectLanguage(text, language),
            vi = nextLanguage === "vi";
          let tracking: CustomerOrderTracking | undefined;
          let description = vi
            ? "Nhập một mã đơn để xem tiến độ."
            : "Enter one order ID to view its progress.";
          if (trackingIntent.kind !== "ambiguous" && trackingId) {
            selectedTracking.current = null;
            if (!uid)
              description = vi
                ? "Đăng nhập tài khoản đã đặt đơn để xem tiến độ trong chat."
                : "Sign in with the account that placed the order to track it within this chat.";
            else {
              try {
                tracking = await callService<CustomerOrderTracking>(
                  "customerOrderTracking",
                  { orderId: trackingId },
                );
                if (
                  auth?.currentUser?.uid !== uid ||
                  !ownsRequest() ||
                  requestSignal.aborted
                )
                  return false;
                selectedTracking.current = { uid, orderId: trackingId };
                description = vi
                  ? "Tiến độ được cập nhật từ đơn hàng và kiện của anh/chị."
                  : "Progress is based on your order and parcel updates.";
              } catch (error) {
                if (
                  (error as { code?: string }).code !==
                  "functions/permission-denied"
                )
                  throw error;
                description = vi
                  ? "Không thể truy cập đơn này. Kiểm tra mã và tài khoản đã đặt đơn."
                  : "This order cannot be accessed. Check the ID and the account that placed it.";
              }
            }
          }
          if (
            !ownsRequest() ||
            requestSignal.aborted ||
            (uid && auth?.currentUser?.uid !== uid)
          )
            return false;
          const answer: AskAnswer = {
            language: nextLanguage,
            title: vi ? "Tra cứu đơn hàng" : "Track an order",
            paragraphs: [description],
            bullets: [],
            sourceIds: [],
            action: "account",
          };
          setLanguage(nextLanguage);
          setTurns((current) =>
            current.map((turn) =>
              turn.id === id
                ? { ...turn, answer, tracking, status: "answered" }
                : turn,
            ),
          );
          return true;
        }
        const shippingDirection = shippingQuestionDirection(text);
        if (!images.length && shippingDirection) {
          const snapshot = await callService<ShippingRatesPublicSnapshot>(
            "shippingRatesPublic",
            {},
          );
          if (!ownsRequest() || requestSignal.aborted) return false;
          const nextLanguage = detectLanguage(text, language),
            vi = nextLanguage === "vi";
          const answer: AskAnswer = {
            language: nextLanguage,
            title: vi ? "Cước vận chuyển" : "Shipping rates",
            paragraphs: [
              vi
                ? "Kiểm tra cước theo chiều gửi, loại hàng và khối lượng ngay tại đây."
                : "Check freight by route, goods category and weight here.",
            ],
            bullets: [],
            sourceIds: [],
            action: "fees",
          };
          setLanguage(nextLanguage);
          setTurns((current) =>
            current.map((turn) =>
              turn.id === id
                ? {
                    ...turn,
                    answer,
                    shipping: { snapshot, direction: shippingDirection },
                    status: "answered",
                  }
                : turn,
            ),
          );
          return true;
        }
        const action = !images.length
          ? customerChatAction(text, commerce.order, commerce.draft)
          : null;
        if (action) {
          if (
            selectedTracking.current &&
            selectedTracking.current.uid === uid &&
            commerce.order &&
            selectedTracking.current.orderId !== commerce.order.id
          ) {
            const nextLanguage = detectLanguage(text, language);
            const answer: AskAnswer = {
              language: nextLanguage,
              title:
                nextLanguage === "vi"
                  ? "Chọn đúng đơn trước khi xác nhận"
                  : "Select the order before confirming",
              paragraphs: [
                nextLanguage === "vi"
                  ? "Đơn đang tra cứu khác đơn trong hội thoại. Mở đơn đang tra cứu để kiểm tra và xác nhận đúng đơn."
                  : "The tracked order differs from the conversation order. Open the tracked order to review and confirm the intended order.",
              ],
              bullets: [],
              sourceIds: [],
              action: "account",
            };
            setLanguage(nextLanguage);
            setTurns((current) =>
              current.map((turn) =>
                turn.id === id ? { ...turn, answer, status: "answered" } : turn,
              ),
            );
            return true;
          }
          operationMode.current = "commit";
          setPhase("committing");
          const confirmed = await commerce.run({
            action,
            payload:
              action === "submitRequest"
                ? commerce.draft
                : action === "acceptQuote"
                  ? { quoteVersion: commerce.order!.quoteVersion }
                  : action === "confirmReceipt"
                    ? { received: true }
                    : {},
            ...(commerce.order
              ? { expectedOrderVersion: commerce.order.version }
              : {}),
          });
          if (!confirmed) throw Error("ACTION_NOT_CONFIRMED");
          if (!ownsRequest() || controller.signal.aborted) return;
          const answer: AskAnswer = {
            language: detectLanguage(text, language),
            title: viActionTitle(action, detectLanguage(text, language)),
            paragraphs: [
              detectLanguage(text, language) === "vi"
                ? "Thao tác đã được ghi nhận. Anh/chị xem trạng thái và bước tiếp theo trong thẻ đơn bên dưới."
                : "The system processed this action. Review the current order status and next step below.",
            ],
            bullets: [],
            sourceIds: [],
            action: "order",
          };
          setLanguage(answer.language);
          void commerce.resolved(text, answer);
          setTurns((current) =>
            current.map((turn) =>
              turn.id === id ? { ...turn, answer, status: "answered" } : turn,
            ),
          );
          return true;
        }
        const published = retrieveSelection({
          question: text,
          history,
          sessionId: session.current,
          language,
        });
        if (
          !images.length &&
          published.topic !== "outside" &&
          !shoppingIntent(text) &&
          !commerce.order &&
          !Object.keys(commerce.draft).length
        ) {
          // Approved public FAQs are available immediately, even if the API is
          // cold, disconnected or unavailable. No Gemini or transport required.
          const answer = buildAnswer(published, detectLanguage(text, language));
          setLanguage(answer.language);
          setTurns((current) =>
            current.map((turn) =>
              turn.id === id ? { ...turn, answer, status: "answered" } : turn,
            ),
          );
          void commerce.resolved(text, answer);
          return true;
        }
        if (controller.signal.aborted || !ownsRequest()) return;
        let catalog: CatalogSearchResult | undefined;
        if (!images.length && catalogSearchIntent(text)) {
          try {
            catalog = await searchPublishedCatalog(text, requestSignal);
          } catch (error) {
            // A failed public read cannot prove that an item is unlisted.
            // The established conversation flow can still handle the request.
            if (requestSignal.aborted) throw error;
          }
          if (!ownsRequest()) return false;
          requestSignal.throwIfAborted();
        }
        if (
          catalog &&
          (catalog.rows.length ||
            (catalog.hasMore && catalogBrowseIntent(text)))
        ) {
          const nextLanguage = detectLanguage(text, language);
          const answer: AskAnswer = {
            language: nextLanguage,
            title:
              nextLanguage === "vi" ? "Sản phẩm phù hợp" : "Matching products",
            paragraphs: [
              nextLanguage === "vi"
                ? "Tìm theo tên và công dụng trong sản phẩm đã niêm yết. Chọn mua để kiểm tra mẫu, số lượng và tổng thanh toán ngay trong chat."
                : "Search listed products by name and purpose. Choose an item to review its variant, quantity and total within this chat.",
            ],
            bullets: [],
            sourceIds: [],
            action: "products",
          };
          setLanguage(nextLanguage);
          setTurns((current) =>
            current.map((turn) =>
              turn.id === id
                ? { ...turn, answer, catalog, status: "answered" }
                : turn,
            ),
          );
          return true;
        }
        const askedOrderId =
          selectedTracking.current && selectedTracking.current.uid === uid
            ? selectedTracking.current.orderId
            : route.pathname.match(/^\/account\/orders\/([a-zA-Z0-9-]{1,80})$/)
              ? route.pathname.split("/").at(-1)
              : commerce.order?.id;
        const answer = await askService(
          {
            question: text,
            ...(images.length ? { images } : {}),
            history,
            ...(commerce.conversationId
              ? { conversationId: commerce.conversationId }
              : {}),
            ...(askedOrderId ? { orderId: askedOrderId } : {}),
            sessionId: session.current,
            language: detectLanguage(text, language),
          },
          requestSignal,
          (event) => {
            if (!ownsRequest() || requestSignal.aborted) return;
            if (event.type === "status") setPhase(event.phase);
          },
        );
        if (!ownsRequest() || controller.signal.aborted) return;
        setLanguage(answer.language);
        void commerce.resolved(text, answer);
        setTurns((current) =>
          current.map((turn) =>
            turn.id === id
              ? { ...turn, answer, catalog, status: "answered" }
              : turn,
          ),
        );
        return true;
      } catch (error) {
        if (ownsRequest()) {
          setTurns((current) =>
            !ownsRequest()
              ? current
              : current.map((turn) =>
                  turn.id === id
                    ? {
                        ...turn,
                        answer: undefined,
                        status: "error",
                        rateLimited: askRateLimited(error),
                      }
                    : turn,
                ),
          );
        }
      } finally {
        if (ownsRequest()) {
          locked.current = false;
          operationMode.current = null;
          setPhase("retrieving");
          abort.current = null;
          setBusy(false);
          chatInput.current?.focus({ preventScroll: true });
        }
      }
    },
    [turns, language, aiAvailable, route.pathname, commerce, chatReady, open],
  );

  const vi = language === "vi";
  const sendLabel =
    phase === "committing"
      ? vi
        ? "Đang xác nhận thao tác"
        : "Confirming this action"
      : busy
        ? vi
          ? "Dừng câu trả lời"
          : "Stop response"
        : vi
          ? "Gửi câu hỏi"
          : "Send question";
  const suggestions = vi
    ? [
        "Mua hộ hoạt động thế nào?",
        "Cọc và số dư tính thế nào?",
        "Chưa có link sản phẩm thì sao?",
      ]
    : [
        "How does buying assistance work?",
        "How does the deposit work?",
        "Can I request an item without a link?",
      ];
  async function sendMessage(question = input) {
    if (
      busy ||
      commerce.busy ||
      commerce.pendingOperation ||
      locked.current ||
      images.working ||
      preparing.current !== null
    )
      return;
    const token = ++preparationSequence.current;
    preparing.current = token;
    const uid = auth?.currentUser?.uid ?? null;
    const cid = latestConversation.current;
    const generation = authGeneration.current;
    const epoch = activeId.current;
    const currentContext = () =>
      (auth?.currentUser?.uid ?? null) === uid &&
      authGeneration.current === generation &&
      latestConversation.current === cid;
    try {
      const selected = await images.prepare();
      if (
        selected === null ||
        preparing.current !== token ||
        !currentContext() ||
        activeId.current !== epoch
      )
        return;
      const content =
        question.trim() ||
        (selected.length
          ? vi
            ? "Giúp mình tìm sản phẩm trong ảnh. Nếu chưa chắc, hỏi mình thêm."
            : "Help find the product in this image. Ask if uncertain."
          : "");
      const requestId = activeId.current + 1;
      const answer = ask(content, selected);
      if (preparing.current === token) preparing.current = null;
      const sent = await answer;
      if (sent && currentContext() && activeId.current === requestId)
        images.markSent();
    } finally {
      if (preparing.current === token) preparing.current = null;
    }
  }
  const composer = (expanded: boolean) => (
    <div className={styles.composerArea}>
      {!commerceEnabled && (expanded || focused) && (
        <div className={styles.suggestions}>
          {suggestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={busy}
              onClick={() => void ask(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}
      <form
        className={`${styles.composer} ${images.photos.length ? styles.withAttachments : ""} ${draggingImage ? styles.dropActive : ""}`}
        onDragOver={(e) => {
          if (
            commerceEnabled &&
            Array.from(e.dataTransfer.types).includes("Files")
          ) {
            e.preventDefault();
            setDraggingImage(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setDraggingImage(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDraggingImage(false);
          if (commerceEnabled) images.add(Array.from(e.dataTransfer.files));
        }}
        onPaste={(e) => {
          if (commerceEnabled && e.clipboardData.files.length) {
            e.preventDefault();
            images.add(Array.from(e.clipboardData.files));
          }
        }}
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          if (
            operationMode.current === "commit" ||
            commerce.busy ||
            commerce.pendingOperation
          )
            return;
          if (busy) {
            if (input.trim() && !images.photos.length && !images.working) {
              interrupt();
              void ask(input);
            }
          } else void sendMessage();
        }}
      >
        {!!images.photos.length && (
          <div className={styles.composerPhotos}>
            {images.photos.map((photo) => (
              <div key={photo.id}>
                <img
                  src={photo.preview}
                  alt={vi ? "Ảnh sản phẩm đã chọn" : "Selected product image"}
                />
                <button
                  type="button"
                  aria-label={vi ? "Bỏ ảnh" : "Remove image"}
                  title={vi ? "Bỏ ảnh" : "Remove image"}
                  disabled={busy || images.working}
                  onClick={() => images.remove(photo.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {commerceEnabled && (
          <button
            type="button"
            className={styles.attachImage}
            disabled={
              busy || images.working || !hydrated || trackedOrderDiffers
            }
            title={
              trackedOrderDiffers
                ? vi
                  ? "Mở đơn đang tra cứu trước khi gửi ảnh cho đúng đơn."
                  : "Open the tracked order before attaching images to it."
                : vi
                  ? "Thêm ảnh sản phẩm"
                  : "Add product images"
            }
            aria-label={vi ? "Thêm ảnh sản phẩm" : "Add product images"}
            onClick={() =>
              (expanded ? imagePicker : idleImagePicker).current?.click()
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
        <input
          type="file"
          ref={expanded ? imagePicker : idleImagePicker}
          className={styles.hiddenFile}
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => {
            images.add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <input
          ref={expanded ? chatInput : idleInput}
          aria-label={vi ? "Hỏi SatsunicGo" : "Ask SatsunicGo"}
          placeholder={vi ? "Hỏi bất cứ điều gì…" : "Ask anything..."}
          value={input}
          maxLength={1000}
          disabled={!hydrated || !chatReady}
          onChange={(event) => setInput(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.nativeEvent.isComposing)
              event.preventDefault();
          }}
        />
        <button
          className={styles.send}
          type={busy ? "button" : "submit"}
          onClick={busy ? interrupt : undefined}
          aria-label={sendLabel}
          title={sendLabel}
          disabled={
            phase === "committing" ||
            commerce.busy ||
            !!commerce.pendingOperation ||
            !hydrated ||
            !chatReady ||
            (!busy &&
              ((!input.trim() && !images.photos.length) || images.working))
          }
        >
          <AskIcon kind={busy ? "stop" : "send"} />
        </button>
        <button
          className={styles.close}
          type="button"
          disabled={!hydrated || phase === "committing"}
          aria-label={
            expanded
              ? vi
                ? "Đóng hội thoại"
                : "Close conversation"
              : vi
                ? "Thu gọn Ask SatsunicGo"
                : "Hide Ask SatsunicGo"
          }
          title={
            expanded
              ? vi
                ? "Đóng hội thoại"
                : "Close conversation"
              : vi
                ? "Thu gọn Ask SatsunicGo"
                : "Hide Ask SatsunicGo"
          }
          onClick={() => (expanded ? close() : hide())}
        >
          <AskIcon kind="close" />
        </button>
      </form>
      {images.error && (
        <p className={styles.attachmentNotice} role="alert">
          {images.error}
        </p>
      )}
      {images.working && (
        <p className={styles.attachmentNotice} role="status">
          {vi ? "Đang xử lý ảnh…" : "Processing images…"}
        </p>
      )}
      {!!images.photos.length && (
        <p className={styles.attachmentNotice}>
          {vi
            ? "Tối đa 3 ảnh sản phẩm · 2 MB/ảnh. Ảnh được gửi cho AI và lưu cùng đơn khi có đơn. Không gửi giấy tờ hoặc biên lai."
            : "Up to 3 product photos · 2 MB each. Photos go to AI and are stored with your order once created. Avoid documents or receipts."}
        </p>
      )}
      {(expanded || focused) && (
        <p className={styles.notice}>
          {vi
            ? "Khi dùng AI, câu hỏi có thể được Google xử lý. Không chia sẻ thông tin nhạy cảm."
            : "When AI is used, questions may be processed by Google. Avoid sharing sensitive information."}{" "}
          <Link href="/privacy">{vi ? "Quyền riêng tư" : "Privacy"}</Link>
        </p>
      )}
    </div>
  );

  return (
    <>
      {!open && (dismissed || idleExiting) && (
        <button
          className={styles.reopen}
          data-emerging={idleExiting || undefined}
          data-hint={hintVisible || undefined}
          disabled={!hydrated || idleExiting}
          type="button"
          aria-label={vi ? "Hỏi SatsunicGo" : "Ask SatsunicGo"}
          title="Ask Anything"
          onClick={() => {
            setReturned(false);
            setDismissed(false);
            if (
              turns.length ||
              commerce.order ||
              Object.keys(commerce.draft).length
            )
              setOpen(true);
          }}
        >
          <AskIcon kind="chat" />
          <span className={styles.hint} aria-hidden="true">
            {Array.from("Ask Anything").map((letter, index) => (
              <span key={index} style={{ animationDelay: `${index * 35}ms` }}>
                {letter === " " ? "\u00a0" : letter}
              </span>
            ))}
          </span>
        </button>
      )}
      {!open && !dismissed && (
        <aside
          ref={idleShell}
          className={styles.idle}
          data-returning={returned || undefined}
          data-hiding={idleExiting || undefined}
          aria-label={vi ? "Hỏi SatsunicGo" : "Ask SatsunicGo"}
        >
          {(!!turns.length ||
            !!commerce.order ||
            !!Object.keys(commerce.draft).length) && (
            <button
              className={styles.resume}
              type="button"
              onClick={() => setOpen(true)}
            >
              {vi ? "Tiếp tục hội thoại" : "Continue conversation"}
            </button>
          )}
          {composer(false)}
        </aside>
      )}
      <dialog
        ref={dialog}
        data-closing={exiting || undefined}
        className={styles.dialog}
        aria-labelledby="ask-title"
        onPointerDown={(event) => {
          outsidePointer.current = isBackdrop(event);
        }}
        onPointerUp={(event) => {
          const collapse = outsidePointer.current && isBackdrop(event);
          outsidePointer.current = false;
          if (collapse) close();
        }}
        onPointerCancel={() => {
          outsidePointer.current = false;
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          if (open) close();
        }}
      >
        <header className={styles.header}>
          <span id="ask-title">
            Satsunic<span>Go</span>
          </span>
          <span>{vi ? "Hỏi SatsunicGo" : "Ask SatsunicGo"}</span>
        </header>
        <div
          className={styles.conversation}
          ref={conversation}
          role="log"
          aria-label="Conversation with SatsunicGo"
        >
          <ConversationContent
            turns={turns}
            phase={phase}
            language={language}
            busy={busy}
            visible={open && !exiting}
            onRetry={sendMessage}
            commerce={commerce}
          />
          {commerceEnabled && !trackedOrderDiffers && (
            <CommercePanel
              commerce={commerce}
              language={language}
              hasMessages={turns.length > 0}
            />
          )}
        </div>
        <div className={styles.dialogBottom}>{composer(true)}</div>
      </dialog>
    </>
  );
}

function viActionTitle(action: string, language: string) {
  const labels: Record<string, [string, string]> = {
    submitRequest: ["Đã gửi yêu cầu", "Request sent"],
    acceptQuote: ["Đã duyệt báo giá", "Quote accepted"],
    approveFinal: ["Đã duyệt tổng phí cuối", "Final total approved"],
    confirmReceipt: ["Đã xác nhận nhận đủ hàng", "Receipt confirmed"],
  };
  return labels[action]?.[language === "vi" ? 0 : 1] ?? action;
}
