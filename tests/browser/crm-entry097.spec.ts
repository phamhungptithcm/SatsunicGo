import { test, expect } from "@playwright/test";

test("actual CRM entry matches approved design and keyboard/mobile", async ({
  page,
}) => {
  await page.goto("/crm/orders");
  await expect(
    page.getByRole("heading", { name: "Không gian làm việc", exact: true }),
  ).toBeVisible();
  const button = page.getByRole("button", {
    name: "Tiếp tục với Google",
    exact: true,
  });
  await expect(button).toBeEnabled();
  await expect(page.locator(".google svg")).toBeVisible();
  for (const width of [1440, 390, 320, 720]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const icon = await page.locator(".mark").boundingBox(),
      title = await page.getByRole("heading").boundingBox();
    expect(
      Math.abs(icon!.y + icon!.height / 2 - (title!.y + title!.height / 2)),
    ).toBeLessThan(4);
    await page.screenshot({
      path: `/private/tmp/crm097-entry-${width}.png`,
      fullPage: true,
    });
  }
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Tài khoản khách hàng" }),
  ).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("synthetic error/retry/denied and inline MFA preserve original route", async ({
  page,
}) => {
  page.on("pageerror", (error) =>
    console.log("Synthetic projection error:", error.message),
  );
  let html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root"></div><script type="module">
import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
</script><script type="module">
import React from '/node_modules/.vite/deps/react.js';
const {useState,useSyncExternalStore}=React;
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
const {createRoot}=ReactDOM;
import {MemoryRouter} from '/node_modules/.vite/deps/react-router-dom.js';
import {CrmAccessScreen} from '/src/features/auth/CrmAccessScreen.tsx';
import {LoginChallenge} from '/src/features/auth/LoginChallenge.tsx';
import {captureMfa,pendingMfa,subscribeMfa} from '/src/features/auth/mfa.ts';
const e=React.createElement;
function Fixture(){const [state,setState]=useState('anonymous');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const challenge=useSyncExternalStore(subscribeMfa,pendingMfa,()=>null);
window.setCrmState=setState;
async function signIn(){setBusy(true);setError('');await new Promise(r=>setTimeout(r,300));if(window.testMfa){captureMfa({code:'auth/multi-factor-auth-required',customData:{operationType:'signIn',_serverResponse:{mfaPendingCredential:'synthetic-only',mfaInfo:[{mfaEnrollmentId:'fixture-factor',displayName:'Ứng dụng thử',enrolledAt:'2026-10-06T00:00:00Z',totpInfo:{}}]}}},{});pendingMfa().resolveSignIn=async assertion=>{if(assertion.otp!=='654321')throw {code:'auth/invalid-verification-code'};setState('checking');return {};};}else setError('Chưa kết nối được Google. Kiểm tra mạng rồi thử lại.');setBusy(false);}
return e(MemoryRouter,{},e(React.Fragment,{},e(CrmAccessScreen,{state,busy,error,mfa:!!challenge,signIn,signOut:()=>setState('anonymous'),retry:()=>setState('checking')}),e(LoginChallenge,{onOpen:()=>setError('')})));}
createRoot(document.getElementById('root')).render(e(Fixture));
</script></body></html>`;
  // Match Vite optimizer versioned URLs so the fixture shares React with components.
  const sources = await Promise.all(
    [
      "/src/main.tsx",
      "/src/features/auth/LoginChallenge.tsx",
      "/src/features/auth/CrmAccessScreen.tsx",
    ].map(async (path) => (await page.request.get(path)).text()),
  );
  for (const source of sources) {
    for (const url of source.match(/\/node_modules\/\.vite\/deps\/[^"']+/g) ??
      []) {
      const base = url.split("?")[0];
      html = html.replaceAll(`'${base}'`, `'${url}'`);
    }
  }
  await page.route("**/__crm097_projection", (route) =>
    route.fulfill({ contentType: "text/html; charset=utf-8", body: html }),
  );
  await page.goto("/__crm097_projection");
  const button = page.getByRole("button", {
    name: "Tiếp tục với Google",
    exact: true,
  });
  await button.click();
  await expect(
    page.getByRole("button", { name: "Đang mở đăng nhập…" }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Kiểm tra mạng");
  await expect(page.locator(".loadingOverlay")).toHaveCount(0);
  await page.evaluate(() => {
    (window as unknown as { testMfa: boolean }).testMfa = true;
  });
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const input = page.getByLabel("Mã xác thực", { exact: true });
  await expect(input).toBeFocused();
  await input.fill("111111");
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Mã chưa đúng");
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(button).toBeEnabled();
  await button.click();
  await input.fill("654321");
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(
    "Đang kiểm tra quyền CRM",
  );
  expect(new URL(page.url()).pathname).toBe("/__crm097_projection");
  await page.evaluate(() => {
    (window as unknown as { setCrmState: (s: string) => void }).setCrmState(
      "error",
    );
  });
  await page.getByRole("button", { name: "Kiểm tra lại quyền" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Đang kiểm tra quyền CRM",
  );
  await page.evaluate(() => {
    (window as unknown as { setCrmState: (s: string) => void }).setCrmState(
      "denied",
    );
  });
  await expect(
    page.getByRole("heading", { name: "Chưa có quyền CRM" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dùng tài khoản khác" }).click();
  await expect(button).toBeEnabled();
});
