import { test, expect } from "@playwright/test";
const cid = "99999999-1111-4111-8111-111111111111";
test("Refreshed web references leave the previous expiry behind", async ({ page }) => {
  const source = await (
      await page.request.get("/src/features/ask/WebDiscovery.tsx")
    ).text(),
    entry = await (await page.request.get("/src/app/main.tsx")).text();
  const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1],
    root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
  await page.route("**/src/shared/firebase.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body: "export const auth={currentUser:{uid:'qa-web-owner'}};export async function callService(){throw Error('This expiry scenario must not dispatch a command')}",
    }),
  );
  await page.route("**/qa-web-refresh", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const{WebDiscovery}=await import('/src/features/ask/WebDiscovery.tsx');const view=ReactDOM.createRoot(document.getElementById('root'));const commerce={user:{uid:'qa-web-owner'},conversationId:'${cid}',conversation:{version:0},restorationReady:true,draft:{},busy:false,pendingOperation:null,order:null};const render=(expiresAt)=>view.render(React.createElement(WebDiscovery,{commerce,vi:true,active:true,result:{conversationId:'${cid}',expectedVersion:0,market:'US',discoveryId:'a'.repeat(64),queryHash:'b'.repeat(64),observedAt:Date.now()-2000,expiresAt,candidates:[{url:'https://store.example/item',title:'Synthetic headphones',price:null,reviews:null,verified:false}],suggestionsHtml:'<div>Search Suggestions</div>'}}));render(Date.now()-1000);window.qaRenew=()=>render(Date.now()+600000);</script>`,
    }),
  );
  await page.goto("/qa-web-refresh");
  const fill = page.getByRole("button", {
    name: "Điền vào bản nháp mua hộ",
    exact: true,
  });
  await expect(fill).toBeDisabled();
  await page.evaluate(() =>
    (window as unknown as { qaRenew: () => void }).qaRenew(),
  );
  await expect(fill).toBeEnabled();
  await page.getByLabel("Số lượng", { exact: false }).fill("2");
  await page.getByLabel("Mẫu anh/chị muốn mua", { exact: false }).fill("Đen");
});
for (const mode of [
  "happy",
  "market-followup",
  "no-market",
  "partial",
  "catalog-offline",
  "web-offline",
  "malformed",
  "guest",
  "chat-selection",
  "mobile",
]) {
  test(`Actual Ask web integration ${mode}`, async ({ page }) => {
    if (mode === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const source = await (
        await page.request.get("/src/features/ask/Ask.tsx")
      ).text(),
      entry = await (await page.request.get("/src/app/main.tsx")).text();
    const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1],
      router = source.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1],
      root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `
      export const auth={currentUser:${mode === "guest" ? "null" : "{uid:'qa-web-owner'}"}},db={},functions=null,app=null,configured=false,emulatorMode=true;export const login=async()=>{};
      export async function callService(name,data){window.qaCalls=(window.qaCalls||[]).concat({name,data});
        if(name==='currentAskConversation')return {conversationId:'${cid}'};
        if(name==='askWorkflow'){
          const patch={version:data.expectedVersion+1};
          if(data.action==='saveDraft')patch.draft=data.payload;
          if(data.action==='saveTurn')patch.turns=[...window.qaConversation.turns,data.payload].slice(-24);
          window.qaEmitConversation(patch);
          return {version:patch.version};
        }
        if(name==='askWebDiscovery'){
          if('${mode}'==='web-offline')throw Error('Synthetic unavailable');
          if('${mode}'==='malformed')return {candidates:[]};
          const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({query:data.query,market:data.market})));
          const queryHash=[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
          const result={conversationId:data.conversationId,expectedVersion:data.expectedVersion,market:data.market,queryHash,discoveryId:'a'.repeat(64),observedAt:Date.now(),expiresAt:Date.now()+600000,candidates:[{url:'https://store.example/item',title:'Synthetic headphones',price:null,reviews:null,verified:false}],suggestionsHtml:'<div style="font:14px sans-serif"><a href="https://www.google.com/search?q=synthetic" target="_blank">Search Suggestions</a></div><script>parent.qaInjected=true;</script>'};window.qaDiscovery=result;return result;
        }
        if(name==='askWebSelect'){const{webReferenceDraft}=await import('/packages/domain/ask-web.ts');return {draft:webReferenceDraft(window.qaDiscovery,data.index,data.quantity,data.variant)}}
        throw Error('Unexpected '+name)
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
        body: `export const doc=(_,kind,id)=>({kind,id}),collection=(_,kind)=>({kind}),query=x=>x,where=()=>null,limit=()=>null,orderBy=()=>null,documentId=()=>null,startAfter=()=>null;
        export const getDocs=async()=>({docs:[]});export const getDoc=async()=>({metadata:{fromCache:false},data:()=>undefined,exists:()=>false});
        window.qaConversation={ownerId:'qa-web-owner',version:0,updatedAt:Date.now(),turns:[],draft:{}};
        const listeners=new Set();const snapshot=()=>({metadata:{fromCache:false},data:()=>window.qaConversation});
        window.qaEmitConversation=patch=>{window.qaConversation={...window.qaConversation,...patch,updatedAt:Date.now()};for(const ok of listeners)ok(snapshot())};
        export function onSnapshot(ref,...args){const ok=args.find(x=>typeof x==='function');let live=true;if(ref.kind==='askConversations')listeners.add(ok);queueMicrotask(()=>{if(!live)return;if(ref.kind==='askConversations')ok(snapshot());else ok({metadata:{fromCache:false},docs:[],data:()=>undefined,exists:()=>false})});return()=>{live=false;listeners.delete(ok)}}`,
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
        body: `export async function searchPublishedCatalog(){if('${mode}'==='catalog-offline')throw Error('Synthetic catalog offline');return {rows:[],cursor:null,hasMore:${mode === "partial"},stale:false}}`,
      }),
    );
    await page.route("**/src/features/ask/transport.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: "export const askRateLimited=()=>false;export const askService=async()=>{window.qaModelCalls=(window.qaModelCalls||0)+1;return {language:'vi',title:'Synthetic fallback',paragraphs:['Synthetic fallback'],sourceIds:[],bullets:[],action:'none'}}",
      }),
    );
    await page.route("**/qa-web-integration", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const {Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask)));</script>`,
      }),
    );
    await page.goto("/qa-web-integration");
    const send = async (text: string) => {
      const input = page
        .getByRole("textbox", { name: "Hỏi SatsunicGo" })
        .last();
      await expect(input).toBeEnabled();
      await input.fill(text);
      await input.press("Enter");
    };
    await send(
      mode === "no-market" || mode === "market-followup"
        ? "tìm tai nghe synthetic"
        : "tìm tai nghe synthetic ở Mỹ",
    );
    if (mode === "market-followup") {
      await expect(page.getByText(/muốn tìm sản phẩm ở Mỹ/)).toBeVisible();
      await send("Mỹ");
    }
    if (mode === "partial")
      await expect(
        page.getByText(
          "Chưa thấy sản phẩm trong phần đã kiểm tra. Có thể tìm tiếp.",
        ),
      ).toBeVisible();
    else if (mode === "catalog-offline") {
      await expect(
        page.getByRole("heading", { name: "Synthetic fallback" }),
      ).toBeVisible();
    } else if (mode === "no-market")
      await expect(page.getByText(/muốn tìm sản phẩm ở Mỹ/)).toBeVisible();
    else if (mode === "guest")
      await expect(page.getByText(/đăng nhập và mở hội thoại/)).toBeVisible();
    else if (["web-offline", "malformed"].includes(mode))
      await expect(
        page.getByText(/Chưa xác nhận được kết quả tìm web/),
      ).toBeVisible();
    else {
      await expect(
        page.getByRole("link", { name: "1. Synthetic headphones" }),
      ).toBeVisible();
      await expect(
        page
          .frameLocator('iframe[title="Gợi ý tìm kiếm của Google"]')
          .getByText("Search Suggestions"),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => (window as unknown as { qaInjected?: boolean }).qaInjected,
        ),
      ).toBeUndefined();
      const iframe = page.locator('iframe[title="Gợi ý tìm kiếm của Google"]');
      expect(await iframe.getAttribute("sandbox")).not.toContain(
        "allow-scripts",
      );
      expect(await iframe.getAttribute("sandbox")).not.toContain(
        "allow-same-origin",
      );
      if (mode === "chat-selection") {
        await send("chọn nguồn 1, số lượng 2, mẫu Đen");
        await expect(
          page.getByText(/Đã điền bản nháp trong tác vụ hiện tại/),
        ).toBeVisible();
        const calls = await page.evaluate(
          () =>
            (
              window as unknown as {
                qaCalls: { name: string; data: Record<string, unknown> }[];
              }
            ).qaCalls,
        );
        const writes = calls.filter((x) => x.name === "askWorkflow");
        expect(writes.some((x) => x.data.action === "saveDraft")).toBe(true);
        expect(
          writes.some((x) =>
            ["submitRequest", "acceptQuote", "catalogCheckout"].includes(
              String(x.data.action),
            ),
          ),
        ).toBe(false);
      }
    }
    const calls = await page.evaluate(
      () =>
        (window as unknown as { qaCalls?: { name: string }[] }).qaCalls ?? [],
    );
    expect(calls.filter((x) => x.name === "askWebDiscovery").length).toBe(
      ["partial", "catalog-offline", "no-market", "guest"].includes(mode)
        ? 0
        : 1,
    );
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `output/ask-integration/${mode}.png`,
      fullPage: true,
    });
  });
}
for (const mode of [
  "evaluation",
  "acknowledge",
  "resolve",
  "unapproved",
  "unknown",
  "switch",
  "mobile",
]) {
  test(`Actual feedback review ${mode}`, async ({ page }) => {
    if (mode === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    const source = await (
        await page.request.get("/src/features/settings/KnowledgeApproval.tsx")
      ).text(),
      entry = await (await page.request.get("/src/app/main.tsx")).text();
    const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1],
      root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
    await page.route("**/*firebase_auth.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export function onAuthStateChanged(auth,fn){queueMicrotask(()=>fn(auth.currentUser));window.qaSwitch=()=>{auth.currentUser={uid:'other-owner'};fn(auth.currentUser)};return()=>{}}`,
      }),
    );
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const auth={currentUser:{uid:'qa-owner'}};export async function callService(name,data){window.qaCalls=(window.qaCalls||[]).concat({name,data});if(name==='askFeedbackInbox')return {rows:[{ownerId:'qa-customer',feedbackId:'11111111-1111-4111-8111-111111111111',category:'missing_information',reviewVersion:1,createdAt:Date.now(),expiresAt:Date.now()+600000,disposition:'unreviewed'}],limited:false};if(name==='askKnowledgePreview')return {source:'posts',sourceId:'qa-guide',title:'Synthetic guide',body:'Synthetic guidance for review.',published:true,active:${mode !== "unapproved"},approved:${mode !== "unapproved"},version:2,contentHash:'a'.repeat(64)};if(name==='askFeedbackEvaluation')return {datasetHash:'a'.repeat(64),corpusHash:'b'.repeat(64),cases:[{id:'public-qa',passed:true}],passed:1,total:1,decision:'REVIEW_REQUIRED',scope:'retrieval_only',automaticPromotion:false};if(name==='askFeedbackReview'){if('${mode}'==='switch')window.qaSwitch();if('${mode}'==='unknown'&&window.qaCalls.filter(x=>x.name===name).length===1)throw Error('Synthetic response loss');return {version:data.expectedVersion+1}}throw Error('Unexpected '+name)}`,
      }),
    );
    await page.route("**/qa-learning", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root" class="panel knowledgeApproval"></div><script type="module">import '/src/styles/global.css';import '/src/features/settings/knowledge-approval.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const{FeedbackReview}=await import('/src/features/settings/FeedbackReview.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(FeedbackReview));</script>`,
      }),
    );
    await page.goto("/qa-learning");
    await page.getByRole("button", { name: "Tải góp ý", exact: true }).click();
    if (mode === "evaluation") {
      await page
        .getByRole("button", { name: "Kiểm tra tìm nguồn tiếng Việt" })
        .click();
      await expect(page.getByText(/1\/1 câu kiểm chứng/)).toBeVisible();
      await expect(
        page.getByText(/chưa đánh giá câu trả lời LLM/),
      ).toBeVisible();
      return;
    }
    await page
      .getByLabel("Chọn góp ý")
      .selectOption("qa-customer-11111111-1111-4111-8111-111111111111");
    if (["resolve", "unapproved"].includes(mode)) {
      await page.getByLabel("Kết quả xem xét").selectOption("resolved");
      await page.getByLabel("Mã bài viết").fill("qa-guide");
      await page
        .getByRole("button", { name: "Kiểm tra nguồn đã duyệt", exact: true })
        .click();
      await expect(
        page.getByText("Synthetic guidance for review."),
      ).toBeVisible();
    }
    await page.getByRole("checkbox").check();
    const record = page.getByRole("button", {
      name: "Ghi nhận xem xét",
      exact: true,
    });
    if (mode === "unapproved") await expect(record).toBeDisabled();
    else {
      await record.click();
      if (mode === "unknown") {
        await page
          .getByRole("button", { name: "Đối chiếu lượt xem xét đang chờ" })
          .click();
        const calls = await page.evaluate(() =>
          (
            window as unknown as { qaCalls: { name: string; data: unknown }[] }
          ).qaCalls.filter((x) => x.name === "askFeedbackReview"),
        );
        expect(calls).toHaveLength(2);
        expect(calls[0].data).toEqual(calls[1].data);
      }
      if (mode === "switch")
        await expect(page.getByText(/Đã ghi nhận xem xét/)).toHaveCount(0);
      else await expect(page.getByText(/Đã ghi nhận xem xét/)).toBeVisible();
    }
    await page.screenshot({
      path: `output/ask-integration/review-${mode}.png`,
      fullPage: true,
    });
  });
}
