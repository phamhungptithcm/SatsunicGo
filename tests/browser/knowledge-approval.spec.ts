import { test, expect } from "@playwright/test";
for (const mode of [
  "approve",
  "unknown",
  "stale",
  "revoke",
  "expired-revoke",
  "mobile",
])
  test(`Knowledge approval ${mode}`, async ({ page }) => {
    if (mode === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const source = await (
      await page.request.get("/src/features/settings/KnowledgeApproval.tsx")
    ).text();
    const entry = await (await page.request.get("/src/app/main.tsx")).text();
    const react = source.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
    const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
    const requests: Record<string, unknown>[] = [];
    await page.route("**/src/shared/firebase.ts*", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `export const auth=null;export async function callService(name,data){const r=await fetch('/knowledge-ui',{method:'POST',body:JSON.stringify({name,data})});const result=await r.json();if(result.error)throw result.error;return result;}`,
      }),
    );
    await page.route("**/knowledge-ui", async (route) => {
      const { name, data } = route.request().postDataJSON();
      if (name === "askKnowledgePreview")
        return route.fulfill({
          json: {
            source: "posts",
            sourceId: "guide-one",
            title: "Synthetic QA guidance",
            body: "Conditions and exceptions\nSynthetic QA text only.",
            published: mode !== "expired-revoke",
            contentHash: "a".repeat(64),
            version: mode.includes("revoke") ? 1 : 0,
            active: mode === "revoke",
            approved: mode.includes("revoke"),
          },
        });
      requests.push(data);
      if (mode === "unknown" && requests.length === 1)
        return route.fulfill({
          json: { error: { code: "functions/unavailable" } },
        });
      if (mode === "stale")
        return route.fulfill({
          json: { error: { code: "functions/aborted" } },
        });
      return route.fulfill({
        json: { version: mode.includes("revoke") ? 2 : 1 },
      });
    });
    await page.route("**/knowledge-fixture", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<div id="root" style="max-width:640px;margin:auto"></div><script type="module">import '/src/styles/global.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const {KnowledgeApproval}=await import('/src/features/settings/KnowledgeApproval.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(KnowledgeApproval));</script>`,
      }),
    );
    await page.goto("/knowledge-fixture");
    await page.getByLabel(/Mã bài viết/).fill("guide-one");
    await page
      .getByRole("button", { name: "Kiểm tra nguồn", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Synthetic QA guidance" }),
    ).toBeVisible();
    await page.screenshot({
      path: `output/knowledge-approval/${mode}-preview.png`,
      fullPage: true,
    });
    if (mode.includes("revoke"))
      await page
        .getByRole("button", { name: "Thu hồi nguồn", exact: true })
        .click();
    else {
      await expect(
        page.getByRole("button", { name: "Duyệt nguồn cho Ask", exact: true }),
      ).toBeDisabled();
      await page.getByLabel("Có hiệu lực từ").fill("2026-10-07T00:00");
      await page.getByLabel("Hết hiệu lực lúc").fill("2026-11-07T00:00");
      await page
        .getByLabel("Tôi đã kiểm tra nội dung, ngôn ngữ và thời hạn.")
        .check();
      await page
        .getByRole("button", { name: "Duyệt nguồn cho Ask", exact: true })
        .click();
    }
    await expect.poll(() => requests.length).toBe(1);
    if (mode === "unknown") {
      await expect(
        page.getByText(
          "Chưa xác minh được kết quả. Đối chiếu thao tác đang chờ trước khi tiếp tục.",
        ),
      ).toBeVisible();
      await expect(page.getByLabel(/Mã bài viết/)).toBeDisabled();
      await page
        .getByRole("button", { name: "Đối chiếu thao tác đang chờ" })
        .click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1]).toEqual(requests[0]);
    }
    if (mode === "stale")
      await expect(
        page.getByText(
          "Chưa duyệt được nguồn. Tải lại và kiểm tra quyền, nội dung hoặc phiên bản mới.",
        ),
      ).toBeVisible();
    else
      await expect(
        page.getByText(
          mode.includes("revoke")
            ? "Đã thu hồi nguồn khỏi Ask. Tải lại để kiểm tra trạng thái mới."
            : "Đã duyệt nguồn cho Ask. Tải lại để kiểm tra trạng thái mới.",
        ),
      ).toBeVisible();
    if (mode === "mobile")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `output/knowledge-approval/${mode}.png`,
      fullPage: true,
    });
  });
