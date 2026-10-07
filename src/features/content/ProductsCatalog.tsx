import { LoadingState } from "../../shared/Loading";
import { CampaignBanner } from "./CampaignBanner";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { catalogProductSchema } from "../../../packages/domain/catalog-checkout";
import { useCatalogPages } from "../../shared/public-content";
import "./products-catalog.css";

const markets = [["", "Tất cả"], ["US", "Mỹ"], ["JP", "Nhật Bản"], ["KR", "Hàn Quốc"]] as const;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
function CatalogIcon({ kind }: { kind: "search" | "bag" | "retry" }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "search" ? <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></> : kind === "retry" ? <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6.2A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.8" /></> : <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>}
  </svg>;
}
export function ProductsCatalog() {
  const { rows, error, loading, stale, retry, loadMore, hasMore } = useCatalogPages();
  const [search, setSearch] = useState("");
  const [market, setMarket] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const filtered = rows.filter((row) => (!market || row.market === market) && normalize(`${row.title} ${row.category ?? ""}`).includes(normalize(search)));
  const initialLoading = loading && !rows.length;
  const initialError = Boolean(error) && !rows.length;
  const filtering = Boolean(search || market);
  return <section className="page productsPage products074" aria-label="Sản phẩm">
    <div className="products074Toolbar">
      <div className="products074Search">
        <CatalogIcon kind="search" />
        <input ref={searchInput} type="search" aria-label="Tìm sản phẩm" placeholder="Tìm tên sản phẩm…" value={search} onChange={(event) => setSearch(event.target.value)} />
        {search && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => { setSearch(""); searchInput.current?.focus(); }}><span aria-hidden="true">×</span><span className="products074ClearLabel">Xóa tìm kiếm</span></button>}
      </div>
      <div className="products074Markets" role="group" aria-label="Lọc quốc gia mua hàng">
        {markets.map(([code, label]) => <button type="button" key={code} aria-pressed={market === code} onClick={() => setMarket(code)}>{label}</button>)}
      </div>
    </div>
    <CampaignBanner placement="products" />
    <div className="products074Results" aria-busy={loading}>
      {initialLoading ? <><LoadingState className="products074Loading">Đang tải sản phẩm…</LoadingState><div className="products074Skeletons" aria-hidden="true">{[0, 1, 2].map((id) => <div key={id}><span /><i /><i /></div>)}</div></> : initialError ? <div className="products074State" role="alert">
        <div className="products074StateIcon"><CatalogIcon kind="bag" /></div>
        <h2>Chưa tải được sản phẩm</h2>
        <p>Anh/chị kiểm tra kết nối rồi thử lại nhé.</p>
        <button type="button" className="products074Button" onClick={retry}><CatalogIcon kind="retry" />Tải lại</button>
      </div> : <>
        {error && <div className="products074Notice" role="alert"><span>Chưa tải được thêm sản phẩm.</span><button type="button" onClick={retry}>Thử lại</button></div>}
        {stale && rows.length > 0 && <p className="products074Note" role="status">Đang hiển thị sản phẩm từ lần tải trước.</p>}
        {filtered.length > 0 ? <div className="catalogGrid">
          {filtered.map((row) => {
            const available = catalogProductSchema.safeParse(row).success;
            return <article className="productCard" key={row.id}>
              <Link className="productImage" to={`/products/${row.slug}`} aria-label={`Xem ${row.title}`}>
                {row.mediaId ? <img src={`/media/${row.mediaId}`} alt={row.mediaAlt ?? row.title} loading="lazy" /> : <span className="productMonogram" aria-hidden="true"><CatalogIcon kind="bag" /></span>}
              </Link>
              <div className="productBody">
                <span className="productCategory">{[row.category, markets.find(([code]) => code && code === row.market)?.[1]].filter(Boolean).join(" · ")}</span>
                <h2><Link to={`/products/${row.slug}`}>{row.title}</Link></h2>
                <p className="products074Price">{available ? <>{row.listedPrice!.toLocaleString("vi-VN")} ₫ <span>trọn gói</span></> : "Chưa mở đặt mua"}</p>
                <div className="productAction"><Link to={`/products/${row.slug}`}>Chi tiết</Link>{available && <Link to={`/products/${row.slug}/checkout`}>Chọn mua <span aria-hidden="true">↗</span></Link>}</div>
              </div>
            </article>;
          })}
        </div> : !loading && <div className="products074State">
          <div className="products074StateIcon"><CatalogIcon kind={filtering ? "search" : "bag"} /></div>
          <h2>{filtering ? "Chưa có kết quả phù hợp" : "Danh mục đang được cập nhật"}</h2>
          <p>{filtering ? (hasMore ? "Anh/chị có thể đổi bộ lọc hoặc xem thêm sản phẩm." : "Anh/chị thử tên khác hoặc đổi bộ lọc nhé.") : "Anh/chị có thể gửi món muốn mua qua yêu cầu mua hộ."}</p>
          {filtering && <button type="button" className="products074Button" onClick={() => { setSearch(""); setMarket(""); searchInput.current?.focus(); }}>Xóa bộ lọc</button>}
        </div>}
        {loading && rows.length > 0 && <LoadingState className="products074Loading" overlay={false}>Đang tải thêm sản phẩm…</LoadingState>}
        {hasMore && rows.length > 0 && !error && <div className="products074Pagination">
          <button type="button" className="products074Button" disabled={loading} onClick={() => void loadMore()}>{loading ? "Đang tải…" : "Xem thêm sản phẩm"}</button>
        </div>}
        {filtering && hasMore && rows.length > 0 && <p className="products074Note products074Scope">Bộ lọc áp dụng cho các sản phẩm đã tải.</p>}
      </>}
    </div>
    <aside className="products074Request">
      <div><strong>Chưa có món anh/chị cần?</strong><p>Gửi yêu cầu để nhận báo giá và thanh toán hai đợt.</p></div>
      <Link to="/request">Yêu cầu mua hộ <span aria-hidden="true">↗</span></Link>
    </aside>
  </section>;
}
