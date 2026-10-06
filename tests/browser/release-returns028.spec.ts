import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db, sourceOrder } from "./fixtures";
import { artifactDirectory } from "./artifact-path";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function findReturn(page: Page, id: string) {
  const row = page.locator("article.crmItem").filter({ has: page.getByText(id, { exact: true }) });
  await expect(page.locator("article.crmItem").first()).toBeVisible();
  for (let count = 0; count < 20 && !(await row.count()); count++) {
    const next = page.getByRole("button", { name: "Trang tiếp theo", exact: true });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText("Đang tải hàng trả…", { exact: true })).toHaveCount(0);
  }
  await expect(row).toBeVisible();
  return row;
}
for (const width of [390, 768, 1440])
  test(`RETURNS028 real receive inspect close retains financial hold at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const orderId = await sourceOrder();
    await db.doc(`orders/${orderId}`).update({ hold: true });
    const orderBefore = (await db.doc(`orders/${orderId}`).get()).data();
    const id = `000-return028-${randomUUID()}`;
    await db.doc(`orderReturns/${id}`).set({
      id,
      orderId,
      version: 1,
      state: "authorized",
      createdAt: Date.now(),
      lines: [
        {
          line: 0,
          name: `Synthetic returns028 ${id}`,
          authorized: 1,
          received: 0,
          accepted: 0,
          damaged: 0,
        },
      ],
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
    await page.goto("/crm/returns");
    const row = await findReturn(page, id);
    await expect(
      row.getByRole("table", { name: "Số lượng hàng trả", exact: true }),
    ).toBeHidden();
    const open = async () => {
      await row
        .locator("summary")
        .filter({ hasText: "Xử lý hàng trả" })
        .click();
    };
    await open();
    await expect(
      row.getByRole("combobox", { name: "Kết quả kiểm tra", exact: true }),
    ).toHaveCount(0);
    await row
      .getByRole("textbox", { name: "Bằng chứng nội bộ", exact: true })
      .fill("Synthetic receiving evidence028");
    await row
      .getByRole("button", { name: "Ghi nhận hàng đã nhận", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await db.doc(`orderReturns/${id}`).get()).data()?.lines[0].received,
      )
      .toBe(1);
    await expect(row).toContainText("Đang nhận trả");
    await open();
    await row
      .getByRole("combobox", { name: "Thao tác", exact: true })
      .selectOption("inspect");
    await expect(
      row.getByRole("combobox", { name: "Kết quả kiểm tra", exact: true }),
    ).toBeVisible();
    await row
      .getByRole("textbox", { name: "Bằng chứng nội bộ", exact: true })
      .fill("Synthetic inspection evidence028");
    await row
      .getByRole("button", { name: "Lưu kết quả kiểm tra", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await db.doc(`orderReturns/${id}`).get()).data()?.lines[0].accepted,
      )
      .toBe(1);
    await expect(row).toContainText("Đang kiểm tra");
    await open();
    await row
      .getByRole("combobox", { name: "Thao tác", exact: true })
      .selectOption("close");
    await expect(
      row.getByRole("spinbutton", { name: "Số lượng", exact: true }),
    ).toHaveCount(0);
    await row
      .getByRole("textbox", { name: "Bằng chứng nội bộ", exact: true })
      .fill("Synthetic final inspection evidence028");
    await row
      .getByRole("button", { name: "Hoàn tất kiểm tra", exact: true })
      .click();
    await expect(row).toContainText("Đã hoàn tất kiểm tra");
    await expect(row.locator("form")).toHaveCount(0);
    expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(
      orderBefore,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/returns028-${width}.png`,
    });
  });

test("RETURNS028 committed lost response retries exact receipt without receiving twice", async ({
  page,
}) => {
  const orderId = await sourceOrder();
  await db.doc(`orders/${orderId}`).update({ hold: true });
  const before = (await db.doc(`orders/${orderId}`).get()).data();
  const id = `000-returnretry028-${randomUUID()}`;
  await db
    .doc(`orderReturns/${id}`)
    .set({
      id,
      orderId,
      version: 1,
      state: "authorized",
      lines: [
        {
          line: 0,
          name: "Synthetic retry returns028",
          authorized: 2,
          received: 0,
          accepted: 0,
          damaged: 0,
        },
      ],
    });
  const payloads: unknown[] = [];
  let lost = false;
  await page.route("**/returnCommand", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    payloads.push(route.request().postDataJSON()?.data);
    if (lost) return route.continue();
    lost = true;
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.abort("failed");
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
  await page.goto("/crm/returns");
  const row = await findReturn(page, id);
  await row.locator("summary").filter({ hasText: "Xử lý hàng trả" }).click();
  await row
    .getByRole("textbox", { name: "Bằng chứng nội bộ", exact: true })
    .fill("Synthetic lost response evidence028");
  await row
    .getByRole("button", { name: "Ghi nhận hàng đã nhận", exact: true })
    .click();
  await expect(
    row.getByRole("button", { name: "Thử lại thao tác đã gửi", exact: true }),
  ).toBeVisible();
  await expect(
    row.getByRole("combobox", { name: "Thao tác", exact: true }),
  ).toBeDisabled();
  expect(
    (await db.doc(`orderReturns/${id}`).get()).data()?.lines[0].received,
  ).toBe(1);
  await row
    .getByRole("button", { name: "Thử lại thao tác đã gửi", exact: true })
    .click();
  await expect(row).toContainText("Đang nhận trả");
  expect(payloads).toHaveLength(2);
  expect(payloads[1]).toEqual(payloads[0]);
  expect(
    (await db.doc(`orderReturns/${id}`).get()).data()?.lines[0].received,
  ).toBe(1);
  expect((await db.collection(`orderReturns/${id}/evidence`).get()).size).toBe(
    1,
  );
  expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(before);
});
