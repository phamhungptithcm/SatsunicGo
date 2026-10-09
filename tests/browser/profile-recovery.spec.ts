import { test, expect } from "@playwright/test";
for (const mode of [
  "happy",
  "unknown",
  "invalid-result",
  "terminal",
  "account-switch",
  "mobile",
  "inline-unknown",
  "profile-unknown",
  "reload-saved",
  "reload-not-saved",
  "corrupt-pointer",
  "storage-denied",
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
        body: `export const auth={currentUser:{uid:'profile-synthetic-one'}},db={};export async function callService(name,data){const r=await fetch('/profile-response',{method:'POST',body:JSON.stringify({name,data})});const result=await r.json();if(result.error)throw result.error;return result;}`,
      }),
    );
    await page.route("**/*firebase_firestore.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const doc=(_,kind,id)=>({kind,id});export const collection=(_,kind)=>({kind});export const query=x=>x;export const where=()=>null;export const limit=()=>null;export function onSnapshot(ref,ok){let live=true;queueMicrotask(()=>{if(live)ok(ref.kind==='users'?{data:()=>({displayName:'Synthetic QA',businessName:'',marketingConsent:false,version:0})}:{docs:[]})});return()=>{live=false}}`,
      }),
    );
    const requests: Record<string, unknown>[] = [];
    const recoveries: Record<string, unknown>[] = [];
    await page.route("**/profile-response", async (r) => {
      const body = r.request().postDataJSON();
      if (body.name === "customerSaveResolve") {
        recoveries.push(body.data);
        return r.fulfill({
          json:
            mode === "reload-not-saved" || mode === "terminal"
              ? { status: "not-saved" }
              : {
                  status: "saved",
                  result: { id: "synthetic-address", version: 1 },
                },
        });
      }
      requests.push(body.data);
      if (mode === "account-switch")
        await new Promise((resolve) => setTimeout(resolve, 400));
      if (
        (mode.startsWith("reload-") ||
          mode === "unknown" ||
          mode === "profile-unknown" ||
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
      return r.fulfill({
        json: {
          id:
            mode === "profile-unknown"
              ? "profile-synthetic-one"
              : "synthetic-address",
          version: 1,
        },
      });
    });
    await page.route("**/profile-fixture", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {MemoryRouter} from '${router}';import {auth} from '/src/shared/firebase.ts';const {Profile}=await import('/src/features/profile/Profile.tsx');const {CustomerWorkspace}=await import('/src/features/ask/CustomerWorkspace.tsx');const root=ReactDOM.createRoot(document.getElementById('root'));window.switchOwner=()=>{auth.currentUser={uid:'profile-synthetic-two'};render()};function render(){root.render(React.createElement(MemoryRouter,null,React.createElement(${mode === "inline-unknown" ? "CustomerWorkspace" : "Profile"},{user:auth.currentUser,language:"vi"})))}render();</script>`,
      }),
    );
    if (mode === "storage-denied")
      await page.addInitScript(() => {
        Storage.prototype.setItem = function () {
          throw Error("Storage unavailable");
        };
      });
    await page.goto("/profile-fixture");
    if (mode === "inline-unknown")
      await page
        .getByRole("button", { name: "Hồ sơ và địa chỉ", exact: true })
        .click();
    if (mode === "profile-unknown") {
      await page.getByLabel(/Tên hiển thị/).fill("Synthetic changed name");
      await page
        .getByRole("button", { name: "Lưu hồ sơ", exact: true })
        .click();
    } else {
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
    }
    const field =
      mode === "profile-unknown"
        ? page.getByLabel(/Tên hiển thị/)
        : page.getByLabel("Người nhận", { exact: false });
    if (mode === "storage-denied") {
      await expect(page.getByText(/Chưa chuẩn bị được lần lưu/)).toBeVisible();
      await expect(field).toBeDisabled();
      expect(requests).toHaveLength(0);
      return;
    }
    await expect.poll(() => requests.length).toBe(1);
    if (mode === "corrupt-pointer") {
      await page.evaluate(() =>
        localStorage.setItem(
          "satsunicgo.customer-save.v1.corrupt",
          '{"broken":true}',
        ),
      );
      // Replace the actual owner key, not another account's namespace.
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(
          (k) =>
            k.startsWith("satsunicgo.customer-save.v1.") &&
            !k.endsWith("corrupt"),
        );
        if (key) localStorage.setItem(key, '{"broken":true}');
      });
      // Happy save already cleared its pointer; explicitly seed current owner metadata.
      await page.evaluate(async () => {
        const hash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode("profile-synthetic-one"),
        );
        const key = Array.from(new Uint8Array(hash), (x) =>
          x.toString(16).padStart(2, "0"),
        ).join("");
        localStorage.setItem(
          `satsunicgo.customer-save.v1.${key}`,
          '{"broken":true}',
        );
      });
      await page.reload();
      await expect(
        page.getByText(/Chưa kiểm tra được lần lưu trước/),
      ).toBeVisible();
      await expect(page.getByLabel(/Tên hiển thị/)).toBeDisabled();
      expect(requests).toHaveLength(1);
      expect(recoveries).toHaveLength(0);
      return;
    }
    if (mode === "account-switch") {
      const oldResponse = page.waitForResponse("**/profile-response");
      await page.evaluate(() =>
        (window as unknown as { switchOwner: () => void }).switchOwner(),
      );
      await expect(page.getByLabel("Người nhận", { exact: false })).toHaveValue(
        "",
      );
      await oldResponse;
      await expect(field).toBeEnabled();
      await expect(
        page.getByText(/Chưa xác minh được kết quả lưu/),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Đối chiếu thao tác đang chờ" }),
      ).toHaveCount(0);
    } else if (mode.startsWith("reload-")) {
      await expect(
        page.getByText(/Chưa xác minh được kết quả lưu/),
      ).toBeVisible();
      const serialized = await page.evaluate(() =>
        JSON.stringify(Object.entries(localStorage)),
      );
      for (const value of [
        "Synthetic recipient",
        "0900000000",
        "Synthetic QA address only",
        "payload",
      ])
        expect(serialized).not.toContain(value);
      await page.reload();
      await expect(page.getByLabel(/Tên hiển thị/)).toBeDisabled();
      await expect(page.getByText(/Có lần lưu đang chờ kết quả/)).toBeVisible();
      expect(requests).toHaveLength(1);
      await page
        .getByRole("button", { name: "Đối chiếu thao tác đang chờ" })
        .click();
      await expect.poll(() => recoveries.length).toBe(1);
      expect(recoveries[0].operationId).toBe(requests[0].operationId);
      await expect(page.getByLabel(/Tên hiển thị/)).toBeEnabled();
      expect(requests).toHaveLength(1);
      await expect(
        page.getByText(
          mode === "reload-saved"
            ? /Đã xác minh lần lưu trước thành công/
            : /Lần lưu trước chưa hoàn tất/,
        ),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            Object.keys(localStorage).filter((key) =>
              key.startsWith("satsunicgo.customer-save"),
            ).length,
        ),
      ).toBe(0);
    } else if (
      mode === "unknown" ||
      mode === "profile-unknown" ||
      mode === "inline-unknown" ||
      mode === "invalid-result"
    ) {
      await expect(
        page.getByText(/Chưa xác minh được kết quả lưu/),
      ).toBeVisible();
      await expect(field).toBeDisabled();
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
      await expect(field).toBeEnabled();
    } else if (mode === "terminal") {
      await expect(
        page.getByText(/Kiểm tra lần lưu trước khi thử lại/),
      ).toBeVisible();
      await expect(field).toBeDisabled();
      await page
        .getByRole("button", { name: "Đối chiếu thao tác đang chờ" })
        .click();
      await expect(page.getByText(/Lần lưu trước chưa hoàn tất/)).toBeVisible();
      await expect(field).toBeEnabled();
      expect(recoveries).toHaveLength(1);
      expect(requests).toHaveLength(1);
    } else await expect(field).toBeEnabled();
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
