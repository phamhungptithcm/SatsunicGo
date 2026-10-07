import { test, expect } from "@playwright/test";

// Synthetic callable responses; shared demo login only. No business writes.
test("operations095 hierarchy, forms, mobile, empty and recovery", async ({
  page,
}) => {
  test.setTimeout(180000);
  let mode = "populated";
  let writes = 0;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const order = {
    id: "synthetic-operations095",
    version: 1,
    market: "US",
    ownerId: "synthetic",
    items: [
      { name: "Sản phẩm kiểm thử vận hành", variant: "Màu xanh", quantity: 2 },
    ],
    stage: "REQUESTED",
    collected: 0,
    refunded: 0,
    createdAt: 1,
    notes: "",
  };
  await page.route("**/listWork", async (route) => {
    const data = route.request().postDataJSON().data;
    if (mode === "error") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { status: "UNAVAILABLE", message: "Synthetic unavailable" },
        }),
      });
      return;
    }
    const rows =
      mode === "empty"
        ? []
        : data.kind === "orders"
          ? [order]
          : data.kind === "orderReturns"
            ? [
                {
                  id: "return095",
                  orderId: order.id,
                  version: 1,
                  state: "inspecting",
                  lines: [
                    {
                      line: 0,
                      name: order.items[0].name,
                      authorized: 2,
                      received: 2,
                      accepted: 2,
                      damaged: 0,
                    },
                  ],
                },
              ]
            : data.kind === "orderChanges"
              ? [
                  {
                    id: "change095",
                    orderId: order.id,
                    state: "accepted",
                    proposal: {
                      kind: "substitution",
                      reason: "Đổi sang biến thể khách đã duyệt",
                      finalPayable: 120000,
                      actualCosts: 10000,
                      termsVersion: "synthetic-v1",
                      lines: [
                        {
                          line: 0,
                          replacementName: "Sản phẩm thay thế",
                          replacementVariant: "Màu xanh",
                        },
                      ],
                    },
                  },
                ]
              : [];
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ result: { rows, next: null } }),
    });
  });
  await page.route(
    /\/(orderCommand|returnCommand|changeCommand)$/,
    async (route) => {
      writes++;
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            status: "PERMISSION_DENIED",
            message: "Synthetic write blocked",
          },
        }),
      });
    },
  );
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
  for (const path of ["orders", "purchasing", "warehouse"]) {
    await page.goto(`/crm/${path}?order=${order.id}`);
    const form = page.locator(".operationsActionForm");
    await expect(form).toBeVisible();
    for (const action of path === "warehouse"
      ? ["receive", "pack"]
      : path === "purchasing"
        ? ["recordPurchase", "claimPurchase"]
        : ["issueQuote"]) {
      await form
        .getByRole("combobox", { name: /^Thao tác/ })
        .selectOption(action);
      const finalAction = form.getByRole("button", {
        name:
          action === "claimPurchase"
            ? "Nhận việc mua hàng"
            : action === "recordPurchase"
              ? "Ghi nhận đã mua"
              : action === "receive"
                ? "Nhận và kiểm hàng"
                : action === "pack"
                  ? "Xác nhận đóng gói"
                  : "Gửi báo giá",
        exact: true,
      });
      if (action === "claimPurchase") await expect(finalAction).toBeVisible();
      else {
        await expect(finalAction).toBeHidden();
        await expect(
          form.getByRole("button", { name: "Tiếp tục →", exact: true }),
        ).toBeVisible();
      }
      if (action === "claimPurchase")
        await expect(
          form.getByRole("button", { name: "Nhận việc mua hàng", exact: true }),
        ).toBeDisabled();
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(form).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/private/tmp/operations095-${path}-${width}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto("/crm/returns");
  await page.getByText("Xử lý hàng trả", { exact: true }).click();
  await page.getByRole("combobox", { name: /^Thao tác/ }).selectOption("close");
  await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Bằng chứng nội bộ", exact: true })
    .fill("Bằng chứng kiểm thử 098");
  await page.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(
    page.getByText(
      "Hoàn tất kiểm tra không tự hoàn tiền hoặc gỡ tạm giữ đơn. Tài chính cần đối soát riêng.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hoàn tất kiểm tra", exact: true }),
  ).toBeVisible();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/private/tmp/operations095-returns-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto("/crm/changes");
  await expect(
    page.getByRole("button", {
      name: "Áp dụng quyết định đã duyệt",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Đổi sang biến thể khách đã duyệt", { exact: true }),
  ).toBeVisible();
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/private/tmp/operations095-changes-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto("/crm/orders");
  const trigger = page.getByRole("button", {
    name: order.items[0].name,
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".crmWorkbenchDetail028 > h2")).toBeFocused();
  await page
    .getByRole("button", { name: "Quay lại danh sách", exact: true })
    .click();
  await expect(trigger).toBeFocused();
  // Reflow equivalent to 200% zoom on a 1440px viewport. CSS body zoom
  // does not change media queries and is not browser zoom.
  await page.setViewportSize({ width: 720, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/crm/orders?order=${order.id}`);
  await expect(page.locator(".operationsActionForm")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/private/tmp/operations095-reflow200.png",
    fullPage: true,
  });
  mode = "empty";
  for (const path of [
    "orders",
    "purchasing",
    "warehouse",
    "returns",
    "changes",
  ]) {
    await page.goto(`/crm/${path}`);
    await expect(page.locator(".operationsEmpty")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  mode = "error";
  await page.goto("/crm/orders");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator(".operationsEmpty")).toHaveCount(0);
  mode = "empty";
  await page
    .locator(".crmHeading")
    .getByRole("button", { name: "Tải lại", exact: true })
    .click();
  await expect(page.locator(".operationsEmpty")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(writes).toBe(0);
  expect(errors).toEqual([]);
});
