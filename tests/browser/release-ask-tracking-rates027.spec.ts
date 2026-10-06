import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  sourceOrder,
  db,
  otherCustomer,
  customer,
} from "./fixtures";
import { artifactDirectory } from "./artifact-path";
import { vietCargoReferenceRates } from "../../packages/domain/shipping-rates";
test.beforeAll(async () => {
  await seedIdentities();
  await db.doc("shippingRatePublic/current").set({ version: 1, config: vietCargoReferenceRates });
});
test.afterAll(closeFixtures);
async function open(page: Page, linkedOrderId?: string) {
  const { cid } = await askSource();
  if (linkedOrderId) await db.doc(`askConversations/${customer}-${cid}`).update({ orderId: linkedOrderId });
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
  const resume = page.getByRole("button", {
    name: "Tiếp tục hội thoại",
    exact: true,
  });
  await page
    .getByRole("button", { name: /^(Hỏi SatsunicGo|Tiếp tục hội thoại)$/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  await expect(dialog.or(resume).first()).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  await expect(dialog).toBeVisible();
  return dialog;
}
test("ASK027 tracking one own order cannot confirm receipt for a different conversation order", async ({ page }) => {
  const trackedId = await sourceOrder(), linkedId = await sourceOrder();
  await db.doc(`orders/${trackedId}`).update({ stage: "IN_TRANSIT" });
  await db.doc(`orders/${linkedId}`).update({ stage: "DELIVERED" });
  const before = (await db.doc(`orders/${linkedId}`).get()).data();
  const dialog = await open(page, linkedId);
  await expect(dialog.getByRole("button", { name: "Xác nhận đã nhận đủ hàng", exact: true })).toBeVisible();
  let writes = 0;
  page.on("request", request => { if (request.method() === "POST" && /\/(askWorkflow|command|uploadOrderImage)$/.test(new URL(request.url()).pathname)) writes++; });
  const input = dialog.getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true });
  await input.fill(`mã đơn ${trackedId}`);
  await dialog.getByRole("button", { name: /^(Gửi câu hỏi|Gửi)$/ }).click();
  await expect(dialog.getByRole("link", { name: "Mở đơn đang tra cứu", exact: true })).toHaveAttribute("href", `/account/orders/${trackedId}`);
  await expect(dialog.getByRole("button", { name: "Xác nhận đã nhận đủ hàng", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Thêm ảnh sản phẩm", exact: true })).toBeDisabled();
  await input.fill("mình đã nhận đủ hàng");
  await dialog.getByRole("button", { name: /^(Gửi câu hỏi|Gửi)$/ }).click();
  await expect(dialog.getByRole("heading", { name: "Chọn đúng đơn trước khi xác nhận", exact: true })).toBeVisible();
  expect(writes).toBe(0);
  expect((await db.doc(`orders/${linkedId}`).get()).data()).toEqual(before);
});
for (const width of [390, 768, 1440])
  test(`ASK027 own tracking and quote tools work without AI at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    const orderId = await sourceOrder();
    await db
      .doc(`orders/${orderId}`)
      .update({ stage: "IN_TRANSIT", tracking: "Synthetic tracking027" });
    await db
      .doc(`orders/${orderId}/timeline/${randomUUID()}`)
      .set({
        action: "dispatch",
        createdAt: Date.now(),
        actor: "Synthetic private staff",
      });
    const before = (await db.doc(`orders/${orderId}`).get()).data();
    let model = 0,
      writes = 0;
    page.on("request", (r) => {
      if (r.method() !== "POST") return;
      const path = new URL(r.url()).pathname;
      if (/\/ask$/.test(path)) model++;
      if (
        /\/(askWorkflow|command|shippingRatesAdmin|studioCommand)$/.test(path)
      )
        writes++;
    });
    const dialog = await open(page);
    const input = dialog.getByRole("textbox", {
      name: "Hỏi SatsunicGo",
      exact: true,
    });
    await expect(input).toBeEnabled();
    await input.fill(`mã đơn ${orderId} đơn này đã gửi tới đâu rồi?`);
    await dialog
      .getByRole("button", { name: "Gửi câu hỏi", exact: true })
      .click();
    const tracking = dialog.getByRole("region", {
      name: "Theo dõi đơn hàng",
      exact: true,
    });
    await expect(tracking).toBeVisible();
    await expect(tracking.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(tracking).toContainText("Đang vận chuyển");
    await expect(tracking).toContainText(
      "Chưa có thời gian giao dự kiến được xác nhận",
    );
    expect(await tracking.textContent()).not.toContain(
      "Synthetic private staff",
    );
    await input.fill("giá gửi hàng từ Việt Nam sang Mỹ 1kg");
    await dialog
      .getByRole("button", { name: "Gửi câu hỏi", exact: true })
      .click();
    const calculator = dialog.getByRole("region", {
      name: "Tính cước trong chat",
      exact: true,
    });
    await expect(calculator).toContainText("1.300.000");
    await calculator
      .getByRole("spinbutton", {
        name: "Khối lượng tính cước (kg)",
        exact: true,
      })
      .fill("5.5");
    await expect(calculator).toContainText("Cần xem xét báo giá");
    expect(model).toBe(0);
    expect(writes).toBe(0);
    expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(before);
    expect(
      await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/ask027-tracking-rates-${width}.png`,
    });
  });
test("ASK027 foreign and missing order return same safe message without progress", async ({
  page,
}) => {
  const id = await sourceOrder();
  await db.doc(`orders/${id}`).update({ ownerId: otherCustomer });
  const dialog = await open(page),
    input = dialog.getByRole("textbox", {
      name: "Hỏi SatsunicGo",
      exact: true,
    });
  await expect(input).toBeEnabled();
  for (const orderId of [id, `missing-${randomUUID()}`]) {
    await input.fill(`mã đơn ${orderId}`);
    await dialog
      .getByRole("button", { name: "Gửi câu hỏi", exact: true })
      .click();
    await expect(
      dialog
        .getByText(
          "Không thể truy cập đơn này. Kiểm tra mã và tài khoản đã đặt đơn.",
          { exact: true },
        )
        .last(),
    ).toBeVisible();
    await expect(
      dialog.getByRole("region", { name: "Theo dõi đơn hàng", exact: true }),
    ).toHaveCount(0);
  }
});
