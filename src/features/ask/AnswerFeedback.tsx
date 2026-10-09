import { useEffect, useRef, useState, useId } from "react";
import { z } from "zod";
import { auth, callService } from "../../shared/firebase";
import {
  askFeedbackSchema,
  feedbackWithdrawalSchema,
  feedbackPolicySchema,
} from "../../../packages/domain/ask-feedback";
import { askAnswerSchema } from "../../../packages/domain/ask-stream";
import type { Commerce } from "./Commerce";
import styles from "./Ask.module.css";
import ui from "./Research.module.css";

export function AnswerFeedback({
  commerce,
  vi,
}: {
  commerce: Commerce;
  vi: boolean;
}) {
  const [category, setCategory] = useState("helpful"),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [sentId, setSentId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<z.infer<
    typeof feedbackPolicySchema
  > | null>(null);
  const running = useRef(false);
  const current = useRef(commerce),
    generation = useRef(0),
    pending = useRef<z.infer<typeof askFeedbackSchema> | null>(null),
    id = useId();
  current.current = commerce;
  const owner = commerce.user?.uid,
    cid = commerce.conversationId,
    version = commerce.conversation?.version;
  const answer = commerce.conversation?.turns.at(-1)?.answer;
  useEffect(() => {
    generation.current++;
    pending.current = null;
    running.current = false;
    setSentId(null);
    setBusy(false);
    setConsent(false);
    setMessage("");
    setPolicy(null);
    const captured = generation.current;
    if (owner && auth?.currentUser?.uid === owner) {
      void callService("askFeedbackPolicy", {})
        .then((value) => {
          const parsed = feedbackPolicySchema.safeParse(value);
          if (
            generation.current === captured &&
            auth?.currentUser?.uid === owner &&
            parsed.success &&
            parsed.data.enabled &&
            parsed.data.expiresAt > Date.now()
          )
            setPolicy(parsed.data);
        })
        .catch(() => {});
    }
  }, [owner, cid, version]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  useEffect(() => {
    if (!policy) return;
    const timer = window.setTimeout(
      () => {
        setPolicy(null);
        if (!pending.current) setConsent(false);
      },
      Math.max(0, policy.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [policy]);
  const t = (a: string, b: string) => (vi ? a : b);
  async function send() {
    if (
      running.current ||
      busy ||
      !consent ||
      (!pending.current && (!policy || policy.expiresAt <= Date.now())) ||
      !owner ||
      !cid ||
      !version ||
      !answer ||
      auth?.currentUser?.uid !== owner
    )
      return;
    const captured = ++generation.current;
    const valid = () =>
      generation.current === captured &&
      auth?.currentUser?.uid === owner &&
      current.current.conversationId === cid &&
      current.current.conversation?.version === version;
    setBusy(true);
    running.current = true;
    setMessage("");
    try {
      if (!pending.current) {
        const bytes = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(
            JSON.stringify(askAnswerSchema.parse(answer)),
          ),
        );
        if (!valid()) return;
        pending.current = askFeedbackSchema.parse({
          operationId: crypto.randomUUID(),
          submittedAt: Date.now(),
          expectedPolicyVersion: policy!.version,
          conversationId: cid,
          expectedVersion: version,
          answerHash: [...new Uint8Array(bytes)]
            .map((n) => n.toString(16).padStart(2, "0"))
            .join(""),
          consent: true,
          category,
        });
      }
      const input = pending.current;
      const result = z
        .object({ id: z.string().uuid(), version: z.literal(1) })
        .strict()
        .parse(await callService("askFeedback", input));
      if (!valid()) return;
      if (result.id !== input.operationId)
        throw Error("INVALID_FEEDBACK_REPLY");
      pending.current = null;
      setSentId(input.operationId);
      setConsent(false);
      setMessage(
        t(
          "Đã nhận góp ý. Nhân viên sẽ xem xét; nội dung hướng dẫn chỉ đổi sau khi được duyệt.",
          "Feedback received. Staff will review it; guidance changes require approval.",
        ),
      );
    } catch {
      if (valid())
        setMessage(
          t(
            "Chưa xác nhận được góp ý. Thử lại để gửi đúng góp ý này.",
            "Feedback is not confirmed. Retry to send the same feedback.",
          ),
        );
    } finally {
      if (valid()) {
        setBusy(false);
        running.current = false;
      }
    }
  }
  async function withdraw() {
    const feedbackId = sentId ?? pending.current?.operationId;
    if (running.current || !feedbackId || auth?.currentUser?.uid !== owner)
      return;
    running.current = true;
    setBusy(true);
    const captured = ++generation.current;
    const valid = () =>
      generation.current === captured &&
      auth?.currentUser?.uid === owner &&
      current.current.conversationId === cid &&
      current.current.conversation?.version === version;
    try {
      const result = z
        .object({ id: z.string().uuid(), withdrawn: z.literal(true) })
        .strict()
        .parse(
          await callService(
            "askFeedbackWithdraw",
            feedbackWithdrawalSchema.parse({ feedbackId }),
          ),
        );
      if (!valid()) return;
      if (result.id !== feedbackId) throw Error("INVALID_WITHDRAWAL_REPLY");
      pending.current = null;
      setSentId(null);
      setConsent(false);
      setMessage(
        t(
          "Đã rút góp ý. Nhân viên sẽ không dùng góp ý này để xem xét nữa.",
          "Feedback withdrawn. Staff will no longer use it for review.",
        ),
      );
    } catch {
      if (valid())
        setMessage(
          t(
            "Chưa xác nhận được việc rút góp ý. Thử lại để rút đúng góp ý này.",
            "Withdrawal is not confirmed. Retry to withdraw the same feedback.",
          ),
        );
    } finally {
      if (valid()) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  if (!owner || !answer || !version) return null;
  return (
    <details className={`${styles.manualFallback} ${ui.feedback}`}>
      <summary>
        {t("Góp ý về câu trả lời", "Give feedback on this answer")}
      </summary>
      <form
        className={styles.inlineForm}
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor={`${id}-category`}>
          {t("Câu trả lời này thế nào?", "How was this answer?")}
        </label>
        <select
          id={`${id}-category`}
          value={category}
          disabled={busy || !!pending.current}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="helpful">{t("Hữu ích", "Helpful")}</option>
          <option value="missing_information">
            {t("Thiếu thông tin", "Missing information")}
          </option>
          <option value="incorrect_information">
            {t("Thông tin chưa đúng", "Incorrect information")}
          </option>
          <option value="hard_to_understand">
            {t("Khó hiểu", "Hard to understand")}
          </option>
        </select>
        <label className={ui.consent}>
          <input
            type="checkbox"
            checked={consent}
            disabled={busy || !!pending.current || !policy}
            onChange={(e) => setConsent(e.target.checked)}
          />
          {t(
            "Tôi đồng ý gửi loại góp ý đã chọn để cải thiện câu trả lời. Không gửi thêm nội dung chat hay thông tin cá nhân.",
            "I agree to send this feedback category to improve answers. No additional chat text or personal details are sent.",
          )}
        </label>
        <p>
          {policy
            ? t(
                `Loại góp ý và mã tham chiếu được giữ ${policy.retentionDays} ngày. Anh/chị có thể rút góp ý sau khi gửi.`,
                `The feedback category and reference are kept for ${policy.retentionDays} days. You can withdraw feedback after sending.`,
              )
            : t(
                "Góp ý chưa sẵn sàng. Thời hạn lưu cần được xác nhận trước khi gửi.",
                "Feedback is not ready. Retention must be confirmed before sending.",
              )}
        </p>
        <button type="submit" disabled={busy || !consent || !!sentId}>
          {busy
            ? t("Đang gửi…", "Sending…")
            : pending.current
              ? t("Gửi lại góp ý này", "Retry this feedback")
              : t("Gửi góp ý", "Send feedback")}
        </button>
        {(sentId || pending.current) && (
          <button type="button" disabled={busy} onClick={() => void withdraw()}>
            {t("Rút góp ý", "Withdraw feedback")}
          </button>
        )}
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}
