import {
  test as base,
  expect,
  type Page,
  type Route,
  type TestInfo,
  type Response,
} from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { getApp } from "firebase-admin/app";
import { db, customer, sourceOrder, closeFixtures } from "./fixtures";
import { invoke } from "./http";

type Command = {
  action: string;
  orderId: string;
  operationId: string;
  expectedVersion: number;
  payload?: { bankTransactionId?: string };
};
type Projection = {
  rows: Array<{ id: string; orderId: string; state: string }>;
  next: string | null;
};
type State = {
  orderId: string;
  refundId: string;
  identity: string;
  uid: string;
  productId?: string;
  sourceResolved: boolean;
  sourceStarted: boolean;
  cancelled: boolean;
  tasks: Set<Promise<void>>;
  releases: Set<() => void>;
  receipts: Set<string>;
  banks: Set<string>;
  commands: Command[];
  initialLedger?: string;
  started: number;
  sequence: number;
};
const generations = new Map<Page, State>();
const test = base.extend<{ cursor033Setup: void }>({
  cursor033Setup: [
    async ({ page }, use, info) => {
      const preparation = prepare(page);
      const state = generations.get(page);
      let failure = false;
      try {
        await preparation;
        await use(undefined);
      } catch (error) {
        failure = true;
        throw error;
      } finally {
        if (state) await cleanup(page, info, state, failure);
      }
    },
    { auto: true, timeout: 45000 },
  ],
});
// Default group: global workers1 serializes execution without skipping later cases.
test.afterAll(closeFixtures);
test.afterEach(async ({ page }, info) => {
  const state = generations.get(page);
  if (state) await cleanup(page, info, state);
});
type Phase =
  | "setup"
  | "ready"
  | "ack"
  | "real_fetch"
  | "real_abort"
  | "real_hold"
  | "real_deliver"
  | "recover"
  | "cleanup"
  | "cleanup_failed";
function phase(state: State, name: Phase, flags: Record<string, boolean> = {}) {
  console.info(
    JSON.stringify({
      diagnostic: "CURSOR033",
      phase: name,
      sequence: ++state.sequence,
      elapsedMs: Math.round(performance.now() - state.started),
      ...flags,
    }),
  );
}
function live(page: Page, state: State) {
  if (generations.get(page) !== state || state.cancelled)
    throw new Error("Owned cursor generation cancelled");
}
function run<T>(
  page: Page,
  state: State,
  operation: () => Promise<T>,
): Promise<T> {
  const task = Promise.resolve().then(async () => {
    live(page, state);
    const value = await operation();
    live(page, state);
    return value;
  });
  const settled = task.then(
    () => undefined,
    () => undefined,
  );
  state.tasks.add(settled);
  void settled.then(() => {
    state.tasks.delete(settled);
  });
  return task;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
type Outcome<T> = { ok: true; value: T } | { ok: false };
function terminal<T>(state: State) {
  const pending = deferred<Outcome<T>>();
  let settled = false;
  const finish = (outcome: Outcome<T>) => {
    if (settled) return;
    settled = true;
    state.releases.delete(cancel);
    pending.resolve(outcome);
  };
  const cancel = () => finish({ ok: false });
  state.releases.add(cancel);
  return {
    finish,
    async wait() {
      const outcome = await pending.promise;
      if (!outcome.ok) throw new Error("Owned route did not complete");
      return outcome.value;
    },
  };
}
const hashBank = (bank: string) =>
  createHash("sha256").update(bank).digest("hex");
async function prepare(page: Page) {
  const identity = "customer-" + randomUUID();
  const state: State = {
    identity,
    uid: "e2e005-" + identity,
    orderId: "refund-cursor033-" + randomUUID(),
    refundId: "",
    sourceResolved: false,
    sourceStarted: false,
    cancelled: false,
    tasks: new Set(),
    releases: new Set(),
    receipts: new Set(),
    banks: new Set(),
    commands: [],
    started: performance.now(),
    sequence: 0,
  };
  if (generations.has(page))
    throw new Error("Owned cursor generation already exists");
  generations.set(page, state);
  phase(state, "setup");
  // Known actor/order ownership is recorded before any write.
  const auth = getAuth(getApp("release021-browser"));
  const [fundingIdentity, fundingProfile, fundingAccess] = await run(
    page,
    state,
    () =>
      Promise.all([
        auth.getUser("e2e005-finance"),
        db.doc("users/e2e005-finance").get(),
        db.doc("staffAccess/e2e005-finance").get(),
      ]),
  );
  expect(fundingIdentity.disabled).toBe(false);
  expect(fundingIdentity.emailVerified).toBe(true);
  expect(
    fundingIdentity.providerData.some((p) => p.providerId === "google.com"),
  ).toBe(true);
  expect(
    fundingProfile.get("locked") === true ||
      fundingAccess.get("locked") === true,
  ).toBe(false);
  expect(fundingAccess.get("active")).toBe(true);
  const fundingRoles: unknown = fundingAccess.get("roles");
  expect(
    fundingProfile.exists &&
      fundingProfile.get("ownerId") === "e2e005-finance" &&
      fundingAccess.exists,
  ).toBe(true);
  expect(
    Array.isArray(fundingRoles) &&
      fundingRoles.every((role) => typeof role === "string") &&
      fundingRoles.includes("FINANCE"),
  ).toBe(true);
  const baseline = await run(page, state, () =>
    db.collection("refunds").orderBy("__name__").limit(61).select().get(),
  );
  if (baseline.size < 61)
    throw new Error("Cursor fixture needs existing bounded queue continuation");
  const anchors = [
    baseline.docs[30].id,
    baseline.docs[31].id,
    baseline.docs[32].id,
  ];
  if (
    !anchors.every((id) => /^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(id)) ||
    anchors[0].slice(0, 8) === anchors[1].slice(0, 8) ||
    anchors[1].slice(0, 8) === anchors[2].slice(0, 8)
  )
    throw new Error("Cursor fixture anchor ordering unavailable");
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = anchors[1].slice(0, 8) + randomUUID().slice(8);
    if (
      !(await run(page, state, () => db.doc("refunds/" + candidate).get()))
        .exists
    ) {
      state.refundId = candidate;
      break;
    }
  }
  if (!state.refundId) throw new Error("No unused owned refund candidate");
  const email = identity + "@satsunicgo.example.invalid";
  await run(page, state, async () => {
    await auth.createUser({ uid: state.uid, email, emailVerified: true });
    live(page, state);
    await auth.updateUser(state.uid, {
      providerToLink: { providerId: "google.com", uid: state.uid, email },
    });
    live(page, state);
    await db
      .doc("users/" + state.uid)
      .set({ ownerId: state.uid, locked: false, version: 1 });
    live(page, state);
    await db
      .doc("staffAccess/" + state.uid)
      .set({ active: true, locked: false, roles: ["FINANCE"], version: 1 });
  });
  state.sourceStarted = true;
  const created = await run(page, state, () => sourceOrder(state.orderId));
  expect(created === state.orderId).toBe(true);
  state.sourceResolved = true;
  let order = await run(page, state, () =>
    db.doc("orders/" + state.orderId).get(),
  );
  state.productId = order.get("catalogSnapshot.productId");
  const fundingOp = randomUUID(),
    fundingBank = "cursor033-funding-" + randomUUID();
  state.receipts.add("e2e005-finance-" + fundingOp);
  state.banks.add(hashBank(fundingBank));
  await run(page, state, () =>
    invoke(
      "command",
      {
        action: "verifyTransfer",
        orderId: state.orderId,
        expectedVersion: order.get("version"),
        operationId: fundingOp,
        payload: {
          amount: 240000,
          bankTransactionId: fundingBank,
          evidence: "Synthetic funded cursor033 fixture",
          reason: "Emulator only",
        },
      },
      "finance",
    ),
  );
  order = await run(page, state, () => db.doc("orders/" + state.orderId).get());
  const requestOp = randomUUID();
  state.receipts.add(state.uid + "-" + requestOp);
  await run(page, state, () =>
    invoke(
      "refundCommand",
      {
        action: "request",
        id: state.refundId,
        orderId: state.orderId,
        expectedVersion: order.get("version"),
        operationId: requestOp,
        amount: 10000,
        reason: "Synthetic cursor033 reservation",
      },
      state.identity,
    ),
  );
  page.on("request", (request) => {
    if (
      state.cancelled ||
      generations.get(page) !== state ||
      request.method() !== "POST" ||
      !/\/command$/.test(request.url())
    )
      return;
    const command = request.postDataJSON()?.data as Command | undefined;
    if (command?.action !== "refund" || command.orderId !== state.orderId)
      return;
    state.commands.push(command);
    state.receipts.add(state.uid + "-" + command.operationId);
    if (command.payload?.bankTransactionId)
      state.banks.add(hashBank(command.payload.bankTransactionId));
  });
  await pendingState(page, state);
  state.initialLedger = JSON.stringify((await financial(page, state)).entries);
  phase(state, "ready");
}
function rowFor(page: Page, state: State) {
  return page
    .locator("article.crmItem")
    .filter({ has: page.getByText(state.refundId, { exact: true }) });
}
function listResponse(page: Page, state: State, after: string | null) {
  const received = terminal<Response>(state);
  const observe = (response: Response) => {
    if (
      state.cancelled ||
      generations.get(page) !== state ||
      !/\/listWork$/.test(response.url()) ||
      response.request().method() !== "POST"
    )
      return;
    const data = response.request().postDataJSON()?.data;
    if (data?.kind !== "refunds" || (data.after ?? null) !== after) return;
    page.off("response", observe);
    state.releases.delete(detach);
    received.finish({ ok: true, value: response });
  };
  const detach = () => page.off("response", observe);
  state.releases.add(detach);
  page.on("response", observe);
  return { wait: () => received.wait() };
}
async function projection(page: Page, state: State, response: Response) {
  return run(page, state, async () => {
    const body = await response.json();
    expect(body.error === undefined).toBe(true);
    expect(Array.isArray(body.result?.rows)).toBe(true);
    return body.result as Projection;
  });
}
async function enter(page: Page, state: State, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .evaluate((select, identity) => {
      const option = document.createElement("option");
      option.value = identity;
      option.textContent = "Synthetic cursor finance033";
      (select as HTMLSelectElement).add(option);
    }, state.identity);
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(state.identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  const first = listResponse(page, state, null);
  await page.goto("/crm/refunds");
  const initial = await projection(page, state, await first.wait());
  expect(initial.rows.some((r) => r.id === state.refundId)).toBe(false);
  if (!initial.next)
    throw new Error("Own second page prerequisite unavailable");
  await expect(
    page.getByRole("button", { name: "Trang tiếp theo", exact: true }),
  ).toBeEnabled();
  const second = listResponse(page, state, initial.next);
  await page
    .getByRole("button", { name: "Trang tiếp theo", exact: true })
    .click();
  const current = await projection(page, state, await second.wait());
  expect(
    current.rows.some(
      (r) =>
        r.id === state.refundId &&
        r.orderId === state.orderId &&
        r.state === "pending",
    ),
  ).toBe(true);
  if (!current.next) throw new Error("Owned page has no actual continuation");
  await expect(rowFor(page, state)).toBeVisible();
  return { after: initial.next, next: current.next };
}
async function formFor(page: Page, state: State) {
  const row = rowFor(page, state);
  await row.locator("summary").filter({ hasText: "Xử lý yêu cầu" }).click();
  const form = row.locator("form");
  await form
    .getByRole("combobox", { name: "Thao tác", exact: true })
    .selectOption("confirm");
  await form
    .getByRole("textbox", { name: "Mã giao dịch ngân hàng", exact: true })
    .fill("cursor033-bank-" + randomUUID());
  await form
    .getByRole("textbox", { name: "Bằng chứng đối soát", exact: true })
    .fill("Synthetic real outgoing cursor033 evidence");
  return form.getByRole("button", {
    name: "Xác nhận tiền đã hoàn",
    exact: true,
  });
}
function ack(page: Page, state: State) {
  const received = terminal<void>(state);
  const observe = (response: Response) => {
    if (
      state.cancelled ||
      generations.get(page) !== state ||
      !/\/command$/.test(response.url()) ||
      response.request().method() !== "POST"
    )
      return;
    const data = response.request().postDataJSON()?.data;
    if (data?.orderId !== state.orderId || data.action !== "refund") return;
    page.off("response", observe);
    state.releases.delete(detach);
    void run(page, state, async () => {
      const body = await response.json();
      expect(
        body.error === undefined && body.result?.id === state.orderId,
      ).toBe(true);
      expect(body.result.version > data.expectedVersion).toBe(true);
      phase(state, "ack", { actualResult: true, versionAdvanced: true });
    }).then(
      () => received.finish({ ok: true, value: undefined }),
      () => received.finish({ ok: false }),
    );
  };
  const detach = () => page.off("response", observe);
  state.releases.add(detach);
  page.on("response", observe);
  return { wait: () => received.wait() };
}
async function financial(page: Page, state: State) {
  return run(page, state, async () => {
    const [order, refund, entries, audits] = await Promise.all([
      db.doc("orders/" + state.orderId).get(),
      db.doc("refunds/" + state.refundId).get(),
      db
        .collection("financialEntries")
        .where("orderId", "==", state.orderId)
        .limit(101)
        .get(),
      db
        .collection("auditEvents")
        .where("resourceId", "==", state.orderId)
        .limit(101)
        .get(),
    ]);
    expect(entries.size <= 100 && audits.size <= 100).toBe(true);
    return {
      order: order.data(),
      refund: refund.data(),
      entries: entries.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      audits: audits.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    };
  });
}
async function pendingState(page: Page, state: State) {
  const data = await financial(page, state);
  expect(
    data.order?.collected === 240000 &&
      data.order.refunded === 0 &&
      data.order.refundReserved === 10000,
  ).toBe(true);
  expect(
    data.refund?.state === "pending" && data.refund?.orderId === state.orderId,
  ).toBe(true);
  expect(
    data.entries.filter(
      (e) => (e as Record<string, unknown>).kind === "refund",
    ),
  ).toHaveLength(0);
}
async function confirmedState(page: Page, state: State) {
  const data = await financial(page, state);
  expect(
    data.order?.collected === 240000 &&
      data.order.refunded === 10000 &&
      data.order.refundReserved === 0,
  ).toBe(true);
  expect(
    data.refund?.state === "confirmed" &&
      data.refund?.orderId === state.orderId,
  ).toBe(true);
  const outgoing = data.entries.filter(
    (e) => (e as Record<string, unknown>).kind === "refund",
  );
  expect(outgoing).toHaveLength(1);
  expect(
    (outgoing[0] as Record<string, unknown>).amount === 10000 &&
      (outgoing[0] as Record<string, unknown>).currency === "VND",
  ).toBe(true);
  expect(
    JSON.stringify(
      data.entries.filter(
        (e) => (e as Record<string, unknown>).kind !== "refund",
      ),
    ) === state.initialLedger,
  ).toBe(true);
  expect(
    data.audits.filter(
      (a) => (a as Record<string, unknown>).action === "refund",
    ),
  ).toHaveLength(1);
  expect(state.commands).toHaveLength(1);
  const command = state.commands[0];
  const proof = await run(page, state, () =>
    Promise.all([
      db
        .doc(
          "bankTransactions/" + hashBank(command.payload!.bankTransactionId!),
        )
        .get(),
      db.doc("idempotencyKeys/" + state.uid + "-" + command.operationId).get(),
    ]),
  );
  expect(proof.every((d) => d.exists)).toBe(true);
  return { data, proof: proof.map((d) => d.data()) };
}
async function routeOnce(
  page: Page,
  state: State,
  after: string,
  mode: "abort" | "hold",
  ownConfirmed = false,
) {
  const fetched = terminal<void>(state),
    finished = terminal<void>(state),
    release = deferred<void>();
  let used = false;
  const releaseHold = () => release.resolve();
  state.releases.add(releaseHold);
  await page.route("**/listWork", (route: Route) => {
    const task = Promise.resolve().then(async () => {
      try {
        if (state.cancelled) {
          await route.abort().catch(() => undefined);
          return;
        }
        const data =
          route.request().method() === "POST"
            ? route.request().postDataJSON()?.data
            : undefined;
        if (used || data?.kind !== "refunds" || data.after !== after) {
          await route.continue();
          return;
        }
        used = true;
        const actual = await route.fetch();
        const body = await actual.json();
        live(page, state);
        expect(
          body.error === undefined && Array.isArray(body.result?.rows),
        ).toBe(true);
        if (ownConfirmed)
          expect(
            body.result.rows.some(
              (row: { id: string; orderId: string; state: string }) =>
                row.id === state.refundId &&
                row.orderId === state.orderId &&
                row.state === "confirmed",
            ),
          ).toBe(true);
        phase(state, "real_fetch", {
          actualProjection: true,
          held: mode === "hold",
        });
        fetched.finish({ ok: true, value: undefined });
        if (mode === "hold") {
          phase(state, "real_hold");
          await release.promise;
          if (state.cancelled) {
            await route.abort().catch(() => undefined);
            return;
          }
          await route.fulfill({ response: actual });
          phase(state, "real_deliver");
        } else {
          await route.abort("failed");
          phase(state, "real_abort");
        }
        finished.finish({ ok: true, value: undefined });
      } catch (error) {
        fetched.finish({ ok: false });
        finished.finish({ ok: false });
        if (!state.cancelled) throw error;
      }
    });
    const settled = task.then(
      () => undefined,
      () => undefined,
    );
    state.tasks.add(settled);
    void settled.then(() => state.tasks.delete(settled));
    return task;
  });
  return {
    fetched: () => fetched.wait(),
    finished: () => finished.wait(),
    release: releaseHold,
  };
}
const reload = (page: Page) =>
  page.getByRole("button", { name: "Tải lại", exact: true });
const nextPage = (page: Page) =>
  page.getByRole("button", { name: "Trang tiếp theo", exact: true });
const loadError = (page: Page) =>
  page.getByText(
    "Chưa tải được yêu cầu hoàn tiền. Kiểm tra kết nối và thử lại.",
    { exact: true },
  );

test("CURSOR033 post-ACK list failure reloads committed page without resending money at390", async ({
  page,
}) => {
  const state = generations.get(page)!;
  const current = await enter(page, state, 390),
    button = await formFor(page, state);
  const lost = await routeOnce(page, state, current.after, "abort", true);
  const acknowledged = ack(page, state);
  await button.click();
  await acknowledged.wait();
  await lost.finished();
  await expect(loadError(page)).toBeVisible();
  await expect(rowFor(page, state)).toHaveCount(0);
  const before = await confirmedState(page, state);
  const read = listResponse(page, state, current.after);
  await expect(reload(page)).toBeEnabled();
  await reload(page).click();
  const data = await projection(page, state, await read.wait());
  expect(
    data.rows.some(
      (r) =>
        r.id === state.refundId &&
        r.state === "confirmed" &&
        r.orderId === state.orderId,
    ),
  ).toBe(true);
  await expect(rowFor(page, state)).toContainText("Đã xác nhận tiền ra");
  await expect(rowFor(page, state).locator("form")).toHaveCount(0);
  const after = await confirmedState(page, state);
  expect(JSON.stringify(after) === JSON.stringify(before)).toBe(true);
  phase(state, "recover", { currentCursor: true, financialUnchanged: true });
});
test("CURSOR033 failed next page reloads last successful page without money at768", async ({
  page,
}) => {
  const state = generations.get(page)!;
  const current = await enter(page, state, 768),
    before = await financial(page, state);
  const lost = await routeOnce(page, state, current.next, "abort");
  await nextPage(page).click();
  await lost.finished();
  await expect(loadError(page)).toBeVisible();
  await expect(rowFor(page, state)).toHaveCount(0);
  const read = listResponse(page, state, current.after);
  await expect(reload(page)).toBeEnabled();
  await reload(page).click();
  const data = await projection(page, state, await read.wait());
  expect(
    data.rows.some((r) => r.id === state.refundId && r.state === "pending"),
  ).toBe(true);
  await expect(rowFor(page, state)).toContainText(
    "Chờ hoàn · tiền chưa được xác nhận ra",
  );
  await expect(rowFor(page, state).locator("form")).toHaveCount(1);
  expect(
    JSON.stringify(await financial(page, state)) === JSON.stringify(before),
  ).toBe(true);
  expect(state.commands).toHaveLength(0);
  phase(state, "recover", { currentCursor: true, financialUnchanged: true });
});
test("CURSOR033 held older page cannot replace newer confirmed page or cursor at1440", async ({
  page,
}) => {
  const state = generations.get(page)!;
  const current = await enter(page, state, 1440),
    button = await formFor(page, state);
  const held = await routeOnce(page, state, current.next, "hold");
  await nextPage(page).click();
  await held.fetched();
  await expect(reload(page)).toBeDisabled();
  await expect(rowFor(page, state)).toBeVisible();
  await expect(button).toBeEnabled();
  const acknowledged = ack(page, state),
    newerRead = listResponse(page, state, current.after);
  await button.click();
  await acknowledged.wait();
  const newer = await projection(page, state, await newerRead.wait());
  expect(
    newer.rows.some((r) => r.id === state.refundId && r.state === "confirmed"),
  ).toBe(true);
  await expect(rowFor(page, state)).toContainText("Đã xác nhận tiền ra");
  await expect(rowFor(page, state).locator("form")).toHaveCount(0);
  const before = await confirmedState(page, state);
  const olderDelivered = listResponse(page, state, current.next);
  held.release();
  await held.finished();
  await projection(page, state, await olderDelivered.wait());
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(rowFor(page, state)).toContainText("Đã xác nhận tiền ra");
  const refreshed = listResponse(page, state, current.after);
  await expect(reload(page)).toBeEnabled();
  await reload(page).click();
  const fresh = await projection(page, state, await refreshed.wait());
  expect(
    fresh.rows.some((r) => r.id === state.refundId && r.state === "confirmed"),
  ).toBe(true);
  if (!fresh.next || fresh.next !== newer.next)
    throw new Error(
      "Current continuation changed before stale proof completed",
    );
  const forward = listResponse(page, state, fresh.next);
  await nextPage(page).click();
  await projection(page, state, await forward.wait());
  const after = await confirmedState(page, state);
  expect(JSON.stringify(after) === JSON.stringify(before)).toBe(true);
  phase(state, "recover", {
    currentCursor: true,
    staleProjectionIgnored: true,
    financialUnchanged: true,
  });
});

async function cleanup(
  page: Page,
  info: TestInfo,
  state: State,
  failed = false,
) {
  if (generations.get(page) !== state || state.cancelled) return;
  state.cancelled = true;
  const inFlight = state.tasks.size > 0;
  for (const release of [...state.releases]) release();
  try {
    if (!page.isClosed())
      await page
        .unrouteAll({ behavior: "ignoreErrors" })
        .catch(() => undefined);
    await Promise.allSettled([...state.tasks]);
    if (
      generations.get(page) !== state ||
      !/^refund-cursor033-[a-f0-9-]{36}$/.test(state.orderId) ||
      !/^e2e005-customer-[a-f0-9-]{36}$/.test(state.uid)
    )
      throw new Error("Cleanup refused non-owned candidate");
    const paths = new Set<string>([
      "orders/" + state.orderId,
      "users/" + state.uid,
      "staffAccess/" + state.uid,
    ]);
    if (state.refundId) {
      if (!/^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(state.refundId))
        throw new Error("Refund candidate ownership mismatch");
      paths.add("refunds/" + state.refundId);
    }
    if (state.productId) {
      if (!/^sanity-[a-f0-9-]{36}$/.test(state.productId))
        throw new Error("Known product ownership mismatch");
      paths.add("products/" + state.productId);
    }
    const ownOrder = await db.doc("orders/" + state.orderId).get();
    if (ownOrder.exists) {
      expect(ownOrder.get("ownerId") === customer).toBe(true);
      const product = ownOrder.get("catalogSnapshot.productId");
      if (product) {
        if (
          !/^sanity-[a-f0-9-]{36}$/.test(product) ||
          (state.productId && state.productId !== product)
        )
          throw new Error("Product ownership mismatch");
        paths.add("products/" + product);
        state.productId = product;
      }
    }
    for (const collection of ["refunds", "financialEntries", "outboxJobs"]) {
      const rows = await db
        .collection(collection)
        .where("orderId", "==", state.orderId)
        .limit(101)
        .get();
      expect(rows.size <= 100).toBe(true);
      for (const row of rows.docs) {
        expect(row.get("orderId") === state.orderId).toBe(true);
        paths.add(row.ref.path);
      }
    }
    const audits = await db
      .collection("auditEvents")
      .where("resourceId", "==", state.orderId)
      .limit(101)
      .get();
    expect(audits.size <= 100).toBe(true);
    for (const row of audits.docs) {
      expect(
        row.get("resourceId") === state.orderId &&
          [state.uid, "e2e005-finance"].includes(row.get("actor")),
      ).toBe(true);
      paths.add(row.ref.path);
    }
    const timeline = await db
      .collection("orders/" + state.orderId + "/timeline")
      .limit(101)
      .get();
    expect(timeline.size <= 100).toBe(true);
    timeline.docs.forEach((d) => paths.add(d.ref.path));
    state.receipts.forEach((key) => paths.add("idempotencyKeys/" + key));
    state.banks.forEach((bank) => paths.add("bankTransactions/" + bank));
    // All predicates and bounded enumerations precede the first deletion.
    const list = [...paths];
    for (let i = 0; i < list.length; i += 400) {
      const batch = db.batch();
      list.slice(i, i + 400).forEach((p) => batch.delete(db.doc(p)));
      await batch.commit();
    }
    try {
      await getAuth(getApp("release021-browser")).deleteUser(state.uid);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found")
        throw error;
    }
    phase(state, "cleanup", {
      enumeratedCleanupComplete: true,
      lateCommitUnverified: inFlight,
      partialProductUnverified:
        state.sourceStarted && !state.sourceResolved && !state.productId,
    });
  } catch (error) {
    phase(state, "cleanup_failed", {
      enumeratedCleanupComplete: false,
      lateCommitUnverified: inFlight,
      partialProductUnverified:
        state.sourceStarted && !state.sourceResolved && !state.productId,
    });
    if (!failed && info.errors.length === 0) throw error;
  } finally {
    if (generations.get(page) === state) generations.delete(page);
  }
}
