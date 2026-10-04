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
import { usePublicContent, type ContentRow } from "../../shared/public-content";
export function Catalog({ kind }: { kind: "products" | "posts" }) {
  const { rows, error, loading, stale, retry } = usePublicContent(kind);
  if (betaRelease)
    return (
      <section className="page">
        <h1>{kind === "products" ? "Sản phẩm tham khảo" : "Bài viết"}</h1>
        <div className="emptyState">
          <h2>
            {kind === "products"
              ? "Danh mục chưa mở trong beta"
              : "Bài viết chưa mở trong beta"}
          </h2>
          <p>
            Bản beta hiện dành cho kiểm tra giao diện. Nội dung sẽ được cập nhật
            khi hệ thống dữ liệu sẵn sàng.
          </p>
          <Link to="/request">Xem giao diện yêu cầu mua hộ</Link>
        </div>
      </section>
    );
  return (
    <section className="page">
      <h1>{kind === "products" ? "Sản phẩm tham khảo" : "Bài viết"}</h1>
      <p>
        {kind === "products"
          ? "Tìm món bạn thích. Nhân viên xác minh giá và khả năng mua trước khi báo giá."
          : "Thông tin mua hộ và những điều cần biết trước khi chọn hàng."}
      </p>
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
      ) : (
        <div className="empty">
          <h2>
            {error ? "Nội dung chưa tải được" : "Chưa có nội dung đã xuất bản"}
          </h2>
          <p>Bạn vẫn có thể gửi tên hoặc link món hàng muốn mua.</p>
          <Link to="/request">Gửi yêu cầu mua hộ</Link>
        </div>
      )}
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
    if (!slug || !/^[a-z0-9-]{2,100}$/.test(slug)) {
      setLoaded(true);
      return;
    }
    if (!db) {
      setLoaded(true);
      return;
    }
    return onSnapshot(
      query(
        collection(db, kind),
        where("status", "==", "published"),
        where("slug", "==", slug),
        limit(1),
      ),
      (s) => {
        setRow(
          s.docs.length
            ? ({ ...s.docs[0].data(), id: s.docs[0].id } as ContentRow)
            : null,
        );
        setLoaded(true);
      },
      () => {
        setLoaded(true);
        setError("Chưa tải được nội dung.");
      },
    );
  }, [kind, slug]);
  useEffect(() => {
    const old = document.title;
    if (row) document.title = `${row.title} · SatsunicGo`;
    return () => {
      document.title = old;
    };
  }, [row]);
  return (
    <section className="page">
      <Link to={`/${kind}`}>Quay lại danh sách</Link>
      {row ? (
        <article>
          <h1>{row.title}</h1>
          {row.mediaId && (
            <img
              src={`/media/${row.mediaId}`}
              alt={row.mediaAlt ?? "Ảnh minh họa nội dung"}
              loading="lazy"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          )}
          {row.body.split("\n\n").map((p, i) => (
            <p key={i} style={{ whiteSpace: "pre-wrap" }}>
              {p}
            </p>
          ))}
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
