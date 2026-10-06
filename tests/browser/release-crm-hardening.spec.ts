import { test, expect, type Page, type Route } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  freshCustomer,
  customer,
  db,
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
function holdCommand(id: string) {
  let release!: () => void, committed!: () => void, delivered!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const commitment = new Promise<void>((resolve) => {
    committed = resolve;
  });
  const delivery = new Promise<void>((resolve) => {
    delivered = resolve;
  });
  return {
    release,
    commitment,
    delivery,
    handler: async (route: Route) => {
      if (
        route.request().method() !== "POST" ||
        route.request().postDataJSON()?.data?.id !== id
      )
        return route.continue();
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.error).toBeUndefined();
      committed();
      await hold;
      await route.fulfill({ response });
      delivered();
    },
  };
}

test("CRM025-A01 deferred committed outbox reconciliation locks scope until acknowledgement and cannot reload an obsolete kind", async ({
  page,
}) => {
  const id = `crm025-job-${randomUUID()}`;
  const createdAt = Date.now() + 60_000;
  await db.doc(`outboxJobs/${id}`).set({
    ownerId: customer,
    createdAt,
    action: "invoiceIssued",
    state: "inAppDelivered",
    emailState: "unknown",
    version: 1,
    attempts: 1,
    claimId: "synthetic-crm025-claim",
  });
  await login(page);
  await page.goto("/crm/activity");
  const scopes = page.getByRole("group", { name: "Nhóm nhật ký", exact: true });
  const auditScope = scopes.getByRole("button", {
    name: "Nhật ký thao tác",
    exact: true,
  });
  const outboxScope = scopes.getByRole("button", {
    name: "Thông báo",
    exact: true,
  });
  await expect(outboxScope).toBeEnabled();
  await outboxScope.click();
  await expect(outboxScope).toHaveAttribute("aria-pressed", "true");
  const timestamp = await page.evaluate(
    (at) => new Date(at).toLocaleString("vi-VN"),
    createdAt,
  );
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: timestamp, exact: true }) });
  await expect(row).toContainText("Chưa rõ kết quả gửi");
  await row.getByText("Ghi nhận đối soát", { exact: true }).click();
  await row
    .locator('select[name="outcome"]')
    .selectOption("confirmed_not_sent");
  await row
    .getByRole("textbox", { name: "Bằng chứng đối soát", exact: true })
    .fill("Synthetic provider confirms no send, fixture only");
  const held = holdCommand(id);
  await page.route("**/outboxCommand", held.handler);
  let obsoleteReads = 0,
    pendingReads = 0,
    waitingForAcknowledgement = false,
    switched = false;
  await page.route("**/listWork", (route) => {
    if (waitingForAcknowledgement && route.request().method() === "POST")
      pendingReads++;
    if (
      switched &&
      route.request().method() === "POST" &&
      route.request().postDataJSON()?.data?.kind === "outboxJobs"
    )
      obsoleteReads++;
    return route.continue();
  });
  try {
    await row
      .getByRole("button", { name: "Lưu đối soát, chưa gửi lại", exact: true })
      .click();
    await held.commitment;
    expect((await db.doc(`outboxJobs/${id}`).get()).data()?.version).toBe(2);
    waitingForAcknowledgement = true;
    await expect(auditScope).toBeDisabled();
    await expect(outboxScope).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Tải lại", exact: true }),
    ).toBeDisabled();
    await expect(outboxScope).toHaveAttribute("aria-pressed", "true");
    expect(pendingReads).toBe(0);
    const refreshedOutbox = page.waitForResponse(
      (response) =>
        response.url().endsWith("/listWork") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.data?.kind === "outboxJobs",
    );
    waitingForAcknowledgement = false;
    held.release();
    await held.delivery;
    expect((await refreshedOutbox).ok()).toBe(true);
    await expect(
      page.getByText("Đã lưu đối soát, chưa gửi lại email.", { exact: true }),
    ).toBeVisible();
    await expect(auditScope).toBeEnabled();
    const audit = page.waitForResponse(
      (response) =>
        response.url().endsWith("/listWork") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.data?.kind === "auditEvents",
    );
    switched = true;
    await auditScope.click();
    expect((await audit).ok()).toBe(true);
    await expect(
      page.getByRole("button", { name: "Tải lại", exact: true }),
    ).toBeEnabled();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(auditScope).toHaveAttribute("aria-pressed", "true");
    await expect(outboxScope).toHaveAttribute("aria-pressed", "false");
    expect(obsoleteReads).toBe(0);
    await expect(
      page.getByRole("columnheader", { name: "Đối tượng", exact: true }),
    ).toBeVisible();
    const job = (await db.doc(`outboxJobs/${id}`).get()).data()!;
    expect(job.emailState).toBe("failed");
    expect(job.attempts).toBe(1);
  } finally {
    held.release();
  }
});

test("CRM025-A02 SPA customer and follow-up navigation reloads the correct list and resets view filters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const unscheduled = await freshCustomer(),
    scheduled = await freshCustomer();
  const marker = randomUUID();
  const unscheduledName = `Synthetic unscheduled ${marker}`,
    scheduledName = `Synthetic due ${marker}`;
  await db
    .doc(`users/${unscheduled.uid}`)
    .update({ displayName: unscheduledName });
  await db.doc(`users/${scheduled.uid}`).update({ displayName: scheduledName });
  await db.doc(`crmCustomers/${scheduled.uid}`).set({
    version: 1,
    tags: [],
    notes: "Synthetic overdue navigation fixture",
    assigneeId: "",
    followUpAt: 1,
  });
  let customerReads = 0,
    followUpReads = 0;
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (request.url().endsWith("/listCustomers")) customerReads++;
    if (request.url().endsWith("/listFollowUps")) followUpReads++;
  });
  await login(page);
  await page.goto("/crm/customers");
  await page
    .getByRole("combobox", { name: "Tìm theo", exact: true })
    .selectOption("id");
  await page
    .getByRole("textbox", { name: "Mã khách hàng", exact: true })
    .fill(unscheduled.uid);
  await page
    .getByRole("button", { name: "Tìm khách hàng", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: unscheduledName, exact: true }),
  ).toBeVisible();
  const token = randomUUID();
  await page.evaluate((value) => {
    (
      window as Window & { crm025NavigationToken?: string }
    ).crm025NavigationToken = value;
  }, token);
  const beforeFollowUps = followUpReads;
  await page
    .getByRole("navigation", { name: "Không gian vận hành", exact: true })
    .getByRole("link", { name: "Lịch chăm sóc", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lịch chăm sóc", exact: true }),
  ).toBeVisible();
  await expect.poll(() => followUpReads).toBeGreaterThan(beforeFollowUps);
  const scheduledLink = page.getByRole("link", {
    name: scheduledName,
    exact: true,
  });
  const reloadFollowUps = page.getByRole("button", {
    name: "Tải lại",
    exact: true,
  });
  await expect(reloadFollowUps).toBeEnabled();
  const nextFollowUps = page.getByRole("button", {
    name: "Trang tiếp theo",
    exact: true,
  });
  while (
    (await scheduledLink.count()) === 0 &&
    (await nextFollowUps.isVisible())
  ) {
    await nextFollowUps.click();
    await expect(reloadFollowUps).toBeEnabled();
  }
  await expect(scheduledLink).toBeVisible();
  await expect(
    page.getByRole("link", { name: unscheduledName, exact: true }),
  ).toHaveCount(0);
  const beforeCustomers = customerReads;
  await page
    .getByRole("navigation", { name: "Không gian vận hành", exact: true })
    .getByRole("link", { name: "Khách hàng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Khách hàng", exact: true }),
  ).toBeVisible();
  await expect.poll(() => customerReads).toBeGreaterThan(beforeCustomers);
  await expect(
    page.getByRole("textbox", { name: "Tên khách hàng", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("combobox", { name: "Tìm theo", exact: true }),
  ).toHaveValue("name");
  expect(
    await page.evaluate(
      () =>
        (window as Window & { crm025NavigationToken?: string })
          .crm025NavigationToken,
    ),
  ).toBe(token);
});
