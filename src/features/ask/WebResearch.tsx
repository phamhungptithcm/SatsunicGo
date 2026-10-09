import { useEffect, useRef, useState, useId } from "react";
import { auth, callService } from "../../shared/firebase";
import {
  researchSearchResultSchema,
  researchSelectResultSchema,
  researchPriceText,
  researchDraft,
  type ResearchOffer,
} from "../../../packages/domain/ask-research";
import type { Commerce } from "./Commerce";
import styles from "./Ask.module.css";
import ui from "./Research.module.css";

/** Reviewed web evidence only. Automated provider discovery remains gated. */
export function WebResearch({
  question,
  commerce,
  vi,
  active,
}: {
  question: string;
  commerce: Commerce;
  vi: boolean;
  active: boolean;
}) {
  const [query, setQuery] = useState(question),
    [market, setMarket] = useState<"US" | "JP" | "KR">("US"),
    [offers, setOffers] = useState<ResearchOffer[]>([]),
    [quantity, setQuantity] = useState("1"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [limited, setLimited] = useState(false);
  const id = useId(),
    current = useRef({ commerce, active }),
    generation = useRef(0),
    locked = useRef(false);
  current.current = { commerce, active };
  const owner = commerce.user?.uid ?? null,
    cid = commerce.conversationId;
  useEffect(() => {
    generation.current++;
    locked.current = false;
    setBusy(false);
    setOffers([]);
    setMessage("");
  }, [owner, cid, question]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const t = (a: string, b: string) => (vi ? a : b);
  const blocked =
    !active ||
    !owner ||
    !cid ||
    commerce.busy ||
    !!commerce.pendingOperation ||
    !!commerce.order ||
    busy;
  async function run(offer?: ResearchOffer) {
    if (blocked || locked.current || auth?.currentUser?.uid !== owner) return;
    const captured = ++generation.current,
      capturedVersion = commerce.conversation?.version;
    const valid = () =>
      generation.current === captured &&
      current.current.active &&
      auth?.currentUser?.uid === owner &&
      current.current.commerce.user?.uid === owner &&
      current.current.commerce.conversationId === cid &&
      !current.current.commerce.order &&
      !current.current.commerce.pendingOperation &&
      current.current.commerce.conversation?.version === capturedVersion;
    locked.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (!offer) {
        setOffers([]);
        const result = researchSearchResultSchema.parse(
          await callService("askResearchSearch", {
            query: query.trim(),
            market,
          }),
        );
        if (!valid()) return;
        if (
          result.offers.some(
            (row) =>
              row.market !== market ||
              row.observedAt > Date.now() ||
              row.expiresAt <= Date.now(),
          )
        )
          throw Error("INVALID_RESEARCH_RESULT");
        setOffers(result.offers);
        setLimited(result.limited);
        if (!result.offers.length)
          setMessage(
            t(
              "Chưa có nguồn phù hợp đã được kiểm tra. Anh/chị vẫn có thể gửi yêu cầu mua hộ.",
              "No matching reviewed source yet. You can still request an item.",
            ),
          );
      } else {
        const result = researchSelectResultSchema.parse(
          await callService("askResearchSelect", {
            id: offer.id,
            version: offer.version,
            contentHash: offer.contentHash,
            quantity: Number(quantity),
          }),
        );
        if (!valid()) return;
        if (
          JSON.stringify(result.offer) !== JSON.stringify(offer) ||
          JSON.stringify(result.draft) !==
            JSON.stringify(researchDraft(offer, Number(quantity))) ||
          offer.expiresAt <= Date.now()
        )
          throw Error("INVALID_RESEARCH_SELECTION");
        if (
          !(await current.current.commerce.run({
            action: "saveDraft",
            payload: result.draft,
          }))
        )
          throw Error("DRAFT_NOT_CONFIRMED");
        if (generation.current === captured && auth?.currentUser?.uid === owner)
          setMessage(
            t(
              "Bản nháp đã được lưu. Anh/chị xem lại rồi gửi yêu cầu để nhân viên báo giá.",
              "Draft saved. Review and send the request for a staff quotation.",
            ),
          );
      }
    } catch {
      if (generation.current === captured && auth?.currentUser?.uid === owner)
        setMessage(
          t(
            "Chưa hoàn tất. Anh/chị kiểm tra kết nối rồi thử lại; chưa có yêu cầu mua hàng nào được gửi.",
            "Could not finish. Check your connection and retry; no purchase request was submitted.",
          ),
        );
    } finally {
      if (generation.current === captured) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section
      className={`${styles.catalogResults} ${ui.research}`}
      aria-label={t("Nguồn bán tham khảo", "Seller references")}
    >
      <h3>
        {t("Tìm nguồn bán ngoài danh mục", "Find sellers beyond the catalog")}
      </h3>
      <p>
        {t(
          "Tra cứu các nguồn nhân viên đã kiểm tra. Giá và review là thông tin tại thời điểm kiểm tra; nhân viên sẽ báo giá trước khi thanh toán.",
          "Search sources reviewed by staff. Prices and reviews reflect the check date; staff will quote before payment.",
        )}
      </p>
      {!owner && (
        <p>
          {t(
            "Đăng nhập để tra cứu và lưu bản nháp.",
            "Sign in to search and save a draft.",
          )}
        </p>
      )}
      <form
        className={`${styles.inlineForm} ${ui.fields}`}
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        <label htmlFor={`${id}-query`}>
          <span>
            {t("Sản phẩm cần tìm", "Product to find")}{" "}
            <span className="requiredMark" aria-hidden="true">
              *
            </span>
          </span>
          <input
            id={`${id}-query`}
            value={query}
            maxLength={200}
            minLength={2}
            required
            disabled={blocked}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffers([]);
            }}
          />
        </label>
        <label htmlFor={`${id}-market`}>{t("Thị trường", "Market")}</label>
        <select
          id={`${id}-market`}
          value={market}
          disabled={blocked}
          onChange={(e) => {
            setMarket(e.target.value as typeof market);
            setOffers([]);
          }}
        >
          <option value="US">US</option>
          <option value="JP">JP</option>
          <option value="KR">KR</option>
        </select>
        <button type="submit" disabled={blocked}>
          {busy
            ? t("Đang kiểm tra…", "Checking…")
            : t("Tìm nguồn tham khảo", "Find references")}
        </button>
      </form>
      {limited && (
        <p>
          {t(
            "Kết quả giới hạn trong phần nguồn đã kiểm tra.",
            "Results cover only the sources checked.",
          )}
        </p>
      )}
      {!!offers.length && (
        <>
          <div className={`${styles.inlineForm} ${ui.quantity}`}>
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
              type="number"
              min={1}
              max={99}
              required
              value={quantity}
              disabled={blocked}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <ul className={ui.offers}>
            {offers.map((offer, index) => (
              <li key={offer.id}>
                <div>
                  <a href={offer.url} target="_blank" rel="noopener noreferrer">
                    {index + 1}. {offer.title}
                  </a>
                  <p>
                    {offer.variant} · {offer.market}
                  </p>
                  <p>
                    {offer.price
                      ? `${t("Giá tham khảo / sản phẩm", "Reference unit price")}: ${researchPriceText(offer.price)}`
                      : t("Chưa xác nhận giá", "Price not confirmed")}
                  </p>
                  <p>
                    {offer.reviews
                      ? `${offer.reviews.rating}/5 · ${offer.reviews.count.toLocaleString(vi ? "vi-VN" : "en-US")} ${t("review tại nguồn bán", "seller-site reviews")}`
                      : t("Chưa xác nhận review", "Reviews not confirmed")}
                  </p>
                  <p>
                    {t("Kiểm tra lúc", "Checked")}:{" "}
                    {new Date(offer.observedAt).toLocaleString(
                      vi ? "vi-VN" : "en-US",
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={
                    blocked ||
                    !/^\d{1,2}$/.test(quantity) ||
                    Number(quantity) < 1
                  }
                  onClick={() => void run(offer)}
                >
                  {Object.keys(commerce.draft).length
                    ? t(
                        "Thay bản nháp bằng lựa chọn này",
                        "Replace draft with this choice",
                      )
                    : t(
                        "Soạn yêu cầu từ lựa chọn này",
                        "Prepare request from this choice",
                      )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
