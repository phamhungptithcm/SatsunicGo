import { test, expect } from "@playwright/test";
import { seedIdentities, closeFixtures, customer } from "./fixtures";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

test("AUTH025-A01 Ask waits for restored identity before mounting after reload", async ({
  page,
}) => {
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
  let release!: () => void, lookupStarted!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    lookupStarted = resolve;
  });
  await page.route("**/accounts:lookup**", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.users[0].localId).toBe(customer);
    lookupStarted();
    await hold;
    await route.fulfill({ response });
  });
  try {
    await page.reload();
    await started;
    await expect(
      page.getByRole("status").filter({ hasText: "Đang khôi phục tài khoản…" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Hỏi SatsunicGo", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Tiếp tục hội thoại", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("dialog", { name: "SatsunicGo", exact: true }),
    ).toHaveCount(0);
  } finally {
    release();
  }
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Đang khôi phục tài khoản…" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Hỏi SatsunicGo", exact: true })
    .click();
  const composer = page.getByRole("textbox", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  await expect(composer).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(composer).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifactDirectory}/ask-auth-restored.png`,
    fullPage: true,
  });
});
