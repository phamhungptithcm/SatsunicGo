import { test, expect } from "@playwright/test";
for (const mode of ["enter", "error", "draft", "mobile", "close"])
  test(`Ask real stream consumer ${mode}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(
      `const original=Element.prototype.animate;Element.prototype.animate=function(frames,options){const motion=original.call(this,frames,options);if(this.parentElement?.hasAttribute('data-ask-turn')&&options.duration===300){const d=document.documentElement.dataset;d.askplatformMotions=String(Number(d.askplatformMotions||0)+1);d.askplatformMoving='true';const done=()=>{d.askplatformMoving='false'};motion.addEventListener('finish',done);motion.addEventListener('cancel',done);}return motion};`,
    );
    if (mode === "reduced")
      await page.emulateMedia({ reducedMotion: "reduce" });
    if (mode === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
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
        body: `export const auth=null,db=null,functions=null,app=null,configured=false,emulatorMode=true;export const callService=async()=>({});`,
      }),
    );
    await page.route("**/src/features/ask/Commerce.tsx*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const useAskCommerce=()=>({busy:false,pendingOperation:null,conversationId:null,draft:{},order:null,user:null,restorationReady:true,resolved:()=>{},run:async()=>{}});export const CommercePanel=()=>null;`,
      }),
    );
    await page.route("**/src/features/ask/ImageIntake.tsx*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const useAskImages=()=>({photos:[],working:false,prepare:async()=>{if(location.search.includes("preparing"))await new Promise(r=>setTimeout(r,150));return []},markSent:()=>{},add:()=>{},remove:()=>{}});`,
      }),
    );
    let calls = 0;
    await page.route("**/askplatform-response", async (r) => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 500));
      await r.fulfill({
        body: JSON.stringify({
          language: "vi",
          title: "Kết quả kiểm tra",
          paragraphs: ["Phản hồi mô phỏng cho kiểm tra giao diện."],
          bullets: [],
          sourceIds: [],
          action: "none",
        }),
      });
    });
    const transport = await (
      await page.request.get("/src/features/ask/transport.ts")
    ).text();
    if (!transport.includes("async function askService("))
      throw Error("Transport entry changed");
    const consumer = transport.replace(
      "async function askService(",
      "async function originalAskService(",
    );
    await page.route("**/src/features/ask/transport.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body:
          consumer +
          `
export async function askService(data,signal,onEvent){
 const answer={language:'vi',title:'Kết quả kiểm tra',paragraphs:['Phản hồi mô phỏng cho kiểm tra giao diện.'],bullets:[],sourceIds:[],action:'none'};
 const final=fetch('/askplatform-response',{signal}).then(r=>r.json()).then(value=>{
  if(location.search.includes('draft'))throw Error('Synthetic provider failure after stream');
  return location.search.includes('error')?{...value,title:'Conflicting final answer'}:value;
 });
 async function* stream(){yield {type:'status',phase:'retrieving'};yield {type:'answer',answer};}
 return consumeAskStream({stream:stream(),data:final},onEvent,signal);
}`,
      }),
    );
    await page.route("**/askplatform-fixture*", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const {Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask)));</script>`,
      }),
    );
    await page.goto(`/askplatform-fixture?${mode}`);
    await expect.poll(() => errors).toEqual([]);
    const input = page
      .getByRole("textbox", { name: "Hỏi SatsunicGo" })
      .filter({ visible: true });
    const question = "Thời tiết ở Sao Hỏa hôm nay?";
    await input.fill(question);
    if (mode === "button")
      await page
        .getByRole("button", { name: "Gửi câu hỏi", exact: true })
        .filter({ visible: true })
        .click();
    else await input.press("Enter");
    if (mode === "preparing") await input.fill("Bản nháp tiếp theo");
    const composer = page
      .getByRole("dialog")
      .getByRole("textbox", { name: "Hỏi SatsunicGo" });
    await expect(composer).toHaveValue(
      mode === "preparing" ? "Bản nháp tiếp theo" : "",
    );
    await expect(page.locator("[data-ask-turn] > div").first()).toContainText(
      question,
    );
    if (!["reduced", "preparing"].includes(mode))
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.dataset.askplatformMotions,
          ),
        )
        .toBe("1");
    else
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.askplatformMotions,
        ),
      ).toBeUndefined();
    if (mode === "close") {
      await composer.press("Escape");
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.dataset.askplatformMoving,
          ),
        )
        .toBe("false");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      expect(errors).toEqual([]);
      return;
    }
    // A streamed answer must not become visible before the final response is verified.
    await expect(
      page.getByText("Phản hồi mô phỏng cho kiểm tra giao diện.", {
        exact: true,
      }),
    ).not.toBeVisible();
    if (mode === "draft") await composer.fill("Bản nháp tiếp theo");
    else if (mode !== "preparing") await composer.press("Enter"); // Empty repeated Enter must not duplicate a request.
    if (mode === "reduced")
      expect(
        await page
          .locator("[data-ask-turn] > div")
          .first()
          .evaluate((el) => el.getAnimations().length),
      ).toBe(0);
    await expect.poll(() => calls).toBe(1);
    await expect(
      page.getByRole("button", { name: "Dừng câu trả lời", exact: true }),
    ).not.toBeVisible();
    await expect(composer).toHaveValue(
      ["draft", "preparing"].includes(mode) ? "Bản nháp tiếp theo" : "",
    );
    if (["error", "draft"].includes(mode)) {
      await expect(
        page.getByText("Phản hồi mô phỏng cho kiểm tra giao diện.", {
          exact: true,
        }),
      ).not.toBeVisible();
      const retry = page.getByRole("button", { name: /Thử lại/ });
      await expect(retry).toBeVisible();
      await retry.click();
      await expect.poll(() => calls).toBe(2);
      await expect(
        page.getByRole("button", { name: "Dừng câu trả lời", exact: true }),
      ).not.toBeVisible();
      await expect(
        page.getByText("Phản hồi mô phỏng cho kiểm tra giao diện.", {
          exact: true,
        }),
      ).not.toBeVisible();
      if (mode === "error") await expect(composer).toHaveValue("");
    } else {
      await expect(
        page.getByText("Phản hồi mô phỏng cho kiểm tra giao diện.", {
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
    await page.screenshot({ path: `output/askplatform/${mode}.png` });
  });
