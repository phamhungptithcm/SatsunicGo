import React, { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { OperationsDetails } from "../../../../src/features/operations/OperationsDetails";
import { fixture } from "./fixture-service";
import "../../../../src/styles/global.css";
import "../../../../src/styles/public-ux.css";
import "../../../../src/features/crm/Workspace.css";
import "../../../../src/features/crm/crm-ux028.css";
import "./fixture.css";

function App() {
  useSyncExternalStore(fixture.subscribe, fixture.snapshot);
  return <>
    <aside className="fixtureBar" aria-label="Fixture controls">
      <p>QA component proxy · Dữ liệu giả trong RAM · Không có đăng nhập, MFA hay backend thật</p>
      <div className="fixtureControls">
        <button onClick={() => fixture.choose("success")}>Người nhận giả</button>
        <button onClick={() => fixture.choose("long")}>Địa chỉ dài</button>
        <button onClick={() => fixture.choose("missing")}>Không có người nhận</button>
        <button onClick={() => fixture.choose("error")}>Lỗi tải</button>
        <button onClick={() => fixture.choose("hold")}>Giữ phản hồi</button>
        <button onClick={() => fixture.nextResponseSuccess()}>Lần kế tiếp thành công</button>
        <button onClick={() => fixture.replaceOrder()}>Đổi đơn mới</button>
        <button disabled={!fixture.pendingCount()} onClick={() => fixture.resolveOldest()}>Trả phản hồi cũ</button>
        <output aria-label="Fixture current order">{fixture.orderId()}</output>
        <output aria-label="Fixture pending responses">{fixture.pendingCount()}</output>
      </div>
    </aside>
    <section className="workspaceShell">
      <aside className="workspaceSidebar" inert aria-hidden="true">Khung CRM minh họa</aside>
      <div className="workspaceMain"><div className="workspaceContent">
        <section className="crmWorkbench028">
          <div className="workColumns" data-detail-open="true">
            <div className="crmList" inert aria-hidden="true" />
            <div className="panel crmItem crmWorkbenchDetail028" id="crm-under-test">
              <h2 className="crmItemTitle">Đơn giả · {fixture.orderId()}</h2>
              <OperationsDetails key={fixture.key()} orderId={fixture.orderId()} />
            </div>
          </div>
        </section>
      </div></div>
    </section>
    <details className="fixtureTrace" open>
      <summary>Fixture trace · Không chứa thông tin người nhận</summary>
      <ol aria-label="Fixture calls">{fixture.calls().map(call => <li key={call.sequence}>
        {call.sequence} · {call.orderId} · {call.mode} · {call.status}
      </li>)}</ol>
    </details>
  </>;
}
createRoot(document.getElementById("crmFixtureRoot")!).render(<App />);
