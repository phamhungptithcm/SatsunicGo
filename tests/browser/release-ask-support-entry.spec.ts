import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  db,
  customer,
  otherCustomer,
  ownedOrders,
  sourceOrder,
} from "./fixtures";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

test("ASK026-S06 confirmed lost open allows an explicit follow-up without a second ticket", async ({
  page,
}) => {
  const { cid } = await askSource();
  const subject = "Ask · hội thoại " + cid;
  const original = "Synthetic confirmed open " + randomUUID();
  const followUp = "Synthetic explicit follow up " + randomUUID();
  const dialog = await open(page);
  const input = dialog.getByRole("textbox", {
    name: "Nội dung cần hỗ trợ",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", { name: "Gửi cho nhân viên", exact: true }),
  ).toBeEnabled();
  await input.fill(original);
  await page.route("**/workspaceCommand", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.abort("failed");
  });
  await dialog
    .getByRole("button", { name: "Gửi cho nhân viên", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("Chưa gửi được");
  await expect
    .poll(
      async () =>
        (
          await db
            .collection("supportTickets")
            .where("ownerId", "==", customer)
            .where("subject", "==", subject)
            .get()
        ).size,
    )
    .toBe(1);
  await expect(dialog.locator("p").filter({ hasText: original })).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
  await input.fill(followUp);
  await dialog
    .getByRole("button", { name: "Gửi cho nhân viên", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (
          await db
            .collection("supportTickets")
            .where("ownerId", "==", customer)
            .where("subject", "==", subject)
            .get()
        ).docs[0]?.data().version,
    )
    .toBe(2);
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("p").filter({ hasText: followUp })).toHaveText(
    `Bạn: ${followUp}`,
  );
  const tickets = await db
    .collection("supportTickets")
    .where("ownerId", "==", customer)
    .where("subject", "==", subject)
    .get();
  expect(tickets.size).toBe(1);
  expect(tickets.docs[0].data().version).toBe(2);
  expect(tickets.docs[0].data().message).toBe(original);
  expect((await tickets.docs[0].ref.collection("messages").get()).size).toBe(1);
});

test("ASK026-S05 unknown uncommitted send keeps identity and requires original text after reload", async ({
  page,
}) => {
  const { cid } = await askSource();
  const subject = "Ask · hội thoại " + cid;
  const original = "Synthetic original pending question " + randomUUID();
  const different = "Synthetic changed pending question " + randomUUID();
  const dialog = await open(page);
  await expect(
    dialog.getByRole("button", { name: "Gửi cho nhân viên", exact: true }),
  ).toBeEnabled();
  await dialog
    .getByRole("textbox", { name: "Nội dung cần hỗ trợ", exact: true })
    .fill(original);
  await page.route("**/workspaceCommand", (route) =>
    route.request().method() === "POST"
      ? route.abort("failed")
      : route.continue(),
  );
  await dialog
    .getByRole("button", { name: "Gửi cho nhân viên", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("Chưa gửi được");
  const stored = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    "ask-support-pending:" + customer + ":" + cid,
  );
  expect(stored).not.toContain(original);
  await page.unrouteAll({ behavior: "wait" });
  await page.reload();
  const restored = await reopen(page);
  const text = restored.getByRole("textbox", {
    name: "Nội dung cần hỗ trợ",
    exact: true,
  });
  await expect(
    restored.getByRole("button", { name: "Gửi cho nhân viên", exact: true }),
  ).toBeEnabled();
  await text.fill(different);
  let commands = 0;
  await page.route("**/workspaceCommand", (route) => {
    if (route.request().method() === "POST") commands++;
    return route.continue();
  });
  await restored
    .getByRole("button", { name: "Gửi cho nhân viên", exact: true })
    .click();
  await expect(restored.getByRole("alert")).toContainText(
    "Nhập lại đúng nội dung đã gửi",
  );
  expect(commands).toBe(0);
  expect(
    (
      await db
        .collection("supportTickets")
        .where("ownerId", "==", customer)
        .where("subject", "==", subject)
        .get()
    ).size,
  ).toBe(0);
  await text.fill(original);
  await restored
    .getByRole("button", { name: "Gửi cho nhân viên", exact: true })
    .click();
  await expect(restored.getByText(original, { exact: true })).toBeVisible();
  expect(commands).toBe(1);
  await expect
    .poll(
      async () =>
        (
          await db
            .collection("supportTickets")
            .where("ownerId", "==", customer)
            .where("subject", "==", subject)
            .get()
        ).size,
    )
    .toBe(1);
});

test("ASK026-S04 general ticket history remains distinct when the same conversation has an order", async ({
  page,
}) => {
  const { cid } = await askSource();
  const orderId = await sourceOrder();
  const ticketId = "general-continuity-" + randomUUID();
  const message = "Synthetic earlier conversation help " + randomUUID();
  const ticket = {
    ownerId: customer,
    subject: "Ask · hội thoại " + cid,
    message,
    status: "open",
    version: 1,
    createdAt: Date.now(),
  };
  await db.doc("supportTickets/" + ticketId).set(ticket);
  await db.doc("askConversations/" + customer + "-" + cid).update({ orderId });
  const before = JSON.stringify(
    (await db.doc("orders/" + orderId).get()).data(),
  );
  const dialog = await open(page, "Hỗ trợ hội thoại");
  await expect(dialog.getByText(message, { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole("button", {
      name: "Hỗ trợ / đổi trả trong chat",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    (
      await db
        .collection("supportTickets")
        .where("ownerId", "==", customer)
        .where("subject", "==", ticket.subject)
        .get()
    ).size,
  ).toBe(1);
  expect((await db.doc("supportTickets/" + ticketId).get()).data()).toEqual(
    ticket,
  );
  expect(JSON.stringify((await db.doc("orders/" + orderId).get()).data())).toBe(
    before,
  );
  expect(
    (await db.doc("askCurrent/" + customer).get()).data()?.conversationId,
  ).toBe(cid);
  await page.screenshot({
    path: artifactDirectory + "/ask-support-continuity.png",
    fullPage: true,
  });
});

test("ASK026-S03 general support uses durable fresh context before a held model answer", async ({
  page,
}) => {
  const initial = await askSource();
  expect(
    (await db.doc("askCurrent/" + customer).get()).data()?.conversationId,
  ).toBe(initial.cid);
  await db.doc("askConversations/" + customer + "-" + initial.cid).delete();
  await db.doc("askCurrent/" + customer).delete();
  const before = (await ownedOrders()).map((o) => o.id).sort();
  const message = "Synthetic fresh support " + randomUUID();
  let release!: () => void,
    requested!: () => void,
    cid = "";
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/ask", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    cid = route.request().postDataJSON().data.conversationId;
    expect(typeof cid).toBe("string");
    requested();
    await hold;
    await route.fulfill({
      contentType: "text/event-stream",
      body:
        "data: " +
        JSON.stringify({
          result: {
            language: "vi",
            title: "Synthetic held answer",
            paragraphs: ["Synthetic response; no live provider"],
            bullets: [],
            sourceIds: [],
            action: "manual",
          },
        }) +
        "\n\n",
    });
  });
  try {
    await page.goto("/account");
    const currentResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/currentAskConversation") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("customer-a");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    const current = await currentResponse;
    expect(current.ok()).toBe(true);
    const envelope = await current.json();
    const restoredId = (envelope.result ?? envelope.data)?.conversationId;
    expect(typeof restoredId).toBe("string");
    await expect
      .poll(
        async () =>
          (
            await db
              .doc("askConversations/" + customer + "-" + restoredId)
              .get()
          ).data()?.ownerId,
      )
      .toBe(customer);
    await page
      .getByRole("button", { name: "Hỏi SatsunicGo", exact: true })
      .click();
    const question = page.getByRole("textbox", {
      name: "Hỏi SatsunicGo",
      exact: true,
    });
    await question.fill("Tôi muốn mua một sản phẩm chưa có trong danh mục");
    await question.press("Enter");
    await started;
    expect(cid).toBe(restoredId);
    const initialContext = (
      await db.doc("askConversations/" + customer + "-" + cid).get()
    ).data()!;
    expect(initialContext.ownerId).toBe(customer);
    expect(initialContext.version).toBe(0);
    expect(initialContext.orderId).toBeUndefined();
    expect(
      (await db.doc("askCurrent/" + customer).get()).data()?.conversationId,
    ).toBe(cid);
    const dialog = page.getByRole("dialog", {
      name: "SatsunicGo",
      exact: true,
    });
    await dialog
      .getByRole("button", { name: "Hỗ trợ trong chat", exact: true })
      .click();
    const send = dialog.getByRole("button", {
      name: "Gửi cho nhân viên",
      exact: true,
    });
    await expect(send).toBeEnabled();
    await dialog
      .getByRole("textbox", { name: "Nội dung cần hỗ trợ", exact: true })
      .fill(message);
    await send.click();
    await expect
      .poll(
        async () =>
          (
            await db
              .collection("supportTickets")
              .where("ownerId", "==", customer)
              .where("subject", "==", "Ask · hội thoại " + cid)
              .get()
          ).size,
      )
      .toBe(1);
    await expect(
      dialog.locator("p").filter({ hasText: message }),
    ).toBeVisible();
    expect(
      (await db.doc("askCurrent/" + customer).get()).data()?.conversationId,
    ).toBe(cid);
    const conversation = (
      await db.doc("askConversations/" + customer + "-" + cid).get()
    ).data()!;
    expect(conversation.ownerId).toBe(customer);
    expect(conversation.orderId).toBeUndefined();
    expect(
      (
        await db
          .collection("supportTickets")
          .where("ownerId", "==", customer)
          .where("subject", "==", "Ask · hội thoại " + cid)
          .get()
      ).size,
    ).toBe(1);
    expect((await ownedOrders()).map((o) => o.id).sort()).toEqual(before);
    await page.screenshot({
      path: artifactDirectory + "/ask-support-fresh-context.png",
      fullPage: true,
    });
  } finally {
    release();
  }
  await expect
    .poll(
      async () =>
        (await db.doc("askConversations/" + customer + "-" + cid).get())
          .data()
          ?.turns?.at(-1)?.answer?.title,
    )
    .toBe("Synthetic held answer");
});
async function open(page: Page, label = "Hỗ trợ trong chat") {
  await page.goto("/account");
  const currentResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/currentAskConversation") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption("customer-a");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  const current = await currentResponse;
  expect(current.ok()).toBe(true);
  const envelope = await current.json();
  const id = (envelope.result ?? envelope.data)?.conversationId;
  expect(typeof id).toBe("string");
  await expect
    .poll(
      async () =>
        (await db.doc("askConversations/" + customer + "-" + id).get()).data()
          ?.ownerId,
    )
    .toBe(customer);
  // Seeded conversation cases enter through the real public composer and
  // await its restored-context resume control, rather than early launcher state.
  const restoredResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/currentAskConversation") &&
      response.request().method() === "POST",
  );
  await page.goto("/");
  expect((await restoredResponse).ok()).toBe(true);
  await expect(
    page.getByRole("button", { name: "Tiếp tục hội thoại", exact: true }),
  ).toBeVisible();
  return reopen(page, label);
}
async function reopen(page: Page, label = "Hỗ trợ trong chat") {
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  const launcher = page.getByRole("button", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  const resume = page.getByRole("button", {
    name: "Tiếp tục hội thoại",
    exact: true,
  });
  await expect(launcher.or(resume).first()).toBeVisible();
  await launcher.or(resume).first().click();
  await expect(dialog.or(resume).first()).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: label, exact: true }).click();
  return dialog;
}
test("ASK026-S02 pre-order support persists privately after a lost response and reload without an order", async ({
  page,
}) => {
  const { cid } = await askSource();
  const subject = `Ask · hội thoại ${cid}`;
  const message = `Synthetic general help ${randomUUID()}`;
  const foreign = `Synthetic foreign help ${randomUUID()}`;
  await db.doc(`supportTickets/000-foreign-${randomUUID()}`).set({
    ownerId: otherCustomer,
    subject,
    message: foreign,
    status: "open",
    version: 1,
    createdAt: Date.now(),
  });
  const before = (await ownedOrders()).map((o) => o.id).sort();
  const dialog = await open(page);
  const send = dialog.getByRole("button", {
    name: "Gửi cho nhân viên",
    exact: true,
  });
  await expect(send).toBeEnabled();
  await expect(dialog.getByText(foreign, { exact: true })).toHaveCount(0);
  await dialog
    .getByRole("textbox", { name: "Nội dung cần hỗ trợ", exact: true })
    .fill(message);
  let commands = 0;
  await page.route("**/workspaceCommand", async (route) => {
    if (
      route.request().method() !== "POST" ||
      route.request().postDataJSON()?.data?.action !== "openTicket"
    )
      return route.continue();
    commands++;
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.abort("failed");
  });
  await send.click();
  await expect(dialog.getByRole("alert")).toContainText("Chưa gửi được");
  await expect
    .poll(
      async () =>
        (
          await db
            .collection("supportTickets")
            .where("ownerId", "==", customer)
            .where("subject", "==", subject)
            .get()
        ).size,
    )
    .toBe(1);
  await expect(
    dialog.getByRole("textbox", { name: "Nội dung cần hỗ trợ", exact: true }),
  ).toHaveValue(message);
  await page.unrouteAll({ behavior: "wait" });
  await page.reload();
  const restored = await reopen(page);
  await expect(restored.getByText(message, { exact: true })).toBeVisible();
  await expect(restored.getByText(foreign, { exact: true })).toHaveCount(0);
  expect(commands).toBe(1);
  expect(
    (
      await db
        .collection("supportTickets")
        .where("ownerId", "==", customer)
        .where("subject", "==", subject)
        .get()
    ).size,
  ).toBe(1);
  expect(
    (await db.doc(`askCurrent/${customer}`).get()).data()?.conversationId,
  ).toBe(cid);
  expect((await ownedOrders()).map((o) => o.id).sort()).toEqual(before);
  expect(
    (await db.doc(`askConversations/${customer}-${cid}`).get()).data()?.orderId,
  ).toBeUndefined();
  await page.screenshot({
    path: `${artifactDirectory}/ask-general-support-restored.png`,
    fullPage: true,
  });
});
