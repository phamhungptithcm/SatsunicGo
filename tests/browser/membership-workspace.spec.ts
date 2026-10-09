import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
for (const mode of [
  "paid",
  "free",
  "unknown",
  "malformed",
  "renewal",
  "private-failure",
  "mobile",
  "renewal-lost",
  "account-switch",
  "sign-in-failure",
  "invalid-plan",
  "invalid-private",
  "reload-paid",
  "reload-free",
  "reload-renewal",
  "reload-cancel",
  "reload-malformed",
  "denied-replay",
  "wrong-owner-replay",
  "corrupt-storage",
  "unavailable-storage",
  "unavailable-locks",
  "cross-tab",
  "account-return",
  "reload-plan-changed",
  "mobile-recovery",
  "simultaneous-tabs",
  "scaled-recovery",
  "clear-storage-failure",
])
  test(`Ask membership ${mode}`, async ({ page, context }) => {
    if (mode === "mobile" || mode === "mobile-recovery")
      await page.setViewportSize({ width: 390, height: 844 });
    const pendingKey = `satsunicgo.membership-attempt.v1.${createHash("sha256").update("member-qa").digest("hex")}`;
    if (mode === "corrupt-storage")
      await page.addInitScript(
        (key) =>
          localStorage.setItem(
            key,
            '{"schemaVersion":1,"action":"purchase","private":"invalid"}',
          ),
        pendingKey,
      );
    if (mode === "unavailable-storage")
      await page.addInitScript(() =>
        Object.defineProperty(window, "localStorage", {
          get: () => {
            throw Error("Synthetic storage restriction");
          },
        }),
      );
    if (mode === "unavailable-locks")
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "locks", { value: undefined }),
      );
    if (mode === "clear-storage-failure")
      await page.addInitScript(() => {
        const original = Storage.prototype.removeItem;
        Storage.prototype.removeItem = function (key) {
          if (!key.startsWith("satsunicgo.membership-attempt.v1."))
            original.call(this, key);
        };
      });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const profile = await (
      await page.request.get("/src/features/profile/Profile.tsx")
    ).text();
    const entry = await (await page.request.get("/src/app/main.tsx")).text();
    const react = profile.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1],
      router = profile.match(/from "([^" ]*react-router-dom[^" ]*)"/)![1],
      root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
    await context.route("**/src/shared/firebase.ts*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const auth={currentUser:${mode === "sign-in-failure" ? "null" : "{uid:'member-qa'}"}},db={};export const login=async()=>{throw Error('Synthetic sign-in failure')};export async function callService(name,data){const r=await fetch('/member-response',{method:'POST',body:JSON.stringify({name,data})});const result=await r.json();if(result.error)throw result.error;return result;}`,
      }),
    );
    await context.route("**/*firebase_firestore.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const doc=(_,kind,id)=>({kind,id});export const collection=(_,kind)=>({kind});export const query=x=>x;export const where=()=>null;export const limit=()=>null;export function onSnapshot(ref,ok,fail){let live=true;if(ref.kind==='membershipSubscriptions')window.publishRenewal=()=>{if(live)ok({exists:()=>true,data:()=>({state:'active',planId:'free-plan',endsAt:Date.now()+86400000,renewalIntent:true,planSnapshot:{name:'FREE'}})})};queueMicrotask(()=>{if(!live)return;if(ref.kind==='membershipPlans'){window.fixPlans=()=>{if(live)ok({docs:[{id:'${mode === "reload-plan-changed" ? "replacement-plan" : "paid-plan"}',data:()=>({name:'${mode === "reload-plan-changed" ? "Changed PLUS" : "Synthetic PLUS"}',price:${mode === "reload-plan-changed" ? "900000" : "100000"},periodDays:30,serviceDiscountBps:100,discountCap:10000})}]})};ok({docs:[{id:'free-plan',data:()=>({name:'FREE',price:0,periodDays:30,serviceDiscountBps:0,discountCap:0})},{id:'paid-plan',data:()=>({name:'Synthetic PLUS',price:${mode === "invalid-plan" ? "'bad'" : "100000"},periodDays:30,serviceDiscountBps:100,discountCap:10000})}]})}else if(ref.kind==='membershipSubscriptions'){ok({exists:()=>${mode.includes("renewal") || mode === "wrong-owner-replay" || mode === "invalid-private"},data:()=>({state:'active',planId:'free-plan',endsAt:${mode === "invalid-private" ? "'bad'" : "Date.now()+86400000"},renewalIntent:false,planSnapshot:{name:'FREE'}})})}else if(ref.kind==='membershipInvoices' && ${mode === "reload-cancel"}){ok({docs:[{id:'invoice-one',data:()=>({amount:100000,state:'pending',createdAt:1,planSnapshot:{name:'Synthetic PLUS'}})}]})}else if(ref.kind==='users'){ok({data:()=>({displayName:'Synthetic QA',businessName:'',marketingConsent:false,version:0})})}else if(ref.kind==='membershipInvoices' && ${mode === "private-failure"}){fail(Error('synthetic read failure'));ok({docs:[{id:'stale-private',data:()=>({amount:100000,state:'pending',createdAt:1,planSnapshot:{name:'Stale private data'}})}]})}else{ok({docs:[]})}});return()=>{live=false}}`,
      }),
    );
    const requests: Record<string, unknown>[] = [];
    await context.route("**/member-response", async (r) => {
      const { name, data } = r.request().postDataJSON();
      if (name !== "membershipCommand") return r.fulfill({ json: {} });
      requests.push(data);
      if (
        mode === "account-switch" ||
        mode === "account-return" ||
        mode === "simultaneous-tabs"
      )
        await new Promise((resolve) => setTimeout(resolve, 400));
      if (
        (mode === "unknown" ||
          mode === "renewal-lost" ||
          mode.startsWith("reload-") ||
          [
            "denied-replay",
            "wrong-owner-replay",
            "cross-tab",
            "mobile-recovery",
            "scaled-recovery",
            "simultaneous-tabs",
          ].includes(mode)) &&
        requests.length === 1
      )
        return r.fulfill({
          json: { error: { code: "functions/unavailable" } },
        });
      if (mode === "malformed" && requests.length === 1)
        return r.fulfill({ json: { id: "member-qa" } });
      if (mode === "denied-replay" && requests.length === 2)
        return r.fulfill({
          json: { error: { code: "functions/permission-denied" } },
        });
      if (mode === "wrong-owner-replay" && requests.length === 2)
        return r.fulfill({ json: { id: "other-owner" } });
      if (mode === "reload-malformed" && requests.length === 2)
        return r.fulfill({ json: { id: "synthetic-invoice", state: "paid" } });
      return r.fulfill({
        json:
          data.action === "cancelInvoice"
            ? { id: data.invoiceId }
            : data.action === "requestRenewal"
              ? { id: "member-qa" }
              : data.planId === "free-plan"
                ? { id: "member-qa", state: "active" }
                : { id: "synthetic-invoice", state: "pending" },
      });
    });
    await context.route("**/membership-fixture", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<div id="root"></div><script type="module">import '/src/styles/global.css';import '/src/styles/public-ux.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';import {MemoryRouter} from '${router}';import {auth} from '/src/shared/firebase.ts';import {noticeSnapshot,subscribeNotice} from '/src/shared/feedback.ts';const {CustomerWorkspace}=await import('/src/features/ask/CustomerWorkspace.tsx');function Fixture(){const notice=React.useSyncExternalStore(subscribeNotice,noticeSnapshot);return React.createElement(MemoryRouter,null,React.createElement(CustomerWorkspace,{user:auth.currentUser,language:'vi'}),React.createElement('p',{id:'notice'},notice?.text))}const root=ReactDOM.createRoot(document.getElementById('root'));window.switchMember=(uid='member-qa-two')=>{auth.currentUser={uid};root.render(React.createElement(Fixture))};root.render(React.createElement(Fixture));</script>`,
      }),
    );
    await page.goto("/membership-fixture");
    if (mode === "scaled-recovery")
      await page.evaluate(() => {
        document.body.style.zoom = "2";
      });
    await page.getByRole("button", { name: "Membership", exact: true }).click();
    if (mode === "corrupt-storage" || mode === "unavailable-storage") {
      await expect(
        page.getByText(
          "Chưa khôi phục được thao tác trước. Liên hệ hỗ trợ trước khi gửi yêu cầu mới.",
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Yêu cầu mua gói", exact: true }),
      ).toBeDisabled();
      expect(requests).toHaveLength(0);
      if (mode === "corrupt-storage")
        expect(
          await page.evaluate((key) => localStorage.getItem(key), pendingKey),
        ).toContain('"private"');
      expect(errors).toEqual([]);
      await page.screenshot({
        path: `output/membership-workspace/${mode}.png`,
        fullPage: true,
      });
      return;
    }
    if (mode === "sign-in-failure") {
      await page
        .getByRole("button", { name: "Đăng nhập để chọn gói", exact: true })
        .first()
        .click();
      await expect(
        page.getByText("Chưa đăng nhập được. Anh/chị thử lại nhé."),
      ).toBeVisible();
      expect(requests).toHaveLength(0);
      expect(errors).toEqual([]);
      return;
    }
    if (mode === "invalid-plan") {
      await expect(
        page.getByText("Thông tin gói chưa hợp lệ. Anh/chị thử lại sau nhé."),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Yêu cầu mua gói", exact: true }),
      ).toHaveCount(0);
      await page.evaluate(() =>
        (window as unknown as { fixPlans: () => void }).fixPlans(),
      );
      await expect(
        page.getByText("Thông tin gói chưa hợp lệ. Anh/chị thử lại sau nhé."),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Yêu cầu mua gói", exact: true }),
      ).toBeEnabled();
      expect(requests).toHaveLength(0);
      expect(errors).toEqual([]);
      return;
    }
    if (mode === "private-failure" || mode === "invalid-private") {
      await expect(
        page.getByText(/Chưa tải được membership của bạn/),
      ).toBeVisible();
      await expect(page.getByText("Stale private data")).toHaveCount(0);
      await expect(
        page.getByRole("button", {
          name: "Kích hoạt gói miễn phí",
          exact: true,
        }),
      ).toBeDisabled();
      expect(requests).toHaveLength(0);
      return;
    }
    const purchase = page
      .locator("article.membershipPlan")
      .filter({
        has: page.getByRole("heading", {
          name:
            mode === "free" || mode === "reload-free"
              ? "FREE"
              : "Synthetic PLUS",
          exact: true,
        }),
      })
      .getByRole("button");
    if (mode === "simultaneous-tabs") {
      const second = await context.newPage();
      await second.goto("/membership-fixture");
      await second
        .getByRole("button", { name: "Membership", exact: true })
        .click();
      const otherPurchase = second
        .locator("article.membershipPlan")
        .filter({
          has: second.getByRole("heading", {
            name: "Synthetic PLUS",
            exact: true,
          }),
        })
        .getByRole("button");
      await expect(purchase).toBeEnabled();
      await expect(otherPurchase).toBeEnabled();
      await Promise.all([
        purchase.evaluate((button: HTMLButtonElement) => button.click()),
        otherPurchase.evaluate((button: HTMLButtonElement) => button.click()),
      ]);
      await expect.poll(() => requests.length).toBe(1);
      await expect(page.getByText(/chưa rõ kết quả/iu)).toBeVisible();
      await expect(second.getByText(/chưa rõ kết quả/iu)).toBeVisible();
      await expect(purchase).toBeDisabled();
      await expect(otherPurchase).toBeDisabled();
      await second
        .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
        .click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1]).toEqual(requests[0]);
      await expect(second.locator("#notice")).toHaveText(
        /Membership chỉ kích hoạt/,
      );
      expect(
        await second.evaluate((key) => localStorage.getItem(key), pendingKey),
      ).toBeNull();
      await second.close();
      expect(errors).toEqual([]);
      return;
    }
    if (mode.includes("renewal") || mode === "wrong-owner-replay")
      await page
        .getByRole("button", { name: "Muốn tiếp tục gia hạn", exact: true })
        .click();
    else if (mode === "reload-cancel")
      await page
        .getByRole("button", {
          name: "Hủy yêu cầu chưa thanh toán",
          exact: true,
        })
        .click();
    else await purchase.click();
    if (mode === "unavailable-locks") {
      await expect(
        page.getByText(
          "Chưa lưu được thao tác để khôi phục. Liên hệ hỗ trợ trước khi gửi yêu cầu mới.",
        ),
      ).toBeVisible();
      await expect(purchase).toBeDisabled();
      expect(requests).toHaveLength(0);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: `output/membership-workspace/${mode}.png`,
        fullPage: true,
      });
      return;
    }
    await expect.poll(() => requests.length).toBe(1);
    if (mode === "clear-storage-failure") {
      await expect(page.getByText(/chưa rõ kết quả/iu)).toBeVisible();
      await expect(page.locator("#notice")).toHaveText("");
      await expect(purchase).toBeDisabled();
      await page.reload();

      await page
        .getByRole("button", { name: "Membership", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
        .click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1]).toEqual(requests[0]);
      await expect(page.getByText(/chưa rõ kết quả/iu)).toBeVisible();
      await expect(page.locator("#notice")).toHaveText("");
      expect(
        await page.evaluate((key) => localStorage.getItem(key), pendingKey),
      ).not.toBeNull();
      expect(errors).toEqual([]);
      return;
    }

    if (mode === "account-switch" || mode === "account-return") {
      const response = page.waitForResponse("**/member-response");
      await page.evaluate(() =>
        (window as unknown as { switchMember: () => void }).switchMember(),
      );
      await response;
      await expect(
        page.getByRole("button", { name: "Membership", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("#notice")).toHaveText("");
      if (mode === "account-switch") return;
      await page.evaluate(() =>
        (
          window as unknown as { switchMember: (uid: string) => void }
        ).switchMember("member-qa"),
      );
      await page
        .getByRole("button", { name: "Membership", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Thử lại thao tác đang chờ",
          exact: true,
        }),
      ).toBeEnabled();
      expect(requests).toHaveLength(1);
      await page
        .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
        .click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1]).toEqual(requests[0]);
      return;
    }
    if (
      mode.startsWith("reload-") ||
      [
        "denied-replay",
        "wrong-owner-replay",
        "cross-tab",
        "mobile-recovery",
        "scaled-recovery",
        "simultaneous-tabs",
      ].includes(mode)
    ) {
      await expect(page.getByText(/chưa rõ kết quả/iu)).toBeVisible();
      expect(
        await page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)!),
          pendingKey,
        ),
      ).toMatchObject({
        operationId: requests[0].operationId,
        action: requests[0].action,
      });
      if (mode === "cross-tab") {
        const second = await context.newPage();
        await second.goto("/membership-fixture");
        await second
          .getByRole("button", { name: "Membership", exact: true })
          .click();
        await expect(
          second.getByRole("button", { name: "Yêu cầu mua gói", exact: true }),
        ).toBeDisabled();
        expect(requests).toHaveLength(1);
        await second
          .getByRole("button", {
            name: "Thử lại thao tác đang chờ",
            exact: true,
          })
          .click();
        await expect.poll(() => requests.length).toBe(2);
        expect(requests[1]).toEqual(requests[0]);
        await expect(second.locator("#notice")).toHaveText(
          /Membership chỉ kích hoạt/,
        );
        await second.close();
        return;
      }
      await page.reload();
      if (mode === "scaled-recovery")
        await page.evaluate(() => {
          document.body.style.zoom = "2";
        });
      await page
        .getByRole("button", { name: "Membership", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Thử lại thao tác đang chờ",
          exact: true,
        }),
      ).toBeEnabled();
      expect(requests).toHaveLength(1);
      if (mode === "reload-plan-changed")
        await page.evaluate(() =>
          (window as unknown as { fixPlans: () => void }).fixPlans(),
        );
      await expect(
        page.locator("article.membershipPlan .primary").first(),
      ).toBeDisabled();
      const retry = page.getByRole("button", {
        name: "Thử lại thao tác đang chờ",
        exact: true,
      });
      await expect(page.locator("article.membershipPlan")).toHaveCount(
        mode === "reload-plan-changed" ? 1 : 2,
      );
      await expect(
        page.getByText(
          "Chưa rõ kết quả thao tác trước. Thử lại thao tác đang chờ để kiểm tra.",
        ),
      ).toBeVisible();
      if (mode === "scaled-recovery")
        expect(
          await page.evaluate(() => getComputedStyle(document.body).zoom),
        ).toBe("2");
      await page.screenshot({
        path: `output/membership-workspace/${mode}-pending.png`,
        fullPage: true,
      });
      await retry.focus();
      await page.keyboard.press("Enter");
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1]).toEqual(requests[0]);
      if (
        ["denied-replay", "wrong-owner-replay", "reload-malformed"].includes(
          mode,
        )
      ) {
        await expect(page.getByText(/chưa rõ kết quả/iu)).toBeVisible();
        await expect(purchase).toBeDisabled();
        expect(
          await page.evaluate((key) => localStorage.getItem(key), pendingKey),
        ).not.toBeNull();
        await expect(page.locator("#notice")).toHaveText("");
        await retry.click();
        await expect.poll(() => requests.length).toBe(3);
        expect(requests[2]).toEqual(requests[0]);
      }
    }
    if (mode === "unknown" || mode === "malformed" || mode === "renewal-lost") {
      if (mode === "renewal-lost") {
        await page.evaluate(() =>
          (
            window as unknown as { publishRenewal: () => void }
          ).publishRenewal(),
        );
        await expect(
          page.getByRole("button", { name: "Hủy ý định gia hạn", exact: true }),
        ).toBeDisabled();
      }
      await expect(page.getByText(/chưa rõ kết quả/iu)).toBeVisible();
      await expect(purchase).toBeDisabled();
      await page
        .getByRole("button", { name: "Hồ sơ và địa chỉ", exact: true })
        .click();
      await expect(page.getByLabel(/Tên hiển thị/)).toBeDisabled();
      await page
        .getByRole("button", { name: "Membership", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
        .click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1]).toEqual(requests[0]);
    }
    await expect(page.locator("#notice")).toHaveText(
      mode === "free" || mode === "reload-free"
        ? /Gói miễn phí.*có hiệu lực/
        : mode === "reload-cancel"
          ? /Đã hủy yêu cầu mua gói chưa thanh toán/
          : mode.includes("renewal") || mode === "wrong-owner-replay"
            ? /ý định gia hạn.*Không tự động thu tiền/
            : /Membership chỉ kích hoạt sau khi xác nhận thanh toán/,
    );
    if (
      mode === "mobile" ||
      mode === "mobile-recovery" ||
      mode === "scaled-recovery"
    )
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), pendingKey),
    ).toBeNull();
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `output/membership-workspace/${mode}.png`,
      fullPage: true,
    });
  });
