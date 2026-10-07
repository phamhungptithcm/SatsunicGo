import { test, expect } from "@playwright/test";
const url = "/tests/browser/fixtures/request083/index.html";
for (const width of [390, 768, 1440])
  test(`colored stepper ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(url);
    if (width === 1440)
      expect(
        (await page.locator(".quickRequestPage").boundingBox())!.width,
      ).toBe(1180);
    const markers = page.locator(".requestStepper button");
    const first = await markers.nth(0).boundingBox(),
      second = await markers.nth(1).boundingBox();
    if (width <= 640) {
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
      const panel = await page.locator(".requestProducts").boundingBox();
      expect(panel!.x).toBeGreaterThan(first!.x + first!.width);
      expect(Math.abs(panel!.y - first!.y)).toBeLessThan(70);
    } else expect(second!.y).toBeCloseTo(first!.y, 0);

    await expect(page.locator(".requestStepper .isCurrent")).toContainText(
      "Món hàng",
    );
    await expect(page.locator(".requestInformation")).toBeHidden();
    await page.getByRole("button", { name: "Tiếp tục" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(".requestStepper .isComplete")).toHaveCount(0);
    await page
      .getByPlaceholder("Tên, link hoặc ảnh sản phẩm…")
      .fill("Synthetic camera");
    await page.getByRole("button", { name: "Tiếp tục" }).click();
    await expect(page.locator(".requestStepper .isComplete")).toContainText(
      "Đã hoàn thành",
    );
    await expect(page.locator(".requestStepper .isCurrent")).toContainText(
      "Thông tin thêm",
    );
    await expect(page.locator(".requestProducts")).toBeHidden();
    await expect(
      page
        .getByRole("heading", { name: "Thông tin thêm", exact: true })
        .first(),
    ).toBeFocused();
    const notes = await page.locator(".requestNotes").boundingBox(),
      extras = await page.locator(".requestExtras").boundingBox();
    expect(notes!.width).toBeCloseTo(extras!.width, 0);
    await page.screenshot({
      path: `docs/reviews/REQUEST-083-${width}-synthetic.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Tiếp tục" }).click();
    await expect(page.locator(".requestStepper .isComplete")).toHaveCount(2);
    await expect(page.locator(".requestReview")).toContainText(
      "Synthetic camera",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Quay lại" }).click();
    await expect(page.locator(".requestStepper .isComplete")).toHaveCount(1);
  });
test("data, draft, editing and final auth gate", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Nhật Bản", exact: true }).click();
  await page
    .getByPlaceholder("Tên, link hoặc ảnh sản phẩm…")
    .fill("Synthetic camera");
  await page.getByLabel("Số lượng", { exact: true }).fill("2");
  await page.getByLabel("Mẫu, màu, kích cỡ", { exact: true }).fill("Black");
  await page.getByRole("button", { name: "Thêm món" }).click();
  await page.getByRole("button", { name: "Bỏ món 2", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page
    .getByRole("textbox", { name: "Ghi chú", exact: true })
    .fill("Synthetic note");
  await page.getByLabel("Cửa hàng", { exact: true }).fill("Synthetic shop");
  await page.getByLabel("Ngân sách dự kiến (₫)", { exact: true }).fill("-1");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.getByRole("alert")).toContainText("ngân sách");
  await page
    .getByLabel("Ngân sách dự kiến (₫)", { exact: true })
    .fill("500000");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.locator(".requestReview")).toContainText("500.000 ₫");
  await page
    .getByRole("button", { name: "Chỉnh sửa", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Số lượng", { exact: true })).toHaveValue("2");
  await page.reload();
  await expect(
    page.getByPlaceholder("Tên, link hoặc ảnh sản phẩm…"),
  ).toHaveValue("Synthetic camera");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(
    page.getByRole("textbox", { name: "Ghi chú", exact: true }),
  ).toHaveValue("Synthetic note");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Đăng nhập để gửi" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { fixtureSignIns: number }).fixtureSignIns,
    ),
  ).toBe(1);
});
test("disabled submission", async ({ page }) => {
  await page.goto(`${url}?off`);
  await page
    .getByPlaceholder("Tên, link hoặc ảnh sản phẩm…")
    .fill("Synthetic item");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(
    page.getByRole("button", { name: "Đăng nhập để gửi" }),
  ).toBeDisabled();
});
test("keyboard advance does not submit; 200 percent zoom", async ({ page }) => {
  await page.goto(url);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page
    .getByPlaceholder("Tên, link hoặc ảnh sản phẩm…")
    .fill("Synthetic item");
  await page.getByLabel("Số lượng", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".requestStepper .isCurrent")).toContainText(
    "Thông tin thêm",
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { fixtureSignIns: number }).fixtureSignIns,
    ),
  ).toBe(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
