import { test, expect } from "@playwright/test";
const url = "/tests/browser/fixtures/security076/index.html";
test("synthetic enrollment: QR, manual key, retry, provider-confirmed success", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  const qr = page.getByRole("img", {
    name: "Mã QR để thêm tài khoản vào ứng dụng xác thực",
  });
  await expect(qr).toBeVisible();
  expect(await qr.getAttribute("src")).toMatch(/^data:image\/png;base64,/);
  await expect(page.locator(".securityKey")).toBeVisible();
  await expect(page.locator(".securityKey")).toHaveText("JBSWY3DPEHPK3PXP");
  await page.evaluate(() => {
    (window as unknown as { fixture: { fail: boolean } }).fixture.fail = true;
  });
  await page.getByLabel("Mã xác thực 6 chữ số", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Bật xác thực hai bước" }).click();
  await expect(page.getByRole("alert")).toContainText("Mã chưa được xác nhận");
  await expect(qr).toBeVisible();
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { fixture: { fail: boolean } }).fixture.fail = false;
  });
  await page.getByRole("button", { name: "Bật xác thực hai bước" }).click();
  await expect(page.getByRole("status")).toHaveText("Đã bật");
  await expect(page.getByText("Đã bật", { exact: true })).toBeVisible();
  await expect(qr).toHaveCount(0);
  await expect(page.locator(".securityKey")).toHaveCount(0);
});
test("cancel prevents late secret generation from restoring setup", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { fixture: { delay: number } }).fixture.delay = 800;
  });
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await page.getByRole("button", { name: "Hủy thiết lập" }).click();
  await page.waitForTimeout(1000);
  await expect(page.locator(".securityKey")).toHaveCount(0);
  await expect(page.getByRole("img")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true }),
  ).toBeEnabled();
});
for (const width of [390, 768, 1440])
  test(`navigation and enrollment fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url);
    const security = page.getByRole("link", {
      name: "Bảo mật tài khoản",
      exact: true,
    });
    await expect(security).toBeVisible();
    await expect(security).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("link", { name: "Hồ sơ và địa chỉ" }),
    ).toHaveAttribute("href", "/account/profile");
    await page
      .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
      .click();
    await expect(page.getByRole("img")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Mã xác thực 6 chữ số", { exact: true }).focus();
    await expect(
      page.getByLabel("Mã xác thực 6 chữ số", { exact: true }),
    ).toBeFocused();
    await page.screenshot({
      path: `docs/reviews/SECURITY-078-${width}-synthetic.png`,
      fullPage: true,
    });
  });
test("QR failure exposes manual alternative and cancellation clears material", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { fixture: { qrFail: boolean } }).fixture.qrFail =
      true;
  });
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Không tạo được mã QR");
  await expect(page.locator(".securityKey")).toBeVisible();
  await page.getByRole("button", { name: "Hủy thiết lập" }).click();
  await expect(page.locator(".securityKey")).toHaveCount(0);
});
test("provider enrollment followed by reload failure never reports enabled", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await expect(page.getByRole("img")).toBeVisible();
  await page.evaluate(() => {
    (
      window as unknown as { fixture: { reloadFail: boolean } }
    ).fixture.reloadFail = true;
  });
  await page.getByLabel("Mã xác thực 6 chữ số", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Bật xác thực hai bước" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "chưa tải được trạng thái mới",
  );
  await expect(page.getByText("Chưa xác định", { exact: true })).toBeVisible();
  await expect(page.getByText("Đã bật", { exact: true })).toHaveCount(0);
  await expect(page.locator(".securityKey")).toHaveCount(0);
});
test("200 percent content scaling and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("img")).toBeVisible();
  await page.getByRole("button", { name: "Sao chép khóa thiết lập" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".securityKey")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
test("user change clears secret and prevents late response", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByText("Chưa bật", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { fixture: { delay: number } }).fixture.delay = 800;
  });
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await page.evaluate(() => {
    (window as unknown as { switchUser: () => void }).switchUser();
  });
  await page.waitForTimeout(1000);
  await expect(
    page.getByText("Đăng nhập với Google để quản lý bảo mật tài khoản."),
  ).toBeVisible();
  await expect(page.locator(".securityKey")).toHaveCount(0);
  await expect(page.getByRole("img")).toHaveCount(0);
});
test("existing sign-in challenge confirms a code without claiming enrollment", async ({
  page,
}) => {
  await page.goto(url);
  await page.evaluate(() => {
    const w = window as unknown as {
      fixture: { challenge: boolean };
      refresh: () => void;
    };
    w.fixture.challenge = true;
    w.refresh();
  });
  await expect(
    page.getByRole("button", { name: "Xác nhận mã", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bật xác thực hai bước" }),
  ).toHaveCount(0);
  await page.getByLabel("Mã xác thực 6 chữ số", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Xác nhận mã", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Đã xác nhận mã xác thực.");
  await expect(page.getByText("Đã bật", { exact: true })).toHaveCount(0);
});
test("unsupported challenge cannot submit an empty factor", async ({
  page,
}) => {
  await page.goto(url);
  await page.evaluate(() => {
    const w = window as unknown as {
      fixture: { challenge: boolean; emptyChallenge: boolean };
      refresh: () => void;
    };
    w.fixture.challenge = true;
    w.fixture.emptyChallenge = true;
    w.refresh();
  });
  await expect(page.getByRole("alert")).toContainText(
    "phương thức xác thực khác",
  );
  await page.getByLabel("Mã xác thực 6 chữ số", { exact: true }).fill("123456");
  await expect(
    page.getByRole("button", { name: "Xác nhận mã", exact: true }),
  ).toBeDisabled();
});
test("explicit copy writes only the synthetic key and reports success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          Object.assign(window, { copiedFixture: value });
        },
      },
    });
  });
  await page.goto(url);
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await expect(page.locator(".securityKey")).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { copiedFixture?: string }).copiedFixture,
    ),
  ).toBeUndefined();
  await page.getByRole("button", { name: "Sao chép khóa thiết lập" }).click();
  await expect(page.getByRole("status")).toHaveText("Đã sao chép");
  expect(
    await page.evaluate(
      () => (window as unknown as { copiedFixture: string }).copiedFixture,
    ),
  ).toBe("JBSWY3DPEHPK3PXP");
  const row = page.locator(".securityKeyRow");
  expect(await row.evaluate((el) => getComputedStyle(el).display)).toBe("flex");
});
test("clipboard rejection provides manual recovery without a false success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("synthetic denied");
        },
      },
    });
  });
  await page.goto(url);
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await page.getByRole("button", { name: "Sao chép khóa thiết lập" }).click();
  await expect(page.getByRole("alert")).toContainText("Không sao chép được");
  await expect(page.getByText("Đã sao chép", { exact: true })).toHaveCount(0);
  await expect(page.locator(".securityKey")).toBeVisible();
});
test("late clipboard response cannot restore feedback after cancel", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () =>
          new Promise<void>((resolve) => setTimeout(resolve, 800)),
      },
    });
  });
  await page.goto(url);
  await page
    .getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true })
    .click();
  await page.getByRole("button", { name: "Sao chép khóa thiết lập" }).click();
  await page.getByRole("button", { name: "Hủy thiết lập" }).click();
  await page.waitForTimeout(1000);
  await expect(page.locator(".securityKey")).toHaveCount(0);
  await expect(page.getByText("Đã sao chép", { exact: true })).toHaveCount(0);
});
for (const width of [390, 768, 1440])
  test(`enabled status is compact without setup invitation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${url}?enabled`);
    await expect(page.getByRole("status")).toHaveText("Đã bật");
    await expect(
      page.getByRole("button", { name: "Thêm ứng dụng xác thực", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Xác thực lại với Google" }),
    ).toHaveCount(0);
    await expect(page.locator(".securityCard")).toHaveCount(0);
    expect(
      await page
        .locator(".securityOverview")
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBeLessThan(110);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/reviews/SECURITY-078-${width}-enabled-synthetic.png`,
      fullPage: true,
    });
  });
