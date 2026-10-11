import React, { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import type { User } from "firebase/auth";
import { Profile } from "../../../../src/features/profile/Profile";
import { AccountRail } from "../../../../src/features/account/AccountRail";
import {
  CheckoutNotificationChoices, NotificationLinkAction, NotificationPreferences, NotificationSaveStatus,
} from "../../../../src/features/notifications/NotificationPreferences";
import { useNotificationPreferences } from "../../../../src/features/notifications/use-notification-preferences";
import { fixture } from "./fixture-service";
import "../../../../src/features/profile/profile.css";
import "../../../../src/features/cart/purchase-checkout.css";
import "./fixture.css";

function CheckoutChoices({ user }: { user: User }) {
  const controller = useNotificationPreferences(user, "checkout");
  return <section className="purchaseCard recipientForm fixtureCheckout" aria-label="Checkout notification choices">
    <h1>Tùy chọn nhận tin</h1>
    <p className="fixtureDisclosure">CheckoutNotificationChoices thật; khung checkout được cô lập để không dùng giỏ hàng hay luồng thanh toán.</p>
    <CheckoutNotificationChoices controller={controller} />
    <div className="profileFormFooter"><button type="button" className="primary"
      disabled={!controller.view || !controller.dirty || controller.busy || controller.uncertain}
      onClick={() => void controller.save()}>Lưu tùy chọn</button></div>
    <NotificationSaveStatus controller={controller} />
  </section>;
}
function App() {
  useSyncExternalStore(fixture.subscribe, fixture.snapshot);
  const user = fixture.user() as User;
  const screen = new URLSearchParams(location.search).get("screen") || "profile";
  return <>
    <aside className="fixtureBar" aria-label="Fixture controls">
      <p>QA fixture · Dữ liệu minh họa trong RAM · Không gửi tin, không lưu tài khoản</p>
      <div className="fixtureControls">
        <button type="button" aria-pressed={fixture.owner() === "owner-A"} onClick={() => fixture.setOwner("owner-A")}>Fixture owner A</button>
        <button type="button" aria-pressed={fixture.owner() === "owner-B"} onClick={() => fixture.setOwner("owner-B")}>Fixture owner B</button>
        <button type="button" disabled={!fixture.pendingCount()} onClick={() => fixture.resolvePending()}>Resolve pending response</button>
        <output id="fixture-owner" aria-label="Fixture owner">{fixture.owner()}</output>
        <output id="fixture-pending" aria-label="Fixture pending responses">{fixture.pendingCount()} · {fixture.pendingOwner()}</output>
      </div>
    </aside>
    <main id="main">
      {screen === "checkout" ? <div className="accountPage"><CheckoutChoices user={user} /></div>
        : screen === "token" ? <div className="accountPage"><NotificationLinkAction /></div>
        : screen === "preferences" ? <div className="accountPage"><NotificationPreferences user={user} /></div>
        : <section className="accountWorkspace"><AccountRail active="profile" /><div className="accountPage"><Profile user={user} /></div></section>}
    </main>
    <details className="fixtureTrace" open>
      <summary>Fixture call trace · action / owner / operationId</summary>
      <ol id="fixture-call-trace" aria-label="Fixture call trace">{fixture.calls().map((call, index) =>
        <li key={index} data-action={call.action} data-owner={call.owner} data-operation-id={call.operationId}>
          {call.action} · {call.owner} · {call.operationId}
        </li>)}</ol>
    </details>
  </>;
}
createRoot(document.getElementById("emailContentRoot")!).render(<MemoryRouter><App /></MemoryRouter>);
