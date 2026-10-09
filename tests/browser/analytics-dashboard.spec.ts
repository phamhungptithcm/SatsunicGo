import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = "http://127.0.0.1:5207";
async function freezeHmr(page: Page) {
  // Freeze the fixture's hot-reload transport while other tasks edit this shared workspace.
  await page.route("**/@vite/client", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `
    export const createHotContext=()=>({data:{},accept(){},dispose(){},prune(){},invalidate(){},on(){},off(){},send(){}});
    export function updateStyle(id,content){let el=document.getElementById('vite-'+id);if(!el){el=document.createElement('style');el.id='vite-'+id;document.head.append(el);}el.textContent=content;}
    export function removeStyle(id){document.getElementById('vite-'+id)?.remove();}
    export const injectQuery=(url,q)=>url+(url.includes('?')?'&':'?')+q;
  `,
    }),
  );
}
async function mount(page: Page, mode = "success") {
  await freezeHmr(page);
  const source = await (
      await page.request.get(`${base}/src/features/crm/Dashboard.tsx`)
    ).text(),
    entry = await (await page.request.get(`${base}/src/app/main.tsx`)).text();
  const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1],
    router = source.match(/from "([^"]*\/react-router-dom\.js[^"]*)"/)?.[1],
    root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  expect(react && router && root).toBeTruthy();
  await page.route("**/src/shared/firebase.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `export const auth=null, functions=null;export const callService=async(name,range)=>({...range,observedAt:Date.now(),truncated:[],counts:{requests:2,quotes:1,purchasing:1,ready:0,exceptions:0,transfers:0,holds:0,balance:0,tickets:0}});`,
    }),
  );
  await page.route("**/src/shared/analytics.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `export const fetchDashboardAnalytics=(range)=>window.analyticsRead(range);`,
    }),
  );
  await page.route("**/analytics-fixture/main.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `
 import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>(type)=>type;window.__vite_plugin_react_preamble_installed__=true;
 const React=(await import(${JSON.stringify(react)})).default;const {BrowserRouter}=await import(${JSON.stringify(router)});const {createRoot}=(await import(${JSON.stringify(root)})).default;
 await import('/src/styles/global.css');await import('/src/features/crm/Workspace.css');await import('/src/features/crm/crm-ux028.css');
 window.analyticsMode=${JSON.stringify(mode)};window.analyticsCalls=[];window.analyticsPending=[];
 window.analyticsRead=async(range)=>{window.analyticsCalls.push(range);const days=[];for(let at=range.from;at<=range.until;at+=86400000){const i=days.length;days.push({day:new Date(at).toISOString().slice(0,10),counts:{views:42+i*5,sessions:12+i*2,payments:4000000+i*50000,refunds:200000,reversals:0,orders:8,US:3,JP:4,KR:1}});}
 const result={version:1,...range,asOf:Date.now(),startedAt:range.from,enabled:true,complete:true,workingAvailable:true,finance:true,availability:{traffic:true,products:true,topics:true,stages:true,reason:"ready"},days,products:[{id:'product-1',title:'Vitamin C Nhật Bản',slug:'vitamin-c',views:120,clicks:82,paidOrders:9},{id:'product-2',title:'Đồ dùng gia đình',views:90,clicks:57,paidOrders:4}],topics:[{id:'shipping',questions:48,sessions:18},{id:'pricing',questions:32,sessions:12}],stages:{REQUESTED:14,PURCHASING:12,IN_TRANSIT:8,COMPLETED:6},sessions:126,browsers:98,accounts:34,buyers:20,convertedSessions:18,productSessions:80,convertedProductSessions:14,paidOrders:24,linkedPaidOrders:21,provisional:true,backlog:0,deadLetters:0,oldestPendingAt:0,lastWorkerAt:Date.now()};
 if(window.analyticsMode==='denied')throw Object.assign(Error(),{code:'functions/permission-denied'});if(window.analyticsMode==='offline')throw Error('offline');if(window.analyticsMode==='malformed')return {...result,convertedSessions:999};if(window.analyticsMode==='disabled')return {...result,availability:{traffic:false,products:false,topics:false,stages:false,reason:'not_collected'},enabled:false,startedAt:0,complete:false,workingAvailable:false,sessions:null,browsers:null,accounts:null,buyers:null,convertedSessions:null,productSessions:null,convertedProductSessions:null,paidOrders:null,linkedPaidOrders:null,days:[],products:[],topics:[],stages:{}};
 if(window.analyticsMode==='bounded')return {...result,availability:{traffic:true,products:false,topics:false,stages:false,reason:'read_limit'},workingAvailable:false,complete:false,sessions:null,browsers:null,accounts:null,buyers:null,convertedSessions:null,productSessions:null,convertedProductSessions:null,paidOrders:null,linkedPaidOrders:null};if(window.analyticsMode==='unknownPaid')return {...result,products:result.products.map((p,i)=>i===0?{...p,paidOrders:null}:p)};if(window.analyticsMode==='deferred')return new Promise(resolve=>window.analyticsPending.push({result,resolve}));return result;};
 const {Dashboard}=await import('/src/features/crm/Dashboard.tsx');createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement('div',{className:'workspaceShell',style:{gridTemplateColumns:'1fr',minHeight:'100vh'}},React.createElement('main',{className:'workspaceMain'},React.createElement('div',{className:'workspaceContent'},React.createElement(Dashboard))))));
 `,
    }),
  );
  await page.route("**/analytics-fixture?*", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/analytics-fixture/main.js"></script></body></html>',
    }),
  );
  await page.goto(`${base}/analytics-fixture?tab=customers`);
  await expect(
    page.getByRole("region", { name: "Tổng quan SatsunicGo" }),
  ).toBeVisible();
}
for (const width of [1440, 390, 320])
  test(`analytics charts, tabs, keyboard and overflow ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page);
    await expect(page.locator(".aKpi strong").first()).toHaveText("126");
    await expect(
      page.getByText("Vitamin C Nhật Bản", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThan(6500);
    const plot = page.locator(".aPlot").first();
    await plot.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".aPoint output").first()).not.toBeEmpty();
    await page.getByRole("tab", { name: "Vận hành", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Đơn mới theo nguồn hàng" }),
    ).toBeVisible();
    await expect(page.locator(".aDonutLayout")).toBeVisible();
    expect(page.url()).toContain("tab=operations");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.reload();
    await expect(
      page.getByRole("tab", { name: "Vận hành", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Khách hàng & mua hàng" }).click();
    await expect(
      page.getByRole("tab", { name: "Khách hàng & mua hàng" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { name: "Từ truy cập đến mua hàng" }),
    ).toBeVisible();
    await mkdir("docs/reviews/ANALYTICS-DASHBOARD-20261008/screenshots", {
      recursive: true,
    });
    await page.screenshot({
      path: `docs/reviews/ANALYTICS-DASHBOARD-20261008/screenshots/dashboard-${width}.png`,
      fullPage: true,
    });
  });
test("disabled, malformed, stale, denial and range race remain distinct", async ({
  page,
}) => {
  await mount(page, "disabled");
  await expect(page.locator(".aKpi strong").first()).toHaveText("—");
  await expect(
    page.getByText("Thu thập đang tắt.", { exact: false }),
  ).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { analyticsMode: string }).analyticsMode = "success";
  });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.locator(".aKpi strong").first()).toHaveText("126");
  await page.evaluate(() => {
    (window as unknown as { analyticsMode: string }).analyticsMode = "offline";
  });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(
    page.getByText("Chưa tải được thống kê.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".aKpi strong").first()).toHaveText("126");
  await page.evaluate(() => {
    (window as unknown as { analyticsMode: string }).analyticsMode =
      "malformed";
  });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(
    page.getByText("Số liệu trả về chưa hợp lệ.", { exact: false }),
  ).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { analyticsMode: string }).analyticsMode = "denied";
  });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.locator(".aKpi strong").first()).toHaveText("—");
  await expect(
    page.getByText("Bạn chưa có quyền xem thống kê.", { exact: false }),
  ).toBeVisible();
});

test("newer filter owns its response and bounded blocks show unavailable", async ({
  page,
}) => {
  await mount(page, "deferred");
  await page.getByRole("button", { name: "Hôm nay", exact: true }).click();
  await page.getByRole("button", { name: "30 ngày", exact: true }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as unknown as { analyticsPending: unknown[] })
            .analyticsPending.length,
      ),
    )
    .toBe(3);
  await page.evaluate(() => {
    const w = window as unknown as {
      analyticsPending: {
        result: Record<string, unknown>;
        resolve: (v: unknown) => void;
      }[];
    };
    const last = w.analyticsPending.at(-1)!;
    last.resolve({ ...last.result, sessions: 300 });
  });
  await expect(page.locator(".aKpi strong").first()).toHaveText("300");
  await page.evaluate(() => {
    const w = window as unknown as {
      analyticsPending: {
        result: Record<string, unknown>;
        resolve: (v: unknown) => void;
      }[];
    };
    w.analyticsPending[0].resolve({
      ...w.analyticsPending[0].result,
      sessions: 700,
    });
  });
  await expect(page.locator(".aKpi strong").first()).toHaveText("300");
  await page.evaluate(() => {
    (window as unknown as { analyticsMode: string }).analyticsMode = "bounded";
  });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(
    page.getByText("Chưa có dữ liệu sản phẩm đủ phạm vi để thống kê.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Dữ liệu phiên và chủ đề chưa khả dụng trong khoảng này.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Vitamin C Nhật Bản", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".aChart")
      .filter({
        has: page.getByRole("heading", { name: "Chủ đề được hỏi trong Ask" }),
      })
      .locator("tbody tr"),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Vận hành", exact: true }).click();
  await expect(page.locator(".aDonutNumber")).toHaveText("—");
  await expect(page.locator(".aDonutLayout tbody tr")).toHaveCount(0);
});

for (const consentWidth of [1440, 390, 320])
  test(`consent before auth, explicit clicks, safe Ask taxonomy and withdrawal ${consentWidth}`, async ({
    page,
  }) => {
    await freezeHmr(page);
    await page.setViewportSize({ width: consentWidth, height: 900 });
    const source = await (
        await page.request.get(`${base}/src/shared/AnalyticsConsent.tsx`)
      ).text(),
      entry = await (await page.request.get(`${base}/src/app/main.tsx`)).text();
    const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1],
      router = source.match(/from "([^"]*\/react-router-dom\.js[^"]*)"/)?.[1],
      root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
    const analyticsUrl = source.match(
      /from "([^"]*\/analytics\.ts[^"]*)"/,
    )?.[1];
    expect(react && router && root && analyticsUrl).toBeTruthy();
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: "export const auth=null;export const functions={};",
      }),
    );
    await page.route("**/firebase_functions.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'export const httpsCallable=(_f,name)=>async data=>{window.trackingCalls.push({name,data});return {data:name==="analyticsSession"?{session:crypto.randomUUID(),startedAt:Date.now()}:{accepted:20}};};',
      }),
    );
    await page.route("**/consent-analytics/main.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>(type)=>type;window.__vite_plugin_react_preamble_installed__=true;
 const React=(await import(${JSON.stringify(react)})).default;const {BrowserRouter}=await import(${JSON.stringify(router)});const {createRoot}=(await import(${JSON.stringify(root)})).default;await import('/src/styles/global.css');const {AnalyticsConsent}=await import('/src/shared/AnalyticsConsent.tsx');const {analyticsTracker,trackAsk}=await import(${JSON.stringify(analyticsUrl)});window.trackingCalls=[];window.flushAnalytics=()=>analyticsTracker.flush();window.askAnalytics=()=>trackAsk('Phí vận chuyển và person@example.com','fixed-turn');
 function Fixture(){const [account,setAccount]=React.useState(null),[ready,setReady]=React.useState(false);window.finishAnalyticsAuth=()=>setReady(true);React.useEffect(()=>{window.scrollTo({top:0,left:0});document.getElementById("main")?.focus({preventScroll:true});},[]);return React.createElement(React.Fragment,{key:String(ready)},React.createElement(AnalyticsConsent,{account,ready}),React.createElement("header",{className:"topbar"},"SatsunicGo"),React.createElement('article',{id:'main',tabIndex:-1,'data-analytics-product':'synthetic-product','data-analytics-product-view':'synthetic-product','data-analytics-product-slug':'synthetic-analytics'},React.createElement('h1',null,'Sản phẩm kiểm thử'),React.createElement('a',{href:'/products/synthetic-product',onClick:e=>e.preventDefault()},'Xem sản phẩm'),React.createElement('button',{type:'button'},'Tải lại đánh giá')),React.createElement('button',{onClick:()=>setAccount('synthetic-account')},'Đổi tài khoản'));}
 const rootElement=createRoot(document.getElementById('root'));rootElement.render(React.createElement(React.StrictMode,null,React.createElement(BrowserRouter,null,React.createElement(Fixture))));window.showPrivacy=async()=>{const {PrivacyPage}=await import('/src/features/content/PrivacyPage.tsx');rootElement.render(React.createElement(BrowserRouter,null,React.createElement(PrivacyPage)));};`,
      }),
    );
    await page.route("**/products/synthetic-analytics?qa=1", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/consent-analytics/main.js"></script></body></html>',
      }),
    );
    await page.goto(`${base}/products/synthetic-analytics?qa=1`);
    await expect(
      page.getByRole("button", { name: "Cho phép thống kê", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { trackingCalls: unknown[] }).trackingCalls
            .length,
      ),
    ).toBe(0);
    await page.screenshot({
      path: `docs/reviews/ANALYTICS-DASHBOARD-20261008/screenshots/consent-${consentWidth}.png`,
      fullPage: true,
    });
    for (const name of ["Cho phép thống kê", "Từ chối"]) {
      const button = page.getByRole("button", { name, exact: true });
      expect(
        await button.evaluate((el) => {
          const r = el.getBoundingClientRect(),
            x = r.left + r.width / 2,
            y = r.top + r.height / 2;
          return (
            r.top >= 0 &&
            r.bottom <= innerHeight &&
            el.contains(document.elementFromPoint(x, y))
          );
        }),
      ).toBe(true);
    }
    await page
      .getByRole("button", { name: "Cho phép thống kê", exact: true })
      .click();
    // Opt-in can precede auth restoration, but no transport starts before ready.
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { trackingCalls: unknown[] }).trackingCalls
            .length,
      ),
    ).toBe(0);
    await page
      .getByRole("button", { name: "Quyền thống kê", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Dừng ghi nhận", exact: true })
      .click();
    await page.evaluate(() =>
      (
        window as unknown as { finishAnalyticsAuth: () => void }
      ).finishAnalyticsAuth(),
    );
    await page.getByRole("link", { name: "Xem sản phẩm" }).click();
    await page.evaluate(
      async () =>
        await (
          window as unknown as { flushAnalytics: () => Promise<void> }
        ).flushAnalytics(),
    );
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { trackingCalls: unknown[] }).trackingCalls
            .length,
      ),
    ).toBe(0);
    await page
      .getByRole("button", { name: "Quyền thống kê", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Cho phép thống kê", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as unknown as { trackingCalls: { name: string }[] }
            ).trackingCalls.filter((c) => c.name === "analyticsSession").length,
        ),
      )
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Tải lại đánh giá" }).click();
    await page.getByRole("link", { name: "Xem sản phẩm" }).click();
    await page.evaluate(async () => {
      const w = window as unknown as {
        flushAnalytics: () => Promise<void>;
        askAnalytics: () => void;
      };
      w.askAnalytics();
      w.askAnalytics();
      await w.flushAnalytics();
    });
    const events = await page.evaluate(() =>
      (
        window as unknown as {
          trackingCalls: {
            name: string;
            data: { events?: { kind: string; topic?: string }[] };
          }[];
        }
      ).trackingCalls.flatMap((c) => c.data.events ?? []),
    );
    expect(events.filter((e) => e.kind === "product_view")).toHaveLength(1);
    expect(events.filter((e) => e.kind === "product_click")).toHaveLength(1);
    expect(events.filter((e) => e.kind === "ask")).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("person@example.com");
    await page
      .getByRole("button", { name: "Quyền thống kê", exact: true })
      .click();
    await page.screenshot({
      path: `docs/reviews/ANALYTICS-DASHBOARD-20261008/screenshots/withdraw-${consentWidth}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Dừng ghi nhận", exact: true })
      .click();
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            (
              window as unknown as { trackingCalls: { name: string }[] }
            ).trackingCalls.filter((c) => c.name === "analyticsWithdraw")
              .length,
        ),
      )
      .toBeGreaterThan(0);
    await page.evaluate(
      async () =>
        await (
          window as unknown as { showPrivacy: () => Promise<void> }
        ).showPrivacy(),
    );
    await expect(
      page.getByRole("heading", { name: "Thống kê truy cập tùy chọn" }),
    ).toBeVisible();
    await expect(
      page.getByText("Cơ chế xóa tự động chạy nền", { exact: false }),
    ).toBeVisible();
    await page.screenshot({
      path: `docs/reviews/ANALYTICS-DASHBOARD-20261008/screenshots/privacy-${consentWidth}.png`,
      fullPage: true,
    });
  });

test("analytics text scaling and unavailable money stay readable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await mount(page, "disabled");
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  await expect(
    page.getByRole("tab", { name: "Khách hàng & mua hàng" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await expect(page.getByText("Ròng —.", { exact: false })).toBeVisible();
  await page.screenshot({
    path: "docs/reviews/ANALYTICS-DASHBOARD-20261008/screenshots/analytics-scale200.png",
    fullPage: true,
  });
});

test("product sorting works by keyboard and unknown paid counts stay last", async ({
  page,
}) => {
  await mount(page);
  const table = page
    .locator(".aChart")
    .filter({
      has: page.getByRole("heading", { name: "Sản phẩm được quan tâm" }),
    })
    .locator("table");
  await expect(table.locator("tbody tr").first()).toContainText(
    "Vitamin C Nhật Bản",
  );
  const clicks = page.getByRole("button", {
    name: "Sắp xếp theo Chọn",
    exact: true,
  });
  await clicks.focus();
  await page.keyboard.press("Enter");
  await expect(table.locator("tbody tr").first()).toContainText(
    "Đồ dùng gia đình",
  );
  await expect(table.locator("th[aria-sort=ascending]")).toContainText("Chọn");
  await page.evaluate(() => {
    (window as unknown as { analyticsMode: string }).analyticsMode =
      "unknownPaid";
  });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await page
    .getByRole("button", { name: "Sắp xếp theo Đơn đủ tiền", exact: true })
    .click();
  await expect(table.locator("tbody tr").first()).toContainText(
    "Đồ dùng gia đình",
  );
  await expect(table.locator("tbody tr").last()).toContainText("—");
  await page
    .getByRole("button", { name: "Sắp xếp theo Đơn đủ tiền", exact: true })
    .click();
  await expect(table.locator("tbody tr").last()).toContainText("—");
});

test("Back/Forward, remount and delayed product changes preserve actual view identity", async ({
  page,
}) => {
  await freezeHmr(page);
  const source = await (
    await page.request.get(`${base}/src/shared/AnalyticsConsent.tsx`)
  ).text();
  const entry = await (
    await page.request.get(`${base}/src/app/main.tsx`)
  ).text();
  const product = await (
    await page.request.get(`${base}/src/features/content/ProductDetail.tsx`)
  ).text();
  const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  const router = source.match(/from "([^"]*\/react-router-dom\.js[^"]*)"/)?.[1];
  const root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  const analyticsUrl = source.match(/from "([^"]*\/analytics\.ts[^"]*)"/)?.[1];
  expect(react && router && root && analyticsUrl).toBeTruthy();
  // Preserve the real ProductDetails hook; only its unrelated review/cart children and transport are synthetic.
  await page.route("**/src/features/content/ProductDetail.tsx*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: product.replace(
        /from "[^"]*\/analytics\.ts[^"]*"/,
        `from ${JSON.stringify(analyticsUrl)}`,
      ),
    }),
  );
  await page.route("**/src/features/content/ProductReviews.tsx*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: "export const ProductReviews=()=>null;",
    }),
  );
  await page.route("**/src/features/cart/AddToCart.tsx*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: "export const AddToCart=()=>null;",
    }),
  );
  await page.route("**/src/shared/firebase.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: "export const auth=null;export const functions={};",
    }),
  );
  await page.route("**/firebase_functions.js*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: 'export const httpsCallable=(_f,name)=>async data=>{window.trackingCalls.push({name,data});return {data:name==="analyticsSession"?{session:crypto.randomUUID(),startedAt:Date.now()}:{accepted:20}};};',
    }),
  );
  await page.route("**/navigation-analytics/main.js", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: `
 import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>(type)=>type;window.__vite_plugin_react_preamble_installed__=true;
 const React=(await import(${JSON.stringify(react)})).default;const {BrowserRouter,Link,useLocation}=await import(${JSON.stringify(router)});const {createRoot}=await import(${JSON.stringify(root)}).then(m=>m.default);
 const {AnalyticsConsent}=await import('/src/shared/AnalyticsConsent.tsx');const {ProductDetails}=await import('/src/features/content/ProductDetail.tsx');const {analyticsTracker}=await import(${JSON.stringify(analyticsUrl)});window.trackingCalls=[];window.flushAnalytics=()=>analyticsTracker.flush();
 function Fixture(){const location=useLocation();const [mount,setMount]=React.useState(0);const [row,setRow]=React.useState({id:'qa-navigation',title:'Sản phẩm điều hướng',body:'Mô tả kiểm thử',slug:'qa-navigation'});window.resolveProduct=()=>setRow({id:'qa-delayed',title:'Sản phẩm tải sau',body:'Mô tả kiểm thử',slug:'qa-delayed'});return React.createElement(React.Fragment,null,React.createElement(AnalyticsConsent,{key:mount,account:null,ready:true}),React.createElement(Link,{to:'/products/qa-navigation'},'Mở sản phẩm'),React.createElement(Link,{to:'/'},'Trang đầu'),React.createElement(Link,{to:'/products/qa-delayed'},'Sản phẩm tải sau'),React.createElement('button',{onClick:()=>setMount(x=>x+1)},'Dựng lại'),React.createElement('output',{'data-testid':'navigation'},location.pathname),location.pathname.startsWith('/products/')?React.createElement(ProductDetails,{key:mount,row}):null);}
 createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(BrowserRouter,null,React.createElement(Fixture))));
 `,
    }),
  );
  await page.route(`${base}/?analytics-nav=1`, (r) =>
    r.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="vi"><body><div id="root"></div><script type="module" src="/navigation-analytics/main.js"></script></body></html>',
    }),
  );
  await page.goto(`${base}/?analytics-nav=1`);
  await page
    .getByRole("button", { name: "Cho phép thống kê", exact: true })
    .click();
  async function counts() {
    return page.evaluate(async () => {
      const w = window as unknown as {
        flushAnalytics: () => Promise<void>;
        trackingCalls: { data: { events?: { kind: string }[] } }[];
      };
      await w.flushAnalytics();
      const events = w.trackingCalls.flatMap((c) => c.data.events ?? []);
      return {
        pages: events.filter((e) => e.kind === "page").length,
        products: events.filter((e) => e.kind === "product_view").length,
      };
    });
  }
  await expect.poll(counts).toEqual({ pages: 1, products: 0 });
  await page.getByRole("link", { name: "Mở sản phẩm", exact: true }).click();
  await expect(page.getByTestId("navigation")).toHaveText(
    "/products/qa-navigation",
  );
  await expect.poll(counts).toEqual({ pages: 2, products: 1 });
  await page.getByRole("button", { name: "Dựng lại", exact: true }).click();
  await expect.poll(counts).toEqual({ pages: 2, products: 1 });
  await page.goBack();
  await expect(page.getByTestId("navigation")).toHaveText("/");
  await expect.poll(counts).toEqual({ pages: 3, products: 1 });
  await page.goForward();
  await expect(page.getByTestId("navigation")).toHaveText(
    "/products/qa-navigation",
  );
  await expect.poll(counts).toEqual({ pages: 4, products: 2 });
  await page.getByRole("button", { name: "Dựng lại", exact: true }).click();
  await expect.poll(counts).toEqual({ pages: 4, products: 2 });
  await page
    .getByRole("link", { name: "Sản phẩm tải sau", exact: true })
    .click();
  await expect(page.getByTestId("navigation")).toHaveText(
    "/products/qa-delayed",
  );
  await expect.poll(counts).toEqual({ pages: 5, products: 2 });
  await expect(page.locator("[data-analytics-product-view]")).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as { resolveProduct: () => void }).resolveProduct(),
  );
  await expect(
    page.getByRole("heading", { name: "Sản phẩm tải sau", exact: true }),
  ).toBeVisible();
  await expect.poll(counts).toEqual({ pages: 5, products: 3 });
  const views = await page.evaluate(() =>
    (
      window as unknown as {
        trackingCalls: {
          data: { events?: { kind: string; productId?: string }[] };
        }[];
      }
    ).trackingCalls
      .flatMap((c) => c.data.events ?? [])
      .filter((e) => e.kind === "product_view")
      .map((e) => e.productId),
  );
  expect(views).toEqual(["qa-navigation", "qa-navigation", "qa-delayed"]);
});
