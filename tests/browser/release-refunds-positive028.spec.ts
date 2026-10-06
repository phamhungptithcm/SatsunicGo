import {
  test as base,
  expect,
  type Page,
  type Locator,
  type Route,
  type TestInfo,
  type Request as BrowserRequest,
} from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  customer,
  closeFixtures,
  sourceOrder,
  freshCustomer,
  db,
  operator,
} from "./fixtures";
import { invoke, call } from "./http";
import { artifactDirectory } from "./artifact-path";

// Setup has its own bounded slot; the unchanged test body still has 45 seconds.
// Overall wall time includes setup, test, and cleanup.
const test = base.extend<{ refund028Setup: void }>({
  refund028Setup: [
    async ({ page }, use, info) => {
      let setupFailed = false;
      // prepare registers the generation synchronously before its first await.
      const setup = prepare(page);
      const generation = owned;
      try {
        await setup;
        await use(undefined);
      } catch (error) {
        setupFailed = true;
        throw error;
      } finally {
        // afterEach normally cleans first. Also cover a failure before use().
        await cleanupOwned(page, info, setupFailed, generation);
      }
    },
    { auto: true, timeout: 45000 },
  ],
});

// Read-only prerequisites: baseline identity/configuration reseeding is forbidden.
// Production MFA is NOT_TESTED in the demo callable runtime.
test.beforeAll(async () => {
  const auth = getAuth(getApp("release021-browser"));
  for (const [uid, role] of [
    [operator, "OWNER"],
    ["e2e005-finance", "FINANCE"],
    [customer, null],
  ] as const) {
    const [identity, profile, staff] = await Promise.all([
      auth.getUser(uid),
      db.doc(`users/${uid}`).get(),
      db.doc(`staffAccess/${uid}`).get(),
    ]);
    expect(identity.uid).toBe(uid);
    expect(identity.disabled).toBe(false);
    expect(identity.emailVerified).toBe(true);
    expect(
      identity.providerData.some(
        (provider) => provider.providerId === "google.com",
      ),
    ).toBe(true);
    expect(profile.exists).toBe(true);
    expect(profile.get("ownerId")).toBe(uid);
    expect(profile.get("locked") === true || staff.get("locked") === true).toBe(
      false,
    );
    if (role) {
      expect(staff.exists).toBe(true);
      expect(staff.get("active")).toBe(true);
      const roles: unknown = staff.get("roles");
      expect(
        Array.isArray(roles) &&
          roles.every((value) => typeof value === "string"),
      ).toBe(true);
      expect(roles).toContain(role);
    }
  }
});
test.afterAll(closeFixtures);
type RefundCommand = {
  action: string;
  orderId: string;
  operationId: string;
  expectedVersion: number;
  amount?: number;
  id?: string;
  payload?: {
    refundRequestId?: string;
    bankTransactionId?: string;
    amount?: number;
  };
  [key: string]: unknown;
};
let orderId = "";
const operations = new Set<string>(),
  bankPaths = new Set<string>();
let actor: Awaited<ReturnType<typeof freshCustomer>> | null = null;
type OwnedState = {
  orderId: string;
  productId?: string;
  sourceOrderResolved: boolean;
  unknownActorRequest: boolean;
  fundingStarted: boolean;
  fundingAcknowledged: boolean;
  cancelled: boolean;
  pendingWrites: Set<object>;
  routeTasks: Set<Promise<void>>;
  cancelTerminals: Set<() => void>;
  cleanupTask?: Promise<void>;
  diagnosticRefundId?: string;
  confirmExpectedVersion?: number;
  refundAttempts: Map<string, number>;
  replayRequests: WeakMap<BrowserRequest, boolean>;
  startedAt: number;
  sequence: number;
};
let owned: OwnedState | null = null;
type RefundPhase =
  | "setup_start"
  | "source_order_start"
  | "source_order_done"
  | "funding_start"
  | "funding_done"
  | "setup_done"
  | "login_start"
  | "login_done"
  | "rpc_sent"
  | "rpc_response"
  | "lost_fetch_start"
  | "lost_response"
  | "lost_abort_done"
  | "lost_failed"
  | "lost_cancelled"
  | "retry_ready"
  | "confirm_stage_before"
  | "confirm_stage_after"
  | "confirm_stage_failed"
  | "confirm_ack"
  | "refund_list_read"
  | "confirm_probe";
function phase(
  state: OwnedState,
  phase: RefundPhase,
  flags: Record<string, boolean> = {},
) {
  console.info(
    JSON.stringify({
      diagnostic: "REFUND028_PHASE",
      phase,
      sequence: ++state.sequence,
      elapsedMs: Math.round(performance.now() - state.startedAt),
      ...flags,
    }),
  );
}
function lostTerminal(state: OwnedState) {
  type Outcome =
    | { committedAndDropped: true }
    | { committedAndDropped: false; error: unknown };
  let finish!: (outcome: Outcome) => void;
  let settled = false;
  const result = new Promise<Outcome>((resolve) => {
    finish = resolve;
  });
  const settle = (outcome: Outcome) => {
    if (settled) return;
    settled = true;
    state.cancelTerminals.delete(cancel);
    finish(outcome);
  };
  const cancel = () => {
    phase(state, "lost_cancelled");
    settle({
      committedAndDropped: false,
      error: new Error("Owned lost response cancelled"),
    });
  };
  state.cancelTerminals.add(cancel);
  return {
    async drop(route: Route, live: () => boolean) {
      try {
        requireLive(live);
        phase(state, "lost_fetch_start");
        const response = await route.fetch();
        const body = await response.json();
        phase(state, "lost_response", {
          hasResult: body.result !== undefined,
          hasError: body.error !== undefined,
        });
        expect(body.error).toBeUndefined();
        expect(body.result).toBeDefined();
        requireLive(live);
        await route.abort("failed");
        requireLive(live);
        phase(state, "lost_abort_done");
        settle({ committedAndDropped: true });
      } catch (error) {
        phase(state, "lost_failed", { cancelled: !live() });
        settle({ committedAndDropped: false, error });
        throw error;
      }
    },
    async wait() {
      const outcome = await result;
      if (!outcome.committedAndDropped) throw outcome.error;
      phase(state, "retry_ready");
    },
  };
}
function cleanupPhase(
  state: OwnedState,
  phase: "start" | "done" | "failed",
  flags: Record<string, boolean>,
) {
  console.info(
    JSON.stringify({
      diagnostic: "REFUND028_CLEANUP",
      phase,
      sequence: ++state.sequence,
      elapsedMs: Math.round(performance.now() - state.startedAt),
      ...flags,
    }),
  );
}
function requireLive(live: () => boolean) {
  if (!live())
    throw new Error("Owned fixture operation cancelled before cleanup");
}
function trackFixture<T>(state: OwnedState, operation: Promise<T>): Promise<T> {
  const settled = operation.then(
    () => undefined,
    () => undefined,
  );
  state.routeTasks.add(settled);
  void settled.finally(() => state.routeTasks.delete(settled));
  return operation;
}
function runActorOperation<T>(
  state: OwnedState,
  run: () => Promise<T>,
): Promise<T> {
  const live = () => owned === state && !state.cancelled;
  const operation = Promise.resolve().then(async () => {
    requireLive(live);
    const result = await run();
    requireLive(live);
    return result;
  });
  // Register settlement before the deferred operation can start; cleanup never awaits use().
  return trackFixture(state, operation);
}
async function guardedRoute(
  page: Page,
  pattern: string,
  handler: (route: Route, live: () => boolean) => Promise<void>,
) {
  const state = owned;
  if (!state) throw new Error("Owned route requires registered fixture");
  await page.route(pattern, (route) => {
    const live = () => !state.cancelled && owned === state;
    const task = Promise.resolve()
      .then(async () => {
        if (!live()) {
          await route.abort().catch(() => undefined);
          return;
        }
        await handler(route, live);
      })
      .catch((error) => {
        if (!state.cancelled) throw error;
      });
    state.routeTasks.add(task);
    return task.finally(() => state.routeTasks.delete(task));
  });
}
const bankPath = (id: string) =>
  `bankTransactions/${createHash("sha256").update(id).digest("hex")}`;
async function ledger(): Promise<
  Array<Record<string, unknown> & { id: string }>
> {
  return (
    await db
      .collection("financialEntries")
      .where("orderId", "==", orderId)
      .get()
  ).docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function order() {
  return (await db.doc(`orders/${orderId}`).get()).data()!;
}
async function audit(action: string) {
  return (
    await db.collection("auditEvents").where("resourceId", "==", orderId).get()
  ).docs.filter((d) => d.data().action === action);
}
async function prepare(page: Page) {
  orderId = "";
  actor = null;
  operations.clear();
  bankPaths.clear();
  orderId = `refund-ui028-${randomUUID()}`;
  const state: OwnedState = {
    orderId,
    sourceOrderResolved: false,
    unknownActorRequest: false,
    fundingStarted: false,
    fundingAcknowledged: false,
    cancelled: false,
    pendingWrites: new Set(),
    routeTasks: new Set(),
    cancelTerminals: new Set(),
    refundAttempts: new Map(),
    replayRequests: new WeakMap(),
    startedAt: performance.now(),
    sequence: 0,
  };
  owned = state;
  phase(state, "setup_start");
  page.on("request", (request) => {
    if (
      state.cancelled ||
      owned !== state ||
      request.method() !== "POST" ||
      !/\/(refundCommand|command)$/.test(request.url())
    )
      return;
    const data = request.postDataJSON()?.data as RefundCommand | undefined;
    if (
      data?.orderId !== state.orderId ||
      !["request", "cancel", "refund"].includes(data.action)
    )
      return;
    if (data.action === "refund") {
      state.confirmExpectedVersion = data.expectedVersion;
      const attempts = (state.refundAttempts.get(data.operationId) ?? 0) + 1;
      state.refundAttempts.set(data.operationId, attempts);
      state.replayRequests.set(request, attempts > 1);
    }
    phase(state, "rpc_sent", {
      request: data.action === "request",
      refund: data.action === "refund",
      cancel: data.action === "cancel",
    });
    const ownActorAtRequest = actor?.uid;
    state.pendingWrites.add(request);
    // Metadata is only for exact fixture bookkeeping; server verification is unchanged.
    const task = request
      .allHeaders()
      .then((headers) => {
        const encoded = headers.authorization
          ?.replace(/^Bearer /u, "")
          .split(".")[1];
        const claims = JSON.parse(
          Buffer.from(encoded ?? "", "base64url").toString("utf8"),
        ) as { sub?: unknown; user_id?: unknown };
        const requestActor = claims.sub ?? claims.user_id;
        if (
          typeof requestActor !== "string" ||
          (requestActor !== operator && requestActor !== ownActorAtRequest) ||
          !/^[a-f0-9-]{36}$/.test(data.operationId)
        ) {
          state.unknownActorRequest = true;
          return;
        }
        if (owned !== state) return;
        operations.add(`${requestActor}-${data.operationId}`);
        if (data.payload?.bankTransactionId)
          bankPaths.add(bankPath(data.payload.bankTransactionId));
      })
      .catch(() => {
        state.unknownActorRequest = true;
      });
    state.routeTasks.add(task);
    void task.finally(() => state.routeTasks.delete(task));
  });
  page.on("requestfinished", (request) => state.pendingWrites.delete(request));
  page.on("requestfailed", (request) => state.pendingWrites.delete(request));
  page.on("response", (response) => {
    const request = response.request();
    if (state.cancelled || owned !== state || request.method() !== "POST")
      return;
    if (!/\/(refundCommand|command|listWork)$/.test(request.url())) return;
    let data;
    try {
      data = request.postDataJSON()?.data;
    } catch {
      return;
    }
    const refundRpc =
      /\/(refundCommand|command)$/.test(request.url()) &&
      data?.orderId === state.orderId &&
      ["request", "cancel", "refund"].includes(data.action);
    const refundList =
      /\/listWork$/.test(request.url()) && data?.kind === "refunds";
    if (!refundRpc && !refundList) return;
    if (refundRpc)
      phase(state, "rpc_response", {
        httpOK: response.ok(),
        request: data.action === "request",
        refund: data.action === "refund",
        cancel: data.action === "cancel",
      });
    if (!refundList && data.action !== "refund") return;
    // The complete passive body parse is registered before deferred execution.
    const observation = Promise.resolve().then(async () => {
      if (owned !== state || state.cancelled) return;
      try {
        const body = await response.json();
        if (owned !== state || state.cancelled) return;
        if (refundList) {
          const rows = body.result?.rows;
          const readable = Array.isArray(rows);
          const own =
            readable && state.diagnosticRefundId
              ? rows.find(
                  (row: { id?: unknown }) =>
                    row?.id === state.diagnosticRefundId,
                )
              : undefined;
          phase(state, "refund_list_read", {
            projectionReadable: readable,
            targetKnown: !!state.diagnosticRefundId,
            ownRowPresent: !!own,
            ownRowPending: own?.state === "pending",
            ownRowConfirmed: own?.state === "confirmed",
            ownRowCancelled: own?.state === "cancelled",
            ownOrderMatches: own?.orderId === state.orderId,
            hasContinuation: typeof body.result?.next === "string",
            cursorUsed: typeof data.after === "string",
            hasError: body.error !== undefined,
          });
        } else
          phase(state, "confirm_ack", {
            ackReadable: true,
            hasResult: body.result !== undefined,
            hasError: body.error !== undefined,
            isABORTED: body.error?.status === "ABORTED",
            isPermissionDenied: body.error?.status === "PERMISSION_DENIED",
            isReplayAttempt: state.replayRequests.get(request) === true,
            resultMatchesOwnedOrder: body.result?.id === state.orderId,
            versionAdvanced:
              typeof body.result?.version === "number" &&
              body.result.version > data.expectedVersion,
          });
      } catch {
        if (owned === state && !state.cancelled)
          phase(state, refundList ? "refund_list_read" : "confirm_ack", {
            projectionReadable: false,
            ackReadable: false,
          });
      }
    });
    void trackFixture(state, observation);
  });
  phase(state, "source_order_start");
  const created = await trackFixture(state, sourceOrder(state.orderId));
  requireLive(() => owned === state && !state.cancelled);
  expect(created).toBe(state.orderId);
  state.sourceOrderResolved = true;
  phase(state, "source_order_done");
  const before = await order();
  state.productId = before.catalogSnapshot?.productId;
  const operationId = randomUUID(),
    bank = `funding028-${randomUUID()}`;
  operations.add(`e2e005-finance-${operationId}`);
  bankPaths.add(bankPath(bank));
  requireLive(() => owned === state && !state.cancelled);
  state.fundingStarted = true;
  phase(state, "funding_start");
  await trackFixture(
    state,
    invoke(
      "command",
      {
        action: "verifyTransfer",
        orderId: state.orderId,
        expectedVersion: before.version,
        operationId,
        payload: {
          amount: 240000,
          bankTransactionId: bank,
          evidence: "Synthetic funded refund fixture028",
          reason: "Emulator only",
        },
      },
      "finance",
    ),
  );
  requireLive(() => owned === state && !state.cancelled);
  state.fundingAcknowledged = true;
  phase(state, "funding_done");
  expect(await order()).toMatchObject({ collected: 240000, refunded: 0 });
  requireLive(() => owned === state && !state.cancelled);
  phase(state, "setup_done");
}
test.afterEach(async ({ page }, info) => {
  await cleanupOwned(page, info);
});
async function cleanupOwned(
  page: Page,
  info: TestInfo,
  primaryFailure = false,
  generation: OwnedState | null = owned,
) {
  const state = generation;
  if (!state || owned !== state) return;
  if (state.cleanupTask) return state.cleanupTask;
  state.cancelled = true;
  for (const cancel of [...state.cancelTerminals]) cancel();
  // Share one generation-bound cleanup across hook and fixture finally.
  state.cleanupTask = cleanState(page, info, state, primaryFailure);
  return state.cleanupTask;
}
async function cleanState(
  page: Page,
  info: TestInfo,
  state: OwnedState,
  primaryFailure: boolean,
) {
  const inFlightAtStart =
    state.pendingWrites.size > 0 ||
    state.routeTasks.size > 0 ||
    (state.fundingStarted && !state.fundingAcknowledged);
  cleanupPhase(state, "start", {
    primaryError: primaryFailure || info.errors.length > 0,
    browserClosed: page.isClosed(),
    ownedWriteInFlight: inFlightAtStart,
    orderKnown: true,
    productKnown: !!state.productId,
    partialProductUnverified: !state.sourceOrderResolved && !state.productId,
  });
  try {
    if (!page.isClosed())
      await page
        .unrouteAll({ behavior: "ignoreErrors" })
        .catch(() => undefined);
    // Settle tracked interception tasks before enumeration; no new timeout/retry budget.
    await Promise.allSettled([...state.routeTasks]);
    if (
      !/^refund-ui028-[a-f0-9-]{36}$/.test(state.orderId) ||
      state.orderId !== orderId
    )
      throw new Error("Cleanup refused non-owned order");
    expect(state.unknownActorRequest).toBe(false);
    const paths = new Set(bankPaths);
    const snapshot = await db.doc(`orders/${state.orderId}`).get();
    paths.add(`orders/${state.orderId}`);
    if (snapshot.exists) {
      expect(snapshot.get("ownerId")).toBe(customer);
      const productId = snapshot.get("catalogSnapshot.productId");
      if (state.productId) expect(productId).toBe(state.productId);
      if (productId) {
        expect(/^sanity-[a-f0-9-]{36}$/.test(productId)).toBe(true);
        state.productId = productId;
        paths.add(`products/${productId}`);
      }
    } else if (state.productId) paths.add(`products/${state.productId}`);
    for (const kind of ["refunds", "financialEntries", "outboxJobs"]) {
      const rows = await db
        .collection(kind)
        .where("orderId", "==", state.orderId)
        .limit(101)
        .get();
      expect(rows.size).toBeLessThanOrEqual(100);
      for (const row of rows.docs) {
        expect(row.get("orderId")).toBe(state.orderId);
        paths.add(row.ref.path);
      }
    }
    const audits = await db
      .collection("auditEvents")
      .where("resourceId", "==", state.orderId)
      .limit(101)
      .get();
    expect(audits.size).toBeLessThanOrEqual(100);
    for (const row of audits.docs) {
      expect(row.get("resourceId")).toBe(state.orderId);
      paths.add(row.ref.path);
    }
    const timeline = await db
      .collection(`orders/${state.orderId}/timeline`)
      .limit(101)
      .get();
    expect(timeline.size).toBeLessThanOrEqual(100);
    timeline.docs.forEach((row) => paths.add(row.ref.path));
    for (const key of operations) paths.add(`idempotencyKeys/${key}`);
    const ownActor = actor;
    if (ownActor) {
      expect(ownActor.uid).toBe(`e2e005-${ownActor.identity}`);
      expect(ownActor.identity.startsWith("customer-")).toBe(true);
      paths.add(`staffAccess/${ownActor.uid}`);
      paths.add(`users/${ownActor.uid}`);
    }
    // All ownership and sentinel validation above precedes any deletion.
    const list = [...paths];
    for (let i = 0; i < list.length; i += 400) {
      const batch = db.batch();
      list.slice(i, i + 400).forEach((path) => batch.delete(db.doc(path)));
      await batch.commit();
    }
    if (ownActor)
      await getAuth(getApp("release021-browser")).deleteUser(ownActor.uid);
    cleanupPhase(state, "done", {
      cleanupComplete: true,
      enumeratedResourcesOnly: true,
      ownedWriteInFlight: state.pendingWrites.size > 0,
      lateCommitUnverified: inFlightAtStart,
      partialProductUnverified: !state.sourceOrderResolved && !state.productId,
    });
  } catch (error) {
    cleanupPhase(state, "failed", {
      cleanupComplete: false,
      primaryError: primaryFailure || info.errors.length > 0,
      lateCommitUnverified: inFlightAtStart,
      partialProductUnverified: !state.sourceOrderResolved && !state.productId,
    });
    if (!primaryFailure && info.errors.length === 0) throw error;
  } finally {
    // No discovery or guessed cleanup of earlier failed fixtures.
    if (owned === state) {
      owned = null;
      orderId = "";
      actor = null;
      operations.clear();
      bankPaths.clear();
    }
  }
}
async function login(page: Page, identity = "owner") {
  const state = owned;
  if (!state) throw new Error("Login requires owned fixture");
  phase(state, "login_start");
  await page.goto("/account");
  if (identity !== "owner")
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .evaluate((select, value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = "Synthetic isolated finance028";
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
  await page.goto("/crm/refunds");
  await expect(
    page.getByRole("heading", {
      name: "Yêu cầu & xác nhận hoàn tiền",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tải lại", exact: true }),
  ).toBeEnabled();
  phase(state, "login_done");
}
function capture(page: Page, uid = operator) {
  const state = owned;
  const commands: RefundCommand[] = [];
  page.on("request", (request) => {
    if (
      !state ||
      state.cancelled ||
      owned !== state ||
      request.method() !== "POST" ||
      !/\/(refundCommand|command)$/.test(request.url())
    )
      return;
    const data = request.postDataJSON()?.data as RefundCommand | undefined;
    if (
      data?.orderId !== orderId ||
      !["request", "cancel", "refund"].includes(data.action)
    )
      return;
    commands.push(data);
    if (uid !== operator && uid !== actor?.uid)
      throw new Error("Unexpected fixture capture actor");
  });
  return commands;
}
async function open(summary: Locator) {
  if (
    !(await summary
      .locator("..")
      .evaluate((element) => (element as HTMLDetailsElement).open))
  )
    await summary.click();
}
async function requestForm(page: Page, amount = 10000) {
  const summary = page
    .locator("summary")
    .filter({ hasText: "Tạo yêu cầu hoàn tiền" });
  await open(summary);
  const form = summary.locator("..").locator("form");
  await form
    .getByRole("textbox", { name: "Mã đơn", exact: true })
    .fill(orderId);
  await form
    .getByRole("spinbutton", { name: "Số tiền (₫)", exact: true })
    .fill(String(amount));
  await form
    .getByRole("textbox", { name: "Lý do", exact: true })
    .fill(`Synthetic refund reservation ${amount} only028`);
  return form;
}
async function sendRequest(form: Locator) {
  const button = form.getByRole("button", {
    name: "Tạo yêu cầu, chưa xác nhận tiền ra",
    exact: true,
  });
  await button.focus();
  await expect(button).toBeFocused();
  await button.press("Enter");
}
async function pendingId() {
  const snapshots = await db
    .collection("refunds")
    .where("orderId", "==", orderId)
    .get();
  const pending = snapshots.docs.filter((d) => d.data().state === "pending");
  expect(pending).toHaveLength(1);
  if (owned && !owned.cancelled && owned.orderId === orderId)
    owned.diagnosticRefundId = pending[0].id;
  return pending[0].id;
}
async function confirmProbe(
  page: Page,
  stage:
    "confirm_stage_before" | "confirm_stage_after" | "confirm_stage_failed",
) {
  const state = owned;
  if (!state || state.cancelled || !state.diagnosticRefundId) return;
  const live = () => owned === state && !state.cancelled;
  const probe = Promise.resolve().then(async () => {
    if (!live()) return;
    phase(state, stage);
    const row = page.locator("article.crmItem").filter({
      has: page.getByText(state.diagnosticRefundId!, { exact: true }),
    });
    try {
      const [orderDoc, refundDoc] = await Promise.all([
        db.doc(`orders/${state.orderId}`).get(),
        db.doc(`refunds/${state.diagnosticRefundId}`).get(),
      ]);
      if (!live()) return;
      const matches = refundDoc.get("orderId") === state.orderId;
      phase(state, "confirm_probe", {
        backendReadable: true,
        refundOwned: matches,
        orderExists: orderDoc.exists,
        refundExists: refundDoc.exists,
        backendPending: matches && refundDoc.get("state") === "pending",
        backendConfirmed: matches && refundDoc.get("state") === "confirmed",
        backendCancelled: matches && refundDoc.get("state") === "cancelled",
        orderVersionAdvanced:
          typeof state.confirmExpectedVersion === "number" &&
          orderDoc.get("version") > state.confirmExpectedVersion,
        refundedExpected: orderDoc.get("refunded") === 10000,
        reservationReleased: orderDoc.get("refundReserved") === 0,
      });
    } catch {
      if (live()) phase(state, "confirm_probe", { backendReadable: false });
    }
    if (!live()) return;
    try {
      const attached = (await row.count()) === 1;
      const visible = attached && (await row.isVisible());
      const form = row.locator("form");
      const hasForm = attached && (await form.count()) === 1;
      const fieldset = form.locator("fieldset");
      const hasFieldset = hasForm && (await fieldset.count()) === 1;
      const reload = page.getByRole("button", { name: "Tải lại", exact: true });
      const flags = {
        probeReadable: true,
        rowAttached: attached,
        rowVisible: visible,
        pendingCopyPresent:
          attached &&
          (await row
            .getByText("Chờ hoàn · tiền chưa được xác nhận ra", { exact: true })
            .count()) > 0,
        confirmedCopyPresent:
          attached &&
          (await row
            .getByText("Đã xác nhận tiền ra", { exact: true })
            .count()) > 0,
        formPresent: hasForm,
        formDisabled: hasFieldset && (await fieldset.isDisabled()),
        retryVisible:
          attached &&
          (await row
            .getByRole("button", {
              name: "Thử lại quyết định đã gửi",
              exact: true,
            })
            .isVisible()),
        listReloadEnabled:
          (await reload.count()) === 1 && (await reload.isEnabled()),
        firstPageLoadErrorVisible: await page
          .getByText(
            "Chưa tải được yêu cầu hoàn tiền. Kiểm tra kết nối và thử lại.",
            { exact: true },
          )
          .isVisible(),
      };
      if (live()) phase(state, "confirm_probe", flags);
    } catch {
      if (live())
        phase(state, "confirm_probe", {
          probeReadable: false,
          pageClosed: page.isClosed(),
        });
    }
  });
  await trackFixture(state, probe).catch(() => {
    if (live()) phase(state, "confirm_probe", { probeReadable: false });
  });
}
async function findRow(page: Page, id: string) {
  const row = page
    .locator("article.crmItem")
    .filter({ has: page.getByText(id, { exact: true }) });
  for (let guard = 0; guard < 30 && !(await row.count()); guard++) {
    const next = page.getByRole("button", {
      name: "Trang tiếp theo",
      exact: true,
    });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(
      page.getByRole("button", { name: "Tải lại", exact: true }),
    ).toBeEnabled();
  }
  await expect(row).toBeVisible();
  return row;
}
async function decision(row: Locator, action: "confirm" | "cancel") {
  await open(row.locator("summary").filter({ hasText: "Xử lý yêu cầu" }));
  const form = row.locator("form");
  await form
    .getByRole("combobox", { name: "Thao tác", exact: true })
    .selectOption(action);
  if (action === "confirm")
    await form
      .getByRole("textbox", { name: "Mã giao dịch ngân hàng", exact: true })
      .fill(`refund-bank028-${randomUUID()}`);
  else
    await expect(
      form.getByRole("textbox", {
        name: "Mã giao dịch ngân hàng",
        exact: true,
      }),
    ).toHaveCount(0);
  await form
    .getByRole("textbox", {
      name: action === "confirm" ? "Bằng chứng đối soát" : "Lý do hủy",
      exact: true,
    })
    .fill(
      action === "confirm"
        ? "Synthetic verified outgoing proof028"
        : "Synthetic release reservation, no money sent028",
    );
  return form;
}
for (const width of [390, 768, 1440])
  test(`REFUNDS028 real reservation confirm cancel and immutable lost response at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const initialLedger = await ledger(),
      commands = capture(page);
    const lostAction =
      width === 390 ? "request" : width === 768 ? "refund" : "cancel";
    let dropped = false;
    if (!owned) throw new Error("Lost response requires owned fixture");
    const terminal = lostTerminal(owned);
    for (const endpoint of ["refundCommand", "command"])
      await guardedRoute(page, `**/${endpoint}`, async (route, live) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        const data = route.request().postDataJSON()?.data;
        if (
          !dropped &&
          data?.orderId === orderId &&
          data.action === lostAction
        ) {
          dropped = true;
          await terminal.drop(route, live);
        } else await route.continue();
      });
    await login(page);
    const create = await requestForm(page);
    await sendRequest(create);
    if (lostAction === "request") {
      await terminal.wait();
      const retry = create.getByRole("button", {
        name: "Thử lại yêu cầu đã gửi",
        exact: true,
      });
      await expect(retry).toBeVisible();
      await expect(
        create.getByRole("textbox", { name: "Mã đơn", exact: true }),
      ).toBeDisabled();
      expect(await order()).toMatchObject({
        collected: 240000,
        refunded: 0,
        refundReserved: 10000,
      });
      expect(await ledger()).toEqual(initialLedger);
      await retry.click();
    }
    await expect(
      page.getByRole("button", { name: "Tải lại", exact: true }),
    ).toBeEnabled();
    const id = await pendingId(),
      row = await findRow(page, id);
    await expect(row).toContainText("Chờ hoàn · tiền chưa được xác nhận ra");
    expect(await order()).toMatchObject({
      collected: 240000,
      refunded: 0,
      refundReserved: 10000,
    });
    expect(await ledger()).toEqual(initialLedger);
    expect(await audit("refund-request")).toHaveLength(1);
    const confirm = await decision(row, "confirm");
    await confirmProbe(page, "confirm_stage_before");
    await confirm
      .getByRole("button", { name: "Xác nhận tiền đã hoàn", exact: true })
      .click();
    if (lostAction === "refund") {
      await terminal.wait();
      const retry = row.getByRole("button", {
        name: "Thử lại quyết định đã gửi",
        exact: true,
      });
      await expect(retry).toBeVisible();
      await expect(
        confirm.getByRole("combobox", { name: "Thao tác", exact: true }),
      ).toBeDisabled();
      expect(await order()).toMatchObject({
        refunded: 10000,
        refundReserved: 0,
      });
      await retry.click();
    }
    await expect(
      page.getByRole("button", { name: "Tải lại", exact: true }),
    ).toBeEnabled();
    await confirmProbe(page, "confirm_stage_after");
    try {
      const confirmed = await findRow(page, id);
      await expect(confirmed).toContainText("Đã xác nhận tiền ra");
      await expect(confirmed.locator("form")).toHaveCount(0);
    } catch (error) {
      await confirmProbe(page, "confirm_stage_failed");
      throw error;
    }
    expect(await order()).toMatchObject({
      collected: 240000,
      refunded: 10000,
      refundReserved: 0,
    });
    const outgoing = (await ledger()).filter(
      (entry) => entry.kind === "refund",
    );
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0]).toMatchObject({ amount: 10000, currency: "VND" });
    expect((await ledger()).filter((entry) => entry.kind !== "refund")).toEqual(
      initialLedger,
    );
    expect(await audit("refund")).toHaveLength(1);
    const afterConfirm = await ledger();
    const second = await requestForm(page, 15000);
    await sendRequest(second);
    await expect(
      page.getByRole("button", { name: "Tải lại", exact: true }),
    ).toBeEnabled();
    const secondId = await pendingId(),
      cancelRow = await findRow(page, secondId);
    expect(await order()).toMatchObject({
      refunded: 10000,
      refundReserved: 15000,
    });
    expect(await ledger()).toEqual(afterConfirm);
    const cancel = await decision(cancelRow, "cancel");
    await cancel
      .getByRole("button", { name: "Hủy yêu cầu hoàn tiền", exact: true })
      .click();
    if (lostAction === "cancel") {
      await terminal.wait();
      const retry = cancelRow.getByRole("button", {
        name: "Thử lại quyết định đã gửi",
        exact: true,
      });
      await expect(retry).toBeVisible();
      await expect(
        cancel.getByRole("textbox", { name: "Lý do hủy", exact: true }),
      ).toBeDisabled();
      expect(await order()).toMatchObject({
        refunded: 10000,
        refundReserved: 0,
      });
      expect(await ledger()).toEqual(afterConfirm);
      await retry.click();
    }
    await expect(
      page.getByRole("button", { name: "Tải lại", exact: true }),
    ).toBeEnabled();
    const cancelled = await findRow(page, secondId);
    await expect(cancelled).toContainText("Đã hủy yêu cầu");
    await expect(cancelled.locator("form")).toHaveCount(0);
    expect(await ledger()).toEqual(afterConfirm);
    expect(await order()).toMatchObject({
      collected: 240000,
      refunded: 10000,
      refundReserved: 0,
    });
    expect(await audit("refund-request")).toHaveLength(2);
    expect(await audit("refund-cancel")).toHaveLength(1);
    const attempts = commands.filter(
      (command) =>
        command.action === lostAction &&
        (lostAction !== "request" || command.amount === 10000),
    );
    expect(dropped).toBe(true);
    expect(attempts).toHaveLength(2);
    expect(attempts[1]).toEqual(attempts[0]);
    expect(
      (
        await db
          .doc(`idempotencyKeys/${operator}-${attempts[0].operationId}`)
          .get()
      ).exists,
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/refund-positive028-${width}.png`,
    });
  });
test("REFUNDS028 real request CAS writes no reservation and preserves intent for a new operation", async ({
  page,
}) => {
  const beforeLedger = await ledger(),
    commands = capture(page);
  let conflict = false;
  await guardedRoute(page, "**/refundCommand", async (route, live) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const data = route.request().postDataJSON()?.data;
    if (!conflict && data?.orderId === orderId && data.action === "request") {
      requireLive(live);
      conflict = true;
      await db
        .doc(`orders/${orderId}`)
        .update({ version: data.expectedVersion + 1 });
    }
    if (live()) await route.continue();
  });
  await login(page);
  const form = await requestForm(page);
  await sendRequest(form);
  await expect(
    page.getByText(
      "Chưa tạo được yêu cầu. Kiểm tra đơn, phần tiền có thể hoàn và xác thực hai lớp.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    form.getByRole("textbox", { name: "Mã đơn", exact: true }),
  ).toHaveValue(orderId);
  await expect(
    form.getByRole("spinbutton", { name: "Số tiền (₫)", exact: true }),
  ).toHaveValue("10000");
  expect(
    (await db.collection("refunds").where("orderId", "==", orderId).get()).size,
  ).toBe(0);
  expect((await order()).refundReserved ?? 0).toBe(0);
  expect(await ledger()).toEqual(beforeLedger);
  expect(
    (
      await db
        .doc(`idempotencyKeys/${operator}-${commands[0].operationId}`)
        .get()
    ).exists,
  ).toBe(false);
  await sendRequest(form);
  await expect(
    page.getByRole("button", { name: "Tải lại", exact: true }),
  ).toBeEnabled();
  const id = await pendingId();
  await expect(await findRow(page, id)).toContainText(
    "Chờ hoàn · tiền chưa được xác nhận ra",
  );
  expect(commands).toHaveLength(2);
  expect(commands[1].operationId).not.toBe(commands[0].operationId);
  expect(commands[1].expectedVersion).toBe(commands[0].expectedVersion + 1);
  expect(await order()).toMatchObject({ refunded: 0, refundReserved: 10000 });
  expect(await ledger()).toEqual(beforeLedger);
  expect(await audit("refund-request")).toHaveLength(1);
});
test("REFUNDS028 actual confirm CAS keeps bank proof and creates exactly one outgoing entry after a fresh read", async ({
  page,
}) => {
  await login(page);
  const form = await requestForm(page);
  await sendRequest(form);
  await expect(
    page.getByRole("button", { name: "Tải lại", exact: true }),
  ).toBeEnabled();
  const id = await pendingId(),
    row = await findRow(page, id),
    confirm = await decision(row, "confirm"),
    beforeLedger = await ledger(),
    commands = capture(page);
  const bank = await confirm
    .getByRole("textbox", { name: "Mã giao dịch ngân hàng", exact: true })
    .inputValue();
  let conflict = false;
  await guardedRoute(page, "**/command", async (route, live) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const data = route.request().postDataJSON()?.data;
    if (!conflict && data?.orderId === orderId && data.action === "refund") {
      requireLive(live);
      conflict = true;
      await db
        .doc(`orders/${orderId}`)
        .update({ version: data.expectedVersion + 1 });
    }
    if (live()) await route.continue();
  });
  await confirmProbe(page, "confirm_stage_before");
  await confirm
    .getByRole("button", { name: "Xác nhận tiền đã hoàn", exact: true })
    .click();
  await expect(
    row.getByText(
      "Chưa xử lý được. Kiểm tra quyền, giao dịch thực tế và phiên bản đơn trước khi tiếp tục.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    confirm.getByRole("textbox", {
      name: "Mã giao dịch ngân hàng",
      exact: true,
    }),
  ).toHaveValue(bank);
  await expect(
    confirm.getByRole("textbox", { name: "Bằng chứng đối soát", exact: true }),
  ).toHaveValue("Synthetic verified outgoing proof028");
  expect(await ledger()).toEqual(beforeLedger);
  expect(await order()).toMatchObject({ refunded: 0, refundReserved: 10000 });
  expect((await db.doc(bankPath(bank)).get()).exists).toBe(false);
  expect(
    (
      await db
        .doc(`idempotencyKeys/${operator}-${commands[0].operationId}`)
        .get()
    ).exists,
  ).toBe(false);
  await confirmProbe(page, "confirm_stage_before");
  await confirm
    .getByRole("button", { name: "Xác nhận tiền đã hoàn", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tải lại", exact: true }),
  ).toBeEnabled();
  await confirmProbe(page, "confirm_stage_after");
  try {
    await expect(await findRow(page, id)).toContainText("Đã xác nhận tiền ra");
  } catch (error) {
    await confirmProbe(page, "confirm_stage_failed");
    throw error;
  }
  expect(commands).toHaveLength(2);
  expect(commands[1].operationId).not.toBe(commands[0].operationId);
  expect(commands[1].expectedVersion).toBe(commands[0].expectedVersion + 1);
  expect(
    (await ledger()).filter((entry) => entry.kind === "refund"),
  ).toHaveLength(1);
  expect(await audit("refund")).toHaveLength(1);
  expect(await order()).toMatchObject({ refunded: 10000, refundReserved: 0 });
});
test("REFUNDS028 committed unknown request replay rechecks current isolated finance authority", async ({
  page,
}) => {
  const actorState = owned;
  const actorLive = () =>
    !!actorState && owned === actorState && !actorState.cancelled;
  if (!actorState) throw new Error("Actor creation requires owned fixture");
  actor = await trackFixture(actorState, freshCustomer());
  requireLive(actorLive);
  const isolatedActor = actor;
  await runActorOperation(actorState, () =>
    db
      .doc(`staffAccess/${isolatedActor.uid}`)
      .set({ active: true, locked: false, roles: ["FINANCE"], version: 1 }),
  );
  const commands = capture(page, isolatedActor.uid);
  let dropped = false;
  const terminal = lostTerminal(actorState);
  await guardedRoute(page, "**/refundCommand", async (route, live) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const data = route.request().postDataJSON()?.data;
    if (!dropped && data?.orderId === orderId && data.action === "request") {
      dropped = true;
      await terminal.drop(route, live);
    } else await route.continue();
  });
  await login(page, isolatedActor.identity);
  const form = await requestForm(page);
  await sendRequest(form);
  await terminal.wait();
  await expect(
    form.getByRole("button", { name: "Thử lại yêu cầu đã gửi", exact: true }),
  ).toBeVisible();
  const id = await pendingId(),
    reserved = await order(),
    beforeLedger = await ledger();
  expect(commands).toHaveLength(1);
  requireLive(actorLive);
  await runActorOperation(actorState, () =>
    db
      .doc(`staffAccess/${isolatedActor.uid}`)
      .update({ active: false, version: 2 }),
  );
  await expect(
    page.getByRole("heading", {
      name: "Cần tài khoản nhân viên được cấp quyền",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    (
      await runActorOperation(actorState, () =>
        call("refundCommand", commands[0], isolatedActor.identity),
      )
    ).error?.status,
  ).toBe("PERMISSION_DENIED");
  expect(await order()).toEqual(reserved);
  expect(await ledger()).toEqual(beforeLedger);
  expect(await audit("refund-request")).toHaveLength(1);
  requireLive(actorLive);
  await runActorOperation(actorState, () =>
    db
      .doc(`staffAccess/${isolatedActor.uid}`)
      .update({ active: true, version: 3 }),
  );
  const replay = await runActorOperation(actorState, () =>
    invoke<{ id: string }>(
      "refundCommand",
      commands[0],
      isolatedActor.identity,
    ),
  );
  expect(replay.id).toBe(id);
  expect(await order()).toEqual(reserved);
  expect(await ledger()).toEqual(beforeLedger);
  expect(await audit("refund-request")).toHaveLength(1);
  expect(
    (await db.collection("refunds").where("orderId", "==", orderId).get()).size,
  ).toBe(1);
});
