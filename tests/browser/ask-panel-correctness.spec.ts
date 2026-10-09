import { test, expect, type Page } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const cid = "55555555-1111-4111-8111-111111111111";
const draft = {
  market: "US",
  items: [{ name: "Synthetic product", quantity: 1, variant: "Blue", url: "" }],
  notes: "",
};
type Fixture = Window & {
  qaPaymentCalls: unknown[];
  qaCommands: {
    action: string;
    payload: { items?: { quantity: number }[] };
    expectedVersion: number;
  }[];
  qaEmitConversation: (patch: Record<string, unknown>) => void;
  qaEmitOrder: (patch: Record<string, unknown>) => void;
  qaEmitRecipient: () => void;
  qaRecipient: Record<string, unknown>;
  qaHoldRecipientReadback: boolean;
  qaEmitStaleRecipient: () => void;
  qaErrorRecipient: () => void;
  qaSwitch: () => void;
  qaRelease: () => void;
};
async function setup(page: Page, mode = "draft", english = false) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const source = await (
    await page.request.get("/src/features/ask/Ask.tsx")
  ).text();
  const entry = await (await page.request.get("/src/app/main.tsx")).text();
  const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
  const router = source.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1];
  const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
  const orderMode =
    mode.startsWith("recipient") || mode === "auth" || mode === "version";
  const turns =
    mode === "performance"
      ? Array.from({ length: 24 }, (_, i) => ({
          id: `66666666-1111-4111-8111-${String(i).padStart(12, "0")}`,
          question: `Synthetic restored question ${i}`,
          answer: {
            language: "vi",
            title: `Synthetic answer ${i}`,
            paragraphs: ["Synthetic bounded answer. ".repeat(20)],
            bullets: [],
            sourceIds: [],
            action: "home",
          },
        }))
      : english
        ? [
            {
              id: "66666666-1111-4111-8111-111111111111",
              question: "answer in english",
              answer: {
                language: "en",
                title: "English preference",
                paragraphs: ["Synthetic language preference"],
                bullets: [],
                sourceIds: [],
                action: "home",
              },
            },
          ]
        : [];
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
    export const auth={currentUser:{uid:'qa-panel-owner'}},db={},functions=null,app=null,configured=false,emulatorMode=true;export const login=async()=>{};
    window.qaCommands=[];window.qaPaymentCalls=[];
    export async function callService(name,data){
      if(name==='currentAskConversation')return {conversationId:'${cid}'};
      if(name==='createPaymentLink'){window.qaPaymentCalls.push(data);return {checkoutUrl:'https://pay.payos.vn/synthetic-local-only'}};
      if(name!=='askWorkflow')throw Error('Unexpected local API '+name);
      window.qaCommands.push(data);
      if('${mode}'==='recipient-failure'&&data.action==='saveRecipient')throw Object.assign(Error('Synthetic save rejected'),{code:'functions/failed-precondition'});
      if('${mode}'==='draft-failure'&&data.action==='saveDraft')throw Object.assign(Error('Synthetic draft save rejected'),{code:'functions/failed-precondition'});
      if('${mode}'==='recipient-held'&&data.action==='saveRecipient')await new Promise(r=>window.qaRelease=r);
      if('${mode}'==='recipient-error-held'&&data.action==='saveRecipient'){window.qaRecipient={...data.payload,ownerId:'qa-panel-owner'};window.qaEmitRecipient();await new Promise(r=>window.qaRelease=r);}
      if(['saveDraft','saveTurn','saveRecipient'].includes(data.action)){
        const patch={version:data.expectedVersion+1};
        if(data.action==='saveDraft')patch.draft=data.payload;
        if(data.action==='saveRecipient'){patch.recipientSaved=true;window.qaRecipient={...data.payload,ownerId:'qa-panel-owner'};if('${mode}'==='recipient-delayed')window.qaHoldRecipientReadback=true;if(!['recipient-delayed','recipient-error-held'].includes('${mode}'))window.qaEmitRecipient();}
        if(data.action==='saveTurn')patch.turns=[...window.qaConversation.turns,data.payload];
        window.qaEmitConversation(patch);return {version:patch.version};
      }
      return {id:'qa-panel-order',version:data.expectedVersion+2};
    }`,
    }),
  );
  await page.route("**/*firebase_auth.js*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `const listeners=new Set();export function onAuthStateChanged(auth,fn){listeners.add(fn);queueMicrotask(()=>fn(auth.currentUser));window.qaSwitch=()=>{auth.currentUser={uid:'qa-other'};for(const f of listeners)f(auth.currentUser)};return()=>listeners.delete(fn)}`,
    }),
  );
  await page.route("**/*firebase_firestore.js*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
    export const doc=(_,kind,id)=>({kind,id}),collection=(_,kind)=>({kind}),query=x=>x,where=()=>null,limit=()=>null,orderBy=()=>null,documentId=()=>null,startAfter=()=>null;export const getDocs=async()=>({docs:[]});
    window.qaConversation={ownerId:'qa-panel-owner',version:0,updatedAt:Date.now(),turns:${JSON.stringify(turns)},draft:${JSON.stringify(mode === "performance" ? { ...draft, items: Array.from({ length: 30 }, (_, i) => ({ ...draft.items[0], name: `Synthetic item ${i}` })) } : mode === "normalized" ? { market: "US", items: [{ name: "  Synthetic product  ", quantity: 1 }] } : draft)},${orderMode ? "orderId:'qa-panel-order',recipientSaved:true" : ""}};
    window.qaOrder={id:'qa-panel-order',ownerId:'qa-panel-owner',market:'US',items:${JSON.stringify(draft.items)},notes:'',stage:'QUOTED',version:2,createdAt:1,collected:0,refunded:0,quoteVersion:1,deposit:500,quote:{goods:1000,service:0,sourceCosts:0,internationalShipping:0,destinationShipping:0,discount:0,sourceCurrency:'USD',sourceMinor:100,fxNumerator:10,fxDenominator:1,verifiedProduct:'Synthetic quote',termsVersion:'qa-v1',expiresAt:Date.now()+600000}};
    window.qaRecipient={recipient:'Synthetic recipient',phone:'0000000000',address:'Synthetic saved address A',ownerId:'qa-panel-owner'};
    const listeners=new Map(),errors=new Map();const snapshot=kind=>({metadata:{fromCache:false},docs:[],data:()=>kind==='askConversations'?window.qaConversation:kind==='orders'?window.qaOrder:kind==='orderRecipients'?window.qaRecipient:undefined,exists:()=>true});
    const emit=kind=>{for(const fn of listeners.get(kind)||[])fn(snapshot(kind))};
    window.qaEmitConversation=patch=>{window.qaConversation={...window.qaConversation,...patch};emit('askConversations')};window.qaEmitOrder=patch=>{window.qaOrder={...window.qaOrder,...patch};emit('orders')};window.qaEmitRecipient=()=>{window.qaHoldRecipientReadback=false;emit('orderRecipients')};
    window.qaErrorRecipient=()=>{window.qaHoldRecipientReadback=true;for(const fn of errors.get('orderRecipients')||[])fn(Error('Synthetic recipient subscription failure'))};
    export function onSnapshot(ref,...args){const functions=args.filter(x=>typeof x==='function'),ok=functions[0],fail=functions[1];const set=listeners.get(ref.kind)||new Set(),errorSet=errors.get(ref.kind)||new Set();listeners.set(ref.kind,set);errors.set(ref.kind,errorSet);set.add(ok);if(fail)errorSet.add(fail);if(ref.kind==='orderRecipients'&&!window.qaEmitStaleRecipient){const initial=snapshot(ref.kind),recipient={...window.qaRecipient};window.qaEmitStaleRecipient=()=>ok({...initial,data:()=>recipient})}queueMicrotask(()=>{if(set.has(ok)&&!(ref.kind==='orderRecipients'&&window.qaHoldRecipientReadback))ok(snapshot(ref.kind))});return()=>{set.delete(ok);errorSet.delete(fail)}}
  `,
    }),
  );
  await page.route("**/src/features/ask/ImageIntake.tsx*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "export const useAskImages=()=>({photos:[],working:false,prepare:async()=>[],markSent:()=>{},add:()=>{},remove:()=>{}});",
    }),
  );
  await page.route("**/src/features/ask/transport.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export const askRateLimited=()=>false;export async function askService(){return {language:'${english ? "en" : "vi"}',title:'Synthetic answer',paragraphs:['Synthetic unrelated answer'],bullets:[],sourceIds:[],action:'none'}}`,
    }),
  );
  await page.route("**/qa-panel-correctness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<title>Ask correctness fixture</title><div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const{Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask)));</script>`,
    }),
  );
  if (process.env.ASK_PANEL_BASELINE === "1") {
    for (const name of ["Ask", "Commerce"])
      await page.route(`**/src/features/ask/${name}.tsx*`, (route) =>
        route.fulfill({
          contentType: "text/javascript",
          body: readFileSync(
            `output/ask-panel-correctness/baseline/${name}.transformed.js`,
            "utf8",
          ),
        }),
      );
  }
  await page.goto("/qa-panel-correctness");
  await expect(
    page.getByRole("button", {
      name: english ? "Continue conversation" : "Tiếp tục hội thoại",
    }),
  )
    .toBeVisible({ timeout: 5000 })
    .catch(() => {
      throw Error(`Fixture failed to mount: ${JSON.stringify(errors)}`);
    });
  await page
    .getByRole("button", {
      name: english ? "Continue conversation" : "Tiếp tục hội thoại",
    })
    .click();
  await expect(page.getByRole("log")).toBeVisible();
  await expect(page).toHaveTitle("Ask correctness fixture");
  return errors;
}
async function chat(page: Page, text: string) {
  const input = page
    .getByRole("textbox", { name: /Hỏi SatsunicGo|Ask SatsunicGo/ })
    .filter({ visible: true });
  await input.fill(text);
  await input.press("Enter");
  await expect(page.locator("[data-ask-turn]").last()).toContainText(text);
  await expect(
    page.locator("[data-ask-turn]").last().locator("h2"),
  ).toBeVisible();
}
async function commands(page: Page, action: string) {
  return page.evaluate(
    (action) =>
      (window as unknown as Fixture).qaCommands.filter(
        (c) => c.action === action,
      ),
    action,
  );
}
for (const english of [false, true])
  test(`manual dirty button/chat parity ${english ? "EN" : "VI"}`, async ({
    page,
  }) => {
    const errors = await setup(page, "draft", english);
    await page
      .getByText(
        english ? "Enter details if needed" : "Điền thông tin nếu cần",
        { exact: true },
      )
      .click();
    await page.locator('input[name="quantity-0"]').fill("3");
    await expect(
      page.getByRole("button", {
        name: english ? "Send buying request" : "Gửi yêu cầu mua hộ",
        exact: true,
      }),
    ).toBeDisabled();
    await chat(page, english ? "submit buying request" : "gửi yêu cầu mua hộ");
    expect(await commands(page, "submitRequest")).toEqual([]);
    await expect(page.locator('input[name="quantity-0"]')).toHaveValue("3");
    await page
      .getByRole("button", {
        name: english ? "Save draft" : "Lưu bản nháp",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: english ? "Send buying request" : "Gửi yêu cầu mua hộ",
        exact: true,
      })
      .click();
    const sent = await commands(page, "submitRequest");
    expect(sent).toHaveLength(1);
    expect(sent[0].payload.items![0].quantity).toBe(3);
    expect(errors).toEqual([]);
  });
test("manual failed save preserves visible edit", async ({ page }) => {
  await setup(page, "draft-failure");
  await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
  await page.locator('input[name="quantity-0"]').fill("4");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page.locator('input[name="quantity-0"]')).toBeVisible();
  await expect(page.locator('input[name="quantity-0"]')).toHaveValue("4");
  await expect(
    page.getByRole("button", { name: "Gửi yêu cầu mua hộ", exact: true }),
  ).toBeDisabled();
});
test("clean remote snapshot rebases real hook before submission", async ({
  page,
}) => {
  const errors = await setup(page);
  await page.evaluate(
    (d) =>
      (window as unknown as Fixture).qaEmitConversation({
        version: 1,
        draft: d,
      }),
    { ...draft, items: [{ ...draft.items[0], quantity: 2 }] },
  );
  await expect(
    page.getByRole("region", { name: "Yêu cầu mua hộ trong chat" }),
  ).toContainText("Synthetic product · Blue · 2");
  await page
    .getByRole("button", { name: "Gửi yêu cầu mua hộ", exact: true })
    .click();
  const sent = await commands(page, "submitRequest");
  expect(sent[0].expectedVersion).toBe(1);
  expect(sent[0].payload.items![0].quantity).toBe(2);
  expect(errors).toEqual([]);
});
test("dirty remote snapshot cannot silently rebase manual payload", async ({
  page,
}) => {
  await setup(page);
  await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
  await page.locator('input[name="quantity-0"]').fill("3");
  await page.evaluate(
    (d) =>
      (window as unknown as Fixture).qaEmitConversation({
        version: 1,
        draft: d,
      }),
    { ...draft, items: [{ ...draft.items[0], quantity: 2 }] },
  );
  await expect(page.locator('input[name="quantity-0"]')).toHaveValue("3");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  expect(await commands(page, "saveDraft")).toEqual([]);
  await chat(page, "gửi yêu cầu mua hộ");
  expect(await commands(page, "submitRequest")).toEqual([]);
});
for (const mode of [
  "recipient",
  "recipient-failure",
  "recipient-held",
  "recipient-whitespace",
])
  test(`saved delivery and chat readiness ${mode}`, async ({ page }) => {
    const errors = await setup(page, mode);
    const details = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Giao đến" }) });
    await details.locator("summary").click();
    await details
      .getByRole("button", { name: "Kiểm tra / sửa địa chỉ" })
      .click();
    await page
      .getByRole("textbox", { name: "Địa chỉ nhận" })
      .fill(
        mode === "recipient-whitespace"
          ? "  Synthetic edited address B  "
          : "Synthetic edited address B",
      );
    if (mode === "recipient-whitespace") {
      await page
        .getByRole("textbox", { name: "Người nhận" })
        .fill("  Synthetic recipient  ");
      await page
        .getByRole("textbox", { name: "Số điện thoại" })
        .fill("  0000000000  ");
    }
    await expect(details).toContainText("Synthetic saved address A");
    await expect(details).not.toContainText("Synthetic edited address B");
    await chat(page, "chấp nhận báo giá");
    expect(await commands(page, "acceptQuote")).toEqual([]);
    await page
      .getByRole("button", { name: "Lưu thông tin nhận hàng", exact: true })
      .click();
    if (mode === "recipient-held") {
      await page
        .getByRole("textbox", { name: "Địa chỉ nhận" })
        .fill("Synthetic newer edit C");
      await page.evaluate(() => (window as unknown as Fixture).qaRelease());
    }
    if (mode === "recipient" || mode === "recipient-whitespace") {
      await expect(
        page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
      ).toBeEnabled();
      await expect(
        page.getByRole("textbox", { name: "Địa chỉ nhận" }),
      ).not.toBeVisible();
      await expect(details).toContainText("Synthetic edited address B");
    } else {
      await expect(
        page.getByRole("textbox", { name: "Địa chỉ nhận" }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Địa chỉ nhận" }),
      ).toHaveValue(
        mode === "recipient-held"
          ? "Synthetic newer edit C"
          : "Synthetic edited address B",
      );
      await expect(
        page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
      ).toBeDisabled();
    }
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `/private/tmp/ask-panel-correctness-${mode}.png`,
    });
  });
test("order version remount and auth reset retain fences", async ({ page }) => {
  const errors = await setup(page, "version");
  await page.evaluate(() =>
    (window as unknown as Fixture).qaEmitOrder({ version: 3 }),
  );
  await expect(
    page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
  ).toBeEnabled();
  await page.evaluate(() => (window as unknown as Fixture).qaSwitch());
  await expect(
    page.getByText("Synthetic saved address A", { exact: false }),
  ).not.toBeVisible();
  expect(await commands(page, "acceptQuote")).toEqual([]);
  expect(errors).toEqual([]);
});
test("new question scroll selects turn with task panel appended", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(() => {
    const pane = document.querySelector('[role="log"]')!;
    const spacer = document.createElement("div");
    spacer.style.height = "1500px";
    pane.prepend(spacer);
  });
  await chat(page, "Synthetic long question ".repeat(20));
  await expect
    .poll(() =>
      page
        .locator("[data-ask-turn]")
        .last()
        .evaluate((el) =>
          Math.round(
            el.getBoundingClientRect().top -
              el.parentElement!.getBoundingClientRect().top,
          ),
        ),
    )
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(() =>
      page
        .locator("[data-ask-turn]")
        .last()
        .evaluate((el) =>
          Math.round(
            el.getBoundingClientRect().top -
              el.parentElement!.getBoundingClientRect().top,
          ),
        ),
    )
    .toBeLessThan(50);
});
test("own draft save and unrelated turn do not create a draft conflict", async ({
  page,
}) => {
  const errors = await setup(page);
  await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
  await page.locator('input[name="quantity-0"]').fill("3");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Gửi yêu cầu mua hộ", exact: true }),
  ).toBeEnabled();
  await chat(page, "Synthetic unrelated question");
  await expect
    .poll(async () => (await commands(page, "saveTurn")).length)
    .toBe(1);
  await expect(
    page.getByRole("button", { name: "Gửi yêu cầu mua hộ", exact: true }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});
test("recipient acknowledgement cannot unlock quote before matching readback", async ({
  page,
}) => {
  await setup(page, "recipient-delayed");
  const details = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Giao đến" }) });
  await details.locator("summary").click();
  await details.getByRole("button", { name: "Kiểm tra / sửa địa chỉ" }).click();
  await page
    .getByRole("textbox", { name: "Địa chỉ nhận" })
    .fill("Synthetic delayed address B");
  await page
    .getByRole("button", { name: "Lưu thông tin nhận hàng", exact: true })
    .click();
  await expect
    .poll(async () => (await commands(page, "saveRecipient")).length)
    .toBe(1);
  await expect(
    page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
  ).toBeDisabled();
  await chat(page, "chấp nhận báo giá");
  expect(await commands(page, "acceptQuote")).toEqual([]);
  await page.screenshot({
    path: "/private/tmp/ask-panel-correctness-delayed-readback.png",
  });
  await page.evaluate(() => (window as unknown as Fixture).qaEmitRecipient());
  await expect(
    page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("region", { name: "Yêu cầu mua hộ trong chat" }),
  ).toContainText("Synthetic delayed address B");
});
test("English remote conflict gives reload and review guidance", async ({
  page,
}) => {
  await setup(page, "draft", true);
  await page.getByText("Enter details if needed", { exact: true }).click();
  await page.locator('input[name="quantity-0"]').fill("3");
  await page.evaluate(
    (d) =>
      (window as unknown as Fixture).qaEmitConversation({
        version: 1,
        draft: d,
      }),
    { ...draft, items: [{ ...draft.items[0], quantity: 2 }] },
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Reload and review the latest draft",
  );
  expect(await commands(page, "saveDraft")).toEqual([]);
  await page.screenshot({
    path: "/private/tmp/ask-panel-correctness-english-conflict.png",
  });
});
for (const method of ["button", "chat"])
  test(`canonical partial saved draft submits by ${method}`, async ({
    page,
  }) => {
    const errors = await setup(page, "normalized");
    if (method === "button")
      await page
        .getByRole("button", { name: "Gửi yêu cầu mua hộ", exact: true })
        .click();
    else await chat(page, "gửi yêu cầu mua hộ");
    await expect
      .poll(async () => (await commands(page, "submitRequest")).length)
      .toBe(1);
    const sent = await commands(page, "submitRequest");
    expect(sent[0].payload).toEqual({
      market: "US",
      items: [{ name: "Synthetic product", quantity: 1, variant: "" }],
      notes: "",
    });
    expect(errors).toEqual([]);
  });
test("recipient listener error before held acknowledgement preserves editor", async ({
  page,
}) => {
  await setup(page, "recipient-error-held");
  const details = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Giao đến" }) });
  await details.locator("summary").click();
  await details.getByRole("button", { name: "Kiểm tra / sửa địa chỉ" }).click();
  await page
    .getByRole("textbox", { name: "Địa chỉ nhận" })
    .fill("Synthetic pending address B");
  await page
    .getByRole("button", { name: "Lưu thông tin nhận hàng", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Yêu cầu mua hộ trong chat" }),
  ).toContainText("Synthetic pending address B");
  await page.evaluate(() => (window as unknown as Fixture).qaErrorRecipient());
  await page.evaluate(() => (window as unknown as Fixture).qaRelease());
  await expect(
    page.getByRole("button", { name: "Lưu thông tin nhận hàng", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("textbox", { name: "Địa chỉ nhận" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Địa chỉ nhận" })).toHaveValue(
    "Synthetic pending address B",
  );
  await expect(
    page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
  ).toBeDisabled();
});
for (const width of [390, 1440])
  test(`local synthetic shell input performance ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = await setup(page, "performance");
    await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
    await expect(page.locator('input[name^="quantity-"]')).toHaveCount(30);
    await expect(page.locator("[data-ask-turn]")).toHaveCount(24);
    const timing = await page.evaluate(async () => {
      const longTasks: number[] = [];
      const observer = new PerformanceObserver((list) =>
        longTasks.push(...list.getEntries().map((e) => e.duration)),
      );
      observer.observe({ type: "longtask", buffered: false });
      const input = document.querySelector(
        'dialog input[aria-label="Hỏi SatsunicGo"]',
      ) as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!;
      const samples: number[] = [];
      for (let i = 0; i < 12; i++) {
        const start = performance.now();
        setter.call(input, `Synthetic input ${i}`);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );
        if (i > 1) samples.push(performance.now() - start);
      }
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      observer.disconnect();
      samples.sort((a, b) => a - b);
      return {
        samples,
        p95: samples[Math.ceil(samples.length * 0.95) - 1],
        maxLongTask: Math.max(0, ...longTasks),
        domNodes: document.querySelectorAll("*").length,
        commands: (window as unknown as Fixture).qaCommands.length,
      };
    });
    writeFileSync(
      `output/ask-panel-correctness/performance-${process.env.ASK_PANEL_BASELINE === "1" ? "baseline" : "current"}-${width}.json`,
      JSON.stringify(
        {
          tier: "SYNTHETIC_LOCAL_BROWSER",
          width,
          restoredTurns: 24,
          items: 30,
          animation: "reduced-motion; authored modal animation excluded",
          ...timing,
        },
        null,
        2,
      ),
    );
    expect(timing.commands).toBe(0);
    expect(timing.p95).toBeLessThan(100);
    expect(timing.maxLongTask).toBeLessThan(50);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `/private/tmp/ask-panel-correctness-performance-${width}.png`,
    });
  });

for (const method of ["button", "chat"])
  test(`remote recipient revision blocks ${method} before authoritative readback`, async ({
    page,
  }) => {
    const errors = await setup(page, "recipient-remote");
    const accept = page.getByRole("button", {
      name: "Chấp nhận báo giá và mức cọc",
    });
    await expect(accept).toBeEnabled();
    await page.evaluate(() => {
      const fixture = window as unknown as Fixture;
      fixture.qaHoldRecipientReadback = true;
      fixture.qaRecipient = {
        ...fixture.qaRecipient,
        address: "Synthetic remote address B",
      };
      fixture.qaEmitConversation({ version: 1 });
    });
    if (method === "button") await expect(accept).toBeDisabled();
    else {
      await chat(page, "chấp nhận báo giá");
      expect(await commands(page, "acceptQuote")).toEqual([]);
    }
    await expect(
      page.getByRole("region", { name: "Yêu cầu mua hộ trong chat" }),
    ).not.toContainText("Synthetic saved address A");
    await page.evaluate(() =>
      (window as unknown as Fixture).qaEmitStaleRecipient(),
    );
    await expect(accept).toBeDisabled();
    await page.evaluate(() => (window as unknown as Fixture).qaEmitRecipient());
    await expect(accept).toBeEnabled();
    const details = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Giao đến" }) });
    await details.locator("summary").click();
    await expect(details).toContainText("Synthetic remote address B");
    expect(errors).toEqual([]);
  });

test("recipient active edit survives unrelated turn revision and authoritative reread", async ({
  page,
}) => {
  const errors = await setup(page, "recipient");
  const details = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Giao đến" }) });
  await details.locator("summary").click();
  await details.getByRole("button", { name: "Kiểm tra / sửa địa chỉ" }).click();
  const input = page.getByRole("textbox", { name: "Địa chỉ nhận" });
  await input.fill("Synthetic active edit C");
  await chat(page, "Synthetic unrelated turn while editing");
  await expect
    .poll(async () => (await commands(page, "saveTurn")).length)
    .toBe(1);
  await expect(input).toHaveValue("Synthetic active edit C");
  await expect(
    page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

for (const payment of [false, true])
  test(`immediate advanced revision blocks ${payment ? "direct payment" : "queued quote"} handler`, async ({
    page,
  }) => {
    const errors = await setup(page, "recipient-immediate");
    if (payment)
      await page.evaluate(() =>
        (window as unknown as Fixture).qaEmitOrder({
          stage: "QUOTE_ACCEPTED",
          acceptedAt: 1,
        }),
      );
    const name = payment
      ? "Mở bước thanh toán"
      : "Chấp nhận báo giá và mức cọc";
    await expect(page.getByRole("button", { name })).toBeEnabled();
    await page.evaluate((name) => {
      const fixture = window as unknown as Fixture;
      fixture.qaHoldRecipientReadback = true;
      fixture.qaRecipient = {
        ...fixture.qaRecipient,
        address: "Synthetic immediate remote B",
      };
      fixture.qaEmitConversation({ version: 1 });
      // Click in the same JS task, before React can replace the old enabled DOM.
      const button = [...document.querySelectorAll("button")].find(
        (el) => el.textContent === name,
      )!;
      button.click();
    }, name);
    await expect(page.getByRole("button", { name })).toBeDisabled();
    await expect(page.getByRole("alert")).toContainText("Chưa xác minh được");
    expect(await commands(page, "acceptQuote")).toEqual([]);
    expect(
      await page.evaluate(() => (window as unknown as Fixture).qaPaymentCalls),
    ).toEqual([]);
    await page.evaluate(() => (window as unknown as Fixture).qaEmitRecipient());
    await expect(page.getByRole("button", { name })).toBeEnabled();
    expect(errors).toEqual([]);
  });

for (const english of [false, true])
  test(`ended recipient listener retries read only and preserves edits ${english ? "EN" : "VI"}`, async ({
    page,
  }) => {
    const errors = await setup(page, "recipient-retry", english);
    const details = page.locator("details").filter({
      has: page.locator("summary", {
        hasText: english ? "Delivery address" : "Giao đến",
      }),
    });
    await details.locator("summary").click();
    await details
      .getByRole("button", {
        name: english ? "Review / edit address" : "Kiểm tra / sửa địa chỉ",
      })
      .click();
    const input = page.getByRole("textbox", {
      name: english ? "Delivery address" : "Địa chỉ nhận",
      exact: true,
    });
    await input.fill("Synthetic retained edit C");
    await page.evaluate(() =>
      (window as unknown as Fixture).qaErrorRecipient(),
    );
    await expect(page.getByRole("alert")).toContainText(
      english
        ? "Retry loading; your edits are kept"
        : "Thử tải lại; phần đang sửa vẫn được giữ",
    );
    await page
      .getByRole("button", {
        name: english ? "Retry loading" : "Thử tải lại",
        exact: true,
      })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `output/ask-panel-correctness/retry-${english ? "en" : "vi"}-failure.png`,
    });
    writeFileSync(
      `output/ask-panel-correctness/retry-${english ? "en" : "vi"}-failure.yaml`,
      await page.getByRole("dialog").filter({ visible: true }).ariaSnapshot(),
    );
    await page.evaluate(() => {
      const fixture = window as unknown as Fixture;
      fixture.qaHoldRecipientReadback = false;
    });
    const retry = page.getByRole("button", {
      name: english ? "Retry loading" : "Thử tải lại",
      exact: true,
    });
    await retry.click();
    await expect(retry).not.toBeVisible();
    await expect(details).toContainText("Synthetic saved address A");
    await expect(input).toHaveValue("Synthetic retained edit C");
    await expect(
      page.getByRole("button", {
        name: english
          ? "Accept quote and deposit"
          : "Chấp nhận báo giá và mức cọc",
      }),
    ).toBeDisabled();
    expect(await commands(page, "saveRecipient")).toEqual([]);
    expect(
      await page.evaluate(() => (window as unknown as Fixture).qaPaymentCalls),
    ).toEqual([]);
    expect(errors).toEqual([]);
    writeFileSync(
      `output/ask-panel-correctness/retry-${english ? "en" : "vi"}.json`,
      JSON.stringify(
        {
          tier: "SYNTHETIC_LOCAL_BROWSER",
          role: "alert",
          accessibleRetryName: english ? "Retry loading" : "Thử tải lại",
          retainedEdit: await input.inputValue(),
          writes: await commands(page, "saveRecipient"),
          providerDispatches: await page.evaluate(
            () => (window as unknown as Fixture).qaPaymentCalls,
          ),
          screenReaderAudio: "NOT_RUN",
        },
        null,
        2,
      ),
    );
  });

for (const invalid of ["missing", "owner/schema"])
  test(`invalid authoritative recipient ${invalid} stays unavailable until retry`, async ({
    page,
  }) => {
    await setup(page, "recipient-invalid");
    await page.evaluate((invalid) => {
      const fixture = window as unknown as Fixture;
      fixture.qaRecipient =
        invalid === "missing"
          ? {}
          : {
              ...fixture.qaRecipient,
              ownerId: "qa-unrelated-owner",
              phone: "invalid",
            };
      fixture.qaEmitRecipient();
    }, invalid);
    await expect(page.getByRole("alert")).toContainText("Thử tải lại");
    await expect(
      page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
    ).toBeDisabled();
    await chat(page, "chấp nhận báo giá");
    expect(await commands(page, "acceptQuote")).toEqual([]);
    await page.evaluate(() => {
      (window as unknown as Fixture).qaRecipient = {
        recipient: "Synthetic recipient",
        phone: "0000000000",
        address: "Synthetic recovered B",
        ownerId: "qa-panel-owner",
      };
    });
    await page
      .getByRole("button", { name: "Thử tải lại", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Chấp nhận báo giá và mức cọc" }),
    ).toBeEnabled();
  });

for (const english of [false, true])
  for (const zoomEquivalent of [false, true])
    test(`product content keyboard and wrapping ${english ? "EN" : "VI"} ${zoomEquivalent ? "desktop 200pct equivalent" : "390"}`, async ({
      page,
    }) => {
      const width = zoomEquivalent ? 720 : 390;
      await page.setViewportSize({ width, height: zoomEquivalent ? 450 : 900 });
      const errors = await setup(page, "content", english);
      await page
        .getByText(
          english ? "Enter details if needed" : "Điền thông tin nếu cần",
          { exact: true },
        )
        .click();
      const quantity = page.locator('input[name="quantity-0"]');
      await quantity.fill("3");
      const composer = page
        .getByRole("textbox", {
          name: english ? "Ask SatsunicGo" : "Hỏi SatsunicGo",
          exact: true,
        })
        .filter({ visible: true });
      let keyboardReached = false;
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press("Tab");
        if (await composer.evaluate((el) => el === document.activeElement)) {
          keyboardReached = true;
          break;
        }
      }
      expect(keyboardReached).toBe(true);
      await composer.fill(
        english ? "submit buying request" : "gửi yêu cầu mua hộ",
      );
      await page.keyboard.press("Enter");
      await expect(
        page.locator("[data-ask-turn]").last().locator("h2"),
      ).toContainText(
        english ? "Review before continuing" : "Kiểm tra trước khi tiếp tục",
      );
      expect(await commands(page, "submitRequest")).toEqual([]);
      await expect(quantity).toHaveValue("3");
      await expect(
        page.getByRole("status").filter({
          hasText: english
            ? "Your edits are not saved"
            : "Thông tin đang sửa chưa được lưu",
        }),
      ).toBeVisible();
      const guard = page.getByRole("status").filter({
        hasText: english
          ? "Your edits are not saved"
          : "Thông tin đang sửa chưa được lưu",
      });
      await guard.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `output/ask-panel-correctness/content-${english ? "en" : "vi"}-${zoomEquivalent ? "200pct-equivalent" : "390"}-guard.png`,
      });
      const longMessage = (
        english
          ? "Synthetic keyboard message with several words to wrap across multiple lines. "
          : "Nội dung tổng hợp để kiểm tra xuống dòng trong hội thoại bằng bàn phím. "
      ).repeat(9);
      await chat(page, longMessage);
      const question = page
        .locator("[data-ask-turn]")
        .last()
        .locator("div > p")
        .first();
      const metrics = await question.evaluate((el) => {
        const style = getComputedStyle(el);
        const dialog = el.closest("dialog")!;
        const pane = document.querySelector('[role="log"]')!;
        return {
          questionHeight: el.getBoundingClientRect().height,
          lineHeight: parseFloat(style.lineHeight),
          dialogClient: dialog.clientWidth,
          dialogScroll: dialog.scrollWidth,
          paneClient: pane.clientWidth,
          paneScroll: pane.scrollWidth,
          viewport: window.innerWidth,
        };
      });
      expect(metrics.questionHeight).toBeGreaterThan(metrics.lineHeight * 2);
      expect(metrics.dialogScroll).toBeLessThanOrEqual(
        metrics.dialogClient + 1,
      );
      expect(metrics.paneScroll).toBeLessThanOrEqual(metrics.paneClient + 1);
      await expect(quantity).toHaveValue("3");
      const sendName = english ? "Send buying request" : "Gửi yêu cầu mua hộ";
      await expect(
        page.getByRole("button", { name: sendName, exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", {
          name: english ? "Save draft" : "Lưu bản nháp",
          exact: true,
        }),
      ).toBeVisible();
      const name = `${english ? "en" : "vi"}-${zoomEquivalent ? "200pct-equivalent" : "390"}`;
      const ax = await page
        .getByRole("dialog")
        .filter({ visible: true })
        .ariaSnapshot();
      writeFileSync(`output/ask-panel-correctness/content-${name}.yaml`, ax);
      writeFileSync(
        `output/ask-panel-correctness/content-${name}.json`,
        JSON.stringify(
          {
            tier: "SYNTHETIC_LOCAL_BROWSER",
            language: english ? "en" : "vi",
            keyboardReached,
            dirtyQuantity: await quantity.inputValue(),
            accessibleButtonNames: [
              sendName,
              english ? "Save draft" : "Lưu bản nháp",
            ],
            statusRoleVerified: true,
            ...metrics,
            zoom: zoomEquivalent
              ? "1440 desktop at 200% layout equivalent: 720 CSS px; native browser zoom NOT_RUN"
              : "native 390 CSS px",
            screenReaderAudio: "NOT_RUN",
          },
          null,
          2,
        ),
      );
      await page.screenshot({
        path: `output/ask-panel-correctness/content-${name}.png`,
      });
      expect(errors).toEqual([]);
    });
