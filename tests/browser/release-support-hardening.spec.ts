import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  customer,
  otherCustomer,
  db,
} from "./fixtures";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

test("SUP025-A01 newest submitted private ticket stays first beyond the 30-ticket window", async ({
  page,
}) => {
  const marker = randomUUID();
  const subject = `Synthetic newest support ${marker}`;
  const foreign = `Synthetic foreign support ${marker}`;
  const batch = db.batch();
  for (let i = 0; i < 31; i++) {
    batch.set(
      db.doc(`supportTickets/000-${marker}-${String(i).padStart(2, "0")}`),
      {
        ownerId: customer,
        subject: `Synthetic older support ${marker} ${i}`,
        message: "Synthetic bounded-list fixture",
        status: "open",
        version: 1,
        createdAt: 1,
      },
    );
  }
  batch.set(db.doc(`supportTickets/000-${marker}-foreign`), {
    ownerId: otherCustomer,
    subject: foreign,
    message: "Synthetic foreign fixture",
    status: "open",
    version: 1,
    createdAt: Date.now() + 60_000,
  });
  await batch.commit();
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption("customer-a");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  await page.goto("/support");
  await expect(page.locator("article.order")).toHaveCount(30);
  await expect(
    page.getByRole("heading", { name: foreign, exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Chủ đề", exact: true })
    .fill(subject);
  await page
    .getByRole("textbox", { name: "Nội dung", exact: true })
    .fill("Synthetic newest support request");
  await page
    .getByRole("button", { name: "Gửi yêu cầu hỗ trợ", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (
          await db
            .collection("supportTickets")
            .where("subject", "==", subject)
            .get()
        ).size,
    )
    .toBe(1);
  await expect(
    page.getByRole("heading", { name: subject, exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("article.order")
      .first()
      .getByRole("heading", { name: subject, exact: true }),
  ).toBeVisible();
  await expect(page.locator("article.order")).toHaveCount(30);
  await expect(
    page.getByRole("heading", { name: foreign, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Yêu cầu gần đây", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifactDirectory}/support-newest-window.png`,
    fullPage: true,
  });
});
