import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Security } from "../../../../src/features/auth/Security";
import { AccountRail } from "../../../../src/features/account/AccountRail";
import { user } from "./mock";
import "../../../../src/styles/account.css";
import "../../../../src/styles/security.css";
import "../../../../src/styles/global.css";
const root = createRoot(document.getElementById("root")!);
function render(current: typeof user | null = user) {
  root.render(
    <BrowserRouter>
      <section className="accountWorkspace securityWorkspace">
        <AccountRail active="security" />
        <div className="accountPage">
          <Security user={current as never} />
        </div>
      </section>
    </BrowserRouter>,
  );
}
render();
Object.assign(window, {
  switchUser: () => render(null),
  refresh: () => render(),
});
