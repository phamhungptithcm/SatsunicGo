import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { CatalogCard } from "../../../../src/features/content/CatalogCard";
import { ProductDetails } from "../../../../src/features/content/ProductDetail";
import { useAskImages } from "../../../../src/features/ask/ImageIntake";
import styles from "../../../../src/features/ask/Ask.module.css";
import "../../../../src/styles/global.css";
import "../../../../src/styles/public-ux.css";
import "../../../../src/features/content/products-catalog.css";
import "../../../../src/features/cart/cart.css";
import "../../../../src/features/cart/purchase-checkout.css";
import "./fixture.css";

const cases = [
  "portrait",
  "landscape",
  "square",
  "transparent",
  "small",
  "broken",
  "absent",
];
const asset = (name: string) => `./assets/${name}`;
const mediaId = (name: string) =>
  `../tests/browser/fixtures/product-image-framing/assets/${name}`;

function AskPhotoFixture() {
  const images = useAskImages({ busy: false, vi: true });
  return (
    <section id="askFixture" aria-label="Ask ảnh đã chọn">
      <h2>Ask — chọn và gỡ ảnh</h2>
      <div className={styles.composer}>
        <label>
          Chọn ảnh sản phẩm
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => images.add([...(e.target.files ?? [])])}
          />
        </label>
        {!!images.photos.length && (
          <div className={styles.composerPhotos}>
            {images.photos.map((photo) => (
              <div key={photo.id}>
                <img src={photo.preview} alt="Ảnh sản phẩm đã chọn" />
                <button
                  type="button"
                  aria-label="Gỡ ảnh"
                  onClick={() => images.remove(photo.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {images.error && <p role="alert">{images.error}</p>}
      <p>Chỉ chọn ảnh cục bộ; không gửi cho AI hoặc tạo đơn.</p>
    </section>
  );
}

function Fixture() {
  const [selected, setSelected] = useState("portrait");
  const [zoom, setZoom] = useState("1");
  const id = selected === "absent" ? undefined : mediaId(`${selected}.png`);
  const privateSource = cases.slice(0, 4).includes(selected)
    ? asset(`${selected}-private.jpg`)
    : selected === "absent"
      ? undefined
      : asset(`${selected}.png`);
  return (
    <MemoryRouter initialEntries={["/image-fixture"]}>
      <main className="imageFixture" style={{ zoom }}>
        <header>
          <strong>
            Satsunic<span>Go</span>
          </strong>
          <p>Kiểm thử component và CSS thật · local 5207</p>
        </header>
        <h1>Ảnh sản phẩm</h1>
        <label className="casePicker">
          Thu phóng bản kiểm thử
          <select value={zoom} onChange={(e) => setZoom(e.target.value)}>
            <option value="1">100%</option>
            <option value="2">200%</option>
          </select>
        </label>
        <label className="casePicker">
          Trường hợp ảnh
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {cases.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <section
          className="productsPage products074"
          aria-label="Danh sách ảnh sản phẩm"
        >
          <div className="productsGrid">
            {[
              [
                "product-0.webp",
                "Paula's Choice SKIN BALANCING Invisible Finish Gel Moisturizer, 2 fl oz",
              ],
              ["product-1.webp", "Eagle Brand Medicated Oil, 36 ml"],
              [
                "product-2.webp",
                "Sports Research Triple Strength Omega-3 Fish Oil, 150 Fish Softgels",
              ],
            ].map(([file, title]) => (
              <CatalogCard
                key={file}
                id={mediaId(file)}
                slug={file}
                title={title}
                alt={title}
                priority
              >
                <div className="productBody">
                  <p className="productCategory">Sản phẩm tham khảo · Mỹ</p>
                  <h2>{title}</h2>
                </div>
              </CatalogCard>
            ))}
            <CatalogCard
              id={id}
              slug="edge-test"
              title={`Ảnh ${selected}`}
              alt={`Ảnh ${selected}`}
              priority
            >
              <div className="productBody">
                <h2>Ảnh {selected}</h2>
              </div>
            </CatalogCard>
          </div>
        </section>
        <section
          className="page productDetail"
          aria-label="Chi tiết ảnh sản phẩm"
        >
          <ProductDetails
            row={{
              id: "image-framing-fixture",
              slug: "image-framing-fixture",
              title: `Sản phẩm ${selected}`,
              body: "",
              mediaId: id,
              mediaAlt: `Ảnh ${selected}`,
              status: "published",
              version: 1,
            }}
          />
        </section>
        <section className="cart107" aria-label="Ảnh giỏ hàng">
          <h2>Giỏ hàng — giữ nguyên bố cục</h2>
          <ul className="cartItems107">
            <li className="cartItem107">
              <div className="cartImage107">
                {id ? (
                  <img
                    src={asset(`${selected}.png`)}
                    alt={`Ảnh ${selected}`}
                    onLoad={(e) => {
                      e.currentTarget.hidden = false;
                    }}
                    onError={(e) => {
                      e.currentTarget.hidden = true;
                    }}
                  />
                ) : (
                  <span>◇</span>
                )}
              </div>
              <div className="cartItemBody107">
                <h2>Sản phẩm {selected}</h2>
                <p className="cartUnit107">
                  Ảnh mẫu trong khung giỏ hàng hiện tại
                </p>
              </div>
            </li>
          </ul>
        </section>
        <section
          className="purchaseCheckout"
          aria-label="Ảnh tổng quan thanh toán"
        >
          <h2>Tổng quan thanh toán</h2>
          <div className="purchaseItem">
            <span className="purchaseThumbnail" aria-hidden="true">
              ▧
              {privateSource && (
                <img
                  src={privateSource}
                  alt=""
                  width="44"
                  height="44"
                  onLoad={(e) => {
                    e.currentTarget.hidden = false;
                  }}
                  onError={(e) => {
                    e.currentTarget.hidden = true;
                  }}
                />
              )}
            </span>
            <strong>
              Sản phẩm {selected}
              <small>Thumbnail tạo bởi helper backend hiện tại</small>
            </strong>
            <strong>—</strong>
          </div>
        </section>
        <AskPhotoFixture />
      </main>
    </MemoryRouter>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
