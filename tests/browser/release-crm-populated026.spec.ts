import { test, expect, type Locator } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db } from "./fixtures";
import { artifactDirectory } from "./artifact-path";
const prefix = `!!026-populated-${9999999999999 - Date.now()}-${randomUUID()}`;
const kinds = ["returns", "refunds", "shipping", "batches", "finance"] as const;
const collection = {
  returns: "orderReturns",
  refunds: "refunds",
  shipping: "packages",
  batches: "consolidationBatches",
  finance: "paymentExceptions",
};
const fixture = (kind: (typeof kinds)[number], n: number) => {
  const id = `${prefix}-${kind}-${n}`,
    orderId = `${prefix}-order-${n}`;
  if (kind === "returns")
    return {
      id,
      orderId,
      version: 1,
      state: "receiving",
      lines: [
        {
          line: 0,
          name: "Sản phẩm thử nghiệm local có tên dài để kiểm tra bố cục",
          authorized: 4,
          received: 3,
          accepted: 2,
          damaged: 1,
        },
      ],
    };
  if (kind === "refunds")
    return {
      id,
      orderId,
      amount: 240000,
      reason: "Yêu cầu thử nghiệm local; chưa xác nhận tiền ra",
      state: "pending",
    };
  if (kind === "shipping")
    return {
      id,
      version: 1,
      state: n ? "in_transit" : "packed",
      allocations: [{ orderId, line: 0, quantity: 2 }],
      warehouse: "Kho thử nghiệm",
      route: "US-VN",
      weightGrams: 1500,
    };
  if (kind === "batches")
    return {
      id,
      version: 1,
      state: "sealed",
      parcelIds: [`${prefix}-shipping-${n}`],
      orderIds: [orderId],
      freight: 120000,
      shares: { [orderId]: 120000 },
      warehouse: "Kho thử nghiệm",
      route: "US-VN",
      hub: "Hub thử nghiệm",
      service: "Dịch vụ local",
      cutoff: 1791244800000,
    };
  return {
    id,
    amount: 240000,
    state: "open",
    reason: "Ngoại lệ thử nghiệm local",
    inboundVerified: false,
  };
};
test.beforeAll(async () => {
  await seedIdentities();
  const batch = db.batch();
  for (const kind of kinds)
    for (const n of [0, 1]) {
      const data = fixture(kind, n);
      batch.set(db.doc(`${collection[kind]}/${data.id}`), data);
    }
  await batch.commit();
});
test.afterAll(closeFixtures);
async function contained(control: Locator) {
  await expect(control).toBeVisible();
  expect(
    await control.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= -1 && r.right <= innerWidth + 1;
    }),
  ).toBe(true);
}
for (const width of [390, 768, 1440])
  for (const kind of kinds) {
    test(`CRM populated ${kind} facts forms and separated items at ${width}`, async ({
      page,
    }) => {
      const before = await Promise.all(
        [0, 1].map((n) =>
          db
            .doc(`${collection[kind]}/${fixture(kind, n).id}`)
            .get()
            .then((s) => s.data()),
        ),
      );
      let writes = 0;
      page.on("request", (r) => {
        if (
          /\/(returnCommand|refundCommand|sendCommand|shippingCommand|consolidationCommand|financeReview|command)$/.test(
            new URL(r.url()).pathname,
          )
        )
          writes++;
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
      await page.goto(`/crm/${kind === "batches" ? "shipping" : kind}`);
      if (kind === "finance") {
        const exceptions = page
          .getByRole("group", { name: "Nhóm đối soát", exact: true })
          .getByRole("button", { name: "Ngoại lệ", exact: true });
        await expect(exceptions).toBeEnabled();
        await exceptions.click();
        await expect(exceptions).toHaveAttribute("aria-pressed", "true");
      }
      const rows = [0, 1].map((n) =>
        page
          .locator("article.crmItem")
          .filter({ hasText: fixture(kind, n).id }),
      );
      for (const row of rows) await expect(row).toBeVisible();
      await expect(page.locator(".siteToast[aria-busy='true']")).toBeHidden();
      await rows[0].scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${artifactDirectory}/crm-populated-${kind}-${width}-before.png`,
        fullPage: true,
      });
      for (const [index, row] of rows.entries()) {
        if (kind === "returns") {
          await row.getByText("Chi tiết số lượng", { exact: true }).click();
          expect(
            await row
              .locator(".tableWrap")
              .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          ).toBe(true);
        }
        if (kind === "shipping")
          await row.getByText("Hàng trong kiện", { exact: true }).click();
        const actionLabel =
          kind === "returns"
            ? "Xử lý hàng trả"
            : kind === "refunds"
              ? "Xử lý yêu cầu"
              : kind === "finance"
                ? "Đối soát ngoại lệ"
                : kind === "batches"
                  ? "Bàn giao toàn bộ lô"
                  : index === 0
                    ? "Bàn giao kiện"
                    : "Cập nhật hành trình";
        const actionPanel = row.locator("details").filter({
          has: page
            .locator("summary")
            .filter({ hasText: new RegExp(`^\\s*${actionLabel}\\s*$`) }),
        });
        await row.getByText(actionLabel, { exact: true }).click();
        await expect(actionPanel).toHaveAttribute("open", "");
        const form = actionPanel.locator("form");
        await expect(form).toBeVisible();
        // Closed disclosures are deliberate. Every currently exposed control must fit,
        // including all fields in this state's explicitly opened action panel.
        for (const control of await row
          .locator(":is(input, select, textarea, button, summary, a):visible")
          .all())
          await contained(control);
        const fieldName =
          kind === "returns"
            ? "evidence"
            : kind === "finance"
              ? "reason"
              : kind === "refunds"
                ? "bank"
                : kind === "shipping" && index === 1
                  ? "event"
                  : "carrier";
        const field = form.locator(`[name="${fieldName}"]`);
        await expect(field).toBeVisible();
        await field.focus();
        await expect(field).toBeFocused();
        await form.getByRole("button").click();
        await expect(field).toBeFocused();
        expect(
          await field.evaluate(
            (el) => (el as HTMLInputElement).validity.valueMissing,
          ),
        ).toBe(true);
        if (kind === "finance") {
          // An unverified exception may only be closed; it cannot allocate money.
          await expect(
            form.locator('select[name="action"] option'),
          ).toHaveCount(1);
          await expect(
            form.locator('[name="orderId"], [name="amount"], [name="bank"]'),
          ).toHaveCount(0);
        }
        if (kind === "refunds") {
          await form
            .getByRole("combobox", { name: "Thao tác", exact: true })
            .selectOption("cancel");
          await expect(form.locator('[name="bank"]')).toHaveCount(0);
          const cancellationEvidence = form.locator('[name="evidence"]');
          await contained(cancellationEvidence);
          await form
            .getByRole("button", { name: "Hủy yêu cầu hoàn tiền", exact: true })
            .click();
          await expect(cancellationEvidence).toBeFocused();
          expect(
            await cancellationEvidence.evaluate(
              (el) => (el as HTMLTextAreaElement).validity.valueMissing,
            ),
          ).toBe(true);
        }
      }
      expect(
        await rows[0].evaluate((el, nextId) => {
          const next = Array.from(
            document.querySelectorAll("article.crmItem"),
          ).find((r) => r.textContent?.includes(nextId));
          return next
            ? next.getBoundingClientRect().top -
                el.getBoundingClientRect().bottom
            : -1;
        }, fixture(kind, 1).id),
      ).toBeGreaterThanOrEqual(8);
      expect(writes).toBe(0);
      expect(
        await Promise.all(
          [0, 1].map((n) =>
            db
              .doc(`${collection[kind]}/${fixture(kind, n).id}`)
              .get()
              .then((s) => s.data()),
          ),
        ),
      ).toEqual(before);
      await expect(page.locator(".siteToast[aria-busy='true']")).toBeHidden();
      await rows[0].scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${artifactDirectory}/crm-populated-${kind}-${width}.png`,
      });
      await page.screenshot({
        path: `${artifactDirectory}/crm-populated-${kind}-${width}-full.png`,
        fullPage: true,
      });
    });
  }

for (const width of [390, 768, 1440]) {
  test(`CRM populated campaign editing preserves caption and blocks missing title at ${width}`, async ({
    page,
  }) => {
    const id = `${prefix}-campaign`,
      data = {
        id,
        version: 1,
        title: "Chiến dịch thử nghiệm local",
        caption: "Caption thử nghiệm; không đăng lên mạng xã hội",
        path: "/posts/local-test",
        source: "local",
        medium: "review",
        campaign: "layout026",
        status: "draft",
      };
    await db.doc(`campaigns/${id}`).set(data);
    let writes = 0;
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.endsWith("/workspaceCommand")) writes++;
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
    await page.goto("/crm/campaigns");
    const row = page.locator("article.crmItem").filter({ hasText: id });
    await expect(row).toContainText(data.caption);
    await row.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Chỉnh sửa chiến dịch", exact: true }),
    ).toBeVisible();
    const title = page.getByRole("textbox", {
      name: "Tên chiến dịch",
      exact: true,
    });
    await expect(title).toHaveValue(data.title);
    await expect(
      page.getByRole("textbox", { name: "Caption", exact: true }),
    ).toHaveValue(data.caption);
    await title.focus();
    await expect(title).toBeFocused();
    for (const control of await page
      .locator("form input, form textarea, form select, form button")
      .all())
      await contained(control);
    await page.screenshot({
      path: `${artifactDirectory}/crm-populated-campaigns-${width}-full.png`,
      fullPage: true,
    });
    await title.fill("");
    await page
      .getByRole("button", { name: "Lưu chiến dịch", exact: true })
      .click();
    expect(
      await title.evaluate(
        (el) => (el as HTMLInputElement).validity.valueMissing,
      ),
    ).toBe(true);
    expect(writes).toBe(0);
    expect((await db.doc(`campaigns/${id}`).get()).data()).toEqual(data);
  });
}
