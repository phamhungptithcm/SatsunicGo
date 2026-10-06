import { test, expect, type Page } from "@playwright/test";
import { artifactDirectory } from "./artifact-path";
import { seedIdentities, closeFixtures, freshCustomer, db } from "./fixtures";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function login(page: Page, identity = "owner") {
  await page.goto("/account");
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
async function verifyNavigationContrast(page: Page, width: number) {
  const captions = page
    .getByRole("navigation", { name: "Không gian vận hành", exact: true })
    .locator(".workspaceNavGroup > p");
  const values = await captions.evaluateAll((elements) =>
    elements.map((el) => {
      const rgb = (value: string) =>
        value
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number);
      const luminance = (color: number[]) =>
        color
          .map((n) => {
            const s = n / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          })
          .reduce((v, n, i) => v + n * [0.2126, 0.7152, 0.0722][i], 0);
      const style = getComputedStyle(el),
        container = el.closest("aside,dialog")!;
      const background = getComputedStyle(container).backgroundColor;
      const f = luminance(rgb(style.color)),
        b = luminance(rgb(background));
      return {
        caption: el.textContent,
        foreground: style.color,
        background,
        opacity: style.opacity,
        contrast: (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05),
      };
    }),
  );
  expect(values).toHaveLength(5);
  for (const value of values) {
    expect(value.opacity).toBe("1");
    expect(value.contrast).toBeGreaterThanOrEqual(4.5);
  }
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(
      `${artifactDirectory}/nav-contrast-${width}.json`,
      JSON.stringify(values, null, 2),
    ),
  );
}

for (const width of [390, 768, 1440]) {
  test(`CRM024-${width} clear shell and customer filters retain keyboard and empty recovery`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await login(page);
    await page.goto("/crm");
    await expect(page).toHaveURL(/\/crm\/overview$/);
    await page.goto("/crm/customers");
    await expect(
      page.getByRole("heading", { name: "Khách hàng", exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator(".workspaceShell")
        .evaluate((element) => element.getBoundingClientRect().top),
    ).toBe(0);
    const keyword = page.getByRole("textbox", { name: "Từ khóa", exact: true });
    await keyword.fill("no-match-synthetic-crm024");
    await keyword.focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Xem danh sách", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Xem danh sách", exact: true }),
    ).toBeEnabled();
    await expect(page.getByText(/Chưa có khách|Không có khách/)).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.locator(".crmTable table")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/crm-customers-${width}.png`,
      fullPage: true,
    });
    await page.goto("/crm/overview");
    await expect(
      page.getByRole("heading", { name: "Tổng quan vận hành", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Xem số liệu", exact: true })
      .click();
    await expect(page.locator(".crmMetrics > div")).toHaveCount(9);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/crm-overview-${width}.png`,
      fullPage: true,
    });
    if (width < 1000) {
      await page
        .getByRole("button", { name: "Mở menu vận hành", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await verifyNavigationContrast(page, width);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Mở menu vận hành", exact: true }),
      ).toBeFocused();
    }
    if (width >= 1000) await verifyNavigationContrast(page, width);
    await page.goto("/products");
    await expect(
      page.getByRole("heading", { name: "Sản phẩm", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.body).paddingTop),
      ),
    ).toBeGreaterThan(0);
  });
}

test("CRM024 membership expiry and unknown state reflect server projection without changing subscription", async ({
  page,
}) => {
  const actor = await freshCustomer();
  await db
    .doc(`users/${actor.uid}`)
    .update({ displayName: "Synthetic expiry CRM024" });
  const subscription = { state: "active", endsAt: Date.now() - 1000 };
  await db.doc(`membershipSubscriptions/${actor.uid}`).set(subscription);
  await login(page);
  await page.goto(`/crm/customers/${actor.uid}`);
  await expect(page.getByText("Đã hết hạn", { exact: true })).toBeVisible();
  await expect(page.getByText("Đang có hiệu lực", { exact: true })).toHaveCount(
    0,
  );
  expect(
    (await db.doc(`membershipSubscriptions/${actor.uid}`).get()).data(),
  ).toEqual(subscription);
  await db
    .doc(`membershipSubscriptions/${actor.uid}`)
    .set({ state: "active", endsAt: null });
  await page.reload();
  await expect(
    page.getByText("Chưa xác định hiệu lực", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Invalid Date/)).toHaveCount(0);
  await expect(
    page.locator(".crmProfileSummary").getByText("0", { exact: true }),
  ).toHaveCount(0);
  expect(
    (await db.doc(`membershipSubscriptions/${actor.uid}`).get()).data(),
  ).toEqual({ state: "active", endsAt: null });
  await page.screenshot({
    path: `${artifactDirectory}/crm-membership-unknown.png`,
    fullPage: true,
  });
});

for (const identity of ["finance", "support"]) {
  test(`CRM024 restricted ${identity} landing keeps allowed fallback and denies overview`, async ({
    page,
  }) => {
    await login(page, identity);
    await page.goto("/crm");
    await expect(page).toHaveURL(/\/crm\/documents$/);
    await expect(
      page.getByRole("heading", { name: "Chứng từ đơn hàng", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Không gian vận hành", exact: true })
        .getByRole("link", { name: "Tổng quan", exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: `${artifactDirectory}/crm-documents-${identity}.png`,
      fullPage: false,
    });
    await page.goto("/crm/overview");
    await expect(
      page.getByRole("heading", {
        name: "Không thể mở công việc này",
        exact: true,
      }),
    ).toBeVisible();
  });
}
