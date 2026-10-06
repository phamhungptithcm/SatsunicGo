import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db } from "./fixtures";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function exceptionForm(page: Page, width: number) {
  const id = `000-finance028-${randomUUID()}`;
  await db.doc(`paymentExceptions/${id}`).set({
    state: "open",
    amount: 12345,
    reason: "Synthetic unmatched transaction028",
    inboundVerified: false,
    createdAt: Date.now(),
  });
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
  await page.goto("/crm/finance");
  const scopes = page.getByRole("group", {
    name: "Nhóm đối soát",
    exact: true,
  });
  await scopes.getByRole("button", { name: "Ngoại lệ", exact: true }).click();
  const cards = page.locator("article.crmItem:visible");
  const card = cards.filter({ hasText: id });
  await expect(cards.first()).toBeVisible();
  for (let attempt = 0; attempt < 20 && !(await card.count()); attempt++) {
    const previous = await cards.first().textContent();
    const next = page.getByRole("button", {
      name: "Trang ngoại lệ tiếp theo",
      exact: true,
    });
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(() => cards.first().textContent()).not.toBe(previous);
  }
  await expect(card).toBeVisible();
  await card
    .locator("summary")
    .filter({ hasText: "Đối soát ngoại lệ" })
    .click();
  await expect(card.getByLabel("Mã đơn", { exact: true })).toHaveCount(0);
  await expect(
    card.getByRole("option", {
      name: "Phân bổ tiền đã đối soát vào đơn",
      exact: true,
    }),
  ).toHaveCount(0);
  await card
    .getByLabel("Lý do", { exact: true })
    .fill("Synthetic checked exception028");
  await card
    .getByLabel("Bằng chứng đã đối soát", { exact: true })
    .fill("Synthetic immutable local evidence028");
  return { id, card, scopes };
}
for (const width of [390, 768, 1440])
  test(`FINANCE028 closing an unverified exception requires no order or money allocation at ${width}`, async ({
    page,
  }) => {
    const { id, card } = await exceptionForm(page, width);
    const commands: Record<string, unknown>[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        new URL(request.url()).pathname.endsWith("/financeReview")
      )
        commands.push(request.postDataJSON().data);
    });
    await card
      .getByRole("button", { name: "Đóng ngoại lệ đã kiểm tra", exact: true })
      .click();
    await expect(card.getByRole("status")).toContainText(
      "Đã lưu kết quả đối soát.",
    );
    const row = (await db.doc(`paymentExceptions/${id}`).get()).data()!;
    expect(row.state).toBe("closed");
    expect(row.amount).toBe(12345);
    expect(commands).toHaveLength(1);
    expect(commands[0]).not.toHaveProperty("orderId");
    expect(commands[0]).not.toHaveProperty("amount");
    expect(
      await page
        .locator("main")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
  });
test("FINANCE028 committed lost response freezes scope and retries exact exception decision", async ({
  page,
}) => {
  const { id, card, scopes } = await exceptionForm(page, 390);
  const commands: Record<string, unknown>[] = [];
  await page.route("**/financeReview", async (route) => {
    const data = route.request().postDataJSON().data as Record<string, unknown>;
    commands.push(data);
    if (commands.length === 1) {
      expect((await (await route.fetch()).json()).result).toBeTruthy();
      return route.abort("failed");
    }
    return route.continue();
  });
  await card
    .getByRole("button", { name: "Đóng ngoại lệ đã kiểm tra", exact: true })
    .click();
  const retry = card.getByRole("button", {
    name: "Thử lại thao tác đang chờ",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(card.getByLabel("Lý do", { exact: true })).toBeDisabled();
  for (const button of await scopes.getByRole("button").all())
    await expect(button).toBeDisabled();
  await retry.click();
  await expect(card.getByRole("status")).toContainText(
    "Đã lưu kết quả đối soát.",
  );
  expect(commands).toHaveLength(2);
  expect(commands[1]).toEqual(commands[0]);
  expect((await db.doc(`paymentExceptions/${id}`).get()).get("state")).toBe(
    "closed",
  );
  expect((await db.doc(`paymentExceptions/${id}`).get()).get("amount")).toBe(
    12345,
  );
});
