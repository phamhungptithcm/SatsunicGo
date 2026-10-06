import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  customer,
  otherCustomer,
  db,
  ownedOrders,
} from "./fixtures";

// Failure/delay-only Vite injection. Every successful page is a real SDK read.
// Auth, restoration and private readback use the isolated demo emulator.
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
const nonce = () =>
  randomUUID()
    .replaceAll("-", "")
    .replace(/[0-9a-f]/g, (c) => String.fromCharCode(97 + parseInt(c, 16)));

async function fixture() {
  const prefix = `000000-state-${nonce()}`;
  const ids = Array.from(
    { length: 501 },
    (_, n) => `${prefix}-${String(n).padStart(3, "0")}`,
  );
  for (let start = 0; start < ids.length; start += 500) {
    const batch = db.batch();
    for (const id of ids.slice(start, start + 500))
      batch.set(db.doc(`products/${id}`), {
        title: "Unrelated isolated fixture",
        slug: id,
        status: "published",
      });
    await batch.commit();
  }
  const { p, cid } = await askSource(`${prefix}-z`);
  ids.push(p.id);
  const purpose = `purpose${nonce()}`;
  const title = `Fixture ${nonce()}`;
  await db.doc(`products/${p.id}`).update({ title, functions: purpose });
  const ref = db.doc(`askConversations/${customer}-${cid}`);
  const before = (await ref.get()).data();
  const bCid = randomUUID();
  const bRef = db.doc(`askConversations/${otherCustomer}-${bCid}`);
  await bRef.set({
    ownerId: otherCustomer,
    version: 1,
    updatedAt: Date.now(),
    turns: [],
    draft: {},
  });
  await db.doc(`askCurrent/${otherCustomer}`).set({ conversationId: bCid });
  const bBefore = (await bRef.get()).data();
  const aOrders = (await ownedOrders()).map((o) => o.id).sort();
  const bOrders = (await ownedOrders(otherCustomer)).map((o) => o.id).sort();
  return {
    purpose,
    title,
    async unchanged() {
      expect((await ref.get()).data()).toEqual(before);
      expect((await bRef.get()).data()).toEqual(bBefore);
      expect((await ownedOrders()).map((o) => o.id).sort()).toEqual(aOrders);
      expect(
        (await ownedOrders(otherCustomer)).map((o) => o.id).sort(),
      ).toEqual(bOrders);
    },
    async cleanup() {
      for (let start = 0; start < ids.length; start += 500) {
        const batch = db.batch();
        for (const id of ids.slice(start, start + 500))
          batch.delete(db.doc(`products/${id}`));
        await batch.commit();
      }
      for (const [uid, id] of [
        [customer, cid],
        [otherCustomer, bCid],
      ]) {
        await db.doc(`askConversations/${uid}-${id}`).delete();
        await db.runTransaction(async (tx) => {
          const pointer = db.doc(`askCurrent/${uid}`);
          if ((await tx.get(pointer)).data()?.conversationId === id)
            tx.delete(pointer);
        });
      }
    },
  };
}

async function fault(page: Page, mode: "hold" | "error") {
  await page.route("**/src/features/ask/catalog-search.ts*", async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    // First five real pages build the partial result. Only the sixth public
    // read is delayed/rejected; releasing invokes the original getDocs.
    const body = original.replace(
      /(const request = boundedRead\(\s*)getDocs\(/,
      `$1((...args) => { window.__catalogStateReads = (window.__catalogStateReads ?? 0) + 1; if (window.__catalogStateReads !== 6) return getDocs(...args); window.__catalogStatePending = true; ${mode === "error" ? 'return Promise.reject(new Error("SYNTHETIC_PUBLIC_READ_FAILURE"));' : "return new Promise((resolve, reject) => { window.__catalogStateRelease = () => { window.__catalogStatePending = false; getDocs(...args).then(resolve, reject); }; });"} })(`,
    );
    expect(body).not.toBe(original);
    await route.fulfill({ response, body });
  });
}
async function release(page: Page) {
  await page.evaluate(() =>
    (
      window as unknown as { __catalogStateRelease?: () => void }
    ).__catalogStateRelease?.(),
  );
}
async function login(page: Page, identity: string) {
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
}
async function search(page: Page, purpose: string) {
  await page.goto("/account");
  await login(page, "customer-a");
  await page
    .getByRole("button", { name: /^(Hỏi SatsunicGo|Tiếp tục hội thoại)$/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  const resume = page.getByRole("button", {
    name: "Tiếp tục hội thoại",
    exact: true,
  });
  await expect(dialog.or(resume).first()).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  // Restored sourceIds intentionally mount a valid preexisting chooser.
  await expect(
    dialog.getByRole("heading", {
      name: "Chọn mua sản phẩm niêm yết",
      exact: true,
    }),
  ).toHaveCount(1);
  await dialog
    .getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true })
    .fill(`tìm sản phẩm ${purpose}`);
  await dialog.getByRole("button", { name: /^(Gửi câu hỏi|Gửi)$/ }).click();
  await expect(
    dialog.getByRole("heading", { name: "Sản phẩm phù hợp", exact: true }),
  ).toBeVisible();
  return dialog;
}
for (const state of ["pending", "retry", "close", "uid"] as const) {
  test(`ASK027 continuation ${state} preserves public search authority`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    const f = await fixture();
    let modelCalls = 0,
      writes = 0;
    page.on("request", (request) => {
      if (request.method() !== "POST") return;
      const path = new URL(request.url()).pathname;
      if (/\/ask$/.test(path)) modelCalls++;
      if (/\/(askWorkflow|command|catalogCheckout)$/.test(path)) writes++;
    });
    try {
      await fault(page, state === "retry" ? "error" : "hold");
      const dialog = await search(page, f.purpose);
      if (state === "retry") {
        await expect(
          dialog
            .getByRole("alert")
            .filter({ hasText: "Chưa tải thêm được sản phẩm" }),
        ).toBeVisible();
        const retry = dialog.getByRole("button", {
          name: "Tìm trong các sản phẩm tiếp theo",
          exact: true,
        });
        await expect(retry).toBeEnabled();
        await retry.click();
      } else {
        await expect(
          dialog
            .getByRole("status")
            .filter({ hasText: "Đang tìm tiếp trong danh mục" }),
        ).toBeVisible();
        await expect(
          dialog.getByRole("button", { name: "Đang tìm tiếp…", exact: true }),
        ).toBeDisabled();
        if (state === "close" || state === "uid") {
          await page.keyboard.press("Escape");
          await expect(dialog).not.toBeVisible();
        }
        if (state === "uid") {
          await page.getByRole("button", { name: /Tài khoản của/ }).click();
          await page
            .getByRole("button", { name: "Đăng xuất", exact: true })
            .click();
          await expect(
            page.getByRole("combobox", { name: "Vai trò thử", exact: true }),
          ).toBeVisible();
          await login(page, "customer-b");
        }
        await release(page);
      }
      if (state === "pending" || state === "retry") {
        const row = dialog.getByRole("listitem").filter({
          has: page.getByRole("link", { name: f.title, exact: true }),
        });
        await expect(row).toBeVisible();
        await row
          .getByRole("button", { name: "Chọn mua", exact: true })
          .click();
        await expect(
          dialog.getByRole("heading", {
            name: "Chọn mua sản phẩm niêm yết",
            exact: true,
          }),
        ).toBeVisible();
      } else {
        // Past the real read bound: discarded consumer results cannot update
        // hidden/other-identity history. Reopening may resume valid A scope.
        await page.waitForTimeout(5500);
        await expect(dialog).not.toBeVisible();
        await expect(
          page.getByRole("link", {
            name: f.title,
            exact: true,
            includeHidden: true,
          }),
        ).toHaveCount(0);
        const currentSearch = page.getByRole("region", {
          name: `tìm sản phẩm ${f.purpose}`,
          exact: true,
          includeHidden: true,
        });
        await expect(
          currentSearch.getByRole("heading", {
            name: "Chọn mua sản phẩm niêm yết",
            exact: true,
            includeHidden: true,
          }),
        ).toHaveCount(0);
        await expect(
          currentSearch.getByRole("button", {
            name: "Chọn mua",
            exact: true,
            includeHidden: true,
          }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("heading", {
            name: "Chọn mua sản phẩm niêm yết",
            exact: true,
          }),
        ).toHaveCount(0);
        // Closing preserves valid history; changing identity removes A's UI.
        await expect(
          page.getByRole("heading", {
            name: "Chọn mua sản phẩm niêm yết",
            exact: true,
            includeHidden: true,
          }),
        ).toHaveCount(state === "close" ? 1 : 0);
      }
      expect(modelCalls).toBe(0);
      expect(writes).toBe(0);
      await f.unchanged();
    } finally {
      await release(page).catch(() => {});
      await page.close();
      await f.cleanup();
    }
  });
}
