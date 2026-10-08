import { test, expect } from "@playwright/test";
async function modules(page: import("@playwright/test").Page) {
  const text = await (
      await page.request.get("/src/features/settings/Settings.tsx")
    ).text(),
    entry = await (await page.request.get("/src/app/main.tsx")).text();
  return {
    react: text.match(/from "([^"]*\/react\.js[^"]*)"/)![1],
    root: entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)![1],
  };
}
test("settings tabs retain form draft; balanced mobile layout; toast success", async ({
  page,
}) => {
  const { react, root } = await modules(page);
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export async function callService(){return {pricing:null,askPilot:{enabled:false,version:null,ready:true,maxBudgetVnd:10000,reservedVnd:0,expiresAt:null}}}`,
    }),
  );
  await page.route("**/ask107-settings", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<div class="workspaceShell" style="display:block"><main class="workspaceContent"><div id="root"></div></main></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const {Settings}=await import('/src/features/settings/Settings.tsx');const {ToastHost}=await import('/src/shared/Toast.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(Settings),React.createElement(ToastHost)));</script>`,
    }),
  );
  await page.goto("/ask107-settings");
  await page
    .getByLabel("Phiên bản điều khoản", { exact: false })
    .fill("demo-draft");
  await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(
    page.getByLabel("Số VND", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: "AI Budget", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bật AI" })).toBeVisible();
  await page.getByRole("tab", { name: "Tỷ giá & Điều khoản" }).click();
  await expect(
    page.getByLabel("Phiên bản điều khoản", { exact: false }),
  ).toHaveValue("demo-draft");
  await page.screenshot({
    path: "output/ask107/settings-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "output/ask107/settings-mobile.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Tỷ giá & Điều khoản" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "AI Budget", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: "output/ask107/ask-mobile.png",
    fullPage: true,
  });
});
for (const scenario of [
  "success",
  "blocked",
  "internal",
  "cancel",
  "identity",
  "page",
])
  test(`automatic MFA ${scenario}, wrong-code toast, one resume`, async ({
    page,
  }) => {
    const { react, root } = await modules(page);
    const component = await (
      await page.request.get("/src/features/auth/ActionMfa.tsx")
    ).text();
    const sdk = component.match(/from "([^"]*firebase_auth[^"]*)"/)![1];
    await page.route("**/*firebase_auth.js*", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `export const fakeAuth={currentUser:{uid:'owner',getIdTokenResult:async()=>({claims:{firebase:{sign_in_second_factor:'totp'}},authTime:new Date().toISOString()})}};export const onAuthStateChanged=(auth,callback)=>{callback(auth.currentUser);if(location.search.includes("identity")){const t=setTimeout(()=>callback(null),100);return ()=>clearTimeout(t)}return ()=>{}};export class GoogleAuthProvider{};let attempts=0;export const reauthenticateWithPopup=async()=>{if((location.search.includes("blocked")||location.search.includes("internal")) && attempts++===0)throw {code:location.search.includes("internal")?"auth/internal-error":"auth/popup-blocked"};throw {code:'auth/multi-factor-auth-required'}};export const TotpMultiFactorGenerator={FACTOR_ID:'totp',assertionForSignIn:(id,code)=>code};export const getMultiFactorResolver=()=>({hints:[{uid:'factor',factorId:'totp'}],resolveSignIn:async(code)=>{if(code!=='123456')throw {code:'auth/invalid-verification-code'};}});`,
      }),
    );
    await page.route("**/ask107-mfa*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<div class="workspaceShell" style="display:block"><main class="workspaceContent"><div id="root"></div></main></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {fakeAuth} from '${sdk}';const {ActionMfa,requestActionMfa}=await import('/src/features/auth/ActionMfa.tsx');const {LoginChallenge}=await import('/src/features/auth/LoginChallenge.tsx');const {ToastHost}=await import('/src/shared/Toast.tsx');const {runWithMfaRecovery}=await import('/src/shared/mfa-recovery.ts');let calls=0;function Demo(){const [status,setStatus]=React.useState('waiting');return React.createElement(React.Fragment,null,React.createElement('button',{onClick:()=>{if(location.search.includes('page'))setTimeout(()=>setStatus('changed'),100);return runWithMfaRecovery(async()=>{calls++;if(calls===1)throw {code:'functions/failed-precondition',details:{reason:'RECENT_MFA_REQUIRED'}};return 'resumed '+calls},()=>requestActionMfa(fakeAuth),()=>true).then(setStatus).catch(()=>setStatus("cancelled"))}},'Run'),React.createElement('p',null,status),React.createElement(ActionMfa,{pageKey:status}),React.createElement(LoginChallenge,{onOpen:()=>{}}),React.createElement(ToastHost));}ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Demo));</script>`,
      }),
    );
    await page.goto(`/ask107-mfa?${scenario}`);
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    if (["blocked", "internal"].includes(scenario))
      await page.getByRole("button", { name: "Tiếp tục với Google" }).click();
    if (["identity", "page"].includes(scenario)) {
      await expect(page.getByText("cancelled", { exact: true })).toBeVisible();
      await expect(page.getByRole("dialog")).not.toBeVisible();
      return;
    }
    if (scenario === "cancel") {
      await page.getByRole("button", { name: "Hủy", exact: true }).click();
      await expect(page.getByText("cancelled", { exact: true })).toBeVisible();
      return;
    }

    await page.getByLabel("Mã xác thực", { exact: false }).fill("000000");
    await expect(
      page.getByText("Mã chưa đúng hoặc chưa kết nối được. Thử lại.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByText("Mã chưa đúng hoặc chưa kết nối được. Thử lại.", {
          exact: true,
        }),
    ).toBeVisible();
    await page.screenshot({
      path: `output/ask107/mfa-${scenario}.png`,
      animations: "disabled",
    });
    await page.getByLabel("Mã xác thực", { exact: false }).fill("123456");
    await expect(page.getByText("resumed 2", { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
