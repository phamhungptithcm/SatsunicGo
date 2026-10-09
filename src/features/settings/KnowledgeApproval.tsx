import { useEffect, useRef, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { z } from "zod";
import { auth, callService } from "../../shared/firebase";
import {
  knowledgeCommandSchema,
  knowledgePreviewResultSchema,
} from "../../../packages/domain/ask-knowledge";
import "./knowledge-approval.css";
import { FeedbackReview } from "./FeedbackReview";

type Preview = z.infer<typeof knowledgePreviewResultSchema>;
type Command = z.infer<typeof knowledgeCommandSchema>;
export function KnowledgeApproval() {
  const [source, setSource] = useState<"posts" | "blogPublished">("posts"),
    [sourceId, setSourceId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [language, setLanguage] = useState<"vi" | "en">("vi"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef<Command | null>(null),
    running = useRef(false),
    generation = useRef(0),
    mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const clear = () => {
      generation.current++;
      pending.current = null;
      running.current = false;
      setPreview(null);
      setSourceId("");
      setFrom("");
      setTo("");
      setReviewed(false);
      setUncertain(false);
      setBusy(false);
      setMessage("");
    };
    const unsubscribe = auth ? onAuthStateChanged(auth, clear) : () => {};
    return () => {
      mounted.current = false;
      generation.current++;
      unsubscribe();
    };
  }, []);
  const owns = (epoch: number, uid: string | null) =>
    mounted.current &&
    epoch === generation.current &&
    (auth?.currentUser?.uid ?? null) === uid;
  function changed() {
    setPreview(null);
    setReviewed(false);
    setMessage("");
  }
  async function load(event?: FormEvent) {
    event?.preventDefault();
    if (running.current || pending.current) return;
    running.current = true;
    setBusy(true);
    setMessage("");
    setPreview(null);
    setReviewed(false);
    const epoch = generation.current,
      uid = auth?.currentUser?.uid ?? null;
    try {
      const value = knowledgePreviewResultSchema.parse(
        await callService("askKnowledgePreview", {
          source,
          sourceId: sourceId.trim(),
        }),
      );
      if (owns(epoch, uid)) setPreview(value);
    } catch {
      if (owns(epoch, uid))
        setMessage(
          "Chưa kiểm tra được nguồn. Kiểm tra mã bài viết và xác thực quản trị rồi thử lại.",
        );
    } finally {
      if (owns(epoch, uid)) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  async function execute(action: "approve" | "revoke") {
    if (running.current || (!pending.current && !preview)) return;
    const command =
      pending.current ??
      knowledgeCommandSchema.safeParse(
        action === "revoke"
          ? {
              action,
              operationId: crypto.randomUUID(),
              source: preview!.source,
              sourceId: preview!.sourceId,
              expectedVersion: preview!.version,
            }
          : {
              action,
              operationId: crypto.randomUUID(),
              source: preview!.source,
              sourceId: preview!.sourceId,
              expectedVersion: preview!.version,
              contentHash: preview!.contentHash,
              language,
              effectiveFrom: new Date(from).getTime(),
              effectiveTo: new Date(to).getTime(),
            },
      );
    if (!("action" in command)) {
      if (!command.success || (action === "approve" && !reviewed)) {
        setMessage("Kiểm tra nội dung, ngôn ngữ và thời hạn trước khi duyệt.");
        return;
      }
      pending.current = command.data;
    }
    const request = pending.current!;
    running.current = true;
    setBusy(true);
    setUncertain(true);
    setMessage("");
    const epoch = generation.current,
      uid = auth?.currentUser?.uid ?? null;
    try {
      const result = z
        .object({ version: z.number().int().positive().safe() })
        .strict()
        .parse(await callService("askKnowledgeCommand", request));
      if (!owns(epoch, uid)) return;
      if (result.version !== request.expectedVersion + 1)
        throw Error("INVALID_VERSION");
      pending.current = null;
      setUncertain(false);
      setReviewed(false);
      setPreview(null);
      setMessage(
        request.action === "approve"
          ? "Đã duyệt nguồn cho Ask. Tải lại để kiểm tra trạng thái mới."
          : "Đã thu hồi nguồn khỏi Ask. Tải lại để kiểm tra trạng thái mới.",
      );
    } catch (error) {
      if (!owns(epoch, uid)) return;
      const code = String((error as { code?: unknown })?.code ?? "").replace(
        /^functions\//,
        "",
      );
      if (
        [
          "invalid-argument",
          "permission-denied",
          "unauthenticated",
          "aborted",
          "already-exists",
          "failed-precondition",
        ].includes(code)
      ) {
        pending.current = null;
        setUncertain(false);
        setPreview(null);
        setReviewed(false);
        setMessage(
          "Chưa duyệt được nguồn. Tải lại và kiểm tra quyền, nội dung hoặc phiên bản mới.",
        );
      } else
        setMessage(
          "Chưa xác minh được kết quả. Đối chiếu thao tác đang chờ trước khi tiếp tục.",
        );
    } finally {
      if (owns(epoch, uid)) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section
      className="panel knowledgeApproval"
      aria-labelledby="knowledgeApprovalTitle"
    >
      <h2 id="knowledgeApprovalTitle">Hướng dẫn cho Ask</h2>
      <p>
        Chỉ dùng bài viết đã kiểm tra nội dung và thời hạn. Duyệt nguồn không
        bật ngân sách LLM.
      </p>
      <form onSubmit={(event) => void load(event)} className="form">
        <fieldset disabled={busy || uncertain}>
          <label>
            Nguồn bài viết
            <select
              value={source}
              onChange={(event) => {
                setSource(event.target.value as typeof source);
                changed();
              }}
            >
              <option value="posts">Bài viết</option>
              <option value="blogPublished">Blog</option>
            </select>
          </label>
          <label>
            <span>
              Mã bài viết{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              required
              value={sourceId}
              onChange={(event) => {
                setSourceId(event.target.value);
                changed();
              }}
              maxLength={100}
              pattern="[A-Za-z0-9_-]+"
            />
          </label>
          <button type="submit" disabled={!sourceId.trim()}>
            Kiểm tra nguồn
          </button>
        </fieldset>
      </form>
      {preview && (
        <>
          <h3>{preview.title}</h3>
          <p>
            {preview.active
              ? "Đang được duyệt"
              : preview.approved
                ? "Bản duyệt hiện không dùng được. Kiểm tra nội dung và thời hạn."
                : "Chưa có nguồn đang được duyệt"}{" "}
            · Phiên bản {preview.version}
          </p>
          <pre className="knowledgeEvidence">
            {preview.body ||
              "Nội dung hiện không khả dụng. Anh/chị vẫn có thể thu hồi nguồn đã duyệt."}
          </pre>
          <fieldset disabled={busy || uncertain}>
            <label>
              Ngôn ngữ
              <select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value as typeof language);
                  setReviewed(false);
                }}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              Có hiệu lực từ
              <input
                type="datetime-local"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setReviewed(false);
                }}
              />
            </label>
            <label>
              Hết hiệu lực lúc
              <input
                type="datetime-local"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setReviewed(false);
                }}
              />
            </label>
            <p>
              Thời gian theo múi giờ trình duyệt:{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}.
            </p>
            <label className="knowledgeReview">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />
              Tôi đã kiểm tra nội dung, ngôn ngữ và thời hạn.
            </label>
            <button
              className="primary"
              type="button"
              disabled={!preview.published || !reviewed || !from || !to}
              onClick={() => void execute("approve")}
            >
              Duyệt nguồn cho Ask
            </button>
            <button
              type="button"
              disabled={!preview.approved}
              onClick={() => void execute("revoke")}
            >
              Thu hồi nguồn
            </button>
          </fieldset>
        </>
      )}
      {uncertain && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void execute(pending.current?.action ?? "approve")}
        >
          Đối chiếu thao tác đang chờ
        </button>
      )}
      {busy && <p role="status">Đang kiểm tra nguồn…</p>}
      {message && <p role="status">{message}</p>}
      <FeedbackReview />
    </section>
  );
}
