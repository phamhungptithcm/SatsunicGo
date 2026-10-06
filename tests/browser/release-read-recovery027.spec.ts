import { test, expect } from "@playwright/test";
import { seedIdentities, closeFixtures } from "./fixtures";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
test("READ027 delayed public rate response releases read deadline and permits real retry", async ({
  page,
}) => {
  // Controlled network delay proves browser recovery; it is not a provider latency benchmark.
  await page.clock.install();
  let intercepted = false, holding = true;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/shippingRatesPublic", async (route) => {
    if (route.request().method() !== "POST" || !holding)
      return route.continue();
    intercepted = true;
    await held;
    await route.abort("timedout").catch(() => {});
  });
  await page.goto("/fees");
  await expect.poll(() => intercepted).toBe(true);
  await expect(
    page.getByRole("button", { name: "Tải lại bảng giá", exact: true }),
  ).toBeDisabled();
  await page.clock.runFor(15001);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tải lại bảng giá", exact: true }),
  ).toBeEnabled();
  holding = false;
  release();
  await page
    .getByRole("button", { name: "Tải lại bảng giá", exact: true })
    .click();
  await expect(
    page.getByText("1.300.000", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
