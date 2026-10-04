"use client";

import { requestSchema } from "../../../packages/domain";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
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

type Turn = {
  id: number;
  question: string;
  answer?: AskAnswer;
  status: "pending" | "answered" | "error" | "stopped";
  rateLimited?: boolean;
};
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
  const action = sourceLink(answer.action);
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
          {answer.sourceIds.map((id) => {
            const link = sourceLink(id);
            return (
              <Link key={id} href={link.href}>
                {link.label} <span aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </div>
      )}
      {answer.draft && (
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
      <Link className={styles.nextAction} href={action.href}>
        {vi ? "Gửi yêu cầu mua hộ" : "Request an item"}{" "}
        <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
});

const ConversationContent = memo(function ConversationContent({
  turns,
  phase,
  language,
  busy,
  onRetry,
}: {
  turns: Turn[];
  phase: "retrieving" | "selecting";
  language: AskLanguage;
  busy: boolean;
  onRetry: (question: string) => Promise<void>;
}) {
  const vi = language === "vi";
  return (
    <>
      {turns.map((turn) => (
        <section
          className={styles.turn}
          key={turn.id}
          aria-label={turn.question}
        >
          <div className={styles.question}>
            <p>{turn.question}</p>
          </div>
          {turn.status === "pending" ? (
            <p className={styles.status} role="status">
              <span className={styles.logo} aria-hidden="true">
                SG
              </span>
              {phase === "selecting"
                ? vi
                  ? "Đang tìm thông tin phù hợp…"
                  : "Finding the right information…"
                : vi
                  ? "Đang kiểm tra thông tin SatsunicGo…"
                  : "Checking SatsunicGo information…"}
            </p>
          ) : turn.answer ? (
            <PublishedAnswer answer={turn.answer} />
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
                      ? "Bạn đã hỏi nhiều câu liên tiếp. Hãy thử lại sau một phút."
                      : "You have asked several questions in a row. Please try again in a minute."
                    : vi
                      ? "Chưa thể trả lời lúc này. Câu hỏi của bạn vẫn được giữ lại."
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
  const [hintVisible, setHintVisible] = useState(false);
  const [returned, setReturned] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [idleExiting, setIdleExiting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"retrieving" | "selecting">("retrieving");
  const [language, setLanguage] = useState<AskLanguage>("vi");
  const dialog = useRef<HTMLDialogElement>(null);
  const chatInput = useRef<HTMLInputElement>(null);
  const idleInput = useRef<HTMLInputElement>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const activeId = useRef(0);
  const locked = useRef(false);
  const session = useRef<string | null>(null);
  const dialogMotion = useRef<Animation | null>(null);
  const idleMotion = useRef<Animation | null>(null);
  const idleShell = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const outsidePointer = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    setExiting(false);
    element.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const capsule = element.querySelector("form");
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
    const id = activeId.current;
    activeId.current++;
    abort.current?.abort();
    abort.current = null;
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
    if (!open || closing.current) return;
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
    const capsule = element.querySelector("form");
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
      const capsule = shell.querySelector("form")?.getBoundingClientRect();
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

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (
        !text ||
        text.length > 1000 ||
        locked.current ||
        closing.current ||
        hideTimer.current
      )
        return;
      locked.current = true;
      const controller = new AbortController();
      const requestSignal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(15_000),
      ]);
      abort.current = controller;
      const id = ++activeId.current;
      const history = turns
        .filter((turn) => turn.status === "answered")
        .slice(-6)
        .map((turn) => turn.question);
      setTurns((current) => [
        ...current.slice(-11),
        { id, question: text, status: "pending" },
      ]);
      setInput("");
      setBusy(true);
      setPhase("retrieving");
      setDismissed(false);
      setOpen(true);
      if (!session.current) session.current = crypto.randomUUID();
      try {
        const published = retrieveSelection({
          question: text,
          history,
          sessionId: session.current,
          language,
        });
        if (published.topic !== "outside") {
          // Approved public FAQs are available immediately, even if the API is
          // cold, disconnected or unavailable. No Gemini or transport required.
          const answer = buildAnswer(published, detectLanguage(text, language));
          setLanguage(answer.language);
          setTurns((current) =>
            current.map((turn) =>
              turn.id === id ? { ...turn, answer, status: "answered" } : turn,
            ),
          );
          return;
        }
        if (controller.signal.aborted || activeId.current !== id) return;
        const { callService } = await import("../../shared/firebase");
        const answer = await Promise.race([
          callService<AskAnswer>("ask", {
            question: text,
            ...(route.pathname.match(
              /^\/account\/orders\/([a-zA-Z0-9-]{1,80})$/,
            )
              ? { orderId: route.pathname.split("/").at(-1) }
              : {}),
            sessionId: session.current,
            language,
          }),
          new Promise<never>((_, reject) =>
            requestSignal.addEventListener(
              "abort",
              () => reject(new Error("REQUEST_CANCELLED")),
              { once: true },
            ),
          ),
        ]);
        if (activeId.current !== id || controller.signal.aborted) return;
        setTurns((current) =>
          current.map((turn) =>
            turn.id === id ? { ...turn, answer, status: "answered" } : turn,
          ),
        );
      } catch {
        if (activeId.current === id) {
          setTurns((current) =>
            current.map((turn) =>
              turn.id === id
                ? { ...turn, answer: undefined, status: "error" }
                : turn,
            ),
          );
          setInput(text);
        }
      } finally {
        if (activeId.current === id) {
          locked.current = false;
          abort.current = null;
          setBusy(false);
          chatInput.current?.focus({ preventScroll: true });
        }
      }
    },
    [turns, language, aiAvailable, route.pathname],
  );

  const vi = language === "vi";
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
  const composer = (expanded: boolean) => (
    <div className={styles.composerArea}>
      {(expanded || focused) && (
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
        className={styles.composer}
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          if (busy) interrupt();
          else void ask(input);
        }}
      >
        <input
          ref={expanded ? chatInput : idleInput}
          aria-label={vi ? "Hỏi SatsunicGo" : "Ask SatsunicGo"}
          placeholder={vi ? "Hỏi bất cứ điều gì…" : "Ask anything..."}
          value={input}
          maxLength={1000}
          disabled={!hydrated}
          onChange={(event) => setInput(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.nativeEvent.isComposing)
              event.preventDefault();
          }}
        />
        <button
          className={styles.send}
          type="submit"
          aria-label={
            busy
              ? vi
                ? "Dừng câu trả lời"
                : "Stop response"
              : vi
                ? "Gửi câu hỏi"
                : "Send question"
          }
          title={
            busy
              ? vi
                ? "Dừng câu trả lời"
                : "Stop response"
              : vi
                ? "Gửi câu hỏi"
                : "Send question"
          }
          disabled={!hydrated || (!busy && !input.trim())}
        >
          <AskIcon kind={busy ? "stop" : "send"} />
        </button>
        <button
          className={styles.close}
          type="button"
          disabled={!hydrated}
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
      {(expanded || focused) && (
        <p className={styles.notice}>
          {aiAvailable
            ? vi
              ? "Câu hỏi có thể được Google xử lý. Không chia sẻ thông tin nhạy cảm."
              : "Questions may be processed by Google. Avoid sharing sensitive information."
            : vi
              ? "Câu hỏi tự do có thể được Google xử lý khi AI được kích hoạt. Không chia sẻ thông tin nhạy cảm."
              : "Free-form questions may be processed by Google when AI is enabled. Avoid sharing sensitive information."}{" "}
          <Link href="/privacy">{vi ? "Quyền riêng tư" : "Privacy"}</Link>
        </p>
      )}
    </div>
  );

  return (
    <>
      {!startCollapsed && (
        <div className={styles.bottomSpace} aria-hidden="true" />
      )}
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
            if (turns.length) setOpen(true);
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
          {!!turns.length && (
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
            onRetry={ask}
          />
        </div>
        <div className={styles.dialogBottom}>{composer(true)}</div>
      </dialog>
    </>
  );
}
