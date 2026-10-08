import { test, expect } from "@playwright/test";
for (const mode of [
  "happy",
  "unknown",
  "invalid-result",
  "terminal",
  "account-switch",
  "mobile",
  "inline-unknown",
])
  test(`Profile recovery ${mode}`, async ({ page }) => {
    if (mode === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const source = await (
      await page.request.get("/src/features/profile/Profile.tsx")
    ).text();
    const entry = await (await page.request.get("/src/app/main.tsx")).text();
    const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
    const router = source.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1];
    const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const auth={currentUser:{uid:'profile-synthetic-one'}},db={};export async function callService(name,data){const r=await fetch('/profile-response',{method:'POST',body:JSON.stringify(data)});const result=await r.json();if(result.error)throw result.error;return result;}`,
      }),
    );
    await page.route("**/*firebase_firestore.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const doc=(_,kind,id)=>({kind,id});export const collection=(_,kind)=>({kind});export const query=x=>x;export const where=()=>null;export const limit=()=>null;export function onSnapshot(ref,ok){let live=true;queueMicrotask(()=>{if(live)ok(ref.kind==='users'?{data:()=>({displayName:'Synthetic QA',businessName:'',marketingConsent:false,version:0})}:{docs:[]})});return()=>{live=false}}`,
      }),
    );
    const requests: Record<string, unknown>[] = [];
    await page.route("**/profile-response", async (r) => {
      requests.push(r.request().postDataJSON());
      if (mode === "account-switch")
        await new Promise((resolve) => setTimeout(resolve, 400));
      if (
        (mode === "unknown" ||
          mode === "inline-unknown" ||
          mode === "account-switch") &&
        requests.length === 1
      )
        return r.fulfill({
          json: { error: { code: "functions/unavailable" } },
        });
      if (mode === "invalid-result" && requests.length === 1)
        return r.fulfill({ json: { id: "synthetic-address", version: 99 } });
      if (mode === "terminal")
        return r.fulfill({ json: { error: { code: "functions/aborted" } } });
      return r.fulfill({ json: { id: "synthetic-address", version: 1 } });
    });
    await page.route("**/profile-fixture", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {MemoryRouter} from '${router}';import {auth} from '/src/shared/firebase.ts';const {Profile}=await import('/src/features/profile/Profile.tsx');const {CustomerWorkspace}=await import('/src/features/ask/CustomerWorkspace.tsx');const root=ReactDOM.createRoot(document.getElementById('root'));window.switchOwner=()=>{auth.currentUser={uid:'profile-synthetic-two'};render()};function render(){root.render(React.createElement(MemoryRouter,null,React.createElement(${mode === "inline-unknown" ? "CustomerWorkspace" : "Profile"},{user:auth.currentUser,language:"vi"})))}render();</script>`,
      }),
    );
    await page.goto("/profile-fixture");
    if (mode === "inline-unknown")
      await page
        .getByRole("button", { name: "Hồ sơ và địa chỉ", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Địa chỉ nhận hàng", exact: true })
      .click();
    await page
      .getByLabel("Người nhận", { exact: false })
      .fill("Synthetic recipient");
    await page.getByLabel(/điện thoại/i).fill("0900000000");
    await page
      .getByRole("textbox", { name: /^Địa chỉ/ })
      .fill("Synthetic QA address only");
    await page
      .getByRole("button", { name: "Lưu địa chỉ", exact: true })
      .click();
    await expect.poll(() => requests.length).toBe(1);
    if (mode === "account-switch") {
      const oldResponse = page.waitForResponse("**/profile-response");
      await page.evaluate(() =>
        (window as unknown as { switchOwner: () => void }).switchOwner(),
      );
      await expect(page.getByLabel("Người nhận", { exact: false })).toHaveValue(
        "",
      );
      await oldResponse;
      await expect(
        page.getByLabel("Người nhận", { exact: false }),
      ).toBeEnabled();
      await expect(
        page.getByText(/Chưa xác minh được kết quả lưu/),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Đối chiếu thao tác đang chờ" }),
      ).toHaveCount(0);
    } else if (
      mode === "unknown" ||
      mode === "inline-unknown" ||
      mode === "invalid-result"
    ) {
      await expect(
        page.getByText(/Chưa xác minh được kết quả lưu/),
      ).toBeVisible();
      await expect(
        page.getByLabel("Người nhận", { exact: false }),
      ).toBeDisabled();
      if (mode === "inline-unknown") {
        await page
          .getByRole("button", { name: "Hồ sơ và địa chỉ", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "Đối chiếu thao tác đang chờ" }),
        ).toBeHidden();
        await page
          .getByRole("button", { name: "Hồ sơ và địa chỉ", exact: true })
          .click();
      }
      await page
        .getByRole("button", { name: "Đối chiếu thao tác đang chờ" })
        .click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1]).toEqual(requests[0]);
      await expect(
        page.getByLabel("Người nhận", { exact: false }),
      ).toBeEnabled();
    } else if (mode === "terminal") {
      await expect(
        page.getByText(/Tải lại và kiểm tra thông tin/),
      ).toBeVisible();
      await expect(
        page.getByLabel("Người nhận", { exact: false }),
      ).toBeEnabled();
      await expect(
        page.getByRole("button", { name: "Đối chiếu thao tác đang chờ" }),
      ).toHaveCount(0);
    } else
      await expect(
        page.getByLabel("Người nhận", { exact: false }),
      ).toBeEnabled();
    if (mode === "mobile")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `output/profile-recovery/${mode}.png`,
      fullPage: true,
    });
  });
