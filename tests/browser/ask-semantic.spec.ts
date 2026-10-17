import { test, expect, type Page } from "@playwright/test";
const cid = "99999999-1111-4111-8111-111111111111";
const product = {
  id: "shirt",
  title: "Áo thun Uniqlo",
  slug: "uniqlo-shirt",
  status: "published",
  market: "US",
  version: 1,
  orderable: true,
  listedPrice: 350000,
  termsVersion: "synthetic-v1",
  catalogOptions: ["Black / M", "White / L"],
};
async function mount(page: Page) {
  page.on("pageerror", (error) =>
    console.error("Browser fixture error:", error.message),
  );
  const source = await (
    await page.request.get("/src/features/ask/Ask.tsx")
  ).text();
  const entry = await (await page.request.get("/src/app/main.tsx")).text();
  const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
  const router = source.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1];
  const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
  await page.route("**/src/shared/firebase.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `
    export const auth={currentUser:{uid:'qa-semantic'}},db={},functions=null,app=null,configured=true,emulatorMode=true;
    export const login=async()=>{};
    export async function callService(name,data){window.qaCalls.push({name,data});
      if(name==='currentAskConversation')return {conversationId:'${cid}'};
      if(name==='askWorkflow'){const patch={version:data.expectedVersion+1};if(data.action==='saveTurn')patch.turns=[...window.qaConversation.turns,data.payload].slice(-24);window.qaEmitConversation(patch);return {version:patch.version};}
      if(name==='purchaseCheckoutSetup')return {regions:[{code:'79',name:'Hồ Chí Minh',communes:[{code:'26734',name:'Phường Bến Thành'}]}],shipping:null,shippingOrigin:'unavailable',pricing:null,paymentCapabilities:{provider:'unavailable',methods:{}}};
      if(name==='notificationPreferencesRead')return {};
      throw Error('Synthetic service unavailable');
    }`,
    }),
  );
  await page.route("**/*firebase_auth.js*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `export function onAuthStateChanged(auth,fn){queueMicrotask(()=>fn(auth.currentUser));return()=>{}}`,
    }),
  );
  await page.route("**/*firebase_firestore.js*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `
    export const doc=(_,kind,id)=>({kind,id}),collection=(_,kind)=>({kind}),query=x=>x,where=()=>null,limit=()=>null,orderBy=()=>null,documentId=()=>null,startAfter=()=>null;
    export const getDocs=async()=>({docs:[]}),getDocsFromServer=getDocs;
    export const getDoc=async()=>({metadata:{fromCache:false},data:()=>undefined,exists:()=>false});
    export const getDocFromServer=async()=>({data:()=>({...${JSON.stringify(product)},version:window.qaStale?2:1}),exists:()=>true});
    window.qaCalls=[];window.qaConversation={ownerId:'qa-semantic',version:0,updatedAt:Date.now(),turns:[],draft:{}};
    const listeners=new Set(),snapshot=()=>({metadata:{fromCache:false},data:()=>window.qaConversation});
    window.qaEmitConversation=patch=>{window.qaConversation={...window.qaConversation,...patch,updatedAt:Date.now()};for(const ok of listeners)ok(snapshot())};
    export function onSnapshot(ref,...args){const ok=args.find(x=>typeof x==='function');let live=true;if(ref.kind==='askConversations')listeners.add(ok);queueMicrotask(()=>{if(live)ok(ref.kind==='askConversations'?snapshot():{metadata:{fromCache:false},docs:[],data:()=>undefined,exists:()=>false})});return()=>{live=false;listeners.delete(ok)}}`,
    }),
  );
  await page.route("**/src/features/cart/cart-store.tsx*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `
    import React from '${react}';const {useSyncExternalStore}=React;let cart={ownerId:'qa-semantic',revision:0,updatedAt:Date.now(),items:[]};const listeners=new Set();const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn)};
    const change=async data=>{window.qaCalls.push({name:'cartCommand',data});cart={...cart,revision:cart.revision+1,items:data.items};for(const fn of listeners)fn();return true};
    const noop=async()=>{};export const guestCartKey='synthetic';export function useCart(){const value=useSyncExternalStore(subscribe,()=>cart);return {cart:value,user:{uid:'qa-semantic'},loading:false,busy:false,cached:false,online:true,error:'',storageWarning:'',guestItems:[],pending:false,change,refresh:noop,consume:noop,mergeGuest:noop,changeGuest:noop,retryPending:noop,resetGuest:noop}}`,
    }),
  );
  await page.route("**/src/features/cart/cart-cache.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `export const cartProducts=async()=>({rows:{shirt:${JSON.stringify(product)}},cached:false,error:''})`,
    }),
  );
  await page.route("**/src/features/ask/ImageIntake.tsx*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: "export const useAskImages=()=>({photos:[],working:false,prepare:async()=>[],markSent:()=>{},add:()=>{},remove:()=>{}})",
    }),
  );
  await page.route("**/src/features/ask/catalog-search.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `export const searchPublishedCatalog=async(query)=>{window.qaSearch=query;return {rows:[${JSON.stringify(product)}],cursor:null,hasMore:false,stale:false}}`,
    }),
  );
  await page.route("**/src/features/ask/transport.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `export const askRateLimited=()=>false;export async function askService(data){window.qaCalls.push({name:'ask',data});if(window.qaFail)throw Error('Synthetic model unavailable');return window.qaAnswer}`,
    }),
  );
  await page.route("**/qa-semantic", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: `<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import{BrowserRouter}from'${router}';const{Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask,{aiAvailable:true})));</script>`,
    }),
  );
  await page.goto("/qa-semantic");
}
async function send(
  page: Page,
  question: string,
  commands: unknown[],
  title = "Mình cùng xem nhé",
) {
  await page.evaluate(
    (answer) => {
      Object.assign(window, { qaAnswer: answer });
    },
    {
      language: "vi",
      title,
      paragraphs: ["Bạn có thể kiểm tra lựa chọn trong tác vụ."],
      bullets: [],
      sourceIds: [],
      action: "workflow",
      commandPlan: { version: 1, commands },
    },
  );
  const input = page.getByRole("textbox", { name: "Hỏi SatsunicGo" }).last();
  await expect(input).toBeEnabled();
  await input.fill(question);
  await input.press("Enter");
  await expect(
    page.getByRole("heading", { name: title, includeHidden: true }).last(),
  ).toBeAttached();
}
for (const width of [1440, 390, 320])
  test(`natural action to inline cart and checkout at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mount(page);
    await send(
      page,
      "ユニクロのシャツを探しています",
      [{ kind: "search_catalog", query: "áo Uniqlo", maxPriceVnd: 500000 }],
      "ユニクロのシャツを探しましょう",
    );
    await expect(
      page.getByRole("link", { name: "1. Áo thun Uniqlo", exact: true }),
    ).toBeVisible();
    await send(page, "lấy cái đó màu trắng size lớn hai cái nhé", [
      {
        kind: "select_product",
        productId: "shirt",
        quantity: 2,
        variant: "White / L",
      },
    ]);
    const selection = page.getByRole("region", { name: "Sản phẩm đang chọn" });
    await expect(selection.getByRole("spinbutton")).toHaveValue("2");
    await expect(selection.getByRole("combobox")).toHaveValue("White / L");
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { qaCalls: { name: string }[] }).qaCalls.filter(
            (c) => c.name === "cartCommand",
          ).length,
      ),
    ).toBe(0);
    await selection
      .getByRole("button", { name: "Thêm vào giỏ", exact: true })
      .click();
    await expect(
      page.locator(".askPurchaseWorkspace .cartTotal107"),
    ).toContainText("700.000");
    await page
      .locator(".askPurchaseWorkspace")
      .getByRole("button", { name: "Xem lại để đặt mua" })
      .click();
    await expect(
      page
        .locator(".askPurchaseWorkspace")
        .getByRole("heading", { name: "Thông tin nhận hàng" }),
    ).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/qa-semantic");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `output/ask-semantic/checkout-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
    const calls = await page.evaluate(
      () =>
        (
          window as unknown as {
            qaCalls: {
              name: string;
              data: {
                action?: string;
                question?: string;
                commandProtocol?: number;
              };
            }[];
          }
        ).qaCalls,
    );
    expect(calls.filter((c) => c.name === "cartCommand")).toHaveLength(1);
    expect(calls.find((c) => c.name === "ask")?.data).toMatchObject({
      question: "ユニクロのシャツを探しています",
      commandProtocol: 1,
    });
    expect(
      calls.some(
        (c) => c.name === "purchaseCheckout" && c.data.action === "commit",
      ),
    ).toBe(false);
  });
test("stale selection refuses cart mutation", async ({ page }) => {
  await mount(page);
  await send(page, "cho xem áo", [{ kind: "search_catalog", query: "Uniqlo" }]);
  await send(page, "hai cái trắng L", [
    {
      kind: "select_product",
      productId: "shirt",
      quantity: 2,
      variant: "White / L",
    },
  ]);
  await page.evaluate(() => Object.assign(window, { qaStale: true }));
  await page
    .getByRole("region", { name: "Sản phẩm đang chọn" })
    .getByRole("button", { name: "Thêm vào giỏ", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { qaCalls: { name: string }[] }).qaCalls.filter(
          (c) => c.name === "cartCommand",
        ).length,
    ),
  ).toBe(0);
  await expect(page.getByText(/Chưa thêm được sản phẩm/).first()).toBeVisible();
});

test("clarification and provider failure remain visible after a mobile task", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mount(page);
  await send(page, "mở giỏ", [{ kind: "open_cart" }]);
  await send(page, "我不确定要哪个颜色", [], "您想要什么颜色？");
  await expect(
    page.getByRole("heading", { name: "您想要什么颜色？" }),
  ).toBeVisible();
  await page.evaluate(() => Object.assign(window, { qaFail: true }));
  const input = page.getByRole("textbox", { name: "Hỏi SatsunicGo" }).last();
  await input.fill("giúp mình xem tiếp");
  await input.press("Enter");
  await expect(
    page.getByRole("button", { name: "Thử lại", exact: true }).last(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { qaCalls: { name: string }[] }).qaCalls.filter(
          (c) => c.name === "cartCommand",
        ).length,
    ),
  ).toBe(0);
});
