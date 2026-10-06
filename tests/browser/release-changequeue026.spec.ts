import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db, customer } from "./fixtures";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

async function login(page: Page) {
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
}
async function fixtures(count = 1) {
  const marker = randomUUID(),
    now = Date.now(),
    batch = db.batch();
  const data = (reason: string, state: string, reviewedAt: number) => ({
    ownerId: customer,
    orderId: `queue026-${marker}`,
    state,
    createdAt: now - 100000,
    reviewedAt,
    proposal: {
      kind: "cancellation",
      reason,
      termsVersion: "synthetic-sanity-v1",
      finalPayable: 0,
      actualCosts: 0,
      lines: [{ line: 0, cancelQuantity: 1 }],
    },
  });
  // Discovery-only synthetic projections: no order, money or apply command.
  for (let i = 0; i < 31; i++)
    batch.set(
      db.doc(`orderChanges/000000000000-queue026-${marker}-${i}`),
      data(
        `Synthetic closed ${marker}-${i}`,
        i % 2 ? "applied" : "rejected",
        now - 50000,
      ),
    );
  const reasons = Array.from(
    { length: count },
    (_, i) => `Synthetic accepted queue ${marker}-${i}`,
  );
  for (let i = 0; i < count; i++)
    batch.set(
      db.doc(`orderChanges/z-queue026-${marker}-${i}`),
      data(reasons[i], "accepted", now + i),
    );
  await batch.commit();
  return reasons;
}
for (const width of [390, 768, 1440]) {
  test(`CQ026 newest accepted proposal remains discoverable beyond closed history at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    const [reason] = await fixtures();
    let applies = 0;
    page.on("request", (r) => {
      if (
        r.method() === "POST" &&
        r.url().endsWith("/changeCommand") &&
        r.postDataJSON()?.data?.action === "apply"
      )
        applies++;
    });
    await login(page);
    await page.goto("/crm/changes");
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
    await expect(page.locator("article.crmItem").first()).toContainText(reason);
    await expect(
      page.locator("article.crmItem").first().getByRole("button", {
        name: "Áp dụng quyết định đã duyệt",
        exact: true,
      }),
    ).toBeEnabled();
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Tải lại đề xuất", exact: true })
      .focus();
    await expect(
      page.getByRole("button", { name: "Tải lại đề xuất", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Mở đơn mua hộ", exact: true }).first(),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.locator("summary").filter({ hasText: "Chi tiết thay đổi" }).first(),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page
        .locator("article.crmItem")
        .first()
        .getByRole("button", {
          name: "Áp dụng quyết định đã duyệt",
          exact: true,
        }),
    ).toBeFocused();
    expect(applies).toBe(0);
    await page.screenshot({
      path: `${artifactDirectory}/changequeue-${width}.png`,
      fullPage: false,
    });
  });
}
test("CQ026 more than thirty accepted decisions paginate in review order without duplicates or autoapply", async ({
  page,
}) => {
  const reasons = await fixtures(33),
    seen: Record<string, unknown>[] = [];
  let applies = 0;
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      r.url().endsWith("/changeCommand") &&
      r.postDataJSON()?.data?.action === "apply"
    )
      applies++;
    if (
      r.method() === "POST" &&
      r.url().endsWith("/listWork") &&
      r.postDataJSON()?.data?.kind === "orderChanges"
    )
      seen.push(r.postDataJSON().data);
  });
  await login(page);
  await page.goto("/crm/changes");
  await expect(page.getByText(reasons[32], { exact: true })).toBeVisible();
  const cards = page.locator("article.crmItem");
  await expect(cards).toHaveCount(30);
  await expect(cards.first()).toContainText(reasons[32]);
  await expect(page.getByText(reasons[0], { exact: true })).toHaveCount(0);
  let release!: () => void, requested!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/listWork", async (route) => {
    if (
      route.request().method() !== "POST" ||
      !route.request().postDataJSON()?.data?.after
    )
      return route.continue();
    const response = await route.fetch();
    requested();
    await hold;
    await route.fulfill({ response });
  });
  try {
    const more = page.getByRole("button", {
      name: "Xem thêm đề xuất",
      exact: true,
    });
    await more.scrollIntoViewIfNeeded();
    const beforeScroll = await page.evaluate(() => scrollY);
    await more.click();
    await started;
    await expect(page.getByText(reasons[3], { exact: true })).toBeInViewport();
    expect(await page.evaluate(() => scrollY)).toBeGreaterThanOrEqual(
      beforeScroll - 64,
    );
    await expect(cards).toHaveCount(30);
    release();
    await page.unrouteAll({ behavior: "wait" });
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  for (const reason of reasons)
    await expect(page.getByText(reason, { exact: true })).toHaveCount(1);
  await expect(cards.first()).toContainText(reasons[32]);
  expect(seen.every((r) => r.changeState === "accepted")).toBe(true);
  expect(seen.some((r) => typeof r.after === "string")).toBe(true);
  expect(applies).toBe(0);
});
test("CQ026 held read and injected error/empty projection remain distinct with explicit recovery", async ({
  page,
}) => {
  const [reason] = await fixtures();
  await login(page);
  let release!: () => void, requested!: () => void, delivered!: () => void;
  const hold = new Promise<void>((r) => {
      release = r;
    }),
    started = new Promise<void>((r) => {
      requested = r;
    }),
    delivery = new Promise<void>((r) => {
      delivered = r;
    });
  await page.route("**/listWork", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    requested();
    await hold;
    await route.fulfill({ response });
    delivered();
  });
  try {
    await page.goto("/crm/changes");
    await started;
    await expect(
      page.getByText("Đang tải đề xuất…", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Chưa có thay đổi đã duyệt cần xử lý.", { exact: true }),
    ).toHaveCount(0);
    release();
    await delivery;
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  let mode: "error" | "empty" | "actual" = "error";
  await page.route("**/listWork", (route) => {
    if (route.request().method() !== "POST" || mode === "actual")
      return route.continue();
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        mode === "error"
          ? {
              error: {
                status: "UNAVAILABLE",
                message: "Synthetic injected read interruption",
              },
            }
          : { result: { rows: [], next: null } },
      ),
    });
  });
  try {
    const reload = page.getByRole("button", {
      name: "Tải lại đề xuất",
      exact: true,
    });
    await reload.click();
    await expect(page.getByRole("alert")).toContainText(
      "Chưa tải được đề xuất thay đổi.",
    );
    await expect(
      page.getByText("Chưa có thay đổi đã duyệt cần xử lý.", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "Áp dụng quyết định đã duyệt",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${artifactDirectory}/changequeue-error.png`,
      fullPage: false,
    });
    mode = "empty";
    await reload.click();
    // Empty is a declared SDK response fixture, not a real zero in the accumulated demo database.
    await expect(
      page.getByText("Chưa có thay đổi đã duyệt cần xử lý.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${artifactDirectory}/changequeue-empty.png`,
      fullPage: false,
    });
    mode = "actual";
    await reload.click();
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
    await expect(
      page.getByText("Chưa có thay đổi đã duyệt cần xử lý.", { exact: true }),
    ).toHaveCount(0);
  } finally {
    await page.unrouteAll({ behavior: "wait" });
  }
});
