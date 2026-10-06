import {
  test,
  expect,
  type Page,
  type Locator,
  type Route,
} from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import {
  initializeApp,
  deleteApp,
  getApps,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { closeFixtures, sourceOrder, db, customer, operator } from "./fixtures";
import { invoke } from "./http";
import { artifactDirectory } from "./artifact-path";
import { applyVerifiedPayment } from "../../functions/src/payments/payos";

// Synthetic VERIFIED INPUT to the real transaction, never webhook signature/provider proof.
let serviceApp: App;
test.beforeAll(async () => {
  if (
    process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187" ||
    process.env.FUNCTIONS_EMULATOR !== "true" ||
    getApps().some((app) => app.name === "[DEFAULT]")
  )
    throw Error(
      "031 requires an isolated default app on the dedicated emulator",
    );
  serviceApp = initializeApp({ projectId: "demo-satsunicgo" });
  const [access, profile, buyer, identity] = await Promise.all([
    db.doc(`staffAccess/${operator}`).get(),
    db.doc(`users/${operator}`).get(),
    db.doc(`users/${customer}`).get(),
    getAuth(serviceApp).getUser(operator),
  ]);
  if (
    !access.exists ||
    !profile.exists ||
    !buyer.exists ||
    access.get("active") !== true ||
    access.get("locked") ||
    profile.get("locked") ||
    buyer.get("locked") ||
    !Array.isArray(access.get("roles")) ||
    !access.get("roles").includes("OWNER") ||
    !identity.emailVerified ||
    identity.disabled ||
    !identity.providerData.some(
      (provider) => provider.providerId === "google.com",
    )
  )
    throw Error(
      "031 requires an existing authorized dedicated demo baseline; no shared baseline is written",
    );
});
test.afterAll(async () => {
  const errors: unknown[] = [];
  if (serviceApp) {
    try {
      await getFirestore(serviceApp).terminate();
    } catch (cause) {
      errors.push(cause);
    }
    try {
      await deleteApp(serviceApp);
    } catch (cause) {
      errors.push(cause);
    }
  }
  try {
    await closeFixtures();
  } catch (cause) {
    errors.push(cause);
  }
  if (errors.length) throw new AggregateError(errors, "031 SDK cleanup failed");
});
const paths = new Set<string>(),
  orders = new Set<string>(),
  operations = new Set<string>();
let generation = 0;
const fixtureReads = new Set<Promise<unknown>>();
test.beforeEach(() => {
  generation++;
});
async function fixtureChain<T>(
  current: number,
  run: (step: <R>(task: () => Promise<R>) => Promise<R>) => Promise<T>,
): Promise<T> {
  const check = () => {
    if (current !== generation) throw Error("031_FIXTURE_CANCELLED");
  };
  const step = async <R>(task: () => Promise<R>): Promise<R> => {
    check();
    const result = await task();
    check();
    return result;
  };
  const promise = Promise.resolve().then(() => {
    check();
    return run(step);
  });
  fixtureReads.add(promise);
  try {
    return await promise;
  } finally {
    fixtureReads.delete(promise);
  }
}
test.afterEach(async ({ page }) => {
  generation++;
  await Promise.allSettled([...fixtureReads]);
  let navigationError: unknown, cleanupError: unknown;
  try {
    await page.goto("/");
  } catch (cause) {
    navigationError = cause;
  }
  try {
    for (const id of orders) {
      const order = (await db.doc(`orders/${id}`).get()).data();
      if (order?.catalogSnapshot?.productId)
        paths.add(`products/${order.catalogSnapshot.productId}`);
      paths.add(`orders/${id}`);
      for (const kind of ["financialEntries", "outboxJobs", "auditEvents"]) {
        for (const doc of (
          await db.collection(kind).where("orderId", "==", id).get()
        ).docs) {
          paths.add(doc.ref.path);
          if (kind === "financialEntries")
            paths.add(`financialReversals/${doc.id}`);
        }
      }
      for (const doc of (
        await db.collection("auditEvents").where("resourceId", "==", id).get()
      ).docs)
        paths.add(doc.ref.path);
      for (const doc of (await db.collection(`orders/${id}/timeline`).get())
        .docs)
        paths.add(doc.ref.path);
    }
    for (const path of [...paths])
      if (path.startsWith("outboxJobs/")) {
        for (const doc of (
          await db
            .collection("auditEvents")
            .where("resourceId", "==", path.split("/")[1])
            .get()
        ).docs)
          paths.add(doc.ref.path);
      }
    for (const operationId of operations)
      paths.add(`idempotencyKeys/${operator}-${operationId}`);
    const all = [...paths];
    for (let offset = 0; offset < all.length; offset += 400) {
      const batch = db.batch();
      all
        .slice(offset, offset + 400)
        .forEach((path) => batch.delete(db.doc(path)));
      await batch.commit();
    }
    const remaining = all.length
      ? (await db.getAll(...all.map((path) => db.doc(path)))).filter(
          (snapshot) => snapshot.exists,
        ).length
      : 0;
    if (remaining) throw Error("031_OWNED_RECORD_CLEANUP_INCOMPLETE");
    paths.clear();
    orders.clear();
    operations.clear();
  } catch (cause) {
    cleanupError = cause;
  }
  const errors = [navigationError, cleanupError].filter(
    (cause) => cause !== undefined,
  );
  if (errors.length)
    throw new AggregateError(errors, "031 navigation or owned cleanup failed");
});
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
async function orderFixture(current: number) {
  return fixtureChain(current, async (step) => {
    const id = `finance031-${randomUUID()}`;
    orders.add(id);
    await step(() => sourceOrder(id));
    return id;
  });
}
async function ledger(
  id: string,
): Promise<Array<Record<string, unknown> & { id: string }>> {
  return (
    await db.collection("financialEntries").where("orderId", "==", id).get()
  ).docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function audit(id: string, action: string) {
  return (
    await db.collection("auditEvents").where("resourceId", "==", id).get()
  ).docs.filter((doc) => doc.get("action") === action);
}
async function verifiedException(current: number) {
  return fixtureChain(current, async (step) => {
    const reference = `SYNTHETIC-VERIFIED-INPUT031-${randomUUID()}`,
      id = hash(`payos:${reference}`),
      bank = hash(reference);
    paths.add(`webhookReceipts/${id}`);
    paths.add(`paymentExceptions/${id}`);
    paths.add(`bankTransactions/${bank}`);
    await step(() =>
      applyVerifiedPayment(
        {
          orderCode: Number.parseInt(
            randomUUID().replaceAll("-", "").slice(0, 12),
            16,
          ),
          amount: 15000,
          currency: "VND",
          reference,
          paymentLinkId: `SYNTHETIC-UNKNOWN031-${randomUUID()}`,
          accountNumber: "SYNTHETIC-LOCAL031",
          code: "00",
        },
        "SYNTHETIC-LOCAL031",
      ),
    );
    expect(
      (await step(() => db.doc(`webhookReceipts/${id}`).get())).data(),
    ).toMatchObject({ state: "exception", amount: 15000 });
    expect(
      (await step(() => db.doc(`paymentExceptions/${id}`).get())).data(),
    ).toMatchObject({
      state: "open",
      inboundVerified: true,
      bankReferenceHash: bank,
    });
    return { id, bank };
  });
}
async function paidOrder(current: number) {
  return fixtureChain(current, async (step) => {
    const id = await step(() => orderFixture(current)),
      before = (await step(() => db.doc(`orders/${id}`).get())).data()!;
    const operationId = randomUUID(),
      bankTransactionId = `SYNTHETIC-IN031-${randomUUID()}`;
    operations.add(operationId);
    paths.add(`bankTransactions/${hash(bankTransactionId)}`);
    await step(() =>
      invoke("command", {
        action: "verifyTransfer",
        orderId: id,
        expectedVersion: before.version,
        operationId,
        payload: {
          amount: 240000,
          bankTransactionId,
          evidence: "Synthetic local incoming031",
          reason: "Emulator only",
        },
      }),
    );
    const entries = await step(() => ledger(id));
    expect(entries.filter((entry) => entry.kind === "payment")).toHaveLength(1);
    return { id, entry: entries.find((entry) => entry.kind === "payment")! };
  });
}
async function login(page: Page, route: "finance" | "activity", width: number) {
  await page.setViewportSize({ width, height: 1000 });
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
  await page.goto(`/crm/${route}`);
}
async function trackedRoute(
  page: Page,
  current: number,
  pattern: string,
  handler: (route: Route) => Promise<void>,
) {
  const check = () => {
    if (current !== generation) throw Error("031_ROUTE_CANCELLED");
  };
  check();
  await page.route(pattern, async (route) => {
    const task = (async () => {
      const guarded = new Proxy(route, {
        get(target, key) {
          const value = Reflect.get(target, key);
          if (typeof value !== "function") return value;
          if (!["fetch", "continue", "fulfill", "abort"].includes(String(key)))
            return value.bind(target);
          return async (...args: unknown[]) => {
            check();
            const result = await value.apply(target, args);
            check();
            return result;
          };
        },
      });
      try {
        check();
        await handler(guarded);
        check();
      } catch (cause) {
        if (current === generation) throw cause;
        await route.abort("failed").catch(() => undefined);
      }
    })();
    fixtureReads.add(task);
    try {
      await task;
    } finally {
      fixtureReads.delete(task);
    }
  });
}
async function capture(
  page: Page,
  endpoint: "financeReview" | "outboxCommand",
  lost = false,
) {
  const current = generation;
  const commands: Array<Record<string, unknown>> = [];
  page.on("request", (request) => {
    if (current !== generation) return;
    if (request.method() === "POST" && request.url().endsWith(`/${endpoint}`)) {
      const data = request.postDataJSON().data;
      commands.push(data);
      operations.add(data.operationId);
      if (typeof data.bankTransactionId === "string")
        paths.add(`bankTransactions/${hash(data.bankTransactionId)}`);
    }
  });
  let dropped = false,
    dropCompleted = false;
  if (lost)
    await trackedRoute(page, current, `**/${endpoint}`, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      if (!dropped) {
        const response = await route.fetch();
        const body = await response.json();
        expect(response.ok()).toBe(true);
        expect(body.error).toBeUndefined();
        expect(body.result).toBeDefined();
        dropped = true;
        await route.abort("failed");
        dropCompleted = true;
      } else await route.continue();
    });
  return {
    commands,
    async waitForDrop() {
      if (lost)
        await expect
          .poll(() => current === generation && dropCompleted)
          .toBe(true);
    },
  };
}
async function exceptionForm(page: Page, id: string) {
  await page
    .getByRole("group", { name: "Nhóm đối soát", exact: true })
    .getByRole("button", { name: "Ngoại lệ", exact: true })
    .click();
  const card = page.locator("article.crmItem").filter({ hasText: id });
  for (let guard = 0; guard < 30 && !(await card.count()); guard++) {
    await page
      .getByRole("button", { name: "Trang ngoại lệ tiếp theo", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
    ).toBeEnabled();
  }
  await expect(card).toBeVisible();
  await card.locator("summary").click();
  const form = card.locator("form");
  await form.locator('[name="action"]').selectOption("allocateException");
  return { card, form };
}
async function fillReview(form: Locator, orderId: string) {
  await form.locator('[name="orderId"]').fill(orderId);
  await form.locator('[name="reason"]').fill("Synthetic checked finance031");
  await form
    .locator('[name="evidence"]')
    .fill("Synthetic local evidence031; no bank/provider proof");
}
async function finishReview(card: Locator, lost: boolean) {
  if (lost)
    await card
      .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
      .click();
  await expect(card.getByRole("status")).toContainText(
    "Đã lưu kết quả đối soát.",
  );
}
async function overflow(page: Page) {
  expect(
    await page
      .locator("main")
      .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
}
for (const width of [390, 768, 1440]) {
  test(`FINANCE031 actual verified-input allocation conserves receipts and money at ${width}`, async ({
    page,
  }) => {
    const current = generation;
    const orderId = await orderFixture(current),
      exception = await verifiedException(current),
      before = (await db.doc(`orders/${orderId}`).get()).data()!;
    const receipt = (
      await db.doc(`webhookReceipts/${exception.id}`).get()
    ).data();
    const { commands, waitForDrop } = await capture(
      page,
      "financeReview",
      width === 390,
    );
    await login(page, "finance", width);
    const { card, form } = await exceptionForm(page, exception.id);
    await fillReview(form, orderId);
    await form
      .getByRole("button", { name: "Phân bổ tiền đã xác minh", exact: true })
      .click();
    await waitForDrop();
    await finishReview(card, width === 390);
    expect((await db.doc(`orders/${orderId}`).get()).data()).toMatchObject({
      collected: before.collected + 15000,
      version: before.version + 1,
      stage: before.stage,
    });
    expect(
      (await db.doc(`paymentExceptions/${exception.id}`).get()).data(),
    ).toMatchObject({ state: "allocated", orderId });
    expect(
      (await db.doc(`bankTransactions/${exception.bank}`).get()).data(),
    ).toMatchObject({ amount: 15000, orderId, exceptionId: exception.id });
    expect(await ledger(orderId)).toEqual([
      expect.objectContaining({
        kind: "payment",
        amount: 15000,
        exceptionId: exception.id,
      }),
    ]);
    expect(await audit(orderId, "allocateException")).toHaveLength(1);
    expect(
      (await db.doc(`webhookReceipts/${exception.id}`).get()).data(),
    ).toEqual(receipt);
    expect(commands).toHaveLength(width === 390 ? 2 : 1);
    if (width === 390) expect(commands[1]).toEqual(commands[0]);
    await overflow(page);
  });
  test(`FINANCE031 actual reversal retains original payment and holds order at ${width}`, async ({
    page,
  }) => {
    const current = generation;
    const { id, entry } = await paidOrder(current),
      before = (await db.doc(`orders/${id}`).get()).data()!;
    const { commands, waitForDrop } = await capture(
      page,
      "financeReview",
      width === 768,
    );
    const diagnosticStart = performance.now();
    let navigationCount = 0,
      responseCount = 0;
    const diagnosticTasks: Promise<unknown>[] = [];
    const note = (
      phase: string,
      values: Record<string, boolean | number> = {},
    ) => {
      if (current !== generation) return;
      console.info(
        JSON.stringify({
          diagnostic: "FINANCE031_REVERSAL",
          phase,
          width,
          elapsedMs: Math.round(performance.now() - diagnosticStart),
          ...values,
        }),
      );
    };
    page.on("framenavigated", (frame) => {
      if (current !== generation || frame !== page.mainFrame()) return;
      navigationCount++;
      const path = new URL(frame.url()).pathname;
      note("main-frame", {
        navigationCount,
        financePath: path === "/crm/finance",
        accountPath: path === "/account",
      });
    });
    page.on("websocket", (socket) => {
      socket.on("framereceived", ({ payload }) => {
        if (current !== generation) return;
        try {
          const message = JSON.parse(String(payload));
          if (["full-reload", "update"].includes(message.type))
            note("dev-runtime", {
              fullReload: message.type === "full-reload",
              update: message.type === "update",
            });
        } catch {
          /* Non-JSON dev frames contain no diagnostic evidence. */
        }
      });
    });
    page.on("response", (response) => {
      if (
        current !== generation ||
        response.request().method() !== "POST" ||
        !response.url().endsWith("/financeReview")
      )
        return;
      const task = fixtureChain(current, async (step) => {
        const body = await step(() => response.json());
        responseCount++;
        note("command-terminal", {
          responseCount,
          httpOK: response.ok(),
          resultPresent: body.result !== undefined,
          errorPresent: body.error !== undefined,
        });
      });
      diagnosticTasks.push(task);
      void task.catch(() => undefined); // Preserve task failure for aggregate teardown, never unhandled listener rejection.
    });
    await login(page, "finance", width);
    note("login-settled", { navigationCount });
    const detail = page.locator("details.crmItemDetails").filter({
      has: page.getByText("Ghi nhận tiền vào bị ngân hàng đảo", {
        exact: true,
      }),
    });
    await detail.locator("summary").click();
    const form = detail.locator("form");
    await fillReview(form, id);
    await form.locator('[name="entryId"]').fill(entry.id);
    await form.locator('[name="amount"]').fill("10000");
    const bank = `SYNTHETIC-REVERSE031-${randomUUID()}`;
    await form.locator('[name="bank"]').fill(bank);
    let primaryError: unknown;
    try {
      note("submit", { navigationCount });
      await form
        .getByRole("button", {
          name: "Ghi nhận ngân hàng đảo tiền",
          exact: true,
        })
        .click();
      await waitForDrop();
      await finishReview(page.locator("main"), width === 768);
      expect((await db.doc(`orders/${id}`).get()).data()).toMatchObject({
        collected: before.collected - 10000,
        version: before.version + 1,
        hold: "Chờ đối soát tiền bị đảo",
        stage: before.stage,
      });
      expect(
        (await db.doc(`financialEntries/${entry.id}`).get()).data(),
      ).toEqual(
        Object.fromEntries(
          Object.entries(entry).filter(([key]) => key !== "id"),
        ),
      );
      expect(
        (await db.doc(`financialReversals/${entry.id}`).get()).data(),
      ).toEqual({ amount: 10000 });
      expect(
        (await ledger(id)).filter((row) => row.kind === "reversal"),
      ).toEqual([
        expect.objectContaining({ originalEntryId: entry.id, amount: 10000 }),
      ]);
      expect(
        (await db.doc(`bankTransactions/${hash(bank)}`).get()).data(),
      ).toMatchObject({
        kind: "reversal",
        amount: 10000,
        originalEntryId: entry.id,
      });
      expect(await audit(id, "reverse")).toHaveLength(1);
      expect(commands).toHaveLength(width === 768 ? 2 : 1);
      if (width === 768) expect(commands[1]).toEqual(commands[0]);
      await overflow(page);
    } catch (cause) {
      primaryError = cause;
    }
    const diagnosticErrors: unknown[] = [];
    for (const result of await Promise.allSettled(diagnosticTasks))
      if (result.status === "rejected") diagnosticErrors.push(result.reason);
    if (primaryError !== undefined) {
      try {
        await fixtureChain(current, async (step) => {
          const [order, original, reversal, bankRecord] = await step(() =>
            db.getAll(
              db.doc(`orders/${id}`),
              db.doc(`financialEntries/${entry.id}`),
              db.doc(`financialReversals/${entry.id}`),
              db.doc(`bankTransactions/${hash(bank)}`),
            ),
          );
          const entries = await step(() => ledger(id)),
            events = await step(() => audit(id, "reverse"));
          note("failure-readback", {
            navigationCount,
            responseCount,
            orderAmountCorrect:
              order.get("collected") === before.collected - 10000,
            orderVersionCorrect: order.get("version") === before.version + 1,
            holdCorrect: order.get("hold") === "Chờ đối soát tiền bị đảo",
            originalPaymentPresent: original.exists,
            reversalAmountCorrect: reversal.get("amount") === 10000,
            bankAmountCorrect: bankRecord.get("amount") === 10000,
            reversalCount: entries.filter((row) => row.kind === "reversal")
              .length,
            auditCount: events.length,
          });
        });
      } catch (cause) {
        diagnosticErrors.push(cause);
      }
    }
    if (primaryError !== undefined) {
      if (diagnosticErrors.length)
        throw new AggregateError(
          [primaryError, ...diagnosticErrors],
          "031 reversal assertion and diagnostics failed",
        );
      throw primaryError;
    }
    if (diagnosticErrors.length)
      throw new AggregateError(
        diagnosticErrors,
        "031 reversal diagnostics failed",
      );
  });
  test(`ACTIVITY031 actual sent reconciliation records local evidence once without money writes at ${width}`, async ({
    page,
  }) => {
    const current = generation;
    const { orderId, before, id, siblingId } = await fixtureChain(
      current,
      async (step) => {
        const orderId = await step(() => orderFixture(current)),
          before = (await step(() => db.doc(`orders/${orderId}`).get())).data(),
          id = `outbox031-${randomUUID()}-${randomUUID()}`,
          siblingId = `outbox031-${randomUUID()}-${randomUUID()}`,
          createdAt = Date.now() + 60000;
        paths.add(`outboxJobs/${id}`);
        paths.add(`outboxJobs/${siblingId}`);
        await step(async () => {
          const batch = db.batch(),
            row = {
              ownerId: customer,
              orderId,
              action: "invoiceIssued",
              state: "inAppDelivered",
              emailState: "unknown",
              reconciliationRequired: true,
              version: 1,
              createdAt,
            };
          batch.set(db.doc(`outboxJobs/${id}`), row);
          batch.set(db.doc(`outboxJobs/${siblingId}`), row);
          await batch.commit();
        });
        return { orderId, before, id, siblingId };
      },
    );
    const { commands, waitForDrop } = await capture(
      page,
      "outboxCommand",
      width === 390,
    );
    await login(page, "activity", width);
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    const row = page
      .getByRole("row")
      .filter({ has: page.getByText(id, { exact: true }) });
    const sibling = page
      .getByRole("row")
      .filter({ has: page.getByText(siblingId, { exact: true }) });
    await expect(row.locator("code")).toHaveText(id);
    await expect(sibling.locator("code")).toHaveText(siblingId);
    await expect(row).toContainText("Chưa rõ kết quả gửi");
    await row.getByText("Ghi nhận đối soát", { exact: true }).click();
    await row.locator('[name="outcome"]').selectOption("confirmed_sent");
    await row
      .locator('[name="evidence"]')
      .fill("Synthetic local reconciliation031; NOT provider proof");
    await row
      .getByRole("button", { name: "Lưu đối soát, chưa gửi lại", exact: true })
      .click();
    await waitForDrop();
    if (width === 390)
      await page
        .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
        .click();
    await expect
      .poll(async () =>
        (await db.doc(`outboxJobs/${id}`).get()).get("emailState"),
      )
      .toBe("sent");
    expect((await db.doc(`outboxJobs/${id}`).get()).data()).toMatchObject({
      version: 2,
      reconciliationRequired: false,
      state: "inAppDelivered",
      resolution: {
        outcome: "confirmed_sent",
        evidence: "Synthetic local reconciliation031; NOT provider proof",
        actor: operator,
      },
    });
    expect(await audit(id, "outbox:resolveUnknown")).toHaveLength(1);
    expect(
      (await db.doc(`outboxJobs/${siblingId}`).get()).data(),
    ).toMatchObject({
      version: 1,
      emailState: "unknown",
      reconciliationRequired: true,
    });
    expect(
      (await db.doc(`outboxJobs/${siblingId}`).get()).get("resolution"),
    ).toBeUndefined();
    expect(await audit(siblingId, "outbox:resolveUnknown")).toHaveLength(0);
    expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(before);
    expect(await ledger(orderId)).toEqual([]);
    expect(commands).toHaveLength(width === 390 ? 2 : 1);
    if (width === 390) expect(commands[1]).toEqual(commands[0]);
    await expect(
      row.getByText("Ghi nhận đối soát", { exact: true }),
    ).toHaveCount(0);
    await expect(
      sibling.getByText("Ghi nhận đối soát", { exact: true }),
    ).toBeVisible();
    await overflow(page);
    await row.scrollIntoViewIfNeeded();
    await row.screenshot({
      path: `${artifactDirectory}/crm-activity-identity031-${width}.png`,
    });
  });
}
test("FINANCE031 actual stale allocation rejects without money then requires fresh operation", async ({
  page,
}) => {
  const current = generation;
  const orderId = await orderFixture(current),
    exception = await verifiedException(current),
    { commands } = await capture(page, "financeReview");
  await login(page, "finance", 390);
  const { card, form } = await exceptionForm(page, exception.id);
  await fillReview(form, orderId);
  let conflict = false;
  await trackedRoute(page, current, "**/financeReview", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    if (!conflict) {
      conflict = true;
      await fixtureChain(current, async (step) => {
        const before = (
          await step(() => db.doc(`orders/${orderId}`).get())
        ).data()!;
        await step(() =>
          db.doc(`orders/${orderId}`).update({ version: before.version + 1 }),
        );
      });
    }
    await route.continue();
  });
  await form
    .getByRole("button", { name: "Phân bổ tiền đã xác minh", exact: true })
    .click();
  await expect(card).toContainText("Chưa lưu được");
  await expect(form.locator('[name="orderId"]')).toHaveValue(orderId);
  expect(
    (await db.doc(`paymentExceptions/${exception.id}`).get()).get("state"),
  ).toBe("open");
  expect(
    (await db.doc(`bankTransactions/${exception.bank}`).get()).exists,
  ).toBe(false);
  expect(await ledger(orderId)).toEqual([]);
  expect(
    (
      await db
        .doc(`idempotencyKeys/${operator}-${commands[0].operationId}`)
        .get()
    ).exists,
  ).toBe(false);
  await form
    .getByRole("button", { name: "Phân bổ tiền đã xác minh", exact: true })
    .click();
  await finishReview(card, false);
  expect(commands).toHaveLength(2);
  expect(commands[1].operationId).not.toBe(commands[0].operationId);
  expect(commands[1].expectedVersion).toBe(
    Number(commands[0].expectedVersion) + 1,
  );
  expect(await ledger(orderId)).toHaveLength(1);
  expect(await audit(orderId, "allocateException")).toHaveLength(1);
});
