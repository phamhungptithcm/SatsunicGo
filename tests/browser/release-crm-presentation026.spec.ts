import { test, expect } from "@playwright/test";
import { seedIdentities, closeFixtures, db } from "./fixtures";
import { randomUUID } from "node:crypto";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

test("CRM content closed optional field validates visibly before a real draft save", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
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
  await page.goto("/crm/content");
  await page
    .getByRole("combobox", { name: "Loại nội dung", exact: true })
    .selectOption("posts");
  const slug = `crm-ux-${randomUUID()}`;
  await page
    .getByRole("textbox", { name: "Tiêu đề", exact: true })
    .fill("Bản nháp kiểm tra thao tác CRM");
  await page.getByRole("textbox", { name: "Slug", exact: true }).fill(slug);
  await page
    .getByRole("textbox", { name: "Nội dung", exact: true })
    .fill("Nội dung thử nghiệm local, không xuất bản công khai.");
  const disclosure = page
    .locator("summary")
    .filter({ hasText: "Phân loại và thông tin tìm kiếm" });
  await disclosure.click();
  const reference = page.getByRole("textbox", {
    name: "Link tham khảo · không bắt buộc",
    exact: true,
  });
  await reference.fill("not-a-url");
  await disclosure.click();
  let writes = 0;
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      r.url().endsWith("/workspaceCommand") &&
      r.postDataJSON()?.data?.action === "saveContent"
    )
      writes++;
  });
  await page.getByRole("button", { name: "Lưu nội dung", exact: true }).click();
  await expect(reference).toBeVisible();
  await expect(reference).toBeFocused();
  expect(writes).toBe(0);
  expect(
    (await db.collection("posts").where("slug", "==", slug).get()).empty,
  ).toBe(true);
  await reference.fill("https://example.invalid/reference");
  await page.getByRole("button", { name: "Lưu nội dung", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await db.collection("posts").where("slug", "==", slug).get()).size,
    )
    .toBe(1);
  const record = (
    await db.collection("posts").where("slug", "==", slug).get()
  ).docs[0].data();
  expect(record.status).toBe("draft");
  expect(writes).toBe(1);
});

// Mirrors the observed workspacePages route inventory; no financial commands.
for (const width of [390, 768])
  test(`CRM membership bounded list keeps editor reachable and selection read-only at ${width}`, async ({
    page,
  }) => {
    const batch = db.batch();
    const group = randomUUID();
    for (let index = 0; index < 31; index++)
      batch.set(db.doc(`membershipPlans/crm-ux-${group}-${index}`), {
        name: "BUSINESS",
        price: 123000,
        periodDays: 31,
        serviceDiscountBps: 125,
        discountCap: 12345,
        status: "draft",
        version: 1,
        createdAt: Date.now(),
      });
    await batch.commit();
    await page.setViewportSize({ width, height: 1000 });
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
    let mutations = 0;
    page.on("request", (request) => {
      if (
        /\/(workspaceCommand|membershipCommand)$/.test(
          new URL(request.url()).pathname,
        )
      )
        mutations++;
    });
    await page.goto("/crm/membership");
    const region = page.getByRole("region", {
      name: "Danh sách gói thành viên",
      exact: true,
    });
    await expect(region.locator("article")).toHaveCount(30);
    const editor = page.locator(".workspaceContent > section > form").first();
    const name = editor.getByRole("combobox", { name: "Gói", exact: true });
    await expect(name).toBeInViewport();
    await region.focus();
    await expect(region).toBeFocused();
    const row = region.locator("article").first();
    const id = (await row.locator("code").textContent())!;
    const ref = db.doc(`membershipPlans/${id}`);
    const before = (await ref.get()).data()!;
    await row
      .getByRole("button", { name: "Chỉnh sửa gói", exact: true })
      .click();
    await expect(name).toHaveValue(before.name);
    for (const [field, value] of [
      ["price", before.price],
      ["days", before.periodDays],
      ["bps", before.serviceDiscountBps],
      ["cap", before.discountCap],
    ] as const)
      await expect(editor.locator(`[name="${field}"]`)).toHaveValue(
        String(value),
      );
    await editor.getByText("Thông tin bản đã lưu", { exact: true }).click();
    await expect(editor.getByText(id, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Gói mới", exact: true }).click();
    await expect(name).toHaveValue("FREE");
    await expect(editor.locator('[name="price"]')).toHaveValue("");
    await page.getByText("Nhắc gói sắp hết hạn", { exact: true }).click();
    await expect(
      page.getByRole("checkbox", {
        name: "Bật nhắc trước khi membership hết hạn",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Lưu cấu hình nhắc hết hạn",
        exact: true,
      }),
    ).toBeVisible();
    expect((await ref.get()).data()).toEqual(before);
    expect(mutations).toBe(0);
  });

const screens = [
  ["overview", "Tổng quan"],
  ["orders", "Yêu cầu & báo giá"],
  ["purchasing", "Mua hàng"],
  ["warehouse", "Nhận kho & đóng gói"],
  ["returns", "Nhận & kiểm tra hàng trả"],
  ["shipping", "Kiện & vận chuyển"],
  ["changes", "Thay đổi chờ áp dụng"],
  ["refunds", "Yêu cầu hoàn tiền"],
  ["finance", "Thanh toán & đối soát"],
  ["documents", "Chứng từ"],
  ["customers", "Khách hàng"],
  ["follow-ups", "Lịch chăm sóc"],
  ["support", "Hội thoại hỗ trợ"],
  ["content", "Sản phẩm & bài viết"],
  ["campaigns", "Chiến dịch"],
  ["membership", "Gói thành viên"],
  ["staff", "Nhân viên & quyền"],
  ["activity", "Nhật ký & thông báo"],
  ["settings", "Cấu hình"],
] as const;

for (const width of [390, 768, 1440])
  for (const [path, label] of screens) {
    test(`CRM presentation ${path} at ${width}: route, pending read, keyboard and contained layout`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
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
      await page.goto(`/crm/${path}`);
      await expect(page.locator(".workspaceContext")).toContainText(label);
      const content = page.locator(".workspaceContent");
      await expect(content).toBeVisible();
      await expect(
        content
          .locator(
            ":scope > section, :scope > .workbench, :scope > details.panel",
          )
          .first(),
      ).toBeVisible();
      // Open the primary admin editor with its real native summary, where present.
      const disclosure = content.locator(":scope > details.panel");
      if (await disclosure.count()) {
        if (
          !(await disclosure
            .first()
            .evaluate((el) => (el as HTMLDetailsElement).open))
        )
          await disclosure.first().locator(":scope > summary").click();
      }
      await expect(
        content.getByRole("status").filter({ hasText: /^Đang tải/ }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      const button = content.getByRole("button").first();
      if (await button.count()) {
        await expect(button).toBeEnabled();
        await button.focus();
        await expect(button).toBeFocused();
      }
      if (path === "content" && width <= 768) {
        await expect(
          content.getByRole("textbox", { name: "Tiêu đề", exact: true }),
        ).toBeInViewport();
        await expect(
          content.getByRole("region", {
            name: "Danh sách nội dung",
            exact: true,
          }),
        ).toBeVisible();
      }
      // Preserve actual focus view; default viewport also shows the page heading.
      await expect(page.locator('.siteToast[aria-busy="true"]')).toHaveCount(0);
      await page.screenshot({
        path: `${artifactDirectory}/crm-screen-${path}-${width}-focus.png`,
        fullPage: false,
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      // Current local rendered evidence only: no assertion of provider/AT acceptance.
      await page.screenshot({
        path: `${artifactDirectory}/crm-screen-${path}-${width}.png`,
        fullPage: false,
      });
      await page.screenshot({
        path: `${artifactDirectory}/crm-screen-${path}-${width}-full.png`,
        fullPage: true,
      });
    });
  }
