import { test, expect, type Page } from "@playwright/test";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
import { seedIdentities, closeFixtures, customer } from "./fixtures";
import { artifactDirectory } from "./artifact-path";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function openWorkbench(page: Page) {
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption("owner");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  const rows = Array.from({ length: 30 }, (_, i) =>
    createCatalogOrder(
      {
        title: `CRM028 sản phẩm ${i + 1}`,
        slug: `crm028-${i}`,
        status: "published",
        market: "US",
        version: 1,
        orderable: true,
        listedPrice: 240000,
        termsVersion: "test",
      },
      { productId: `crm028-${i}`, productVersion: 1, quantity: 1 },
      { id: `crm028-${i}`, ownerId: customer, now: Date.now() },
    ),
  );
  // Controlled projection verifies layout, not emulator mutation or payment acceptance.
  await page.route("**/listWork", async (route) => {
    if (
      route.request().method() !== "POST" ||
      route.request().postDataJSON()?.data?.kind !== "orders"
    )
      return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { rows, next: null } }),
    });
  });
  await page.goto("/crm/orders");
  await expect(page.locator(".crmList .crmItemTitle")).toHaveCount(30);
}
for (const width of [390, 768, 1440]) {
  test(`CRM028 ${width} selects detail visibly and explains unpaid action`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkbench(page);
    const first = page.locator(".crmList .crmItemTitle").first();
    await first.focus();
    await page.keyboard.press("Enter");
    const detail = page.locator(".crmWorkbenchDetail028");
    await expect(detail).toBeVisible();
    await expect(detail.locator("h2")).toBeFocused();
    await expect(detail.locator("h2")).toBeInViewport();
    await expect(
      detail.getByRole("button", { name: "Nhận việc mua hàng", exact: true }),
    ).toBeDisabled();
    await expect(
      detail.getByText(
        "Chưa đủ tiền để mua hàng. Đơn niêm yết cần thanh toán toàn bộ.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await detail.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    if (width <= 1100) {
      await expect(page.locator(".crmList")).toBeHidden();
      await detail
        .getByRole("combobox", { name: "Thao tác", exact: true })
        .selectOption("hold");
      await detail
        .getByRole("textbox", {
          name: "Lý do tạm giữ · để trống khi bỏ giữ",
          exact: true,
        })
        .fill("Ghi chú chưa lưu CRM028");
      await detail
        .getByRole("button", { name: "Quay lại danh sách", exact: true })
        .click();
      await expect(first).toBeFocused();
      await expect(first).toBeInViewport();
      await page.keyboard.press("Enter");
      await expect(
        detail.getByRole("textbox", {
          name: "Lý do tạm giữ · để trống khi bỏ giữ",
          exact: true,
        }),
      ).toHaveValue("Ghi chú chưa lưu CRM028");
      await detail
        .getByRole("button", { name: "Quay lại danh sách", exact: true })
        .click();
      const last = page.locator(".crmList .crmItemTitle").last();
      await last.click();
      await expect(detail.locator("h2")).toHaveText("CRM028 sản phẩm 30");
      await expect(detail.locator("h2")).toBeInViewport();
      await detail
        .getByRole("button", { name: "Quay lại danh sách", exact: true })
        .click();
      await expect(last).toBeFocused();
      await expect(last).toBeInViewport();
    }
    await page.screenshot({
      path: `${artifactDirectory}/crm028-${width}.png`,
      fullPage: false,
    });
  });
}
