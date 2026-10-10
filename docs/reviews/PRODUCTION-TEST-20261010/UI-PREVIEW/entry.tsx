import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Workbench, ActionForm } from "../../../../src/features/operations/Workbench";
import { TestOrderBadge } from "../../../../src/features/orders/TestOrderBadge";
import { OrderTools } from "../../../../src/features/orders/OrderTools";
import { Notifications } from "../../../../src/features/notifications/Notifications";
import type { Order } from "../../../../packages/domain";
import { fixtureRows, previewState, type Scenario } from "./synthetic-adapter";
import "../../../../src/styles/global.css";
import "../../../../src/features/crm/Workspace.css";
import "../../../../src/features/crm/crm-ux028.css";

const scenarios: [Scenario, string][] = [["mixed", "Đủ loại đơn"], ["test", "Chỉ có đơn test"], ["live", "Chỉ có đơn thật"], ["empty", "Trang trống"], ["error", "Lỗi tải"], ["loading", "Đang tải 3 giây"]];
function Preview() {
  const [scenario, setScenario] = useState<Scenario>("mixed");
  const [generation, setGeneration] = useState(0);
  const [showContext, setShowContext] = useState(false);
  return <>
    <aside className="previewControls" aria-label="Điều khiển kiểm tra UI">
      <strong>Preview · dữ liệu giả, chỉ đọc</strong>
      <span>Component/CSS của candidate. Không xác minh MFA, backend hay provider.</span>
      <label>Trạng thái <select value={scenario} onChange={(event) => {
        const next = event.target.value as Scenario;
        previewState.scenario = next;
        setScenario(next);
        setGeneration((value) => value + 1);
      }}>{scenarios.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button type="button" onClick={() => setShowContext(!showContext)} aria-expanded={showContext}>Ngữ cảnh marker / PDF</button>
    </aside>
    {showContext && <section className="previewContexts" aria-label="Ngữ cảnh tổng hợp, không phải màn hình tài khoản đầy đủ">
      <div className="order orderDetail"><div className="pageHeading"><h1>Áo thun · tên sản phẩm dài để kiểm tra xuống dòng</h1><span className="orderStatusGroup"><TestOrderBadge record={fixtureRows[0]} /><span className="statusTag">Đã xác nhận</span></span></div></div>
      <p>Góp ý test: <TestOrderBadge record={{ testMode: true }} label="Góp ý test" /></p>
      <ActionForm order={fixtureRows[3] as Order} roles={["OWNER"]} busy={false} submit={async () => { throw Error("Preview chỉ đọc"); }} />
      <MemoryRouter><OrderTools order={fixtureRows[0] as Order} showImages={false} section="history" /></MemoryRouter>
      <MemoryRouter><OrderTools order={fixtureRows[0] as Order} showImages={false} section="actions" /></MemoryRouter>
      <MemoryRouter><Notifications uid="preview-synthetic-owner" expanded /></MemoryRouter>
    </section>}
    <div className="workspaceShell previewShell"><main className="workspaceContent" aria-label="Danh sách đơn từ component thật">
      <MemoryRouter key={generation}><Workbench roles={["OWNER"]} /></MemoryRouter>
    </main></div>
  </>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
