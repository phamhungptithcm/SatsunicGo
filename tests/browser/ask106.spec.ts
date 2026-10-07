import { test, expect } from "@playwright/test";
test("owner pilot preserves confirmation, unknown money and duplicate/retry semantics", async ({
  page,
}) => {
  const component = await (
    await page.request.get("/src/features/settings/AskPilot.tsx")
  ).text();
  const entry = await (await page.request.get("/src/app/main.tsx")).text();
  const react = component.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1],
    root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  expect(react && root).toBeTruthy();
  let writes = 0;
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `let enabled=false,version=null;export async function callService(name,data){if(name==='readOwnerConfiguration')return {askPilot:{enabled,version,ready:true,maxBudgetVnd:10000,reservedVnd:0,expiresAt:null}};if(name==='workspaceCommand'){await fetch('/ask106-write',{method:'POST'});await new Promise(r=>setTimeout(r,200));enabled=data.payload.enabled;version=1;return {version};}throw Error('Unexpected service');}`,
    }),
  );
  await page.route("**/ask106-write", async (route) => {
    writes++;
    await route.fulfill({ body: "ok" });
  });
  await page.route("**/ask106", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<link rel="stylesheet" href="/src/features/settings/admin-workbench096.css"><div id="root" class="admin096"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const {AskPilot}=await import('/src/features/settings/AskPilot.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(AskPilot));</script>`,
    }),
  );
  await page.goto("/ask106");
  const enable = page.getByRole("button", {
    name: "Bật thử cho tài khoản của tôi",
    exact: true,
  });
  await enable.click();
  await expect(
    page.getByRole("heading", { name: "Xác nhận bật thử Ask" }),
  ).toBeFocused();
  expect(writes).toBe(0);
  await page.keyboard.press("Escape");
  await expect(enable).toBeFocused();
  expect(writes).toBe(0);
  await enable.click();
  await page.getByRole("button", { name: "Hủy xác nhận" }).click();
  expect(writes).toBe(0);
  await enable.click();
  await page.screenshot({ path: "output/ask106/owner-confirm-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/ask106/owner-confirm-mobile.png" });
  await page
    .getByRole("button", { name: "Xác nhận bật thử", exact: true })
    .dblclick();
  await expect(
    page.getByText("Đã bật thử Ask cho tài khoản của bạn.", { exact: true }),
  ).toBeVisible();
  expect(writes).toBe(1);
  await page.getByRole("button", { name: "Dừng thử", exact: true }).click();
  await expect(
    page.getByText("Đã dừng thử Ask.", { exact: true }),
  ).toBeVisible();
  expect(writes).toBe(2);
});
