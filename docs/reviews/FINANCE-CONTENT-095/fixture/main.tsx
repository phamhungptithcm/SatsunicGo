import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Documents } from "../../../../src/features/invoices/Documents";
import { Refunds } from "../../../../src/features/payments/Refunds";
import { Finance } from "../../../../src/features/payments/Finance";
import { Campaigns } from "../../../../src/features/content/Campaigns";
import "../../../../src/styles/global.css";
import "../../../../src/features/crm/Workspace.css";
const page = new URLSearchParams(location.search).get("page") ?? "invoices";
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <div className="workspaceShell" style={{ display: "block" }}>
      <div
        className="workspaceContent"
        style={{ margin: 0, padding: "24px", width: "100%" }}
      >
        <p style={{ fontSize: 12, color: "#53627b" }}>
          LOCAL_SYNTHETIC · Kiểm thử giao diện · Không gửi lệnh tài chính hoặc
          xuất bản
        </p>
        {page === "invoices" ? (
          <Documents staff />
        ) : page === "refunds" ? (
          <Refunds />
        ) : page === "finance" ? (
          <Finance />
        ) : (
          <Campaigns />
        )}
      </div>
    </div>
  </BrowserRouter>,
);
