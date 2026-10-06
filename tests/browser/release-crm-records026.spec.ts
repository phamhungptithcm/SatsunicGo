import { test, expect, type Page, type Locator } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  freshCustomer,
  db,
  operator,
} from "./fixtures";
import { artifactDirectory } from "./artifact-path";

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
async function contained(locator: Locator) {
  expect(
    await locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= -1 && r.right <= innerWidth + 1;
    }),
  ).toBe(true);
}
async function verticalPosition(locator: Locator) {
  await locator.evaluate((el) =>
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 200),
  );
}
for (const width of [390, 768]) {
  for (const path of ["customers", "follow-ups"]) {
    test(`CRM record ${path} calendar and open action need no horizontal swipe at ${width}`, async ({
      page,
    }) => {
      const actor = await freshCustomer(),
        name = `CRM record ${randomUUID()}`;
      await db.doc(`users/${actor.uid}`).update({
        displayName: name,
        businessName: "Công việc local thử nghiệm",
      });
      // Epoch appointment is an intentionally synthetic overdue fixture, not production data.
      const notes = {
        version: 1,
        tags: ["Cần chăm sóc", "Khách thử"],
        notes: "Local read-only",
        assigneeId: operator,
        followUpAt: 1,
      };
      await db.doc(`crmCustomers/${actor.uid}`).set(notes);
      let commands = 0;
      page.on("request", (r) => {
        if (
          /\/(saveCustomerNotes|workspaceCommand)$/.test(
            new URL(r.url()).pathname,
          )
        )
          commands++;
      });
      await page.setViewportSize({ width, height: 1000 });
      await login(page);
      const firstFollowUpRead =
        path === "follow-ups"
          ? page.waitForResponse(
              (r) =>
                new URL(r.url()).pathname.endsWith("/listFollowUps") &&
                r.request().method() === "POST",
            )
          : null;
      await page.goto(`/crm/${path}`);
      if (firstFollowUpRead) expect((await firstFollowUpRead).ok()).toBe(true);
      if (path === "customers") {
        await page
          .getByRole("combobox", { name: "Tìm theo", exact: true })
          .selectOption("id");
        await page
          .getByRole("textbox", { name: "Mã khách hàng", exact: true })
          .fill(actor.uid);
        await page
          .getByRole("button", { name: "Tìm khách hàng", exact: true })
          .click();
      }
      const row = page
        .getByRole("row")
        .filter({ has: page.getByRole("link", { name, exact: true }) });
      if (path === "follow-ups") {
        const reload = page.getByRole("button", {
          name: "Tải lại",
          exact: true,
        });
        await expect(reload).toBeEnabled();
        const next = page.getByRole("button", {
          name: "Trang tiếp theo",
          exact: true,
        });
        while ((await row.count()) === 0 && (await next.isVisible())) {
          await next.click();
          await expect(reload).toBeEnabled();
        }
      }
      await expect(row).toBeVisible();
      const table = page.locator(".tableWrap");
      expect(
        await table.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await verticalPosition(row);
      const calendar = row.locator("time"),
        action = row.getByRole("link", {
          name: `Mở hồ sơ ${name}`,
          exact: true,
        });
      await expect(calendar).toHaveAttribute(
        "datetime",
        new Date(1).toISOString(),
      );
      for (const tag of notes.tags) await expect(row).toContainText(tag);
      const staffName = String(
        (await db.doc(`users/${operator}`).get()).data()?.displayName ?? "",
      ).trim();
      await expect(row.locator('[data-label="Người phụ trách"]')).toHaveText(
        staffName || operator,
      );
      await contained(calendar);
      await contained(action);
      await action.focus();
      await expect(action).toBeFocused();
      expect(await table.evaluate((el) => el.scrollLeft)).toBe(0);
      await page.screenshot({
        path: `${artifactDirectory}/crm-record-${path}-${width}.png`,
      });
      await action.click();
      await expect(page).toHaveURL(new RegExp(`/crm/customers/${actor.uid}$`));
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
      await page.getByText("Cập nhật chăm sóc", { exact: true }).click();
      const internalNotes = page.getByRole("textbox", {
        name: "Ghi chú nội bộ",
        exact: true,
      });
      await expect(internalNotes).toHaveValue(notes.notes);
      await internalNotes.focus();
      await expect(internalNotes).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `${artifactDirectory}/crm-record-profile-${path}-${width}.png`,
      });
      await page.screenshot({
        path: `${artifactDirectory}/crm-record-profile-${path}-${width}-full.png`,
        fullPage: true,
      });
      expect((await db.doc(`crmCustomers/${actor.uid}`).get()).data()).toEqual(
        notes,
      );
      expect(commands).toBe(0);
    });
  }
  test(`CRM record outbox manual reconciliation and retry are contained at ${width}`, async ({
    page,
  }) => {
    const group = randomUUID(),
      unknownId = `crm-record-unknown-${group}`,
      failedId = `crm-record-failed-${group}`;
    const latest = await db
      .collection("outboxJobs")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    const latestAt: unknown = latest.docs[0]?.get("createdAt");
    const baseTime = Math.max(
      Date.now(),
      typeof latestAt === "number" && Number.isFinite(latestAt) ? latestAt : 0,
    );
    expect(baseTime).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER - 1000);
    const unknown = {
      ownerId: operator,
      action: "invoiceIssued",
      createdAt: baseTime + 1000,
      state: "inAppDelivered",
      emailState: "unknown",
      reconciliationRequired: true,
      version: 1,
    };
    const failed = {
      ...unknown,
      createdAt: unknown.createdAt - 1,
      emailState: "failed",
      reconciliationRequired: false,
    };
    await db.doc(`outboxJobs/${unknownId}`).set(unknown);
    await db.doc(`outboxJobs/${failedId}`).set(failed);
    let commands = 0;
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.endsWith("/outboxCommand")) commands++;
    });
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    await page.goto("/crm/activity");
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/listWork") &&
        r.request().postDataJSON()?.data?.kind === "outboxJobs",
    );
    const outboxScope = page
      .getByRole("group", { name: "Nhóm nhật ký", exact: true })
      .getByRole("button", { name: "Thông báo", exact: true });
    await expect(outboxScope).toBeEnabled();
    await outboxScope.click();
    await expect(outboxScope).toHaveAttribute("aria-pressed", "true");
    const payload = (await (await response).json()).result;
    expect(payload.rows.slice(0, 2).map((r: { id: string }) => r.id)).toEqual([
      unknownId,
      failedId,
    ]);
    const rows = page.getByRole("row").filter({
      has: page
        .getByRole("cell")
        .filter({ hasText: "Email chứng từ đơn hàng" }),
    });
    const first = rows.first(),
      second = rows.nth(1),
      table = page.locator(".tableWrap");
    await expect(first).toContainText("Chưa rõ kết quả gửi");
    expect(
      await table.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await first.locator("summary").click();
    const outcome = first.getByRole("combobox", {
      name: "Kết quả",
      exact: true,
    });
    const evidence = first.getByRole("textbox", {
      name: "Bằng chứng đối soát",
      exact: true,
    });
    const save = first.getByRole("button", {
      name: "Lưu đối soát, chưa gửi lại",
      exact: true,
    });
    await verticalPosition(first);
    for (const control of [
      outcome,
      evidence,
      save,
      second.getByRole("button", { name: "Xếp lịch thử lại", exact: true }),
    ])
      await contained(control);
    for (const control of [outcome, evidence]) {
      const separation = await control.evaluate((el) => {
        const label = el.closest("label");
        if (!label) throw new Error("Missing native field label");
        const text = Array.from(label.childNodes).find(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (!text) throw new Error("Missing field label text");
        const range = document.createRange();
        range.selectNodeContents(text);
        return (
          el.getBoundingClientRect().top - range.getBoundingClientRect().bottom
        );
      });
      expect(
        separation,
        "Field label must sit above its control",
      ).toBeGreaterThanOrEqual(4);
    }
    await outcome.selectOption("confirmed_not_sent");
    await save.click();
    await expect(evidence).toBeFocused();
    expect(
      await evidence.evaluate(
        (el) => (el as HTMLInputElement).validity.valueMissing,
      ),
    ).toBe(true);
    expect(commands).toBe(0);
    await evidence.fill(
      "Bằng chứng local thử nghiệm, chưa xác nhận nhà cung cấp thật.",
    );
    await expect(outcome).toHaveValue("confirmed_not_sent");
    await expect(first).toContainText("gửi trùng");
    expect(await table.evaluate((el) => el.scrollLeft)).toBe(0);
    await verticalPosition(first);
    await page.screenshot({
      path: `${artifactDirectory}/crm-record-outbox-${width}.png`,
    });
    await page.screenshot({
      path: `${artifactDirectory}/crm-record-outbox-${width}-full.png`,
      fullPage: true,
    });
    expect((await db.doc(`outboxJobs/${unknownId}`).get()).data()).toEqual(
      unknown,
    );
    expect((await db.doc(`outboxJobs/${failedId}`).get()).data()).toEqual(
      failed,
    );
    expect(commands).toBe(0);
  });
}

test("CRM settings held verified read preserves the native open editor without a save", async ({
  page,
}) => {
  let release!: () => void, started!: () => void, finished!: () => void;
  const gate = new Promise<void>((r) => {
      release = r;
    }),
    reached = new Promise<void>((r) => {
      started = r;
    }),
    done = new Promise<void>((r) => {
      finished = r;
    });
  await page.route("**/readOwnerConfiguration", async (route) => {
    try {
      const response = await route.fetch();
      started();
      await gate;
      await route.fulfill({ response });
    } finally {
      finished();
    }
  });
  try {
    await login(page);
    await page.goto("/crm/settings");
    await reached;
    const details = page.locator(".crmPolicy");
    await details.locator(":scope > summary").click();
    await expect(
      details.getByRole("button", { name: "Lưu chính sách", exact: true }),
    ).toBeDisabled();
    release();
    await done;
    await expect(
      details.getByRole("button", { name: "Lưu chính sách", exact: true }),
    ).toBeEnabled();
    expect(
      await details.evaluate((el) => (el as HTMLDetailsElement).open),
    ).toBe(true);
  } finally {
    release();
    await done;
    await page.unroute("**/readOwnerConfiguration");
  }
});

test("CRM settings declared read outage has explicit actual-service retry and no write", async ({
  page,
}) => {
  let outage = true,
    commands = 0;
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.endsWith("/workspaceCommand")) commands++;
  });
  await page.route("**/readOwnerConfiguration", async (route) => {
    if (outage) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            status: "UNAVAILABLE",
            message: "Declared local Settings read fault",
          },
        }),
      });
    } else await route.continue();
  });
  await login(page);
  await page.goto("/crm/settings");
  const details = page.locator(".crmPolicy");
  await details.locator(":scope > summary").click();
  await expect(details.getByRole("alert")).toContainText(
    "Chưa tải được chính sách",
  );
  await expect(
    details.getByRole("button", { name: "Lưu chính sách", exact: true }),
  ).toBeDisabled();
  outage = false;
  await details
    .getByRole("button", { name: "Tải lại chính sách", exact: true })
    .click();
  await expect(
    details.getByRole("button", { name: "Lưu chính sách", exact: true }),
  ).toBeEnabled();
  await expect(details.getByRole("alert")).toHaveCount(0);
  expect(commands).toBe(0);
});
