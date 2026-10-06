import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  db,
  ownedOrders,
} from "./fixtures";
import { artifactDirectory } from "./artifact-path";
const fixturePrefix = `catalog-auto027-${randomUUID()}`;
const fixtureIds = Array.from({ length: 501 }, (_, index) => `${fixturePrefix}-${index.toString().padStart(3, "0")}`);
test.beforeAll(async () => {
  await seedIdentities();
  for (let offset = 0; offset < fixtureIds.length; offset += 500) {
    const batch = db.batch();
    for (const id of fixtureIds.slice(offset, offset + 500))
      batch.set(db.doc(`products/${id}`), { title: "Synthetic unrelated catalog027", slug: id, status: "published", functions: "unrelated fixture only" });
    await batch.commit();
  }
});
test.afterAll(async () => {
  // Delete only this suite's explicitly owned synthetic records; no global reset.
  for (let offset = 0; offset < fixtureIds.length; offset += 500) {
    const batch = db.batch();
    for (const id of fixtureIds.slice(offset, offset + 500)) batch.delete(db.doc(`products/${id}`));
    await batch.commit();
  }
  await closeFixtures();
});
for (const width of [390, 768, 1440])
  test(`ASK027 catalog purpose search previews price and inline purchase without AI or implicit order at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    // Guaranteed beyond the first 500 records: exercise StrictMode continuation.
    const { p } = await askSource(`zzzzzz-catalog027-${randomUUID()}`);
    const purpose = `purpose${p.id.replace(/-/g, "")}`;
    await db.doc(`products/${p.id}`).update({
      title: "Kem dưỡng da",
      functions: purpose,
      catalogOptions: ["Large"],
    });
    const before = (await ownedOrders()).map((order) => order.id);
    let modelCalls = 0,
      writes = 0;
    page.on("request", (request) => {
      if (request.method() !== "POST") return;
      const path = new URL(request.url()).pathname;
      if (/\/ask$/.test(path)) modelCalls++;
      if (/\/(askWorkflow|command|catalogCheckout)$/.test(path)) writes++;
    });
    await page.goto("/account");
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("customer-a");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    const launcher = page.getByRole("button", {
      name: /^(Hỏi SatsunicGo|Tiếp tục hội thoại)$/,
    });
    await launcher.first().click();
    const resume = page.getByRole("button", {
      name: "Tiếp tục hội thoại",
      exact: true,
    });
    const dialog = page.getByRole("dialog", {
      name: "SatsunicGo",
      exact: true,
    });
    await expect(dialog.or(resume).first()).toBeVisible();
    if (await resume.isVisible()) await resume.click();
    await expect(dialog).toBeVisible();
    const composer = dialog.getByRole("textbox", {
      name: "Hỏi SatsunicGo",
      exact: true,
    });
    await expect(composer).toBeEnabled();
    await composer.fill(`tìm sản phẩm ${purpose}`);
    await dialog.getByRole("button", { name: /^(Gửi câu hỏi|Gửi)$/ }).click();
    await expect(
      dialog.getByRole("heading", { name: "Sản phẩm phù hợp", exact: true }),
    ).toBeVisible();
    const row = dialog.getByRole("listitem").filter({
      has: page.getByRole("link", { name: "Kem dưỡng da", exact: true }),
    });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Chọn mua", exact: true }).click();
    const form = dialog
      .locator("form")
      .filter({
        has: page.getByRole("heading", {
          name: "Chọn mua sản phẩm niêm yết",
          exact: true,
        }),
      })
      .last();
    await expect(
      form.getByRole("combobox", { name: "Mẫu", exact: true }),
    ).toHaveValue("Large");
    await expect(
      form.getByRole("button", {
        name: "Xác nhận lựa chọn và tạo đơn",
        exact: true,
      }),
    ).toBeEnabled();
    expect(modelCalls).toBe(0);
    expect(writes).toBe(0);
    expect((await ownedOrders()).map((order) => order.id)).toEqual(before);
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/ask027-catalog-${width}.png`,
    });
  });
