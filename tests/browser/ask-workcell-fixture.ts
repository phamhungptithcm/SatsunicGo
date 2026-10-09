import { expect, type Page } from "@playwright/test";

const cid = "55555555-1111-4111-8111-111111111111";
const draft = {
  market: "US",
  items: [{ name: "Synthetic product", quantity: 1, variant: "Blue", url: "" }],
  notes: "",
};
export type Fixture = Window & {
  qaConversation: { draft: { items: { quantity: number }[] } };
  qaOrder: { quote: { expiresAt: number } };

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
export async function setup(page: Page, mode = "draft", english = false) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      url.hostname !== "127.0.0.1" ||
      url.port !== "5207" ||
      route.request().method() !== "GET"
    )
      return route.abort();
    return route.continue();
  });
  const source = await (
    await page.request.get("/src/features/ask/Ask.tsx")
  ).text();
  const entry = await (await page.request.get("/src/app/main.tsx")).text();
  const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
  const router = source.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1];
  const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
  const orderMode =
    mode.startsWith("recipient") ||
    ["auth", "version", "final", "receipt", "expired-quote"].includes(mode);
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
    export const auth={currentUser:${mode === "anonymous" ? "null" : "{uid:'qa-panel-owner'}"}},db={},functions=null,app=null,configured=false,emulatorMode=true;export const login=async()=>{};
    window.qaCommands=[];window.qaPaymentCalls=[];
    export async function callService(name,data){
      if(name==='currentAskConversation')return {conversationId:'${cid}'};
      if(name==='createPaymentLink'){window.qaPaymentCalls.push(data);return {checkoutUrl:'https://pay.payos.vn/synthetic-local-only'}};
      if(name!=='askWorkflow')throw Error('Unexpected local API '+name);
      window.qaCommands.push(data);
      if(data.action==='resume')return {version:window.qaConversation.version,outcome:'no_operation'};
      if('${mode}'==='held-submit'&&data.action==='submitRequest')await new Promise(r=>window.qaRelease=r);
      if('${mode}'==='unknown-submit'&&data.action==='submitRequest')throw Error('Synthetic transport result unknown');
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
      body: `const listeners=new Set();export function onAuthStateChanged(auth,fn){listeners.add(fn);queueMicrotask(()=>fn(auth.currentUser));window.qaSwitchTo=uid=>{auth.currentUser={uid};for(const f of listeners)f(auth.currentUser)};window.qaSwitch=()=>window.qaSwitchTo('qa-other');return()=>listeners.delete(fn)}`,
    }),
  );
  await page.route("**/*firebase_firestore.js*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
    export const doc=(_,kind,id)=>({kind,id}),collection=(_,kind)=>({kind}),query=x=>x,where=()=>null,limit=()=>null,orderBy=()=>null,documentId=()=>null,startAfter=()=>null;export const getDocs=async ref=>({docs:'${mode}'==='catalog'&&ref.kind==='products'?[{id:'synthetic-catalog',data:()=>window.qaProduct}]:[],size:'${mode}'==='catalog'?1:0,metadata:{fromCache:false}});export const getDoc=async ref=>({metadata:{fromCache:false},exists:()=>true,data:()=>window.qaProduct});
    window.qaConversation={ownerId:'qa-panel-owner',version:0,updatedAt:Date.now(),turns:${JSON.stringify(turns)},draft:${JSON.stringify(mode === "performance" ? { ...draft, items: Array.from({ length: 30 }, (_, i) => ({ ...draft.items[0], name: `Synthetic item ${i}` })) } : mode === "normalized" ? { market: "US", items: [{ name: "  Synthetic product  ", quantity: 1 }] } : draft)},${orderMode ? "orderId:'qa-panel-order',recipientSaved:true" : ""}};
    window.qaProduct={title:'Synthetic catalog product',slug:'synthetic-catalog',status:'published',market:'US',version:3,orderable:true,listedPrice:700,termsVersion:'catalog-terms-v1',catalogOptions:['Blue']};
    window.qaOrder={id:'qa-panel-order',ownerId:'qa-panel-owner',market:'US',items:${JSON.stringify(draft.items)},notes:'',stage:'QUOTED',version:2,createdAt:1,collected:0,refunded:0,quoteVersion:1,deposit:500,quote:{goods:1000,service:0,sourceCosts:0,internationalShipping:0,destinationShipping:0,discount:0,sourceCurrency:'USD',sourceMinor:100,fxNumerator:10,fxDenominator:1,verifiedProduct:'Synthetic quote',termsVersion:'qa-v1',expiresAt:Date.now()+600000}};
    if('${mode}'==='final')Object.assign(window.qaOrder,{stage:'PACKED',finalTotal:1300,finalApproved:false});if('${mode}'==='receipt')Object.assign(window.qaOrder,{stage:'DELIVERED'});if('${mode}'==='expired-quote')window.qaOrder.quote.expiresAt=Date.now()-1000;
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
      body: `export const askRateLimited=()=>false;export async function askService(){return {language:'${english ? "en" : "vi"}',title:'Synthetic answer',paragraphs:['Synthetic unrelated answer'],bullets:[],sourceIds:[],action:'none'${mode === "anonymous" ? ",shoppingDraft:" + JSON.stringify(draft) : mode === "llm-edit" ? ",shoppingDraft:" + JSON.stringify({ market: "US", items: [{ ...draft.items[0], name: "New synthetic product", url: "https://merchant.example.invalid/new-item" }] }) : ""}}}`,
    }),
  );
  await page.route("**/qa-ask-workcell", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<title>Ask workcell fixture</title><div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const{Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask)));</script>`,
    }),
  );
  await page.goto("/qa-ask-workcell");
  if (mode === "anonymous") return errors;
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
  await page
    .getByRole("button", {
      name: english ? "Current task" : "Tác vụ hiện tại",
      exact: true,
    })
    .click();
  await expect(page).toHaveTitle("Ask workcell fixture");
  return errors;
}
export async function chat(page: Page, text: string) {
  const input = page
    .getByRole("textbox", { name: /Hỏi SatsunicGo|Ask SatsunicGo/ })
    .filter({ visible: true });
  await input.fill(text);
  await input.press("Enter");
  if (!/^(?:yes|no|đồng ý|chưa|continue|tiếp tục)$/iu.test(text)) {
    await expect(page.locator("[data-ask-turn]").last()).toContainText(text);
    await expect(
      page.locator("[data-ask-turn]").last().locator("h2"),
    ).toHaveCount(1);
  }
}
export async function commands(page: Page, action: string) {
  return page.evaluate(
    (action) =>
      (window as unknown as Fixture).qaCommands.filter(
        (c) => c.action === action,
      ),
    action,
  );
}
