import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, db, customer } from "./fixtures";
import { call, invoke } from "./http";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

async function login(page: Page, identity: string) {
  await page.goto("/account");
  const account = page.getByRole("button", { name: /Tài khoản của/ });
  const role = page.getByRole("combobox", { name: "Vai trò thử", exact: true });
  await expect(account.or(role)).toBeVisible();
  if (await account.isVisible()) {
    await account.click();
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  }
  await role.selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(account).toBeVisible();
}

test("CHANGE-UI01 native proposal accept/apply and reject preserve bought lines and verified money", async ({
  page,
}) => {
  test.setTimeout(120000);
  const marker = randomUUID();
  const boughtName = `Bought ${marker}`,
    pendingName = `Unbought ${marker}`;
  let state = await invoke<{ id: string; version: number }>(
    "command",
    {
      action: "submitRequest",
      operationId: randomUUID(),
      payload: {
        market: "US",
        notes: "Synthetic isolated proposal journey",
        items: [
          { name: boughtName, quantity: 1, variant: "Bought size", url: "" },
          { name: pendingName, quantity: 1, variant: "Original size", url: "" },
        ],
      },
    },
    "customer-a",
  );
  const act = async (action: string, payload: unknown, identity = "owner") => {
    state = await invoke<{ id: string; version: number }>(
      "command",
      {
        action,
        payload,
        operationId: randomUUID(),
        orderId: state.id,
        expectedVersion: state.version,
      },
      identity,
    );
  };
  await act("issueQuote", {
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
    verifiedProduct: "Synthetic reviewed two-line proposal products",
  });
  await act("acceptQuote", { quoteVersion: 1 }, "customer-a");
  await act("verifyTransfer", {
    amount: 1000000,
    bankTransactionId: randomUUID(),
    evidence: "Synthetic bank proof; dedicated emulator only",
    reason: "Synthetic deposit",
  });
  await act("claimPurchase", {});
  await act("recordPurchase", {
    quantity: 1,
    lines: [{ line: 0, quantity: 1 }],
    supplierOrder: `supplier-${marker}`,
    actualSourceMinor: 3400,
    evidence: "Synthetic first-line purchase evidence",
  });
  const orderRef = db.doc(`orders/${state.id}`);
  const original = (await orderRef.get()).data()!;
  expect(original).toMatchObject({
    ownerId: customer,
    stage: "PURCHASING",
    purchasedLines: [1, 0],
    collected: 1000000,
    refunded: 0,
  });
  const moneyBefore = (
    await db
      .collection("financialEntries")
      .where("orderId", "==", state.id)
      .get()
  ).size;
  const replacement = `Replacement ${marker}`;
  const privateEvidence = `Private proposal proof ${marker}`;

  async function propose(name: string, reason: string) {
    await login(page, "owner");
    await page.goto(`/crm/orders?order=${state.id}`);
    const summary = page
      .locator("summary")
      .filter({ hasText: "Đề xuất thay đổi để khách duyệt" });
    const details = summary.locator("..");
    await summary.click();
    await details
      .getByRole("combobox", { name: "Loại thay đổi", exact: true })
      .selectOption("substitution");
    const untouched = details.getByRole("group", {
      name: `${boughtName} · Bought size · 1`,
      exact: true,
    });
    const unbought = details
      .getByRole("group", {
        name: `${pendingName} · Original size · 1`,
        exact: true,
      })
      .or(
        details.getByRole("group", {
          name: `${replacement} · Replacement size · 1`,
          exact: true,
        }),
      );
    await expect(
      untouched.getByRole("textbox", {
        name: "Tên thay thế · không bắt buộc",
        exact: true,
      }),
    ).toHaveValue("");
    await unbought
      .getByRole("textbox", {
        name: "Tên thay thế · không bắt buộc",
        exact: true,
      })
      .fill(name);
    await unbought
      .getByRole("textbox", { name: "Biến thể thay thế", exact: true })
      .fill("Replacement size");
    await details
      .getByRole("textbox", { name: "Lý do hiển thị cho khách", exact: true })
      .fill(reason);
    await details
      .getByRole("spinbutton", {
        name: "Tổng phải trả sau thay đổi (₫)",
        exact: true,
      })
      .fill("2000000");
    await details
      .getByRole("spinbutton", {
        name: "Chi phí thực tế đã phát sinh (₫)",
        exact: true,
      })
      .fill("850000");
    await details
      .getByRole("textbox", {
        name: "Bằng chứng nội bộ · khách không đọc trường này",
        exact: true,
      })
      .fill(privateEvidence);
    await details
      .getByRole("button", {
        name: "Gửi đề xuất và tạm giữ xử lý",
        exact: true,
      })
      .click();
    await expect
      .poll(
        async () =>
          (
            await db
              .collection("orderChanges")
              .where("orderId", "==", state.id)
              .where("state", "==", "pending")
              .get()
          ).size,
      )
      .toBe(1);
    const found = await db
      .collection("orderChanges")
      .where("orderId", "==", state.id)
      .where("state", "==", "pending")
      .get();
    return found.docs[0].id;
  }

  const reason = `Native accept ${marker}`;
  const proposalId = await propose(replacement, reason);
  const pendingOrder = (await orderRef.get()).data()!;
  expect(pendingOrder.items).toEqual(original.items);
  expect(pendingOrder.hold).toBe(`Chờ duyệt thay đổi ${proposalId}`);
  expect(
    (
      await call("changeCommand", {
        action: "apply",
        operationId: randomUUID(),
        orderId: state.id,
        expectedVersion: pendingOrder.version,
        proposalId,
      })
    ).error?.status,
  ).toBe("FAILED_PRECONDITION");

  await login(page, "customer-a");
  await page.goto(`/account/orders/${state.id}`);
  const proposal = page
    .locator("article")
    .filter({ has: page.getByText(reason, { exact: true }) });
  await expect(
    proposal.getByText("Chờ bạn duyệt", { exact: false }),
  ).toBeVisible();
  const replacementLine = proposal.locator("p").filter({ hasText: replacement });
  await expect(replacementLine).toBeVisible();
  await expect(replacementLine).toContainText("Replacement size");
  await expect(replacementLine).not.toContainText(/hủy\s*0/i);
  await expect(page.getByText(privateEvidence, { exact: false })).toHaveCount(
    0,
  );
  await proposal
    .getByRole("button", {
      name: "Đồng ý thay đổi và tổng phải trả",
      exact: true,
    })
    .click();
  await expect
    .poll(
      async () =>
        (await db.doc(`orderChanges/${proposalId}`).get()).data()?.state,
    )
    .toBe("accepted");
  expect((await orderRef.get()).data()?.items).toEqual(original.items);

  await login(page, "owner");
  await page.goto("/crm/changes");
  const accepted = page
    .locator("article")
    .filter({ has: page.getByText(reason, { exact: true }) });
  const applyRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith("/changeCommand") &&
      request.postDataJSON()?.data?.action === "apply",
  );
  await accepted
    .getByRole("button", { name: "Áp dụng quyết định đã duyệt", exact: true })
    .click();
  const applyData = (await applyRequest).postDataJSON().data;
  await expect
    .poll(
      async () =>
        (await db.doc(`orderChanges/${proposalId}`).get()).data()?.state,
    )
    .toBe("applied");
  const applied = (await orderRef.get()).data()!;
  expect(applied.items[0]).toEqual(original.items[0]);
  expect(applied.items[1]).toMatchObject({
    name: replacement,
    variant: "Replacement size",
    quantity: 1,
  });
  expect(applied).toMatchObject({
    purchasedLines: [1, 0],
    purchasedQuantity: 1,
    collected: 1000000,
    refunded: 0,
    deposit: 1000000,
    finalTotal: 2000000,
    hold: "",
  });
  expect(
    (
      await db
        .collection("financialAdjustments")
        .where("proposalId", "==", proposalId)
        .get()
    ).size,
  ).toBe(1);
  expect((await call("changeCommand", applyData)).error).toBeUndefined();
  expect(
    (
      await call("changeCommand", {
        ...applyData,
        operationId: randomUUID(),
        expectedVersion: applied.version,
      })
    ).error?.status,
  ).toBe("FAILED_PRECONDITION");
  expect(
    (
      await db
        .collection("financialAdjustments")
        .where("proposalId", "==", proposalId)
        .get()
    ).size,
  ).toBe(1);
  await page.reload();
  await expect(page.getByText(reason, { exact: true })).toHaveCount(0);

  const rejectReason = `Native reject ${marker}`;
  const rejectedId = await propose(
    `Rejected replacement ${marker}`,
    rejectReason,
  );
  await login(page, "customer-a");
  await page.goto(`/account/orders/${state.id}`);
  const rejected = page
    .locator("article")
    .filter({ has: page.getByText(rejectReason, { exact: true }) });
  await rejected
    .getByRole("button", { name: "Từ chối thay đổi", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await db.doc(`orderChanges/${rejectedId}`).get()).data()?.state,
    )
    .toBe("rejected");
  const final = (await orderRef.get()).data()!;
  expect(final.items).toEqual(applied.items);
  expect(final).toMatchObject({
    hold: "",
    collected: 1000000,
    refunded: 0,
    deposit: 1000000,
  });
  expect(
    (
      await db
        .collection("financialEntries")
        .where("orderId", "==", state.id)
        .get()
    ).size,
  ).toBe(moneyBefore);
  expect(
    (
      await db
        .collection("financialAdjustments")
        .where("proposalId", "==", rejectedId)
        .get()
    ).size,
  ).toBe(0);
});
