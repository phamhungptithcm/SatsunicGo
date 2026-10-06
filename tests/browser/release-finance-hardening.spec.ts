import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { artifactDirectory } from "./artifact-path";
import { seedIdentities, closeFixtures, sourceOrder, db } from "./fixtures";
import { invoke } from "./http";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
test("BIZ025-UI cancelled catalog blocks new transfer with clear error and no money writes", async ({
  page,
}) => {
  const id = await sourceOrder();
  let order = (await db.doc(`orders/${id}`).get()).data()!;
  await invoke(
    "command",
    {
      action: "cancelRequest",
      orderId: id,
      expectedVersion: order.version,
      operationId: randomUUID(),
      payload: {},
    },
    "customer-a",
  );
  order = (await db.doc(`orders/${id}`).get()).data()!;
  const before = JSON.stringify(order);
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
  await page.goto(`/crm/orders?order=${id}`);
  const action = page.getByRole("combobox", { name: "Thao tác", exact: true });
  await action.selectOption("verifyTransfer");
  const form = action.locator("xpath=ancestor::form[1]");
  await form
    .getByRole("spinbutton", { name: "Số tiền (VND)", exact: true })
    .fill("240000");
  await form
    .getByRole("textbox", { name: "Mã giao dịch ngân hàng", exact: true })
    .fill(randomUUID());
  await form
    .getByRole("textbox", {
      name: "Tham chiếu bằng chứng đối soát",
      exact: true,
    })
    .fill("Synthetic fixture only");
  await form
    .getByRole("textbox", { name: "Lý do", exact: true })
    .fill("Synthetic rejection check");
  await form
    .getByRole("button", { name: "Xác minh chuyển khoản", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .getByText("Đơn đã hủy. Không thể phân bổ thêm tiền.", { exact: true }),
  ).toHaveText("Đơn đã hủy. Không thể phân bổ thêm tiền.");
  expect(JSON.stringify((await db.doc(`orders/${id}`).get()).data())).toBe(
    before,
  );
  expect(
    (await db.collection("financialEntries").where("orderId", "==", id).get())
      .empty,
  ).toBe(true);
  await page.screenshot({
    path: `${artifactDirectory}/cancelled-transfer-error.png`,
    fullPage: true,
  });
});
