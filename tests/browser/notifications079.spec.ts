import { test, expect } from "@playwright/test";
const url = "/tests/browser/fixtures/notifications079/index.html";
for (const width of [390, 768, 1440])
  test(`populated inbox ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url);
    await expect(page.locator(".notificationItem")).toHaveCount(2);
    const rail = page.getByRole("navigation", {
      name: "Không gian khách hàng",
    });
    await expect(rail.locator("a svg")).toHaveCount(6);
    const drawings = await rail
      .locator("a svg")
      .evaluateAll((nodes) => nodes.map((n) => n.innerHTML));
    expect(new Set(drawings).size).toBe(6);
    await expect(page.locator(".customerHelpLabel svg")).toHaveCount(1);
    await expect(page.locator(".notificationDot")).toHaveCount(2);
    await expect(page.locator(".notificationItemIcon")).toHaveCount(0);
    await expect(page.locator(".notificationItem.isUnread")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Xem phản hồi" }),
    ).toHaveAttribute("href", "/support");
    await page.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
    await expect(page.locator(".notificationItem.isUnread")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/reviews/ACCOUNT-RAIL-081-${width}-synthetic.png`,
      fullPage: true,
    });
  });
for (const state of ["empty", "error", "loading", "read-fail"])
  test(`inbox ${state}`, async ({ page }) => {
    await page.goto(`${url}?${state}`);
    if (state === "empty")
      await expect(
        page.getByRole("heading", { name: "Chưa có thông báo" }),
      ).toBeVisible();
    if (state === "loading")
      await expect(page.getByRole("status")).toHaveText("Đang tải thông báo…");
    if (state === "error") {
      await expect(page.getByRole("alert")).toContainText(
        "Chưa tải được thông báo",
      );
      await page.getByRole("button", { name: "Thử lại" }).click();
      await expect(page.getByRole("alert")).toBeVisible();
    }
    if (state === "read-fail") {
      await page.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
      await expect(page.getByRole("alert")).toContainText(
        "Chưa đánh dấu đã đọc được",
      );
      await expect(page.locator(".notificationItem.isUnread")).toHaveCount(1);
    }
    await page.screenshot({
      path: `docs/reviews/ACCOUNT-RAIL-081-${state}-synthetic.png`,
      fullPage: true,
    });
  });
test("keyboard and 200 percent scaling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${url}?error`);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const retry = page.getByRole("button", { name: "Thử lại" });
  await retry.focus();
  await expect(retry).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
