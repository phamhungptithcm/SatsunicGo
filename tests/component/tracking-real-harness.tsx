import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { Shipping } from "../../src/features/shipping/Shipping";
import { AccountTracking } from "../../src/features/orders/AccountTracking";
import { Ask } from "../../src/features/ask/Ask";
import {
  role,
  auth,
  db,
  fixture,
  loginFixture,
  evidence,
  armShippingFault,
} from "./tracking-real-sdk";
import axe from "guest-qa-axe";
import "../../src/styles/global.css";
import "../../src/features/crm/Workspace.css";
function Harness() {
  const [ready, setReady] = useState(false),
    [version, setVersion] = useState(1),
    [error, setError] = useState("");
  useEffect(() => {
    void loginFixture()
      .then(() => setReady(true))
      .catch(() => setError("Fixture authentication failed"));
  }, []);
  useEffect(() => {
    if (!ready || role !== "owner") return;
    return onSnapshot(
      doc(db, "orders", fixture.orderId),
      (s) => setVersion(s.get("version")),
      () => setError("Fixture listener denied"),
    );
  }, [ready]);
  return (
    <MemoryRouter>
      <main
        className={role === "crm" ? "crmRoot" : undefined}
        style={
          role === "crm"
            ? undefined
            : { padding: 24, maxWidth: 1280, margin: "auto" }
        }
      >
        <h1>CRM → customer · owned emulator fixture</h1>
        <p>
          Real Firebase transport; synthetic identities; provider/analytics
          disabled. Role: {role}
        </p>
        <output id="qa-evidence" hidden />
        <button
          onClick={() => {
            Object.defineProperty(navigator, "onLine", {
              configurable: true,
              value: false,
            });
            window.dispatchEvent(new Event("offline"));
          }}
        >
          Simulate offline UI
        </button>
        <button
          onClick={() => {
            Object.defineProperty(navigator, "onLine", {
              configurable: true,
              value: true,
            });
            window.dispatchEvent(new Event("online"));
          }}
        >
          Restore online UI
        </button>
        {role === "crm" && (
          <>
            <button onClick={() => armShippingFault("before")}>
              QA abort before request
            </button>
            <button onClick={() => armShippingFault("after")}>
              QA abort response body
            </button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {ready ? (
          role === "crm" ? (
            <section className="workspaceShell">
              <aside
                className="workspaceSidebar"
                aria-label="CRM fixture sidebar"
              >
                <p>CRM fixture · vận chuyển</p>
              </aside>
              <div className="workspaceMain">
                <div className="workspaceContent">
                  <Shipping roles={["OWNER"]} />
                </div>
              </div>
            </section>
          ) : role === "owner" ? (
            <>
              <p>Order revision: {version}</p>
              <AccountTracking
                uid={auth.currentUser!.uid}
                orderId={fixture.orderId}
                version={version}
              />
            </>
          ) : (
            <p>Anonymous tracking only</p>
          )
        ) : (
          <p>Connecting…</p>
        )}
      </main>
      {ready && role !== "crm" && <Ask />}
    </MemoryRouter>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
let scanning = false,
  last = "",
  accessibility: unknown = "waiting";
setInterval(() => {
  const modal = document.querySelector("dialog[open]"),
    key = modal?.textContent + ":" + innerWidth;
  const moving = modal
    ?.getAnimations({ subtree: true })
    .some((a) => a.playState === "running");
  if (modal && !moving && !scanning && last !== key) {
    last = key;
    scanning = true;
    void axe
      .run(modal, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      })
      .then(
        (r) =>
          (accessibility = {
            violations: r.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
            })),
            incomplete: r.incomplete.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
                checks: n.any.map((c) => ({
                  id: c.id,
                  message: c.message,
                  data: c.data,
                })),
              })),
            })),
          }),
      )
      .finally(() => (scanning = false));
  }
  const out = document.getElementById("qa-evidence");
  if (out) out.textContent = JSON.stringify({ ...evidence, accessibility });
}, 250);
