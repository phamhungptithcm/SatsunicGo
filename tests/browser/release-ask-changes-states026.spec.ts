import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  sourceOrder,
  db,
  customer,
} from "./fixtures";
import { invoke } from "./http";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

async function fixture(language: "vi" | "en", proposal = false) {
  const { cid } = await askSource();
  const orderId = await sourceOrder();
  const ref = db.doc("orders/" + orderId);
  const reason = "Synthetic reviewed cancellation " + randomUUID();
  let proposalId: string | undefined;
  if (proposal) {
    let order = (await ref.get()).data()!;
    await invoke("command", {
      action: "verifyTransfer",
      orderId,
      expectedVersion: order.version,
      operationId: randomUUID(),
      payload: {
        amount: order.finalTotal,
        bankTransactionId: randomUUID(),
        evidence: "Synthetic verified full catalog funds",
        reason: "Synthetic emulator receipt",
      },
    });
    order = (await ref.get()).data()!;
    const result = await invoke<{ id: string }>("changeCommand", {
      action: "propose",
      orderId,
      expectedVersion: order.version,
      operationId: randomUUID(),
      payload: {
        kind: "cancellation",
        reason,
        termsVersion: "synthetic-sanity-v1",
        lines: [{ line: 0, cancelQuantity: order.items[0].quantity }],
        finalPayable: 0,
        actualCosts: 0,
        evidence: "Synthetic private staff evidence",
      },
    });
    proposalId = result.id;
  }
  const conversation = db.doc("askConversations/" + customer + "-" + cid);
  const current = (await conversation.get()).data()!;
  const turns = current.turns;
  turns[0].answer.language = language;
  await conversation.update({ orderId, turns });
  return { ref, proposalId, reason };
}
async function open(page: Page, language: "vi" | "en") {
  await page.goto("/account");
  const restored = page.waitForResponse(
    (r) =>
      r.url().endsWith("/currentAskConversation") &&
      r.request().method() === "POST",
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
  expect((await restored).ok()).toBe(true);
  const next = page.waitForResponse(
    (r) =>
      r.url().endsWith("/currentAskConversation") &&
      r.request().method() === "POST",
  );
  await page.goto("/");
  expect((await next).ok()).toBe(true);
  await page
    .getByRole("button", {
      name: /^(Tiếp tục hội thoại|Continue conversation)$/,
    })
    .click();
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  await expect(dialog).toBeVisible();
  const disclosure = dialog.locator("details").filter({
    has: page
      .locator("summary")
      .filter({
        hasText: language === "vi" ? /^Thay đổi đơn hàng$/ : /^Order changes$/,
      }),
  });
  await expect(disclosure.locator("summary")).toBeVisible();
  return { dialog, disclosure };
}

test("ASK026-STATE01 proposal disclosure loads before verified empty", async ({
  page,
}) => {
  const f = await fixture("vi");
  const before = JSON.stringify((await f.ref.get()).data());
  const { disclosure } = await open(page, "vi");
  let release!: () => void,
    requests = 0;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/Listen/channel**", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests++;
    await hold;
    await route.continue();
  });
  try {
    await disclosure.locator("summary").click();
    await expect(
      disclosure
        .getByRole("status")
        .filter({ hasText: "Đang tải đề xuất thay đổi…" }),
    ).toBeVisible();
    await expect(
      disclosure.getByText("Chưa có đề xuất thay đổi cho đơn này.", {
        exact: true,
      }),
    ).toHaveCount(0);
    release();
    await expect(
      disclosure.getByText("Chưa có đề xuất thay đổi cho đơn này.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(requests).toBeGreaterThan(0);
    expect(JSON.stringify((await f.ref.get()).data())).toBe(before);
    await page.screenshot({
      path: artifactDirectory + "/ask-changes-verified-empty.png",
      fullPage: true,
    });
  } finally {
    release();
  }
});

test("ASK026-STATE02 actual offline proposal read has explicit retry and no decision", async ({
  page,
  context,
}) => {
  const f = await fixture("vi", true);
  const before = JSON.stringify((await f.ref.get()).data());
  const { disclosure } = await open(page, "vi");
  await context.setOffline(true);
  try {
    await disclosure.locator("summary").click();
    await expect(disclosure.getByRole("alert")).toContainText(
      "Chưa tải được đề xuất thay đổi",
    );
    await expect(
      disclosure.getByRole("button", { name: "Tải lại đề xuất", exact: true }),
    ).toBeVisible();
    await expect(
      disclosure.getByRole("button", {
        name: "Đồng ý thay đổi và tổng phải trả",
        exact: true,
      }),
    ).toHaveCount(0);
    await disclosure
      .getByRole("button", { name: "Tải lại đề xuất", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: artifactDirectory + "/ask-changes-offline-alert.png",
      fullPage: true,
    });
    await context.setOffline(false);
    await disclosure
      .getByRole("button", { name: "Tải lại đề xuất", exact: true })
      .click();
    await expect(disclosure.getByText(f.reason, { exact: true })).toBeVisible();
    expect(
      (await db.doc("orderChanges/" + f.proposalId).get()).data()?.state,
    ).toBe("pending");
    expect(JSON.stringify((await f.ref.get()).data())).toBe(before);
    await page.screenshot({
      path: artifactDirectory + "/ask-changes-offline-retry.png",
      fullPage: true,
    });
  } finally {
    await context.setOffline(false);
  }
});

test("ASK026-STATE03 English Ask keeps proposal meaning and explicit decisions in English", async ({
  page,
}) => {
  const f = await fixture("en", true);
  const before = JSON.stringify((await f.ref.get()).data());
  const { disclosure } = await open(page, "en");
  await disclosure.locator("summary").click();
  await expect(
    disclosure.getByRole("heading", {
      name: "Cancel order and reconcile costs",
      exact: true,
    }),
  ).toBeVisible();
  await expect(disclosure.getByText(/Waiting for your approval/)).toBeVisible();
  await expect(
    disclosure.getByRole("button", {
      name: "Accept change and final amount",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    disclosure.getByRole("button", { name: "Reject change", exact: true }),
  ).toBeVisible();
  await expect(
    disclosure.getByText(
      /This decision does not transfer or refund money automatically/,
    ),
  ).toBeVisible();
  await expect(
    disclosure.getByRole("button", {
      name: "Đồng ý thay đổi và tổng phải trả",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    (await db.doc("orderChanges/" + f.proposalId).get()).data()?.state,
  ).toBe("pending");
  expect(JSON.stringify((await f.ref.get()).data())).toBe(before);
  await page.screenshot({
    path: artifactDirectory + "/ask-changes-english.png",
    fullPage: true,
  });
  await disclosure
    .getByRole("button", {
      name: "Accept change and final amount",
      exact: true,
    })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: artifactDirectory + "/ask-changes-english-decisions.png",
    fullPage: true,
  });
});
