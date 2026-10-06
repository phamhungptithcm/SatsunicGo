import { test, expect } from "@playwright/test";
import { seedIdentities, closeFixtures, customer } from "./fixtures";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

for (const width of [390, 768, 1440]) {
  test(`CRM026-${width} changed filters explain the next step and actual list loading`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
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
    await page.goto("/crm/customers");
    await expect(
      page.getByRole("button", { name: "Xem danh sách", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("combobox", { name: "Tìm theo", exact: true })
      .selectOption("id");
    const keyword = page.getByRole("textbox", { name: "Từ khóa", exact: true });
    await keyword.fill(customer);
    await expect(
      page
        .getByRole("status")
        .filter({
          hasText: "Bộ lọc đã đổi. Bấm Xem danh sách để xem kết quả.",
        }),
    ).toBeVisible();
    await expect(page.locator(".crmTable")).toHaveCount(0);
    let release!: () => void, requested!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetched = new Promise<void>((resolve) => {
      requested = resolve;
    });
    await page.route("**/listCustomers", async (route) => {
      if (
        route.request().method() !== "POST" ||
        route.request().postDataJSON()?.data?.search !== customer
      )
        return route.continue();
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      requested();
      await hold;
      await route.fulfill({ response });
    });
    try {
      await keyword.press("Tab");
      await expect(
        page.getByRole("button", { name: "Xem danh sách", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await fetched;
      await expect(
        page.getByRole("status").filter({ hasText: "Đang tải danh sách…" }),
      ).toBeVisible();
      await expect(
        page.getByRole("status").filter({ hasText: "Bộ lọc đã đổi." }),
      ).toHaveCount(0);
      release();
      await expect(
        page.locator(`a.crmCustomerLink[href="/crm/customers/${customer}"]`),
      ).toBeVisible();
      await expect(
        page.getByRole("status").filter({ hasText: "Đang tải danh sách…" }),
      ).toHaveCount(0);
      await page.screenshot({
        path: `${artifactDirectory}/crm-filter-taskflow-${width}.png`,
        fullPage: true,
      });
    } finally {
      release();
    }
  });
}
