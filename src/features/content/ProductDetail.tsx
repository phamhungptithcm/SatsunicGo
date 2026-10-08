import { useLocation } from "react-router-dom";
import {
  analyticsNavigation,
  productRouteMatches,
  trackProduct,
} from "../../shared/analytics";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ContentRow } from "../../shared/public-content";
import { catalogProductSchema } from "../../../packages/domain/catalog-checkout";
import {
  productSourceUrl,
  usageLines,
} from "../../../packages/domain/product-information";
import { ProductReviews } from "./ProductReviews";
import "./product-detail080.css";
import { AddToCart } from "../cart/AddToCart";
export function ProductDetails({ row }: { row: ContentRow }) {
  const location = useLocation();
  const currentProduct = productRouteMatches(location.pathname, row.slug);
  useEffect(() => {
    if (!currentProduct) return;
    trackProduct(
      row.id,
      "product_view",
      analyticsNavigation(location) + ":" + row.id,
    );
  }, [row.id, currentProduct, location]);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [row.mediaId]);
  const source = (
    { US: "Mỹ", JP: "Nhật Bản", KR: "Hàn Quốc" } as Record<string, string>
  )[row.market ?? ""];
  const orderable = catalogProductSchema.safeParse(row).success;
  const url = row.sourceUrl || row.referenceUrl;
  const safeUrl =
    url && productSourceUrl.safeParse(url).success ? url : undefined;
  const steps = usageLines(row);
  const hasDetails = Boolean(
    row.body.trim() || row.origin?.trim() || row.functions?.trim(),
  );
  const brandPrefix = row.brand?.trim();
  const displayTitle =
    brandPrefix &&
    row.title
      .toLocaleLowerCase("vi")
      .startsWith(`${brandPrefix.toLocaleLowerCase("vi")} `)
      ? row.title.slice(brandPrefix.length).trim() || row.title
      : row.title;
  return (
    <article
      className="sgProductDetail"
      data-analytics-product={row.id}
      data-analytics-product-view={currentProduct ? row.id : undefined}
      data-analytics-product-slug={row.slug}
    >
      <div className="sgProductHero">
        <div className="sgProductImage">
          {row.mediaId && !failed ? (
            <img
              src={`/media/${row.mediaId}`}
              alt={row.mediaAlt || row.title}
              onError={() => setFailed(true)}
              decoding="async"
            />
          ) : (
            <span className="sgProductImageMissing">
              {failed ? "Chưa tải được ảnh" : "Chưa có ảnh"}
            </span>
          )}
        </div>
        <div className="sgProductOverview">
          {row.brand && <p className="sgProductBrand">{row.brand}</p>}
          <h1 aria-label={row.title}>{displayTitle}</h1>
          {row.productSummary && (
            <p className="sgProductLead">{row.productSummary}</p>
          )}
          <dl className="sgProductFacts">
            <div>
              <dt>Xuất xứ</dt>
              <dd>{row.manufacturingOrigin || "Chưa xác minh"}</dd>
            </div>
            {source && (
              <div>
                <dt>Quốc gia mua hàng</dt>
                <dd>{source}</dd>
              </div>
            )}
            <div>
              <dt>Nơi dự kiến mua</dt>
              <dd>{row.retailer || "Chưa xác minh"}</dd>
            </div>
            {row.variants && (
              <div>
                <dt>Quy cách</dt>
                <dd>{row.variants}</dd>
              </div>
            )}
          </dl>
          {safeUrl && (
            <a
              className="sgProductSource"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Nguồn sản phẩm ↗
            </a>
          )}
          <div className="sgProductPurchase">
            {orderable ? (
              <>
                <p className="sgProductPrice">
                  {row.listedPrice!.toLocaleString("vi-VN")} ₫{" "}
                  <small>/ sản phẩm</small>
                </p>
                <Link className="primary" to={`/products/${row.slug}/checkout`}>
                  Chọn mua và thanh toán
                </Link>
                <AddToCart key={row.id} product={row} />
                <p className="sgProductHint">
                  Giá trọn gói, thanh toán toàn bộ.
                </p>
              </>
            ) : (
              <>
                <p className="sgProductPrice">Chờ báo giá</p>
                <Link className="primary" to="/request">
                  Yêu cầu mua hộ
                </Link>
                <p className="sgProductHint">
                  Nhận báo giá trước khi thanh toán.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {(hasDetails || steps.length > 0) && (
        <div className="sgProductInformation">
          {hasDetails && (
            <section>
              <h2>Chi tiết sản phẩm</h2>
              {row.origin && <p className="sgProductBody">{row.origin}</p>}
              <div className="sgProductBody">
                {row.body
                  .split(/\n\n/)
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
              {row.functions && (
                <>
                  <h3>Công dụng</h3>
                  <p className="sgProductBody">{row.functions}</p>
                </>
              )}
            </section>
          )}
          {steps.length > 0 && (
            <section>
              <h2>Hướng dẫn sử dụng</h2>
              <ul className="sgProductUsage">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
      <ProductReviews key={row.id} productId={row.id} />
    </article>
  );
}
