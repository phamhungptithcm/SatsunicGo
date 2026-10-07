import { test, expect } from "@playwright/test";
test("publication confirmation cancels, invalidates changed preview and commits once", async ({
  page,
}) => {
  page.on("pageerror", (error) => console.log(error.message));
  const component = await (
    await page.request.get("/src/features/content/ProductSpreadsheet.tsx")
  ).text();
  const entry = await (await page.request.get("/src/app/main.tsx")).text();
  const react = component.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  const root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  expect(react && root).toBeTruthy();
  let writes = 0;
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `let stored=[];export async function callService(name,data){if(name==='listWork')return {rows:stored,next:null}; if(name==='workspaceCommand'){await fetch('/remote106-write',{method:'POST'});await new Promise(r=>setTimeout(r,300));stored=[{...data.payload.content,id:'saved',version:1}];return {id:'saved',version:1};}throw Error('Unexpected service');}`,
    }),
  );
  await page.route("**/remote106-write", async (route) => {
    writes++;
    await route.fulfill({ body: "ok" });
  });
  await page.route("**/remote106", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<link rel="stylesheet" href="/src/features/content/content-editor092.css"><div id="root" class="ceWorkspace"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const {createRoot}=ReactDOM;const {ProductSpreadsheet}=await import('/src/features/content/ProductSpreadsheet.tsx');createRoot(document.getElementById('root')).render(React.createElement(ProductSpreadsheet,{rows:[],selected:new Set(),filtered:[],onSaved:async()=>{}}));</script>`,
    }),
  );
  await page.goto("/remote106");
  await page.getByRole("button", { name: "Nhập Excel", exact: true }).click();
  const input = page.locator("input[type=file]");
  const upload = async (title: string) => {
    await input.setInputFiles({
      name: "products.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `title,slug,body,status\n${title},real-product,Verified description,published`,
      ),
    });
    await expect(
      page.getByRole("button", { name: "Kiểm tra dữ liệu", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Kiểm tra dữ liệu", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Xác nhận lưu 1 dòng", exact: true }),
    ).toBeEnabled();
  };
  await upload("Real product");
  const start = page.getByRole("button", {
    name: "Xác nhận lưu 1 dòng",
    exact: true,
  });
  const confirm = page.getByRole("button", {
    name: "Xác nhận thay đổi và lưu",
    exact: true,
  });
  await start.click();
  await expect(confirm).toBeVisible();
  expect(writes).toBe(0);
  await page.keyboard.press("Escape");
  await expect(confirm).toHaveCount(0);
  await expect(start).toBeFocused();
  expect(writes).toBe(0);
  await start.click();
  await page.getByRole("button", { name: "Hủy xác nhận", exact: true }).click();
  expect(writes).toBe(0);
  await start.click();
  await upload("Changed product");
  await expect(confirm).toHaveCount(0);
  expect(writes).toBe(0);
  await start.click();
  await page.screenshot({ path: "output/remote106/confirmation-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(confirm).toBeVisible();
  await confirm.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "output/remote106/confirmation-mobile.png" });
  await confirm.dblclick();
  await expect(
    page.getByRole("status").filter({ hasText: "1 đã lưu" }),
  ).toBeVisible();
  expect(writes).toBe(1);
  await page.screenshot({ path: "output/remote106/confirmation-result.png" });
});
