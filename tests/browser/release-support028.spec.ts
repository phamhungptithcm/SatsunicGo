import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db, customer } from "./fixtures";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function login(page: Page, role = "owner") {
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(role);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
}
async function ticket() {
  const id = `support028-${randomUUID()}`;
  await db.doc(`supportTickets/${id}`).set({
    ownerId: customer,
    subject: `Synthetic ${id}`,
    message: "Synthetic private support request028",
    status: "open",
    version: 1,
    createdAt: Date.now(),
  });
  return id;
}
for (const width of [390, 768, 1440])
  test(`SUPPORT028 staff list defers messages and closing a visited thread preserves draft at ${width}`, async ({
    page,
  }) => {
    const id = await ticket();
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    let reads = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        new URL(request.url()).pathname.endsWith("/ticketMessages")
      )
        reads++;
    });
    await page.goto("/crm/support");
    await expect(page.locator("details.crmTicket").first()).toBeVisible();
    expect(reads).toBe(0);
    await page.goto(`/crm/support?ticket=${id}`);
    const card = page.locator("details.crmTicket");
    const input = card.getByLabel("Phản hồi", { exact: true });
    await expect(input).toBeEnabled();
    await input.fill("Synthetic retained staff draft028");
    const previous = reads;
    await card.locator("summary").click();
    await expect(input).toBeHidden();
    await card.locator("summary").click();
    await expect(input).toHaveValue("Synthetic retained staff draft028");
    expect(reads).toBe(previous);
    expect(
      await page
        .locator("main")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
  });
test("SUPPORT028 committed lost staff reply response retries exactly once against advanced ticket version", async ({
  page,
}) => {
  const id = await ticket();
  await login(page);
  await page.goto(`/crm/support?ticket=${id}`);
  const card = page.locator("details.crmTicket");
  const commands: Record<string, unknown>[] = [];
  await page.route("**/workspaceCommand", async (route) => {
    const data = route.request().postDataJSON().data as Record<string, unknown>;
    if (data.id !== id || data.action !== "replyTicket")
      return route.continue();
    commands.push(data);
    if (commands.length === 1) {
      expect((await (await route.fetch()).json()).result).toBeTruthy();
      return route.abort("failed");
    }
    return route.continue();
  });
  await card
    .getByLabel("Phản hồi", { exact: true })
    .fill("Synthetic immutable staff response028");
  await card.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  const retry = card.getByRole("button", {
    name: "Thử lại phản hồi đang chờ",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(card.getByLabel("Phản hồi", { exact: true })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Tải lại hội thoại", exact: true }),
  ).toBeDisabled();
  expect((await db.doc(`supportTickets/${id}`).get()).get("version")).toBe(2);
  await card.locator("summary").click();
  await expect(
    card.getByText("Phản hồi chờ xác nhận", { exact: true }),
  ).toBeVisible();
  await expect(retry).toBeHidden();
  await card.locator("summary").click();
  await retry.click();
  await expect
    .poll(
      async () =>
        (await db.collection(`supportTickets/${id}/messages`).get()).size,
    )
    .toBe(1);
  expect(commands).toHaveLength(2);
  expect(commands[1]).toEqual(commands[0]);
  expect((await db.doc(`supportTickets/${id}`).get()).get("version")).toBe(2);
});
test("SUPPORT028 customer reply remains authorized and updates the owned thread", async ({
  page,
}) => {
  const id = await ticket();
  await login(page, "customer-a");
  await page.goto("/support");
  const card = page.locator("article").filter({ hasText: `Synthetic ${id}` });
  await expect(card).toBeVisible();
  await card.getByText("Xem và gửi phản hồi", { exact: true }).click();
  await card
    .getByLabel("Phản hồi", { exact: true })
    .fill("Synthetic customer response028");
  await card.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await db.collection(`supportTickets/${id}/messages`).get()).size,
    )
    .toBe(1);
  await expect(
    card.getByText("Synthetic customer response028", { exact: true }),
  ).toBeVisible();
});
