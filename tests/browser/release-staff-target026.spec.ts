import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db } from "./fixtures";
import { artifactDirectory } from "./artifact-path";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function open(page: Page) {
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
  await page.goto("/crm/staff");
  await page.getByText("Nhân viên và phân quyền", { exact: true }).click();
  return page.locator("details.panel").filter({
    has: page.locator("summary", { hasText: /^Nhân viên và phân quyền$/ }),
  });
}
const valid = {
  version: 1,
  active: true,
  locked: false,
  roles: ["SUPPORT"],
  orderIds: [],
};
test("STAFF026-TARGET delayed actual A read cannot restore form after editing B", async ({
  page,
}) => {
  const a = `staff026-a-${randomUUID()}`,
    b = `staff026-b-${randomUUID()}`,
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await db.doc(`staffAccess/${a}`).set(valid);
  await db
    .doc(`staffAccess/${b}`)
    .set({ ...valid, roles: ["BUYER"], orderIds: ["assigned-B"] });
  let release!: () => void, seen!: () => void;
  const held = new Promise<void>((r) => {
      release = r;
    }),
    received = new Promise<void>((r) => {
      seen = r;
    });
  await page.route("**/readStaffAccess", async (route) => {
    if (
      route.request().method() !== "POST" ||
      route.request().postDataJSON()?.data?.id !== a
    )
      return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    const result = await response.json();
    expect(result.error).toBeUndefined();
    seen();
    await held;
    await route.fulfill({ response });
  });
  try {
    const panel = await open(page),
      uid = panel.getByLabel("Định danh nhân viên", { exact: true });
    await uid.fill(a);
    await panel
      .getByRole("button", { name: "Kiểm tra quyền hiện tại", exact: true })
      .click();
    await received;
    await uid.fill(b);
    const delivery = page.waitForResponse(
      (response) =>
        response.url().endsWith("/readStaffAccess") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.data?.id === a,
    );
    release();
    await (await delivery).finished();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(
      panel.getByRole("button", {
        name: "Kiểm tra quyền hiện tại",
        exact: true,
      }),
    ).toBeEnabled();
    await expect(uid).toHaveValue(b);
    await expect(
      panel.getByRole("button", { name: "Lưu quyền nhân viên", exact: true }),
    ).toHaveCount(0);
    await panel
      .getByRole("button", { name: "Kiểm tra quyền hiện tại", exact: true })
      .click();
    await expect(
      panel.getByRole("button", { name: "Lưu quyền nhân viên", exact: true }),
    ).toBeVisible();
    await expect(panel.getByLabel("Mua hàng", { exact: true })).toBeChecked();
    await expect(panel.getByLabel("Hỗ trợ", { exact: true })).not.toBeChecked();
    await expect(panel.locator('textarea[name="orders"]')).toHaveValue(
      "assigned-B",
    );
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `${artifactDirectory}/staff-target-current-B.png`,
    });
  } finally {
    release();
  }
});
for (const [label, delta] of [
  ["roles-null", { roles: null }],
  ["roles-missing", { roles: undefined }],
  ["roles-scalar", { roles: "SUPPORT" }],
  ["roles-mixed", { roles: ["SUPPORT", 1] }],
  ["orders-scalar", { orderIds: "assigned-A" }],
  ["orders-mixed", { orderIds: ["assigned-A", 1] }],
  ["active-string", { active: "true" }],
  ["locked-string", { locked: "false" }],
  ["version-negative", { version: -1 }],
  ["version-null", { version: null }],
  ["version-exhausted", { version: Number.MAX_SAFE_INTEGER }],
] as const)
  test(`STAFF026-TARGET malformed ${label} cannot render editable grant`, async ({
    page,
  }) => {
    const id = `staff026-${randomUUID()}`,
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const target: Record<string, unknown> = { ...valid, ...delta };
    for (const key of Object.keys(target))
      if (target[key] === undefined) delete target[key];
    await db.doc(`staffAccess/${id}`).set(target);
    const panel = await open(page);
    await panel.getByLabel("Định danh nhân viên", { exact: true }).fill(id);
    await panel
      .getByRole("button", { name: "Kiểm tra quyền hiện tại", exact: true })
      .click();
    await expect(panel.getByRole("status")).toContainText(
      "Dữ liệu quyền chưa hợp lệ để chỉnh sửa.",
    );
    await expect(
      panel.getByRole("button", { name: "Lưu quyền nhân viên", exact: true }),
    ).toHaveCount(0);
    await expect(
      panel.getByRole("button", {
        name: "Kiểm tra quyền hiện tại",
        exact: true,
      }),
    ).toBeEnabled();
    expect(errors).toEqual([]);
    if (label === "roles-null")
      await page.screenshot({
        path: `${artifactDirectory}/staff-target-invalid.png`,
      });
  });
for (const [label, target] of [
  ["valid", valid],
  ["legacy", { roles: ["SUPPORT"], orderIds: [] }],
  ["absent", null],
] as const)
  test(`STAFF026-TARGET ${label} preserves explicit grant review without saving`, async ({
    page,
  }) => {
    const id = `staff026-${randomUUID()}`,
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    if (target) await db.doc(`staffAccess/${id}`).set(target);
    let saves = 0;
    await page.route("**/workspaceCommand", (route) => {
      if (route.request().postDataJSON()?.data?.action === "saveStaffAccess")
        saves++;
      return route.continue();
    });
    const panel = await open(page);
    await panel.getByLabel("Định danh nhân viên", { exact: true }).fill(id);
    const read = page.waitForResponse(
      (response) =>
        response.url().endsWith("/readStaffAccess") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.data?.id === id,
    );
    await panel
      .getByRole("button", { name: "Kiểm tra quyền hiện tại", exact: true })
      .click();
    const projection = (await (await read).json()).result?.access;
    if (label === "legacy")
      for (const key of ["version", "active", "locked"])
        expect(projection).not.toHaveProperty(key);

    await expect(
      panel.getByRole("button", { name: "Lưu quyền nhân viên", exact: true }),
    ).toBeVisible();
    if (target)
      await expect(panel.getByLabel("Hỗ trợ", { exact: true })).toBeChecked();
    else
      await expect(panel.locator('input[name="role"]:checked')).toHaveCount(0);
    if (label !== "valid") {
      await expect(
        panel.getByLabel("Được phép làm việc", { exact: true }),
      ).not.toBeChecked();
      await expect(
        panel.getByLabel("Khóa quyền nhân viên", { exact: true }),
      ).not.toBeChecked();
    }
    await expect(panel.locator('textarea[name="orders"]')).toHaveValue("");
    expect(saves).toBe(0);
    expect(errors).toEqual([]);
  });

test("STAFF026-TARGET legacy SDK read and explicit save omit absent version", async ({
  page,
}) => {
  const id = `staff026-${randomUUID()}`,
    errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await db.doc(`staffAccess/${id}`).set({ roles: ["SUPPORT"], orderIds: [] });
  let sent: Record<string, unknown> | undefined;
  page.on("request", (request) => {
    if (
      !request.url().endsWith("/workspaceCommand") ||
      request.method() !== "POST"
    )
      return;
    const data = request.postDataJSON()?.data;
    if (data?.action === "saveStaffAccess") sent = data;
  });
  const panel = await open(page);
  await panel.getByLabel("Định danh nhân viên", { exact: true }).fill(id);
  await panel
    .getByRole("button", { name: "Kiểm tra quyền hiện tại", exact: true })
    .click();
  await expect(
    panel.getByRole("button", { name: "Lưu quyền nhân viên", exact: true }),
  ).toBeVisible();
  await panel.getByLabel("Được phép làm việc", { exact: true }).check();
  await panel
    .getByRole("button", { name: "Lưu quyền nhân viên", exact: true })
    .click();
  await expect(panel.getByRole("status")).toContainText("Đã lưu quyền.");
  expect(sent?.id).toBe(id);
  expect(sent).not.toHaveProperty("expectedVersion");
  const saved = (await db.doc(`staffAccess/${id}`).get()).data();
  expect(saved?.version).toBe(1);
  expect(saved?.roles).toEqual(["SUPPORT"]);
  expect(saved?.active).toBe(true);
  expect(saved?.locked).toBe(false);
  expect(errors).toEqual([]);
});

for (const width of [390, 768, 1440])
  test(`STAFF026-TARGET verified identifier remains readable and keyboard reachable at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    const id = `staff026-layout-${randomUUID()}-${"x".repeat(20)}`;
    await db.doc(`staffAccess/${id}`).set(valid);
    const panel = await open(page);
    await panel.getByLabel("Định danh nhân viên", { exact: true }).fill(id);
    const check = panel.getByRole("button", {
      name: "Kiểm tra quyền hiện tại",
      exact: true,
    });
    await check.click();
    await expect(
      panel.getByRole("button", { name: "Lưu quyền nhân viên", exact: true }),
    ).toBeVisible();
    await expect(
      panel.getByText("Đang chỉnh quyền cho tài khoản:", { exact: false }),
    ).toContainText(id);
    await check.focus();
    await page.keyboard.press("Tab");
    await expect(
      panel.getByLabel("Chủ doanh nghiệp", { exact: true }),
    ).toBeFocused();
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/staff-target-layout-${width}.png`,
    });
  });
