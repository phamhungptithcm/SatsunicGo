import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { z } from "zod";
import { auth, callService } from "../../shared/firebase";
import {
  feedbackInboxSchema,
  feedbackReviewSchema,
  feedbackEvaluationResultSchema,
} from "../../../packages/domain/ask-feedback";
import { knowledgePreviewResultSchema } from "../../../packages/domain/ask-knowledge";
type Inbox = z.infer<typeof feedbackInboxSchema>;
type Review = z.infer<typeof feedbackReviewSchema>;
type Preview = z.infer<typeof knowledgePreviewResultSchema>;
export function FeedbackReview() {
  const [inbox, setInbox] = useState<Inbox | null>(null),
    [selected, setSelected] = useState<string>(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [source, setSource] = useState<"posts" | "blogPublished">("posts"),
    [sourceId, setSourceId] = useState(""),
    [preview, setPreview] = useState<Preview | null>(null),
    [disposition, setDisposition] =
      useState<Review["disposition"]>("acknowledged"),
    [reviewed, setReviewed] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const generation = useRef(0),
    running = useRef(false),
    pending = useRef<Review | null>(null);
  useEffect(() => {
    const clear = () => {
      generation.current++;
      running.current = false;
      pending.current = null;
      setInbox(null);
      setSelected("");
      setPreview(null);
      setSourceId("");
      setReviewed(false);
      setBusy(false);
      setUncertain(false);
      setMessage("");
    };
    const unsubscribe = auth ? onAuthStateChanged(auth, clear) : () => {};
    return () => {
      generation.current++;
      unsubscribe();
    };
  }, []);
  const row = inbox?.rows.find(
    (item) => `${item.ownerId}-${item.feedbackId}` === selected,
  );
  async function request(kind: "inbox" | "source" | "review" | "evaluation") {
    if (running.current || (pending.current && kind !== "review")) return;
    const uid = auth?.currentUser?.uid;
    if (!uid) return;
    if (kind === "review" && !pending.current) {
      if (!row || !reviewed || row.expiresAt <= Date.now()) {
        setMessage("Chọn góp ý và xác nhận đã xem xét trước khi ghi nhận.");
        return;
      }
      const command = feedbackReviewSchema.safeParse({
        operationId: crypto.randomUUID(),
        ownerId: row.ownerId,
        feedbackId: row.feedbackId,
        expectedVersion: row.reviewVersion,
        disposition,
        ...(disposition === "resolved" &&
        preview?.approved &&
        preview.active &&
        preview.published &&
        preview.contentHash
          ? {
              source: {
                key: `${preview.source}-${preview.sourceId}`,
                version: preview.version,
                contentHash: preview.contentHash,
              },
            }
          : {}),
      });
      if (!command.success) {
        setMessage("Kiểm tra nguồn đã duyệt trước khi ghi nhận đã xử lý.");
        return;
      }
      pending.current = command.data;
      setUncertain(true);
    }
    running.current = true;
    setBusy(true);
    setMessage("");
    const captured = generation.current,
      owns = () =>
        generation.current === captured && auth?.currentUser?.uid === uid;
    try {
      if (kind === "inbox") {
        const result = feedbackInboxSchema.parse(
          await callService("askFeedbackInbox", {}),
        );
        if (!owns()) return;
        setInbox(result);
        setSelected("");
        setPreview(null);
        setReviewed(false);
      } else if (kind === "evaluation") {
        const result = feedbackEvaluationResultSchema.parse(
          await callService("askFeedbackEvaluation", { language: "vi" }),
        );
        if (!owns()) return;
        setMessage(
          `Tìm đúng nguồn và đoạn hướng dẫn trong ${result.passed}/${result.total} câu kiểm chứng. ${result.decision === "REJECTED" ? "Cần kiểm tra các câu chưa đạt." : "Vẫn cần người xem xét."} Kết quả này chỉ kiểm tra retrieval, chưa đánh giá câu trả lời LLM.`,
        );
      } else if (kind === "source") {
        setPreview(null);
        setReviewed(false);
        const result = knowledgePreviewResultSchema.parse(
          await callService("askKnowledgePreview", {
            source,
            sourceId: sourceId.trim(),
          }),
        );
        if (!owns()) return;
        if (result.source !== source || result.sourceId !== sourceId.trim())
          throw Error("INVALID_SOURCE_REPLY");
        setPreview(result);
      } else {
        const command = pending.current!;
        const result = z
          .object({ version: z.number().int().positive().safe() })
          .strict()
          .parse(await callService("askFeedbackReview", command));
        if (!owns()) return;
        if (result.version !== command.expectedVersion + 1)
          throw Error("INVALID_REVIEW_REPLY");
        pending.current = null;
        setUncertain(false);
        setReviewed(false);
        setInbox(null);
        setSelected("");
        setPreview(null);
        setMessage(
          "Đã ghi nhận xem xét. Tải lại để kiểm tra. Góp ý không tự đổi nguồn hướng dẫn hay LLM.",
        );
      }
    } catch (error) {
      if (!owns()) return;
      const code = String((error as { code?: unknown })?.code ?? "").replace(
        /^functions\//,
        "",
      );
      if (
        kind === "review" &&
        [
          "invalid-argument",
          "permission-denied",
          "unauthenticated",
          "aborted",
          "already-exists",
          "failed-precondition",
          "not-found",
        ].includes(code)
      ) {
        pending.current = null;
        setUncertain(false);
        setInbox(null);
        setPreview(null);
        setReviewed(false);
      }
      setMessage(
        pending.current
          ? "Chưa xác nhận được thao tác. Đối chiếu đúng lượt xem xét này trước khi làm tiếp."
          : "Chưa kiểm tra được góp ý hoặc nguồn. Kiểm tra quyền quản trị, xác thực gần đây và phiên bản rồi tải lại.",
      );
    } finally {
      if (owns()) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  const labels = {
    helpful: "Hữu ích",
    missing_information: "Thiếu thông tin",
    incorrect_information: "Thông tin chưa đúng",
    hard_to_understand: "Khó hiểu",
  };
  return (
    <section
      className="feedbackReview"
      aria-labelledby="askFeedbackReviewTitle"
    >
      <h3 id="askFeedbackReviewTitle">Góp ý cho Ask</h3>
      <p>
        Xem loại góp ý khách đã đồng ý gửi. Khi cần sửa hướng dẫn, kiểm tra và
        duyệt bài viết ở phần trên trước khi ghi nhận đã xử lý.
      </p>
      <button
        className="primary"
        type="button"
        disabled={busy || uncertain}
        onClick={() => void request("inbox")}
      >
        Tải góp ý
      </button>
      <button
        type="button"
        disabled={busy || uncertain}
        onClick={() => void request("evaluation")}
      >
        Kiểm tra tìm nguồn tiếng Việt
      </button>
      {inbox && (
        <>
          {inbox.limited && (
            <p role="status">
              Đang hiển thị tối đa 50 góp ý. Danh sách này chưa bao phủ toàn bộ.
            </p>
          )}
          {!inbox.rows.length && (
            <p>Chưa có góp ý còn hạn trong lượt đọc này.</p>
          )}
          <fieldset disabled={busy || uncertain}>
            <label>
              Chọn góp ý
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setReviewed(false);
                  setPreview(null);
                }}
              >
                <option value="">Chọn một góp ý</option>
                {inbox.rows.map((item) => (
                  <option
                    key={`${item.ownerId}-${item.feedbackId}`}
                    value={`${item.ownerId}-${item.feedbackId}`}
                  >
                    {labels[item.category]} ·{" "}
                    {new Date(item.createdAt).toLocaleString("vi-VN")} ·{" "}
                    {item.feedbackId.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            {row && (
              <p>
                Phiên bản xem xét: {row.reviewVersion}. Góp ý này hết hạn ngày{" "}
                {new Date(row.expiresAt).toLocaleDateString("vi-VN")}.
              </p>
            )}
            <label>
              Kết quả xem xét
              <select
                value={disposition}
                onChange={(e) => {
                  setDisposition(e.target.value as Review["disposition"]);
                  setReviewed(false);
                }}
              >
                <option value="acknowledged">Đã xem góp ý</option>
                <option value="needs_source_review">
                  Cần kiểm tra hướng dẫn
                </option>
                <option value="resolved">Đã xử lý qua nguồn được duyệt</option>
              </select>
            </label>
            {disposition === "resolved" && (
              <>
                <label>
                  Nguồn bài viết
                  <select
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value as typeof source);
                      setPreview(null);
                      setReviewed(false);
                    }}
                  >
                    <option value="posts">Bài viết</option>
                    <option value="blogPublished">Blog đã xuất bản</option>
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
                    maxLength={100}
                    onChange={(e) => {
                      setSourceId(e.target.value);
                      setPreview(null);
                      setReviewed(false);
                    }}
                  />
                </label>
                <button type="button" onClick={() => void request("source")}>
                  Kiểm tra nguồn đã duyệt
                </button>
                {preview && (
                  <>
                    <p>
                      {preview.title} ·{" "}
                      {preview.approved && preview.active
                        ? "Đã duyệt"
                        : "Chưa có nguồn đã duyệt còn hiệu lực"}
                    </p>
                    <pre className="knowledgeEvidence">{preview.body}</pre>
                  </>
                )}
              </>
            )}
            <label className="knowledgeReview">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              Tôi đã xem góp ý và kiểm tra nguồn liên quan nếu ghi nhận đã xử
              lý.
            </label>
            <button
              type="button"
              disabled={
                !row ||
                !reviewed ||
                (disposition === "resolved" && !preview?.approved)
              }
              onClick={() => void request("review")}
            >
              Ghi nhận xem xét
            </button>
          </fieldset>
        </>
      )}
      {uncertain && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void request("review")}
        >
          Đối chiếu lượt xem xét đang chờ
        </button>
      )}
      {busy && <p role="status">Đang kiểm tra…</p>}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
