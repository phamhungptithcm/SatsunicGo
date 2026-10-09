import { test, expect } from "@playwright/test";
for (const mode of [
  "happy-vi",
  "guest",
  "happy-en",
  "mobile",
  "missing-variant",
  "invalid-variant",
  "invalid-quantity",
  "question",
  "custom-conflict",
  "stale",
  "expired",
  "malformed",
  "wrong-version",
  "lost",
  "account-switch",
  "new-search",
  "mixed-search-failure",
  "manual",
  "malformed-en",
  "reload-choice",
  "corrupt-pending",
  "invalid-owner",
  "snapshot-version",
  "invalid-turns",
])
  test(`Actual Ask catalog chat ${mode}`, async ({ page }) => {
    const english = mode === "happy-en" || mode === "malformed-en",
      errors: string[] = [];
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
    const product = {
      id: "qa-product",
      title: "Synthetic sneakers",
      slug: "synthetic-sneakers",
      status: "published",
      market: "JP",
      version: 3,
      orderable: true,
      listedPrice: 200000,
      termsVersion: "synthetic-v1",
      catalogOptions: ["Blue", "Red"],
    };
    const cid = "99999999-1111-4111-8111-111111111111";
    await page.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const auth={currentUser:${mode === "guest" ? "null" : "{uid:'qa-catalog-owner'}"}},db={},functions=null,app=null,configured=false,emulatorMode=true;export const login=async()=>{};export async function callService(name,data){if(name==='currentAskConversation')return {conversationId:'${cid}'};if(name!=='askWorkflow')throw Error('Unexpected API '+name);window.qaCommands=(window.qaCommands||[]).concat(data);if(data.action==='catalogCheckout'){if('${mode}'==='lost')throw Object.assign(Error('Synthetic unknown outcome'),{code:'functions/unavailable'});if(['malformed','malformed-en'].includes('${mode}'))return {version:data.expectedVersion+2};if('${mode}'==='wrong-version')return {id:'qa-order',version:data.expectedVersion+1};await new Promise(r=>setTimeout(r,100));return {id:'qa-order',version:data.expectedVersion+2}}return {version:data.expectedVersion+1};}`,
      }),
    );
    await page.route("**/*firebase_auth.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `const listeners=new Set();export function onAuthStateChanged(auth,listener){listeners.add(listener);queueMicrotask(()=>listener(auth.currentUser));window.qaSwitchAccount=()=>{auth.currentUser={uid:'qa-catalog-other'};for(const fn of listeners)fn(auth.currentUser)};return()=>listeners.delete(listener)}`,
      }),
    );
    await page.route("**/*firebase_firestore.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const doc=(_,kind,id)=>({kind,id}),collection=(_,kind)=>({kind}),query=x=>x,where=()=>null,limit=()=>null,orderBy=()=>null,documentId=()=>null,startAfter=()=>null;export const getDocs=async()=>({docs:[]});export function onSnapshot(ref,...args){const ok=args.find(x=>typeof x==='function');let live=true;queueMicrotask(()=>{if(!live)return;if(ref.kind==='askConversations')ok({metadata:{fromCache:false},data:()=>({ownerId:'${mode === "invalid-owner" ? "foreign-owner" : "qa-catalog-owner"}',version:${mode === "snapshot-version" ? "NaN" : "0"},updatedAt:Date.now(),turns:${mode === "invalid-turns" ? "null" : english ? JSON.stringify([{ id: "66666666-1111-4111-8111-111111111111", question: "answer in english", answer: { language: "en", title: "English preference", paragraphs: ["Synthetic preference"], sourceIds: [], bullets: [], action: "home" } }]) : "[]"},draft:{market:'US',items:[{name:'Unrelated custom draft',quantity:1,variant:'M',url:''}]}})});else ok({metadata:{fromCache:false},docs:[],data:()=>undefined,exists:()=>false})});return()=>{live=false}}`,
      }),
    );
    await page.route("**/src/features/ask/ImageIntake.tsx*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const useAskImages=()=>({photos:[],working:false,prepare:async()=>[],markSent:()=>{},add:()=>{},remove:()=>{}})`,
      }),
    );
    await page.route("**/src/features/ask/catalog-search.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export async function searchPublishedCatalog(){window.qaSearches=(window.qaSearches||0)+1;if('${mode}'==='mixed-search-failure'&&window.qaSearches>1)throw Error('Synthetic catalog read failure');return {rows:[{...${JSON.stringify(product)},id:'qa-unorderable',title:'Needs quote',orderable:false},${JSON.stringify(product)}],cursor:null,hasMore:false,stale:${mode === "stale"}}}`,
      }),
    );
    await page.route("**/src/features/ask/transport.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const askRateLimited=()=>false;export const askService=async()=>{window.qaModelCalls=(window.qaModelCalls||0)+1;return {language:'vi',title:'Question received',paragraphs:['Synthetic answer, no action'],sourceIds:[],bullets:[],action:'none'}}`,
      }),
    );
    await page.route("**/qa-catalog-chat", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {BrowserRouter} from '${router}';const {Ask}=await import('/src/features/ask/Ask.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(Ask)));</script>`,
      }),
    );
    if (mode === "corrupt-pending")
      await page.addInitScript(
        ({ cid }) =>
          sessionStorage.setItem(
            `ask-pending:qa-catalog-owner:${cid}`,
            JSON.stringify({
              conversationId: "88888888-1111-4111-8111-111111111111",
              operationId: "77777777-1111-4111-8111-111111111111",
              expectedVersion: 0,
              action: "catalogCheckout",
              payload: {
                productId: "qa-product",
                productVersion: 3,
                quantity: 1,
                variant: "Blue",
              },
            }),
          ),
        { cid },
      );
    await page.goto("/qa-catalog-chat");
    const input = page
      .getByRole("textbox", {
        name: english ? "Ask SatsunicGo" : "Hỏi SatsunicGo",
      })
      .filter({ visible: true });
    if (mode === "corrupt-pending") {
      await expect(
        page
          .getByText(
            "Chưa đọc được thao tác đang chờ. Liên hệ hỗ trợ để đối chiếu.",
            { exact: true },
          )
          .filter({ visible: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          (cid) =>
            sessionStorage.getItem(`ask-pending:qa-catalog-owner:${cid}`),
          cid,
        ),
      ).toContain("88888888-1111-4111-8111-111111111111");
      expect(
        await page.evaluate(
          () =>
            (window as unknown as { qaCommands?: unknown[] }).qaCommands || [],
        ),
      ).toEqual([]);
      expect(errors).toEqual([]);
      return;
    }
    if (["invalid-owner", "snapshot-version", "invalid-turns"].includes(mode)) {
      await expect(
        page
          .getByText(
            "Chưa xác minh được hội thoại. Hãy tải lại hoặc liên hệ hỗ trợ.",
            { exact: true },
          )
          .filter({ visible: true }),
      ).toBeVisible();
      await expect(input).toBeDisabled();
      expect(
        await page.evaluate(
          () =>
            (window as unknown as { qaCommands?: unknown[] }).qaCommands || [],
        ),
      ).toEqual([]);
      expect(errors).toEqual([]);
      return;
    }
    await expect(input).toBeEnabled();
    const send = async (raw: string) => {
      await input.fill(raw);
      await input.press("Enter");
      await expect(input).toHaveValue("");
      await expect(input).toBeEnabled();
      await expect(
        page.getByRole("button", {
          name: /Dừng câu trả lời|Stop response|Confirming this action|Đang xác nhận thao tác/,
        }),
      ).toHaveCount(0);
    };
    await send(english ? "find sneakers" : "tìm sneakers");
    await expect(
      page.getByRole("link", { name: "2. Synthetic sneakers" }),
    ).toBeVisible();
    if (mode === "expired")
      await page.clock.install({ time: Date.now() + 301000 });
    await send(english ? "select product 2" : "chọn sản phẩm số 2");
    const panel = page.getByRole("region", {
      name: english ? "Selected product" : "Sản phẩm đang chọn",
    });
    if (["stale", "expired"].includes(mode)) {
      await expect(panel).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Anh/chị muốn chọn mẫu nào?" }),
      ).toBeVisible();
    } else {
      await expect(panel).toBeVisible();
      await expect(panel).toContainText("Synthetic sneakers");
      await expect(panel.getByRole("spinbutton")).toHaveValue("1");
      await expect(
        page.getByText("Unrelated custom draft · M · 1", { exact: true }),
      ).toHaveCount(0);
      if (mode === "reload-choice") {
        await page.reload();
        await expect(input).toBeEnabled();
        await send("chọn sản phẩm số 2");
        await expect(panel).toHaveCount(0);
      } else if (mode === "account-switch") {
        await page.evaluate(() =>
          (
            window as unknown as { qaSwitchAccount: () => void }
          ).qaSwitchAccount(),
        );
        await expect(panel).toHaveCount(0);
      } else if (mode === "mixed-search-failure") {
        await send("tìm sneakers và phí gửi Mỹ về Việt Nam");
        await expect(panel).toHaveCount(0);
      } else if (mode === "new-search") {
        await send("tìm sneakers");
        await expect(panel).toHaveCount(0);
      } else {
        if (!["missing-variant", "custom-conflict"].includes(mode)) {
          if (mode === "manual") {
            await panel.getByRole("combobox").selectOption("Blue");
            await panel.getByRole("spinbutton").fill("2");
          } else
            await send(
              mode === "invalid-variant"
                ? "size Green, số lượng 2"
                : mode === "invalid-quantity"
                  ? "size Blue, quantity 0"
                  : english
                    ? "please variant:blue; quantity:2"
                    : "size Blue, số lượng 2",
            );
        }
        if (["invalid-variant", "invalid-quantity"].includes(mode)) {
          await expect(panel.getByRole("spinbutton")).toHaveValue("1");
          await expect(panel.getByRole("combobox")).toHaveValue("");
        }
        const confirmation = english
          ? "confirm selection and create order"
          : "xác nhận lựa chọn và tạo đơn";
        await panel.scrollIntoViewIfNeeded();
        await panel.screenshot({
          path: `output/ask-catalog-chat/${mode}-preview.png`,
        });
        if (mode === "custom-conflict") await send("gửi yêu cầu mua hộ");
        else
          await send(mode === "question" ? `${confirmation}?` : confirmation);
        if (mode === "guest") {
          await expect(
            page.getByRole("heading", { name: "Đăng nhập để tạo đơn" }),
          ).toBeVisible();
          await expect(
            panel.getByRole("button", {
              name: "Xác nhận lựa chọn và tạo đơn",
              exact: true,
            }),
          ).toBeDisabled();
        }
        const expectedCreate = [
          "happy-vi",
          "happy-en",
          "mobile",
          "manual",
          "malformed",
          "malformed-en",
          "wrong-version",
          "lost",
        ].includes(mode);
        const commands = await page.evaluate(
          () =>
            (
              window as unknown as {
                qaCommands: {
                  action: string;
                  payload: unknown;
                  operationId: string;
                }[];
              }
            ).qaCommands || [],
        );
        const creates = commands.filter((c) => c.action === "catalogCheckout");
        expect(creates).toHaveLength(expectedCreate ? 1 : 0);
        if (expectedCreate) {
          expect(creates[0].payload).toEqual({
            productId: "qa-product",
            productVersion: 3,
            quantity: 2,
            variant: "Blue",
          });
          const bad = [
            "malformed",
            "malformed-en",
            "wrong-version",
            "lost",
          ].includes(mode);
          const pending = await page.evaluate(
            (cid) =>
              sessionStorage.getItem(`ask-pending:qa-catalog-owner:${cid}`),
            cid,
          );
          if (bad) {
            expect(pending).toContain(creates[0].operationId);
            await expect(
              page.getByRole("heading", {
                name: /^Đã tạo đơn$|^Order created$/,
              }),
            ).toHaveCount(0);
            await page
              .getByRole("button", {
                name: english
                  ? "Recover pending action"
                  : "Đối chiếu thao tác đang chờ",
                exact: true,
              })
              .click();
            await expect(
              page.getByText(
                english
                  ? "The pending action could not be recovered. Retry recovery before sending a new request."
                  : "Chưa đối chiếu được thao tác. Thử lại; không gửi yêu cầu mới.",
                { exact: true },
              ),
            ).toBeVisible();
            expect(
              await page.evaluate(
                (cid) =>
                  sessionStorage.getItem(`ask-pending:qa-catalog-owner:${cid}`),
                cid,
              ),
            ).toContain(creates[0].operationId);
          } else {
            expect(pending).toBeNull();
            await expect(
              page.getByRole("heading", {
                name: english ? "Order created" : "Đã tạo đơn",
              }),
            ).toBeVisible();
            await send(confirmation);
            const after = await page.evaluate(
              () =>
                (
                  window as unknown as { qaCommands: { action: string }[] }
                ).qaCommands.filter((c) => c.action === "catalogCheckout")
                  .length,
            );
            expect(after).toBe(1);
          }
        }
        expect(commands.some((c) => c.action === "submitRequest")).toBe(false);
      }
    }
    expect(errors).toEqual([]);
    const modelCalls = await page.evaluate(
      () => (window as unknown as { qaModelCalls?: number }).qaModelCalls || 0,
    );
    expect(modelCalls).toBe(0);
    const horizontalOverflow = await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(horizontalOverflow).toBe(false);
  });
