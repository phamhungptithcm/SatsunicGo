import { artifactDirectory } from "./artifact-path";
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { orderStageLabel, type Order } from "../../packages/domain/index";
import {
  seedIdentities,
  closeFixtures,
  product,
  ownedOrders,
  db,
  customer,
  askSource,
  sourceOrder,
  sourceOrders,
  statementRenderFixture,
} from "./fixtures";
import { invoke } from "./http";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

function documentAction(page: Page, id: string) {
  return page
    .locator(".documentList article")
    .filter({ has: page.getByText(id, { exact: true }) })
    .getByRole("button", { name: "Mở chứng từ", exact: true });
}

test("PROFILE-UI01 consent can be withdrawn and privacy request links preserve truthful scope", async ({
  page,
}) => {
  await login(page);
  await page.goto("/account/profile");
  const name = page.getByRole("textbox", { name: "Tên hiển thị", exact: true });
  await expect(name).toHaveValue("Synthetic customer-a");
  const consent = page.getByRole("checkbox", {
    name: "Nhận nội dung quảng bá qua kênh đã cấu hình",
    exact: true,
  });
  await consent.check();
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await db.doc(`users/${customer}`).get()).data()?.marketingConsent,
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Lưu hồ sơ", exact: true }),
  ).toBeEnabled();
  await consent.uncheck();
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await db.doc(`users/${customer}`).get()).data()?.marketingConsent,
    )
    .toBe(false);
  await page
    .getByRole("link", { name: "Yêu cầu xóa dữ liệu cá nhân", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Loại yêu cầu", exact: true }),
  ).toHaveValue("data-deletion");
  await expect(
    page.getByText(
      /Gửi yêu cầu không có nghĩa là dữ liệu đã được xuất hoặc xóa/,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Gửi yêu cầu hỗ trợ", exact: true }),
  ).toBeEnabled();
});

test("SUP-UI01 customer opens private ticket and staff resolves it through linked CRM", async ({
  page,
}) => {
  const subject = `Synthetic support ${randomUUID()}`;
  await login(page);
  await page.goto("/support");
  await page
    .getByRole("textbox", { name: "Chủ đề", exact: true })
    .fill(subject);
  await page
    .getByRole("textbox", { name: "Nội dung", exact: true })
    .fill("Synthetic support lifecycle only");
  await page
    .getByRole("button", { name: "Gửi yêu cầu hỗ trợ", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: subject, exact: true }),
  ).toBeVisible();
  const found = await db
    .collection("supportTickets")
    .where("subject", "==", subject)
    .get();
  expect(found.size).toBe(1);
  const id = found.docs[0].id;
  await login(page, "support");
  await page.goto(`/crm/support?ticket=${id}`);
  await expect(
    page.locator("summary").filter({ hasText: subject }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Phản hồi", exact: true })
    .fill("Synthetic resolution response");
  await page
    .getByRole("checkbox", { name: "Đánh dấu đã giải quyết", exact: true })
    .check();
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await expect
    .poll(
      async () => (await db.doc(`supportTickets/${id}`).get()).data()?.status,
    )
    .toBe("resolved");
  await login(page);
  await page.goto("/support");
  const ticket = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: subject, exact: true }) });
  await expect(ticket.getByText("Đã xử lý", { exact: true })).toBeVisible();
  await ticket.getByText("Xem và gửi phản hồi", { exact: true }).click();
  await expect(
    ticket.getByText("Synthetic resolution response", { exact: true }),
  ).toBeVisible();
  expect(
    (await db.collection("outboxJobs").where("resourceId", "==", id).get())
      .size,
  ).toBe(1);
});

test("PROFILE-B02 authorization loss clears recipient addresses and recovery restores them", async ({
  page,
}) => {
  const marker = `Synthetic private address ${randomUUID()}`;
  await db.collection("addresses").doc().set({
    ownerId: customer,
    recipient: "Synthetic private recipient",
    address: marker,
  });
  await login(page);
  await page.goto("/account/profile");
  await expect(page.getByText(marker, { exact: true })).toBeVisible();
  const saveAddress = page.getByRole("button", {
    name: "Lưu địa chỉ",
    exact: true,
  });
  await expect(saveAddress).toBeEnabled();
  await page
    .getByRole("textbox", { name: "Người nhận", exact: true })
    .fill("Unsaved private recipient");
  await page
    .getByRole("textbox", { name: "Số điện thoại", exact: true })
    .fill("0900000021");
  await page
    .getByRole("textbox", { name: "Địa chỉ", exact: true })
    .fill("Unsaved private address");
  try {
    await db.doc(`users/${customer}`).update({ locked: true });
    await expect(page.getByRole("alert")).toContainText(
      "Tài khoản đang bị khóa",
    );
    await expect(page.getByText(marker, { exact: true })).toHaveCount(0);
    await expect(saveAddress).toBeDisabled();
    await expect(
      page.getByRole("textbox", { name: "Người nhận", exact: true }),
    ).toHaveValue("");
    await expect(
      page.getByRole("textbox", { name: "Địa chỉ", exact: true }),
    ).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "Lưu hồ sơ", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("textbox", { name: "Tên hiển thị", exact: true }),
    ).toHaveValue("");
    await db.doc(`users/${customer}`).update({ locked: false });
    await expect(saveAddress).toBeDisabled();
    await page
      .getByRole("button", { name: "Tải lại thông tin", exact: true })
      .click();
    await expect(page.getByText(marker, { exact: true })).toBeVisible();
    await expect(saveAddress).toBeEnabled();
    await login(page, "customer-b");
    await page.goto("/account/profile");
    await expect(
      page.getByRole("textbox", { name: "Tên hiển thị", exact: true }),
    ).toHaveValue("Synthetic customer-b");
    await expect(page.getByText(marker, { exact: true })).toHaveCount(0);
  } finally {
    await db.doc(`users/${customer}`).update({ locked: false });
  }
});

test("ORDER-B01 own deep link opens outside the bounded list and foreign customer cannot read it", async ({
  page,
}) => {
  const id = await sourceOrder(`zz-sanity-order-${randomUUID()}`);
  const seedStarted = Date.now();
  await test.step("Batch seed 51 lower IDs without changing list-boundary assertions", () =>
    sourceOrders(
      Array.from({ length: 51 }, () => `000-sanity-order-${randomUUID()}`),
    ));
  await test.info().attach("bounded-fixture-timing", {
    body: JSON.stringify({
      orders: 51,
      elapsedMs: Date.now() - seedStarted,
      scope: "Demo fixture preparation only",
    }),
    contentType: "application/json",
  });
  const pageRows = await db
    .collection("orders")
    .where("ownerId", "==", customer)
    .limit(50)
    .get();
  expect(pageRows.docs.some((doc) => doc.id === id)).toBe(false);
  const name = (await db.doc(`orders/${id}`).get()).data()!.items[0].name;
  await login(page);
  await page.goto(`/account/orders/${id}`);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await login(page, "customer-b");
  await page.goto(`/account/orders/${id}`);
  await expect(
    page.getByRole("heading", { name: "Chưa tải được đơn hàng", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Xác nhận đã nhận đủ hàng", exact: true }),
  ).toHaveCount(0);
});

test("LOGIN-B02 native logout removes private order and staff document access across reload", async ({
  page,
}) => {
  const id = await sourceOrder();
  const name = (await db.doc(`orders/${id}`).get()).data()!.items[0].name;
  const createdDraft = await invoke<{ id: string }>("invoiceCommand", {
    action: "createDraft",
    orderId: id,
    operationId: randomUUID(),
  });
  await login(page, "owner");
  await page.goto(`/crm/documents?order=${id}`);
  const draft = documentAction(page, createdDraft.id);
  await expect(draft).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Cần tài khoản nhân viên được cấp quyền",
      exact: true,
    }),
  ).toBeVisible();
  await expect(draft).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Đăng nhập CRM", exact: true }),
  ).toBeVisible();
  await expect(draft).toHaveCount(0);
  await login(page);
  await page.goto(`/account/orders/${id}`);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Tài khoản của/ }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Đăng nhập để xem đơn của bạn",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Đăng nhập để xem đơn của bạn",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Xác nhận đã nhận đủ hàng", exact: true }),
  ).toHaveCount(0);
});

test("RECEIPT-B01 customer completion remains hidden before delivery, when held or underfunded", async ({
  page,
}) => {
  const id = await sourceOrder();
  await login(page);
  await page.goto(`/account/orders/${id}`);
  const confirm = page.getByRole("button", {
    name: "Xác nhận đã nhận đủ hàng",
    exact: true,
  });
  await expect(
    page.getByText("Chờ thanh toán toàn bộ", { exact: true }),
  ).toBeVisible();
  await expect(confirm).toHaveCount(0);
  // Guard-only fixtures exercise render conditions; they are not evidence of
  // verified receipts. FLOW-UI01 separately executes the authoritative lifecycle.
  const base = {
    stage: "DELIVERED",
    collected: 240000,
    finalApproved: true,
    packingComplete: true,
  };
  await db
    .doc(`orders/${id}`)
    .update({ ...base, tracking: "SYNTHETIC-GUARD-READY", version: 2 });
  await expect(confirm).toBeVisible();
  await db.doc(`orders/${id}`).update({
    hold: "Synthetic held receipt guard",
    tracking: "SYNTHETIC-GUARD-HELD",
    version: 3,
  });
  await expect(page.getByText(/SYNTHETIC-GUARD-HELD/)).toBeVisible();
  await expect(confirm).toHaveCount(0);
  await db.doc(`orders/${id}`).update({
    hold: "",
    collected: 239999,
    tracking: "SYNTHETIC-GUARD-UNFUNDED",
    version: 4,
  });
  await expect(page.getByText(/SYNTHETIC-GUARD-UNFUNDED/)).toBeVisible();
  await expect(confirm).toHaveCount(0);
  await db.doc(`orders/${id}`).update({
    stage: "IN_TRANSIT",
    collected: 240000,
    tracking: "SYNTHETIC-GUARD-INTRANSIT",
    version: 5,
  });
  await expect(page.getByText(/SYNTHETIC-GUARD-INTRANSIT/)).toBeVisible();
  await expect(confirm).toHaveCount(0);
});

test("FLOW-UI01 catalog staff operations link to explicit customer receipt confirmation", async ({
  page,
}) => {
  test.setTimeout(90000);
  // Checkout itself has native and response-loss coverage in CAT-H01/B02.
  // Start this operations scenario from its own isolated authoritative order.
  const id = await sourceOrder();
  let order = (await db.doc(`orders/${id}`).get()).data()!;
  await invoke(
    "command",
    {
      action: "verifyTransfer",
      orderId: id,
      expectedVersion: order.version,
      operationId: randomUUID(),
      payload: {
        amount: 240000,
        bankTransactionId: randomUUID(),
        evidence: "Synthetic bank fixture only",
        reason: "Emulator acceptance only",
      },
    },
    "finance",
  );
  await login(page, "owner");
  await page.goto(`/crm/orders?order=${id}`);
  const form = page
    .getByRole("combobox", { name: "Thao tác", exact: true })
    .locator("xpath=ancestor::form[1]");
  await expect(
    page.getByRole("heading", { name: order.items[0].name, exact: true }),
  ).toBeVisible();
  for (const [action, fields] of [
    ["claimPurchase", {}],
    [
      "recordPurchase",
      {
        quantity: "2",
        supplierOrder: "Synthetic supplier",
        actualSourceMinor: "0",
        evidence: "Synthetic purchase proof",
      },
    ],
    ["receive", { quantity: "2", evidence: "Synthetic receiving proof" }],
    [
      "pack",
      {
        weightGrams: "1000",
        length: "10",
        width: "20",
        height: "30",
        evidence: "Synthetic packing proof",
      },
    ],
    ["dispatch", {}],
    ["track", { tracking: "SYNTHETIC-CARRIER-UI" }],
  ] as const) {
    await test.step(action, async () => {
      await form
        .getByRole("combobox", { name: "Thao tác", exact: true })
        .selectOption(action);
      for (const [name, value] of Object.entries(fields))
        await form.locator(`[name="${name}"]`).fill(value);
      if (action === "pack") await form.locator('[name="checklist"]').check();
      if (action === "track") await form.locator('[name="delivered"]').check();
      const before = (await db.doc(`orders/${id}`).get()).data()!.version;
      await form.getByRole("button", { name: /./ }).click();
      await expect
        .poll(
          async () => (await db.doc(`orders/${id}`).get()).data()?.version,
          {
            timeout: 30000,
          },
        )
        .toBe(before + 1);
      const committed = (await db.doc(`orders/${id}`).get()).data() as Order;
      const detail = page
        .getByRole("heading", { name: order.items[0].name, exact: true })
        .locator("..");
      await expect(
        detail.getByText(orderStageLabel(committed), { exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await expect(form).toHaveCount(1);
      await expect(form.getByRole("button", { name: /./ })).toBeEnabled();
    });
  }
  await login(page);
  await page.goto(`/account/orders/${id}`);
  const confirm = page.getByRole("button", {
    name: "Xác nhận đã nhận đủ hàng",
    exact: true,
  });
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect
    .poll(async () => (await db.doc(`orders/${id}`).get()).data()?.stage)
    .toBe("COMPLETED");
  await expect(confirm).not.toBeVisible();
  order = (await db.doc(`orders/${id}`).get()).data()!;
  expect(order.collected).toBe(240000);
  expect(
    (
      await db
        .collection("financialEntries")
        .where("orderId", "==", id)
        .where("kind", "==", "payment")
        .get()
    ).size,
  ).toBe(1);
});

async function login(page: Page, identity = "customer-a") {
  await page.goto("/account");
  const currentAccount = page.getByRole("button", { name: /Tài khoản của/ });
  const testRole = page.getByRole("combobox", {
    name: "Vai trò thử",
    exact: true,
  });
  await expect(currentAccount.or(testRole)).toBeVisible();
  if (await currentAccount.isVisible()) {
    await currentAccount.click();
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  }
  await testRole.selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
}

test("CRM-B02 old queue response cannot replace a new order or leave stale actions during reload", async ({
  page,
}) => {
  const first = await sourceOrder(),
    second = await sourceOrder();
  const firstName = (await db.doc(`orders/${first}`).get()).data()!.items[0]
    .name;
  const secondName = (await db.doc(`orders/${second}`).get()).data()!.items[0]
    .name;
  await login(page, "owner");
  await page.goto(`/crm/orders?order=${first}`);
  await expect(
    page.getByRole("heading", { name: firstName, exact: true }),
  ).toBeVisible();
  let release!: () => void;
  let intercepted!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    intercepted = resolve;
  });
  let responseDelivered!: () => void;
  const delivered = new Promise<void>((resolve) => {
    responseDelivered = resolve;
  });
  let pending = true;
  await page.route("**/listWork", async (route) => {
    if (route.request().method() !== "POST" || !pending)
      return route.continue();
    pending = false;
    const response = await route.fetch();
    intercepted();
    await held;
    await route.fulfill({ response });
    responseDelivered();
  });
  try {
    await page.getByRole("button", { name: "Tải lại", exact: true }).click();
    await requested;
    await expect(
      page.getByRole("heading", { name: firstName, exact: true }),
    ).toHaveCount(0);
    await page.evaluate((url) => {
      history.pushState(
        { ...history.state, idx: (history.state?.idx ?? 0) + 1 },
        "",
        url,
      );
      dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
    }, `/crm/orders?order=${second}`);
    await expect(
      page.getByRole("heading", { name: secondName, exact: true }),
    ).toBeVisible();
    release();
    await delivered;
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(
      page.getByRole("heading", { name: firstName, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: secondName, exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});

for (const width of [390, 768, 1440]) {
  test(`CRM-UI${width} keyboard navigation, reduced motion and unfunded purchase guard`, async ({
    page,
  }) => {
    const duplicateKeys: string[] = [];
    page.on("console", (message) => {
      if (/same key|unique.*key/i.test(message.text()))
        duplicateKeys.push(message.text());
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const id = await sourceOrder();
    await login(page, "owner");
    await page.goto(`/crm/orders?order=${id}`);
    const form = page
      .getByRole("combobox", { name: "Thao tác", exact: true })
      .locator("xpath=ancestor::form[1]");
    await expect(form).toHaveCount(1);
    const menu = page.getByRole("button", {
      name: "Mở menu vận hành",
      exact: true,
    });
    if (await menu.isVisible()) {
      await menu.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByText("Menu vận hành", { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Đóng menu", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(menu).toBeFocused();
    }
    await expect(
      page.getByRole("combobox", { name: "Thao tác", exact: true }),
    ).toHaveCount(1);
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
    expect(
      await form.getByRole("button", { name: /./ }).evaluate((button) => {
        const style = getComputedStyle(button);
        return {
          animation: style.animationName,
          transition: style.transitionDuration,
          scroll: style.scrollBehavior,
        };
      }),
    ).toEqual({ animation: "none", transition: "0s", scroll: "auto" });
    await form
      .getByRole("combobox", { name: "Thao tác", exact: true })
      .selectOption("claimPurchase");
    const before = (await db.doc(`orders/${id}`).get()).data()!;
    await form.getByRole("button", { name: /./ }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /./ }),
    ).toBeVisible();
    await expect(form.getByRole("button", { name: /./ })).toBeEnabled();
    const after = (await db.doc(`orders/${id}`).get()).data()!;
    expect(after.version).toBe(before.version);
    expect(after.collected).toBe(0);
    expect(after.stage).toBe(before.stage);
    expect(duplicateKeys).toEqual([]);
    await page.screenshot({
      path: `${artifactDirectory}/crm-${width}-denied.png`,
    });
  });
}
async function openAsk(page: Page) {
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  if (!(await dialog.isVisible())) {
    const launcher = page.getByRole("button", {
      name: "Hỏi SatsunicGo",
      exact: true,
    });
    const resume = page.getByRole("button", {
      name: "Tiếp tục hội thoại",
      exact: true,
    });
    // Auth restoration may defer both controls; wait for a real opener rather
    // than choosing a branch from an instantaneous visibility check.
    const opener = launcher.or(resume).first();
    await expect(opener).toBeVisible();
    await opener.click();
    // The collapsed launcher can expand the composer before saved state loads.
    // A restored conversation then exposes its explicit resume action.
    await expect(dialog.or(resume).first()).toBeVisible();
    if (await resume.isVisible()) await resume.click();
  }
  await expect(dialog).toBeVisible();
  return dialog;
}
async function selectedCheckout(page: Page) {
  const p = await product();
  await login(page);
  await page.goto(`/products/${p.slug}/checkout`);
  await page
    .getByRole("combobox", { name: "Mẫu sản phẩm", exact: true })
    .selectOption("Large");
  await page
    .getByRole("spinbutton", { name: "Số lượng", exact: true })
    .fill("2");
  return p;
}

test("CAT-H01 listed checkout creates a frozen full-payment order without quote", async ({
  page,
}) => {
  await selectedCheckout(page);
  await page
    .getByRole("button", {
      name: "Đặt mua và tiếp tục thanh toán",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9-]+/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  const order = (await db.doc(`orders/${id}`).get()).data()!;
  expect(order).toMatchObject({
    ownerId: customer,
    purchaseKind: "catalog",
    collected: 0,
    refunded: 0,
    finalTotal: 240000,
  });
  expect(order).not.toHaveProperty("quote");
  await expect(
    page.getByText("Chờ thanh toán toàn bộ", { exact: true }).first(),
  ).toBeVisible();
});

test("CAT-B01 variant and quantity invalid states prevent submission", async ({
  page,
}) => {
  const p = await product();
  await login(page);
  await page.goto(`/products/${p.slug}/checkout`);
  const submit = page.getByRole("button", {
    name: "Đặt mua và tiếp tục thanh toán",
    exact: true,
  });
  await expect(submit).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Mẫu sản phẩm", exact: true })
    .selectOption("Large");
  for (const quantity of ["0", "1.5", "101"]) {
    await page
      .getByRole("spinbutton", { name: "Số lượng", exact: true })
      .fill(quantity);
    await expect(submit).toBeDisabled();
  }
});

test("CAT-B02 committed checkout response loss survives reload and produces one order", async ({
  page,
}) => {
  await selectedCheckout(page);
  const before = new Set((await ownedOrders()).map((o) => o.id));
  await page.route("**/catalogCheckout", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBeTruthy();
    await route.abort("failed");
  });
  await page
    .getByRole("button", {
      name: "Đặt mua và tiếp tục thanh toán",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Kiểm tra lại đơn và tiếp tục",
      exact: true,
    }),
  ).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
  await page.reload();
  await page
    .getByRole("button", { name: "Kiểm tra lại đơn và tiếp tục", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9-]+/);
  const created = (await ownedOrders()).filter((o) => !before.has(o.id));
  expect(created).toHaveLength(1);
  expect(created[0]).toMatchObject({ finalTotal: 240000, collected: 0 });
});

test("REQ-H01 unlisted request persists a draft then creates an unquoted custom order", async ({
  page,
}) => {
  await login(page);
  await page.goto("/request");
  const name = `Synthetic unlisted ${randomUUID()}`;
  await page
    .getByRole("textbox", { name: "Tên, link hoặc ảnh sản phẩm", exact: true })
    .fill(name);
  await page.reload();
  await expect(
    page.getByRole("textbox", {
      name: "Tên, link hoặc ảnh sản phẩm",
      exact: true,
    }),
  ).toHaveValue(name);
  await page
    .getByRole("button", { name: "Gửi yêu cầu →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9-]+/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  const order = (await db.doc(`orders/${id}`).get()).data()!;
  expect(order).toMatchObject({
    stage: "REQUESTED",
    collected: 0,
    refunded: 0,
  });
  expect(order.purchaseKind ?? "custom").toBe("custom");
  expect(order).not.toHaveProperty("acceptedAt");
});

test("ASK-B01 completed checkout response loss recovers through visible pending action after reload", async ({
  page,
}) => {
  const { p, cid } = await askSource();
  await login(page);
  await openAsk(page);
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  await dialog
    .getByRole("combobox", { name: "Sản phẩm", exact: true })
    .selectOption(p.id);
  await dialog
    .getByRole("combobox", { name: "Mẫu", exact: true })
    .selectOption("Large");
  await dialog
    .getByRole("spinbutton", { name: "Số lượng", exact: true })
    .fill("2");
  const before = new Set((await ownedOrders()).map((o) => o.id));
  await page.route("**/askWorkflow", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBeTruthy();
    await route.abort("failed");
  });
  await dialog
    .getByRole("button", { name: "Xác nhận lựa chọn và tạo đơn", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", {
      name: "Đối chiếu thao tác đang chờ",
      exact: true,
    }),
  ).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
  await page.reload();
  await openAsk(page);
  const recover = page.getByRole("button", {
    name: "Đối chiếu thao tác đang chờ",
    exact: true,
  });
  await recover.click();
  await expect(recover).toHaveCount(0);
  const created = (await ownedOrders()).filter((o) => !before.has(o.id));
  expect(created).toHaveLength(1);
  const c = (await db.doc(`askConversations/${customer}-${cid}`).get()).data()!;
  expect(c.orderId).toBe(created[0].id);
  const pay = dialog.getByRole("button", {
    name: "Mở bước thanh toán",
    exact: true,
  });
  await expect(pay).toBeDisabled();
  await dialog
    .getByRole("textbox", { name: "Người nhận", exact: true })
    .fill("Synthetic recipient");
  await dialog
    .getByRole("textbox", { name: "Số điện thoại", exact: true })
    .fill("0900000021");
  await dialog
    .getByRole("textbox", { name: "Địa chỉ nhận", exact: true })
    .fill("Synthetic address for browser tests only");
  await dialog
    .getByRole("button", { name: "Lưu thông tin nhận hàng", exact: true })
    .click();
  await expect(pay).toBeEnabled();
  await pay.click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Chưa tạo được trang thanh toán",
  );
  const order = (await db.doc(`orders/${c.orderId}`).get()).data()!;
  expect(order.collected).toBe(0);
  expect(
    JSON.stringify(
      (await db.doc(`askConversations/${customer}-${cid}`).get()).data()?.turns,
    ),
  ).not.toContain("Synthetic recipient");
});

test("DOC-B06 deferred issued detail cannot replace a newer draft selection", async ({
  page,
}) => {
  const orderId = await sourceOrder();
  const first = await invoke<{ id: string; version: number }>(
    "invoiceCommand",
    { action: "createDraft", orderId, operationId: randomUUID() },
  );
  const issued = await invoke<{ id: string; version: number }>(
    "invoiceCommand",
    {
      action: "issue",
      id: first.id,
      expectedVersion: first.version,
      operationId: randomUUID(),
    },
  );
  const draft = await invoke<{ id: string }>("invoiceCommand", {
    action: "createDraft",
    orderId,
    operationId: randomUUID(),
  });
  await login(page, "owner");
  await page.goto(`/crm/documents?order=${orderId}`);
  let release!: () => void, intercepted!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    intercepted = resolve;
  });
  let responseDelivered!: () => void;
  const delivered = new Promise<void>((resolve) => {
    responseDelivered = resolve;
  });
  await page.route("**/invoiceDetail", async (route) => {
    if (
      route.request().method() !== "POST" ||
      route.request().postDataJSON()?.data?.id !== issued.id
    )
      return route.continue();
    const response = await route.fetch();
    intercepted();
    await held;
    await route.fulfill({ response });
    responseDelivered();
  });
  try {
    await documentAction(page, issued.id).click();
    await requested;
    await expect(
      page.getByText("Đang mở chứng từ…", { exact: true }),
    ).toBeVisible();
    await documentAction(page, draft.id).click();
    await expect(page.getByText(/Số chứng từ: Bản nháp/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "In / Lưu PDF", exact: true }),
    ).toBeDisabled();
    release();
    await delivered;
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(page.getByText(/Số chứng từ: Bản nháp/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "In / Lưu PDF", exact: true }),
    ).toBeDisabled();
  } finally {
    release();
  }
});

test("PRINT-H01 current long statement retains all rows and totals in A4 print", async ({
  page,
}) => {
  const document = await statementRenderFixture();
  await login(page, "owner");
  await page.goto(`/crm/documents?order=${document.sourceOrderId}`);
  await documentAction(page, document.id).click();
  await expect(
    page.getByRole("button", { name: "In / Lưu PDF", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".salesStatement tbody tr")).toHaveCount(20);
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({
    path: `${artifactDirectory}/statement-current.pdf`,
    format: "A4",
    printBackground: true,
  });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  expect(pdf.length).toBeGreaterThan(10000);
});

test("DOC-B05 committed draft with failed detail read reports saved state and recovers without duplicate creation", async ({
  page,
}) => {
  const orderId = await sourceOrder();
  await login(page, "owner");
  await page.goto(`/crm/documents?order=${orderId}`);
  await page.route("**/invoiceDetail", (route) =>
    route.request().method() === "POST"
      ? route.abort("failed")
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "Tạo bản nháp từ đơn", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Thao tác đã lưu nhưng chưa tải được chứng từ",
  );
  await expect(
    page.getByRole("button", {
      name: "Kiểm tra lại cùng thao tác",
      exact: true,
    }),
  ).toHaveCount(0);
  const docs = await db
    .collection("salesDocuments")
    .where("sourceOrderId", "==", orderId)
    .get();
  expect(docs.size).toBe(1);
  await page.unrouteAll({ behavior: "wait" });
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await documentAction(page, docs.docs[0].id).click();
  await expect(page.getByText(/Số chứng từ: Bản nháp/)).toBeVisible();
  expect(
    (
      await db
        .collection("salesDocuments")
        .where("sourceOrderId", "==", orderId)
        .get()
    ).size,
  ).toBe(1);
});

test("DOC-B02 draft response loss and reload retry create one document; native share and revoke protect identity", async ({
  page,
  browser,
}) => {
  const orderId = await sourceOrder();
  await login(page, "owner");
  await page.goto(`/crm/documents?order=${orderId}`);
  await page
    .getByRole("textbox", { name: "Mã đơn đã chốt tổng cuối", exact: true })
    .fill(orderId);
  await page.route("**/invoiceCommand", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBeTruthy();
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Tạo bản nháp từ đơn", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Kiểm tra lại cùng thao tác",
      exact: true,
    }),
  ).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
  await page.reload();
  await page
    .getByRole("button", { name: "Kiểm tra lại cùng thao tác", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Xuất và đóng băng chứng từ",
      exact: true,
    }),
  ).toBeVisible();
  const rows = await db
    .collection("salesDocuments")
    .where("sourceOrderId", "==", orderId)
    .get();
  expect(rows.size).toBe(1);
  await page
    .getByRole("button", { name: "Xuất và đóng băng chứng từ", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Thu hồi toàn bộ link chia sẻ",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByText("Chia sẻ link trong 24 giờ", { exact: true }).click();
  await page
    .getByRole("button", { name: "Tạo link để chia sẻ thủ công", exact: true })
    .click();
  const input = page.getByRole("textbox", {
    name: "Link chia sẻ chứng từ",
    exact: true,
  });
  await expect(input).toBeVisible();
  const sharedURL = await input.inputValue();
  const anonymous = await browser.newContext();
  const shared = await anonymous.newPage();
  try {
    await shared.goto(sharedURL);
    await expect(
      shared.getByRole("heading", {
        name: "Chứng từ đơn hàng nội bộ",
        exact: true,
      }),
    ).toBeVisible();
    await expect(shared).toHaveURL("http://127.0.0.1:5187/documents/shared");
    await expect(
      shared.getByText("Synthetic customer-a", { exact: false }),
    ).toHaveCount(0);
    await expect(shared.locator("body")).not.toContainText(orderId);
    await page
      .getByRole("button", {
        name: "Thu hồi toàn bộ link chia sẻ",
        exact: true,
      })
      .click();
    await expect(input).toHaveCount(0);
    await shared.goto(sharedURL);
    await expect(shared.getByRole("alert")).toContainText(
      "Liên kết đã hết hạn",
    );
  } finally {
    await anonymous.close();
  }
  const current = (await db.doc(`orders/${orderId}`).get()).data()!;
  expect(current.collected).toBe(0);
});

test("DOC-B03 failed list recovers, empty filter stays empty, and order filter reloads after navigation", async ({
  page,
}) => {
  await login(page);
  await page.route("**/invoiceList", (route) =>
    route.request().method() === "POST"
      ? route.abort("failed")
      : route.continue(),
  );
  await page.goto("/account/documents?order=synthetic-empty");
  await expect(page.getByRole("alert")).toContainText("Chưa tải được chứng từ");
  await page.unrouteAll({ behavior: "wait" });
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(
    page.getByText("Chưa có chứng từ trong trang này.", { exact: true }),
  ).toBeVisible();
});

test("CRM-B01 customer identity cannot open protected CRM", async ({
  page,
}) => {
  await login(page);
  await page.goto("/crm/documents");
  await expect(
    page.getByRole("heading", {
      name: "Cần tài khoản nhân viên được cấp quyền",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tạo bản nháp từ đơn", exact: true }),
  ).toHaveCount(0);
});

test("OUT-B01 native uncertain email reconciliation does not resend and repeated current filter preserves rows", async ({
  page,
}) => {
  const id = `sanity-job-${randomUUID()}`;
  const latest = await db
    .collection("outboxJobs")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  const at = latest.docs[0]?.get("createdAt");
  const createdAt =
    Math.max(
      Date.now(),
      typeof at === "number" && Number.isFinite(at) ? at : 0,
    ) + 1000;
  await db.doc(`outboxJobs/${id}`).set({
    ownerId: customer,
    createdAt,
    action: "invoiceIssued",
    state: "inAppDelivered",
    emailState: "unknown",
    version: 1,
    attempts: 1,
    claimId: "synthetic-claim",
  });
  await login(page, "owner");
  await page.goto("/crm/activity");
  await page
    .getByRole("group", { name: "Nhóm nhật ký", exact: true })
    .getByRole("button", { name: "Thông báo", exact: true })
    .click();
  const timestamp = await page.evaluate(
    (value) => new Date(value).toLocaleString("vi-VN"),
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
    .fill("Synthetic provider confirms no send; fixture only");
  await row
    .getByRole("button", { name: "Lưu đối soát, chưa gửi lại", exact: true })
    .click();
  await expect
    .poll(
      async () => (await db.doc(`outboxJobs/${id}`).get()).data()?.emailState,
    )
    .toBe("failed");
  await page
    .getByRole("group", { name: "Nhóm nhật ký", exact: true })
    .getByRole("button", { name: "Thông báo", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Gửi thất bại" }).first(),
  ).toBeVisible();
  const job = (await db.doc(`outboxJobs/${id}`).get()).data()!;
  expect(job.version).toBe(2);
  expect(job.attempts).toBe(1);
});

for (const width of [390, 768, 1440]) {
  test(`UI-H${width} responsive catalog keyboard and Ask dialog focus remain usable`, async ({
    page,
  }) => {
    await askSource();
    await page.setViewportSize({ width, height: 1000 });
    await selectedCheckout(page);
    const control = page.getByRole("spinbutton", {
      name: "Số lượng",
      exact: true,
    });
    await control.focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", {
        name: "Đặt mua và tiếp tục thanh toán",
        exact: true,
      }),
    ).toBeFocused();
    const dimensions = await page.locator("body").evaluate((element) => ({
      viewport: window.innerWidth,
      width: element.scrollWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
    await page.screenshot({
      path: `${artifactDirectory}/checkout-${width}.png`,
      fullPage: true,
    });
    const dialog = await openAsk(page);
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
