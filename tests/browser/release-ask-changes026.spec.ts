import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  db,
  customer,
  otherCustomer,
} from "./fixtures";
import { invoke, call } from "./http";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

async function open(
  page: Page,
  identity = "customer-a",
  foreignOrderId?: string,
) {
  await page.goto("/account");
  const currentResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/currentAskConversation") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  const response = await currentResponse;
  expect(response.ok()).toBe(true);
  const envelope = await response.json();
  const restoredId = (envelope.result ?? envelope.data)?.conversationId;
  expect(typeof restoredId).toBe("string");
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  const launcher = page.getByRole("button", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  const resume = page.getByRole("button", {
    name: "Tiếp tục hội thoại",
    exact: true,
  });
  if (foreignOrderId) {
    await expect
      .poll(
        async () =>
          (
            await db
              .doc(`askConversations/${otherCustomer}-${restoredId}`)
              .get()
          ).data()?.ownerId,
      )
      .toBe(otherCustomer);
    expect(
      (
        await db.doc(`askConversations/${otherCustomer}-${restoredId}`).get()
      ).data()?.orderId,
    ).toBe(foreignOrderId);
    let requestedCid = "";
    await page.route("**/ask", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      requestedCid = route.request().postDataJSON().data.conversationId;
      return route.fulfill({
        contentType: "text/event-stream",
        body:
          "data: " +
          JSON.stringify({
            result: {
              language: "vi",
              title: "Synthetic owned conversation with unreadable order",
              paragraphs: [
                "Text does not authorize access to another customer's order.",
              ],
              bullets: [],
              sourceIds: [],
              action: "manual",
            },
          }) +
          "\n\n",
      });
    });
    await launcher.click();
    const question = page.getByRole("textbox", {
      name: "Hỏi SatsunicGo",
      exact: true,
    });
    await question.fill(`Tôi muốn xem thay đổi của đơn ${foreignOrderId}`);
    await question.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Tra cứu đơn hàng", exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText(
        "Không thể truy cập đơn này. Kiểm tra mã và tài khoản đã đặt đơn.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(requestedCid).toBe(""); // Typed lookup uses the owner-authorized tool, never AI.
    await expect
      .poll(
        async () =>
          (await db.doc(`askCurrent/${otherCustomer}`).get()).data()
            ?.conversationId,
      )
      .toBe(restoredId);
    expect(
      (
        await db.doc(`askConversations/${otherCustomer}-${restoredId}`).get()
      ).data()?.orderId,
    ).toBe(foreignOrderId);
    return dialog;
  }
  await expect(launcher.or(resume).first()).toBeVisible();
  await launcher.or(resume).first().click();
  await expect(dialog.or(resume).first()).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fixture() {
  const cid = randomUUID(),
    marker = randomUUID();
  const created = await invoke<{ id: string }>(
    "askWorkflow",
    {
      conversationId: cid,
      operationId: randomUUID(),
      expectedVersion: 0,
      action: "submitRequest",
      payload: {
        market: "US",
        items: [
          {
            name: `Ask change ${marker}`,
            quantity: 1,
            variant: "Blue",
            url: "",
          },
        ],
        notes: "Synthetic Ask change fixture",
      },
    },
    "customer-a",
  );
  const ref = db.doc(`orders/${created.id}`);
  async function command(action: string, payload: unknown, identity = "owner") {
    const current = (await ref.get()).data()!;
    return invoke(
      "command",
      {
        action,
        payload,
        orderId: created.id,
        expectedVersion: current.version,
        operationId: randomUUID(),
      },
      identity,
    );
  }
  await command("issueQuote", {
    goods: 1700000,
    service: 100000,
    sourceCosts: 0,
    internationalShipping: 150000,
    destinationShipping: 50000,
    discount: 0,
    sourceCurrency: "USD",
    sourceMinor: 6800,
    fxNumerator: 250,
    fxDenominator: 1,
    termsVersion: "synthetic-sanity-v1",
    expiresAt: Date.now() + 3600000,
    verifiedProduct: "Synthetic reviewed Ask change product",
  });
  await command("acceptQuote", { quoteVersion: 1 }, "customer-a");
  await command("verifyTransfer", {
    amount: 1000000,
    bankTransactionId: randomUUID(),
    evidence: "Synthetic deposit proof; emulator only",
    reason: "Synthetic verified installment",
  });
  const reason = `Ask cancellation proposal ${marker}`,
    proof = `Private staff evidence ${marker}`;
  const current = (await ref.get()).data()!;
  const proposed = await invoke<{ id: string }>("changeCommand", {
    action: "propose",
    orderId: created.id,
    expectedVersion: current.version,
    operationId: randomUUID(),
    payload: {
      kind: "cancellation",
      reason,
      termsVersion: "synthetic-sanity-v1",
      lines: [{ line: 0, cancelQuantity: 1 }],
      finalPayable: 100000,
      actualCosts: 100000,
      evidence: proof,
    },
  });
  const conversation = db.doc(`askConversations/${customer}-${cid}`);
  await conversation.update({
    turns: [
      {
        id: randomUUID(),
        question: `Text references foreign order ${randomUUID()}`,
        answer: {
          language: "vi",
          title: "Synthetic restored order task",
          paragraphs: ["Text cannot select an order or confirm money."],
          bullets: [],
          sourceIds: [],
          action: "manual",
        },
      },
    ],
  });
  await db.doc(`askCurrent/${customer}`).set({ conversationId: cid });
  return {
    cid,
    ref,
    reason,
    proof,
    proposalId: proposed.id,
    orderId: created.id,
  };
}

for (const decision of ["accept", "reject"] as const) {
  test(`ASK026-CHANGE-${decision} own pending proposal requires explicit customer decision and preserves money`, async ({
    page,
  }) => {
    const f = await fixture();
    const before = (await f.ref.get()).data()!;
    const dialog = await open(page);
    const toggle = dialog
      .locator("summary")
      .filter({ hasText: /^Thay đổi đơn hàng$/ });
    await expect(toggle).toBeVisible();
    await toggle.click();
    const proposal = toggle
      .locator("..")
      .locator("article.panel.order")
      .filter({ has: page.getByText(f.reason, { exact: true }) });
    await expect(proposal).toBeVisible();
    await expect(dialog.getByText(f.proof, { exact: false })).toHaveCount(0);
    expect((await f.ref.get()).data()).toEqual(before);
    expect(
      (await db.doc(`orderChanges/${f.proposalId}`).get()).data()?.state,
    ).toBe("pending");
    await proposal
      .getByRole("button", {
        name:
          decision === "accept"
            ? "Đồng ý thay đổi và tổng phải trả"
            : "Từ chối thay đổi",
        exact: true,
      })
      .click();
    await expect
      .poll(
        async () =>
          (await db.doc(`orderChanges/${f.proposalId}`).get()).data()?.state,
      )
      .toBe(decision === "accept" ? "accepted" : "rejected");
    const decided = (await f.ref.get()).data()!;
    expect(decided).toMatchObject({
      collected: 1000000,
      refunded: 0,
      deposit: 1000000,
    });
    expect(decided.items).toEqual(before.items);
    if (decision === "accept") {
      expect(decided.stage).toBe(before.stage);
      await expect(
        proposal.getByText(/Bạn đã duyệt.*chờ nhân viên áp dụng/),
      ).toBeVisible();
      await invoke("changeCommand", {
        action: "apply",
        orderId: f.orderId,
        expectedVersion: decided.version,
        proposalId: f.proposalId,
        operationId: randomUUID(),
      });
      await expect(
        proposal.getByText(/Đã áp dụng và ghi lịch sử/),
      ).toBeVisible();
      expect((await f.ref.get()).data()).toMatchObject({
        stage: "CANCELLED",
        finalTotal: 100000,
        collected: 1000000,
        refunded: 0,
        deposit: 1000000,
      });
    } else {
      await expect(proposal.getByText(/Bạn đã từ chối/)).toBeVisible();
      expect(decided.hold).toBe("");
      expect(decided.stage).toBe(before.stage);
    }
    await expect(
      proposal.getByRole("button", {
        name: "Đồng ý thay đổi và tổng phải trả",
        exact: true,
      }),
    ).toHaveCount(0);
    const adjustments = await db
      .collection("financialAdjustments")
      .where("proposalId", "==", f.proposalId)
      .get();
    expect(adjustments.size).toBe(decision === "accept" ? 1 : 0);
    expect(
      (
        await db
          .collection("financialEntries")
          .where("orderId", "==", f.orderId)
          .get()
      ).size,
    ).toBe(1);
    expect(
      (await db.doc(`askConversations/${customer}-${f.cid}`).get()).data()
        ?.orderId,
    ).toBe(f.orderId);
  });
}

test("ASK026-CHANGE-foreign cannot reveal a foreign selected order proposal or mutate its decision", async ({
  page,
}) => {
  const f = await fixture(),
    cid = randomUUID();
  await db
    .doc(`askConversations/${otherCustomer}-${cid}`)
    .set({
      ownerId: otherCustomer,
      version: 1,
      updatedAt: Date.now(),
      turns: [],
      orderId: f.orderId,
    });
  await db.doc(`askCurrent/${otherCustomer}`).set({ conversationId: cid });
  const dialog = await open(page, "customer-b", f.orderId);
  await expect(dialog.getByText(f.reason, { exact: true })).toHaveCount(0);
  await expect(dialog.getByText(f.proof, { exact: false })).toHaveCount(0);
  await expect(
    dialog.locator("summary").filter({ hasText: /^Thay đổi đơn hàng$/ }),
  ).toHaveCount(0);
  const order = (await f.ref.get()).data()!;
  expect(
    (
      await call(
        "changeCommand",
        {
          action: "accept",
          orderId: f.orderId,
          proposalId: f.proposalId,
          expectedVersion: order.version,
          operationId: randomUUID(),
        },
        "customer-b",
      )
    ).error?.status,
  ).toBe("PERMISSION_DENIED");
  expect((await f.ref.get()).data()).toEqual(order);
  expect(
    (await db.doc(`orderChanges/${f.proposalId}`).get()).data()?.state,
  ).toBe("pending");
});
