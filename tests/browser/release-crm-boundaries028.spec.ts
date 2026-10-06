import { test, expect, type Page, type Locator } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db, operator } from "./fixtures";

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
  await expect(locator).toBeVisible();
  expect(
    await locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1;
    }),
  ).toBe(true);
}
async function noOverflow(page: Page) {
  expect(
    await page
      .locator("main")
      .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
function identity(prefix: string, length: number) {
  return `${prefix}-${randomUUID()}-${"x".repeat(length)}`.slice(0, length);
}

for (const width of [390, 768, 1440]) {
  test(`CRM028 valid128 customer exact search preserves name120 and readable identity at ${width}`, async ({
    page,
  }) => {
    const id = identity("customer-boundary028", 128);
    const name = `Synthetic boundary customer ${randomUUID()}`;
    const data = {
      ownerId: id,
      displayName: name,
      searchName: name.toLowerCase(),
      locked: false,
      version: 1,
    };
    const ref = db.doc(`users/${id}`);
    try {
      await ref.set(data);
      await page.setViewportSize({ width, height: 1000 });
      await login(page);
      await page.goto("/crm/customers");
      await expect(
        page.getByRole("textbox", { name: "Tên khách hàng", exact: true }),
      ).toHaveAttribute("maxlength", "120");
      await page
        .getByRole("combobox", { name: "Tìm theo", exact: true })
        .selectOption("id");
      const field = page.getByRole("textbox", {
        name: "Mã khách hàng",
        exact: true,
      });
      await expect(field).toHaveAttribute("maxlength", "128");
      await field.fill(id);
      await expect(field).toHaveValue(id);
      const result = page.waitForResponse(
        (response) =>
          response.url().endsWith("/listCustomers") &&
          response.request().method() === "POST" &&
          response.request().postDataJSON()?.data?.search === id,
      );
      await page
        .getByRole("button", { name: "Tìm khách hàng", exact: true })
        .click();
      const payload = (await (await result).json()).result;
      expect(payload.rows.map((row: { id: string }) => row.id)).toEqual([id]);
      const row = page
        .getByRole("row")
        .filter({ has: page.getByRole("link", { name, exact: true }) });
      await expect(row).toBeVisible();
      await row.getByText("Mã khách hàng", { exact: true }).click();
      await expect(row.getByText(id, { exact: true })).toBeVisible();
      const open = row.getByRole("link", {
        name: `Mở hồ sơ ${name}`,
        exact: true,
      });
      await contained(field);
      await contained(open);
      await open.focus();
      await expect(open).toBeFocused();
      await noOverflow(page);
      expect((await ref.get()).data()).toEqual(data);
    } finally {
      await page.goto("/");
      await ref.delete();
    }
  });

  test(`CRM028 valid128 staff inspect actual CAS rejection and fresh versioned save at ${width}`, async ({
    page,
  }) => {
    const id = identity("staff-boundary028", 128);
    const ref = db.doc(`staffAccess/${id}`);
    const profile = db.doc(`users/${id}`);
    const initial = {
      version: 1,
      active: true,
      locked: false,
      roles: ["SUPPORT"],
      orderIds: [],
    };
    const concurrent = {
      version: 2,
      active: false,
      locked: true,
      roles: ["WAREHOUSE"],
      orderIds: [],
    };
    const commands: {
      operationId: string;
      expectedVersion: number;
      payload: unknown;
    }[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().endsWith("/workspaceCommand")
      ) {
        const command = request.postDataJSON()?.data;
        if (command?.id === id && command.action === "saveStaffAccess")
          commands.push(command);
      }
    });
    try {
      await Promise.all([
        ref.set(initial),
        profile.set({ ownerId: id, locked: false, version: 1 }),
      ]);
      await page.setViewportSize({ width, height: 1000 });
      await login(page);
      await page.goto("/crm/staff");
      const panel = page
        .getByRole("heading", { name: "Phân quyền", exact: true })
        .locator("..");
      const field = panel.getByLabel("Định danh nhân viên", { exact: true });
      const inspect = panel.getByRole("button", {
        name: "Kiểm tra quyền hiện tại",
        exact: true,
      });
      const save = panel.getByRole("button", {
        name: "Lưu quyền nhân viên",
        exact: true,
      });
      await field.fill(id);
      await inspect.click();
      await expect(panel.getByLabel("Hỗ trợ", { exact: true })).toBeChecked();
      await expect(panel.getByText(id, { exact: true })).toBeVisible();
      await panel.getByLabel("Hỗ trợ", { exact: true }).uncheck();
      await panel.getByLabel("Mua hàng", { exact: true }).check();
      await ref.set(concurrent);
      const rejected = page.waitForResponse(
        (response) =>
          response.url().endsWith("/workspaceCommand") &&
          response.request().method() === "POST" &&
          response.request().postDataJSON()?.data?.id === id,
      );
      await save.click();
      expect((await (await rejected).json()).error?.status).toBe("ABORTED");
      await expect(panel.getByRole("status")).toContainText("Chưa lưu được.");
      await expect(save).toHaveCount(0);
      expect((await ref.get()).data()).toEqual(concurrent);
      expect(commands).toHaveLength(1);
      expect(commands[0].expectedVersion).toBe(1);
      expect(
        (
          await db
            .doc(`idempotencyKeys/${operator}-${commands[0].operationId}`)
            .get()
        ).exists,
      ).toBe(false);
      expect(
        (await db.collection("auditEvents").where("resourceId", "==", id).get())
          .size,
      ).toBe(0);
      await inspect.click();
      await expect(panel.getByLabel("Kho", { exact: true })).toBeChecked();
      await panel.getByLabel("Kho", { exact: true }).uncheck();
      await panel.getByLabel("Hỗ trợ", { exact: true }).check();
      await panel.getByLabel("Được phép làm việc", { exact: true }).check();
      await panel.getByLabel("Khóa quyền nhân viên", { exact: true }).uncheck();
      await contained(field);
      await contained(save);
      await save.focus();
      await expect(save).toBeFocused();
      await noOverflow(page);
      await save.click();
      await expect(panel.getByRole("status")).toContainText("Đã lưu quyền.");
      const stored = (await ref.get()).data();
      expect(stored).toMatchObject({
        version: 3,
        active: true,
        locked: false,
        roles: ["SUPPORT"],
        orderIds: [],
      });
      expect(commands).toHaveLength(2);
      expect(commands[1].expectedVersion).toBe(2);
      expect(commands[1].operationId).not.toBe(commands[0].operationId);
      expect(
        (
          await db
            .doc(`idempotencyKeys/${operator}-${commands[1].operationId}`)
            .get()
        ).exists,
      ).toBe(true);
      const audits = await db
        .collection("auditEvents")
        .where("resourceId", "==", id)
        .get();
      expect(audits.size).toBe(1);
      expect(audits.docs[0].data()).toMatchObject({
        actor: operator,
        action: "saveStaffAccess",
        resourceId: id,
      });
    } finally {
      await page.goto("/");
      const cleanup = db.batch();
      cleanup.delete(ref);
      cleanup.delete(profile);
      for (const command of commands)
        cleanup.delete(
          db.doc(`idempotencyKeys/${operator}-${command.operationId}`),
        );
      const audits = await db
        .collection("auditEvents")
        .where("resourceId", "==", id)
        .get();
      for (const audit of audits.docs) {
        expect(audit.get("actor")).toBe(operator);
        cleanup.delete(audit.ref);
      }
      await cleanup.commit();
    }
  });

  test(`CRM028 actual outbox page continues through generated84 cursor without duplicate owned rows at ${width}`, async ({
    page,
  }) => {
    const owner = identity("cursor-owner", 28);
    const ids = Array.from(
      { length: 31 },
      () => `conversation-staff-${owner}-${randomUUID()}`,
    );
    expect(ids.every((id) => id.length === 84)).toBe(true);
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
    expect(baseTime).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER - 32000);
    const records = ids.map((_, index) => ({
      ownerId: owner,
      action: "invoiceIssued",
      state: "inAppDelivered",
      emailState: "not_queued",
      attempts: 0,
      createdAt: baseTime + (31 - index) * 1000,
      version: 1,
    }));
    let writes = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().endsWith("/outboxCommand")
      )
        writes++;
    });
    try {
      const seed = db.batch();
      ids.forEach((id, index) =>
        seed.set(db.doc(`outboxJobs/${id}`), records[index]),
      );
      await seed.commit();
      await page.setViewportSize({ width, height: 1000 });
      await login(page);
      await page.goto("/crm/activity");
      const outbox = page
        .getByRole("group", { name: "Nhóm nhật ký", exact: true })
        .getByRole("button", { name: "Thông báo", exact: true });
      await expect(outbox).toBeEnabled();
      const firstPage = page.waitForResponse(
        (response) =>
          response.url().endsWith("/listWork") &&
          response.request().method() === "POST" &&
          response.request().postDataJSON()?.data?.kind === "outboxJobs" &&
          !response.request().postDataJSON()?.data?.after,
      );
      await outbox.click();
      const first = (await (await firstPage).json()).result as {
        rows: { id: string }[];
        next: string;
      };
      expect(first.rows.map((row) => row.id)).toEqual(ids.slice(0, 30));
      expect(first.next).toBe(ids[29]);
      const next = page.getByRole("button", {
        name: "Trang tiếp theo",
        exact: true,
      });
      await expect(next).toBeEnabled();
      await contained(next);
      await next.focus();
      await expect(next).toBeFocused();
      await noOverflow(page);
      const secondPage = page.waitForResponse(
        (response) =>
          response.url().endsWith("/listWork") &&
          response.request().method() === "POST" &&
          response.request().postDataJSON()?.data?.kind === "outboxJobs" &&
          response.request().postDataJSON()?.data?.after === ids[29],
      );
      await next.click();
      const response = await secondPage;
      expect(response.ok()).toBe(true);
      const second = (await response.json()).result as {
        rows: { id: string }[];
      };
      expect(second.rows[0].id).toBe(ids[30]);
      // Older fixtures may occupy the rest of this real page. Never delete or
      // hide them merely to make the owned continuation look like an empty DB.
      const ownedSecond = second.rows.filter((row) => ids.includes(row.id));
      expect(ownedSecond.map((row) => row.id)).toEqual([ids[30]]);
      expect(
        new Set([...first.rows, ...ownedSecond].map((row) => row.id)).size,
      ).toBe(31);
      const lastTime = await page.evaluate(
        (at) => new Date(at).toLocaleString("vi-VN"),
        baseTime + 1000,
      );
      const remainingTime = page
        .getByRole("cell")
        .filter({ hasText: lastTime });
      await expect(remainingTime).toHaveCount(1);
      await expect(remainingTime).toHaveText(lastTime);
      await expect(remainingTime).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await noOverflow(page);
      expect(writes).toBe(0);
      const stored = await db.getAll(
        ...ids.map((id) => db.doc(`outboxJobs/${id}`)),
      );
      expect(stored).toHaveLength(ids.length);
      const received = new Map(
        stored.map((document) => [document.id, document.data()]),
      );
      expect(received.size).toBe(ids.length);
      expect(ids.map((id) => received.get(id))).toEqual(records);
    } finally {
      await page.goto("/");
      const cleanup = db.batch();
      ids.forEach((id) => cleanup.delete(db.doc(`outboxJobs/${id}`)));
      await cleanup.commit();
    }
  });
}
