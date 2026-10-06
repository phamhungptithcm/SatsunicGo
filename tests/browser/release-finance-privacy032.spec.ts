import {
  test as base,
  expect,
  type Page,
  type TestInfo,
  type Route,
  type Request as BrowserRequest,
} from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db, customer, operator, sourceOrder, closeFixtures } from "./fixtures";
import { invoke } from "./http";

const test = base.extend<{ finance032Setup: void }>({
  finance032Setup: [
    async ({ page }, use, info) => {
      await prepare(page, info);
      await use(undefined);
    },
    { auto: true, timeout: 45000 },
  ],
});

// Local synthetic data and actual callable outcomes, never live bank/provider evidence.
test.beforeAll(async () => {
  const [staff, owner, buyer, buyerIdentity] = await Promise.all([
    db.doc(`staffAccess/${operator}`).get(),
    db.doc(`users/${operator}`).get(),
    db.doc(`users/${customer}`).get(),
    getAuth(getApp("release021-browser")).getUser(customer),
  ]);
  if (
    !staff.exists ||
    staff.get("active") !== true ||
    staff.get("locked") ||
    !Array.isArray(staff.get("roles")) ||
    !staff.get("roles").includes("OWNER") ||
    !owner.exists ||
    owner.get("locked") ||
    !buyer.exists ||
    buyer.get("locked") ||
    !buyerIdentity.emailVerified ||
    buyerIdentity.disabled ||
    !buyerIdentity.providerData.some(
      (provider) => provider.providerId === "google.com",
    )
  )
    throw Error(
      "032 requires an existing dedicated demo baseline; no shared baseline is written",
    );
});
test.afterAll(closeFixtures);
const owned = new Set<string>(),
  orders = new Set<string>(),
  operations = new Set<string>();
const setup = new Set<Promise<unknown>>();
let preparedTransfer: Awaited<ReturnType<typeof transfer>> | null = null;
let actor: { uid: string; identity: string } | null = null,
  generation = 0;
const bankPath = (bank: string) =>
  `bankTransactions/${createHash("sha256").update(bank).digest("hex")}`;
let diagnostic: {
  current: number;
  start: number;
  label: "P390" | "ACK" | "AUTH_FIRST";
} | null = null;
function note(
  current: number,
  phase: string,
  metadata: Record<string, string | number | boolean> = {},
) {
  if (diagnostic?.current !== current) return;
  console.info(
    JSON.stringify({
      diagnostic: "FINANCE032_PHASE",
      case: diagnostic.label,
      phase,
      elapsedMs: Math.round(performance.now() - diagnostic.start),
      ...metadata,
    }),
  );
}
async function phase<T>(current: number, label: string, run: () => Promise<T>) {
  note(current, `${label}:start`);
  try {
    const result = await run();
    note(current, `${label}:settled`);
    return result;
  } catch (cause) {
    note(current, `${label}:failed`);
    throw cause;
  }
}
async function tracked<T>(run: () => Promise<T>) {
  const promise = Promise.resolve().then(run);
  setup.add(promise);
  try {
    return await promise;
  } finally {
    setup.delete(promise);
  }
}
async function fixture<T>(
  current: number,
  run: (step: <R>(job: () => Promise<R>) => Promise<R>) => Promise<T>,
) {
  const check = () => {
    if (current !== generation) throw Error("032_FIXTURE_CANCELLED");
  };
  const step = async <R>(job: () => Promise<R>) => {
    check();
    const result = await job();
    check();
    return result;
  };
  return tracked(async () => {
    check();
    return run(step);
  });
}
async function probe(page: Page, current: number) {
  if (diagnostic?.current !== current) return;
  if (current !== generation) {
    note(current, "surface:after-invalidation-skipped");
    return;
  }
  try {
    const state = await page.evaluate(async (uid) => {
      let actorMatches: boolean | "unavailable" = "unavailable";
      try {
        const modulePath = "/src/shared/firebase.ts";
        const client = await import(modulePath);
        actorMatches = client.auth
          ? client.auth.currentUser?.uid === uid
          : "unavailable";
      } catch {
        /* Diagnostic availability only. */
      }
      const exact = (selector: string, text: string) =>
        [...document.querySelectorAll(selector)].some(
          (element) => element.textContent?.trim() === text,
        );
      return {
        routeCategory:
          location.pathname === "/crm/finance"
            ? "crm-finance"
            : location.pathname === "/"
              ? "home"
              : "other",
        financeFence: exact("strong", "Cần kiểm tra lại quyền truy cập."),
        financeHeading: exact("h1", "Đối soát thanh toán"),
        staffHeading: exact("h1", "SatsunicGo CRM"),
        staffPermissionHeading: exact(
          "h2",
          "Cần tài khoản nhân viên được cấp quyền",
        ),
        actorMatches,
        unknownRetry: exact("button", "Thử lại thao tác đang chờ"),
      };
    }, actor?.uid ?? "");
    note(current, "surface:pre-teardown", state);
  } catch {
    note(current, "surface:unavailable");
  }
}
function observe(page: Page, current: number) {
  if (diagnostic?.current !== current) return;
  let serial = 0;
  const requests = new Map<
    BrowserRequest,
    { serial: number; endpoint: string; action: string; kind: string }
  >();
  page.on("request", (request) => {
    const endpoint = new URL(request.url()).pathname.split("/").at(-1)!;
    if (
      request.method() !== "POST" ||
      ![
        "orderHistory",
        "command",
        "financeReview",
        "membershipCommand",
        "listWork",
      ].includes(endpoint)
    )
      return;
    let action = "none",
      kind = "none";
    try {
      const data = request.postDataJSON()?.data;
      if (data?.action)
        action = [
          "verifyTransfer",
          "transferReview",
          "confirm",
          "closeException",
          "allocateException",
          "reverse",
        ].includes(data.action)
          ? data.action
          : "other";
      if (data?.kind)
        kind = [
          "membershipInvoices",
          "paymentExceptions",
          "transferReviews",
        ].includes(data.kind)
          ? data.kind
          : "other";
    } catch {
      /* Never print request data. */
    }
    const info = { serial: ++serial, endpoint, action, kind };
    requests.set(request, info);
    note(current, "rpc:request", info);
  });
  page.on("response", async (response) => {
    const info = requests.get(response.request());
    if (!info) return;
    const status = response.status();
    let callableStatus = status < 400 ? "none" : "unavailable";
    if (status >= 400) {
      try {
        const code = (await response.json())?.error?.status;
        callableStatus = [
          "PERMISSION_DENIED",
          "UNAUTHENTICATED",
          "FAILED_PRECONDITION",
          "ABORTED",
          "INVALID_ARGUMENT",
          "NOT_FOUND",
          "ALREADY_EXISTS",
          "INTERNAL",
          "UNAVAILABLE",
          "DEADLINE_EXCEEDED",
        ].includes(code)
          ? code
          : "unknown";
      } catch {
        /* Error-code diagnostic unavailable; no response-body output. */
      }
    }
    note(current, "rpc:response", { ...info, status, callableStatus });
  });
  page.on("requestfailed", (request) => {
    const info = requests.get(request);
    if (info) note(current, "rpc:failed", info);
  });
}
async function prepare(page: Page, info: TestInfo) {
  preparedTransfer = null;
  const current = ++generation;
  diagnostic =
    info.title.startsWith("P032 390 ") ||
    info.title.startsWith("A032 ") ||
    info.title.startsWith("E032 ")
      ? {
          current,
          start: performance.now(),
          label: info.title.startsWith("P032")
            ? "P390"
            : info.title.startsWith("E032")
              ? "AUTH_FIRST"
              : "ACK",
        }
      : null;
  observe(page, current);
  note(current, "actor-setup:start");
  const identity = `finance032-${randomUUID()}`,
    uid = `e2e005-${identity}`;
  actor = { identity, uid };
  owned.add(`users/${uid}`);
  owned.add(`staffAccess/${uid}`);
  const auth = getAuth(getApp("release021-browser")),
    email = `${identity}@satsunicgo.example.invalid`;
  await fixture(current, async (step) => {
    await step(() => auth.createUser({ uid, email, emailVerified: true }));
    await step(() =>
      auth.updateUser(uid, {
        providerToLink: { providerId: "google.com", uid, email },
      }),
    );
    await step(() =>
      db.doc(`users/${uid}`).set({ ownerId: uid, locked: false, version: 1 }),
    );
    await step(() =>
      db
        .doc(`staffAccess/${uid}`)
        .set({ active: true, locked: false, roles: ["FINANCE"], version: 1 }),
    );
  });
  note(current, "actor-setup:settled");
  if (
    ["P032 ", "A032 ", "N032 ", "E032 "].some((prefix) =>
      info.title.startsWith(prefix),
    )
  ) {
    await fixture(current, async (step) => {
      preparedTransfer = await step(() => transfer(current));
    });
  }
  note(current, "fixture-setup:settled");
}
function readyTransfer(current: number) {
  if (current !== generation || !preparedTransfer)
    throw Error("032_TRANSFER_FIXTURE_UNAVAILABLE");
  return preparedTransfer;
}

test.afterEach(async ({ page }) => {
  const current = generation;
  await probe(page, current);
  note(current, "teardown:start");
  generation++;
  await Promise.allSettled([...setup]);
  let navigationFailure: unknown;
  try {
    await phase(current, "cleanup-navigation", () => page.goto("/"));
  } catch (cause) {
    navigationFailure = cause;
  }

  for (const id of orders) {
    const snapshot = await db.doc(`orders/${id}`).get();
    owned.add(`orders/${id}`);
    if (snapshot.get("catalogSnapshot.productId"))
      owned.add(`products/${snapshot.get("catalogSnapshot.productId")}`);
    for (const kind of ["financialEntries", "transferReviews", "outboxJobs"]) {
      for (const doc of (
        await db.collection(kind).where("orderId", "==", id).get()
      ).docs)
        owned.add(doc.ref.path);
    }
    for (const doc of (await db.collection(`orders/${id}/timeline`).get()).docs)
      owned.add(doc.ref.path);
    for (const doc of (
      await db.collection("auditEvents").where("resourceId", "==", id).get()
    ).docs)
      owned.add(doc.ref.path);
  }
  for (const path of [...owned])
    if (path.startsWith("paymentExceptions/")) {
      for (const doc of (
        await db
          .collection("auditEvents")
          .where("resourceId", "==", path.split("/")[1])
          .get()
      ).docs)
        owned.add(doc.ref.path);
    }
  for (const path of operations) owned.add(`idempotencyKeys/${path}`);
  const paths = [...owned];
  for (let offset = 0; offset < paths.length; offset += 400) {
    const batch = db.batch();
    paths
      .slice(offset, offset + 400)
      .forEach((path) => batch.delete(db.doc(path)));
    await batch.commit();
  }
  if (actor) {
    try {
      await getAuth(getApp("release021-browser")).deleteUser(actor.uid);
    } catch (cause) {
      if ((cause as { code?: string }).code !== "auth/user-not-found")
        throw cause;
    }
  }
  actor = null;
  preparedTransfer = null;
  owned.clear();
  orders.clear();
  operations.clear();
  note(current, "owned-cleanup:settled");
  diagnostic = null;
  if (navigationFailure) throw navigationFailure;
});
async function exception(current: number) {
  return fixture(current, async (step) => {
    const id = `000-finance032-${randomUUID()}`;
    owned.add(`paymentExceptions/${id}`);
    // Explicit unverified exception: close records review only, with no money allocation.
    await step(() =>
      db.doc(`paymentExceptions/${id}`).set({
        id,
        state: "open",
        amount: 15000,
        inboundVerified: false,
        reason: "Synthetic unverified local exception032",
        createdAt: Date.now(),
      }),
    );
    return id;
  });
}
async function transfer(current: number) {
  return fixture(current, async (step) => {
    const id = `finance032-${randomUUID()}`;
    orders.add(id);
    await phase(current, "canonical-order", () => step(() => sourceOrder(id)));
    const before = (
        await phase(current, "order-initial-read", () =>
          step(() => db.doc(`orders/${id}`).get()),
        )
      ).data()!,
      operationId = randomUUID();
    operations.add(`${customer}-${operationId}`);
    await phase(current, "transfer-review-callable", () =>
      step(() =>
        invoke(
          "command",
          {
            action: "transferReview",
            orderId: id,
            expectedVersion: before.version,
            operationId,
            payload: { amount: 240000, reference: "Synthetic local notice032" },
          },
          "customer-a",
        ),
      ),
    );
    const prepared = (
      await phase(current, "order-final-read", () =>
        step(() => db.doc(`orders/${id}`).get()),
      )
    ).data()!;
    note(current, "order-fixture:prepared");
    return { id, reviewId: `${customer}-${operationId}`, before: prepared };
  });
}
async function login(page: Page, current: number, width = 390) {
  note(current, "login:start");
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .evaluate((select, identity) => {
      const option = document.createElement("option");
      option.value = identity;
      option.textContent = "Synthetic isolated finance032";
      (select as HTMLSelectElement).add(option);
    }, actor!.identity);
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(actor!.identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  await page.goto("/crm/finance");
  await expect(
    page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
  ).toBeEnabled();
  note(current, "initial-queues:ready");
}
async function exceptionForm(page: Page, id: string) {
  await page
    .getByRole("group", { name: "Nhóm đối soát", exact: true })
    .getByRole("button", { name: "Ngoại lệ", exact: true })
    .click();
  const card = page.locator("article.crmItem").filter({ hasText: id });
  for (let i = 0; i < 30 && !(await card.count()); i++) {
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
  await form.locator('[name="reason"]').fill("Synthetic actual review032");
  await form.locator('[name="evidence"]').fill("Synthetic local evidence032");
  return form;
}
async function transferForm(page: Page, id: string, fill = true) {
  const card = page.locator("article.crmItem").filter({ hasText: id });
  for (let i = 0; i < 30 && !(await card.count()); i++) {
    await page
      .getByRole("button", {
        name: "Trang chuyển khoản tiếp theo",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
    ).toBeEnabled();
  }
  await expect(card).toBeVisible();
  await card.locator("summary").click();
  const form = card.locator("form"),
    bank = `SYNTHETIC-FINANCE032-${randomUUID()}`;
  if (fill) {
    owned.add(bankPath(bank));
    await form.locator('[name="bank"]').fill(bank);
    await form.locator('[name="evidence"]').fill("Synthetic bank evidence032");
  }
  return { form, bank };
}
function commands(page: Page) {
  const writes: Array<{ endpoint: string; data: Record<string, unknown> }> = [];
  page.on("request", (request) => {
    const endpoint = request.url().split("/").at(-1)!;
    if (
      request.method() !== "POST" ||
      !["command", "financeReview", "membershipCommand"].includes(endpoint)
    )
      return;
    const data = request.postDataJSON().data;
    writes.push({ endpoint, data });
    operations.add(`${actor!.uid}-${data.operationId}`);
  });
  return writes;
}
async function fence(page: Page, current: number, ids: string[]) {
  note(current, "fence-wait:start");
  await expect(
    page.getByText("Cần kiểm tra lại quyền truy cập.", { exact: true }),
  ).toBeVisible();
  for (const id of [...ids, "240.000", "15.000", "Synthetic local notice032"])
    await expect(page.locator("body")).not.toContainText(id);
  await expect(
    page
      .locator("section")
      .filter({
        has: page.getByRole("heading", {
          name: "Đối soát thanh toán",
          exact: true,
        }),
      })
      .locator("form"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("group", { name: "Nhóm đối soát", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".staff-gate")).toHaveCount(0); // Actual endpoint fence, not global role unmount.
  await expect
    .poll(() =>
      page
        .getByRole("heading", { name: "Đối soát thanh toán", exact: true })
        .evaluate(
          (heading) => document.activeElement === heading.closest("section"),
        ),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  note(current, "fence-wait:settled");
}
async function lock(current: number, locked: boolean, version: number) {
  await fixture(current, async (step) => {
    await phase(
      current,
      locked ? "own-profile-lock" : "own-profile-restore",
      () =>
        step(() => db.doc(`users/${actor!.uid}`).update({ locked, version })),
    );
  });
}
async function recover(page: Page, current: number) {
  await fixture(current, async (step) => {
    await step(() =>
      db.doc(`users/${actor!.uid}`).update({ locked: false, version: 3 }),
    );
    await step(() =>
      expect(
        page.getByText("Cần kiểm tra lại quyền truy cập.", { exact: true }),
      ).toBeVisible(),
    );
    await step(() =>
      page
        .getByRole("button", { name: "Kiểm tra lại quyền", exact: true })
        .click(),
    );
    await step(() =>
      expect(
        page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
      ).toBeEnabled(),
    );
    await step(() =>
      expect
        .poll(() =>
          page
            .getByRole("heading", { name: "Đối soát thanh toán", exact: true })
            .evaluate(
              (heading) =>
                document.activeElement === heading.closest("section"),
            ),
        )
        .toBe(true),
    );
  });
}
for (const width of [390, 768, 1440])
  test(`P032 ${width} actual preflight auth denial hides cached Finance and fresh recovery discards draft`, async ({
    page,
  }) => {
    const current = generation;
    note(current, "test-body:start");
    const item = readyTransfer(current);
    await login(page, current, width);
    const { form, bank } = await transferForm(page, item.id),
      writes = commands(page);
    await lock(current, true, 2);
    note(current, "form:prepared");
    note(current, "submit:start");
    await form
      .getByRole("button", {
        name: "Xác nhận tiền vào và đóng thông báo này",
        exact: true,
      })
      .click();
    await fence(page, current, [item.id, bank, "Synthetic bank evidence032"]);
    expect(writes).toHaveLength(0);
    expect((await db.doc(`orders/${item.id}`).get()).data()).toEqual(
      item.before,
    );
    await recover(page, current);
    const fresh = await transferForm(page, item.id, false);
    await expect(fresh.form.locator('[name="bank"]')).toHaveValue("");
    await expect(fresh.form.locator('[name="evidence"]')).toHaveValue("");
    expect(writes).toHaveLength(0);
  });
test("M032 actual command auth denial discards exception draft without financial effects", async ({
  page,
}) => {
  const current = generation,
    id = await exception(current);
  await login(page, current);
  const form = await exceptionForm(page, id),
    writes = commands(page);
  await lock(current, true, 2);
  await form
    .getByRole("button", { name: "Đóng ngoại lệ đã kiểm tra", exact: true })
    .click();
  await fence(page, current, [id, "Synthetic local evidence032"]);
  expect(writes).toHaveLength(1);
  expect((await db.doc(`paymentExceptions/${id}`).get()).get("state")).toBe(
    "open",
  );
  expect(
    (await db.collection("auditEvents").where("resourceId", "==", id).get())
      .empty,
  ).toBe(true);
  await recover(page, current);
});
test("U032 same-tick submissions share one lease; lost actual close response blocks other paths and exact replay has one audit", async ({
  page,
}) => {
  const current = generation,
    id = await exception(current),
    sibling = await exception(current);
  await login(page, current);
  const form = await exceptionForm(page, id),
    writes = commands(page);
  await exceptionForm(page, sibling);
  if (
    !(await form
      .locator("..")
      .evaluate((details) => details.hasAttribute("open")))
  )
    await form.locator("..").locator("summary").click();
  let drop = true;
  await page.route("**/financeReview", async (route) => {
    if (route.request().method() !== "POST" || !drop) {
      await route.continue();
      return;
    }
    drop = false;
    const response = await route.fetch();
    expect((await response.json()).error).toBeUndefined();
    await route.abort("failed");
  });
  // Fault-inject same-tick submits across TWO actual mounted handlers before React state updates.
  await page.evaluate(
    ({ first, second }) => {
      for (const id of [first, second]) {
        const card = [...document.querySelectorAll("article.crmItem")].find(
          (element) => element.textContent?.includes(id),
        );
        const form = card?.querySelector("form");
        if (!form) throw Error("Owned Finance032 form missing");
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
    },
    { first: id, second: sibling },
  );
  const retry = page.getByRole("button", {
    name: "Thử lại thao tác đang chờ",
    exact: true,
  });
  await expect(retry).toBeEnabled();
  expect(writes).toHaveLength(1);
  await expect(
    page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
  ).toBeDisabled();
  for (const button of await page
    .getByRole("group", { name: "Nhóm đối soát", exact: true })
    .getByRole("button")
    .all())
    await expect(button).toBeDisabled();
  await expect(form.locator('[name="reason"]')).toBeDisabled();
  await retry.click();
  await expect(
    page.getByText(
      "Đã lưu kết quả đối soát. Tải lại hàng đợi và đơn để xem dữ liệu mới.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[1]).toEqual(writes[0]);
  expect((await db.doc(`paymentExceptions/${id}`).get()).get("state")).toBe(
    "closed",
  );
  expect(
    (
      await db.collection("auditEvents").where("resourceId", "==", id).get()
    ).docs.filter((doc) => doc.get("action") === "closeException"),
  ).toHaveLength(1);
  expect(
    (await db.doc(`paymentExceptions/${sibling}`).get()).get("state"),
  ).toBe("open");
  expect(
    (
      await db
        .collection("auditEvents")
        .where("resourceId", "==", sibling)
        .get()
    ).empty,
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
  ).toBeEnabled();
});
test("R032 early read network failure waits held actual auth sibling; failed recovery stays fenced", async ({
  page,
}) => {
  const current = generation,
    id = await exception(current);
  await login(page, current);
  await exceptionForm(page, id);
  const writes = commands(page);
  let release!: () => void, entered!: () => void;
  const held = new Promise<void>((resolve) => {
      release = resolve;
    }),
    seen = new Promise<void>((resolve) => {
      entered = resolve;
    });
  await page.route("**/listWork", async (route: Route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const kind = route.request().postDataJSON().data.kind;
    if (kind === "membershipInvoices") {
      await route.abort("failed");
      return;
    }
    if (kind === "paymentExceptions") {
      entered();
      await held;
    }
    await route.continue();
  });
  try {
    await page
      .getByRole("button", { name: "Tải lại tài chính", exact: true })
      .click();
    await seen;
    await expect(
      page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("Cần kiểm tra lại quyền truy cập.", { exact: true }),
    ).toHaveCount(0);
    await lock(current, true, 2);
    release();
    await fence(page, current, [id]);
    expect(writes).toHaveLength(0);
  } finally {
    release();
    await page.unroute("**/listWork");
  }
  await lock(current, false, 3);
  await page.route("**/listWork", async (route) => {
    if (route.request().method() === "POST") await route.abort("failed");
    else await route.continue();
  });
  await page
    .getByRole("button", { name: "Kiểm tra lại quyền", exact: true })
    .click();
  await expect(
    page.getByText("Chưa kiểm tra được quyền truy cập. Thử lại.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kiểm tra lại quyền", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("body")).not.toContainText(id);
  expect(writes).toHaveLength(0);
  await page.unroute("**/listWork");
  await recover(page, current);
});
test("A032 ACK then actual auth-denied readback fences and fresh recovery never resends committed transfer", async ({
  page,
}) => {
  const current = generation;
  note(current, "test-body:start");
  const item = readyTransfer(current);
  await login(page, current);
  const { form, bank } = await transferForm(page, item.id),
    writes = commands(page);
  let settleTerminal!: (
    outcome: { ok: true } | { ok: false; cause: unknown },
  ) => void;
  const terminal = new Promise<{ ok: true } | { ok: false; cause: unknown }>(
    (resolve) => {
      settleTerminal = resolve;
    },
  );
  await page.route("**/command", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await tracked(async () => {
      try {
        await fixture(current, async (step) => {
          const response = await phase(current, "route-fetch", () =>
            step(() => route.fetch()),
          );
          expect((await response.json()).error).toBeUndefined();
          await phase(current, "own-profile-lock", () =>
            step(() =>
              db
                .doc(`users/${actor!.uid}`)
                .update({ locked: true, version: 2 }),
            ),
          );
          await phase(current, "actual-ack-delivery", () =>
            step(() => route.fulfill({ response })),
          );
        });
        settleTerminal({ ok: true });
        note(current, "actual-terminal:settled");
      } catch (cause) {
        note(current, "route:failed", {
          cancelled: (cause as Error)?.message === "032_FIXTURE_CANCELLED",
        });
        try {
          await route.abort("aborted");
          note(current, "route:aborted");
        } catch {
          note(current, "route:abort-unavailable");
        }
        settleTerminal({ ok: false, cause });
        if (
          (cause as Error)?.message === "032_FIXTURE_CANCELLED" &&
          current !== generation
        ) {
          note(current, "route:cancelled-retired");
          return; // Original test failure/timeout is already recorded; do not interrupt owned cleanup again.
        }
        throw cause;
      }
    });
  });
  note(current, "form:prepared");
  note(current, "submit:start");
  await form
    .getByRole("button", {
      name: "Xác nhận tiền vào và đóng thông báo này",
      exact: true,
    })
    .click();
  note(current, "actual-terminal:wait");
  const outcome = await terminal;
  if (current !== generation) return; // A timed-out test remains timed out; no late writes/assertions.
  if (!outcome.ok) throw outcome.cause;
  await fence(page, current, [item.id, bank, "Synthetic bank evidence032"]);
  expect(writes).toHaveLength(1);
  expect(writes[0].data.action).toBe("verifyTransfer");
  const committed = (await db.doc(`orders/${item.id}`).get()).data()!,
    bankMapping = (await db.doc(bankPath(bank)).get()).data()!;
  expect(committed).toMatchObject({
    collected: 240000,
    refunded: 0,
    version: item.before.version + 1,
    stage: item.before.stage,
  });
  expect(
    (await db.doc(`transferReviews/${item.reviewId}`).get()).get("status"),
  ).toBe("verified");
  const payments = (
    await db
      .collection("financialEntries")
      .where("orderId", "==", item.id)
      .get()
  ).docs.filter((doc) => doc.get("kind") === "payment");
  expect(payments).toHaveLength(1);
  expect(payments[0].data()).toMatchObject({
    amount: 240000,
    currency: "VND",
    orderId: item.id,
    actor: actor!.uid,
  });
  expect(bankMapping).toMatchObject({
    kind: "payment",
    amount: 240000,
    orderId: item.id,
    actor: actor!.uid,
    reviewId: item.reviewId,
  });
  const audits = (
    await db.collection("auditEvents").where("resourceId", "==", item.id).get()
  ).docs.filter((doc) => doc.get("action") === "verifyTransfer");
  expect(audits).toHaveLength(1);
  await expect(
    page.getByRole("button", {
      name: "Thử lại thao tác đang chờ",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.unroute("**/command");
  await recover(page, current);
  expect(writes).toHaveLength(1);
  expect((await db.doc(`orders/${item.id}`).get()).data()).toEqual(committed);
  expect((await db.doc(bankPath(bank)).get()).data()).toEqual(bankMapping);
  expect(
    (
      await db
        .collection("financialEntries")
        .where("orderId", "==", item.id)
        .get()
    ).docs.filter((doc) => doc.get("kind") === "payment"),
  ).toHaveLength(1);
  expect(
    (
      await db
        .collection("auditEvents")
        .where("resourceId", "==", item.id)
        .get()
    ).docs.filter((doc) => doc.get("action") === "verifyTransfer"),
  ).toHaveLength(1);
  await expect(
    page.getByRole("button", {
      name: "Thử lại thao tác đang chờ",
      exact: true,
    }),
  ).toHaveCount(0);
});
test("N032 ordinary preflight network failure keeps draft and releases lease without sending money", async ({
  page,
}) => {
  const current = generation,
    item = readyTransfer(current);
  await login(page, current);
  const { form, bank } = await transferForm(page, item.id),
    writes = commands(page);
  await page.route("**/orderHistory", async (route) => {
    if (route.request().method() === "POST") await route.abort("failed");
    else await route.continue();
  });
  await form
    .getByRole("button", {
      name: "Xác nhận tiền vào và đóng thông báo này",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      "Chưa kiểm tra được đơn. Kiểm tra lại trước khi xác nhận tiền.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(form.locator('[name="bank"]')).toHaveValue(bank);
  await expect(form.locator('[name="evidence"]')).toHaveValue(
    "Synthetic bank evidence032",
  );
  await expect(
    page.getByRole("button", { name: "Tải lại tài chính", exact: true }),
  ).toBeEnabled();
  expect(writes).toHaveLength(0);
  expect((await db.doc(`orders/${item.id}`).get()).data()).toEqual(item.before);
  await page.unroute("**/orderHistory");
});

test("E032 actual auth denial fences immediately while owned successful sibling remains held", async ({
  page,
}) => {
  const current = generation,
    item = readyTransfer(current),
    ownedActor = actor!;
  await login(page, current);
  const { bank } = await transferForm(page, item.id),
    writes = commands(page);
  const reviewBefore = (
    await db.doc(`transferReviews/${item.reviewId}`).get()
  ).data();
  const financialBefore = (
    await db
      .collection("financialEntries")
      .where("orderId", "==", item.id)
      .get()
  ).docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const auditBefore = (
    await db.collection("auditEvents").where("resourceId", "==", item.id).get()
  ).docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const bankBefore = (await db.doc(bankPath(bank)).get()).data();
  type Outcome = { ok: true } | { ok: false; cause: unknown };
  let releaseHeld!: () => void,
    allowDenied!: () => void,
    reportHeld!: (outcome: Outcome) => void,
    reportDenied!: (outcome: Outcome) => void;
  const heldGate = new Promise<void>((resolve) => {
      releaseHeld = resolve;
    }),
    denyGate = new Promise<void>((resolve) => {
      allowDenied = resolve;
    }),
    heldReceipt = new Promise<Outcome>((resolve) => {
      reportHeld = resolve;
    }),
    deniedReceipt = new Promise<Outcome>((resolve) => {
      reportDenied = resolve;
    });
  const routes = new Set<Promise<void>>();
  let successfulSiblingReleased = false;
  await page.route("**/listWork", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const kind = route.request().postDataJSON().data.kind;
    if (!["transferReviews", "membershipInvoices"].includes(kind)) {
      await route.continue();
      return;
    }
    const job = tracked(async () => {
      try {
        await fixture(current, async (step) => {
          if (kind === "membershipInvoices") await step(() => denyGate);
          const response = await step(() => route.fetch()),
            body = await step(() => response.json());
          if (kind === "transferReviews") {
            expect(response.status()).toBe(200);
            expect(body.error).toBeUndefined();
            expect(Array.isArray(body.result?.rows)).toBe(true);
            expect(
              body.result.rows.some(
                (row: { id: string }) => row.id === item.reviewId,
              ),
            ).toBe(true);
            reportHeld({ ok: true });
            note(current, "authorized-owned-sibling:held");
            await step(() => heldGate);
            await step(() => route.fulfill({ response }));
            successfulSiblingReleased = true;
            note(current, "authorized-owned-sibling:delivered");
          } else {
            expect(response.status()).toBe(403);
            expect(body.error?.status).toBe("PERMISSION_DENIED");
            await step(() => route.fulfill({ response }));
            reportDenied({ ok: true });
            note(current, "actual-auth-denial:delivered");
          }
        });
      } catch (cause) {
        (kind === "transferReviews" ? reportHeld : reportDenied)({
          ok: false,
          cause,
        });
        await route.abort("aborted").catch(() => undefined);
        if (
          (cause as Error)?.message === "032_FIXTURE_CANCELLED" &&
          current !== generation
        )
          return;
        throw cause;
      }
    });
    routes.add(job);
    try {
      await job;
    } finally {
      routes.delete(job);
    }
  });
  try {
    await page
      .getByRole("button", { name: "Tải lại tài chính", exact: true })
      .click();
    const held = await heldReceipt;
    if (!held.ok) throw held.cause;
    await fixture(current, async (step) => {
      await step(() =>
        db.doc(`users/${ownedActor.uid}`).update({ locked: true, version: 2 }),
      );
    });
    allowDenied();
    const denied = await deniedReceipt;
    if (!denied.ok) throw denied.cause;
    expect(successfulSiblingReleased).toBe(false);
    await fence(page, current, [
      item.id,
      item.reviewId,
      bank,
      "Synthetic bank evidence032",
    ]);
    await expect(
      page.getByRole("button", { name: "Kiểm tra lại quyền", exact: true }),
    ).toBeDisabled();
    expect(writes).toHaveLength(0);
    expect(successfulSiblingReleased).toBe(false);
  } finally {
    allowDenied();
    releaseHeld();
    await Promise.allSettled([...routes]);
    await page.unroute("**/listWork");
  }
  await expect(
    page.getByText("Cần kiểm tra lại quyền truy cập.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kiểm tra lại quyền", exact: true }),
  ).toBeEnabled();
  expect(successfulSiblingReleased).toBe(true);
  await expect(page.locator("body")).not.toContainText(item.id);
  await recover(page, current);
  const fresh = await transferForm(page, item.id, false);
  await expect(fresh.form.locator('[name="bank"]')).toHaveValue("");
  await expect(fresh.form.locator('[name="evidence"]')).toHaveValue("");
  expect(writes).toHaveLength(0);
  expect((await db.doc(`orders/${item.id}`).get()).data()).toEqual(item.before);
  expect(
    (await db.doc(`transferReviews/${item.reviewId}`).get()).data(),
  ).toEqual(reviewBefore);
  expect((await db.doc(bankPath(bank)).get()).data()).toEqual(bankBefore);
  expect(
    (
      await db
        .collection("financialEntries")
        .where("orderId", "==", item.id)
        .get()
    ).docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  ).toEqual(financialBefore);
  expect(
    (
      await db
        .collection("auditEvents")
        .where("resourceId", "==", item.id)
        .get()
    ).docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  ).toEqual(auditBefore);
});
