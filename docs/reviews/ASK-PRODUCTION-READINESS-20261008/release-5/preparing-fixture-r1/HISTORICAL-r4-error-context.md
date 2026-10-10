# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ask109.spec.ts >> Ask composer preparing
- Location: tests/browser/ask109.spec.ts:12:3

# Error details

```
Error: expect(received).toBeUndefined()

Received: "1"
```

# Page snapshot

```yaml
- dialog "SatsunicGo" [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]: SatsunicGo
    - generic [ref=e5]: Hỏi SatsunicGo
  - navigation "Các điểm hội thoại" [ref=e6]:
    - button "1 Thời tiết ở Sao Hỏa hôm nay?" [ref=e7] [cursor=pointer]:
      - generic [ref=e8]: "1"
      - text: Thời tiết ở Sao Hỏa hôm nay?
  - generic [ref=e9]:
    - button "Hội thoại" [pressed] [ref=e10] [cursor=pointer]
    - button "Tác vụ hiện tại" [ref=e11] [cursor=pointer]
    - generic "Ngôn ngữ" [ref=e12]:
      - button "VI" [pressed] [ref=e13] [cursor=pointer]
      - button "EN" [ref=e14] [cursor=pointer]
  - log "Hội thoại với SatsunicGo" [ref=e16]:
    - region "Thời tiết ở Sao Hỏa hôm nay?" [ref=e17]:
      - paragraph [ref=e19]: Thời tiết ở Sao Hỏa hôm nay?
      - generic [ref=e20]:
        - heading "Kết quả kiểm tra" [level=2] [ref=e21]
        - paragraph [ref=e22]: Phản hồi mô phỏng cho kiểm tra giao diện.
  - generic [ref=e24]:
    - generic [ref=e25]:
      - button "Thêm ảnh sản phẩm" [ref=e26] [cursor=pointer]
      - textbox "Hỏi SatsunicGo" [active] [ref=e29]:
        - /placeholder: Hỏi bất cứ điều gì…
        - text: Bản nháp tiếp theo
      - button "Gửi câu hỏi" [ref=e30] [cursor=pointer]
      - button "Đóng hội thoại" [ref=e33] [cursor=pointer]
    - paragraph [ref=e36]:
      - text: Khi dùng AI, câu hỏi có thể được Google xử lý. Không chia sẻ thông tin nhạy cảm.
      - link "Quyền riêng tư" [ref=e37] [cursor=pointer]:
        - /url: /privacy
```

# Test source

```ts
  7   |   "reduced",
  8   |   "mobile",
  9   |   "close",
  10  |   "preparing",
  11  | ])
  12  |   test(`Ask composer ${mode}`, async ({ page }) => {
  13  |     const errors: string[] = [];
  14  |     page.on("pageerror", (error) => errors.push(error.message));
  15  |     await page.addInitScript(
  16  |       `const original=Element.prototype.animate;Element.prototype.animate=function(frames,options){const motion=original.call(this,frames,options);if(this.parentElement?.hasAttribute('data-ask-turn')&&options.duration===300){const d=document.documentElement.dataset;d.ask109Motions=String(Number(d.ask109Motions||0)+1);d.ask109Moving='true';const done=()=>{d.ask109Moving='false'};motion.addEventListener('finish',done);motion.addEventListener('cancel',done);}return motion};`,
  17  |     );
  18  |     if (mode === "reduced")
  19  |       await page.emulateMedia({ reducedMotion: "reduce" });
  20  |     if (mode === "mobile")
  21  |       await page.setViewportSize({ width: 390, height: 844 });
  22  |     const source = await (
  23  |       await page.request.get("/src/features/ask/Ask.tsx")
  24  |     ).text();
  25  |     const entry = await (await page.request.get("/src/app/main.tsx")).text();
  26  |     const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
  27  |     const router = source.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1];
  28  |     const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
  29  |     await page.route("**/src/shared/firebase.ts*", (r) =>
  30  |       r.fulfill({
  31  |         contentType: "text/javascript",
  32  |         body: `export const auth=null,db=null,functions=null,app=null,configured=false,emulatorMode=true;export const callService=async()=>({});`,
  33  |       }),
  34  |     );
  35  |     await page.route("**/src/features/ask/Commerce.tsx*", (r) =>
  36  |       r.fulfill({
  37  |         contentType: "text/javascript",
  38  |         body: `export const useAskCommerce=()=>({commandScope:()=>null,commandIdentity:()=>null,reviewBarrier:async()=>null,busy:false,pendingOperation:null,conversationId:null,draft:{},order:null,user:null,restorationReady:true,resolved:()=>{},run:async()=>{}});export const CommercePanel=()=>null;export function askReadinessMessage(){throw Error("Unexpected commerce readiness in non-commerce fixture")}`,
  39  |       }),
  40  |     );
  41  |     await page.route("**/src/features/ask/ImageIntake.tsx*", (r) =>
  42  |       r.fulfill({
  43  |         contentType: "text/javascript",
  44  |         body: `export const useAskImages=()=>({photos:[],working:false,prepare:async()=>{if(location.search.includes("preparing"))await new Promise(r=>setTimeout(r,150));return []},markSent:()=>{},add:()=>{},remove:()=>{}});`,
  45  |       }),
  46  |     );
  47  |     let calls = 0;
  48  |     await page.route("**/ask109-response", async (r) => {
  49  |       calls++;
  50  |       await new Promise((resolve) => setTimeout(resolve, 500));
  51  |       await r.fulfill({
  52  |         body: JSON.stringify({
  53  |           language: "vi",
  54  |           title: "Kết quả kiểm tra",
  55  |           paragraphs: ["Phản hồi mô phỏng cho kiểm tra giao diện."],
  56  |           bullets: [],
  57  |           sourceIds: [],
  58  |           action: "none",
  59  |         }),
  60  |       });
  61  |     });
  62  |     await page.route("**/src/features/ask/transport.ts*", (r) =>
  63  |       r.fulfill({
  64  |         contentType: "text/javascript",
  65  |         body: `export const askRateLimited=()=>false;export const askService=async()=>{const r=await fetch('/ask109-response');if(location.search.includes('error')||location.search.includes('draft'))throw Error('Synthetic failure');return r.json()};`,
  66  |       }),
  67  |     );
  68  |     await page.route("**/ask109-fixture*", (r) =>
  69  |       r.fulfill({
  70  |         contentType: "text/html",
  71  |         body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const {Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask)));</script>`,
  72  |       }),
  73  |     );
  74  |     await page.goto(`/ask109-fixture?${mode}`);
  75  |     const input = page
  76  |       .getByRole("textbox", { name: "Hỏi SatsunicGo" })
  77  |       .filter({ visible: true });
  78  |     const question = "Thời tiết ở Sao Hỏa hôm nay?";
  79  |     await input.fill(question);
  80  |     if (mode === "button")
  81  |       await page
  82  |         .getByRole("button", { name: "Gửi câu hỏi", exact: true })
  83  |         .filter({ visible: true })
  84  |         .click();
  85  |     else await input.press("Enter");
  86  |     if (mode === "preparing") await input.fill("Bản nháp tiếp theo");
  87  |     const composer = page
  88  |       .getByRole("dialog")
  89  |       .getByRole("textbox", { name: "Hỏi SatsunicGo" });
  90  |     await expect(composer).toHaveValue(
  91  |       mode === "preparing" ? "Bản nháp tiếp theo" : "",
  92  |     );
  93  |     await expect(page.locator("[data-ask-turn] > div").first()).toContainText(
  94  |       question,
  95  |     );
  96  |     if (!["reduced", "preparing"].includes(mode))
  97  |       await expect
  98  |         .poll(() =>
  99  |           page.evaluate(() => document.documentElement.dataset.ask109Motions),
  100 |         )
  101 |         .toBe("1");
  102 |     else
  103 |       expect(
  104 |         await page.evaluate(
  105 |           () => document.documentElement.dataset.ask109Motions,
  106 |         ),
> 107 |       ).toBeUndefined();
      |         ^ Error: expect(received).toBeUndefined()
  108 |     if (mode === "close") {
  109 |       await composer.press("Escape");
  110 |       await expect
  111 |         .poll(() =>
  112 |           page.evaluate(() => document.documentElement.dataset.ask109Moving),
  113 |         )
  114 |         .toBe("false");
  115 |       await expect(page.getByRole("dialog")).not.toBeVisible();
  116 |       expect(errors).toEqual([]);
  117 |       return;
  118 |     }
  119 |     if (mode === "draft") await composer.fill("Bản nháp tiếp theo");
  120 |     else if (mode !== "preparing") await composer.press("Enter"); // Empty repeated Enter must not duplicate a request.
  121 |     if (mode === "reduced")
  122 |       expect(
  123 |         await page
  124 |           .locator("[data-ask-turn] > div")
  125 |           .first()
  126 |           .evaluate((el) => el.getAnimations().length),
  127 |       ).toBe(0);
  128 |     await expect.poll(() => calls).toBe(1);
  129 |     await expect(
  130 |       page.getByRole("button", { name: "Dừng câu trả lời", exact: true }),
  131 |     ).not.toBeVisible();
  132 |     await expect(composer).toHaveValue(
  133 |       ["draft", "preparing"].includes(mode) ? "Bản nháp tiếp theo" : "",
  134 |     );
  135 |     if (mode === "error") {
  136 |       const retry = page.getByRole("button", { name: /Thử lại/ });
  137 |       await expect(retry).toBeVisible();
  138 |       await retry.click();
  139 |       await expect.poll(() => calls).toBe(2);
  140 |       await expect(composer).toHaveValue("");
  141 |     }
  142 |     expect(errors).toEqual([]);
  143 |     await page.screenshot({ path: `output/ask109/${mode}.png` });
  144 |   });
  145 | 
```