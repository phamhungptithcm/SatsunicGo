import { test, expect, type Page } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
const evidence = "docs/reviews/ASK-PRODUCTION-READINESS-20261008/frontend";
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
  if (process.env.ASK_DASHBOARD_CAPTURE_BASELINE === "1")
    writeFileSync(`${evidence}/baseline/Dashboard.transformed.js`, source);
  if (process.env.ASK_DASHBOARD_REPLAY_BASELINE === "1")
    await page.route("**/src/features/crm/Dashboard.tsx*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: readFileSync(
          `${evidence}/baseline/Dashboard.transformed.js`,
          "utf8",
        ),
      }),
    );
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

for (const width of [320, 390, 1440, 720])
  test(`custom UTC fields required markers, keyboard and overflow ${width}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page);
    const custom = page.getByRole("button", { name: "Tùy chọn", exact: true });
    await custom.focus();
    await page.keyboard.press("Enter");
    await expect(custom).toHaveAttribute("aria-expanded", "true");
    const from = page.getByRole("textbox", {
      name: "Từ ngày (UTC)",
      exact: true,
    });
    const until = page.getByRole("textbox", {
      name: "Đến ngày (UTC)",
      exact: true,
    });
    const form = page.locator("form.d94Custom");
    await expect(form.locator('input[type="date"]')).toHaveCount(2);
    await expect(from).toHaveAttribute("required", "");
    await expect(until).toHaveAttribute("required", "");
    const tier =
      process.env.ASK_DASHBOARD_CAPTURE_BASELINE === "1" ||
      process.env.ASK_DASHBOARD_REPLAY_BASELINE === "1"
        ? "baseline"
        : "current";
    const readback = await form.evaluate((el) => ({
      labels: [...el.querySelectorAll("label")].map((label) => ({
        text: label.textContent?.trim(),
        markerCount: label.querySelectorAll('.requiredMark[aria-hidden="true"]')
          .length,
        nativeRequired: label.querySelector("input")?.required,
        dateValue: label.querySelector("input")?.value,
      })),
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      formDisplay: getComputedStyle(el).display,
      fieldRects: [...el.querySelectorAll("label,input,button")].map(
        (field) => {
          const rect = field.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width };
        },
      ),
      viewport: innerWidth,
    }));
    writeFileSync(
      `${evidence}/${tier}-${width}-readback.json`,
      JSON.stringify(
        {
          tier: "SYNTHETIC_LOCAL_COMPONENT_BROWSER",
          ...readback,
          nativeZoom: "NOT_RUN",
          layout:
            width === 720
              ? "1440 at 200% layout-equivalent; 720 CSSpx"
              : `${width} CSSpx`,
          screenReaderAudio: "NOT_RUN",
        },
        null,
        2,
      ),
    );
    writeFileSync(
      `${evidence}/${tier}-${width}-ax.yaml`,
      await form.ariaSnapshot(),
    );
    const clip = await form.evaluate((el) => {
      const rects = [...el.children].map((child) =>
        child.getBoundingClientRect(),
      );
      const x = Math.min(...rects.map((r) => r.left)),
        y = Math.min(...rects.map((r) => r.top));
      return {
        x: x + scrollX,
        y: y + scrollY,
        width: Math.max(...rects.map((r) => r.right)) - x,
        height: Math.max(...rects.map((r) => r.bottom)) - y,
      };
    });
    await page.screenshot({
      path: `${evidence}/screenshots/${tier}-${width}-fields.png`,
      clip,
    });
    await page.screenshot({
      path: `${evidence}/screenshots/${tier}-${width}-context.png`,
    });
    const cdp = await page.context().newCDPSession(page);
    const axTree = await cdp.send("Accessibility.getFullAXTree");
    const fieldsAX = axTree.nodes.filter(
      (node) =>
        !node.ignored &&
        ["Từ ngày (UTC)", "Đến ngày (UTC)"].includes(
          String(node.name?.value).trim(),
        ),
    );
    const documentNode = await cdp.send("DOM.getDocument");
    const nativeFields = await cdp.send("DOM.querySelectorAll", {
      nodeId: documentNode.root.nodeId,
      selector: '.d94Custom input[type="date"]',
    });
    const nativeFieldAX = await Promise.all(
      nativeFields.nodeIds.map((nodeId) =>
        cdp.send("Accessibility.getPartialAXTree", {
          nodeId,
          fetchRelatives: false,
        }),
      ),
    );
    expect(
      nativeFieldAX.map((tree) => String(tree.nodes[0]?.name?.value).trim()),
    ).toEqual(["Từ ngày (UTC)", "Đến ngày (UTC)"]);
    const nativeRequiredPropertyAvailable = nativeFieldAX.every((tree) =>
      tree.nodes[0]?.properties?.some(
        (property) =>
          property.name === "required" && property.value.value === true,
      ),
    );
    const nativeSubtrees = nativeFieldAX.map((tree) => {
      const nodes = new Map(axTree.nodes.map((node) => [node.nodeId, node]));
      const result: typeof axTree.nodes = [];
      const visit = (id: string) => {
        const node = nodes.get(id);
        if (!node) return;
        result.push(node);
        node.childIds?.forEach(visit);
      };
      visit(tree.nodes[0].nodeId);
      return result;
    });
    writeFileSync(
      `${evidence}/${tier}-${width}-native-ax.json`,
      JSON.stringify(
        {
          browser: page.context().browser()?.version(),
          nodes: fieldsAX,
          nativeFields: nativeFieldAX,
          nativeSubtrees,
          nativeRequiredPropertyAvailable,
          requiredDOMAndNativeValidation:
            "Verified separately; Date AX required property is recorded, not assumed",
          screenReaderAudio: "NOT_RUN",
        },
        null,
        2,
      ),
    );
    await cdp.detach();
    await expect(form.locator('.requiredMark[aria-hidden="true"]')).toHaveCount(
      2,
    );
    expect(readback.labels.map((label) => label.markerCount)).toEqual([1, 1]);
    expect(readback.documentScrollWidth).toBeLessThanOrEqual(
      readback.documentClientWidth,
    );
    expect(
      readback.fieldRects.every(
        (rect) => rect.left >= 0 && rect.right <= width,
      ),
    ).toBe(true);
    await page.keyboard.press("Tab");
    await expect(from).toBeFocused();
    // Native Chromium date controls have segmented keyboard stops. Both fields
    // remain reachable without assumptions about the locale's segment ordering.
    let reachedUntil = false;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      if (await until.evaluate((el) => el === document.activeElement)) {
        reachedUntil = true;
        break;
      }
    }
    expect(reachedUntil).toBe(true);
    await expect(until).toBeFocused();
    const dates = new Date().toISOString().slice(0, 10);
    await from.fill(dates);
    await until.fill(dates);
    const apply = page.getByRole("button", { name: "Áp dụng", exact: true });
    let reachedApply = false;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      if (await apply.evaluate((el) => el === document.activeElement)) {
        reachedApply = true;
        break;
      }
    }
    expect(reachedApply).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`from=${dates}.*until=${dates}`));
    await expect(from).toHaveValue(dates);
    await expect(until).toHaveValue(dates);
    // Wait for the applied range's read and hydration before starting a new edit.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { analyticsCalls: unknown[] }).analyticsCalls
              .length,
        ),
      )
      .toBe(2);
    await expect(
      page.getByRole("button", { name: "Làm mới", exact: true }),
    ).toBeEnabled();
    const readsBeforeInvalid = await page.evaluate(
      () =>
        (window as unknown as { analyticsCalls: unknown[] }).analyticsCalls
          .length,
    );
    await from.fill("");
    await expect(from).toHaveValue("");
    await apply.click();
    expect(
      await from.evaluate(
        (el) => (el as HTMLInputElement).validity.valueMissing,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { analyticsCalls: unknown[] }).analyticsCalls
            .length,
      ),
    ).toBe(readsBeforeInvalid);
    await from.fill(dates);
    await expect(form.locator('input[type="date"]')).toHaveCount(2);
    expect(errors).toEqual([]);
    writeFileSync(
      `${evidence}/current-${width}-interaction.json`,
      JSON.stringify(
        {
          keyboardFrom: true,
          keyboardUntil: reachedUntil,
          keyboardApply: reachedApply,
          sameDayApply: dates,
          emptyNativeRequiredBlockedFetch: true,
          pageErrors: errors,
        },
        null,
        2,
      ),
    );
  });
