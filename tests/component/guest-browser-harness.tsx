import axe from "guest-qa-axe";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Ask } from "../../src/features/ask/Ask";
import { evidence, change } from "./guest-browser-state";
import "../../src/styles/global.css";
function Harness() {
  return (
    <MemoryRouter>
      <main style={{ padding: 24 }}>
        <h1>Ask · kiểm thử dữ liệu giả</h1>
        <p>
          SDK/auth giả; giao diện Ask, renderer và deadline thật. Không kết nối
          đơn thật.
        </p>
        <label>
          Phản hồi SDK{" "}
          <select
            onChange={(event) => {
              evidence.scenario = event.target.value;
              change(event.target.value === "owner" ? "synthetic-owner" : null);
            }}
            defaultValue="success"
          >
            {[
              "success",
              "owner",
              "offline",
              "timeout",
              "auth-ABA",
              "null-error",
              "tampered",
              "delayed",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <p>Mã thử: SGT-{"a".repeat(64)}</p>
        <button onClick={() => location.reload()}>Reset fixture</button>
        <output id="qa-evidence" />
      </main>
      <Ask />
    </MemoryRouter>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
let lastScan = "";
let scanning = false;
let accessibility: unknown = "waiting";
setInterval(() => {
  const log = document.querySelector('[role="log"]');
  const modal = document.querySelector("dialog[open]");
  const scanKey = `${log?.textContent}:${window.innerWidth}`;
  const moving = modal
    ?.getAnimations({ subtree: true })
    .some((animation) => animation.playState === "running");
  if (
    modal &&
    log?.textContent &&
    lastScan !== scanKey &&
    !moving &&
    !scanning
  ) {
    lastScan = scanKey;
    scanning = true;
    void axe
      .run(modal, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      })
      .then((result) => {
        accessibility = {
          violations: result.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes,
          })),
          incomplete: result.incomplete.map((v) => v.id),
        };
      })
      .finally(() => {
        scanning = false;
      });
  }
  const safe = !/PRIVATE_CANARY|SGT-[a-f0-9]{64}/.test(log?.innerHTML || "");
  const element = document.getElementById("qa-evidence");
  if (element)
    element.textContent = JSON.stringify({
      ...evidence,
      safeDOM: safe,
      accessibility,
    });
}, 100);
