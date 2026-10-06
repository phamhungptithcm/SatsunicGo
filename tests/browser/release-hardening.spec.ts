import { test, expect, type Page, type Route } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, sourceOrder, db } from "./fixtures";
import { invoke } from "./http";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

async function login(page: Page, identity: string) {
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
}
async function navigate(page: Page, url: string) {
  await page.evaluate((next) => {
    history.pushState(
      { usr: null, key: crypto.randomUUID(), idx: 1 },
      "",
      next,
    );
    dispatchEvent(new PopStateEvent("popstate"));
  }, url);
}
async function settled(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
function holdPost(matches: (route: Route) => boolean) {
  let release!: () => void, requested!: () => void, delivered!: () => void;
  const held = new Promise<void>((r) => {
    release = r;
  });
  const committed = new Promise<void>((r) => {
    requested = r;
  });
  const delivery = new Promise<void>((r) => {
    delivered = r;
  });
  return {
    release,
    committed,
    delivery,
    handler: async (route: Route) => {
      if (route.request().method() !== "POST" || !matches(route))
        return route.continue();
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      requested();
      await held;
      await route.fulfill({ response });
      delivered();
    },
  };
}

test("CRM item pending target read cannot expose previous ticket actions", async ({
  page,
}) => {
  const subjects = [
    "Synthetic current " + randomUUID(),
    "Synthetic target " + randomUUID(),
  ];
  const tickets: { id: string }[] = [];
  for (const subject of subjects)
    tickets.push(
      await invoke<{ id: string }>(
        "workspaceCommand",
        {
          action: "openTicket",
          operationId: randomUUID(),
          payload: {
            subject,
            message: "Synthetic target read regression",
            topic: "purchase",
          },
        },
        "customer-a",
      ),
    );
  await login(page, "support");
  await page.goto(`/crm/support?ticket=${tickets[0].id}`);
  await expect(
    page.locator("summary").filter({ hasText: subjects[0] }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Phản hồi", exact: true }),
  ).toBeVisible();
  const held = holdPost(
    (route) =>
      route.request().postDataJSON()?.data?.kind === "supportTickets" &&
      route.request().postDataJSON()?.data?.id === tickets[1].id,
  );
  await page.route("**/listWork", held.handler);
  try {
    await navigate(page, `/crm/support?ticket=${tickets[1].id}`);
    await held.committed;
    await expect(
      page.getByRole("status").filter({ hasText: "Đang tải hội thoại…" }),
    ).toBeVisible();
    await expect(
      page.locator("summary").filter({ hasText: subjects[0] }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Phản hồi", exact: true }),
    ).toHaveCount(0);
    held.release();
    await expect(
      page.locator("summary").filter({ hasText: subjects[1] }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Phản hồi", exact: true }),
    ).toBeVisible();
  } finally {
    held.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("HARD-UI01 committed ticket reply cannot restore old ticket after navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  const firstSubject = `Synthetic deferred ${randomUUID()}`,
    secondSubject = `Synthetic next ${randomUUID()}`;
  const tickets: { id: string; version: number }[] = [];
  for (const subject of [firstSubject, secondSubject])
    tickets.push(
      await invoke<{ id: string; version: number }>(
        "workspaceCommand",
        {
          action: "openTicket",
          operationId: randomUUID(),
          payload: {
            subject,
            message: "Synthetic lifecycle test",
            topic: "purchase",
          },
        },
        "customer-a",
      ),
    );
  await login(page, "support");
  await page.goto(`/crm/support?ticket=${tickets[0].id}`);
  await expect(
    page.locator("summary").filter({ hasText: firstSubject }),
  ).toBeVisible();
  const held = holdPost(
    (route) => route.request().postDataJSON()?.data?.action === "replyTicket",
  );
  await page.route("**/workspaceCommand", held.handler);
  try {
    await page
      .getByRole("textbox", { name: "Phản hồi", exact: true })
      .fill("Synthetic original reply");
    await page
      .getByRole("button", { name: "Gửi phản hồi", exact: true })
      .click();
    await held.committed;
    await navigate(page, `/crm/support?ticket=${tickets[1].id}`);
    await expect(
      page.locator("summary").filter({ hasText: secondSubject }),
    ).toBeVisible();
    held.release();
    await held.delivery;
    await settled(page);
    await expect(
      page.locator("summary").filter({ hasText: firstSubject }),
    ).toHaveCount(0);
    await expect(
      page.locator("summary").filter({ hasText: secondSubject }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Gửi phản hồi", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("textbox", { name: "Phản hồi", exact: true })
      .fill("Synthetic current ticket response");
    await page
      .getByRole("button", { name: "Gửi phản hồi", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await db.doc(`supportTickets/${tickets[1].id}`).get()).data()
            ?.version,
      )
      .toBe(tickets[1].version + 1);
    await expect(
      page.getByText("Synthetic current ticket response", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("summary").filter({ hasText: secondSubject }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    expect(
      (await db.doc(`supportTickets/${tickets[0].id}`).get()).data()?.version,
    ).toBe(tickets[0].version + 1);
  } finally {
    held.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test("HARD-UI02 committed upload does not reload an obsolete order image list", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const first = await sourceOrder(),
    second = await sourceOrder();
  const nextName = (await db.doc(`orders/${second}`).get()).data()!.items[0]
    .name;
  const description = `Synthetic private upload ${randomUUID()}`;
  await login(page, "owner");
  let oldReads = 0;
  await page.route("**/listOrderImages", (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().postDataJSON()?.data?.orderId === first
    )
      oldReads++;
    return route.continue();
  });
  await page.goto(`/crm/orders?order=${first}`);
  const images = page.locator("details.orderImages");
  if (!(await images.evaluate((el) => (el as HTMLDetailsElement).open)))
    await images.locator("summary").click();
  await expect(
    images.getByText("Chưa có ảnh trong phạm vi được xem.", { exact: true }),
  ).toBeVisible();
  await images.getByLabel("Ảnh", { exact: true }).setInputFiles({
    name: "synthetic.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await images
    .getByRole("textbox", { name: "Mô tả", exact: true })
    .fill(description);
  const held = holdPost(
    (route) => route.request().postDataJSON()?.data?.orderId === first,
  );
  await page.route("**/uploadOrderImage", held.handler);
  try {
    await images
      .getByRole("button", { name: "Tải ảnh riêng lên", exact: true })
      .click();
    await held.committed;
    const before = oldReads;
    await navigate(page, `/crm/orders?order=${second}`);
    await expect(
      page.getByRole("heading", { name: nextName, exact: true }),
    ).toBeVisible();
    held.release();
    await held.delivery;
    await settled(page);
    if (!(await images.evaluate((el) => (el as HTMLDetailsElement).open)))
      await images.locator("summary").click();
    await expect(
      images.getByRole("button", { name: "Tải ảnh riêng lên", exact: true }),
    ).toBeEnabled();
    await expect(images.getByText(description, { exact: true })).toHaveCount(0);
    expect(oldReads).toBe(before);
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
  } finally {
    held.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("HARD-UI03 deferred private image read cannot publish after order navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const first = await sourceOrder(),
    second = await sourceOrder();
  const nextName = (await db.doc(`orders/${second}`).get()).data()!.items[0]
    .name;
  const description = `Synthetic old image ${randomUUID()}`;
  const image = await invoke<{ id: string }>(
    "uploadOrderImage",
    {
      orderId: first,
      kind: "request",
      mime: "image/png",
      base64: png,
      description,
      operationId: randomUUID(),
    },
    "customer-a",
  );
  await login(page, "owner");
  await page.goto(`/crm/orders?order=${first}`);
  const images = page.locator("details.orderImages");
  if (!(await images.evaluate((el) => (el as HTMLDetailsElement).open)))
    await images.locator("summary").click();
  const held = holdPost(
    (route) => route.request().postDataJSON()?.data?.id === image.id,
  );
  await page.route("**/readOrderImage", held.handler);
  try {
    await images
      .getByRole("button", {
        name: `Ảnh hàng cần mua · ${description}`,
        exact: true,
      })
      .click();
    await held.committed;
    await navigate(page, `/crm/orders?order=${second}`);
    await expect(
      page.getByRole("heading", { name: nextName, exact: true }),
    ).toBeVisible();
    held.release();
    await held.delivery;
    await settled(page);
    if (!(await images.evaluate((el) => (el as HTMLDetailsElement).open)))
      await images.locator("summary").click();
    await expect(
      images.getByRole("button", { name: "Tải ảnh riêng lên", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("img", { name: description, exact: true }),
    ).toHaveCount(0);
  } finally {
    held.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});
