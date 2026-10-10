import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PurchasePaymentMethods } from "../../../src/features/cart/purchase-payment-methods";
import { availablePurchasePaymentMethods } from "../../../src/features/cart/purchase-payment-selection";
import "../../../src/features/cart/purchase-checkout.css";

// UI proxy only: the real selector/CSS, synthetic overview surroundings, no API.
function Fixture() {
  const [scenario, setScenario] = useState("ready");
  const [confirmed, setConfirmed] = useState(false);
  const enabledMethods = availablePurchasePaymentMethods(
    scenario === "missing"
      ? undefined
      : {
          provider:
            scenario === "unavailable" ? "unavailable" : "sepay_sandbox",
          methods: { BANK_TRANSFER: { available: true } },
        },
  );
  const busy = scenario === "busy";
  return (
    <>
      <div className="fixtureControls">
        <label htmlFor="fixture-scenario">
          Tình huống kiểm thử
          <select
            id="fixture-scenario"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              setConfirmed(false);
            }}
          >
            <option value="ready">QR sẵn sàng</option>
            <option value="missing">Chưa tải được cấu hình</option>
            <option value="unavailable">Chưa có phương thức khả dụng</option>
            <option value="busy">Đang gửi thanh toán</option>
            <option value="balance">Khoản trả thêm</option>
            <option value="large">Cỡ chữ phương thức 200%</option>
          </select>
        </label>
        <p>
          Bản kiểm tra UI · dùng component thật và dữ liệu minh họa, không kết
          nối SePay hoặc tạo giao dịch.
        </p>
      </div>
      <main
        className={`purchaseCheckout${scenario === "large" ? " fixtureTextLarge" : ""}`}
      >
        <div className="fixtureBrand">
          Satsunic<span>Go</span>
        </div>
        <header className="purchaseHeader">
          <h1>
            {scenario === "balance"
              ? "Duyệt khoản trả thêm"
              : "Tổng quan đơn hàng"}
          </h1>
          <p>Kiểm tra món, địa chỉ và số tiền trước khi thanh toán.</p>
        </header>
        <nav className="purchaseSteps" aria-label="Các bước hoàn tất đơn">
          {["Nhận hàng", "Tổng quan", "Thanh toán"].map((label, index) => (
            <div
              key={label}
              className={
                index === 0 ? "isComplete" : index === 1 ? "isCurrent" : ""
              }
              aria-current={index === 1 ? "step" : undefined}
            >
              <span aria-hidden="true">{index === 0 ? "✓" : index + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </nav>
        <div className="purchaseGrid">
          <section className="purchaseCard purchaseReview">
            <div className="purchaseSectionHeading">
              <h2>
                {scenario === "balance" ? "Món liên quan" : "Món đã chọn"}
              </h2>
              <small>2 dòng · 3 món</small>
            </div>
            <div className="purchaseItem">
              <span className="fixtureThumbnail" aria-hidden="true">
                ◉
              </span>
              <div>
                <strong>Tai nghe không dây</strong>
                <small>2 sản phẩm · Cần tìm mua</small>
              </div>
              <strong>3.045.000 ₫</strong>
            </div>
            <div className="purchaseItem">
              <span className="fixtureThumbnail" aria-hidden="true">
                ◉
              </span>
              <div>
                <strong>Tai nghe không dây · phiên bản niêm yết</strong>
                <small>1 sản phẩm · Giá niêm yết</small>
              </div>
              <strong>1.650.000 ₫</strong>
            </div>
            <div className="purchaseDelivery">
              <h3>Giao đến</h3>
              <p>
                Khách hàng minh họa · 0900000000
                <br />
                Số 10, đường mẫu, Phường Bến Thành, TP. Hồ Chí Minh, Việt Nam
              </p>
            </div>
            <PurchasePaymentMethods
              value={enabledMethods[0] ?? null}
              enabledMethods={enabledMethods}
              disabled={busy}
              onChange={() => setConfirmed(false)}
            />
            <p className="purchaseTerms">
              Giá niêm yết giữ trọn gói. Món cần tìm mua có thể phát sinh giá và
              cước; bạn duyệt khoản trả thêm trước khi gửi.
            </p>
          </section>
          <aside className="purchaseCard purchaseSummary">
            <h2>Chi tiết thanh toán</h2>
            <div className="purchaseRow">
              <span>
                {scenario === "balance"
                  ? "Đã thanh toán trước đó"
                  : "Sản phẩm niêm yết"}
              </span>
              <strong>
                {scenario === "balance" ? "4.695.000" : "1.650.000"} ₫
              </strong>
            </div>
            <div className="purchaseRow">
              <span>
                {scenario === "balance"
                  ? "Khoản cần trả thêm"
                  : "Giá hàng cần tìm mua"}
              </span>
              <strong>
                {scenario === "balance" ? "255.000" : "2.900.000"} ₫
              </strong>
            </div>
            {scenario !== "balance" && (
              <div className="purchaseRow">
                <span>Phí mua hộ</span>
                <strong>145.000 ₫</strong>
              </div>
            )}
            <div className="purchaseTotal">
              <span>
                {scenario === "balance"
                  ? "Thanh toán thêm"
                  : "Thanh toán ban đầu"}
              </span>
              <p>{scenario === "balance" ? "255.000" : "4.695.000"} ₫</p>
            </div>
            <div className="purchaseConfirm">
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  Tôi đã kiểm tra món, địa chỉ và số tiền cần thanh toán.
                </span>
              </label>
              <div className="purchaseActions">
                <button
                  type="button"
                  className="primary"
                  disabled={!confirmed || !enabledMethods.length || busy}
                >
                  {busy ? "Đang xử lý…" : "Xác nhận & thanh toán"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
