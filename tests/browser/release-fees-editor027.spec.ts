import { test, expect } from "@playwright/test";
import { seedIdentities, closeFixtures, db } from "./fixtures";
import { vietCargoReferenceRates } from "../../packages/domain/shipping-rates";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
test("FEES027 exact source draft editing publishing removal and restoration stay separate", async ({
  page,
}) => {
  // Synthetic demo-only config: the fixture guard prohibits cloud projects/ports.
  await db
    .doc("settings/shippingRates")
    .set({ version: 0, config: null, publishedVersion: null });
  await db.doc("shippingRatePublic/current").set({ version: 0, config: null });
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
  await page.goto("/crm/shipping-rates");
  const editor = page.locator(".rateEditor");
  // Loading a missing saved draft initializes an editable source copy locally.
  await expect(editor.getByRole("button", { name: "Thêm dòng giá", exact: true })).toBeVisible();
  await editor
    .getByRole("button", { name: "Thêm dòng giá", exact: true })
    .click();
  await editor
    .getByRole("textbox", { name: "Tên mốc / nhóm hàng", exact: true })
    .fill("Synthetic removable row027");
  await editor
    .getByRole("button", { name: "Xóa dòng khỏi bản nháp", exact: true })
    .click();
  await expect(
    editor
      .getByRole("combobox", { name: "Chọn dòng", exact: true })
      .locator("option"),
  ).toHaveCount(vietCargoReferenceRates.rows.length);
  await editor
    .getByRole("button", { name: "Lưu bản nháp", exact: true })
    .click();
  await expect(
    page.getByText("Đã lưu bản nháp. Bảng giá công khai chưa thay đổi.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    (await db.doc("shippingRatePublic/current").get()).data()?.config,
  ).toBeNull();
  expect((await db.doc("settings/shippingRates").get()).data()?.config).toEqual(
    vietCargoReferenceRates,
  );
  await editor
    .getByRole("button", { name: "Công bố bản đã lưu", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận công bố", exact: true })
    .click();
  await expect(
    page.getByText("Đã công bố bảng giá đã lưu.", { exact: true }),
  ).toBeVisible();
  expect(
    (await db.doc("shippingRatePublic/current").get()).data()?.config,
  ).toEqual(vietCargoReferenceRates);
  await editor
    .getByRole("button", { name: "Xóa và gỡ bảng công khai", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận xóa và gỡ", exact: true })
    .click();
  await expect(
    page.getByText("Đã xóa bản nháp và gỡ bảng giá công khai.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/fees");
  await expect(
    page.getByText("Chưa có bảng giá công khai", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".rateTableScroll tbody tr")).toHaveCount(0);
  // Restore the exact adopted source via the real UI, leaving the demo usable.
  await page.goto("/crm/shipping-rates");
  await expect(editor.getByRole("button", { name: "Lưu bản nháp", exact: true })).toBeVisible();
  await editor
    .getByRole("button", { name: "Lưu bản nháp", exact: true })
    .click();
  await expect(
    page.getByText("Đã lưu bản nháp. Bảng giá công khai chưa thay đổi.", {
      exact: true,
    }),
  ).toBeVisible();
  await editor
    .getByRole("button", { name: "Công bố bản đã lưu", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận công bố", exact: true })
    .click();
  await expect(
    page.getByText("Đã công bố bảng giá đã lưu.", { exact: true }),
  ).toBeVisible();
  await page.goto("/fees");
  await expect(
    page.getByText("1.300.000", { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Chiều vận chuyển", exact: true })
    .selectOption("US_VN");
  await expect(
    page.getByRole("combobox", { name: "Kho", exact: true }),
  ).toHaveValue("texas_cali");
  await page
    .getByRole("combobox", { name: "Kho", exact: true })
    .selectOption("oregon");
  await expect(
    page
      .getByRole("combobox", { name: "Nhóm hàng", exact: true })
      .locator("option"),
  ).not.toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
