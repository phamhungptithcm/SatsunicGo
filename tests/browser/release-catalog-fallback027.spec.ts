import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { redactChat } from "../../packages/domain/ask-workflow";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  customer,
  db,
  ownedOrders,
} from "./fixtures";

// Approved CATALOG029 test-only lease. AI is synthetic. Auth, private draft/turn
// persistence and explicit submission use real isolated-emulator services.
// Fault tests alter ONLY this public catalog module at the Vite boundary.
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

async function open(page: Page) {
  const { cid } = await askSource();
  await db
    .doc(`askConversations/${customer}-${cid}`)
    .update({ turns: [], draft: {} });
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
  await page
    .getByRole("button", { name: /^(Hỏi SatsunicGo|Tiếp tục hội thoại)$/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  // Empty context opens the native idle composer; the first question opens
  // the modal. Keep this fresh-context path rather than seeding prior turns.
  const composer = page.getByRole("complementary", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  await expect(composer).toBeVisible();
  await expect(
    composer.getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true }),
  ).toBeEnabled();
  return {
    composer,
    dialog,
    ref: db.doc(`askConversations/${customer}-${cid}`),
  };
}

async function catalogFault(page: Page, mode: "partial" | "pending") {
  let intercepted = 0;
  await page.route("**/src/features/ask/catalog-search.ts*", async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    const body =
      mode === "partial"
        ? original.replace(
            /(async function searchPublishedCatalog\([^]*?\)\s*\{)/,
            '$1 return { rows: [], cursor: "synthetic-partial-cursor", hasMore: true, stale: false };',
          )
        : // Preserve the actual boundedRead timer; replace only its public getDocs.
          original.replace(
            /(const request = boundedRead\(\s*)getDocs\(/,
            "$1((..._args) => new Promise(() => {}))(",
          );
    expect(
      body,
      "Fault injection must match the actual public module",
    ).not.toBe(original);
    intercepted++;
    await route.fulfill({ response, body });
  });
  return () => intercepted;
}

function model(page: Page, name: string, title: string) {
  let calls = 0;
  const answer = {
    language: "vi",
    title,
    paragraphs: ["Yêu cầu mua hộ cần được bạn gửi rõ ràng."],
    bullets: [],
    sourceIds: [],
    action: "manual",
    shoppingDraft: {
      market: "US",
      items: [{ name, quantity: 1, variant: "", url: "" }],
      notes: "Synthetic emulator-only request",
    },
  };
  const ready = page.route("**/ask", (route) => {
    calls++;
    return route.fulfill({
      contentType: "text/event-stream",
      body: `data: ${JSON.stringify({ result: answer })}\n\n`,
    });
  });
  return { ready, calls: () => calls };
}

for (const mode of ["normal", "partial", "pending"] as const) {
  test(`ASK027 fallback ${mode} preserves real private draft and explicit submission authority`, async ({
    page,
  }) => {
    const fault = mode === "normal" ? null : await catalogFault(page, mode);
    const name = `Unlisted${randomUUID().replaceAll("-", "")}`;
    const title = `Draft ${name}`;
    const mocked = model(page, name, title);
    await mocked.ready;
    const { composer, dialog, ref } = await open(page);
    const before = (await ownedOrders()).map((order) => order.id).sort();
    const start = Date.now();
    await composer
      .getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true })
      .fill(`mua ${name}`);
    await composer.getByRole("button", { name: /^(Gửi câu hỏi|Gửi)$/ }).click();
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    if (mode === "pending") {
      expect(Date.now() - start).toBeGreaterThanOrEqual(4500);
      expect(Date.now() - start).toBeLessThan(15000);
    }
    if (fault) expect(fault()).toBeGreaterThan(0);
    expect(mocked.calls()).toBe(1);
    await expect
      .poll(async () => (await ref.get()).data()?.draft?.items?.[0]?.name)
      .toBe(name);
    await expect
      .poll(
        async () =>
          ((await ref.get()).data()?.turns ?? []).filter(
            // Persisted chat follows the privacy contract even when a random
            // fixture nonce happens to contain a phone-like digit sequence.
            (turn: { question: string }) =>
              turn.question === redactChat(`mua ${name}`),
          ).length,
      )
      .toBe(1);
    expect((await ownedOrders()).map((order) => order.id).sort()).toEqual(
      before,
    );
    if (mode === "partial") {
      // An incomplete search is never evidence of global absence.
      await expect(
        dialog.getByText(/không có trong danh mục|not in the catalog/i),
      ).toHaveCount(0);
    }
    const submit = dialog.getByRole("button", {
      name: "Gửi yêu cầu mua hộ",
      exact: true,
    });
    await expect(submit).toBeEnabled();
    if (mode === "normal") {
      await submit.click();
      await expect
        .poll(
          async () =>
            (await ownedOrders()).filter((order) => !before.includes(order.id))
              .length,
        )
        .toBe(1);
      const created = (await ownedOrders()).find(
        (order) => !before.includes(order.id),
      );
      expect(created).toBeDefined();
      const createdOrder = (await db.doc(`orders/${created!.id}`).get()).data();
      expect(createdOrder?.items[0].name).toBe(name);
      await expect
        .poll(async () => (await ref.get()).data()?.orderId)
        .toBe(created?.id);
    }
  });
}

test("ASK027 canceled public read cannot invoke model or persist an obsolete turn", async ({
  page,
}) => {
  const fault = await catalogFault(page, "pending");
  const name = `Canceled${randomUUID().replaceAll("-", "")}`;
  const mocked = model(page, name, `Canceled draft ${name}`);
  await mocked.ready;
  const { composer, dialog, ref } = await open(page);
  const before = (await ownedOrders()).map((order) => order.id).sort();
  await composer
    .getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true })
    .fill(`mua ${name}`);
  await composer.getByRole("button", { name: /^(Gửi câu hỏi|Gửi)$/ }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Dừng|Stop/ })).toBeVisible();
  await dialog.getByRole("button", { name: /Dừng|Stop/ }).click();
  // Wait past the real 5s public-read timeout; private services remain untouched.
  await page.waitForTimeout(5500);
  expect(fault()).toBeGreaterThan(0);
  expect(mocked.calls()).toBe(0);
  expect(
    ((await ref.get()).data()?.turns ?? []).filter(
      (turn: { question: string }) =>
        turn.question === redactChat(`mua ${name}`),
    ),
  ).toHaveLength(0);
  expect((await ref.get()).data()?.draft?.items ?? []).toHaveLength(0);
  expect((await ownedOrders()).map((order) => order.id).sort()).toEqual(before);
});
