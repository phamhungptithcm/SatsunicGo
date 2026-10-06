import { test, expect, type Page, type Locator } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db, operator, closeFixtures } from "./fixtures";
import { call } from "./http";

// This file does not call seedIdentities or write any settings singleton.
// Production MFA is NOT_TESTED: these real callable requests use the demo runtime.
test.describe.configure({ mode: "serial" });
test.beforeAll(async () => {
  const [staff, user] = await Promise.all([
    db.doc(`staffAccess/${operator}`).get(),
    db.doc(`users/${operator}`).get(),
  ]);
  expect(staff.get("active")).toBe(true);
  expect(staff.get("roles")).toContain("OWNER");
  expect(staff.get("locked") === true || user.get("locked") === true).toBe(
    false,
  );
});
test.afterAll(closeFixtures);
type Command = {
  action: string;
  operationId: string;
  id?: string;
  ownerId?: string;
  expectedVersion?: number;
  payload?: unknown;
};
type Phase =
  | "fixture_register"
  | "login_start"
  | "login_done"
  | "view_start"
  | "owned_row_wait"
  | "editor_open"
  | "editor_probe"
  | "rpc_request"
  | "rpc_response"
  | "unknown_commit_start"
  | "unknown_commit_done"
  | "unknown_response_lost"
  | "retry_start"
  | "retry_done"
  | "pre_teardown"
  | "cleanup_start"
  | "cleanup_done"
  | "cleanup_failed";
const timing = new WeakMap<Page, { start: number; sequence: number }>();
function phase(page: Page, name: Phase, flags: Record<string, boolean> = {}) {
  let state = timing.get(page);
  if (!state) {
    state = { start: performance.now(), sequence: 0 };
    timing.set(page, state);
  }
  console.info(
    JSON.stringify({
      diagnostic: "ADMIN030_PHASE",
      phase: name,
      sequence: ++state.sequence,
      elapsedMs: Math.round(performance.now() - state.start),
      ...flags,
    }),
  );
}
type Owned = {
  resources: { collection: string; id: string }[];
  commands: Command[];
  userId?: string;
  cancelled: boolean;
  preparationTasks: Set<Promise<void>>;
};
const owned = new Map<Page, Owned>();
const inFlightWrites = new WeakMap<Page, Set<object>>();
function register(
  page: Page,
  resources: Owned["resources"],
  commands: Command[],
  userId?: string,
) {
  if (owned.has(page))
    throw new Error("Owned fixture generation already registered");
  const state: Owned = {
    resources,
    commands,
    userId,
    cancelled: false,
    preparationTasks: new Set(),
  };
  owned.set(page, state);
  phase(page, "fixture_register", { registered: true });
  return state;
}
function knownCustomer() {
  const identity = `customer-${randomUUID()}`;
  return { identity, uid: `e2e005-${identity}` };
}
function requireOwnedUser(uid: string) {
  if (!/^e2e005-customer-[a-f0-9-]{36}$/.test(uid))
    throw new Error("Auth operation refused non-owned candidate");
}
function prepareCustomer(
  page: Page,
  state: Owned,
  target: ReturnType<typeof knownCustomer>,
) {
  const requireLive = () => {
    if (
      owned.get(page) !== state ||
      state.cancelled ||
      state.userId !== target.uid
    )
      throw new Error("Owned identity preparation cancelled");
    requireOwnedUser(target.uid);
  };
  const operation = Promise.resolve().then(async () => {
    const auth = getAuth(getApp("release021-browser"));
    const email = `${target.identity}@satsunicgo.example.invalid`;
    requireLive();
    await auth.createUser({ uid: target.uid, email, emailVerified: true });
    requireLive();
    await auth.updateUser(target.uid, {
      providerToLink: { providerId: "google.com", uid: target.uid, email },
    });
    requireLive();
    await db
      .doc(`users/${target.uid}`)
      .set({ ownerId: target.uid, locked: false, version: 1 });
    requireLive();
  });
  const settled = operation.then(
    () => undefined,
    () => undefined,
  );
  state.preparationTasks.add(settled);
  void settled.then(() => {
    state.preparationTasks.delete(settled);
  });
  return operation;
}
function preTeardown(page: Page) {
  phase(page, "pre_teardown", {
    pageClosed: page.isClosed(),
    primaryError: test.info().errors.length > 0,
    ownedRegistered: owned.has(page),
    preparationInFlight: (owned.get(page)?.preparationTasks.size ?? 0) > 0,
    ownedWriteInFlight: (inFlightWrites.get(page)?.size ?? 0) > 0,
  });
}
test.afterEach(async ({ page }, info) => {
  const state = owned.get(page);
  if (!state) return;
  state.cancelled = true;
  phase(page, "cleanup_start", {
    preparationInFlight: state.preparationTasks.size > 0,
    pageClosed: page.isClosed(),
    primaryError: info.errors.length > 0,
    ownedWriteInFlight: (inFlightWrites.get(page)?.size ?? 0) > 0,
  });
  try {
    await Promise.allSettled([...state.preparationTasks]);
    if (owned.get(page) !== state)
      throw new Error("Cleanup generation changed");
    await cleanup(page, state.resources, state.commands, state.userId);
    phase(page, "cleanup_done", {
      cleanupComplete: true,
      preparationInFlight: state.preparationTasks.size > 0,
      ownedWriteInFlight: (inFlightWrites.get(page)?.size ?? 0) > 0,
    });
  } catch (error) {
    phase(page, "cleanup_failed", {
      cleanupComplete: false,
      primaryError: info.errors.length > 0,
    });
    if (info.errors.length === 0) throw error;
  } finally {
    if (owned.get(page) === state) owned.delete(page);
  }
});
async function editorProbe(page: Page, beforeTeardown = false) {
  try {
    const select = page.locator('select[name="status"]');
    const [selectCount, formCount, labelCount, roleCount, open] =
      await Promise.all([
        select.count(),
        page.locator("details.panel > form").count(),
        page.getByLabel("Trạng thái biên tập", { exact: true }).count(),
        page
          .getByRole("combobox", { name: "Trạng thái biên tập", exact: true })
          .count(),
        select.evaluateAll((elements) =>
          elements.some(
            (element) =>
              (element.closest("details.panel") as HTMLDetailsElement | null)
                ?.open === true,
          ),
        ),
      ]);
    const [captionLabelCount, captionRoleCount, textareaCount] =
      await Promise.all([
        page.getByLabel("Caption", { exact: true }).count(),
        page.getByRole("textbox", { name: "Caption", exact: true }).count(),
        page.locator('textarea[name="caption"]').count(),
      ]);
    phase(page, "editor_probe", {
      beforeTeardown,
      probeReadable: true,
      pageClosed: page.isClosed(),
      formPresent: formCount > 0,
      selectPresent: selectCount > 0,
      selectVisible: selectCount > 0 && (await select.first().isVisible()),
      editorOpen: open,
      labelExactPresent: labelCount > 0,
      labelExactUnique: labelCount === 1,
      roleExactPresent: roleCount > 0,
      roleExactUnique: roleCount === 1,
      captionLabelExactPresent: captionLabelCount > 0,
      captionLabelExactUnique: captionLabelCount === 1,
      captionRoleExactPresent: captionRoleCount > 0,
      captionRoleExactUnique: captionRoleCount === 1,
      captionTextareaVisible:
        textareaCount > 0 &&
        (await page.locator('textarea[name="caption"]').first().isVisible()),
    });
  } catch {
    phase(page, "editor_probe", {
      beforeTeardown,
      probeReadable: false,
      pageClosed: page.isClosed(),
    });
  }
}
const ownId = (kind: string) => `0-admin030-${kind}-${randomUUID()}`;
async function login(page: Page, width: number) {
  phase(page, "login_start");
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
  phase(page, "login_done");
}
async function geometry(page: Page, control: Locator) {
  await expect(control).toBeVisible();
  await control.focus();
  await expect(control).toBeFocused();
  expect(
    await control.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return r.left >= -1 && r.right <= innerWidth + 1;
    }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
function capture(page: Page, action: string, id: string) {
  const commands: Command[] = [];
  const pendingWrites = new Set<object>();
  inFlightWrites.set(page, pendingWrites);
  page.on("requestfinished", (request) => pendingWrites.delete(request));
  page.on("requestfailed", (request) => pendingWrites.delete(request));
  page.on("request", (r) => {
    if (
      r.method() !== "POST" ||
      !/\/(workspaceCommand|membershipCommand)$/.test(r.url())
    )
      return;
    const c = r.postDataJSON()?.data as Command;
    if (c?.action === action && (c.id === id || c.ownerId === id)) {
      commands.push(c);
      pendingWrites.add(r);
    }
  });
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      /\/(workspaceCommand|membershipCommand|listWork)$/.test(r.url())
    )
      phase(page, "rpc_request");
  });
  page.on("response", (r) => {
    if (
      r.request().method() !== "POST" ||
      !/\/(workspaceCommand|membershipCommand|listWork)$/.test(r.url())
    )
      return;
    void r
      .json()
      .then((body) => {
        const rows = body.result?.rows;
        phase(page, "rpc_response", {
          success: !!body.result,
          hasError: !!body.error,
          ownedRowVisible:
            Array.isArray(rows) &&
            rows.some((row: { id?: string }) => row.id === id),
          hasContinuation: !!body.result?.next,
        });
      })
      .catch(() => phase(page, "rpc_response", { bodyReadable: false }));
  });
  return commands;
}
function response(page: Page, action: string, id: string) {
  return page.waitForResponse((r) => {
    if (
      !/\/(workspaceCommand|membershipCommand)$/.test(r.url()) ||
      r.request().method() !== "POST"
    )
      return false;
    const c = r.request().postDataJSON()?.data;
    return c?.action === action && (c.id === id || c.ownerId === id);
  });
}
async function loseCommittedResponse(page: Page, action: string, id: string) {
  let lost = false;
  await page.route("**/*Command", async (route) => {
    const c = route.request().postDataJSON()?.data;
    if (lost || c?.action !== action || (c.id !== id && c.ownerId !== id))
      return route.continue();
    phase(page, "unknown_commit_start");
    const actual = await route.fetch();
    expect((await actual.json()).result).toBeDefined();
    phase(page, "unknown_commit_done", { committed: true });
    lost = true;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          status: "UNAVAILABLE",
          message: "Synthetic lost committed response030",
        },
      }),
    });
    phase(page, "unknown_response_lost", { injected: true });
  });
  return () => expect(lost).toBe(true);
}
async function retry(page: Page) {
  phase(page, "retry_start");
  await page
    .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Thử lại thao tác đang chờ",
      exact: true,
    }),
  ).toHaveCount(0);
  phase(page, "retry_done");
}
async function audited(id: string, action: string, count: number) {
  const rows = await db
    .collection("auditEvents")
    .where("resourceId", "==", id)
    .limit(20)
    .get();
  expect(rows.size).toBe(count);
  for (const row of rows.docs)
    expect(row.data()).toMatchObject({
      actor: operator,
      action,
      resourceId: id,
    });
}
async function receipts(commands: Command[], id: string) {
  const unique = [...new Map(commands.map((c) => [c.operationId, c])).values()];
  expect(unique).toHaveLength(4);
  for (const c of unique) {
    const receipt = await db
      .doc(`idempotencyKeys/${operator}-${c.operationId}`)
      .get();
    if (c.expectedVersion === 2) expect(receipt.exists).toBe(false);
    else
      expect(receipt.get("result")).toEqual({
        id,
        version: Number(c.expectedVersion) + 1,
      });
  }
}
async function cleanup(
  page: Page,
  resources: { collection: string; id: string }[],
  commands: Command[],
  userId?: string,
) {
  // Exact DB/Auth cleanup never depends on an open page or route teardown.
  phase(page, "cleanup_start", { pageClosed: page.isClosed() });
  const batch = db.batch();
  for (const { collection, id } of resources) {
    batch.delete(db.doc(`${collection}/${id}`));
    if (["campaigns", "membershipPlans"].includes(collection)) {
      const versions = await db
        .collection(`${collection}/${id}/versions`)
        .limit(20)
        .get();
      expect(versions.size).toBeLessThan(20);
      versions.docs.forEach((d) => batch.delete(d.ref));
    }
    const audits = await db
      .collection("auditEvents")
      .where("resourceId", "==", id)
      .limit(20)
      .get();
    expect(audits.size).toBeLessThan(20);
    for (const a of audits.docs) {
      expect(a.get("actor")).toBe(operator);
      batch.delete(a.ref);
    }
  }
  for (const op of new Set(commands.map((c) => c.operationId))) {
    batch.delete(db.doc(`idempotencyKeys/${operator}-${op}`));
    if (userId) batch.delete(db.doc(`outboxJobs/membership-${operator}-${op}`));
  }
  if (userId) {
    const history = await db
      .collection("membershipHistory")
      .where("ownerId", "==", userId)
      .limit(20)
      .get();
    expect(history.size).toBeLessThan(20);
    for (const row of history.docs) {
      expect(row.get("actor")).toBe(operator);
      batch.delete(row.ref);
    }
  }
  await batch.commit();
  if (userId) {
    requireOwnedUser(userId);
    try {
      await getAuth(getApp("release021-browser")).deleteUser(userId);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found")
        throw error;
    }
  }
}
const plan = {
  name: "PLUS",
  price: 100000,
  periodDays: 7,
  serviceDiscountBps: 500,
  discountCap: 10000,
  status: "published",
};

for (const width of [390, 768, 1440]) {
  test(`CRM030 campaign positive CAS and committed unknown replay at ${width}`, async ({
    page,
  }) => {
    const id = ownId("campaign"),
      ref = db.doc(`campaigns/${id}`),
      commands = capture(page, "saveCampaign", id);
    const initial = {
      title: id,
      caption: "Synthetic caption030",
      path: "/posts/synthetic030",
      source: "fixture",
      medium: "manual",
      campaign: "synthetic030",
      status: "draft",
      socialPosting: "disabled",
      version: 1,
    };
    const open = async () => {
      phase(page, "view_start");
      await page.goto("/crm/campaigns");
      phase(page, "owned_row_wait");
      await page
        .locator("article")
        .filter({ has: page.getByRole("heading", { name: id, exact: true }) })
        .getByRole("button", { name: "Chỉnh sửa", exact: true })
        .click();
      phase(page, "editor_open");
      await editorProbe(page);
    };
    const save = page.getByRole("button", {
      name: "Lưu chiến dịch",
      exact: true,
    });
    register(page, [{ collection: "campaigns", id }], commands);
    try {
      await ref.set(initial);
      await login(page, width);
      await open();
      await page
        .getByRole("combobox", { name: "Trạng thái biên tập", exact: true })
        .selectOption("approved");
      await geometry(page, save);
      await save.click();
      await expect.poll(async () => (await ref.get()).get("version")).toBe(2);
      await open();
      await expect(
        page.getByRole("textbox", { name: "Caption", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("textbox", { name: "Caption", exact: true })
        .fill("Synthetic retained CAS030");
      await ref.update({
        version: 3,
        caption: "Synthetic concurrent winner030",
      });
      const rejected = response(page, "saveCampaign", id);
      await save.click();
      expect((await (await rejected).json()).error?.status).toBe("ABORTED");
      expect((await ref.get()).get("caption")).toBe(
        "Synthetic concurrent winner030",
      );
      expect(
        (
          await db
            .doc(`idempotencyKeys/${operator}-${commands.at(-1)!.operationId}`)
            .get()
        ).exists,
      ).toBe(false);
      await open();
      await page
        .getByRole("textbox", { name: "Caption", exact: true })
        .fill("Synthetic reviewed CAS030");
      await save.click();
      await expect.poll(async () => (await ref.get()).get("version")).toBe(4);
      await open();
      await page
        .getByRole("textbox", { name: "Caption", exact: true })
        .fill("Synthetic committed replay030");
      const lost = await loseCommittedResponse(page, "saveCampaign", id);
      await save.click();
      await expect(
        page.getByRole("button", {
          name: "Thử lại thao tác đang chờ",
          exact: true,
        }),
      ).toBeVisible();
      lost();
      await retry(page);
      expect(commands.at(-1)).toEqual(commands.at(-2));
      expect(commands[2].operationId).not.toBe(commands[1].operationId);
      expect((await ref.get()).data()).toMatchObject({
        version: 5,
        status: "approved",
        socialPosting: "disabled",
        caption: "Synthetic committed replay030",
      });
      expect((await ref.collection("versions").get()).size).toBe(3);
      await audited(id, "saveCampaign", 3);
      await receipts(commands, id);
    } finally {
      await editorProbe(page, true);
      preTeardown(page);
    }
  });
  test(`CRM030 plan positive CAS and committed unknown replay at ${width}`, async ({
    page,
  }) => {
    const id = ownId("plan"),
      ref = db.doc(`membershipPlans/${id}`),
      commands = capture(page, "saveMembershipPlan", id);
    const open = async () => {
      phase(page, "view_start");
      await page.goto("/crm/membership");
      phase(page, "owned_row_wait");
      const row = page
        .locator("article")
        .filter({ has: page.getByText(id, { exact: true }) });
      await row
        .getByRole("button", { name: "Chỉnh sửa gói", exact: true })
        .click();
    };
    const save = page.getByRole("button", { name: "Lưu gói", exact: true });
    register(page, [{ collection: "membershipPlans", id }], commands);
    try {
      await ref.set({ ...plan, version: 1 });
      await login(page, width);
      await open();
      await page
        .getByLabel("Giá trả trước (₫)", { exact: true })
        .fill("110000");
      await geometry(page, save);
      await save.click();
      await expect.poll(async () => (await ref.get()).get("version")).toBe(2);
      await open();
      await page
        .getByLabel("Giá trả trước (₫)", { exact: true })
        .fill("120000");
      await ref.update({ version: 3, price: 130000 });
      const rejected = response(page, "saveMembershipPlan", id);
      await save.click();
      expect((await (await rejected).json()).error?.status).toBe("ABORTED");
      expect((await ref.get()).get("price")).toBe(130000);
      expect(
        (
          await db
            .doc(`idempotencyKeys/${operator}-${commands.at(-1)!.operationId}`)
            .get()
        ).exists,
      ).toBe(false);
      await open();
      await page
        .getByLabel("Giá trả trước (₫)", { exact: true })
        .fill("140000");
      await save.click();
      await expect.poll(async () => (await ref.get()).get("version")).toBe(4);
      await open();
      await page
        .getByLabel("Giá trả trước (₫)", { exact: true })
        .fill("150000");
      const lost = await loseCommittedResponse(page, "saveMembershipPlan", id);
      await save.click();
      await expect(
        page.getByRole("button", {
          name: "Thử lại thao tác đang chờ",
          exact: true,
        }),
      ).toBeVisible();
      lost();
      await retry(page);
      expect(commands.at(-1)).toEqual(commands.at(-2));
      expect(commands[2].operationId).not.toBe(commands[1].operationId);
      expect((await ref.get()).data()).toMatchObject({
        ...plan,
        price: 150000,
        version: 5,
      });
      await audited(id, "saveMembershipPlan", 3);
      await receipts(commands, id);
    } finally {
      preTeardown(page);
    }
  });
  test(`CRM030 gifted term immutable snapshot and committed unknown replay at ${width}`, async ({
    page,
  }) => {
    const id = ownId("gift-plan"),
      target = knownCustomer(),
      commands = capture(page, "grant", target.uid),
      ref = db.doc(`membershipSubscriptions/${target.uid}`);
    const state = register(
      page,
      [
        { collection: "membershipPlans", id },
        { collection: "users", id: target.uid },
        { collection: "membershipSubscriptions", id: target.uid },
      ],
      commands,
      target.uid,
    );
    try {
      await prepareCustomer(page, state, target);
      await db.doc(`membershipPlans/${id}`).set({ ...plan, version: 1 });
      await login(page, width);
      await page.goto("/crm/membership");
      const disclosure = page.getByText("Cấp tặng có ghi nhận", {
        exact: true,
      });
      await disclosure.focus();
      await expect(disclosure).toBeFocused();
      await disclosure.press("Enter");
      const customerField = page.getByRole("textbox", {
        name: "Mã khách hàng",
        exact: true,
      });
      await expect(customerField).toBeVisible();
      await customerField.fill(target.uid);
      await page
        .getByRole("combobox", { name: "Gói đã duyệt", exact: true })
        .selectOption(id);
      await page
        .getByLabel("Lý do cấp tặng", { exact: true })
        .fill("Synthetic positive gift030");
      const save = page.getByRole("button", {
        name: "Cấp tặng membership",
        exact: true,
      });
      await geometry(page, save);
      const lost = await loseCommittedResponse(page, "grant", target.uid);
      await save.click();
      await expect(
        page.getByRole("button", {
          name: "Thử lại thao tác đang chờ",
          exact: true,
        }),
      ).toBeVisible();
      lost();
      const committed = (await ref.get()).data()!;
      await retry(page);
      expect(commands).toHaveLength(2);
      expect(commands[0]).toEqual(commands[1]);
      expect(commands[0]).not.toHaveProperty("expectedVersion");
      expect((await ref.get()).data()).toEqual(committed);
      expect(committed).toMatchObject({
        ownerId: target.uid,
        planId: id,
        state: "active",
        planSnapshot: { ...plan, version: 1 },
      });
      expect(committed.endsAt - committed.startsAt).toBe(7 * 86400000);
      const history = await db
        .collection("membershipHistory")
        .where("ownerId", "==", target.uid)
        .get();
      expect(history.size).toBe(1);
      expect(history.docs[0].data()).toMatchObject({
        action: "grant",
        actor: operator,
        reason: "Synthetic positive gift030",
      });
      await audited(target.uid, "membership.grant", 1);
      const op = commands[0].operationId;
      expect(
        (await db.doc(`idempotencyKeys/${operator}-${op}`).get()).get("result"),
      ).toEqual({ id: target.uid });
      expect(
        (await db.doc(`outboxJobs/membership-${operator}-${op}`).get()).data(),
      ).toMatchObject({
        ownerId: target.uid,
        action: "membershipActivated",
        state: "queued",
      });
      for (const collection of [
        "membershipInvoices",
        "financialEntries",
        "bankTransactions",
      ])
        expect(
          (
            await db
              .collection(collection)
              .where("ownerId", "==", target.uid)
              .limit(1)
              .get()
          ).size,
        ).toBe(0);
      await db
        .doc(`membershipPlans/${id}`)
        .update({ price: 200000, periodDays: 14, version: 2 });
      expect((await ref.get()).get("planSnapshot")).toEqual(
        committed.planSnapshot,
      );
    } finally {
      preTeardown(page);
    }
  });
  test(`CRM030 staff role lock CAS committed replay and readonly settings at ${width}`, async ({
    page,
  }) => {
    const target = knownCustomer(),
      id = target.uid,
      ref = db.doc(`staffAccess/${id}`),
      commands = capture(page, "saveStaffAccess", id);
    const inspect = page.getByRole("button", {
        name: "Kiểm tra quyền hiện tại",
        exact: true,
      }),
      save = page.getByRole("button", {
        name: "Lưu quyền nhân viên",
        exact: true,
      });
    const state = register(
      page,
      [
        { collection: "staffAccess", id },
        { collection: "users", id },
      ],
      commands,
      id,
    );
    try {
      await prepareCustomer(page, state, target);
      await ref.set({
        version: 1,
        roles: ["SUPPORT"],
        active: true,
        locked: false,
        orderIds: [],
      });
      await login(page, width);
      await page.goto("/crm/staff");
      await page.getByLabel("Định danh nhân viên", { exact: true }).fill(id);
      await inspect.click();
      await page.getByLabel("Hỗ trợ", { exact: true }).uncheck();
      await page.getByLabel("Chủ doanh nghiệp", { exact: true }).check();
      await geometry(page, save);
      await save.click();
      await expect.poll(async () => (await ref.get()).get("version")).toBe(2);
      expect(
        (await call("readOwnerConfiguration", {}, target.identity)).result,
      ).toBeDefined();
      const staleRead = page.waitForResponse(
        (r) =>
          /\/readStaffAccess$/.test(r.url()) &&
          r.request().method() === "POST" &&
          r.request().postDataJSON()?.data?.id === id,
      );
      await inspect.click();
      const staleBody = await (await staleRead).json();
      expect(staleBody.error).toBeUndefined();
      expect(staleBody.result.access).toMatchObject({
        version: 2,
        roles: ["OWNER"],
        active: true,
        locked: false,
      });
      expect(staleBody.result.access.roles).toEqual(["OWNER"]);
      await expect(
        page.getByLabel("Chủ doanh nghiệp", { exact: true }),
      ).toBeChecked();
      await expect(save).toBeVisible();
      await expect(save).toBeEnabled();
      await ref.update({ version: 3, roles: ["WAREHOUSE"], locked: true });
      const rejected = response(page, "saveStaffAccess", id);
      await save.click();
      const rejectedBody = await (await rejected).json();
      expect(commands.at(-1)!.expectedVersion).toBe(2);
      expect(rejectedBody.error?.status).toBe("ABORTED");
      expect((await ref.get()).get("roles")).toEqual(["WAREHOUSE"]);
      expect(
        (
          await db
            .doc(`idempotencyKeys/${operator}-${commands.at(-1)!.operationId}`)
            .get()
        ).exists,
      ).toBe(false);
      await inspect.click();
      await page.getByLabel("Kho", { exact: true }).uncheck();
      await page.getByLabel("Hỗ trợ", { exact: true }).check();
      await page.getByLabel("Khóa quyền nhân viên", { exact: true }).uncheck();
      await save.click();
      await expect.poll(async () => (await ref.get()).get("version")).toBe(4);
      expect(
        (await call("readOwnerConfiguration", {}, target.identity)).error
          ?.status,
      ).toBe("PERMISSION_DENIED");
      expect(
        (await call("listWork", { kind: "supportTickets" }, target.identity))
          .result,
      ).toBeDefined();
      await inspect.click();
      await page.getByLabel("Khóa quyền nhân viên", { exact: true }).check();
      const lost = await loseCommittedResponse(page, "saveStaffAccess", id);
      await save.click();
      await expect(
        page.getByRole("button", {
          name: "Thử lại thao tác đang chờ",
          exact: true,
        }),
      ).toBeVisible();
      lost();
      await retry(page);
      expect(commands.at(-1)).toEqual(commands.at(-2));
      expect((await ref.get()).data()).toMatchObject({
        version: 5,
        roles: ["SUPPORT"],
        active: true,
        locked: true,
        orderIds: [],
      });
      await audited(id, "saveStaffAccess", 3);
      await receipts(commands, id);
      expect(
        (await call("readOwnerConfiguration", {}, target.identity)).error
          ?.status,
      ).toBe("PERMISSION_DENIED");
      expect(
        (await call("listWork", { kind: "supportTickets" }, target.identity))
          .error?.status,
      ).toBe("PERMISSION_DENIED");
      const pricing = (await db.doc("settings/pricing").get()).data();
      await page.goto("/crm/settings");
      await page
        .getByText("Chính sách tỷ giá và điều khoản", { exact: true })
        .click();
      await expect(
        page.getByLabel("Phiên bản điều khoản", { exact: true }),
      ).toHaveValue(String(pricing?.termsVersion));
      await geometry(
        page,
        page.getByRole("button", { name: "Lưu chính sách", exact: true }),
      );
      expect((await db.doc("settings/pricing").get()).data()).toEqual(pricing);
      // Settings positive mutation intentionally NOT_RUN: the singleton is frozen.
    } finally {
      preTeardown(page);
    }
  });
}
