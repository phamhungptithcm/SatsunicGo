import { test, expect, type Page, type Locator } from "@playwright/test";

// Existing demo login; every business command and fixture read is intercepted.
async function fixture(page: Page) {
  const commands: Record<string, unknown>[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (dialog) => void dialog.accept());
  const order = {
    id: "synthetic-stepper098",
    version: 1,
    ownerId: "synthetic",
    items: [{ name: "Hàng kiểm thử", variant: "Màu xanh", quantity: 2 }],
    market: "US",
    notes: "",
    stage: "REQUESTED",
    createdAt: 1,
    collected: 100000,
    refunded: 0,
    packingComplete: true,
    packedQuantity: 2,
    finalTotal: 100000,
    finalApproved: true,
  };
  const parcel = {
    id: "synthetic-parcel098",
    version: 1,
    state: "packed",
    warehouse: "Kho kiểm thử",
    route: "US-VN",
    weightGrams: 250,
    allocations: [{ orderId: order.id, line: 0, quantity: 1 }],
  };
  await page.route(
    /\/(listWork|readOwnerConfiguration|readStaffAccess|readCustomer|listCrmStaff|websiteBannerAdmin|shippingRatesAdmin|orderHistory|workspaceCommand|saveCustomerNotes|orderCommand|changeCommand|returnCommand|refundCommand|shippingCommand|consolidationCommand|websiteBannerCommand|membershipCommand|financeReview|verifyTransfer)$/,
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const name = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const data = route.request().postDataJSON().data;
      if (
        name.endsWith("Command") ||
        name === "saveCustomerNotes" ||
        name === "financeReview" ||
        name === "verifyTransfer"
      ) {
        commands.push({ name, ...data });
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              status: "UNAVAILABLE",
              message: "Synthetic unknown result098",
            },
          }),
        });
      }
      const result =
        name === "readOwnerConfiguration"
          ? {
              pricing: {
                version: 1,
                termsVersion: "synthetic-v1",
                approved: false,
                rates: Object.fromEntries(
                  ["USD", "JPY", "KRW"].map((c) => [
                    c,
                    { numerator: 25000, denominator: 100 },
                  ]),
                ),
                effectiveFrom: 1791400000000,
                expiresAt: 1794000000000,
              },
            }
          : name === "readStaffAccess"
            ? {
                access: {
                  version: 1,
                  roles: ["support"],
                  active: true,
                  locked: false,
                  orderIds: [],
                },
              }
            : name === "readCustomer"
              ? {
                  profile: {
                    displayName: "Khách kiểm thử",
                    businessName: "",
                    marketingConsent: false,
                  },
                  crm: {
                    version: 1,
                    tags: [],
                    notes: "",
                    assigneeId: "",
                    followUpAt: 0,
                  },
                  membership: null,
                  orders: [],
                  tickets: [],
                  ordersNext: null,
                  ticketsNext: null,
                  limit: 30,
                }
              : name === "listCrmStaff"
                ? {
                    rows: [
                      {
                        id: "synthetic-staff098",
                        displayName: "Nhân viên kiểm thử",
                      },
                    ],
                    next: null,
                  }
                : name === "websiteBannerAdmin"
                  ? {
                      rows: [],
                      next: null,
                      modes: { home: "auto", products: "auto" },
                      manifestVersion: 1,
                      owner: true,
                      serverNow: Date.now(),
                    }
                  : name === "shippingRatesAdmin"
                    ? { version: 1, config: null, publishedVersion: null }
                    : name === "orderHistory"
                      ? { order, entries: [] }
                      : {
                          rows:
                            data.kind === "orders"
                              ? [order]
                              : data.kind === "packages"
                                ? [parcel]
                                : data.kind === "membershipPlans"
                                  ? [
                                      {
                                        id: "synthetic-plan098",
                                        version: 1,
                                        name: "PLUS",
                                        price: 100000,
                                        periodDays: 30,
                                        serviceDiscountBps: 100,
                                        discountCap: 10000,
                                        status: "published",
                                      },
                                    ]
                                  : data.kind === "orderReturns"
                                    ? [
                                        {
                                          id: "synthetic-return098",
                                          orderId: order.id,
                                          version: 1,
                                          state: "inspecting",
                                          lines: [
                                            {
                                              line: 0,
                                              name: "Hàng kiểm thử",
                                              authorized: 2,
                                              received: 2,
                                              accepted: 2,
                                              damaged: 0,
                                            },
                                          ],
                                        },
                                      ]
                                    : data.kind === "refunds"
                                      ? [
                                          {
                                            id: "synthetic-refund098",
                                            orderId: order.id,
                                            version: 1,
                                            state: "pending",
                                            amount: 100000,
                                            reason: "Lý do kiểm thử",
                                          },
                                        ]
                                      : [],
                          next: null,
                        };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ result }),
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
  return { commands, errors, order, parcel };
}
async function fillVisible(form: Locator) {
  for (const control of await form
    .locator("input:visible,textarea:visible,select:visible")
    .all()) {
    if (await control.isDisabled()) continue;
    const spec = await control.evaluate((node) => ({
      tag: node.tagName,
      type: (node as HTMLInputElement).type,
      required: (node as HTMLInputElement).required,
      name: (node as HTMLInputElement).name,
      value: (node as HTMLInputElement).value,
      min: (node as HTMLInputElement).min,
      pattern: (node as HTMLInputElement).pattern,
      valid: (node as HTMLInputElement).validity.valid,
    }));
    if (spec.type === "file" || spec.type === "hidden") continue;
    if (spec.type === "checkbox" || spec.type === "radio") {
      if (spec.required) await control.check();
      continue;
    }
    if (spec.tag === "SELECT") {
      if (!spec.value && spec.required) {
        const value = await control
          .locator("option")
          .evaluateAll(
            (options) =>
              (options as HTMLOptionElement[]).find((o) => o.value)?.value,
          );
        if (value) await control.selectOption(value);
      }
      continue;
    }
    if ((spec.value && spec.valid) || !spec.required) continue;
    await control.fill(
      spec.type === "number"
        ? String(Math.max(Number(spec.min || 0), 1))
        : spec.type === "datetime-local"
          ? "2026-10-10T12:00"
          : spec.type === "url"
            ? "https://example.com/test"
            : spec.name === "path"
              ? "/products"
              : spec.pattern
                ? "synthetic098"
                : "Thông tin kiểm thử 098",
    );
  }
}
async function completeStages(
  page: Page,
  form: Locator,
  label: string,
  commands: unknown[],
) {
  await expect(form).toBeVisible();
  const initial = commands.length;
  const count = await form.locator(".crmStepper > button").count();
  for (let i = 0; i < count; i++) {
    await expect(form.locator(".crmStepper > button").nth(i)).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(
      await form.locator("[data-step-stage]:visible").count(),
    ).toBeGreaterThan(0);
    if (i > 0)
      await expect
        .poll(() =>
          form
            .locator(`[data-step-stage="${i}"]`)
            .first()
            .evaluate(
              (stage) =>
                stage === document.activeElement ||
                stage.contains(document.activeElement),
            ),
        )
        .toBe(true);
    if (i < count - 1)
      await expect(
        form.locator(".crmStepper > button").nth(i + 1),
      ).toBeDisabled();
    await fillVisible(form);
    if (i < count - 1)
      await form
        .getByRole("button", { name: "Tiếp tục →", exact: true })
        .click();
  }
  expect(commands.length).toBe(initial);
  await expect(form.locator(".crmStepReview").first()).toBeVisible();
  await page.screenshot({
    path: `/private/tmp/crm098/${label}-desktop.png`,
    fullPage: true,
  });
  await form.getByRole("button", { name: "← Quay lại", exact: true }).click();
  await expect(
    form.locator(".crmStepper > button").nth(count - 2),
  ).toHaveAttribute("aria-current", "step");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const nav = await form.locator(".crmStepper").boundingBox(),
      content = await form.locator(".crmStepContent").boundingBox();
    expect(nav!.x + nav!.width).toBeLessThanOrEqual(content!.x + 1);
    await page.screenshot({
      path: `/private/tmp/crm098/${label}-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  expect(commands.length).toBe(initial);
}

test("CRM098 shared stages, draft, validation, mobile and original final command/retry", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/crm/campaigns");
  await page.getByRole("button", { name: /Tạo bản nháp/ }).click();
  let form = page.locator("form.crmStepForm").first();
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(form.locator(".crmStepper > button").first()).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(form.locator('input[name="title"]')).toBeFocused();
  await form
    .locator('textarea[name="caption"]')
    .fill("Nội dung kiểm thử dài. ".repeat(30));
  await completeStages(page, form, "campaign", state.commands);
  await expect(form.locator(".crmStepReview summary")).toHaveText(
    "Xem toàn bộ",
  );
  await form
    .locator('input[name="title"]')
    .evaluate((input: HTMLInputElement) => {
      input.value = "";
    });
  await form.getByRole("button", { name: /Lưu chiến dịch/ }).click();
  await expect(form.locator('input[name="title"]')).toBeFocused();
  expect(state.commands).toEqual([]);
  await form.locator('input[name="title"]').fill("Thông tin kiểm thử 098");
  await form.locator(".crmStepper > button").first().click();
  await expect(form.locator('input[name="title"]')).toHaveValue(
    "Thông tin kiểm thử 098",
  );
  await form.evaluate((node: HTMLFormElement) => node.reset());
  await expect(form.locator(".crmStepper > button").first()).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(form.locator('input[name="title"]')).toHaveValue("");
  for (const path of ["orders", "purchasing", "warehouse"]) {
    await page.goto(`/crm/${path}?order=${state.order.id}`);
    form = page.locator(".operationsActionForm");
    await form
      .getByRole("combobox", { name: /^Thao tác/ })
      .selectOption(
        path === "orders"
          ? "issueQuote"
          : path === "purchasing"
            ? "recordPurchase"
            : "pack",
      );
    await completeStages(page, form, path, state.commands);
  }
  await page.goto("/crm/returns");
  await page.getByText("Xử lý hàng trả", { exact: true }).click();
  form = page.locator("form.crmStepForm");
  await completeStages(page, form, "returns", state.commands);
  await page.goto("/crm/refunds");
  await page
    .getByRole("button", { name: /Tạo yêu cầu/ })
    .first()
    .click();
  form = page.locator("form.crmStepForm").first();
  await completeStages(page, form, "refund", state.commands);
  await page.goto("/crm/membership");
  await page.getByRole("button", { name: /Tạo gói/ }).click();
  await completeStages(
    page,
    page.locator("form.crmStepForm").first(),
    "plan",
    state.commands,
  );
  await page.goto("/crm/customers/synthetic-customer098");
  await page.getByText("Cập nhật chăm sóc", { exact: true }).click();
  await completeStages(
    page,
    page.locator("form.crmStepForm"),
    "customer",
    state.commands,
  );
  await page.goto("/crm/settings");
  form = page.locator("form.crmStepForm");
  await completeStages(page, form, "policy", state.commands);
  await form
    .getByRole("button", { name: "Lưu chính sách", exact: true })
    .click();
  await expect.poll(() => state.commands.length).toBe(1);
  expect(state.commands[0]).toMatchObject({
    action: "savePricingPolicy",
    expectedVersion: 1,
  });
  await expect(
    form.getByRole("button", { name: "← Quay lại", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
    .click();
  await expect.poll(() => state.commands.length).toBe(2);
  expect(state.commands[1]).toEqual(state.commands[0]);
  expect(state.errors).toEqual([]);
});

test("CRM098 banner, rate editor, staff and shipping stages", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/crm/campaigns");
  await page.getByRole("tab", { name: /Banner/ }).click();
  await page.getByRole("button", { name: "Thêm banner", exact: true }).click();
  await completeStages(
    page,
    page.locator(".websiteBanners form.crmStepForm"),
    "banner",
    state.commands,
  );
  await page.goto("/crm/shipping-rates");
  await completeStages(
    page,
    page.locator("form.crmStepForm"),
    "rates",
    state.commands,
  );
  await page.goto("/crm/staff");
  await page
    .getByRole("textbox", { name: /Mã tài khoản/ })
    .fill("synthetic-staff098");
  await page.getByRole("button", { name: /Kiểm tra quyền hiện tại/ }).click();
  await completeStages(
    page,
    page.locator("form.crmStepForm"),
    "staff",
    state.commands,
  );
  await page.goto("/crm/shipping");
  await page.getByRole("button", { name: "Tạo kiện", exact: true }).click();
  const form = page.locator('form[data-intent="pack"]');
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Chọn ít nhất");
  await form.locator('.shippingSelectionList input[type="checkbox"]').check();
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await form.locator('input[type="number"]:visible').fill("1");
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await fillVisible(form);
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(
    form.getByRole("button", { name: "Tạo kiện nội bộ", exact: true }),
  ).toBeVisible();
  await expect(form.locator(".crmStepReview")).toContainText("Kho");
  await page.screenshot({
    path: "/private/tmp/crm098/shipping-review.png",
    fullPage: true,
  });
  expect(state.commands).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("CRM098 changes, finance, gift, refund decision and batch allocation", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(`/crm/orders?order=${state.order.id}`);
  await page
    .getByText("Đề xuất thay đổi để khách duyệt", { exact: true })
    .click();
  let form = page
    .locator("form.crmStepForm")
    .filter({ has: page.locator('select[name="kind"]') });
  await completeStages(page, form, "change", state.commands);
  await page.goto("/crm/finance");
  await page
    .getByText("Ghi nhận tiền vào bị ngân hàng đảo", { exact: true })
    .click();
  await completeStages(
    page,
    page.locator("form.crmStepForm"),
    "financial-review",
    state.commands,
  );
  await page.goto("/crm/refunds");
  await page.getByText("Xử lý yêu cầu", { exact: true }).click();
  form = page
    .locator("form.crmStepForm")
    .filter({ has: page.locator('select[name="action"]') });
  await completeStages(page, form, "refund-decision", state.commands);
  await form.locator(".crmStepper > button").first().click();
  await form.locator('select[name="action"]').selectOption("cancel");
  await expect(form.locator(".crmStepper > button").first()).toHaveAttribute(
    "aria-current",
    "step",
  );
  await completeStages(page, form, "refund-cancel", state.commands);
  await page.goto("/crm/membership");
  await page.getByRole("tab", { name: /Cấp tặng/ }).click();
  await completeStages(
    page,
    page.locator("form.crmStepForm:visible"),
    "gift",
    state.commands,
  );
  await page.goto("/crm/shipping");
  await page.getByRole("tab", { name: "Lô gom & cước", exact: true }).click();
  await page.getByRole("button", { name: "Tạo lô gom", exact: true }).click();
  form = page.locator('form[data-intent="seal"]');
  await form.locator('input[name="parcel"]').check();
  await expect(
    form.getByText("Đã chọn 1/20 kiện · 1/10 đơn", { exact: true }),
  ).toBeVisible();
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await form.locator('input[type="number"]:visible').fill("249");
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Tổng khối lượng");
  await form.locator('input[type="number"]:visible').fill("250");
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await fillVisible(form);
  await form.getByRole("button", { name: "Tiếp tục →", exact: true }).click();
  await expect(form.locator(".crmStepReview")).toContainText("250 g");
  await expect(
    form.getByText(/Chốt lô chỉ phân bổ cước, chưa ghi nhận thu tiền/),
  ).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/crm098/batch-review.png",
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/private/tmp/crm098/batch-${width}.png`,
      fullPage: true,
    });
  }
  expect(state.commands).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("CRM098 content editor stages and mobile rail", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/crm/content");
  await page.getByRole("button", { name: /Thêm sản phẩm/ }).click();
  await completeStages(
    page,
    page.locator("form.crmStepForm"),
    "content",
    state.commands,
  );
  expect(state.errors).toEqual([]);
  expect(state.commands).toEqual([]);
});
