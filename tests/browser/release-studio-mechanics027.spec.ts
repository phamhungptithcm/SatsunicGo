import { test, expect, type Page } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { emptyStudioDraft } from "../../packages/domain/blog-studio";
import { seedIdentities, closeFixtures, db, operator } from "./fixtures";
import { invoke } from "./http";

// Approved NEW TEST lease: original mechanics only, real demo callables, no service mocks.
// READY refresh13 + indexed/source contract inspected before creation. Root owns execution.
// Plan: ten bounded cases below; fresh IDs, observed DOM plus persisted readback, scoped cleanup.
// These tests do not certify real IME, live Google, provider media or whole-source visual parity.
const run = `mechanics027-${randomUUID()}`;
const authorId = `${run}-author`;
const categoryId = `${run}-category`;
const categoryName = `Synthetic ${run}`;
const owned = new Set<string>();
test.beforeAll(async () => {
  await seedIdentities();
  owned.add(`blogAuthors/${authorId}`);
  owned.add(`blogCategories/${categoryId}`);
  await db
    .doc(`blogCategories/${categoryId}`)
    .set({ id: categoryId, name: categoryName, revision: 1 });
  await db.doc(`blogAuthors/${authorId}`).set({
    id: authorId,
    name: run,
    bio: "Synthetic mechanics author",
    revision: 1,
  });
});
test.afterAll(async () => {
  try {
    for (const path of owned) await db.recursiveDelete(db.doc(path));
  } finally {
    await closeFixtures();
  }
});
async function login(page: Page) {
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/(studioCommand|studioAdvancedCommand)$/.test(
        new URL(request.url()).pathname,
      )
    ) {
      const operationId = request.postDataJSON()?.data?.operationId;
      if (typeof operationId === "string")
        owned.add(`blogStudioOperations/${operator}_${operationId}`);
    }
  });
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
async function editor(
  page: Page,
  lines = ["Synthetic alpha", "Synthetic beta", "Synthetic gamma"],
) {
  const id = `mechanics027-${randomUUID()}`;
  for (const collection of ["blogDrafts", "blogPublished", "blogSchedules"])
    owned.add(`${collection}/${id}`);
  const payload = {
    ...emptyStudioDraft,
    title: `Synthetic ${id}`,
    slug: id,
    summary: "Synthetic mechanics summary",
    authorId,
    category: "Hướng dẫn",
    sources: [
      { title: "Synthetic source", url: "https://example.invalid/source" },
    ],
    body: {
      type: "doc",
      content: lines.length
        ? lines.map((text) => ({
            type: "paragraph",
            content: [{ type: "text", text }],
          }))
        : [{ type: "paragraph" }],
    },
  };
  const operationId = randomUUID();
  owned.add(`blogStudioOperations/${operator}_${operationId}`);
  await invoke("studioCommand", {
    action: "create",
    id,
    operationId,
    payload,
  });
  await login(page);
  await page.goto(`/crm/studio/${id}`);
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toHaveValue(payload.title);
  await expect(
    page.getByRole("textbox", { name: "Nội dung bài viết", exact: true }),
  ).toBeVisible();
  return { id, payload };
}
const body = (page: Page) =>
  page.getByRole("textbox", { name: "Nội dung bài viết", exact: true });
const format = (page: Page) =>
  page.getByRole("toolbar", { name: "Định dạng nội dung", exact: true });
async function save(page: Page, id: string) {
  const before = (await db.doc(`blogDrafts/${id}`).get()).get(
    "revision",
  ) as number;
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("revision"))
    .toBeGreaterThan(before);
  await expect(
    page.getByRole("status").filter({ hasText: /^Đã lưu\.$/ }),
  ).toBeVisible();
}

test("STUDIO027 formatting and undo redo preserve rendered and saved nodes", async ({
  page,
}) => {
  const { id } = await editor(page, ["Synthetic format"]);
  await body(page).locator("p").first().click();
  await format(page)
    .getByRole("combobox", { name: "Kiểu đoạn văn" })
    .selectOption("2");
  await expect(body(page).locator("h2")).toHaveText("Synthetic format");
  await format(page)
    .getByRole("button", { name: "Hoàn tác", exact: true })
    .click();
  await expect(body(page).locator("p")).toHaveText("Synthetic format");
  await format(page)
    .getByRole("button", { name: "Làm lại", exact: true })
    .click();
  await expect(body(page).locator("h2")).toHaveText("Synthetic format");
  await body(page).press("Home");
  await body(page).press("Shift+End");
  await format(page)
    .getByRole("button", { name: "In đậm", exact: true })
    .click();
  await expect(body(page).locator("h2 strong")).toHaveText("Synthetic format");
  await save(page, id);
  await page.reload();
  await expect(body(page).locator("h2 strong")).toHaveText("Synthetic format");
});
test("STUDIO027 table insertion edits actual rows columns and removes table", async ({
  page,
}) => {
  const { id } = await editor(page, ["Synthetic table"]);
  await body(page).click();
  await format(page)
    .getByRole("button", { name: "Chèn bảng", exact: true })
    .click();
  const table = body(page).locator("table");
  await expect(table.locator("tr")).toHaveCount(3);
  await expect(table.locator("tr").first().locator("th,td")).toHaveCount(3);
  await table.locator("th,td").first().click();
  const controls = page.getByRole("toolbar", {
    name: "Chỉnh bảng",
    exact: true,
  });
  await controls.getByRole("button", { name: "+ Hàng", exact: true }).click();
  await expect(table.locator("tr")).toHaveCount(4);
  await controls.getByRole("button", { name: "+ Cột", exact: true }).click();
  await expect(table.locator("tr").first().locator("th,td")).toHaveCount(4);
  await save(page, id);
  await page.reload();
  await expect(body(page).locator("table tr")).toHaveCount(4);
  await body(page).locator("table th,table td").first().click();
  await page
    .getByRole("toolbar", { name: "Chỉnh bảng" })
    .getByRole("button", { name: "Xóa bảng", exact: true })
    .click();
  await expect(body(page).locator("table")).toHaveCount(0);
});
test("STUDIO027 slash keyboard insertion and escape distinguish prose", async ({
  page,
}) => {
  await editor(page, []);
  await expect(body(page).locator("p")).toHaveText([""]);
  await body(page).locator("p").click();
  // Canonical empty paragraph avoids platform-specific document-end navigation.
  expect(
    await body(page).evaluate((el) => {
      const selection = window.getSelection();
      return (
        !!selection?.isCollapsed &&
        !!selection.anchorNode &&
        el.contains(selection.anchorNode)
      );
    }),
  ).toBe(true);
  await body(page).pressSequentially("/heading");
  const menu = page.getByRole("group", { name: "Chèn nội dung", exact: true });
  await expect(menu).toBeVisible();
  await body(page).press("ArrowDown");
  await body(page).press("Enter");
  await body(page).pressSequentially("Synthetic slash heading");
  await expect(body(page).locator("h3")).toHaveText("Synthetic slash heading");
  await body(page).press("Enter");
  await body(page).pressSequentially("/");
  await expect(menu).toBeVisible();
  await body(page).press("Escape");
  await expect(menu).toHaveCount(0);
  await body(page).pressSequentially(
    " ordinary prose https://example.invalid/x",
  );
  await expect(menu).toHaveCount(0);
});
test("STUDIO027 block move duplicate delete change exact paragraph order", async ({
  page,
}) => {
  await editor(page);
  await body(page).locator("p").nth(1).click();
  await page.getByLabel("Thao tác với khối hiện tại", { exact: true }).click();
  await page
    .getByRole("group", { name: "Thao tác khối" })
    .getByRole("button", { name: "↑ Lên", exact: true })
    .click();
  await expect(body(page).locator("p")).toHaveText([
    "Synthetic beta",
    "Synthetic alpha",
    "Synthetic gamma",
  ]);
  await body(page).locator("p").first().click();
  const toggle = page.getByLabel("Thao tác với khối hiện tại", { exact: true });
  if (
    !(await page
      .getByRole("button", { name: "Nhân đôi", exact: true })
      .isVisible())
  )
    await toggle.click();
  await page.getByRole("button", { name: "Nhân đôi", exact: true }).click();
  await expect(body(page).locator("p")).toHaveText([
    "Synthetic beta",
    "Synthetic beta",
    "Synthetic alpha",
    "Synthetic gamma",
  ]);
  if (
    !(await page
      .getByRole("group", { name: "Thao tác khối" })
      .getByRole("button", { name: "Xóa", exact: true })
      .isVisible())
  )
    await toggle.click();
  await page
    .getByRole("group", { name: "Thao tác khối" })
    .getByRole("button", { name: "Xóa", exact: true })
    .click();
  await expect(body(page).locator("p")).toHaveText([
    "Synthetic beta",
    "Synthetic alpha",
    "Synthetic gamma",
  ]);
});
test("STUDIO027 focus mode isolates controls and dialog Escape restores keyboard access", async ({
  page,
}) => {
  await editor(page);
  const previous = await page.evaluate(() => document.body.style.overflow);
  await format(page)
    .getByRole("button", { name: "Chế độ tập trung", exact: true })
    .click();
  await expect(page.locator(".rich-writing-focus")).toBeVisible();
  expect(
    await page
      .getByRole("textbox", { name: "Tiêu đề", exact: true })
      .evaluate((el) => !!el.closest("[inert]")),
  ).toBe(true);
  await format(page)
    .getByRole("button", { name: "Liên kết", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Chèn liên kết",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".rich-writing-focus")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".rich-writing-focus")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    previous,
  );
  await page.getByRole("textbox", { name: "Tiêu đề", exact: true }).focus();
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toBeFocused();
});
test("STUDIO027 taxonomy keyboard selection and tags persist without duplicates", async ({
  page,
}) => {
  const { id, payload } = await editor(page);
  const category = page.getByRole("combobox", {
    name: "Chuyên mục",
    exact: true,
  });
  await category.fill("Uncommitted synthetic category");
  await category.press("Escape");
  await expect(category).toHaveValue(payload.category);
  await category.fill(categoryName);
  await category.press("ArrowDown");
  await category.press("Enter");
  await expect(category).toHaveValue(categoryName);
  const tags = page.getByPlaceholder("Nhập tag rồi nhấn Enter", {
    exact: true,
  });
  await tags.fill("synthetic-mechanics");
  await tags.press("Enter");
  await tags.fill("synthetic-mechanics");
  await tags.press("Enter");
  await expect(
    page.getByRole("button", {
      name: "Xóa tag synthetic-mechanics",
      exact: true,
    }),
  ).toHaveCount(1);
  await save(page, id);
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Xóa tag synthetic-mechanics",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xóa tag synthetic-mechanics", exact: true })
    .click();
  await save(page, id);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("tags")).toEqual([]);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("category")).toBe(
    categoryName,
  );
});
test("STUDIO027 history prevents dirty restore then creates a new private revision", async ({
  page,
}) => {
  const { id, payload } = await editor(page);
  const title = page.getByRole("textbox", { name: "Tiêu đề", exact: true });
  await title.fill("Synthetic history saved change");
  await save(page, id);
  expect(
    (await db.doc(`blogDrafts/${id}/revisions/1`).get()).get("title"),
  ).toBe(payload.title);
  // Dismiss through the real control before pausing its countdown; never force through an overlay.
  await page.getByRole("button", { name: "Ẩn thông báo", exact: true }).click();
  await expect(page.locator(".blog-toast")).toHaveCount(0);
  // Pause only the autosave timer for this dirty-state assertion; all service calls remain real.
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await title.fill("Synthetic history unsaved change");
  await page
    .getByRole("button", { name: "Lịch sử phiên bản", exact: true })
    .click();
  const history = page.getByRole("dialog", {
    name: "Lịch sử bài viết",
    exact: true,
  });
  await expect(
    history.getByRole("button", { name: "Khôi phục phiên bản 1", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  // Let the real toast mount via requestAnimationFrame before the real manual save.
  await page.clock.resume();
  await save(page, id);
  await page.getByRole("button", { name: "Ẩn thông báo", exact: true }).click();
  await expect(page.locator(".blog-toast")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Lịch sử phiên bản", exact: true })
    .click();
  const beforeRestore = (await db.doc(`blogDrafts/${id}`).get()).get(
    "revision",
  ) as number;
  await history
    .getByRole("button", { name: "Khôi phục phiên bản 1", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toHaveValue(payload.title);
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("revision"))
    .toBe(beforeRestore + 1);
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
});
test("STUDIO027 calendar schedules future instant and cancels viewed revision", async ({
  page,
}) => {
  const { id } = await editor(page);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Xuất bản bài viết",
    exact: true,
  });
  const picker = dialog.getByRole("region", {
    name: "Chọn ngày giờ xuất bản",
    exact: true,
  });
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: "Tháng sau", exact: true }).click();
  await picker
    .locator('[role="gridcell"][data-day]:not([disabled])')
    .first()
    .click();
  await picker.getByLabel("Giờ xuất bản").fill("12:00");
  const day = await picker
    .locator('[role="gridcell"][aria-selected="true"]')
    .getAttribute("data-day");
  const expected = await page.evaluate(
    (d) => new Date(`${d}T12:00`).toISOString(),
    day,
  );
  await dialog.getByRole("button", { name: "Lên lịch", exact: true }).click();
  await expect
    .poll(async () => (await db.doc(`blogSchedules/${id}`).get()).get("dueAt"))
    .toBe(expected);
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
  await page.goto(`/crm/studio/${id}`);
  await page.getByRole("button", { name: "Hủy lịch", exact: true }).click();
  await expect
    .poll(async () => (await db.doc(`blogSchedules/${id}`).get()).exists)
    .toBe(false);
});
test("STUDIO027 settings pending member revoke and real JSON export", async ({
  page,
}) => {
  const { id } = await editor(page);
  const email = `${run}@example.invalid`;
  const inviteId = createHash("sha256")
    .update(email.toLowerCase())
    .digest("hex");
  owned.add(`blogEditorialInvites/${inviteId}`);
  await page.goto("/crm/studio/settings");
  const sections = page.getByRole("navigation", {
    name: "Các mục cài đặt",
    exact: true,
  });
  await sections
    .getByRole("button", { name: "Thành viên", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm thành viên", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Thêm thành viên",
    exact: true,
  });
  await dialog.getByLabel("Email tài khoản").fill(email);
  await dialog.getByLabel("Quyền truy cập").selectOption("author");
  await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
  const row = page.locator(".member").filter({ hasText: email });
  await expect(row).toContainText("Chưa kết nối tài khoản Google");
  // Refresh remounts Settings at Authors: hidden DOM text is not an actionable member control.
  await sections
    .getByRole("button", { name: "Thành viên", exact: true })
    .click();
  await expect(row).toBeVisible();
  await row
    .getByRole("button", { name: `Thu hồi quyền ${email}`, exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Thu hồi quyền biên tập?", exact: true })
    .getByRole("button", { name: "Thu hồi quyền", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  await sections
    .getByRole("button", { name: "Xuất nội dung", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Xuất dữ liệu blog", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("satsunicgo-studio.json");
  const path = await download.path();
  expect(path).toBeTruthy();
  const exported = JSON.parse(await readFile(path!, "utf8"));
  expect(JSON.stringify(exported.collections.blogDrafts)).toContain(id);
  expect(exported.schemaVersion).toBe(1);
  expect(
    exported.collections.blogAuthors.some(
      (a: { id: string }) => a.id === authorId,
    ),
  ).toBe(true);
});
test("STUDIO027 account links and logout remove access to private editor", async ({
  page,
}) => {
  const { id } = await editor(page);
  await page.goto("/crm/studio/account");
  await expect(
    page.getByRole("heading", { name: "Tài khoản", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Mở Studio/ })).toHaveAttribute(
    "href",
    "/crm/studio",
  );
  await expect(page.getByRole("link", { name: /Đọc blog/ })).toHaveAttribute(
    "href",
    "/posts",
  );
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/posts$/);
  await page.goto(`/crm/studio/${id}`);
  await expect(
    page.getByRole("textbox", { name: "Nội dung bài viết", exact: true }),
  ).toHaveCount(0);
});
