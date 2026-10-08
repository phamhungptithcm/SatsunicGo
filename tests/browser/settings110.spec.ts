import { test, expect } from "@playwright/test";
for (const mode of ["desktop", "mobile", "unknown", "retry"])
  test(`Settings110 ${mode}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    if (mode === "mobile")
      await page.setViewportSize({ width: 320, height: 844 });
    const src = await (
        await page.request.get("/src/features/settings/Settings.tsx")
      ).text(),
      entry = await (await page.request.get("/src/app/main.tsx")).text();
    const react = src.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1],
      root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
    let enabled = false;
    const writes: Record<string, unknown>[] = [];
    await page.route("**/settings110-command", async (r) => {
      const data = r.request().postDataJSON();
      writes.push(data);
      if (mode === "retry" && writes.length === 1) {
        await r.fulfill({ status: 503, body: "unknown" });
        return;
      }
      enabled = data.payload.enabled;
      await r.fulfill({ body: "ok" });
    });
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `let version=0,enabled=false;export async function callService(name,data){if(name==='workspaceCommand'){const r=await fetch('/settings110-command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw {code:'functions/unavailable'};enabled=data.payload.enabled;version++;return {version};}if(location.search.includes('unknown'))throw Error('Synthetic read failure');return {pricing:null,askPilot:{enabled,version,ready:true,maxBudgetVnd:10000,reservedVnd:0,expiresAt:null}};}`,
      }),
    );
    await page.route("**/settings110-fixture*", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div class="workspaceShell" style="display:block"><main class="workspaceContent"><div id="root"></div></main></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const {Settings}=await import('/src/features/settings/Settings.tsx');const {ToastHost}=await import('/src/shared/Toast.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(Settings),React.createElement(ToastHost)));</script>`,
      }),
    );
    await page.goto(`/settings110-fixture?${mode}`);
    await page.getByRole("tab", { name: "AI Budget", exact: true }).click();
    const panel = page.getByRole("tabpanel");
    await expect(
      panel.getByRole("heading", { name: "AI Budget", exact: true }),
    ).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Tải lại AI Budget" }),
    ).toBeVisible();
    await expect(panel.locator("footer button")).toHaveCount(1);
    if (mode === "unknown") {
      await expect(
        panel.getByText("Chưa xác minh", { exact: true }),
      ).toBeVisible();
      await expect(
        panel.getByRole("button", { name: "Bật AI", exact: true }),
      ).toBeDisabled();
      expect(writes).toHaveLength(0);
      return;
    }
    await expect(panel.locator(".aiBadge.off")).toHaveText("Tắt");
    await panel.getByRole("button", { name: "Bật AI", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Hủy xác nhận" }).click();
    expect(writes).toHaveLength(0);
    await panel.getByRole("button", { name: "Bật AI", exact: true }).click();
    await page
      .getByRole("button", { name: "Xác nhận bật AI", exact: true })
      .click();
    if (mode === "retry") {
      await expect.poll(() => writes.length).toBe(1);
      await expect(
        panel.getByRole("button", { name: "Bật AI", exact: true }),
      ).toBeEnabled();
      await panel.getByRole("button", { name: "Bật AI", exact: true }).click();
      await expect.poll(() => writes.length).toBe(2);
      expect(writes[0]).toEqual(writes[1]);
    }
    await expect(panel.locator(".aiBadge.on")).toHaveText("Bật");
    expect(enabled).toBe(true);
    await expect(
      panel.getByRole("button", { name: "Tắt AI", exact: true }),
    ).toBeVisible();
    await panel.getByRole("button", { name: "Tải lại AI Budget" }).click();
    await expect(panel.locator(".aiBadge.on")).toHaveText("Bật");
    if (await page.getByRole("button", { name: "Ẩn thông báo" }).isVisible())
      await page.getByRole("button", { name: "Ẩn thông báo" }).click();
    expect(await panel.locator(".pilotBudget").evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await page.screenshot({
      path: `output/settings110/budget-${mode}.png`,
      fullPage: true,
    });
    await panel.getByRole("button", { name: "Tắt AI", exact: true }).click();
    await expect(panel.locator(".aiBadge.off")).toHaveText("Tắt");
    await page
      .getByRole("tab", { name: "Tỷ giá & Điều khoản", exact: true })
      .click();
    const next = page.getByRole("button", { name: "Tiếp tục →", exact: true });
    await next.click();
    await expect(
      page.getByLabel("Phiên bản điều khoản", { exact: false }),
    ).toBeVisible();
    await page
      .getByLabel("Phiên bản điều khoản", { exact: false })
      .fill("draft-v1");
    await page.getByRole("tab", { name: "AI Budget", exact: true }).click();
    await page
      .getByRole("tab", { name: "Tỷ giá & Điều khoản", exact: true })
      .click();
    await expect(
      page.getByLabel("Phiên bản điều khoản", { exact: false }),
    ).toHaveValue("draft-v1");
    await next.click();
    for (const c of ["USD", "JPY", "KRW"]) {
      await page.locator(`[name="${c}-num"]`).fill("240");
      await page.locator(`[name="${c}-den"]`).fill("1");
    }
    await next.click();
    await page.locator('[name="from"]').fill("2026-10-07T10:00");
    await page.locator('[name="until"]').fill("2026-10-06T10:00");
    await next.click();
    await expect(page.getByRole("alert")).toContainText("Hết hạn phải sau");
    await page.locator('[name="until"]').fill("2026-10-08T10:00");
    await next.click();
    await expect(
      page.getByRole("button", { name: "Lưu chính sách", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Thông tin trước khi gửi")).toContainText(
      "draft-v1",
    );
    if (await page.getByRole("button", { name: "Ẩn thông báo" }).isVisible())
      await page.getByRole("button", { name: "Ẩn thông báo" }).click();
    await page.screenshot({
      path: `output/settings110/policy-${mode}.png`,
      fullPage: true,
    });
    await page.getByLabel("Đã duyệt điều khoản và tỷ giá thương mại").check();
    await page
      .getByRole("button", { name: "Lưu chính sách", exact: true })
      .click();
    await expect.poll(() => writes.at(-1)?.action).toBe("savePricingPolicy");
    expect(writes.at(-1)?.payload).toMatchObject({
      termsVersion: "draft-v1",
      approved: true,
      rates: {
        USD: { numerator: 240, denominator: 1 },
        JPY: { numerator: 240, denominator: 1 },
        KRW: { numerator: 240, denominator: 1 },
      },
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
