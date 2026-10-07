import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Current application components on shared5207, synthetic SDK/transport only.
// No credentials, provider calls, production data or additional server.
const base = "http://127.0.0.1:5207";
type Options = {
  actualApp?: boolean;
  actualPath?: string;
  customer?: boolean;
  enrolled?: boolean;
  locked?: boolean;
  cached?: boolean;
  lookupFail?: boolean;
  reloadFail?: boolean;
  optional?: boolean;
  generateDelay?: number;
  recent?: boolean;
  qrFail?: boolean;
};
async function mount(page: Page, options: Options = {}) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const source = await (
    await page.request.get(`${base}/src/features/auth/Security.tsx`)
  ).text();
  const entry = await (
    await page.request.get(`${base}/src/app/main.tsx`)
  ).text();
  const appSource = await (
    await page.request.get(`${base}/src/app/App.tsx`)
  ).text();
  const router = appSource.match(
    /from "([^"]*\/react-router-dom\.js[^"]*)"/,
  )?.[1];
  const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  const root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  const qr = source.match(/from "([^"]*\/qrcode\.js[^"]*)"/)?.[1];
  expect(react && root && qr && router).toBeTruthy();
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `import {user,emitAuth} from '/login105-provider.js'; export const auth={currentUser:user},db={},configured=true,emulatorMode=false,betaRelease=false,app=null,functions=null;export async function logout(){auth.currentUser=null;emitAuth(null);}export async function login(){throw Error('Synthetic login unavailable');}export async function sendCommand(){throw Error('Synthetic writes blocked');}export async function callService(){throw Error('Synthetic service blocked');}`,
    }),
  );
  await page.route("**/firebase_auth.js*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export * from '/login105-provider.js';`,
    }),
  );
  await page.route("**/firebase_firestore.js*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export {doc,onSnapshot,collection,query,where,limit,documentId,orderBy,getDoc,getDocs,startAfter} from '/login105-provider.js';`,
    }),
  );
  await page.route("**/src/features/auth/Security.tsx*", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      `from "${qr}"`,
      'from "/login105-qr.js"',
    );
    await route.fulfill({ response, body });
  });
  await page.route("**/login105-qr.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `import QR from ${JSON.stringify(qr)}; import {state} from '/login105-provider.js';export default {toDataURL: (...args)=>state.qrFail ? Promise.reject(Error('synthetic QR failure')) : QR.toDataURL(...args)};`,
    }),
  );
  await page.route("**/login105-provider.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
    const options=${JSON.stringify(options)};
    export const state={...options, factors:options.enrolled?[{uid:'factor',factorId:'totp'}]:[], generate:0,enroll:0,verify:0,refresh:0,reauth:0,delay:0,fail:'',copies:0,lastCode:'',role:options.customer?null:{active:true,locked:!!options.locked,roles:['OWNER']}};
    window.fixture=state;
    const listeners=new Set();
    export const user={uid:'synthetic105',displayName:'Nhân viên kiểm thử',photoURL:null,providerData:[{providerId:'google.com'}],emailVerified:true,email:'fixture@example.invalid',reload:async()=>{if(state.reloadFail)throw Error('synthetic reload');},getIdToken:async()=>{state.refresh++;if(state.tokenFail)throw Error('synthetic refresh');return 'synthetic-only';}};
    const authListeners=new Set();export function onAuthStateChanged(auth,cb){authListeners.add(cb);queueMicrotask(()=>{if(authListeners.has(cb))cb(auth.currentUser);});return()=>authListeners.delete(cb);}export function emitAuth(current){for(const cb of authListeners)cb(current);}export async function signInWithCredential(){throw Error('Synthetic credential login unavailable');}
    export const doc=()=>({});
    export const collection=()=>({query:true});export const query=value=>value;export const where=()=>({});export const limit=()=>({});
    export const documentId=()=>({});export const orderBy=()=>({});export const startAfter=()=>({});export const getDocs=async()=>({docs:[]});export const getDoc=async()=>({exists:()=>false,data:()=>null});
    export function onSnapshot(ref,options,next,error){if(typeof options==='function'){error=next;next=options;options={};}state.metadataUpdates=state.metadataUpdates||options.includeMetadataChanges;const listener={next,error};listeners.add(listener);queueMicrotask(()=>{if(listeners.has(listener)){if(state.lookupFail)error(Error('synthetic lookup'));else next({data:()=>state.role,docs:[],metadata:{fromCache:!!state.cached}});}});return()=>listeners.delete(listener);}
    window.access=(role,cached=false)=>{state.role=role;state.cached=cached;for(const l of listeners)l.next({data:()=>role,metadata:{fromCache:cached}});};
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    export const multiFactor=()=>({enrolledFactors:state.factors,getSession:async()=>{if(state.recent)throw {code:'auth/requires-recent-login'};return {};},enroll:async(assertion)=>{state.enroll++;state.lastCode=assertion.otp;await wait(state.delay);if(state.fail){if(state.acceptedFailure)state.factors=[{uid:'factor',factorId:'totp'}];throw {code:state.fail};}state.factors=[{uid:'factor',factorId:'totp'}];}});
    export class GoogleAuthProvider{};
    export async function reauthenticateWithPopup(){state.reauth++;state.recent=false;}
    export const TotpMultiFactorGenerator={FACTOR_ID:'totp',generateSecret:async()=>{state.generate++;await wait(state.generateDelay||0);return {secretKey:'JBSWY3DPEHPK3PXP',generateQrCodeUrl:()=> 'otpauth://totp/Synthetic?secret=JBSWY3DPEHPK3PXP&issuer=Synthetic'};},assertionForEnrollment:(secret,otp)=>({otp}),assertionForSignIn:(factor,otp)=>({otp})};
    export const getMultiFactorResolver=(auth,error)=>error.resolver;
    window.challenge=(name='factor',fail='')=>({hints:[{uid:name,factorId:'totp'}],resolveSignIn:async(assertion)=>{state.verify++;state.lastCode=assertion.otp;const delay=state.delay;const failure=fail||state.fail;await wait(delay);if(failure)throw {code:failure};return {};}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{state.copies++;await wait(state.copyDelay||0);if(state.copyFail)throw Error('synthetic denied');}}});
  `,
    }),
  );
  await page.route("**/login105-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="vi"><meta name="viewport" content="width=device-width, initial-scale=1"><title>LOGIN105 synthetic provider</title><div id="root"></div><script type="module" src="/login105-main.js"></script></html>',
    }),
  );
  await page.route("**/login105-main.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
    import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
    const React=(await import(${JSON.stringify(react)})).default; const {createRoot}=(await import(${JSON.stringify(root)})).default;const {MemoryRouter}=await import(${JSON.stringify(router)});
    await import('/src/styles/global.css');
    const {StaffMfaSetup,useStaffMfaReady}=await import('/src/features/auth/StaffMfaSetup.tsx');
    const {Security}=await import('/src/features/auth/Security.tsx');const {LoginChallenge}=await import('/src/features/auth/LoginChallenge.tsx');
    const {captureMfa,clearMfa}=await import('/src/features/auth/mfa.ts');const {ToastHost}=await import('/src/shared/Toast.tsx');const {state,user}=await import('/login105-provider.js');
    const root=createRoot(document.getElementById('root'));let current=user;
    function Content(){const ready=useStaffMfaReady(current);return React.createElement('main',{style:{padding:'24px'}},React.createElement('h1',null,'Phiên đăng nhập kiểm thử'),React.createElement('p',{'data-testid':'workspace'},ready?'Workspace ready':'Workspace blocked'),React.createElement('button',{id:'trigger',onClick:()=>window.startChallenge()},'Đăng nhập thử'),state.optional?React.createElement(Security,{user:current}):null);}
    function render(){root.render(React.createElement(React.StrictMode,null,React.createElement(StaffMfaSetup,{user:current,busy:false,signOut:()=>{current=null;clearMfa();render();}},React.createElement(Content),React.createElement(LoginChallenge,{onOpen:()=>{}})),React.createElement(ToastHost)));}
    window.startChallenge=(resolver=window.challenge())=>captureMfa({code:'auth/multi-factor-auth-required',resolver},{});
    window.switchUser=()=>{current=null;render();};
    if(${Boolean(options.actualApp)}){try{const {App}=await import('/src/app/App.tsx');root.render(React.createElement(React.StrictMode,null,React.createElement(MemoryRouter,{initialEntries:[${JSON.stringify(options.actualPath ?? "/crm")}]},React.createElement(App),React.createElement(ToastHost))));}catch(error){document.getElementById('root').textContent='APP IMPORT ERROR: '+error.message;throw error;}}else render();
  `,
    }),
  );
  if (options.actualApp)
    await page.route("**/src/features/crm/Workspace.tsx*", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `import React from ${JSON.stringify(react)};window.workspaceImports=(window.workspaceImports||0)+1;export function Workspace(){return React.createElement('h1',null,'Verified Workspace fixture');}`,
      }),
    );
  await page.goto(`${base}/login105-fixture`);
  if (!options.actualApp)
    await expect(
      page.getByRole("heading", { name: "Phiên đăng nhập kiểm thử" }),
    ).toBeVisible();
  return errors;
}
const otp = (page: Page) =>
  page.getByRole("textbox", { name: "Mã xác thực 6 chữ số", exact: true });
const setup = (page: Page) =>
  page.getByRole("dialog", { name: "Bảo mật tài khoản nhân viên" });
async function flags(page: Page, values: Record<string, unknown>) {
  await page.evaluate(
    (values) =>
      Object.assign((window as unknown as { fixture: object }).fixture, values),
    values,
  );
}
async function count(page: Page, field: string) {
  return page.evaluate(
    (field) =>
      (window as unknown as { fixture: Record<string, unknown> }).fixture[
        field
      ],
    field,
  );
}

test("staff gets QR/manual/copy, paste auto-verifies exactly once and readback opens workspace", async ({
  page,
}) => {
  const errors = await mount(page);
  await expect(setup(page)).toBeVisible();
  await expect(page.getByRole("img")).toBeVisible();
  await expect(page.locator(".securityKey")).toHaveText("JBSWY3DPEHPK3PXP");
  await expect(page.getByTestId("workspace")).toHaveText("Workspace blocked");
  expect(await count(page, "generate")).toBe(1);
  expect(await count(page, "copies")).toBe(0);
  await page.getByRole("button", { name: "Sao chép khóa thiết lập" }).click();
  await expect(page.getByText("Đã sao chép", { exact: true })).toBeVisible();
  await flags(page, { delay: 350 });
  await otp(page).fill("123");
  expect(await count(page, "enroll")).toBe(0);
  await otp(page).fill("123 456");
  await expect(otp(page)).toBeDisabled();
  await page
    .locator(".securityForm")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect(setup(page)).toHaveCount(0);
  await expect(page.getByTestId("workspace")).toHaveText("Workspace ready");
  expect(await count(page, "enroll")).toBe(1);
  expect(await count(page, "refresh")).toBe(1);
  expect(await count(page, "lastCode")).toBe("123456");
  expect(errors).toEqual([]);
});
test("actual App holds Workspace until staff enrollment has provider readback", async ({
  page,
}) => {
  const errors = await mount(page, { actualApp: true });
  await expect.poll(() => errors).toEqual([]);
  await expect(page.locator("#root")).not.toBeEmpty();
  expect(errors).toEqual([]);
  await expect(page.getByRole("img")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Verified Workspace fixture" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { workspaceImports?: number }).workspaceImports ??
        0,
    ),
  ).toBe(0);
  await otp(page).fill("123456");
  await expect(setup(page)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Verified Workspace fixture" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("actual customer security page keeps MFA optional", async ({ page }) => {
  const errors = await mount(page, {
    actualApp: true,
    actualPath: "/account/security",
    customer: true,
  });
  await expect(
    page.getByRole("heading", { name: "Bảo mật tài khoản", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await count(page, "generate")).toBe(0);
  expect(errors).toEqual([]);
});
test("actual offline/cached CRM entry offers retry instead of an endless spinner", async ({
  page,
}) => {
  const errors = await mount(page, { actualApp: true, cached: true });
  await expect(
    page.getByRole("heading", { name: "Chưa thể mở CRM", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kiểm tra lại quyền", exact: true }),
  ).toBeEnabled();
  await expect(setup(page)).toHaveCount(0);
  await flags(page, { cached: false });
  await page
    .getByRole("button", { name: "Kiểm tra lại quyền", exact: true })
    .click();
  await expect(page.getByRole("img")).toBeVisible();
  expect(errors).toEqual([]);
});
for (const options of [
  { customer: true },
  { locked: true },
  { cached: true },
  { lookupFail: true },
])
  test(`no forced staff enrollment from absent/locked/cached/unavailable access ${JSON.stringify(options)}`, async ({
    page,
  }) => {
    await mount(page, options);
    await expect(page.getByTestId("workspace")).toHaveText("Workspace blocked");
    await page.waitForTimeout(150);
    await expect(setup(page)).toHaveCount(0);
    expect(await count(page, "generate")).toBe(0);
    expect(await count(page, "enroll")).toBe(0);
  });
test("enrolled staff does not receive setup; customer can choose optional enrollment", async ({
  page,
}) => {
  await mount(page, { enrolled: true });
  await expect(page.getByTestId("workspace")).toHaveText("Workspace ready");
  await expect(setup(page)).toHaveCount(0);
  expect(await count(page, "generate")).toBe(0);
  await page.unrouteAll({ behavior: "wait" });
  await mount(page, { customer: true, optional: true });
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await expect(setup(page)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await expect(page.getByRole("img")).toBeVisible();
  await otp(page).fill("654321");
  await expect(page.getByText("Đã bật", { exact: true })).toBeVisible();
});
test("wrong code does not loop; fresh input retries automatically", async ({
  page,
}) => {
  await mount(page);
  await expect(page.getByRole("img")).toBeVisible();
  await flags(page, { fail: "auth/invalid-verification-code" });
  await otp(page).fill("123456");
  await expect(page.getByRole("alert")).toContainText("Mã chưa đúng");
  await expect(otp(page)).toHaveValue("");
  await expect(otp(page)).toBeFocused();
  await page.waitForTimeout(200);
  expect(await count(page, "enroll")).toBe(1);
  await flags(page, { fail: "" });
  await otp(page).fill("654321");
  await expect(page.getByTestId("workspace")).toHaveText("Workspace ready");
  expect(await count(page, "enroll")).toBe(2);
});
test("server confirmation after a cached snapshot opens staff setup", async ({
  page,
}) => {
  await mount(page, { cached: true });
  await expect(setup(page)).toHaveCount(0);
  expect(await count(page, "metadataUpdates")).toBe(true);
  await page.evaluate(() =>
    (window as unknown as { access: (role: object) => void }).access({
      active: true,
      roles: ["OWNER"],
    }),
  );
  await expect(page.getByRole("img")).toBeVisible();
});
test("staff setup synchronizes the security page already mounted underneath", async ({
  page,
}) => {
  await mount(page, { optional: true });
  await expect(page.getByRole("img")).toBeVisible();
  await otp(page).fill("123456");
  await expect(setup(page)).toHaveCount(0);
  await expect(page.getByText("Đã bật", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa bật", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true }),
  ).toHaveCount(0);
});
test("a newly granted staff role cannot start a second enrollment while optional enrollment is pending", async ({
  page,
}) => {
  await mount(page, { customer: true, optional: true });
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await expect(page.getByRole("img")).toBeVisible();
  await flags(page, { delay: 500 });
  await otp(page).fill("123456");
  await page.evaluate(() =>
    (window as unknown as { access: (role: object) => void }).access({
      active: true,
      roles: ["OWNER"],
    }),
  );
  await expect(page.getByTestId("workspace")).toHaveText("Workspace ready");
  await expect(setup(page)).toHaveCount(0);
  expect(await count(page, "generate")).toBe(1);
  expect(await count(page, "enroll")).toBe(1);
});
test("enrollment acknowledgment plus token failure uses readback retry without double enrollment", async ({
  page,
}) => {
  await mount(page);
  await expect(page.getByRole("img")).toBeVisible();
  await flags(page, { tokenFail: true });
  await otp(page).fill("123456");
  await expect(page.getByRole("alert")).toContainText(
    "chưa tải được trạng thái mới",
  );
  await expect(page.locator(".securityKey")).toHaveCount(0);
  await expect(page.getByTestId("workspace")).toHaveText("Workspace blocked");
  await flags(page, { tokenFail: false });
  await page.getByRole("button", { name: "Kiểm tra lại", exact: true }).click();
  await expect(page.getByTestId("workspace")).toHaveText("Workspace ready");
  expect(await count(page, "enroll")).toBe(1);
});
test("reauth only when required by SDK, then restarts QR setup", async ({
  page,
}) => {
  await mount(page, { recent: true });
  await expect(page.getByRole("alert")).toContainText(
    "Xác thực lại với Google",
  );
  expect(await count(page, "reauth")).toBe(0);
  await page
    .getByRole("button", { name: "Xác thực lại với Google", exact: true })
    .click();
  await expect(page.getByRole("img")).toBeVisible();
  expect(await count(page, "reauth")).toBe(1);
});
test("expired enrollment session offers reauth and generates a fresh QR", async ({
  page,
}) => {
  await mount(page);
  await expect(page.getByRole("img")).toBeVisible();
  await flags(page, { fail: "auth/invalid-multi-factor-session" });
  await otp(page).fill("123456");
  await expect(page.getByRole("alert")).toContainText(
    "Phiên thiết lập đã hết hạn",
  );
  await expect(page.locator(".securityKey")).toHaveCount(0);
  await flags(page, { fail: "" });
  await page
    .getByRole("button", { name: "Xác thực lại với Google", exact: true })
    .click();
  await expect(page.getByRole("img")).toBeVisible();
  expect(await count(page, "generate")).toBe(2);
});
for (const acceptedFailure of [true, false])
  test(`network enrollment failure reads back before another enrollment; accepted=${acceptedFailure}`, async ({
    page,
  }) => {
    await mount(page);
    await expect(page.getByRole("img")).toBeVisible();
    await flags(page, { fail: "auth/network-request-failed", acceptedFailure });
    await otp(page).fill("123456");
    await expect(page.getByRole("alert")).toContainText(
      "Kiểm tra lại trạng thái",
    );
    await expect(page.getByTestId("workspace")).toHaveText("Workspace blocked");
    await expect(page.locator(".securityKey")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true }),
    ).toHaveCount(0);
    await flags(page, { fail: "" });
    await page
      .getByRole("button", { name: "Kiểm tra lại", exact: true })
      .click();
    if (acceptedFailure) {
      await expect(page.getByTestId("workspace")).toHaveText("Workspace ready");
      expect(await count(page, "enroll")).toBe(1);
    } else {
      await expect(page.getByRole("alert")).toContainText(
        "Chưa đăng ký ứng dụng",
      );
      await page
        .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
        .click();
      await expect(page.getByRole("img")).toBeVisible();
      await otp(page).fill("654321");
      await expect(page.getByTestId("workspace")).toHaveText("Workspace ready");
      expect(await count(page, "enroll")).toBe(2);
    }
  });
test("verified staff with unreadable enrollment can retry without granting Workspace", async ({
  page,
}) => {
  await mount(page, { reloadFail: true });
  await expect(setup(page)).toBeVisible();
  await expect(setup(page)).toContainText("Chưa kiểm tra được");
  await expect(page.getByTestId("workspace")).toHaveText("Workspace blocked");
  await flags(page, { reloadFail: false });
  await setup(page)
    .getByRole("button", { name: "Thử lại", exact: true })
    .click();
  await expect(page.getByRole("img")).toBeVisible();
});
test("QR and clipboard failure retain manual alternative; signout clears setup", async ({
  page,
}) => {
  await mount(page, { qrFail: true });
  await expect(
    page.getByText("Không tạo được mã QR. Bạn có thể nhập khóa bên dưới."),
  ).toBeVisible();
  await flags(page, { copyFail: true });
  await page.getByRole("button", { name: "Sao chép khóa thiết lập" }).click();
  await expect(page.getByRole("alert")).toContainText("Không sao chép được");
  await expect(page.locator(".securityKey")).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(setup(page)).toHaveCount(0);
  await expect(page.locator(".securityKey")).toHaveCount(0);
});
test("identical role snapshot does not regenerate QR; revocation ignores late verification", async ({
  page,
}) => {
  await mount(page);
  await expect(page.getByRole("img")).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as { access: (role: object) => void }).access({
      active: true,
      roles: ["OWNER"],
    }),
  );
  await expect(page.getByRole("img")).toBeVisible();
  expect(await count(page, "generate")).toBe(1);
  await flags(page, { delay: 500 });
  await otp(page).fill("123456");
  await page.evaluate(() =>
    (window as unknown as { access: (role: null) => void }).access(null),
  );
  await expect(setup(page)).toHaveCount(0);
  await page.waitForTimeout(650);
  await expect(page.getByTestId("workspace")).toHaveText("Workspace blocked");
  await expect(
    page.getByText("Đã bật xác thực hai bước.", { exact: true }),
  ).toHaveCount(0);
});
test("signout during generation ignores late secret response", async ({
  page,
}) => {
  await mount(page, { generateDelay: 500 });
  await expect(setup(page)).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.waitForTimeout(650);
  await expect(page.locator(".securityKey")).toHaveCount(0);
  await expect(setup(page)).toHaveCount(0);
});
test("customer MFA challenge auto-submits, reports network failure and restores focus on cancellation", async ({
  page,
}) => {
  await mount(page, { customer: true });
  const trigger = page.getByRole("button", {
    name: "Đăng nhập thử",
    exact: true,
  });
  await trigger.click();
  const input = page.getByRole("textbox", { name: "Mã xác thực", exact: true });
  await expect(input).toBeFocused();
  await flags(page, { fail: "auth/network-request-failed" });
  await input.fill("123456");
  await expect(page.getByRole("alert")).toContainText("Kiểm tra mạng");
  await expect(input).toBeFocused();
  expect(await count(page, "verify")).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await flags(page, { fail: "" });
  await trigger.click();
  await input.fill("654 321");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await count(page, "verify")).toBe(2);
  expect(await count(page, "enroll")).toBe(0);
});
test("replacement sign-in challenge remains busy despite old request finishing", async ({
  page,
}) => {
  await mount(page, { customer: true });
  await page
    .getByRole("button", { name: "Đăng nhập thử", exact: true })
    .click();
  await flags(page, { delay: 350 });
  const input = page.getByRole("textbox", { name: "Mã xác thực", exact: true });
  await input.fill("123456");
  await page.evaluate(() => {
    const w = window as unknown as {
      challenge: (id: string) => object;
      startChallenge: (r: object) => void;
    };
    w.startChallenge(w.challenge("replacement"));
  });
  await expect(input).toHaveValue("");
  await flags(page, { delay: 750 });
  await input.fill("654321");
  await page.waitForTimeout(450);
  await expect(input).toBeDisabled();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await count(page, "verify")).toBe(2);
});
test("unsupported challenge offers cancellation without submitting an empty factor", async ({
  page,
}) => {
  await mount(page, { customer: true });
  await page
    .getByRole("button", { name: "Đăng nhập thử", exact: true })
    .focus();
  await page.evaluate(() => {
    (
      window as unknown as { startChallenge: (r: object) => void }
    ).startChallenge({
      hints: [],
      resolveSignIn: async () => {
        throw Error("must not submit unsupported factor");
      },
    });
  });
  await expect(page.getByRole("alert")).toContainText("chưa được hỗ trợ");
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Tiếp tục", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await count(page, "verify")).toBe(0);
});
test("expired sign-in session keeps a clear exit and allows a fresh challenge", async ({
  page,
}) => {
  await mount(page, { customer: true });
  await page
    .getByRole("button", { name: "Đăng nhập thử", exact: true })
    .click();
  await flags(page, { fail: "auth/session-expired" });
  const input = page.getByRole("textbox", { name: "Mã xác thực", exact: true });
  await input.fill("123456");
  await expect(page.getByRole("alert")).toContainText(
    "Phiên đăng nhập đã hết hạn",
  );
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await flags(page, { fail: "" });
  await page
    .getByRole("button", { name: "Đăng nhập thử", exact: true })
    .click();
  await input.fill("654321");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
for (const width of [320, 390, 1440])
  test(`dialog layout, keyboard and synthetic visual evidence ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = await mount(page);
    await expect(page.getByRole("img")).toBeVisible();
    await expect(otp(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(setup(page)).toBeVisible();
    await page.getByRole("button", { name: "Sao chép khóa thiết lập" }).focus();
    const beforeCopy = await otp(page).boundingBox();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Đã sao chép", { exact: true })).toBeVisible();
    const afterCopy = await otp(page).boundingBox();
    expect(Math.abs(afterCopy!.y - beforeCopy!.y)).toBeLessThan(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await setup(page).evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    const qrBox = await page.getByRole("img").boundingBox();
    const manualBox = await page.locator(".securityKeyRow").boundingBox();
    expect(manualBox!.y).toBeGreaterThan(qrBox!.y + qrBox!.height);
    await mkdir("output/login105", { recursive: true });
    await page.screenshot({
      path: `output/login105/setup-${width}-synthetic.png`,
    });
    if (width === 1440) {
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      expect(
        await setup(page).evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await page.screenshot({
        path: "output/login105/setup-zoom-synthetic.png",
      });
    }
    expect(errors).toEqual([]);
  });
