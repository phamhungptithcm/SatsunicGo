import { test, expect } from "@playwright/test";
for (const width of [1280, 320])
  test(`membership compact form ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const src = await (
      await page.request.get("/src/features/membership/PlanEditor.tsx")
    ).text();
    const entry = await (await page.request.get("/src/app/main.tsx")).text();
    const react = src.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
    const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
    const writes: { payload: Record<string, unknown> }[] = [];
    await page.route("**/membership111-command", async (r) => {
      writes.push(r.request().postDataJSON());
      await r.fulfill({ body: "ok" });
    });
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export async function callService(name,data){if(name==='workspaceCommand'){await fetch('/membership111-command',{method:'POST',body:JSON.stringify(data)});return {};}return {rows:[],next:null};}`,
      }),
    );
    await page.route("**/membership111-fixture", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div class="workspaceShell"><aside class="workspaceSidebar"></aside><main class="workspaceContent"><div id="root"></div></main></div><script type="module">import '/src/styles/global.css';import '/src/features/crm/Workspace.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const {PlanEditor}=await import('/src/features/membership/PlanEditor.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(PlanEditor));</script>`,
      }),
    );
    await page.goto("/membership111-fixture");
    await page.getByRole("button", { name: "Tạo gói", exact: true }).click();
    const form = page.locator(".membershipForm");
    await expect(form).toBeVisible();
    await expect(page.locator(".crmState")).toHaveCount(0);
    await expect(form.locator(".stepper")).toHaveCount(0);
    await page.getByRole("radio", { name: "FREE", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("radio", { name: "PLUS", exact: true }),
    ).toBeChecked();
    await form.getByLabel("Giá trả trước").fill("120000");
    await form.getByLabel("Thời hạn").fill("30");
    await form.getByLabel("Giảm phí mua hộ").fill("100.01");
    await form.getByLabel("Mức giảm tối đa").fill("50000");
    await form.getByRole("button", { name: "Lưu gói", exact: true }).click();
    expect(writes).toHaveLength(0);
    await form.getByLabel("Giảm phí mua hộ").fill("2.55");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `output/membership111/form-${width}.png`,
      fullPage: true,
    });
    await form.getByRole("button", { name: "Lưu gói", exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0].payload).toEqual({
      name: "PLUS",
      price: 120000,
      periodDays: 30,
      serviceDiscountBps: 255,
      discountCap: 50000,
      status: "draft",
    });
    await expect(form).not.toBeVisible();
    await page.getByRole("button", { name: "Tạo gói", exact: true }).click();
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(form).not.toBeVisible();
    expect(writes).toHaveLength(1);
  });
