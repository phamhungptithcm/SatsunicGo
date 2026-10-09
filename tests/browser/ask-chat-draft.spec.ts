import { test, expect } from "@playwright/test";
for (const mode of [
  "quantity",
  "variant",
  "market",
  "invalid",
  "multi",
  "mobile",
  "open-form",
  "manual-other",
  "compound-vi",
  "compound-en",
  "compound-reject",
  "invalid-en",
])
  test(`Ask chat fills actual draft panel ${mode}`, async ({ page }) => {
    const english = mode === "compound-en" || mode === "invalid-en";
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    if (mode === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
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
        body: `export const auth=null,db=null,functions=null,app=null,configured=false,emulatorMode=true;export const login=async()=>{};export const callService=async()=>{throw Error('Unexpected API dispatch')};`,
      }),
    );
    await page.route("**/src/features/ask/ImageIntake.tsx*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const useAskImages=()=>({photos:[],working:false,prepare:async()=>[],markSent:()=>{},add:()=>{},remove:()=>{}});`,
      }),
    );
    const commerce = await (
      await page.request.get("/src/features/ask/Commerce.tsx")
    ).text();
    if (!commerce.includes("function useAskCommerce("))
      throw Error("Commerce hook entry changed");
    // Replace only the data hook; actual Ask routing, parser and CommercePanel/form render.
    await page.route("**/src/features/ask/Commerce.tsx*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body:
          commerce.replace(
            "function useAskCommerce(",
            "function originalUseAskCommerce(",
          ) +
          `
export function useAskCommerce(onRestore){const [draft,setDraft]=useState({market:'US',items:[{name:'Synthetic product',quantity:1,variant:'Blue',url:'https://merchant.example.invalid/item'}${mode === "multi" ? ",{name:'Second product',quantity:1,variant:'Red',url:''}" : ""}],notes:'Keep manual notes'});const [error,setError]=useState('');useEffect(()=>{${english ? "onRestore({ownerId:'',version:0,updatedAt:0,turns:[{id:'qa-restored-language',question:'answer in english',answer:{language:'en',title:'English preference',paragraphs:['Synthetic restored language preference'],sourceIds:[],bullets:[],action:'home'}}]})" : ""}},[]);window.qaDraft=draft;return {commandScope:()=>null,commandIdentity:()=>({ownerId:null,conversationId:null,epoch:0}),reviewBarrier:async()=>null,user:null,conversation:null,conversationId:undefined,restorationReady:true,order:null,pendingOperation:null,busy:false,draft,setDraft,error,setError,catalogSlugs:[],newConversation:async()=>{},resume:async()=>{},run:async data=>{window.qaMutations=(window.qaMutations||[]).concat(data);return true},resolved:async(q,a)=>{if(a.shoppingDraft)setDraft(a.shoppingDraft)}}}`,
      }),
    );
    await page.route("**/src/features/ask/transport.ts*", (r) => {
      return r.fulfill({
        contentType: "text/javascript",
        body: `export const askRateLimited=()=>false;export const askService=async()=>{window.qaModelCalls=(window.qaModelCalls||0)+1;throw Error('Unexpected model dispatch')};`,
      });
    });
    await page.route("**/ask-chat-draft-fixture", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const {Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask)));</script>`,
      }),
    );
    await page.goto("/ask-chat-draft-fixture");
    const idle = page
      .getByRole("textbox", {
        name: english ? "Ask SatsunicGo" : "Hỏi SatsunicGo",
      })
      .filter({ visible: true });
    const compound = mode === "compound-vi" || mode === "compound-en";
    const query =
      mode === "compound-vi"
        ? "mình lấy 2 cái, size M, mua từ Nhật nhé"
        : mode === "compound-en"
          ? "please quantity:2; variant:M; market:Japan"
          : mode === "compound-reject"
            ? "size M và số lượng 2 và gửi yêu cầu"
            : mode === "invalid-en"
              ? "please quantity 0"
              : mode === "variant"
                ? "size M"
                : mode === "market"
                  ? "mua từ Nhật"
                  : mode === "invalid"
                    ? "quantity 0"
                    : "số lượng 2";
    if (
      [
        "open-form",
        "manual-other",
        "compound-vi",
        "compound-en",
        "compound-reject",
      ].includes(mode)
    ) {
      await page
        .getByRole("button", {
          name: english ? "Continue conversation" : "Tiếp tục hội thoại",
        })
        .click();
      await page
        .getByRole("button", {
          name: english ? "Current task" : "Tác vụ hiện tại",
          exact: true,
        })
        .click();
      await page
        .getByText(
          english ? "Enter details if needed" : "Điền thông tin nếu cần",
          { exact: true },
        )
        .click();
      await expect(page.locator('input[name="quantity-0"]')).toHaveValue("1");
      if (mode === "manual-other")
        await page
          .locator('textarea[name="notes"]')
          .fill("Manual notes must survive quantity change");
    }
    await idle.fill(query);
    await idle.press("Enter");
    const clarify = [
      "invalid",
      "multi",
      "compound-reject",
      "invalid-en",
    ].includes(mode);
    await expect(
      page.getByRole("heading", {
        includeHidden: true,
        name: clarify
          ? english
            ? "How would you like to change it?"
            : "Anh/chị muốn sửa thế nào?"
          : english
            ? "Draft updated"
            : "Đã điền vào bản nháp",
      }),
    ).toBeAttached();
    if (clarify)
      await expect(
        page
          .getByRole("textbox", {
            name: english ? "Ask SatsunicGo" : "Hỏi SatsunicGo",
          })
          .filter({ visible: true }),
      ).toBeFocused();
    if (!clarify) {
      await expect(
        page
          .getByRole("textbox", {
            name: english ? "Ask SatsunicGo" : "Hỏi SatsunicGo",
          })
          .filter({ visible: true }),
      ).toBeFocused();
      await expect(
        page.getByRole("region", {
          name: english ? "Buying request" : "Yêu cầu mua hộ",
          exact: true,
        }),
      ).toBeVisible();
      const panel = page.getByRole("region", {
        name: english ? "Buying request in chat" : "Yêu cầu mua hộ trong chat",
      });
      await expect(panel).toContainText(
        compound
          ? "Synthetic product · M · 2"
          : mode === "variant"
            ? "Synthetic product · M · 1"
            : mode === "market"
              ? "Synthetic product · Blue · 1"
              : "Synthetic product · Blue · 2",
      );
      if (
        !["open-form", "manual-other", "compound-vi", "compound-en"].includes(
          mode,
        )
      )
        await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
      await expect(page.locator('input[name="quantity-0"]')).toHaveValue(
        mode === "variant" || mode === "market" ? "1" : "2",
      );
      if (mode === "variant" || compound)
        await expect(page.locator('input[name="variant-0"]')).toHaveValue("M");
      if (mode === "market" || compound)
        await expect(page.locator('select[name="market"]')).toHaveValue("JP");
      if (mode === "manual-other")
        await expect(page.locator('textarea[name="notes"]')).toHaveValue(
          "Manual notes must survive quantity change",
        );
    } else {
      expect(
        await page.evaluate(
          () =>
            (
              window as unknown as {
                qaDraft: { items: { quantity: number }[] };
              }
            ).qaDraft.items[0].quantity,
        ),
      ).toBe(1);
      const unchanged = await page.evaluate(
        () =>
          (
            window as unknown as {
              qaDraft: { market: string; items: { variant: string }[] };
            }
          ).qaDraft,
      );
      expect(unchanged.market).toBe("US");
      expect(unchanged.items[0].variant).toBe("Blue");
    }
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { qaMutations?: unknown[] }).qaMutations ?? [],
      ),
    ).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { qaModelCalls?: number }).qaModelCalls ?? 0,
      ),
    ).toBe(0);
    await page.screenshot({ path: `output/ask-chat-draft/${mode}.png` });
  });
