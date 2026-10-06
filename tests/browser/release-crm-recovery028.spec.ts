import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { invoke } from "./http";
import {
  seedIdentities,
  closeFixtures,
  freshCustomer,
  db,
  customer,
} from "./fixtures";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
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
test("CRM028 care draft survives unavailable read and requires explicit comparison before newer-version save", async ({
  page,
}) => {
  const { uid } = await freshCustomer();
  const ref = db.doc(`crmCustomers/${uid}`);
  await ref.set({
    version: 1,
    tags: ["Synthetic"],
    notes: "Synthetic original028",
    assigneeId: "",
    followUpAt: 0,
  });
  await login(page);
  await page.goto(`/crm/customers/${uid}`);
  await page.getByText("Cập nhật chăm sóc", { exact: true }).click();
  const notes = page.getByRole("textbox", {
    name: "Ghi chú nội bộ",
    exact: true,
  });
  await notes.fill("Synthetic retained care draft028");
  let fail = true;
  await page.route("**/readCustomer", async (route) => {
    if (fail) {
      fail = false;
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            status: "PERMISSION_DENIED",
            message: "Synthetic unavailable private view028",
          },
        }),
      });
    }
    return route.continue();
  });
  const reload = page.getByRole("button", {
    name: "Tải lại hồ sơ",
    exact: true,
  });
  await reload.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(notes).toHaveCount(0);
  await reload.click();
  await page.getByText("Cập nhật chăm sóc", { exact: true }).click();
  await expect(notes).toHaveValue("Synthetic retained care draft028");
  await ref.update({
    version: 2,
    notes: "Synthetic concurrent customer winner028",
  });
  await reload.click();
  await expect(
    page.getByText("Hồ sơ đã thay đổi. Bản nháp của bạn chưa được lưu.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(notes).toHaveValue("Synthetic retained care draft028");
  await expect(notes).toBeDisabled();
  expect((await ref.get()).get("notes")).toBe(
    "Synthetic concurrent customer winner028",
  );
  await page
    .getByRole("button", {
      name: "Đã đối chiếu, tiếp tục bản nháp",
      exact: true,
    })
    .click();
  await expect(notes).toBeEnabled();
  await expect(notes).toHaveValue("Synthetic retained care draft028");
  await page
    .getByRole("button", { name: "Lưu hồ sơ nội bộ", exact: true })
    .click();
  await expect.poll(async () => (await ref.get()).get("version")).toBe(3);
  expect((await ref.get()).get("notes")).toBe(
    "Synthetic retained care draft028",
  );
});
test("CRM028 definite staff reply CAS reloads actual ticket version and retains typed reply", async ({
  page,
}) => {
  const id = `support028-cas-${randomUUID()}`;
  const ref = db.doc(`supportTickets/${id}`);
  await ref.set({
    ownerId: customer,
    subject: `Synthetic ${id}`,
    message: "Synthetic original support028",
    status: "open",
    version: 1,
    createdAt: Date.now(),
  });
  await login(page);
  await page.goto(`/crm/support?ticket=${id}`);
  const card = page.locator("details.crmTicket");
  const input = card.getByLabel("Phản hồi", { exact: true });
  await expect(input).toBeEnabled();
  await input.fill("Synthetic retained CAS reply028");
  await ref.update({ version: 2 });
  const commands: Record<string, unknown>[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/workspaceCommand")
    ) {
      const data = request.postDataJSON().data;
      if (data.id === id) commands.push(data);
    }
  });
  await card.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await expect(card.getByRole("alert")).toContainText(
    "Phản hồi chưa được chấp nhận",
  );
  await expect(input).toHaveValue("Synthetic retained CAS reply028");
  await card
    .getByRole("button", { name: "Tải lại phản hồi", exact: true })
    .click();
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("Synthetic retained CAS reply028");
  await card.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await expect.poll(async () => (await ref.get()).get("version")).toBe(3);
  expect(commands).toHaveLength(2);
  expect(commands[0].expectedVersion).toBe(1);
  expect(commands[1].expectedVersion).toBe(2);
  expect(commands[1].operationId).not.toBe(commands[0].operationId);
  expect(commands[1].payload).toEqual(commands[0].payload);
  expect((await ref.collection("messages").get()).size).toBe(1);
});

test("CRM028 multi-line substitution preserves variant-only changes and explicit variant clearing", async ({
  page,
}) => {
  let state = await invoke<{ id: string; version: number }>(
    "command",
    {
      action: "submitRequest",
      operationId: randomUUID(),
      payload: {
        market: "US",
        notes: "Synthetic multiline recovery028",
        items: [0, 1, 2].map((line) => ({
          name: `Synthetic line ${line}`,
          quantity: 1,
          variant: `Original ${line}`,
          url: "",
        })),
      },
    },
    "customer-a",
  );
  const act = async (action: string, payload: unknown, identity = "owner") => {
    state = await invoke(
      "command",
      {
        action,
        payload,
        orderId: state.id,
        expectedVersion: state.version,
        operationId: randomUUID(),
      },
      identity,
    );
  };
  await act("issueQuote", {
    goods: 300000,
    service: 10000,
    sourceCosts: 0,
    internationalShipping: 0,
    destinationShipping: 0,
    discount: 0,
    sourceCurrency: "USD",
    sourceMinor: 1200,
    fxNumerator: 250,
    fxDenominator: 1,
    termsVersion: "synthetic-sanity-v1",
    expiresAt: Date.now() + 3600000,
    verifiedProduct: "Synthetic reviewed three-line request",
  });
  await act("acceptQuote", { quoteVersion: 1 }, "customer-a");
  await login(page);
  await page.goto(`/crm/orders?order=${state.id}`);
  const summary = page
    .locator("summary")
    .filter({ hasText: "Đề xuất thay đổi để khách duyệt" });
  const form = summary.locator("..");
  await summary.click();
  await form.locator('input[name="name-0"]').fill("Synthetic replacement028");
  await form.locator('input[name="variant-1"]').fill("Changed variant028");
  await form.locator('input[name="variant-2"]').fill("");
  await form
    .locator('textarea[name="reason"]')
    .fill("Synthetic reviewed multiline substitution");
  await form.locator('input[name="total"]').fill("310000");
  await form.locator('input[name="costs"]').fill("0");
  await form
    .locator('textarea[name="evidence"]')
    .fill("Synthetic private multiline evidence");
  const request = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/changeCommand"),
  );
  await form
    .getByRole("button", { name: "Gửi đề xuất và tạm giữ xử lý", exact: true })
    .click();
  const submitted = (await request).postDataJSON().data;
  expect(submitted.payload.lines).toEqual([
    {
      line: 0,
      cancelQuantity: 0,
      replacementName: "Synthetic replacement028",
      replacementVariant: "Original 0",
    },
    { line: 1, cancelQuantity: 0, replacementVariant: "Changed variant028" },
    { line: 2, cancelQuantity: 0, replacementVariant: "" },
  ]);
  await expect
    .poll(
      async () =>
        (
          await db
            .collection("orderChanges")
            .where("orderId", "==", state.id)
            .get()
        ).size,
    )
    .toBe(1);
  const change = (
    await db.collection("orderChanges").where("orderId", "==", state.id).get()
  ).docs[0];
  for (const [action, identity] of [
    ["accept", "customer-a"],
    ["apply", "owner"],
  ]) {
    const order = await db.doc(`orders/${state.id}`).get();
    await invoke(
      "changeCommand",
      {
        action,
        orderId: state.id,
        proposalId: change.id,
        expectedVersion: order.get("version"),
        operationId: randomUUID(),
      },
      identity,
    );
  }
  const final = (await db.doc(`orders/${state.id}`).get()).data()!;
  expect(final.items.map((item: { variant: string }) => item.variant)).toEqual([
    "Original 0",
    "Changed variant028",
    "",
  ]);
  expect(final.items[0].name).toBe("Synthetic replacement028");
  expect(final.collected).toBe(0);
  expect(final.refunded).toBe(0);
});
