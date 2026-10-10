import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { OrderTracking } from "../../src/features/ask/OrderTracking";
import type { CustomerOrderTracking } from "../../packages/domain/order-tracking";
import "../../src/styles/global.css";
import "./ORDER-TRACKING-IMPLEMENTED-20261009.css";
const at = (date: string) => Date.parse(date + "+07:00");
const now = at("2026-10-09T10:00:00");
const fixture: CustomerOrderTracking = {
  orderId: "SG-261009-024",
  stage: "IN_TRANSIT",
  purchaseKind: "custom",
  upfrontPayment: true,
  version: 8,
  observedAt: now,
  onHold: false,
  timelinePartial: false,
  shipmentsPartial: false,
  timeline: [
    { action: "verifyTransfer", createdAt: at("2026-10-04T09:30:00") },
    { action: "recordPurchase", createdAt: at("2026-10-05T14:05:00") },
    { action: "receive", createdAt: at("2026-10-07T11:20:00") },
    { action: "pack", createdAt: at("2026-10-08T16:40:00") },
    { action: "finalize", createdAt: at("2026-10-08T17:10:00") },
    { action: "dispatch", createdAt: at("2026-10-09T09:15:00") },
  ],
  shipments: [
    {
      id: "SG-P024",
      state: "in_transit",
      route: "Nhật Bản → Việt Nam",
      updatedAt: at("2026-10-09T09:15:00"),
      deliveryEstimate: {
        source: "staff",
        startAt: at("2026-10-12T08:00:00"),
        endAt: at("2026-10-15T18:00:00"),
        recordedAt: at("2026-10-09T09:15:00"),
        freshness: "current",
      },
    },
  ],
  estimate: {
    source: "staff_aggregate",
    startAt: at("2026-10-12T08:00:00"),
    endAt: at("2026-10-15T18:00:00"),
    oldestRecordedAt: at("2026-10-09T09:15:00"),
    latestRecordedAt: at("2026-10-09T09:15:00"),
  },
};
function Demo() {
  const [scenario, setScenario] = useState("transit"),
    [language, setLanguage] = useState<"vi" | "en">("vi");
  const tracking: CustomerOrderTracking = {
    ...fixture,
    ...(
      {
        warehouse: {
          stage: "ORIGIN_RECEIVED",
          estimate: null,
          shipments: [],
          timeline: fixture.timeline.slice(0, 3),
        },
        unknown: { estimate: null, timeline: [] },
        hold: { onHold: true, estimate: null },
        partial: {
          shipmentsPartial: true,
          timelinePartial: true,
          estimate: null,
        },
        failed: {
          estimate: null,
          shipments: [{ ...fixture.shipments[0], state: "failed" }],
        },
        returned: {
          estimate: null,
          shipments: [{ ...fixture.shipments[0], state: "returned" }],
        },
        delivered: {
          stage: "DELIVERED",
          estimate: null,
          timeline: [
            ...fixture.timeline,
            { action: "track", createdAt: at("2026-10-09T09:45:00") },
          ],
          shipments: [{ ...fixture.shipments[0], state: "delivered" }],
        },
        cancelled: {
          stage: "CANCELLED",
          estimate: null,
          timeline: [
            { action: "cancelRequest", createdAt: at("2026-10-09T09:15:00") },
          ],
          shipments: [],
        },
        catalog: { purchaseKind: "catalog", upfrontPayment: false },
        quoted: {
          stage: "QUOTED",
          upfrontPayment: false,
          estimate: null,
          shipments: [],
          timeline: [
            { action: "submitRequest", createdAt: at("2026-10-04T09:30:00") },
            { action: "issueQuote", createdAt: at("2026-10-05T14:05:00") },
          ],
        },
      } as Record<string, Partial<CustomerOrderTracking>>
    )[scenario],
  };
  return (
    <MemoryRouter>
      <div className="implementation-demo">
        <header className="demo-brand">
          <b>SatsunicGo</b>
          <span>Component thật · Dữ liệu minh họa</span>
        </header>
        <nav className="demo-controls" aria-label="Kiểm tra giao diện">
          <label>
            Trạng thái{" "}
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
            >
              <option value="transit">Đang vận chuyển</option>
              <option value="warehouse">Tại kho nguồn</option>
              <option value="unknown">Thiếu thời điểm / ETA</option>
              <option value="hold">Tạm giữ</option>
              <option value="partial">Dữ liệu thiếu</option>
              <option value="failed">Giao thất bại</option>
              <option value="returned">Trả lại</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
              <option value="catalog">Giá niêm yết</option>
              <option value="quoted">Chờ báo giá</option>
            </select>
          </label>
          <label>
            Ngôn ngữ{" "}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "vi" | "en")}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
        </nav>
        <main>
          <h1>Theo dõi đơn hàng</h1>
          <OrderTracking tracking={tracking} language={language} />
        </main>
      </div>
    </MemoryRouter>
  );
}
createRoot(document.getElementById("root")!).render(<Demo />);
