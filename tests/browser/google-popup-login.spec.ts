import { test, expect, type Page } from "@playwright/test";
declare global {
  interface Window {
    __loginFixture: { mode: string; calls: number; services: string[]; emit(uid: string | null): void };
    cartBeforeLogin: string | null;
  }
}

// Real App, forms, CartProvider and login controller on the existing 5207
// runtime. Only SDK/provider/transport are synthetic: no Google credentials,
// backend writes, emulator reseed or additional server.
const base = "http://127.0.0.1:5207";
const guestKey = "satsunicgo-cart-v1:demo-satsunicgo:guest";
const item = {
  lineId: "11111111-1111-4111-8111-111111111111",
  productId: "popup-fixture-product", variant: "", quantity: 2,
};
async function mount(page: Page, path = "/request", blockedStorage = false) {
  const errors: string[] = [];
  // Share the exact Vite HMR module identity with the real dialog store.
  const transformedDialog = await (await page.request.get(`${base}/src/features/auth/GoogleLoginDialog.tsx`)).text();
  const controllerUrl = transformedDialog.match(/from ["']([^"']*google-popup-login\.ts[^"']*)["']/)?.[1];
  if (!controllerUrl) throw Error("Cannot resolve the dialog's login controller");
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(({ key, item, blockedStorage }) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, revision: 1, items: [item], appliedMerges: [] }));
    localStorage.setItem("sg:analytics-consent:v1", "no");
    if (blockedStorage) {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key.includes("satsunicgo-cart-v1") && !(window as unknown as { allowCartStorage?: boolean }).allowCartStorage)
          throw new DOMException("Synthetic storage quota", "QuotaExceededError");
        return original.call(this, key, value);
      };
    }
  }, { key: guestKey, item, blockedStorage });
  await page.route("https://**/*", (route) => route.abort());
  await page.route("**/firebase_auth.js*", (route) => route.fulfill({
    contentType: "text/javascript", body: `export * from '/__google-popup-sdk.js';`,
  }));
  await page.route("**/firebase_firestore.js*", (route) => route.fulfill({
    contentType: "text/javascript", body: `export {doc,onSnapshot,collection,query,where,limit,orderBy,documentId,getDoc,getDocFromServer,getDocs,getDocsFromServer,startAfter} from '/__google-popup-sdk.js';`,
  }));
  await page.route("**/src/shared/firebase.ts*", (route) => route.fulfill({
    contentType: "text/javascript", body: `
      import {auth as a,signInWithPopup,emit,service} from '/__google-popup-sdk.js';
      import {googlePopupLogin} from ${JSON.stringify(controllerUrl)};
      export const auth=a,db={},configured=true,emulatorMode=false,betaRelease=false,functions=null,app={options:{projectId:'demo-satsunicgo'}};
      export const login=()=>googlePopupLogin(()=>signInWithPopup(),()=>false);
      export async function logout(){emit(null)}
      export const callService=service;
      export async function sendCommand(){throw Error('Synthetic writes blocked')}
    `,
  }));
  await page.route("**/__google-popup-sdk.js", (route) => route.fulfill({
    contentType: "text/javascript", body: `
      const listeners=new Set(); export const auth={currentUser:null};
      let success,failure,timer,provider;
      const user=uid=>({uid,emailVerified:true,displayName:'Popup fixture',email:'fixture@example.invalid',photoURL:null,
        providerData:[{providerId:'google.com'}],reload:async()=>{},getIdToken:async()=> 'synthetic',getIdTokenResult:async()=>({claims:{},authTime:new Date().toISOString()})});
      export function emit(uid){auth.currentUser=uid?user(uid):null;for(const listener of listeners)listener(auth.currentUser)}
      export function onAuthStateChanged(a,listener){listeners.add(listener);queueMicrotask(()=>listeners.has(listener)&&listener(a.currentUser));return()=>listeners.delete(listener)}
      const cart=()=>({ownerId:auth.currentUser?.uid||'guest',revision:0,updatedAt:0,items:[]});
      export const fixture={calls:0,mode:'popup',services:[],carts:{},emit,
        complete(uid='owner-a'){clearInterval(timer);emit(uid);success?.({user:auth.currentUser})},
        fail(code){clearInterval(timer);failure?.({code,message:'PRIVATE_PROVIDER_PAYLOAD'})}};
      window.__loginFixture=fixture;
      export function signInWithPopup(){fixture.calls++;if(fixture.mode!=='popup')return Promise.reject({code:fixture.mode});
        provider=window.open('/__google-popup-provider','google-popup-fixture','width=400,height=600');
        if(!provider)return Promise.reject({code:'auth/popup-blocked'});
        return new Promise((resolve,reject)=>{success=resolve;failure=reject;timer=setInterval(()=>{if(provider.closed){clearInterval(timer);reject({code:'auth/popup-closed-by-user'})}},100)})}
      export class GoogleAuthProvider{static credential(){return {}}}
      export async function signInWithCredential(){throw Error('Synthetic OneTap disabled')}
      export const multiFactor=()=>({enrolledFactors:[]});
      export const TotpMultiFactorGenerator={FACTOR_ID:'totp',assertionForSignIn:()=>({})};
      export function getMultiFactorResolver(){throw Error('Synthetic MFA not used')}
      export async function reauthenticateWithPopup(){throw Error('Synthetic reauthentication not used')}
      export const doc=(db,...path)=>({path:path.join('/')});
      export const collection=doc,query=(q,...rest)=>({...q,rest}),where=(...v)=>v,limit=n=>n,orderBy=(...v)=>v,documentId=()=>'',startAfter=()=>'';
      function snapshot(ref){const value=ref.path?.startsWith('carts/')?(fixture.carts[auth.currentUser?.uid]||cart()):undefined;
        return {exists:()=>value!==undefined,data:()=>value,docs:[],empty:true,docChanges:()=>[],metadata:{fromCache:false},id:'synthetic'}}
      const snapshots=new Set();
      export function onSnapshot(ref,options,next){if(typeof options==='function')next=options;const receive=()=>next(snapshot(ref));snapshots.add(receive);queueMicrotask(()=>snapshots.has(receive)&&receive());return()=>snapshots.delete(receive)}
      export async function getDoc(ref){return snapshot(ref)} export const getDocFromServer=getDoc;
      export async function getDocs(ref){return ref?.path==='products'?{docs:[{id:'popup-fixture-product',data:()=>({title:'Fixture product',slug:'fixture-product',body:'',status:'published',market:'US',version:1,orderable:true,listedPrice:250000,termsVersion:'fixture-v1',catalogOptions:[]})}],empty:false}:{docs:[],empty:true}}
      export const getDocsFromServer=getDocs;
      export async function service(name,input){fixture.services.push(name);
        if(name==='currentAskConversation')return {conversationId:null};
        if(name==='cartCommand'){const previous=fixture.carts[auth.currentUser.uid]||cart();
          const next={...previous,revision:previous.revision+1,items:input.items||previous.items};
          fixture.carts[auth.currentUser.uid]=next;for(const receive of snapshots)receive();return next}
        if(name==='purchaseCheckoutSetup')return {regions:[],shipping:null,shippingOrigin:'US',pricing:{},paymentCapabilities:{}};
        throw Object.assign(Error('Synthetic service unavailable'),{code:'functions/unavailable'})}
    `,
  }));
  await page.context().route("**/__google-popup-provider", (route) => route.fulfill({
    contentType: "text/html", body: `<!doctype html><html lang="en"><title>Synthetic Google provider</title><h1>Synthetic Google provider</h1><button onclick="opener.__loginFixture.complete('owner-a');setTimeout(()=>window.close(),150)">Complete synthetic login</button><button onclick="opener.__loginFixture.fail('auth/popup-closed-by-user');setTimeout(()=>window.close(),150)">Cancel</button></html>`,
  }));
  await page.goto(`${base}${path}`);
  await expect(page.locator("#main")).toBeVisible();
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  return errors;
}
const dialog = (page: Page) => page.getByRole("dialog", { name: "Đăng nhập với Google", exact: true });
async function loginButton(page: Page) {
  // Header account link is navigation; use the actual form/cart Google button.
  if (new URL(page.url()).pathname === "/request") {
    await page.getByLabel("Tên, link hoặc ảnh sản phẩm", { exact: true }).fill("Áo đang chọn");
    await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
    await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  }
  return page.getByRole("button", { name: /Đăng nhập.*Google/ }).first();
}

test("request text, incomplete price, image and step survive popup success on the exact URL", async ({ page }) => {
  const errors = await mount(page, "/request?name=Product&market=US#draft");
  const content = page.getByLabel("Tên, link hoặc ảnh sản phẩm", { exact: true });
  await content.fill("Áo chưa nhập xong / incomplete URL https://");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "reference.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
  await expect(page.locator(".composerImages img")).toHaveCount(1);
  // Invoke the central login through a real click without validating/submitting
  // the draft: users can sign in from any entry point while editing.
  await page.evaluate(() => {
    const button = document.createElement("button"); button.id = "fixture-login"; button.textContent = "Fixture sign in";
    document.body.append(button);
  });
  // Preload so the actual invocation below remains synchronous with click.
  await page.evaluate(async () => { const path = "/src/shared/firebase.ts"; const m = await import(path); document.getElementById("fixture-login")!.onclick = () => { void m.login().catch(() => {}); }; });
  const before = page.url();
  const popupWait = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Fixture sign in" }).click();
  const popup = await popupWait;
  await expect(dialog(page)).toBeVisible();
  const bounds = await dialog(page).boundingBox();
  const viewport = page.viewportSize()!;
  expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(2);
  expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2)).toBeLessThan(2);
  expect(await dialog(page).evaluate(el => getComputedStyle(el, "::backdrop").backdropFilter)).toContain("blur");
  await page.screenshot({ path: `/private/tmp/google-popup-${test.info().project.name}-pending.png` });
  await popup.getByRole("button", { name: "Complete synthetic login" }).click();
  await expect(dialog(page)).not.toBeVisible();
  await expect(content).toHaveValue("Áo chưa nhập xong / incomplete URL https://");
  await expect(page.locator(".composerImages img")).toHaveCount(1);
  expect(page.url()).toBe(before);
  expect(errors).toEqual([]);
});

test("blocked popup offers in-place retry, keyboard dismissal and copy failure recovery", async ({ page }) => {
  const errors = await mount(page, "/account?view=orders#keep");
  const before = page.url();
  await page.evaluate(() => { window.__loginFixture.mode = "auth/popup-blocked"; });
  await (await loginButton(page)).focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toContainText("Cho phép cửa sổ bật lên");
  await expect(page.locator('.siteToast[data-kind="error"]')).toHaveCount(0);
  await expect(dialog(page).getByRole("button", { name: "Thử lại với Google" })).toBeEnabled();
  await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw Error("fixture denied"); } } }); });
  await dialog(page).getByRole("button", { name: "Sao chép liên kết" }).click();
  await expect(dialog(page)).toContainText("thanh địa chỉ");
  await page.keyboard.press("Escape");
  await expect(dialog(page)).not.toBeVisible();
  await expect(await loginButton(page)).toBeFocused();
  expect(page.url()).toBe(before);
  expect(errors).toEqual([]);
});

test("cart stays on the same page, cancellation retains items and retry merges once", async ({ page }) => {
  const errors = await mount(page, "/cart?source=mobile#items");
  await expect(page.locator(".cartQuantity107 output").first()).toHaveText("2");
  const before = page.url();
  let wait = page.waitForEvent("popup");
  await (await loginButton(page)).click();
  let popup = await wait;
  await expect(dialog(page)).toBeVisible();
  const closed = popup.waitForEvent("close");
  await popup.getByRole("button", { name: "Cancel", exact: true }).click();
  await closed;
  await expect(dialog(page)).toContainText("Đã đóng cửa sổ");
  await page.evaluate(() => { window.cartBeforeLogin = localStorage.getItem("satsunicgo-cart-v1:demo-satsunicgo:guest"); });
  wait = page.waitForEvent("popup");
  await dialog(page).getByRole("button", { name: "Thử lại với Google" }).click();
  await expect.poll(() => page.evaluate(() => window.__loginFixture.calls)).toBe(2);
  popup = await wait;
  await popup.getByRole("button", { name: "Complete synthetic login" }).click();
  await expect(dialog(page)).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__loginFixture.services.filter((x: string) => x === "cartCommand").length)).toBe(1);
  await expect(page.locator(".cartQuantity107 output").first()).toHaveText("2");
  expect(page.url()).toBe(before);
  expect(errors).toEqual([]);
});

test("guest request survives login but is discarded on logout and private account switch", async ({ page }) => {
  const errors = await mount(page);
  const input = page.getByLabel("Tên, link hoặc ảnh sản phẩm", { exact: true });
  await input.fill("Guest unfinished work");
  await page.evaluate(() => window.__loginFixture.emit("owner-a"));
  await expect(input).toHaveValue("Guest unfinished work");
  await input.fill("Private owner A work");
  await page.evaluate(() => window.__loginFixture.emit("owner-b"));
  await expect(input).not.toHaveValue("Private owner A work");
  await input.fill("Private owner B work");
  await page.evaluate(() => window.__loginFixture.emit(null));
  await expect(input).not.toHaveValue("Private owner B work");
  expect(errors).toEqual([]);
});

test("320px recovery dialog remains readable at doubled text size and retains focus inside", async ({ page }) => {
  const errors = await mount(page, "/account");
  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; window.__loginFixture.mode = "auth/operation-not-supported-in-this-environment"; });
  await (await loginButton(page)).click();
  await expect(dialog(page)).toContainText("Safari");
  await expect(dialog(page).getByRole("heading")).toBeInViewport();
  await page.screenshot({ path: `/private/tmp/google-popup-${test.info().project.name}-recovery.png` });
  await page.keyboard.press("Tab");
  expect(await dialog(page).evaluate(el => el.contains(document.activeElement))).toBe(true);
  expect(await dialog(page).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(dialog(page).getByRole("button", { name: "Thử lại với Google" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog(page).getByRole("button", { name: "Quay lại trang" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("real request login button preserves the review step and never submits automatically", async ({ page }) => {
  const errors = await mount(page);
  await page.getByLabel("Tên, link hoặc ảnh sản phẩm", { exact: true }).fill("Áo cotton đang chọn");
  await page.getByRole("textbox", { name: /Giá bạn đã tìm hiểu/ }).fill("23.50");
  await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await page.getByLabel("Ghi chú", { exact: true }).fill("Giữ ghi chú đang nhập");
  await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  const before = page.url(), wait = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Đăng nhập để thêm vào giỏ →", exact: true }).click();
  const popup = await wait;
  await popup.getByRole("button", { name: "Complete synthetic login" }).click();
  await expect(page.getByRole("button", { name: "Thêm vào giỏ hàng →", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kiểm tra yêu cầu", exact: true })).toBeVisible();
  await expect(page.getByText("Giữ ghi chú đang nhập", { exact: true }).last()).toBeVisible();
  expect(await page.evaluate(() => window.__loginFixture.services.includes("purchaseCheckout"))).toBe(false);
  expect(page.url()).toBe(before); expect(errors).toEqual([]);
});

test("private uncertain request is admitted after guest login instead of creating a new command", async ({ page }) => {
  const errors = await mount(page);
  await page.getByLabel("Tên, link hoặc ảnh sản phẩm", { exact: true }).fill("Guest draft");
  await page.evaluate(() => {
    sessionStorage.setItem("request-cart-pending:owner-a", JSON.stringify({ cartRevision: 0, operationId: "22222222-2222-4222-8222-222222222222", payload: "{}", images: [] }));
    window.__loginFixture.emit("owner-a");
  });
  await expect(page.getByRole("button", { name: "Kiểm tra lại lần thêm", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__loginFixture.services.includes("purchaseCheckout"))).toBe(false);
  expect(errors).toEqual([]);
});

test("Ask unsubmitted composer survives first login", async ({ page }) => {
  const errors = await mount(page, "/fees?source=mobile#ask");
  const input = page.getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true }).first();
  await input.fill("Câu hỏi mình đang viết dở");
  await page.evaluate(() => window.__loginFixture.emit("owner-a"));
  await expect(input).toHaveValue("Câu hỏi mình đang viết dở");
  expect(page.url()).toBe(`${base}/fees?source=mobile#ask`); expect(errors).toEqual([]);
});

test("storage quota retains guest quantity through login and retries transfer only after storage recovers", async ({ page }) => {
  const errors = await mount(page, "/cart", true);
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
  await expect(page.locator(".cartQuantity107 output").first()).toHaveText("3");
  await page.evaluate(() => window.__loginFixture.emit("owner-a"));
  await expect(page.locator(".cartQuantity107 output").first()).toHaveText("3");
  await expect(page.getByText("Giỏ chỉ được giữ trong trang này", { exact: false }).first()).toBeVisible();
  // Wait for the automatic transfer to finish failing before restoring storage;
  // otherwise recovery can race that still-running attempt and need no retry.
  const retry = page.getByRole("button", { name: "Thử lại", exact: true }).first();
  await expect(retry).toBeVisible();
  expect(await page.evaluate(() => window.__loginFixture.services.filter(x => x === "cartCommand").length)).toBe(0);
  await page.evaluate(() => { (window as unknown as { allowCartStorage: boolean }).allowCartStorage = true; });
  await retry.click();
  await expect.poll(() => page.evaluate(() => window.__loginFixture.services.filter(x => x === "cartCommand").length)).toBe(1);
  await expect(page.locator(".cartQuantity107 output").first()).toHaveText("3");
  expect(errors).toEqual([]);
});
