const BlogComments = lazy(() =>
  import("./BlogComments").then((m) => ({ default: m.BlogComments })),
);
import { contentRow } from "../../shared/content-row";
import { lazy, Suspense } from "react";
const RichArticle = lazy(() =>
  import("./studio/RichPreview").then((m) => ({ default: m.RichArticle })),
);
import { catalogProductSchema } from "../../../packages/domain/catalog-checkout";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { betaRelease, db } from "../../shared/firebase";
import {
  useCatalogPages,
  usePublicContent,
  type ContentRow,
} from "../../shared/public-content";
function authorImage(row: ContentRow) {
  if (
    typeof row.authorAvatarId === "string" &&
    /^[a-zA-Z0-9-]{1,80}$/.test(row.authorAvatarId)
  )
    return `/media/${row.authorAvatarId}`;
  try {
    const url = new URL(row.authorGoogleAvatar ?? "");
    if (
      url.protocol === "https:" &&
      url.hostname.endsWith(".googleusercontent.com") &&
      !url.username &&
      !url.password
    )
      return url.href;
  } catch {
    /* An unavailable profile picture leaves the author name readable. */
  }
  return undefined;
}
function productRequest(row: ContentRow) {
  return `/products/${row.slug}/checkout`;
}
function purchasable(row: ContentRow) {
  return catalogProductSchema.safeParse(row).success;
}
function ProductsCatalog() {
  const { rows, error, loading, stale, retry, loadMore, hasMore } =
    useCatalogPages();
  const [search, setSearch] = useState(""),
    [market, setMarket] = useState("");
  const normalized = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .toLowerCase();
  const filtered = rows.filter(
    (row) =>
      (!market || row.market === market) &&
      normalized(`${row.title} ${row.category ?? ""}`).includes(
        normalized(search),
      ),
  );
  return (
    <section className="page productsPage">
      <header className="productsHeading">
        <h1>Sản phẩm</h1>
        <p>
          Chọn sản phẩm có giá niêm yết và thanh toán toàn bộ để SatsunicGo mua
          hộ.
        </p>
      </header>
      <div className="productFilters">
        <input
          className="productSearch"
          aria-label="Tìm sản phẩm"
          placeholder="Tìm sản phẩm…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div
          className="requestMarkets"
          role="group"
          aria-label="Lọc quốc gia mua hàng"
        >
          {[
            ["", "Tất cả"],
            ["US", "Mỹ"],
            ["JP", "Nhật Bản"],
            ["KR", "Hàn Quốc"],
          ].map(([code, label]) => (
            <button
              type="button"
              key={code}
              aria-pressed={market === code}
              onClick={() => setMarket(code)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {loading && <p role="status">Đang tải sản phẩm…</p>}
      {error && (
        <p role="alert" className="error">
          {error}{" "}
          <button type="button" className="textbutton" onClick={retry}>
            Tải lại
          </button>
        </p>
      )}
      {stale && rows.length > 0 && (
        <p className="smallNote" role="status">
          Đang hiển thị nội dung lần tải trước.
        </p>
      )}
      {rows.length > 0 && (
        <div className="catalogGrid">
          {filtered.map((row) => (
            <article className="productCard" key={row.id}>
              <Link
                className="productImage"
                to={`/products/${row.slug}`}
                aria-label={`Xem ${row.title}`}
              >
                {row.mediaId ? (
                  <img
                    src={`/media/${row.mediaId}`}
                    alt={row.mediaAlt ?? row.title}
                    loading="lazy"
                  />
                ) : (
                  <span className="productMonogram" aria-hidden="true">
                    {row.market ?? "Go"}
                  </span>
                )}
              </Link>
              <div className="productBody">
                <span className="productCategory">
                  {[
                    row.category,
                    (
                      { US: "Mỹ", JP: "Nhật Bản", KR: "Hàn Quốc" } as Record<
                        string,
                        string
                      >
                    )[row.market ?? ""],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <h2>
                  <Link to={`/products/${row.slug}`}>{row.title}</Link>
                </h2>
                {purchasable(row) ? (
                  <p>{row.listedPrice!.toLocaleString("vi-VN")} ₫ · trọn gói</p>
                ) : (
                  <p>Chưa mở đặt mua</p>
                )}
                <div className="productAction">
                  <Link to={`/products/${row.slug}`}>Xem chi tiết</Link>
                  {purchasable(row) && (
                    <Link to={productRequest(row)}>Chọn mua ↗</Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && !filtered.length && (
        <div className="empty">
          <h2>
            {rows.length
              ? "Chưa tìm thấy món này"
              : "Danh mục đang được cập nhật"}
          </h2>
          <Link className="primary" to="/request">
            Gửi món bạn muốn mua ↗
          </Link>
        </div>
      )}
      {hasMore && (
        <button disabled={loading} onClick={() => void loadMore()}>
          {loading ? "Đang tải…" : "Xem thêm sản phẩm"}
        </button>
      )}
      <p className="smallNote">
        Tìm và lọc trong các sản phẩm đã tải. Bạn có thể xem thêm để duyệt toàn
        bộ danh mục.
      </p>
      <p>
        Chưa có món bạn cần? <Link to="/request">Gửi yêu cầu mua hộ</Link> để
        được xem xét, báo giá và thanh toán hai đợt.
      </p>
    </section>
  );
}
function ProductDetails({ row }: { row: ContentRow }) {
  const source = (
    { US: "Mỹ", JP: "Nhật Bản", KR: "Hàn Quốc" } as Record<string, string>
  )[row.market ?? ""];
  return (
    <article>
      <div className="productDetailImage">
        {row.mediaId ? (
          <img src={`/media/${row.mediaId}`} alt={row.mediaAlt ?? row.title} />
        ) : (
          <span aria-hidden="true">{row.market ?? "Go"}</span>
        )}
      </div>
      <div className="productDetailCopy">
        <h1>{row.title}</h1>
        {source && <p className="productSource">Mua từ {source}</p>}
        {String(row.body ?? "")
          .split("\n\n")
          .map((paragraph, index) => {
            const heading = paragraph.match(
              /^(?:#+\s*)?(Nguồn gốc|Chức năng|Công dụng|Cách dùng|Cách sử dụng)[:\n]\s*([\s\S]*)$/i,
            );
            return heading ? (
              <section key={index}>
                <h2>{heading[1]}</h2>
                <p>{heading[2]}</p>
              </section>
            ) : (
              <p key={index}>{paragraph}</p>
            );
          })}
        {[
          ["Nguồn gốc", row.origin],
          ["Chức năng và công dụng", row.functions],
          ["Cách dùng", row.usage],
        ]
          .filter(([, body]) => body)
          .map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
        {row.variants && <p>Mẫu lựa chọn: {row.variants}</p>}
        {row.referenceUrl && /^https?:\/\//i.test(row.referenceUrl) && (
          <a
            className="productSource"
            href={row.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Xem nguồn sản phẩm ↗
          </a>
        )}
        {purchasable(row) ? (
          <>
            <p>
              Giá niêm yết trọn gói: {row.listedPrice!.toLocaleString("vi-VN")}{" "}
              ₫ / sản phẩm.
            </p>
            <Link className="primary" to={productRequest(row)}>
              Chọn mua và thanh toán →
            </Link>
          </>
        ) : (
          <p role="status">
            Sản phẩm này chưa mở đặt mua. Bạn có thể chọn sản phẩm khác trong
            danh mục.
          </p>
        )}
      </div>
    </article>
  );
}
function PostsHeading() {
  return (
    <header className="postsHeading">
      <span className="editorialEyebrow">Bài viết · SatsunicGo</span>
      <h1>
        Hiểu rõ hơn
        <br />
        <span>trước khi mua.</span>
      </h1>
      <p>Thông tin mua hộ và những điều cần biết trước khi chọn hàng.</p>
    </header>
  );
}
function PostsEmpty({
  failed = false,
  beta = false,
}: {
  failed?: boolean;
  beta?: boolean;
}) {
  return (
    <div className="postsEmpty">
      <div className="postsIllustration" aria-hidden="true">
        <svg viewBox="0 0 200 180" fill="none">
          <rect
            x="38"
            y="32"
            width="118"
            height="138"
            rx="12"
            fill="white"
            stroke="currentColor"
            strokeWidth="2"
            transform="rotate(-9 38 32)"
          />
          <rect
            x="57"
            y="18"
            width="118"
            height="138"
            rx="12"
            fill="white"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="73" y="35" width="86" height="48" rx="6" fill="#eef2ff" />
          <path
            d="M83 71l19-20 13 14 13-12 22 18M76 102h80M76 115h63M76 128h43"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="164" cy="137" r="25" fill="currentColor" />
          <path
            d="M153 137h22m-8-8 8 8-8 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="postsEmptyCopy">
        <span className="editorialEyebrow">
          {failed ? "Tải nội dung" : "Góc đọc của bạn"}
        </span>
        <h2>
          {failed ? "Nội dung chưa tải được" : "Bài viết đang được cập nhật"}
        </h2>
        <p>
          {failed
            ? "Thử tải lại hoặc gửi yêu cầu mua hộ nếu bạn đã chọn được món hàng."
            : beta
              ? "Nội dung sẽ xuất hiện tại đây khi được xuất bản."
              : "Chưa có bài viết được xuất bản. Nếu đã có món hàng muốn mua, bạn có thể gửi tên hoặc link cho SatsunicGo."}
        </p>
        <Link className="primary postsPrimary" to="/request">
          {beta ? "Xem yêu cầu mua hộ" : "Gửi yêu cầu mua hộ"}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  );
}
function PostsShortcuts() {
  return (
    <nav className="postsShortcuts" aria-label="Thông tin mua hộ">
      <Link to="/how-it-works">
        <span className="shortcutNumber" aria-hidden="true">
          01
        </span>
        <span>
          <strong>Cách mua hộ</strong>
          <span>Tìm hiểu các bước gửi yêu cầu</span>
        </span>
        <span aria-hidden="true">↗</span>
      </Link>
      <Link to="/fees">
        <span className="shortcutNumber" aria-hidden="true">
          02
        </span>
        <span>
          <strong>Biểu phí</strong>
          <span>Xem thông tin phí mua hộ</span>
        </span>
        <span aria-hidden="true">↗</span>
      </Link>
    </nav>
  );
}
export function Catalog({ kind }: { kind: "products" | "posts" }) {
  return kind === "products" ? (
    <ProductsCatalog />
  ) : (
    <ExistingCatalog kind={kind} />
  );
}
function ExistingCatalog({ kind }: { kind: "products" | "posts" }) {
  const { rows, error, loading, stale, retry } = usePublicContent(kind);
  if (betaRelease && kind === "posts")
    return (
      <section className="page postsPage">
        <PostsHeading />
        <PostsEmpty beta />
        <PostsShortcuts />
      </section>
    );
  if (betaRelease)
    return (
      <section className="page">
        <h1>{kind === "products" ? "Sản phẩm tham khảo" : "Bài viết"}</h1>
        <div className="emptyState">
          <h2>
            {kind === "products"
              ? "Danh mục đang được cập nhật"
              : "Bài viết đang được cập nhật"}
          </h2>
          <p>Nội dung sẽ xuất hiện tại đây khi được xuất bản.</p>
          <Link to="/request">Xem yêu cầu mua hộ</Link>
        </div>
      </section>
    );
  return (
    <section className={kind === "posts" ? "page postsPage" : "page"}>
      {kind === "posts" ? (
        <PostsHeading />
      ) : (
        <>
          <h1>Sản phẩm tham khảo</h1>
          <p>
            Tìm món bạn thích. Nhân viên xác minh giá và khả năng mua trước khi
            báo giá.
          </p>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button type="button" className="textbutton" onClick={retry}>
            Tải lại
          </button>
        </p>
      )}
      {stale && rows.length > 0 && (
        <p className="smallNote" role="status">
          Đang hiển thị nội dung lần tải trước; chờ cập nhật.
        </p>
      )}
      {loading ? (
        <div className="catalogLoading" role="status">
          <span>Đang tải nội dung…</span>
          <div className="catalogGrid" aria-hidden="true">
            {[0, 1, 2].map((n) => (
              <div className="catalogSkeleton" key={n}>
                <div />
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>
      ) : rows.length ? (
        <div className="catalogGrid">
          {rows.map((r) => (
            <article className="productCard" key={r.id}>
              <Link
                className="productArt"
                to={`/${kind}/${r.slug}`}
                tabIndex={-1}
                aria-hidden="true"
              >
                {r.mediaId ? (
                  <img
                    src={`/media/${r.mediaId}`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width="640"
                    height="480"
                  />
                ) : (
                  <span className="productMonogram">
                    {r.market ?? (kind === "posts" ? "Go" : "↗")}
                  </span>
                )}
              </Link>
              <div className="productBody">
                {r.category && (
                  <span className="productCategory">{r.category}</span>
                )}
                <h2>
                  <Link to={`/${kind}/${r.slug}`}>{r.title}</Link>
                </h2>
                <p>{r.body.slice(0, 240)}</p>
                {r.referencePrice !== undefined && (
                  <p>
                    Giá tham khảo: {r.referencePrice.toLocaleString("vi-VN")} ₫
                    · kiểm tra{" "}
                    {r.priceCheckedAt
                      ? new Date(r.priceCheckedAt).toLocaleDateString("vi-VN")
                      : "Chưa có thời điểm"}
                  </p>
                )}
                <Link
                  className="productAction"
                  to={kind === "products" ? "/request" : `/${kind}/${r.slug}`}
                >
                  {kind === "products" ? "Gửi yêu cầu mua hộ" : "Đọc bài viết"}
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : kind === "posts" ? (
        <PostsEmpty failed={Boolean(error)} />
      ) : (
        <div className="empty">
          <h2>
            {error ? "Nội dung chưa tải được" : "Chưa có nội dung đã xuất bản"}
          </h2>
          <p>Bạn vẫn có thể gửi tên hoặc link món hàng muốn mua.</p>
          <Link to="/request">Gửi yêu cầu mua hộ</Link>
        </div>
      )}
      {kind === "posts" && <PostsShortcuts />}
    </section>
  );
}
export function ContentDetail({ kind }: { kind: "products" | "posts" }) {
  const { slug } = useParams(),
    [row, setRow] = useState<ContentRow | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setRow(null);
    setLoaded(false);
    setError("");
    if (
      !slug ||
      !(kind === "posts" ? /^[a-z0-9-]{1,100}$/ : /^[a-z0-9-]{2,100}$/).test(
        slug,
      )
    ) {
      setLoaded(true);
      return;
    }
    if (!db) {
      setLoaded(true);
      return;
    }
    let legacy: ContentRow | null = null,
      studio: ContentRow | null = null,
      ready = 0,
      active = true;
    const sources = kind === "posts" ? ["posts", "blogPublished"] : [kind];
    const stops = sources.map((source, index) =>
      onSnapshot(
        query(
          collection(db!, source),
          where("status", "==", "published"),
          where("slug", "==", slug),
          limit(1),
        ),
        (snapshot) => {
          if (!active) return;
          const value = snapshot.docs[0];
          const row = value ? contentRow(value.data(), value.id) : null;
          if (index === 0) legacy = row;
          else studio = row;
          ready |= 1 << index;
          if (ready === (1 << sources.length) - 1) {
            setRow(studio ?? legacy);
            setLoaded(true);
          }
        },
        () => {
          if (active) {
            setRow(null);
            setLoaded(true);
            setError("Chưa tải được nội dung.");
          }
        },
      ),
    );
    return () => {
      active = false;
      stops.forEach((stop) => stop());
    };
  }, [kind, slug]);
  useEffect(() => {
    const old = document.title;
    if (row) document.title = `${row.title} · SatsunicGo`;
    return () => {
      document.title = old;
    };
  }, [row]);
  return (
    <section className={kind === "products" ? "page productDetail" : "page"}>
      <Link to={`/${kind}`}>Quay lại danh sách</Link>
      {row && kind === "products" ? (
        <ProductDetails row={row} />
      ) : row ? (
        <article>
          <h1>{row.title}</h1>
          {row.richBody && row.summary && <p>{row.summary}</p>}
          {row.richBody && row.author && (
            <div className="articleAuthor027">
              {authorImage(row) && (
                <img
                  src={authorImage(row)}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              <span>{row.author}</span>
              {row.category && <span>· {row.category}</span>}
              {Number.isSafeInteger(row.readingMinutes) &&
                Number(row.readingMinutes) > 0 && (
                  <span>· {row.readingMinutes} phút đọc</span>
                )}
            </div>
          )}
          {row.mediaId && (
            <img
              src={`/media/${row.mediaId}`}
              alt={row.mediaAlt ?? "Ảnh minh họa nội dung"}
              loading="lazy"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          )}
          {row.richBody ? (
            <Suspense fallback={<p role="status">Đang mở bài viết…</p>}>
              <RichArticle body={row.richBody} />
            </Suspense>
          ) : (
            String(row.body ?? "")
              .split("\n\n")
              .map((p, i) => (
                <p key={i} style={{ whiteSpace: "pre-wrap" }}>
                  {p}
                </p>
              ))
          )}
          {row.richBody &&
            Array.isArray(row.sources) &&
            row.sources.length > 0 && (
              <section aria-label="Nguồn tham khảo">
                <h2>Nguồn tham khảo</h2>
                <ul>
                  {row.sources
                    .filter((source) => {
                      try {
                        const u = new URL(source.url);
                        return (
                          ["http:", "https:"].includes(u.protocol) &&
                          !u.username &&
                          !u.password
                        );
                      } catch {
                        return false;
                      }
                    })
                    .map((source, index) => (
                      <li key={index}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                </ul>
              </section>
            )}
          {row.richBody && (
            <Suspense fallback={<p role="status">Đang mở bình luận…</p>}>
              <BlogComments key={row.id} postId={row.id} />
            </Suspense>
          )}
          {row.referencePrice !== undefined && (
            <p>
              Giá tham khảo: {row.referencePrice.toLocaleString("vi-VN")} ₫ ·{" "}
              {row.priceCheckedAt
                ? new Date(row.priceCheckedAt).toLocaleString("vi-VN")
                : "Chưa có thời điểm xác minh"}
              . Nhân viên xác minh lại trước khi báo giá.
            </p>
          )}
          <Link to="/request">Gửi yêu cầu mua hộ</Link>
        </article>
      ) : (
        <p>
          {loaded
            ? "Không có nội dung đã xuất bản tại địa chỉ này."
            : "Đang tải nội dung…"}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
