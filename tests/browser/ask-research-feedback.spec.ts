import { test, expect } from "@playwright/test";
for (const mode of [
  "research-vi",
  "research-en",
  "research-mobile",
  "research-narrow",
  "research-scaled",
  "research-empty",
  "research-unknown-price",
  "research-offline",
  "research-expired",
  "feedback-mobile",
  "feedback-keyboard",
  "feedback-offline",
  "feedback-unchecked",
  "research-stale",
  "research-malformed",
  "research-switch",
  "research-pending",
  "research-partial",
  "feedback-vi",
  "feedback-en",
  "feedback-lost",
  "feedback-malformed",
  "feedback-switch",
  "feedback-withdraw",
  "feedback-withdraw-lost",
])
  test(`Actual research and feedback ${mode}`, async ({ page }) => {
    const english = mode.endsWith("-en"),
      feedback = mode.startsWith("feedback"),
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    if (
      mode === "research-mobile" ||
      mode === "feedback-mobile" ||
      mode === "research-scaled"
    )
      await page.setViewportSize({ width: 390, height: 844 });
    if (mode === "research-narrow")
      await page.setViewportSize({ width: 320, height: 760 });
    const entry = await (await page.request.get("/src/app/main.tsx")).text(),
      component = await (
        await page.request.get("/src/features/ask/Ask.tsx")
      ).text();
    const react = component.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1],
      root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1],
      router = component.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1];
    const now = Date.now(),
      offer = {
        title: "Synthetic headphones",
        market: "US",
        variant: "Black",
        sellerId: "first-party",
        url: "https://store.example/item",
        observedAt: mode === "research-expired" ? now - 120000 : now - 1000,
        expiresAt: mode === "research-expired" ? now - 60000 : now + 600000,
        price:
          mode === "research-unknown-price"
            ? null
            : {
                amountMinor: 12300,
                currency: "USD",
                sourceText: "USD 123.00",
              },
        reviews: null,
        id: "qa-offer",
        version: 1,
        contentHash: "a".repeat(64),
        policyVersion: 1,
      };
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const auth={currentUser:{uid:'qa-owner'}},functions=null,db=null,app=null,configured=false,emulatorMode=true;export const login=async()=>{};export async function callService(name,data){window.qaCalls=(window.qaCalls||[]).concat({name,data});if(('${mode}'==='research-switch'&&name==='askResearchSearch')||('${mode}'==='feedback-switch'&&name==='askFeedback')){auth.currentUser={uid:'other-owner'};window.qaSwitch();}if(name==='askResearchSearch'&&'${mode}'==='research-offline')throw Error('Synthetic offline');if(name==='askResearchSearch'&&'${mode}'==='research-empty')return {offers:[],scanned:0,limited:false,observedAt:Date.now()};if(name==='askResearchSearch')return {offers:[${JSON.stringify(offer)}],scanned:1,limited:'${mode}'==='research-partial',observedAt:Date.now()};if(name==='askResearchSelect'){if('${mode}'==='research-stale')throw Error('Synthetic stale revision');if('${mode}'==='research-malformed')return {offer:${JSON.stringify(offer)},draft:{market:'US',items:[{name:'Injected product',quantity:9,variant:'X'}]}};const {researchDraft}=await import('/packages/domain/ask-research.ts');return {offer:${JSON.stringify(offer)},draft:researchDraft(${JSON.stringify(offer)},data.quantity)}}if(name==='askFeedbackPolicy')return {enabled:true,version:1,retentionDays:1,expiresAt:Date.now()+600000};if(name==='askFeedbackWithdraw'){if('${mode}'==='feedback-withdraw-lost'&&window.qaCalls.filter(x=>x.name===name).length===1)throw Error('Synthetic withdrawal response loss');return {id:data.feedbackId,withdrawn:true}}if(name==='askFeedback'){if('${mode}'==='feedback-offline')throw Error('Synthetic unavailable');if('${mode}'==='feedback-lost'&&window.qaCalls.filter(x=>x.name===name).length===1)throw Error('Synthetic response loss');if('${mode}'==='feedback-malformed')return {id:'00000000-0000-4000-8000-000000000000',version:1};return {id:data.operationId,version:1}}throw Error('Unexpected '+name)}`,
      }),
    );
    await page.route("**/qa-research-feedback", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="${english ? "en" : "vi"}"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">import React from '${react}';import ReactDOM from '${root}';import{MemoryRouter}from '${router}';const{createRoot}=ReactDOM;import{auth}from '/src/shared/firebase.ts';import '/src/styles/global.css';import '/src/styles/public-ux.css';const{CatalogSearch}=await import('/src/features/ask/CatalogSearch.tsx');const{AnswerFeedback}=await import('/src/features/ask/AnswerFeedback.tsx');const answer={language:'${english ? "en" : "vi"}',title:'Synthetic answer',paragraphs:['Synthetic guidance'],bullets:[],sourceIds:[],action:'workflow'};function App(){const[user,setUser]=React.useState({uid:'qa-owner'}),[draft,setDraft]=React.useState({}),[pending,setPending]=React.useState(null);window.qaSwitch=()=>setUser({uid:'other-owner'});const commerce={user,conversationId:'11111111-1111-4111-8111-111111111111',conversation:{ownerId:user.uid,version:1,updatedAt:Date.now(),turns:[{id:'22222222-2222-4222-8222-222222222222',question:'Synthetic question',answer}]},draft,order:null,busy:false,pendingOperation:pending,restorationReady:true,run:async command=>{window.qaCommands=(window.qaCommands||[]).concat(command);if('${mode}'==='research-pending'){setPending('33333333-3333-4333-8333-333333333333');return false;}setDraft(command.payload);return true;}};return React.createElement(MemoryRouter,null,React.createElement('main',null,${feedback ? "React.createElement(AnswerFeedback,{commerce,vi:" + !english + "})" : "React.createElement(CatalogSearch,{result:{rows:[],cursor:null,hasMore:false,stale:false},question:'Synthetic headphones',commerce,vi:" + !english + ",active:true})"},React.createElement('pre',{id:'draft',style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},JSON.stringify(draft))))}createRoot(document.getElementById('root')).render(React.createElement(App));</script></body></html>`,
      }),
    );
    await page.goto("/qa-research-feedback");
    if (mode === "research-scaled") {
      await page.evaluate(() => {
        document.body.style.zoom = "2";
      });
      expect(
        await page.evaluate(() => getComputedStyle(document.body).zoom),
      ).toBe("2");
    }
    try {
      await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
    } catch {
      throw Error(`Fixture failed to mount: ${errors.join("; ")}`);
    }
    if (!feedback) {
      const search = page.getByRole("button", {
        name: english ? "Find references" : "Tìm nguồn tham khảo",
        exact: true,
      });
      if (mode === "research-scaled") {
        await search.focus();
        await page.keyboard.press("Enter");
      } else await search.click();
      if (
        ["research-empty", "research-offline", "research-expired"].includes(
          mode,
        )
      ) {
        await expect(
          page.getByText(
            mode === "research-empty"
              ? /Chưa có nguồn phù hợp/
              : /Chưa hoàn tất/,
          ),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () =>
              (
                (window as unknown as { qaCommands?: unknown[] }).qaCommands ??
                []
              ).length,
          ),
        ).toBe(0);
        expect(errors).toEqual([]);
        return;
      }
      if (mode === "research-switch") {
        await expect(
          page.getByText("Synthetic headphones", { exact: true }),
        ).toHaveCount(0);
        expect(
          await page.evaluate(
            () =>
              (
                (window as unknown as { qaCommands?: unknown[] }).qaCommands ??
                []
              ).length,
          ),
        ).toBe(0);
        return;
      }
      await expect(
        page.getByText(
          english ? "Reviews not confirmed" : "Chưa xác nhận review",
        ),
      ).toBeVisible();
      if (mode === "research-unknown-price")
        await expect(
          page.getByText("Chưa xác nhận giá", { exact: true }),
        ).toBeVisible();
      if (mode === "research-partial")
        await expect(
          page.getByText("Kết quả giới hạn trong phần nguồn đã kiểm tra."),
        ).toBeVisible();
      await page.getByLabel(english ? "Quantity" : "Số lượng").fill("2");
      await page
        .getByRole("button", {
          name: english
            ? "Prepare request from this choice"
            : "Soạn yêu cầu từ lựa chọn này",
          exact: true,
        })
        .click();
      if (["research-stale", "research-malformed"].includes(mode)) {
        await expect(page.getByText(/Chưa hoàn tất/)).toBeVisible();
        expect(
          await page.evaluate(
            () =>
              (
                (window as unknown as { qaCommands?: unknown[] }).qaCommands ??
                []
              ).length,
          ),
        ).toBe(0);
      } else if (mode === "research-pending") {
        await expect
          .poll(async () =>
            page.evaluate(
              () =>
                (
                  (window as unknown as { qaCommands?: unknown[] })
                    .qaCommands ?? []
                ).length,
            ),
          )
          .toBe(1);
        await expect(
          page.getByRole("button", {
            name: "Soạn yêu cầu từ lựa chọn này",
            exact: true,
          }),
        ).toBeDisabled();
        expect(
          await page.evaluate(
            () =>
              (
                (window as unknown as { qaCommands?: unknown[] }).qaCommands ??
                []
              ).length,
          ),
        ).toBe(1);
      } else {
        await expect(page.locator("#draft")).toContainText('"quantity":2');
        await expect(page.locator("#draft")).toContainText(
          "staff quotation required",
        );
        await expect(
          page.getByText(english ? /Draft saved/ : /Bản nháp đã được lưu/),
        ).toBeVisible();
      }
    } else {
      if (mode === "feedback-keyboard") {
        await page.locator("summary").focus();
        await page.keyboard.press("Enter");
      } else await page.locator("summary").click();
      const send = page.getByRole("button", {
        name: english ? "Send feedback" : "Gửi góp ý",
        exact: true,
      });
      await expect(send).toBeDisabled();
      if (mode === "feedback-unchecked") {
        expect(
          await page.evaluate(
            () =>
              (
                (window as unknown as { qaCalls?: { name: string }[] })
                  .qaCalls ?? []
              ).filter((call) => call.name === "askFeedback").length,
          ),
        ).toBe(0);
        expect(errors).toEqual([]);
        return;
      }
      if (mode === "feedback-keyboard") {
        await page.getByLabel("Câu trả lời này thế nào?").focus();
        await expect(page.getByLabel("Câu trả lời này thế nào?")).toBeFocused();
        await page.keyboard.press("t", { delay: 100 });
        await page.keyboard.press("Tab");
        await expect(page.getByLabel("Câu trả lời này thế nào?")).toHaveValue(
          "missing_information",
        );
        await page.getByRole("checkbox").focus();
        await page.keyboard.press("Space");
        await send.focus();
        await page.keyboard.press("Enter");
      } else {
        await page.getByRole("checkbox").check();
        await send.click();
      }
      if (mode === "feedback-switch") {
        await expect(page.getByText(/Đã nhận góp ý/)).toHaveCount(0);
        return;
      }
      if (mode === "feedback-lost") {
        await expect(page.getByText(/Chưa xác nhận được góp ý/)).toBeVisible();
        await page
          .getByRole("button", { name: "Gửi lại góp ý này", exact: true })
          .click();
        const calls = await page.evaluate(() =>
          (
            window as unknown as { qaCalls: { name: string; data: unknown }[] }
          ).qaCalls.filter(
            (call: { name?: string }) => call.name === "askFeedback",
          ),
        );
        expect(calls[1].data).toEqual(calls[0].data);
      }
      if (mode === "feedback-malformed" || mode === "feedback-offline")
        await expect(page.getByText(/Chưa xác nhận được góp ý/)).toBeVisible();
      else
        await expect(
          page.getByText(english ? /Feedback received/ : /Đã nhận góp ý/),
        ).toBeVisible();
      if (mode.startsWith("feedback-withdraw")) {
        await page
          .getByRole("button", { name: "Rút góp ý", exact: true })
          .click();
        if (mode === "feedback-withdraw-lost") {
          await expect(
            page.getByText(/Chưa xác nhận được việc rút/),
          ).toBeVisible();
          await page
            .getByRole("button", { name: "Rút góp ý", exact: true })
            .click();
          const calls = await page.evaluate(() =>
            (
              window as unknown as {
                qaCalls: { name: string; data: unknown }[];
              }
            ).qaCalls.filter((c) => c.name === "askFeedbackWithdraw"),
          );
          expect(calls).toHaveLength(2);
          expect(calls[0].data).toEqual(calls[1].data);
        }
        await expect(page.getByText(/Đã rút góp ý/)).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Rút góp ý", exact: true }),
        ).toHaveCount(0);
      }
      if (mode === "feedback-keyboard")
        expect(
          await page.evaluate(
            () =>
              (
                window as unknown as {
                  qaCalls: { name: string; data: { category: string } }[];
                }
              ).qaCalls.filter(
                (call: { name?: string }) => call.name === "askFeedback",
              )[0].data.category,
          ),
        ).toBe("missing_information");
    }
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (
      [
        "research-vi",
        "research-en",
        "research-mobile",
        "research-narrow",
        "research-scaled",
        "feedback-mobile",
        "feedback-keyboard",
        "feedback-vi",
        "feedback-en",
      ].includes(mode)
    )
      await page.screenshot({
        path: `output/ask-research-feedback/${mode}.png`,
        fullPage: true,
      });
  });
