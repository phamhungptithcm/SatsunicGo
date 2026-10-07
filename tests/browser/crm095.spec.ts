import { test, expect, type Page } from "@playwright/test";

// Projection fixtures only. Reuse existing demo identity; no seed/reset or business writes.
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

async function fixture(page: Page) {
  const state = {
    mode: "populated",
    delay: 0,
    commands: [] as Record<string, unknown>[],
    reads: [] as Record<string, unknown>[],
  };
  const customer = {
    id: "synthetic-customer095-" + "long-id-".repeat(8),
    displayName:
      "Khách hàng kiểm thử với tên doanh nghiệp dài để kiểm tra xuống dòng",
    businessName: "Doanh nghiệp kiểm thử giao diện — dữ liệu mô phỏng",
    tags: ["Khách doanh nghiệp", "Cần chăm sóc"],
    assigneeId: "synthetic-staff095",
    followUpAt: Date.now() - 86400000,
  };
  const ticket = {
    id: "synthetic-ticket095",
    subject:
      "Kiểm tra thông tin đơn hàng và lịch giao dự kiến — hội thoại mô phỏng",
    message:
      "Nội dung ban đầu của khách hàng.\nDữ liệu mô phỏng để kiểm tra giao diện.",
    version: 1,
    status: "open",
  };
  await page.route(
    /\/(listCustomers|listFollowUps|listCrmStaff|listWork|ticketMessages|workspaceCommand)$/,
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const name = new URL(route.request().url()).pathname.split("/").at(-1);
      const data = route.request().postDataJSON().data;
      if (name === "workspaceCommand") {
        state.commands.push(data);
        if (state.commands.length === 1)
          return route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              error: {
                status: "UNAVAILABLE",
                message: "Synthetic uncertain response",
              },
            }),
          });
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ result: { id: ticket.id, version: 2 } }),
        });
      }
      state.reads.push({ name, ...data });
      if (state.delay)
        await new Promise((resolve) => setTimeout(resolve, state.delay));
      if (state.mode === "error" || state.mode === "denied")
        return route.fulfill({
          status: state.mode === "denied" ? 403 : 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              status:
                state.mode === "denied" ? "PERMISSION_DENIED" : "UNAVAILABLE",
              message: "Synthetic read failure",
            },
          }),
        });
      const result =
        name === "listCrmStaff"
          ? {
              rows: [
                { id: "synthetic-staff095", displayName: "Nhân viên kiểm thử" },
              ],
            }
          : name === "ticketMessages"
            ? {
                messages: [
                  {
                    id: "synthetic-message095",
                    text: "Phản hồi mô phỏng với nội dung dài. ".repeat(15),
                    createdAt: Date.now(),
                    fromCustomer: true,
                  },
                ],
              }
            : {
                rows:
                  state.mode === "empty"
                    ? []
                    : [name === "listWork" ? ticket : customer],
                asOf: 1791340000000,
                next:
                  data.after || data.id || state.mode === "empty"
                    ? null
                    : name === "listWork"
                      ? "synthetic-next095"
                      : { id: customer.id, at: customer.followUpAt },
              };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ result }),
      });
    },
  );
  return state;
}

async function contained(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
}

for (const width of [1440, 720, 390, 320]) {
  test(`CRM095 populated surfaces and keyboard at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const state = await fixture(page);
    await login(page);
    for (const [route, title] of [
      ["customers", "Khách hàng"],
      ["follow-ups", "Lịch chăm sóc"],
      ["support", "Hội thoại hỗ trợ"],
    ]) {
      await page.goto(`/crm/${route}`);
      await expect(page).toHaveURL(new RegExp(`/crm/${route}$`));
      await expect(page).toHaveTitle(/SatsunicGo/i);
      const screen = page.locator(".customerWorkspace095");
      await expect(
        screen.getByRole("heading", { level: 1, name: title, exact: true }),
      ).toBeVisible();
      await expect(
        screen.getByText(/1 (khách hàng|lịch hẹn|hội thoại) trong trang/),
      ).toBeVisible();
      await contained(page);
      if (route !== "support") {
        const openTarget = await screen
          .locator("td:last-child a")
          .boundingBox();
        expect(openTarget?.height).toBeGreaterThanOrEqual(44);
      }
      if (route === "customers") {
        await screen.locator(".crmItemDetails > summary").click();
        await expect(screen.locator(".crmReference code")).toContainText(
          "synthetic-customer095-",
        );
        await contained(page);
        await screen.locator(".crmItemDetails > summary").click();
      }
      if (route === "support") {
        await screen.locator("summary").focus();
        await page.keyboard.press("Enter");
        const reply = screen.getByRole("textbox", {
          name: "Phản hồi",
          exact: true,
        });
        await expect(reply).toBeVisible();
        const resolvedTarget = await screen
          .locator(".customerWorkspace095-resolved")
          .boundingBox();
        expect(resolvedTarget?.height).toBeGreaterThanOrEqual(44);
        await reply.fill("Bản nháp kiểm thử chưa gửi");
        await screen.locator("summary").click();
        await screen.locator("summary").click();
        await expect(reply).toHaveValue("Bản nháp kiểm thử chưa gửi");
        await contained(page);
      }
      await page.screenshot({
        path: `/private/tmp/crm095/${route}-${width}.png`,
        fullPage: true,
      });
    }
    expect(state.commands).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("CRM095 search, explicit filters, pagination and read recovery", async ({
  page,
}) => {
  const state = await fixture(page);
  await login(page);
  await page.goto("/crm/customers");
  const screen = page.locator(".customerWorkspace095");
  await expect(screen.getByText("1 khách hàng trong trang")).toBeVisible();
  await screen
    .getByRole("combobox", { name: "Tìm theo", exact: true })
    .selectOption("id");
  await screen
    .getByRole("textbox", { name: "Mã khách hàng", exact: true })
    .fill("exact-id095");
  await expect(screen.getByText(/Bộ lọc đã đổi/)).toBeVisible();
  await expect(screen.locator("tbody")).toHaveCount(0);
  await screen
    .getByRole("button", { name: "Tìm khách hàng", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(screen.getByText("1 khách hàng trong trang")).toBeVisible();
  expect(
    state.reads.some(
      (r) =>
        r.name === "listCustomers" &&
        r.mode === "id" &&
        r.search === "exact-id095",
    ),
  ).toBe(true);
  await screen.getByRole("button", { name: "Trang tiếp theo" }).click();
  await expect(
    screen.getByRole("button", { name: "Trang tiếp theo" }),
  ).toHaveCount(0);
  await expect
    .poll(() => state.reads.some((r) => r.name === "listCustomers" && r.after))
    .toBe(true);
  state.mode = "error";
  await screen.getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(screen.getByRole("alert")).toContainText(
    "Chưa tải được danh sách",
  );
  await expect(screen.getByText("0 khách hàng trong trang")).toHaveCount(0);
  state.mode = "empty";
  await screen
    .getByRole("button", { name: "Thử tải lại", exact: true })
    .click();
  await expect(
    screen.getByText("Kiểm tra tên hoặc mã khách hàng rồi tìm lại."),
  ).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/crm095/customers-empty.png",
    fullPage: true,
  });
  state.mode = "populated";
  await page.goto("/crm/follow-ups");
  await expect(screen.getByText("1 lịch hẹn trong trang")).toBeVisible();
  await screen
    .getByRole("combobox", { name: "Lịch hẹn", exact: true })
    .selectOption("upcoming");
  await screen
    .getByRole("checkbox", { name: "Việc của tôi", exact: true })
    .check();
  await screen
    .getByRole("button", { name: "Xem danh sách", exact: true })
    .click();
  await expect(screen.getByText("1 lịch hẹn trong trang")).toBeVisible();
  expect(
    state.reads.some(
      (r) =>
        r.name === "listFollowUps" &&
        r.mode === "upcoming" &&
        r.assigneeId === "e2e005-owner",
    ),
  ).toBe(true);
  await screen.getByRole("button", { name: "Trang tiếp theo" }).click();
  await expect(
    screen.getByRole("button", { name: "Trang tiếp theo" }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      state.reads.some(
        (r) =>
          r.name === "listFollowUps" && r.asOf === 1791340000000 && r.after,
      ),
    )
    .toBe(true);
  state.delay = 1200;
  state.mode = "empty";
  await screen.getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(
    screen.getByText("Đang tải danh sách…", { exact: true }),
  ).toBeVisible();
  await expect(screen.getByText("Chưa có lịch hẹn phù hợp")).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/crm095/care-empty.png",
    fullPage: true,
  });
  state.delay = 0;
  state.mode = "denied";
  await screen.getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(screen.getByRole("alert")).toBeVisible();
  await expect(screen.locator("tbody")).toHaveCount(0);
  expect(state.commands).toEqual([]);
});

test("CRM095 support draft, uncertain retry locks and targeted/empty states", async ({
  page,
}) => {
  const state = await fixture(page);
  await login(page);
  await page.goto("/crm/support?ticket=synthetic-ticket095");
  const screen = page.locator(".customerWorkspace095");
  const reply = screen.getByRole("textbox", { name: "Phản hồi", exact: true });
  await expect(reply).toBeVisible();
  await reply.fill("Phản hồi kiểm thử được giữ lại khi chưa rõ kết quả");
  await screen
    .getByRole("checkbox", { name: "Đánh dấu đã giải quyết" })
    .check();
  await screen
    .getByRole("button", { name: "Gửi phản hồi", exact: true })
    .click();
  await expect(
    screen.getByRole("button", { name: "Thử lại phản hồi đang chờ" }),
  ).toBeVisible();
  await expect(
    screen.getByRole("button", { name: "Tải lại hội thoại", exact: true }),
  ).toBeDisabled();
  await expect(reply).toHaveValue(
    "Phản hồi kiểm thử được giữ lại khi chưa rõ kết quả",
  );
  await page.screenshot({
    path: "/private/tmp/crm095/support-uncertain.png",
    fullPage: true,
  });
  await screen
    .getByRole("button", { name: "Thử lại phản hồi đang chờ" })
    .click();
  await expect(
    screen.getByRole("button", { name: "Tải lại hội thoại", exact: true }),
  ).toBeEnabled();
  expect(state.commands).toHaveLength(2);
  expect(state.commands[1]).toEqual(state.commands[0]);
  expect(state.commands[0]).toMatchObject({
    action: "replyTicket",
    expectedVersion: 1,
    payload: { status: "resolved" },
  });
  state.mode = "empty";
  await screen
    .getByRole("button", { name: "Tải lại hội thoại", exact: true })
    .click();
  await expect(
    screen.getByText("Chưa tìm thấy hội thoại được chọn", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/crm095/support-target-empty.png",
    fullPage: true,
  });
  await screen
    .getByRole("link", { name: "← Tất cả hội thoại", exact: true })
    .click();
  await expect(
    screen.getByText("Chưa có hội thoại trong trang hiện tại", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/crm095/support-empty.png",
    fullPage: true,
  });
  state.mode = "error";
  await screen
    .getByRole("button", { name: "Tải lại hội thoại", exact: true })
    .click();
  await expect(screen.getByRole("alert")).toBeVisible();
  await expect(screen.getByText("0 hội thoại trong trang")).toHaveCount(0);
  await page.screenshot({
    path: "/private/tmp/crm095/support-error.png",
    fullPage: true,
  });
  state.mode = "populated";
  await screen
    .getByRole("button", { name: "Thử tải lại", exact: true })
    .click();
  await expect(screen.getByText("1 hội thoại trong trang")).toBeVisible();
  await screen
    .getByRole("button", { name: "Trang tiếp theo", exact: true })
    .click();
  await expect(
    screen.getByRole("button", { name: "Trang tiếp theo", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      state.reads.some(
        (r) => r.name === "listWork" && r.after === "synthetic-next095",
      ),
    )
    .toBe(true);
});
