import { test, expect, type Page } from "@playwright/test";
declare global {
  interface Window {
    supportCare111Calls: { data: Record<string, string> }[];
  }
}
async function fixture(page: Page, surface: string) {
  const entry = await (await page.request.get("/src/app/main.tsx")).text();
  const source = await (
    await page.request.get("/src/features/crm/Customers.tsx")
  ).text();
  const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
  const router = source.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1];
  const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
  await page.route("**/src/shared/firebase.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `export const auth=null,db=null,functions=null,app=null,configured=false,emulatorMode=true;export const callService=async(name,data)=>{window.supportCare111Calls=(window.supportCare111Calls||[]).concat({name,data});await new Promise(r=>setTimeout(r,100));if(location.hash==='#error')throw Error('Synthetic failure');if(name==='listCrmStaff')return {rows:[]};if(data.supportStatus==='open'||location.hash==='#rows')return {rows:[{id:'synthetic111',subject:'Hội thoại kiểm thử',message:'Nội dung kiểm thử',status:'open',version:1,tags:[],displayName:'Khách kiểm thử',assigneeId:'',followUpAt:0}],next:'synthetic-next'};return {rows:[],next:null};};`,
    }),
  );
  await page.route("**/support111-fixture*", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import '/src/features/crm/Workspace.css';import '/src/features/crm/crm-ux028.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const {StaffSupport}=await import('/src/features/support/Thread.tsx');const {Customers}=await import('/src/features/crm/Customers.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement('div',{className:'workspaceShell'},React.createElement('aside',{className:'workspaceSidebar'}),React.createElement('div',{className:'workspaceMain'},React.createElement('div',{className:'workspaceContent'},React.createElement(${surface === "support" ? "StaffSupport" : "Customers"},${surface === "support" ? "{}" : "{followUps:true,uid:'synthetic111'}"}))))));</script>`,
    }),
  );
  await page.goto("/support111-fixture");
}
for (const surface of ["support", "care"])
  for (const width of [1440, 375])
    test(`${surface} empty and filter ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await fixture(page, surface);
      const empty = page.locator(".supportCareEmpty");
      await expect(empty).toBeVisible();
      await expect(empty.locator(".crmIcon")).toBeVisible();
      await expect(
        page.locator(".customerWorkspace095-resultHeading"),
      ).toHaveCount(0);
      await expect(
        page.getByText("Danh sách hội thoại", { exact: true }),
      ).toHaveCount(0);
      expect(await empty.evaluate((e) => getComputedStyle(e).textAlign)).toBe(
        "center",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.screenshot({
        path: `.ai/local/reviews/support111-${surface}-${width}.png`,
      });
      await page.evaluate(() => (document.body.style.zoom = "2"));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.evaluate(() => (document.body.style.zoom = "1"));
      if (surface === "support") {
        await page
          .getByRole("combobox", { name: "Trạng thái", exact: true })
          .selectOption("open");
        await expect(
          page.getByText("Hội thoại kiểm thử", { exact: true }),
        ).toBeVisible();
        await page.getByRole("button", { name: "Trang tiếp theo" }).click();
        await expect
          .poll(() =>
            page.evaluate(() => window.supportCare111Calls.at(-1)!.data),
          )
          .toMatchObject({ supportStatus: "open", after: "synthetic-next" });
        await page
          .getByRole("combobox", { name: "Trạng thái", exact: true })
          .selectOption("resolved");
        await expect(empty).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(() => window.supportCare111Calls.at(-1)!.data),
          )
          .toEqual({ kind: "supportTickets", supportStatus: "resolved" });
      } else {
        await page.evaluate(() => (location.hash = "rows"));
        await page
          .getByRole("button", { name: "Tải lại", exact: true })
          .click();
        await expect(
          page.getByText("Khách kiểm thử", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Tối đa 30 lịch hẹn mỗi trang", { exact: true }),
        ).toBeVisible();
        await page.evaluate(() => (location.hash = ""));
        await page.getByRole("combobox").first().selectOption("all");
        await page
          .getByRole("button", { name: "Xem danh sách", exact: true })
          .click();
        await expect(empty).toBeVisible();
      }
      await page.evaluate(() => (location.hash = "error"));
      await page
        .getByRole("button", {
          name: surface === "support" ? "Tải lại hội thoại" : "Tải lại",
          exact: true,
        })
        .click();
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(empty).toHaveCount(0);
    });
