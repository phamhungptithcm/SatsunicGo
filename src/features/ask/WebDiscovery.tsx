import { useEffect, useId, useRef, useState } from "react";
import { auth, callService } from "../../shared/firebase";
import {
  webSelectInputSchema,
  webSelectResultSchema,
  webReferenceDraft,
  type WebDiscoveryResult,
} from "../../../packages/domain/ask-web";
import type { Commerce } from "./Commerce";
import ui from "./Research.module.css";
import styles from "./Ask.module.css";
export function WebDiscovery({
  result,
  commerce,
  vi,
  active,
}: {
  result: WebDiscoveryResult;
  commerce: Commerce;
  vi: boolean;
  active: boolean;
}) {
  const [index, setIndex] = useState(0),
    [quantity, setQuantity] = useState(""),
    [variant, setVariant] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [expired, setExpired] = useState(result.expiresAt <= Date.now());
  const id = useId(),
    current = useRef(commerce),
    generation = useRef(0),
    running = useRef(false);
  current.current = commerce;
  const owner = commerce.user?.uid,
    cid = commerce.conversationId;
  useEffect(() => {
    generation.current++;
    running.current = false;
    setBusy(false);
    setMessage("");
    setQuantity("");
    setVariant("");
    setIndex(0);
    setExpired(result.expiresAt <= Date.now());
    const timer = window.setTimeout(
      () => setExpired(true),
      Math.max(0, result.expiresAt - Date.now()),
    );
    return () => {
      window.clearTimeout(timer);
      generation.current++;
    };
  }, [owner, cid, result]);
  const t = (a: string, b: string) => (vi ? a : b);
  const available =
    active &&
    !expired &&
    !commerce.busy &&
    commerce.restorationReady &&
    !commerce.pendingOperation &&
    !commerce.order &&
    !commerce.draft.items?.length &&
    cid === result.conversationId &&
    auth?.currentUser?.uid === owner;
  async function fill() {
    if (!available || running.current) return;
    const version = current.current.conversation?.version;
    const input = webSelectInputSchema.safeParse({
      discoveryId: result.discoveryId,
      conversationId: cid,
      expectedVersion: version,
      index,
      quantity: /^\d+$/.test(quantity) ? Number(quantity) : NaN,
      variant,
    });
    if (!input.success) {
      setMessage(
        t(
          "Chọn mẫu và số lượng từ 1 đến 99 trước nhé.",
          "Choose a variant and quantity from 1 to 99 first.",
        ),
      );
      return;
    }
    const captured = ++generation.current;
    const owns = () =>
      generation.current === captured &&
      auth?.currentUser?.uid === owner &&
      current.current.conversationId === cid &&
      current.current.conversation?.version === version &&
      result.expiresAt > Date.now();
    running.current = true;
    setBusy(true);
    setMessage("");
    try {
      const selected = webSelectResultSchema.parse(
        await callService("askWebSelect", input.data),
      );
      if (!owns()) return;
      if (
        JSON.stringify(selected.draft) !==
        JSON.stringify(
          webReferenceDraft(
            result,
            index,
            input.data.quantity,
            input.data.variant,
          ),
        )
      )
        throw Error("INVALID_WEB_DRAFT");
      const saved = await current.current.run({
        action: "saveDraft",
        payload: selected.draft,
      });
      // run owns its command version; only identity/mount still gates its result.
      if (
        generation.current !== captured ||
        auth?.currentUser?.uid !== owner ||
        current.current.conversationId !== cid
      )
        return;
      setMessage(
        saved
          ? t(
              "Đã điền bản nháp bên dưới. Kiểm tra lại trước khi gửi để nhân viên báo giá.",
              "Draft filled below. Review it before submitting for a staff quotation.",
            )
          : t(
              "Chưa xác nhận được bản nháp. Kiểm tra thao tác đang chờ trong hội thoại.",
              "Draft not confirmed. Check the pending action in this conversation.",
            ),
      );
    } catch {
      if (owns())
        setMessage(
          t(
            "Chưa điền được bản nháp. Nguồn hoặc hội thoại có thể đã đổi; kiểm tra lại trước khi chọn.",
            "Draft could not be filled. The source or conversation may have changed; review it before selecting.",
          ),
        );
    } finally {
      if (generation.current === captured) {
        running.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section
      className={ui.research}
      aria-label={t("Nguồn tìm trên Google", "Google search references")}
    >
      <p>
        {t(
          "Nguồn tham khảo từ Google. Giá, đánh giá, mẫu và tình trạng hàng cần được kiểm tra lại.",
          "References from Google. Prices, reviews, variants and availability still need checking.",
        )}
      </p>
      <ul className={ui.offers}>
        {result.candidates.map((candidate, i) => (
          <li key={candidate.url}>
            <div>
              <a href={candidate.url} target="_blank" rel="noopener noreferrer">
                {i + 1}. {candidate.title}
              </a>
              <p>{new URL(candidate.url).hostname}</p>
              <p>
                {t(
                  "Giá và đánh giá: chưa xác nhận",
                  "Price and reviews: unconfirmed",
                )}
              </p>
            </div>
            <label>
              <input
                type="radio"
                name={`${id}-source`}
                checked={i === index}
                disabled={!available || busy}
                onChange={() => setIndex(i)}
              />
              {t("Chọn nguồn này", "Choose this reference")}
            </label>
          </li>
        ))}
      </ul>
      {!result.candidates.length && (
        <p>
          {t(
            "Chưa có link cửa hàng phù hợp trong kết quả này.",
            "No suitable merchant link was returned in this search.",
          )}
        </p>
      )}
      {/* Provider Suggestions stay intact, isolated from the host DOM; scripts and same-origin access are disabled. */}
      <iframe
        title={t("Gợi ý tìm kiếm của Google", "Google Search Suggestions")}
        className={ui.suggestions}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        srcDoc={result.suggestionsHtml}
      />
      {expired && (
        <p role="status">
          {t(
            "Nguồn đã hết hạn để chọn. Anh/chị kiểm tra lại trước khi soạn yêu cầu.",
            "These references have expired for selection. Check again before preparing a request.",
          )}
        </p>
      )}
      {result.candidates.length > 0 && (
        <form
          className={`${styles.inlineForm} ${ui.fields}`}
          onSubmit={(e) => {
            e.preventDefault();
            void fill();
          }}
        >
          <label htmlFor={`${id}-variant`}>
            <span>
              {t("Mẫu anh/chị muốn mua", "Variant you want")}{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
          </label>
          <input
            id={`${id}-variant`}
            required
            maxLength={160}
            value={variant}
            disabled={!available || busy}
            onChange={(e) => setVariant(e.target.value)}
          />
          <label htmlFor={`${id}-quantity`}>
            <span>
              {t("Số lượng", "Quantity")}{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
          </label>
          <input
            id={`${id}-quantity`}
            className={ui.quantity}
            type="number"
            required
            min={1}
            max={99}
            step={1}
            value={quantity}
            disabled={!available || busy}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button
            type="submit"
            className="primary"
            disabled={!available || busy}
          >
            {busy
              ? t("Đang kiểm tra…", "Checking…")
              : t("Điền vào bản nháp mua hộ", "Fill purchase request draft")}
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
