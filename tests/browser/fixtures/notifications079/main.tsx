import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Notifications } from "../../../../src/features/notifications/Notifications";
import { AccountRail } from "../../../../src/features/account/AccountRail";
import "../../../../src/styles/global.css";
import "../../../../src/styles/account.css";
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <section className="accountWorkspace">
      <AccountRail active="notifications" />
      <div className="accountPage">
        <header className="pageHeading">
          <div>
            <h1>Thông báo</h1>
            <p>Cập nhật mới từ SatsunicGo.</p>
          </div>
        </header>
        <Notifications uid="synthetic-owner" expanded />
      </div>
    </section>
  </BrowserRouter>,
);
