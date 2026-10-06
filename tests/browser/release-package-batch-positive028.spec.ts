import {
  test,
  expect,
  type Page,
  type Locator,
  type Route,
} from "@playwright/test";
import { getAuth } from "firebase-admin/auth";
import { getApp } from "firebase-admin/app";
import { randomUUID, createHash } from "node:crypto";
import { closeFixtures, db, customer, operator } from "./fixtures";
import { invoke as actualInvoke } from "./http";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(async () => {
  const auth = getAuth(getApp("release021-browser"));
  for (const [uid, role] of [
    [operator, "OWNER"],
    ["e2e005-finance", "FINANCE"],
    [customer, null],
  ] as const) {
    const [profile, identity, access] = await Promise.all([
      db.doc(`users/${uid}`).get(),
      auth.getUser(uid),
      role ? db.doc(`staffAccess/${uid}`).get() : Promise.resolve(null),
    ]);
    if (
      !profile.exists ||
      profile.get("locked") ||
      identity.disabled ||
      !identity.emailVerified ||
      !identity.providerData.some(
        (provider) => provider.providerId === "google.com",
      ) ||
      (role &&
        (!access?.exists ||
          access.get("active") !== true ||
          access.get("locked") ||
          !Array.isArray(access.get("roles")) ||
          !access.get("roles").includes(role)))
    )
      throw Error(
        "028 requires an existing authorized dedicated demo baseline; no shared seed is written",
      );
  }
});
test.afterAll(closeFixtures);
type Command = {
  action: string;
  operationId: string;
  parcelId?: string;
  batchId?: string;
  expectedVersion?: number;
  [key: string]: unknown;
};
let orderId = "";
let actor: { uid: string; identity: string } | null = null;
let setupGeneration = 0;
let setupPromise: Promise<string | null> | null = null;
let diagnostic: { current: number; start: number } | null = null;
const resources = new Set<string>(),
  ownedOrders = new Set<string>(),
  fillerPaths = new Set<string>(),
  operations = new Set<string>();
const inFlight = new Set<Promise<unknown>>();
function note(
  current: number,
  phase: string,
  metadata: Record<string, number | boolean | string> = {},
) {
  if (diagnostic?.current !== current) return;
  console.info(
    JSON.stringify({
      diagnostic: "SHIPPING028_PHASE",
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
    note(current, `${label}:failed`, {
      staleGeneration: current !== setupGeneration,
    });
    throw cause;
  }
}
function cancelledSetup(cause: unknown, current: number) {
  return (
    current !== setupGeneration &&
    cause instanceof Error &&
    ["028_FIXTURE_CANCELLED", "SETUP_CANCELLED"].includes(cause.message)
  );
}
function requireCurrent(current: number) {
  if (current !== setupGeneration) throw Error("028_FIXTURE_CANCELLED");
}
async function step<T>(current: number, run: () => Promise<T>) {
  requireCurrent(current);
  const promise = Promise.resolve().then(() => {
    requireCurrent(current);
    return run();
  });
  inFlight.add(promise);
  try {
    const result = await promise;
    requireCurrent(current);
    return result;
  } finally {
    inFlight.delete(promise);
  }
}
async function invoke<T = Record<string, unknown>>(
  current: number,
  name: string,
  data: unknown,
  identity = "owner",
) {
  requireCurrent(current);
  const operationId = (data as { operationId?: string }).operationId;
  if (operationId) operations.add(`e2e005-${identity}-${operationId}`);
  const action = (data as { action?: string }).action;
  const label =
    name === "command" &&
    [
      "verifyTransfer",
      "claimPurchase",
      "recordPurchase",
      "receive",
      "pack",
    ].includes(action ?? "")
      ? `canonical-${action}`
      : name === "shippingCommand"
        ? "parcel-setup"
        : "queue-read";
  return phase(current, label, () =>
    step(current, () => actualInvoke<T>(name, data, identity)),
  );
}
async function ownSources(current: number, ids: string[]) {
  return phase(current, "canonical-source", () =>
    step(current, () => ownSourcesImpl(current, ids)),
  );
}
async function ownSourcesImpl(current: number, ids: string[]) {
  requireCurrent(current);
  if (!ids.length || ids.length > 100 || new Set(ids).size !== ids.length)
    throw Error("Invalid owned source batch028");
  ids.forEach((id) => ownedOrders.add(id));
  const productId = `sanity-${randomUUID()}`;
  fillerPaths.add(`products/${productId}`);
  const product = {
    id: productId,
    title: `Synthetic ${productId}`,
    slug: productId,
    body: "Isolated browser fixture only",
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 120000,
    termsVersion: "synthetic-sanity-v1",
    catalogOptions: ["Small", "Large"],
  };
  await step(current, () => db.doc(`products/${productId}`).set(product));
  requireCurrent(current);
  const batch = db.batch(),
    now = Date.now();
  for (const id of ids)
    batch.set(
      db.doc(`orders/${id}`),
      createCatalogOrder(
        product,
        { productId, productVersion: 1, quantity: 2, variant: "Large" },
        { id, ownerId: customer, now },
      ),
    );
  await step(current, () => batch.commit());
}
async function ownActor(current: number) {
  return phase(current, "own-actor", () =>
    step(current, () => ownActorImpl(current)),
  );
}
async function ownActorImpl(current: number) {
  requireCurrent(current);
  const identity = `customer-${randomUUID()}`,
    uid = `e2e005-${identity}`,
    email = `${identity}@satsunicgo.example.invalid`;
  actor = { identity, uid }; // Register before any write, including Auth creation.
  const auth = getAuth(getApp("release021-browser"));
  await step(current, () =>
    auth.createUser({ uid, email, emailVerified: true }),
  );
  await step(current, () =>
    auth.updateUser(uid, {
      providerToLink: { providerId: "google.com", uid, email },
    }),
  );
  await step(current, () =>
    db.doc(`users/${uid}`).set({ ownerId: uid, locked: false, version: 1 }),
  );
  return actor;
}
async function trackedRoute(
  page: Page,
  current: number,
  pattern: string,
  handler: (route: Route) => Promise<void>,
) {
  requireCurrent(current);
  await page.route(pattern, async (route) => {
    const promise = (async () => {
      const guarded = new Proxy(route, {
        get(target, key) {
          const value = Reflect.get(target, key);
          if (typeof value !== "function") return value;
          if (!["fetch", "continue", "fulfill", "abort"].includes(String(key)))
            return value.bind(target);
          return async (...args: unknown[]) => {
            requireCurrent(current);
            const result = await value.apply(target, args);
            requireCurrent(current);
            return result;
          };
        },
      });
      try {
        requireCurrent(current);
        await handler(guarded);
      } catch (cause) {
        if (current === setupGeneration) throw cause;
        await route.abort("failed").catch(() => undefined); // Retire old transport, preserve primary failure.
      }
    })();
    inFlight.add(promise);
    try {
      await promise;
    } finally {
      inFlight.delete(promise);
    }
  });
}
async function readyOrder(generation: number) {
  const requireCurrent = () => {
    if (generation !== setupGeneration) throw Error("SETUP_CANCELLED");
  };
  const id = `queue028-${randomUUID()}`;
  await ownSources(generation, [id]);
  ownedOrders.add(id);
  requireCurrent();
  for (const [action, payload, identity] of [
    [
      "verifyTransfer",
      {
        amount: 240000,
        bankTransactionId: randomUUID(),
        evidence: "Synthetic bank setup028",
        reason: "Emulator only",
      },
      "finance",
    ],
    ["claimPurchase", {}, "owner"],
    [
      "recordPurchase",
      {
        quantity: 2,
        supplierOrder: "Synthetic queue028 supplier",
        actualSourceMinor: 1000,
        evidence: "Synthetic purchased028",
      },
      "owner",
    ],
    [
      "receive",
      { quantity: 2, condition: "good", evidence: "Synthetic received028" },
      "owner",
    ],
    [
      "pack",
      {
        weightGrams: 1000,
        dimensionsCm: [10, 20, 30],
        evidence: "Synthetic packed028",
        checklist: true,
      },
      "owner",
    ],
  ] as const) {
    if ("bankTransactionId" in payload)
      fillerPaths.add(
        `bankTransactions/${createHash("sha256").update(payload.bankTransactionId).digest("hex")}`,
      );
    const operationId = randomUUID();
    operations.add(`e2e005-${identity}-${operationId}`);
    const before = (await db.doc(`orders/${id}`).get()).data()!;
    requireCurrent();
    await invoke(
      generation,
      "command",
      {
        action,
        orderId: id,
        expectedVersion: before.version,
        operationId,
        payload,
      },
      identity,
    );
    requireCurrent();
  }
  const snapshot = await db.doc(`orders/${id}`).get();
  requireCurrent();
  expect(
    snapshot.exists,
    "Canonical setup order must exist before reading its stage",
  ).toBe(true);
  const ready = snapshot.data()!;
  expect(ready.stage).toBe("READY_TO_SHIP");
  expect(ready.collected).toBe(240000);
  expect(ready.packingComplete).toBe(true);
  return id;
}
async function setupParcel(current: number, quantity = 2) {
  return step(current, () => setupParcelImpl(current, quantity));
}
async function setupParcelImpl(current: number, quantity: number) {
  requireCurrent(current);
  const before = (await db.doc(`orders/${orderId}`).get()).data()!;
  const operationId = randomUUID();
  operations.add(`${operator}-${operationId}`);
  const parcel = await invoke<{ id: string }>(current, "shippingCommand", {
    action: "packParcel",
    operationId,
    orderVersions: { [orderId]: before.version },
    payload: {
      allocations: [{ orderId, line: 0, quantity }],
      weightGrams: 500,
      dimensionsCm: [10, 20, 30],
      warehouse: "Synthetic warehouse028",
      route: "US-VN",
      checklist: true,
      evidence: "Synthetic recovery setup028",
    },
  });
  resources.add(parcel.id);
  return parcel.id;
}
async function findParcel(page: Page, id: string) {
  const card = parcelCard(page, id);
  for (let guard = 0; guard < 30 && !(await card.count()); guard++) {
    const next = page.getByRole("button", {
      name: "Trang kiện sau",
      exact: true,
    });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(
      page.getByRole("button", { name: "Tải lại kiện", exact: true }),
    ).toBeEnabled();
  }
  await expect(card).toBeVisible();
  return card;
}
test("SHIPPING028 actual CAS retains handoff intent and requires reconciliation before a new operation", async ({
  page,
}) => {
  const current = setupGeneration;
  const id = await setupParcel(current);
  const commands = capture(page);
  let conflict = false;
  await trackedRoute(page, current, "**/shippingCommand", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    if (
      !conflict &&
      route.request().postDataJSON().data.action === "dispatchParcel"
    ) {
      conflict = true;
      await step(current, () =>
        db.doc(`packages/${id}`).update({ version: 2 }),
      );
    }
    await route.continue();
  });
  await login(page);
  const card = await findParcel(page, id);
  await openSummary(
    card.locator("summary").filter({ hasText: "Bàn giao kiện" }),
  );
  await handoff(card.locator("form"));
  await card
    .getByRole("button", { name: "Xác nhận bàn giao xuất gửi", exact: true })
    .click();
  const reconcile = page.getByRole("button", {
    name: "Đối chiếu dữ liệu kiện",
    exact: true,
  });
  await expect(reconcile).toBeVisible();
  await expect(card.locator('[name="tracking"]')).toHaveValue(
    "SYNTHETIC-QUEUE028",
  );
  await expect(
    card.getByRole("button", {
      name: "Xác nhận bàn giao xuất gửi",
      exact: true,
    }),
  ).toBeDisabled();
  expect(
    (await db.collection("packageHandoffs").where("parcelId", "==", id).get())
      .size,
  ).toBe(0);
  expect(
    (
      await db
        .doc(`idempotencyKeys/${operator}-${commands[0].operationId}`)
        .get()
    ).exists,
  ).toBe(false);
  await reconcile.click();
  await expect(reconcile).toHaveCount(0);
  await expect(card.locator('[name="tracking"]')).toHaveValue(
    "SYNTHETIC-QUEUE028",
  );
  await card
    .getByRole("button", { name: "Xác nhận bàn giao xuất gửi", exact: true })
    .click();
  await expect(card).toContainText("Đang vận chuyển");
  expect(commands).toHaveLength(2);
  expect(commands[0].expectedVersion).toBe(1);
  expect(commands[1].expectedVersion).toBe(2);
  expect(commands[1].operationId).not.toBe(commands[0].operationId);
  expect((await db.doc(`packages/${id}`).get()).data()?.version).toBe(3);
  expect(
    (await db.collection("packageHandoffs").where("parcelId", "==", id).get())
      .size,
  ).toBe(1);
});
test("SHIPPING028 held sibling pagination locks new commands and preserves quantities and checkbox intent", async ({
  page,
}) => {
  const current = setupGeneration;
  await fillerParcels(current);
  await login(page);
  const commands = capture(page),
    form = await packForm(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false;
  await trackedRoute(page, current, "**/listWork", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const data = route.request().postDataJSON().data;
    if (!held && data.kind === "packages" && data.after) {
      held = true;
      await gate;
    }
    await route.continue();
  });
  try {
    await openSummary(
      page.locator("summary").filter({ hasText: "Tạo lô gom" }),
    );
    await page
      .getByRole("button", { name: "Trang kiện gom sau", exact: true })
      .click();
    await expect.poll(() => held).toBe(true);
    await expect(form.locator("button.primary")).toBeDisabled();
    await expect(form.locator(`[name="${orderId}:0"]`)).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Tải lại kiện", exact: true }),
    ).toBeDisabled();
    expect(commands).toHaveLength(0);
    release();
    await expect(form.locator("button.primary")).toBeEnabled();
    await openSummary(
      page
        .locator("summary")
        .filter({ hasText: "Đóng kiện từ hàng đã kiểm và đóng gói" }),
    );
    await expect(form.locator(`[name="${orderId}:0"]`)).toHaveValue("2");
    await expect(form.locator('[name="checklist"]')).toBeChecked();
    expect(commands).toHaveLength(0);
  } finally {
    release();
    await page.unroute("**/listWork");
  }
});
test("SHIPPING028 delivering the first split parcel keeps the order in transit and money unchanged", async ({
  page,
}) => {
  const current = setupGeneration;
  const ids = [await setupParcel(current, 1), await setupParcel(current, 1)];
  const financialBefore = await ledger(orderId);
  for (const id of ids) {
    const before = (await db.doc(`orders/${orderId}`).get()).data()!;
    const operationId = randomUUID();
    operations.add(`${operator}-${operationId}`);
    await invoke(current, "shippingCommand", {
      action: "dispatchParcel",
      parcelId: id,
      expectedVersion: 1,
      operationId,
      orderVersions: { [orderId]: before.version },
      payload: {
        carrier: "Synthetic setup",
        tracking: "Synthetic split",
        handoffEvidence: "Synthetic split proof028",
      },
    });
  }
  await login(page);
  const card = await findParcel(page, ids[0]);
  await openSummary(
    card.locator("summary").filter({ hasText: "Cập nhật hành trình" }),
  );
  await card.locator('[name="state"]').selectOption("delivered");
  await card
    .locator('[name="event"]')
    .fill("Synthetic first split parcel delivered028");
  capture(page);
  await card
    .getByRole("button", { name: "Lưu cập nhật vận chuyển", exact: true })
    .click();
  const deliveredStatus = card
    .locator(":scope > p")
    .filter({ hasText: /^Đã giao kiện ·/ });
  await expect(deliveredStatus).toHaveCount(1);
  await expect(deliveredStatus).toBeVisible();
  expect((await db.doc(`packages/${ids[0]}`).get()).data()?.state).toBe(
    "delivered",
  );
  expect((await db.collection(`packages/${ids[0]}/events`).get()).size).toBe(1);
  expect((await db.doc(`orders/${orderId}`).get()).data()?.stage).toBe(
    "IN_TRANSIT",
  );
  expect((await db.doc(`packages/${ids[1]}`).get()).data()?.state).toBe(
    "in_transit",
  );
  expect(await ledger(orderId)).toEqual(financialBefore);
});
test.beforeEach(async () => {
  orderId = "";
  const current = ++setupGeneration;
  diagnostic = { current, start: performance.now() };
  note(current, "setup:start");
  // Attach retirement before the hook can time out. Only the known old generation retires.
  setupPromise = readyOrder(current).catch((cause: unknown) => {
    if (!cancelledSetup(cause, current)) throw cause;
    note(current, "setup:old-generation-retired");
    return null;
  });
  const id = await setupPromise;
  if (current !== setupGeneration) return; // Primary hook timeout remains reported by Playwright.
  if (!id) throw Error("028_ACTIVE_SETUP_EMPTY");
  orderId = id;
  note(current, "setup:settled");
});
test.afterEach(async ({ page }) => {
  const current = setupGeneration;
  note(current, "teardown:start");
  ++setupGeneration;
  // Finish the actual in-flight setup before deleting its owned records.
  // The beforeEach failure remains reported; this does not grant extra time.
  await setupPromise?.catch(() => undefined);
  while (inFlight.size) await Promise.allSettled([...inFlight]);
  setupPromise = null;
  let navigationError: unknown, cleanupError: unknown;
  note(current, "cleanup-navigation:start");
  try {
    await page.goto("/");
    note(current, "cleanup-navigation:settled");
  } catch (cause) {
    navigationError = cause;
    note(current, "cleanup-navigation:failed");
  }
  try {
    const paths = new Set(fillerPaths);
    if (actor) {
      paths.add(`staffAccess/${actor.uid}`);
      paths.add(`users/${actor.uid}`);
    }
    for (const id of operations) {
      const op = (await db.doc(`idempotencyKeys/${id}`).get()).data();
      if (op?.result?.id) resources.add(op.result.id);
    }
    for (const id of resources) {
      for (const kind of [
        "packages",
        "packageEvidence",
        "consolidationBatches",
      ])
        paths.add(`${kind}/${id}`);
      paths.add(`customerShipments/${customer}-${id}`);
      for (const d of (await db.collection(`packages/${id}/events`).get()).docs)
        paths.add(d.ref.path);
      for (const [kind, field] of [
        ["auditEvents", "resourceId"],
        ["outboxJobs", "resourceId"],
        ["packageHandoffs", "parcelId"],
        ["batchHandoffs", "batchId"],
      ])
        for (const d of (await db.collection(kind).where(field, "==", id).get())
          .docs)
          paths.add(d.ref.path);
    }
    for (const id of ownedOrders) {
      const order = (await db.doc(`orders/${id}`).get()).data();
      if (order?.catalogSnapshot?.productId)
        paths.add(`products/${order.catalogSnapshot.productId}`);
      for (const kind of ["orders", "packageAllocations"])
        paths.add(`${kind}/${id}`);
      for (const d of (
        await db.collection("auditEvents").where("resourceId", "==", id).get()
      ).docs)
        paths.add(d.ref.path);
      for (const kind of ["financialEntries", "outboxJobs", "auditEvents"])
        for (const d of (
          await db.collection(kind).where("orderId", "==", id).get()
        ).docs)
          paths.add(d.ref.path);
      for (const d of (await db.collection(`orders/${id}/timeline`).get()).docs)
        paths.add(d.ref.path);
    }
    for (const id of operations) paths.add(`idempotencyKeys/${id}`);
    const all = [...paths];
    note(current, "owned-cleanup:start", {
      paths: all.length,
      orders: ownedOrders.size,
      resources: resources.size,
      operations: operations.size,
      actor: Boolean(actor),
    });
    for (let offset = 0; offset < all.length; offset += 400) {
      const batch = db.batch();
      all
        .slice(offset, offset + 400)
        .forEach((path) => batch.delete(db.doc(path)));
      await batch.commit();
    }
    if (actor) {
      await getAuth(getApp("release021-browser"))
        .deleteUser(actor.uid)
        .catch((cause: { code?: string }) => {
          if (cause.code !== "auth/user-not-found") throw cause;
        });
      const absent = await getAuth(getApp("release021-browser"))
        .getUser(actor.uid)
        .then(
          () => false,
          (cause: { code?: string }) => {
            if (cause.code !== "auth/user-not-found") throw cause;
            return true;
          },
        );
      if (!absent) throw Error("028_OWNED_AUTH_CLEANUP_INCOMPLETE");
      actor = null;
    }
    let remaining = 0;
    for (let offset = 0; offset < all.length; offset += 400) {
      const snapshots = await db.getAll(
        ...all.slice(offset, offset + 400).map((path) => db.doc(path)),
      );
      remaining += snapshots.filter((snapshot) => snapshot.exists).length;
    }
    note(current, "owned-cleanup:readback", {
      checked: all.length,
      remaining,
      actorAbsent: actor === null,
    });
    if (remaining) throw Error("028_OWNED_RECORD_CLEANUP_INCOMPLETE");
    resources.clear();
    ownedOrders.clear();
    fillerPaths.clear();
    operations.clear();
    note(current, "owned-cleanup:settled");
  } catch (cause) {
    cleanupError = cause;
    note(current, "owned-cleanup:failed");
  }
  if (navigationError && cleanupError)
    throw new AggregateError(
      [navigationError, cleanupError],
      "028 navigation and owned cleanup failed",
    );
  if (cleanupError) throw cleanupError;
  if (navigationError) throw navigationError;
});
async function login(page: Page, identity = "owner") {
  await page.goto("/account");
  if (identity !== "owner")
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .evaluate((select, value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = "Synthetic isolated shipping028";
        (select as HTMLSelectElement).add(option);
      }, identity);
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  await page.goto("/crm/shipping");
  await expect(
    page.getByRole("button", { name: "Tải lại kiện", exact: true }),
  ).toBeEnabled();
}
function capture(page: Page) {
  const current = setupGeneration,
    actorUid = actor?.uid ?? operator;
  const commands: Command[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/(shippingCommand|consolidationCommand)$/.test(request.url())
    ) {
      if (current !== setupGeneration) return;
      const command = request.postDataJSON().data as Command;
      commands.push(command);
      operations.add(`${actorUid}-${command.operationId}`);
    }
  });
  return commands;
}
async function fillerParcels(
  current: number,
  prefix = `0-queue028-${randomUUID()}`,
) {
  return step(current, () => fillerParcelsImpl(current, prefix));
}
async function fillerParcelsImpl(
  current: number,
  prefix = `0-queue028-${randomUUID()}`,
) {
  requireCurrent(current);
  const batch = db.batch();
  for (let i = 0; i < 31; i++) {
    const id = `${prefix}-${String(i).padStart(2, "0")}`;
    const path = `packages/${id}`;
    fillerPaths.add(path);
    // Read-only queue guards, not a proof of delivery or an actionable allocation.
    batch.set(db.doc(path), {
      id,
      version: 1,
      state: "delivered",
      allocations: [],
      weightGrams: 1,
      warehouse: "Synthetic listing only",
      route: "US-VN",
    });
  }
  await step(current, () => batch.commit());
}
async function openSummary(summary: Locator) {
  await expect(summary).toHaveCount(1);
  if (
    !(await summary
      .locator("..")
      .evaluate((element) => (element as HTMLDetailsElement).open))
  )
    await summary.click();
}
async function packForm(page: Page) {
  await openSummary(
    page
      .locator("summary")
      .filter({ hasText: "Đóng kiện từ hàng đã kiểm và đóng gói" }),
  );
  const form = page.locator('form[data-intent="pack"]');
  await form
    .getByRole("textbox", { name: "Mã đơn", exact: true })
    .fill(orderId);
  await form.getByRole("button", { name: "Thêm đơn", exact: true }).click();
  await expect(form.locator(`[name="${orderId}:0"]`)).toBeVisible();
  await form.locator(`[name="${orderId}:0"]`).fill("2");
  for (const [name, value] of Object.entries({
    warehouse: "Synthetic warehouse028",
    route: "US-VN",
    weight: "1000",
    length: "10",
    width: "20",
    height: "30",
    evidence: "Synthetic parcel evidence028",
  }))
    await form.locator(`[name="${name}"]`).fill(value);
  await form.locator('[name="checklist"]').check();
  return form;
}
function parcelCard(page: Page, id: string) {
  return page
    .locator("article.crmItem")
    .filter({ has: page.getByText(id, { exact: true }) });
}
async function handoff(form: Locator) {
  await form.locator('[name="carrier"]').fill("Synthetic carrier028");
  await form.locator('[name="tracking"]').fill("SYNTHETIC-QUEUE028");
  await form.locator('[name="evidence"]').fill("Synthetic handoff evidence028");
}
async function ledger(id: string) {
  return (
    await db.collection("financialEntries").where("orderId", "==", id).get()
  ).docs.map((d) => ({ id: d.id, ...d.data() }));
}
for (const width of [390, 768, 1440]) {
  test(`SHIPPING028 actual pack dispatch delivery opens out-of-page result at ${width}`, async ({
    page,
  }) => {
    const current = setupGeneration;
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    await fillerParcels(current);
    const guardOrders = Array.from(
      { length: 31 },
      (_, i) => `0-order028-${String(i).padStart(2, "0")}-${randomUUID()}`,
    );
    guardOrders.forEach((id) => ownedOrders.add(id));
    await ownSources(current, guardOrders);
    const firstOrders = await invoke<{ rows: { id: string }[] }>(
      current,
      "listWork",
      {
        kind: "orders",
      },
    );
    expect(firstOrders.rows.some((row) => row.id === orderId)).toBe(false);
    const financialBefore = await ledger(orderId);
    const commands = capture(page);
    let lostId = "";
    if (width === 390)
      await trackedRoute(page, current, "**/shippingCommand", async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        if (
          route.request().postDataJSON().data.action === "packParcel" &&
          !lostId
        ) {
          const response = await route.fetch();
          const body = await response.json();
          expect(body.error).toBeUndefined();
          lostId = body.result.id;
          resources.add(lostId);
          await route.abort("failed");
        } else await route.continue();
      });
    await login(page);
    const form = await packForm(page);
    const create = form.getByRole("button", {
      name: "Tạo kiện nội bộ",
      exact: true,
    });
    await create.focus();
    await expect(create).toBeFocused();
    await page.keyboard.press("Enter");
    if (width === 390) {
      const retry = page.getByRole("button", {
        name: "Thử lại thao tác đã gửi",
        exact: true,
      });
      await expect(retry).toBeVisible();
      for (const name of [
        "Tải lại kiện",
        "Tải lại lô gom",
        "Trang kiện sau",
        "Trang lô sau",
      ])
        await expect(
          page.getByRole("button", { name, exact: true }),
        ).toBeDisabled();
      expect(
        (await db.doc(`packageAllocations/${orderId}`).get()).data()?.parcelIds,
      ).toEqual([lostId]);
      await retry.click();
    }
    await expect(
      page.getByText("Đã lưu kiện và lịch sử vận chuyển.", { exact: true }),
    ).toBeVisible();
    const allocations = (
      await db.doc(`packageAllocations/${orderId}`).get()
    ).data()!;
    const id = allocations.parcelIds[0];
    resources.add(id);
    expect(allocations.allocations).toEqual([
      { orderId, line: 0, quantity: 2 },
    ]);
    const first = await invoke<{ rows: { id: string }[] }>(
      current,
      "listWork",
      {
        kind: "packages",
      },
    );
    expect(first.rows.some((row) => row.id === id)).toBe(false);
    const card = parcelCard(page, id);
    await expect(card).toBeVisible();
    const focusedResult = page.getByRole("region", {
      name: "Kiện vừa lưu",
      exact: true,
    });
    await expect(focusedResult).toBeFocused();
    await expect(focusedResult).toBeInViewport({ ratio: 0.5 });
    const draftLookup = form.getByRole("textbox", {
      name: "Mã đơn",
      exact: true,
    });
    await draftLookup.fill("unsubmitted-draft028");
    await expect(draftLookup).toBeFocused();
    await draftLookup.fill("");
    if (width === 390) {
      expect(commands.filter((c) => c.action === "packParcel")).toHaveLength(2);
      expect(commands[1]).toEqual(commands[0]);
    }
    await openSummary(
      card.locator("summary").filter({ hasText: "Bàn giao kiện" }),
    );
    await handoff(card.locator("form"));
    await card
      .getByRole("button", { name: "Xác nhận bàn giao xuất gửi", exact: true })
      .click();
    const transitStatus = card
      .locator(":scope > p")
      .filter({ hasText: /^Đang vận chuyển ·/ });
    await expect(transitStatus).toHaveCount(1);
    await expect(transitStatus).toBeVisible();
    expect(
      (await db.collection("packageHandoffs").where("parcelId", "==", id).get())
        .size,
    ).toBe(1);
    await openSummary(
      card.locator("summary").filter({ hasText: "Cập nhật hành trình" }),
    );
    await card.locator('[name="state"]').selectOption("delivered");
    await card
      .locator('[name="event"]')
      .fill("Synthetic entire parcel delivered028");
    await card
      .getByRole("button", { name: "Lưu cập nhật vận chuyển", exact: true })
      .click();
    const deliveredStatus = card
      .locator(":scope > p")
      .filter({ hasText: /^Đã giao kiện ·/ });
    await expect(deliveredStatus).toHaveCount(1);
    await expect(deliveredStatus).toBeVisible();
    expect((await db.doc(`orders/${orderId}`).get()).data()?.stage).toBe(
      "DELIVERED",
    );
    expect((await db.collection(`packages/${id}/events`).get()).size).toBe(1);
    expect(await ledger(orderId)).toEqual(financialBefore);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/shipping-positive028-${width}.png`,
    });
  });
  test(`BATCH028 cross-page selection seals and dispatches actual catalog allocations at ${width}`, async ({
    page,
  }) => {
    const current = setupGeneration;
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    const before = (await db.doc(`orders/${orderId}`).get()).data()!;
    const financialBefore = await ledger(orderId);
    const ids: string[] = [];
    for (let i = 0; i < 2; i++) {
      const operationId = randomUUID();
      operations.add(`${operator}-${operationId}`);
      const parcel = await invoke<{ id: string }>(current, "shippingCommand", {
        action: "packParcel",
        operationId,
        orderVersions: { [orderId]: before.version },
        payload: {
          allocations: [{ orderId, line: 0, quantity: 1 }],
          weightGrams: 500,
          dimensionsCm: [10, 20, 30],
          warehouse: "Synthetic warehouse028",
          route: "US-VN",
          checklist: true,
          evidence: "Synthetic batch setup028",
        },
      });
      ids.push(parcel.id);
      resources.add(parcel.id);
    }
    ids.sort();
    await fillerParcels(current, `${ids[0]}-gap`);
    requireCurrent(current);
    const filler = db.batch();
    for (let i = 0; i < 31; i++) {
      const id = `0-batch028-${String(i).padStart(2, "0")}-${randomUUID()}`;
      const path = `consolidationBatches/${id}`;
      fillerPaths.add(path);
      filler.set(db.doc(path), {
        id,
        version: 1,
        state: "dispatched",
        parcelIds: [],
        orderIds: [],
        shares: {},
        freight: 0,
        route: "US-VN",
        hub: "Synthetic listing only",
        service: "Fixture",
        cutoff: Date.now(),
      });
    }
    await step(current, () => filler.commit());
    const commands = capture(page);
    let lostBatch = "";
    if (width === 390)
      await trackedRoute(
        page,
        current,
        "**/consolidationCommand",
        async (route) => {
          if (route.request().method() !== "POST") {
            await route.continue();
            return;
          }
          if (
            route.request().postDataJSON().data.action === "seal" &&
            !lostBatch
          ) {
            const response = await route.fetch();
            const body = await response.json();
            expect(body.error).toBeUndefined();
            lostBatch = body.result.id;
            resources.add(lostBatch);
            await route.abort("failed");
          } else await route.continue();
        },
      );
    await login(page);
    await openSummary(
      page.locator("summary").filter({ hasText: "Tạo lô gom" }),
    );
    const form = page.locator('form[data-intent="seal"]');
    let pages = 1;
    for (const id of ids) {
      const checkbox = form.getByRole("checkbox", {
        name: new RegExp(`^${id} ·`),
      });
      for (let guard = 0; guard < 30 && !(await checkbox.count()); guard++) {
        const next = form.getByRole("button", {
          name: "Trang kiện gom sau",
          exact: true,
        });
        await expect(next).toBeEnabled();
        await next.click();
        await expect(
          page.getByRole("button", { name: "Tải lại lô gom", exact: true }),
        ).toBeEnabled();
        pages++;
      }
      await expect(checkbox).toBeVisible();
      await checkbox.check();
      await expect(form.getByText(id, { exact: true })).toBeVisible();
    }
    expect(pages).toBeGreaterThan(1);
    await expect(form).toContainText("Đã chọn 2/20 kiện · 1/10 đơn");
    await form.locator(`[name="weight:${orderId}"]`).fill("1000");
    for (const [name, value] of Object.entries({
      freight: "101",
      hub: "Synthetic VN hub",
      service: "Synthetic Air",
    }))
      await form.locator(`[name="${name}"]`).fill(value);
    const cutoff = await page.evaluate(() => {
      const d = new Date(Date.now() + 3600000);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    });
    await form.locator('[name="cutoff"]').fill(cutoff);
    const seal = form.getByRole("button", {
      name: "Chốt lô và phân bổ cước",
      exact: true,
    });
    await seal.focus();
    await expect(seal).toBeFocused();
    await page.keyboard.press("Enter");
    if (width === 390) {
      const retry = page.getByRole("button", {
        name: "Thử lại thao tác đã gửi",
        exact: true,
      });
      await expect(retry).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Tải lại kiện", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Tải lại lô gom", exact: true }),
      ).toBeDisabled();
      expect((await db.doc(`orders/${orderId}`).get()).data()?.version).toBe(
        before.version + 1,
      );
      await retry.click();
    }
    await expect(
      page.getByText("Đã chốt phân bổ cước cho lô.", { exact: true }),
    ).toBeVisible();
    const batchId = (await db.doc(`packages/${ids[0]}`).get()).data()!.batchId;
    resources.add(batchId);
    const sealed = (
      await db.doc(`consolidationBatches/${batchId}`).get()
    ).data()!;
    expect(sealed.parcelIds.sort()).toEqual(ids);
    expect(sealed.shares).toEqual({ [orderId]: 101 });
    const order = (await db.doc(`orders/${orderId}`).get()).data()!;
    expect(order.finalTotal).toBe(before.finalTotal);
    expect(order.collected).toBe(before.collected);
    expect(order.finalFreightVersion).toBe(1);
    const first = await invoke<{ rows: { id: string }[] }>(
      current,
      "listWork",
      {
        kind: "consolidationBatches",
      },
    );
    expect(first.rows.some((row) => row.id === batchId)).toBe(false);
    const card = page
      .locator("article.crmItem")
      .filter({ has: page.getByText(batchId, { exact: true }) });
    await expect(card).toBeVisible();
    const focusedResult = page.getByRole("region", {
      name: "Lô vừa lưu",
      exact: true,
    });
    await expect(focusedResult).toBeFocused();
    await expect(focusedResult).toBeInViewport({ ratio: 0.5 });
    await openSummary(
      page
        .locator("summary")
        .filter({ hasText: "Đóng kiện từ hàng đã kiểm và đóng gói" }),
    );
    const draftLookup = page
      .locator('form[data-intent="pack"]')
      .getByRole("textbox", { name: "Mã đơn", exact: true });
    await draftLookup.fill("unsubmitted-draft028");
    await expect(draftLookup).toBeFocused();
    await draftLookup.fill("");
    await openSummary(
      card.locator("summary").filter({ hasText: "Bàn giao toàn bộ lô" }),
    );
    await handoff(card.locator("form"));
    await card
      .getByRole("button", {
        name: "Xác nhận xuất gửi toàn bộ lô",
        exact: true,
      })
      .click();
    await expect(card).toContainText("Đã bàn giao");
    for (const id of ids)
      expect((await db.doc(`packages/${id}`).get()).data()?.state).toBe(
        "in_transit",
      );
    expect(
      (
        await db
          .collection("batchHandoffs")
          .where("batchId", "==", batchId)
          .get()
      ).size,
    ).toBe(1);
    expect(await ledger(orderId)).toEqual(financialBefore);
    expect(commands.map((c) => c.action)).toEqual(
      width === 390 ? ["seal", "seal", "dispatch"] : ["seal", "dispatch"],
    );
    if (width === 390) expect(commands[1]).toEqual(commands[0]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/batch-positive028-${width}.png`,
    });
  });
}
test("SHIPPING028 acknowledged creation with lost readback keeps success and retries only the exact read", async ({
  page,
}) => {
  const current = setupGeneration;
  await fillerParcels(current);
  const commands = capture(page);
  let failedRead = false;
  await trackedRoute(page, current, "**/listWork", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const data = route.request().postDataJSON().data;
    if (!failedRead && data.kind === "packages" && data.id) {
      failedRead = true;
      await route.abort("failed");
    } else await route.continue();
  });
  await login(page);
  const form = await packForm(page);
  await form
    .getByRole("button", { name: "Tạo kiện nội bộ", exact: true })
    .click();
  await expect(
    page.getByText("Đã lưu kiện. Chưa tải được chi tiết.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Đã lưu kiện và lịch sử vận chuyển.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thử lại thao tác đã gửi", exact: true }),
  ).toHaveCount(0);
  const id = (await db.doc(`packageAllocations/${orderId}`).get()).data()!
    .parcelIds[0];
  resources.add(id);
  expect(commands).toHaveLength(1);
  await page
    .getByRole("button", { name: "Tải chi tiết kiện", exact: true })
    .click();
  await expect(parcelCard(page, id)).toBeVisible();
  expect(commands).toHaveLength(1);
  expect(
    (await db.doc(`packageAllocations/${orderId}`).get()).data()?.parcelIds,
  ).toEqual([id]);
});
test("BATCH028 a missing referenced order closes actions without losing existing selected intent", async ({
  page,
}) => {
  const current = setupGeneration;
  let mainFrameNavigations = 0;
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    mainFrameNavigations++;
    const pathname = new URL(frame.url()).pathname;
    note(current, "missing-reference:main-frame", {
      mainFrameNavigations,
      shippingPath: pathname === "/crm/shipping",
      accountPath: pathname === "/account",
    });
  });
  const id = await setupParcel(current);
  const missingId = `0-missing028-${randomUUID()}`;
  const invalid = {
    id: missingId,
    version: 1,
    state: "packed",
    allocations: [
      { orderId: `missing-order028-${randomUUID()}`, line: 0, quantity: 1 },
    ],
    weightGrams: 10,
    warehouse: "Synthetic missing reference guard",
    route: "US-VN",
  };
  requireCurrent(current);
  fillerPaths.add(`packages/${missingId}`);
  await step(current, () => db.doc(`packages/${missingId}`).set(invalid));
  const commands = capture(page);
  await login(page);
  note(current, "missing-reference:login-settled", { mainFrameNavigations });
  await openSummary(page.locator("summary").filter({ hasText: "Tạo lô gom" }));
  note(current, "missing-reference:summary-open", { mainFrameNavigations });
  const form = page.locator('form[data-intent="seal"]');
  const choose = async (parcelId: string) => {
    const checkbox = form.getByRole("checkbox", {
      name: new RegExp(`^${parcelId} ·`),
    });
    for (let guard = 0; guard < 30 && !(await checkbox.count()); guard++) {
      await form
        .getByRole("button", { name: "Trang kiện gom sau", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Tải lại lô gom", exact: true }),
      ).toBeEnabled();
    }
    await checkbox.check();
  };
  await choose(id);
  await form.locator(`[name="weight:${orderId}"]`).fill("500");
  while (
    await form
      .getByRole("button", { name: "Trang kiện gom trước", exact: true })
      .isEnabled()
  ) {
    await form
      .getByRole("button", { name: "Trang kiện gom trước", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Tải lại lô gom", exact: true }),
    ).toBeEnabled();
  }
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false;
  await trackedRoute(page, current, "**/listWork", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const data = route.request().postDataJSON().data;
    if (data.kind === "orders" && data.id === invalid.allocations[0].orderId) {
      held = true;
      await gate;
    }
    await route.continue();
  });
  const missingCheckbox = form.getByRole("checkbox", {
    name: new RegExp(`^${missingId} ·`),
  });
  try {
    await choose(missingId);
    await expect.poll(() => held).toBe(true);
    await expect(missingCheckbox).toBeChecked();
    await expect(form.getByRole("status")).toHaveText("Đang kiểm tra kiện…");
    await expect(form).toContainText("Đã chọn 1/20 kiện");
    await expect(
      form.getByRole("button", {
        name: "Chốt lô và phân bổ cước",
        exact: true,
      }),
    ).toBeDisabled();
  } finally {
    release();
  }
  const reconcile = page.getByRole("button", {
    name: "Đối chiếu dữ liệu lô",
    exact: true,
  });
  await expect(reconcile).toBeVisible();
  await expect(missingCheckbox).not.toBeChecked();
  await expect(form.getByRole("alert")).toContainText(
    `Kiện ${missingId} chưa được thêm`,
  );
  await expect(form).toContainText("Đã chọn 1/20 kiện");
  await expect(
    form.getByRole("button", { name: "Chốt lô và phân bổ cước", exact: true }),
  ).toBeDisabled();
  await reconcile.click();
  await expect(reconcile).toHaveCount(0);
  await expect(form.locator(`[name="weight:${orderId}"]`)).toHaveValue("500");
  expect(commands).toHaveLength(0);
  expect((await db.doc(`packages/${missingId}`).get()).data()).toEqual(invalid);
  expect((await db.doc(`packages/${id}`).get()).data()?.version).toBe(1);
});

for (const scope of ["shipping", "batch"] as const)
  test(`AUTH028 ${scope} actual isolated profile denial hides cached IDs until authorized reconciliation`, async ({
    page,
  }) => {
    const current = setupGeneration;
    const id = scope === "batch" ? await setupParcel(current) : "";
    await ownActor(current);
    await step(current, () =>
      db
        .doc(`staffAccess/${actor!.uid}`)
        .set({ active: true, locked: false, roles: ["OWNER"], version: 1 }),
    );
    const commands = capture(page);
    await login(page, actor!.identity);
    const region =
      scope === "shipping"
        ? page.locator("section.workbench").filter({
            has: page.getByRole("heading", {
              name: "Kiện hàng và xuất gửi",
              exact: true,
            }),
          })
        : page.locator("section.workbench").filter({
            has: page.getByRole("heading", {
              name: "Gom kiện và phân bổ cước",
              exact: true,
            }),
          });
    if (scope === "shipping") await packForm(page);
    else {
      await packForm(page);
      await openSummary(
        page.locator("summary").filter({ hasText: "Tạo lô gom" }),
      );
      const form = page.locator('form[data-intent="seal"]');
      const checkbox = form.getByRole("checkbox", {
        name: new RegExp(`^${id} ·`),
      });
      for (let guard = 0; guard < 30 && !(await checkbox.count()); guard++) {
        await form
          .getByRole("button", { name: "Trang kiện gom sau", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "Tải lại lô gom", exact: true }),
        ).toBeEnabled();
      }
      await checkbox.check();
      await expect(form.locator(`[name="weight:${orderId}"]`)).toBeVisible();
      await form.locator(`[name="weight:${orderId}"]`).fill("500");
    }
    const before = (await db.doc(`orders/${orderId}`).get()).data();
    await step(current, () =>
      db.doc(`users/${actor!.uid}`).update({ locked: true, version: 2 }),
    );
    await page
      .getByRole("button", {
        name: scope === "shipping" ? "Tải lại kiện" : "Tải lại lô gom",
        exact: true,
      })
      .click();
    const denied = page.getByText(
      "Không có quyền xem dữ liệu này. Đối chiếu lại sau khi được cấp quyền.",
      { exact: true },
    );
    await expect(denied).toBeVisible();
    const fence = denied.locator("..");
    await expect(page.locator("body")).not.toContainText(orderId);
    if (id) await expect(page.locator("body")).not.toContainText(id);
    await expect(page.locator("form[data-intent]")).toHaveCount(0);
    await expect(fence.locator("form, input, article")).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "Cần tài khoản nhân viên được cấp quyền",
        exact: true,
      }),
    ).toHaveCount(0);
    await step(current, () =>
      db.doc(`users/${actor!.uid}`).update({ locked: false, version: 3 }),
    );
    await expect(denied).toBeVisible();
    await fence
      .getByRole("button", { name: "Đối chiếu dữ liệu kiện", exact: true })
      .click();
    await expect(denied).toHaveCount(0);
    await expect(region.last()).toBeVisible();
    await openSummary(
      page.locator("summary").filter({
        hasText:
          scope === "shipping"
            ? "Đóng kiện từ hàng đã kiểm và đóng gói"
            : "Tạo lô gom",
      }),
    );
    if (scope === "shipping")
      await expect(page.locator(`input[name="${orderId}:0"]`)).toHaveValue("2");
    else {
      const form = page.locator('form[data-intent="seal"]');
      await expect(form).toContainText("Đã chọn 0/20 kiện");
      await expect(form.locator(`[name="weight:${orderId}"]`)).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Tải lại lô gom", exact: true }),
      ).toBeEnabled();
    }
    expect(commands).toHaveLength(0);
    expect((await db.doc(`orders/${orderId}`).get()).data()).toEqual(before);
  });
