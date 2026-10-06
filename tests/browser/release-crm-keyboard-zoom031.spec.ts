import { studioSearchTokens } from "../../packages/domain/blog-studio-advanced";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { documentSnapshot } from "../../packages/domain/invoices";
import { test, expect, chromium, type BrowserContext } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
import { db, operator, closeFixtures } from "./fixtures";

// Source-bound 26-context matrix. Runtime execution remains NOT_RUN until root runs it.
// No shared settings, identity seeding, mocked reads, screenshots or UI commands.
test.use({ screenshot: "off", trace: "off", video: "off" });
test.describe.configure({ timeout: 45000, retries: 0 });
const contexts = [
  "documents",
  "overview",
  "orders",
  "purchasing",
  "warehouse",
  "returns",
  "shipping",
  "changes",
  "refunds",
  "finance",
  "customers",
  "follow-ups",
  "support",
  "content",
  "campaigns",
  "membership",
  "staff",
  "activity",
  "shipping-rates",
  "settings",
  "studio-dashboard",
  "studio-settings",
  "studio-account",
  "studio-comments",
  "studio-editor",
  "studio-preview",
] as const;
const modes = [390, 768, 1440, "native200"] as const;
// Source: shared/firebase.ts readServices; default unknown callable is forbidden.
const orderReads = new Set([
  "listWork",
  "readStaffAccess",
  "readOwnerConfiguration",
  "readOrderOperations",
  "listOrderImages",
  "readOrderImage",
  "readOrderConversation",
  "orderHistory",
]);
test.beforeAll(async () => {
  if (process.env.SATSUNICGO_SANITY_URL !== "http://127.0.0.1:5187")
    throw Error("CRM031 requires the isolated local UI");
  const [staff, user] = await Promise.all([
    db.doc(`staffAccess/${operator}`).get(),
    db.doc(`users/${operator}`).get(),
  ]);
  expect(staff.exists && user.exists).toBe(true);
  expect(staff.get("active")).toBe(true);
  expect(staff.get("roles")).toContain("OWNER");
  await establishAskBaseline();
  expect(staff.get("locked") === true || user.get("locked") === true).toBe(
    false,
  );
});
test.afterAll(closeFixtures);

// A nominal read can create shared Ask state. Permit only a proven existing branch.
let askBaseline:
  | {
      conversationId: string;
      pointerPath: string;
      conversationPath: string;
      pointerHash: string;
      conversationHash: string;
    }
  | undefined;
function privateHash(value: unknown): string {
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((key) => [
                key,
                canonical((v as Record<string, unknown>)[key]),
              ]),
          )
        : v;
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}
async function establishAskBaseline() {
  const pointerPath = `askCurrent/${operator}`;
  const pointer = await db.doc(pointerPath).get();
  const conversationId: unknown = pointer.get("conversationId");
  if (
    !pointer.exists ||
    typeof conversationId !== "string" ||
    !/^[a-zA-Z0-9-]{1,128}$/.test(conversationId)
  )
    throw Error(
      "NOT_RUN: existing operator Ask pointer unavailable; shared repair forbidden",
    );
  const conversationPath = `askConversations/${operator}-${conversationId}`;
  const conversation = await db.doc(conversationPath).get();
  if (!conversation.exists || conversation.get("ownerId") !== operator)
    throw Error(
      "NOT_RUN: existing operator Ask conversation unavailable; shared repair forbidden",
    );
  askBaseline = {
    conversationId,
    pointerPath,
    conversationPath,
    pointerHash: privateHash(pointer.data()),
    conversationHash: privateHash(conversation.data()),
  };
}
async function askUnchanged() {
  if (!askBaseline) return false;
  const [pointer, conversation] = await Promise.all([
    db.doc(askBaseline.pointerPath).get(),
    db.doc(askBaseline.conversationPath).get(),
  ]);
  return (
    pointer.exists &&
    conversation.exists &&
    conversation.get("ownerId") === operator &&
    privateHash(pointer.data()) === askBaseline.pointerHash &&
    privateHash(conversation.data()) === askBaseline.conversationHash
  );
}
function observeGuardedAsk(
  request: import("@playwright/test").Request,
  state: Generation,
) {
  state.askRequests++;
  if (!askBaseline || state.cancelled) {
    state.preserve = true;
    state.askFailed = true;
    return;
  }
  const current = state;
  const task = (async () => {
    try {
      const response = await request.response();
      const envelope: unknown = response ? await response.json() : undefined;
      const result =
        envelope && typeof envelope === "object"
          ? (envelope as {
              result?: { conversationId?: unknown };
              error?: unknown;
            })
          : undefined;
      if (
        !response?.ok() ||
        result?.error ||
        result?.result?.conversationId !== askBaseline?.conversationId ||
        generations.get(test.info().testId) !== current
      ) {
        current.askFailed = true;
        current.preserve = true;
      } else {
        current.askAcks++;
      }
    } catch {
      current.askFailed = true;
      current.preserve = true;
    }
  })();
  state.tasks.add(task);
  const settled = task.then(
    () => undefined,
    () => {
      state.askFailed = true;
      state.preserve = true;
    },
  );
  void settled.then(() => state.tasks.delete(task));
}
async function verifyGuardedAsk(primaryFailure?: unknown) {
  const state = generations.get(test.info().testId);
  if (!state) throw Error("CRM031 request generation unavailable");
  try {
    await expect
      .poll(() => state.askRequests, { timeout: 12000 })
      .toBeGreaterThanOrEqual(1);
    let snapshot: number;
    do {
      snapshot = state.askRequests;
      await Promise.allSettled([...state.tasks]);
    } while (snapshot !== state.askRequests || state.tasks.size > 0);
    const acknowledged = state.askAcks;
    const unchanged = await askUnchanged();
    const stable =
      snapshot === state.askRequests &&
      acknowledged === state.askAcks &&
      state.tasks.size === 0;
    const complete = snapshot >= 1 && acknowledged === snapshot;
    if (!unchanged || state.askFailed || !stable || !complete)
      state.preserve = true;
    expect(
      !state.askFailed && unchanged && stable && complete,
      "Guarded Ask requires actual successful ACKs and stable drained readback; private state not printed",
    ).toBe(true);
  } catch (error) {
    state.preserve = true;
    if (primaryFailure !== undefined)
      throw new AggregateError(
        [primaryFailure, error],
        "CRM031 primary failure and guarded Ask diagnostic failure",
      );
    throw error;
  }
}

function readKey(request: import("@playwright/test").Request) {
  const endpoint =
    new URL(request.url()).pathname.split("/").pop() ?? "unknown";
  let discriminator = "";
  try {
    const data = request.postDataJSON()?.data;
    discriminator = String(data?.kind ?? data?.action ?? "");
  } catch {
    /* no raw payload logging */
  }
  return `${endpoint}:${discriminator}`;
}
function provenRead(request: import("@playwright/test").Request) {
  const url = new URL(request.url());
  if (request.method() !== "POST" || !url.pathname.includes("demo-satsunicgo/"))
    return false;
  const endpoint = url.pathname.split("/").pop() ?? "";
  if (["membershipReminderPolicy", "shippingRatesAdmin"].includes(endpoint)) {
    try {
      return request.postDataJSON()?.data?.action === "read";
    } catch {
      return false;
    }
  }
  return [
    ...orderReads,
    "studioRead",
    "studioAdvancedRead",
    "studioMediaRead",
    "blogCommentList",
    "operationalDashboard",
    "shippingRatesPublic",
    "invoiceList",
    "invoiceDetail",
    "ticketMessages",
    "listCustomers",
    "listFollowUps",
    "listCrmStaff",
    "readCustomer",
  ].includes(endpoint);
}
function observeActualRead(
  request: import("@playwright/test").Request,
  state: Generation,
) {
  if (!provenRead(request)) return;
  const key = readKey(request);
  const task = (async () => {
    try {
      const response = await request.response();
      const envelope = response
        ? ((await response.json()) as { result?: unknown; error?: unknown })
        : undefined;
      if (response?.ok() && !envelope?.error && envelope?.result !== undefined)
        state.readAcks.set(key, (state.readAcks.get(key) ?? 0) + 1);
    } catch {
      /* readiness fails without inventing an ACK */
    }
  })();
  state.tasks.add(task);
  const settled = task.then(
    () => undefined,
    () => undefined,
  );
  void settled.then(() => state.tasks.delete(task));
}
function readCount(endpoint: string, discriminator = "") {
  return generation().readAcks.get(`${endpoint}:${discriminator}`) ?? 0;
}
async function waitActualRead(
  page: import("@playwright/test").Page,
  endpoint: string,
  discriminator = "",
  before = 0,
  readyLabel?: string,
) {
  await expect
    .poll(() => readCount(endpoint, discriminator), { timeout: 12000 })
    .toBeGreaterThan(before);
  if (readyLabel)
    await expect(
      page.getByRole("button", { name: readyLabel, exact: true }),
    ).toBeEnabled();
}
async function visibleControl(control: import("@playwright/test").Locator) {
  await expect(control).toBeVisible();
  expect(
    await control.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.left >= 0 &&
        r.right <= innerWidth + 1 &&
        r.top >= 0 &&
        r.bottom <= innerHeight + 1
      );
    }),
  ).toBe(true);
}

type Generation = {
  cancelled: boolean;
  askFailed: boolean;
  askRequests: number;
  askAcks: number;
  forbiddenCalls: number;
  ownBaselineDrift: boolean;
  preserve: boolean;
  tasks: Set<Promise<unknown>>;
  readAcks: Map<string, number>;
  records: Map<
    string,
    {
      ref: import("firebase-admin/firestore").DocumentReference;
      baseline?: unknown;
      created: boolean;
    }
  >;
  auth: Map<string, { created: boolean; baseline?: unknown }>;
};
const generations = new Map<string, Generation>();
function generation() {
  const state = generations.get(test.info().testId);
  if (!state || state.cancelled)
    throw Error("CRM031 fixture generation unavailable");
  return state;
}
function preserveGeneration() {
  const state = generations.get(test.info().testId);
  if (state) {
    state.preserve = true;
    state.forbiddenCalls++;
  }
}
test.beforeEach(async () => {
  if (!(await askUnchanged()))
    throw Error(
      "NOT_RUN: immutable existing Ask preflight failed before fixture writes/login",
    );
  generations.set(test.info().testId, {
    cancelled: false,
    askFailed: false,
    askRequests: 0,
    askAcks: 0,
    forbiddenCalls: 0,
    ownBaselineDrift: false,
    preserve: false,
    tasks: new Set(),
    readAcks: new Map(),
    records: new Map(),
    auth: new Map(),
  });
});
async function trackedCreate(
  ref: import("firebase-admin/firestore").DocumentReference,
  data: Record<string, unknown>,
) {
  const state = generation();
  if (state.records.has(ref.path))
    throw Error("CRM031 duplicate owned resource");
  const entry = { ref, created: false, baseline: undefined as unknown };
  state.records.set(ref.path, entry);
  const task = (async () => {
    if (state.cancelled) throw Error("CRM031 generation cancelled");
    await ref.create(data);
    entry.created = true;
    entry.baseline = (await ref.get()).data();
    if (state.cancelled) throw Error("CRM031 generation cancelled");
  })();
  state.tasks.add(task);
  const settled = task.then(
    () => undefined,
    () => undefined,
  );
  try {
    await task;
  } finally {
    await settled;
    state.tasks.delete(task);
  }
}
async function trackedAuthCreate(
  uid: string,
  data: { email: string; emailVerified: boolean },
) {
  const state = generation();
  const entry = { created: false, baseline: undefined as unknown };
  state.auth.set(uid, entry);
  const auth = getAuth(getApp("release021-browser"));
  const task = (async () => {
    if (state.cancelled) throw Error("CRM031 generation cancelled");
    await auth.createUser({ uid, ...data });
    entry.created = true;
    entry.baseline = (await auth.getUser(uid)).toJSON();
    if (state.cancelled) throw Error("CRM031 generation cancelled");
  })();
  state.tasks.add(task);
  const settled = task.then(
    () => undefined,
    () => undefined,
  );
  try {
    await task;
  } finally {
    await settled;
    state.tasks.delete(task);
  }
}
test.afterEach(async () => {
  const state = generations.get(test.info().testId);
  if (!state) return;
  state.cancelled = true;
  await Promise.allSettled([...state.tasks]);
  if (
    !(await askUnchanged()) ||
    state.askFailed ||
    state.askRequests < 1 ||
    state.askAcks !== state.askRequests ||
    state.tasks.size > 0
  )
    state.preserve = true;
  const auth = getAuth(getApp("release021-browser"));
  const remaining = [];
  for (const entry of state.records.values())
    if (entry.created) {
      const current = await entry.ref.get();
      if (current.exists) {
        if (!isDeepStrictEqual(current.data(), entry.baseline)) {
          state.preserve = true;
          state.ownBaselineDrift = true;
        }
        remaining.push(entry);
      }
    }
  const remainingAuth = [];
  for (const [uid, entry] of state.auth)
    if (entry.created) {
      try {
        const current = (await auth.getUser(uid)).toJSON();
        if (!isDeepStrictEqual(current, entry.baseline)) {
          state.preserve = true;
          state.ownBaselineDrift = true;
        }
        remainingAuth.push(uid);
      } catch (error) {
        if ((error as { code?: string }).code !== "auth/user-not-found")
          throw error;
      }
    }
  if (!state.preserve) {
    for (const entry of remaining) {
      await entry.ref.delete();
      expect((await entry.ref.get()).exists).toBe(false);
    }
    for (const uid of remainingAuth) {
      await auth.deleteUser(uid);
      await expect(auth.getUser(uid)).rejects.toMatchObject({
        code: "auth/user-not-found",
      });
    }
  }
  console.info(
    JSON.stringify({
      diagnostic: "CRM031_CLEANUP",
      forbiddenCalls: state.forbiddenCalls,
      ownBaselineDrift: state.ownBaselineDrift,
      askAckFailure: state.askFailed,
      askRequests: state.askRequests,
      askAcks: state.askAcks,
      pendingTrackedTasks: state.tasks.size,
      sharedAskUnchanged: await askUnchanged(),
      cleanupComplete: !state.preserve,
    }),
  );
  generations.delete(test.info().testId);
  expect(state.preserve, "Owned evidence preserved; cleanup incomplete").toBe(
    false,
  );
});

async function studioProbe(name: string, mode: (typeof modes)[number]) {
  const id = `crm031-${randomUUID()}`,
    commentId = `crm031-${randomUUID()}`;
  const paths =
    name === "studio-comments"
      ? [`blogDrafts/${id}`, `blogComments/${commentId}`]
      : [`blogDrafts/${id}`];
  const ledger = paths.map((path) => ({
    ref: db.doc(path),
    created: false,
    baseline: undefined as unknown,
  }));
  const time = new Date().toISOString();
  const post = {
    id,
    owner: operator,
    state: "draft",
    revision: 1,
    updatedAt: time,
    title: id,
    slug: id,
    summary: "Synthetic CRM031 summary",
    answer: "",
    assignee: "",
    authorId: "",
    category: "",
    tags: [],
    language: "vi",
    coverId: "",
    commentsEnabled: true,
    seoTitle: "",
    seoDescription: "",
    sources: [],
    body: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: id }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Synthetic CRM031 keyboard content" },
          ],
        },
        { type: "horizontalRule" },
      ],
    },
  };
  const forbidden: string[] = [];
  let profile: string | undefined, context: BrowserContext | undefined;
  let primaryFailure: unknown;
  try {
    for (const [n, item] of ledger.entries()) {
      await trackedCreate(
        item.ref,
        n === 0
          ? {
              ...post,
              tokens: studioSearchTokens(
                `${post.title} ${post.summary} ${post.tags.join(" ")}`,
              ),
            }
          : {
              id: commentId,
              postId: id,
              uid: operator,
              parentId: "",
              name: "Synthetic CRM031",
              text: commentId,
              revision: 1,
              status: "pending",
              createdAt: time,
              updatedAt: time,
              moderationReasons: [],
            },
      );
      item.created = true;
      item.baseline = (await item.ref.get()).data();
    }
    profile = await mkdtemp(join(tmpdir(), "crm031-studio-"));
    context = await chromium.launchPersistentContext(profile, {
      channel: "chromium",
      headless: true,
      viewport: { width: mode === "native200" ? 1440 : mode, height: 1000 },
    });
    const page = await context.newPage();
    const requestGeneration = generation();
    page.on("request", (r) => {
      observeActualRead(r, requestGeneration);
      const url = new URL(r.url());
      if (
        r.method() === "POST" &&
        url.pathname.includes("demo-satsunicgo/") &&
        url.pathname.endsWith("/currentAskConversation")
      ) {
        observeGuardedAsk(r, requestGeneration);
        return;
      }
      if (
        r.method() === "POST" &&
        url.pathname.includes("demo-satsunicgo/") &&
        ![
          ...orderReads,
          "studioRead",
          "studioAdvancedRead",
          "studioMediaRead",
          "blogCommentList",
        ].includes(url.pathname.split("/").pop() ?? "")
      ) {
        preserveGeneration();
        forbidden.push(url.pathname.split("/").pop() ?? "unknown");
      }
    });
    await page.goto("chrome://settings/appearance");
    await page
      .locator("select#zoomLevel")
      .selectOption({ label: mode === "native200" ? "200%" : "100%" });
    await page.goto("http://127.0.0.1:5187/account");
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("owner");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    const route =
      name === "studio-dashboard"
        ? `?q=${studioSearchTokens(id)[1]}`
        : name === "studio-comments"
          ? "/comments?status=pending"
          : name === "studio-preview"
            ? `/${id}/preview`
            : `/${id}`;
    await verifyGuardedAsk();
    await page.goto(`http://127.0.0.1:5187/crm/studio${route}`);
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(
      mode === "native200" ? 719 : mode,
    );
    expect(dimensions.width).toBeLessThanOrEqual(
      mode === "native200" ? 721 : mode,
    );
    expect(dimensions.ratio).toBeCloseTo(mode === "native200" ? 2 : 1, 1);
    if (name === "studio-dashboard") {
      const row = page.locator(".post-table tbody tr").filter({
        has: page.locator(`a.post-title[href='/crm/studio/${id}']`),
      });
      const link = row.locator("a.post-title");
      await expect(link).toBeVisible();
      await link.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(link).toBeFocused();
    } else if (name === "studio-comments") {
      const row = page
        .locator("button.mod-item")
        .filter({ hasText: commentId });
      await expect(row).toBeVisible();
      await row.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByText(commentId, { exact: true }).last(),
      ).toBeVisible();
    } else if (name === "studio-preview") {
      await expect(page.locator(".article-body")).toContainText(
        "Synthetic CRM031 keyboard content",
      );
      const back = page
        .getByRole("link")
        .filter({ hasText: "Tiếp tục viết" })
        .first();
      await expect(back).toBeVisible();
      await back.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(back).toBeFocused();
    } else {
      const title = page.getByRole("textbox", { name: "Tiêu đề", exact: true });
      await expect(title).toHaveValue(id);
      await title.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(title).toBeFocused();
      await expect(
        page.getByRole("textbox", { name: "Nội dung bài viết", exact: true }),
      ).toContainText("Synthetic CRM031 keyboard content");
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await verifyGuardedAsk();
    await context.close();
    context = undefined;
    expect(forbidden).toEqual([]);
    for (const item of ledger)
      expect((await item.ref.get()).data()).toEqual(item.baseline);
  } catch (error) {
    primaryFailure = error;
    throw error;
  } finally {
    try {
      await context?.close();
    } finally {
      if (profile) await rm(profile, { recursive: true, force: true });
    }
    await verifyGuardedAsk(primaryFailure);
    for (const item of ledger)
      if (item.created) {
        const unchanged =
          forbidden.length === 0 &&
          isDeepStrictEqual((await item.ref.get()).data(), item.baseline);
        expect(
          unchanged,
          "Preserve owned Studio evidence on drift or consequential calls",
        ).toBe(true);
        if (unchanged) {
          await item.ref.delete();
          expect((await item.ref.get()).exists).toBe(false);
        }
      }
  }
}

async function staticProbe(name: string, mode: (typeof modes)[number]) {
  let profile: string | undefined, context: BrowserContext | undefined;
  const forbidden: string[] = [];
  let primaryFailure: unknown;
  try {
    profile = await mkdtemp(join(tmpdir(), "crm031-static-"));
    context = await chromium.launchPersistentContext(profile, {
      channel: "chromium",
      headless: true,
      viewport: { width: mode === "native200" ? 1440 : mode, height: 1000 },
    });
    const page = await context.newPage();
    const requestGeneration = generation();
    page.on("request", (r) => {
      observeActualRead(r, requestGeneration);
      const url = new URL(r.url());
      if (
        r.method() === "POST" &&
        url.pathname.includes("demo-satsunicgo/") &&
        url.pathname.endsWith("/currentAskConversation")
      ) {
        observeGuardedAsk(r, requestGeneration);
        return;
      }
      if (r.method() !== "POST" || !url.pathname.includes("demo-satsunicgo/"))
        return;
      const endpoint = url.pathname.split("/").pop() ?? "unknown";
      // shippingRates read/write share endpoint; only the actual read action is safe.
      let read = [
        ...orderReads,
        "operationalDashboard",
        "studioRead",
        "studioAdvancedRead",
        "shippingRatesPublic",
      ].includes(endpoint);
      if (endpoint === "shippingRatesAdmin") {
        try {
          read = r.postDataJSON()?.data?.action === "read";
        } catch {
          read = false;
        }
      }
      if (!read) {
        preserveGeneration();
        forbidden.push(endpoint);
      }
    });
    await page.goto("chrome://settings/appearance");
    await page
      .locator("select#zoomLevel")
      .selectOption({ label: mode === "native200" ? "200%" : "100%" });
    await page.goto("http://127.0.0.1:5187/account");
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("owner");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    await verifyGuardedAsk();
    await page.goto(
      `http://127.0.0.1:5187/crm/${name.replace("studio-", "studio/")}`,
    );
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(
      mode === "native200" ? 719 : mode,
    );
    expect(dimensions.width).toBeLessThanOrEqual(
      mode === "native200" ? 721 : mode,
    );
    expect(dimensions.ratio).toBeCloseTo(mode === "native200" ? 2 : 1, 1);
    const heading =
      name === "settings"
        ? "Cấu hình"
        : name === "shipping-rates"
          ? "Cấu hình cước vận chuyển"
          : name === "studio-settings"
            ? "Cài đặt"
            : name === "studio-account"
              ? "Tài khoản"
              : "Tổng quan vận hành";
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    if (name === "shipping-rates")
      await waitActualRead(
        page,
        "shippingRatesAdmin",
        "read",
        0,
        "Tải lại bảng giá",
      );
    if (name === "settings")
      await waitActualRead(page, "readOwnerConfiguration");
    const control =
      name === "settings"
        ? page
            .locator("summary")
            .filter({ hasText: "Chính sách tỷ giá và điều khoản" })
        : name === "studio-settings"
          ? page
              .getByRole("navigation", { name: "Các mục cài đặt", exact: true })
              .getByRole("button", { name: "Tác giả", exact: true })
          : name === "studio-account"
            ? page.getByRole("link", { name: "Mở Studio", exact: true })
            : name === "shipping-rates"
              ? page.getByRole("button", {
                  name: "Tải lại bảng giá",
                  exact: true,
                })
              : page
                  .locator(
                    ".workspaceContent :is(select,input,button,a):visible",
                  )
                  .first();
    if (name === "settings") {
      await control.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("textbox", {
          name: "Phiên bản điều khoản",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", {
          name: "Phiên bản điều khoản",
          exact: true,
        }),
      ).toBeEnabled();
    }
    await expect(control).toBeVisible();
    expect(
      await control.evaluate(
        (el) =>
          !!(
            el.getAttribute("aria-label") ||
            (el instanceof HTMLInputElement || el instanceof HTMLSelectElement
              ? el.labels?.[0]?.textContent
              : el.textContent)
          )?.trim(),
      ),
    ).toBe(true);
    await control.focus();
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement)) return false;
        const r = el.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.height > 0 &&
          r.left >= 0 &&
          r.right <= innerWidth + 1 &&
          r.top >= 0 &&
          r.bottom <= innerHeight + 1
        );
      }),
    ).toBe(true);
    await page.keyboard.press("Shift+Tab");
    await expect(control).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await verifyGuardedAsk();
    await context.close();
    expect(forbidden).toEqual([]);
  } catch (error) {
    primaryFailure = error;
    throw error;
  } finally {
    try {
      await context?.close();
      await verifyGuardedAsk(primaryFailure);
    } finally {
      if (profile) await rm(profile, { recursive: true, force: true });
    }
  }
}

async function recordsProbe(name: string, mode: (typeof modes)[number]) {
  const id = `crm031-${randomUUID()}`,
    uid = `e2e005-customer-${randomUUID()}`;
  const userContext = ["customers", "follow-ups", "staff"].includes(name);
  const order = createCatalogOrder(
    {
      title: id,
      slug: id,
      status: "published",
      market: "US",
      version: 1,
      orderable: true,
      listedPrice: 240000,
      termsVersion: "synthetic-crm031",
    },
    { productId: id, productVersion: 1, quantity: 1 },
    { id, ownerId: operator, now: Date.now() },
  );
  const now = Date.now();
  const definitions: [string, Record<string, unknown>][] = userContext
    ? [
        [
          `users/${uid}`,
          {
            ownerId: uid,
            displayName: id,
            searchName: id.toLowerCase(),
            locked: false,
            version: 1,
          },
        ],
        [
          name === "staff" ? `staffAccess/${uid}` : `crmCustomers/${uid}`,
          name === "staff"
            ? { active: true, locked: false, roles: ["SUPPORT"], version: 1 }
            : {
                version: 1,
                tags: ["Synthetic CRM031"],
                notes: "Synthetic CRM031 notes",
                assigneeId: operator,
                followUpAt: 1,
              },
        ],
      ]
    : name === "documents"
      ? [
          [
            `salesDocuments/${id}`,
            {
              ...documentSnapshot(
                order,
                {
                  name: "Synthetic CRM031 seller",
                  address: "Synthetic CRM031 address",
                  contact: "example.invalid",
                },
                "Synthetic CRM031 buyer",
              ),
              id,
              ownerId: operator,
              sourceOrderId: id,
              sourceVersion: 1,
              version: 1,
              state: "issued",
              kind: "internal_statement",
              currency: "VND",
              sellerVersion: 1,
              createdAt: now,
              changedAt: now,
              issuedAt: now,
              issueNumber: id,
              shareEpoch: 0,
            },
          ],
        ]
      : name === "changes"
        ? [
            [
              `orderChanges/${id}`,
              {
                id,
                ownerId: operator,
                orderId: id,
                state: "accepted",
                createdAt: now - 1000,
                reviewedAt: now,
                proposal: {
                  kind: "cancellation",
                  reason: id,
                  termsVersion: "synthetic-crm031",
                  finalPayable: 0,
                  actualCosts: 0,
                  lines: [{ line: 0, cancelQuantity: 1 }],
                },
              },
            ],
          ]
        : name === "support"
          ? [
              [
                `supportTickets/${id}`,
                {
                  ownerId: operator,
                  subject: id,
                  message: "Synthetic CRM031 request",
                  status: "open",
                  version: 1,
                  createdAt: now,
                },
              ],
            ]
          : name === "content"
            ? [
                [
                  `products/${id}`,
                  {
                    id,
                    title: id,
                    slug: id,
                    body: "Synthetic CRM031 draft",
                    status: "draft",
                    market: "US",
                    version: 1,
                    orderable: false,
                    createdAt: now,
                  },
                ],
              ]
            : name === "activity"
              ? [
                  [
                    `outboxJobs/${id}`,
                    {
                      ownerId: operator,
                      action: "invoiceIssued",
                      createdAt: now,
                      state: "inAppDelivered",
                      emailState: "unknown",
                      reconciliationRequired: true,
                      version: 1,
                    },
                  ],
                ]
              : [
                  [
                    `packages/${id}`,
                    {
                      id,
                      version: 1,
                      state: "packed",
                      allocations: [{ orderId: id, line: 0, quantity: 1 }],
                      warehouse: "Synthetic CRM031 warehouse",
                      route: "US-VN",
                      weightGrams: 1500,
                    },
                  ],
                  [
                    `consolidationBatches/${id}`,
                    {
                      id,
                      version: 1,
                      state: "sealed",
                      parcelIds: [id],
                      orderIds: [id],
                      freight: 120000,
                      shares: { [id]: 120000 },
                      warehouse: "Synthetic CRM031 warehouse",
                      route: "US-VN",
                      hub: "Synthetic CRM031 hub",
                      service: "Synthetic CRM031 service",
                      cutoff: now + 3600000,
                    },
                  ],
                ];
  // Entire immutable resource set registered before setup, including Auth UID.
  const ledger = definitions.map(([path, data]) => ({
    ref: db.doc(path),
    data,
    created: false,
    baseline: undefined as unknown,
  }));
  const authClient = getAuth(getApp("release021-browser"));
  let authCreated = false,
    authBaseline: unknown;
  let profile: string | undefined, context: BrowserContext | undefined;
  const forbidden: string[] = [];
  const preparation = (async () => {
    if (userContext) {
      await trackedAuthCreate(uid, {
        email: `${uid}@satsunicgo.example.invalid`,
        emailVerified: true,
      });
      authCreated = true;
      authBaseline = (await authClient.getUser(uid)).toJSON();
    }
    for (const item of ledger) {
      await trackedCreate(item.ref, item.data);
      item.created = true;
      item.baseline = (await item.ref.get()).data();
    }
  })();
  // Rejection handler attached immediately; finally drains setup before cleanup.
  const drained = preparation.then(
    () => undefined,
    () => undefined,
  );
  let primaryFailure: unknown;
  try {
    await preparation;
    profile = await mkdtemp(join(tmpdir(), "crm031-records-"));
    context = await chromium.launchPersistentContext(profile, {
      channel: "chromium",
      headless: true,
      viewport: { width: mode === "native200" ? 1440 : mode, height: 1000 },
    });
    const page = await context.newPage();
    const requestGeneration = generation();
    page.on("request", (r) => {
      observeActualRead(r, requestGeneration);
      const url = new URL(r.url());
      if (
        r.method() === "POST" &&
        url.pathname.includes("demo-satsunicgo/") &&
        url.pathname.endsWith("/currentAskConversation")
      ) {
        observeGuardedAsk(r, requestGeneration);
        return;
      }
      if (
        r.method() === "POST" &&
        url.pathname.includes("demo-satsunicgo/") &&
        ![
          ...orderReads,
          "invoiceList",
          "invoiceDetail",
          "ticketMessages",
          "listCustomers",
          "listFollowUps",
          "listCrmStaff",
          "readCustomer",
        ].includes(url.pathname.split("/").pop() ?? "")
      ) {
        preserveGeneration();
        forbidden.push(url.pathname.split("/").pop() ?? "unknown");
      }
    });
    await page.goto("chrome://settings/appearance");
    await page
      .locator("select#zoomLevel")
      .selectOption({ label: mode === "native200" ? "200%" : "100%" });
    await page.goto("http://127.0.0.1:5187/account");
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("owner");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    await verifyGuardedAsk();
    await page.goto(
      `http://127.0.0.1:5187/crm/${name}${name === "documents" ? `?order=${id}` : name === "support" ? `?ticket=${id}` : ""}`,
    );
    const recordKind =
      name === "shipping"
        ? "packages"
        : name === "content"
          ? "products"
          : name === "changes"
            ? "orderChanges"
            : name === "activity"
              ? "auditEvents"
              : "";
    if (recordKind)
      await waitActualRead(
        page,
        "listWork",
        recordKind,
        0,
        name === "shipping"
          ? "Tải lại kiện"
          : name === "content"
            ? "Tải lại danh sách"
            : undefined,
      );
    if (name === "shipping")
      await waitActualRead(
        page,
        "listWork",
        "consolidationBatches",
        0,
        "Tải lại lô gom",
      );
    if (name === "follow-ups")
      await waitActualRead(page, "listFollowUps", "", 0, "Tải lại");
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(
      mode === "native200" ? 719 : mode,
    );
    expect(dimensions.width).toBeLessThanOrEqual(
      mode === "native200" ? 721 : mode,
    );
    expect(dimensions.ratio).toBeCloseTo(mode === "native200" ? 2 : 1, 1);
    let anchor: import("@playwright/test").Locator;
    if (name === "staff") {
      await page
        .getByRole("textbox", { name: "Định danh nhân viên", exact: true })
        .fill(uid);
      await page
        .getByRole("button", { name: "Kiểm tra quyền hiện tại", exact: true })
        .click();
      await expect(page.getByText(uid, { exact: true })).toBeVisible();
      anchor = page.locator('input[name="role"]').first();
      await expect(page.locator('input[name="locked"]')).not.toBeChecked();
    } else if (name === "customers" || name === "follow-ups") {
      if (name === "customers") {
        await page
          .getByRole("combobox", { name: "Tìm theo", exact: true })
          .selectOption("id");
        await page
          .getByRole("textbox", { name: "Mã khách hàng", exact: true })
          .fill(uid);
        await page
          .getByRole("button", { name: "Tìm khách hàng", exact: true })
          .click();
      }
      const row = page
        .getByRole("row")
        .filter({ has: page.getByRole("link", { name: id, exact: true }) });
      for (let n = 0; n < 20 && (await row.count()) === 0; n++) {
        const next = page.getByRole("button", {
          name: "Trang tiếp theo",
          exact: true,
        });
        if (!(await next.isVisible())) break;
        const before = readCount("listFollowUps");
        await next.click();
        await waitActualRead(page, "listFollowUps", "", before, "Tải lại");
      }
      await expect(row).toBeVisible();
      await expect(row.locator("time")).toHaveAttribute(
        "datetime",
        new Date(1).toISOString(),
      );
      anchor = row.getByRole("link", { name: id, exact: true });
    } else if (name === "support") {
      anchor = page.getByRole("textbox", { name: "Phản hồi", exact: true });
      await expect(anchor).toBeVisible();
    } else {
      if (name === "activity")
        await page
          .getByRole("group", { name: "Nhóm nhật ký", exact: true })
          .getByRole("button", { name: "Thông báo", exact: true })
          .click();
      const row =
        name === "activity"
          ? page.getByRole("row").filter({ hasText: id })
          : name === "content"
            ? page.locator("button.contentRow").filter({ hasText: id })
            : name === "documents"
              ? page.locator(".documentList article").filter({ hasText: id })
              : name === "shipping"
                ? page.locator("article.crmItem").filter({
                    hasText: id,
                    has: page.getByRole("heading", {
                      name: "Kiện hàng",
                      exact: true,
                    }),
                  })
                : page
                    .locator("article.crmItem")
                    .filter({ hasText: id })
                    .first();
      for (let n = 0; n < 20 && (await row.count()) === 0; n++) {
        const next = page.getByRole("button", {
          name:
            name === "changes"
              ? "Xem thêm đề xuất"
              : name === "content"
                ? "Xem thêm nội dung"
                : name === "shipping"
                  ? "Trang kiện sau"
                  : "Trang tiếp theo",
          exact: true,
        });
        if (!(await next.isVisible()) || !(await next.isEnabled())) break;
        const before = readCount("listWork", recordKind);
        await next.click();
        await waitActualRead(
          page,
          "listWork",
          recordKind,
          before,
          name === "shipping" ? "Tải lại kiện" : undefined,
        );
      }
      await expect(row).toBeVisible();
      if (name === "documents") {
        await row
          .getByRole("button", { name: "Mở chứng từ", exact: true })
          .click();
        await expect(page.locator(".salesStatement")).toContainText(id);
        anchor = page.getByRole("link", {
          name: "Mở đơn và số dư hiện tại",
          exact: true,
        });
      } else if (name === "content") {
        await row.click();
        anchor = page.getByRole("textbox", { name: "Tiêu đề", exact: true });
        await expect(anchor).toHaveValue(id);
      } else {
        const label =
          name === "activity"
            ? "Ghi nhận đối soát"
            : name === "changes"
              ? "Chi tiết thay đổi"
              : "Hàng trong kiện";
        await row.getByText(label, { exact: true }).click();
        anchor = row.locator("summary").filter({ hasText: label });
        if (name === "changes")
          await expect(row).toContainText("Khách đã duyệt");
      }
    }
    if (name === "shipping") {
      const batch = page.locator("article.crmItem").filter({
        hasText: id,
        has: page.getByRole("heading", { name: "Lô gom", exact: true }),
      });
      for (let n = 0; n < 20 && (await batch.count()) === 0; n++) {
        const next = page.getByRole("button", {
          name: "Trang lô sau",
          exact: true,
        });
        if (!(await next.isEnabled())) break;
        const before = readCount("listWork", "consolidationBatches");
        await next.click();
        await waitActualRead(
          page,
          "listWork",
          "consolidationBatches",
          before,
          "Tải lại lô gom",
        );
      }
      await expect(batch).toContainText("Chờ bàn giao");
      await batch.getByText("Chi tiết phân bổ cước", { exact: true }).click();
      await expect(batch).toContainText("120.000");
      await batch.getByText("Bàn giao toàn bộ lô", { exact: true }).click();
      await expect(batch.locator('input[name="carrier"]')).toBeVisible();
      expect(
        await batch.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
    }
    await expect(anchor).toBeVisible();
    await anchor.focus();
    await page.keyboard.press("Tab");
    if (["customers", "follow-ups"].includes(name)) {
      const row = anchor.locator("xpath=ancestor::tr");
      const disclosure = row
        .locator("summary")
        .filter({ hasText: "Mã khách hàng" });
      await expect(disclosure).toBeFocused();
      await visibleControl(disclosure);
      await page.keyboard.press("Enter");
      await expect(row.locator("code")).toHaveText(uid);
    }
    expect(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement)) return false;
        const r = el.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.height > 0 &&
          r.left >= 0 &&
          r.right <= innerWidth + 1 &&
          r.top >= 0 &&
          r.bottom <= innerHeight + 1
        );
      }),
    ).toBe(true);
    await page.keyboard.press("Shift+Tab");
    await expect(anchor).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await verifyGuardedAsk();
    await context.close();
    context = undefined;
    expect(forbidden).toEqual([]);
    for (const item of ledger)
      expect((await item.ref.get()).data()).toEqual(item.baseline);
    if (authCreated)
      expect((await authClient.getUser(uid)).toJSON()).toEqual(authBaseline);
  } catch (error) {
    primaryFailure = error;
    throw error;
  } finally {
    await drained;
    try {
      await context?.close();
    } finally {
      if (profile) await rm(profile, { recursive: true, force: true });
    }
    await verifyGuardedAsk(primaryFailure);
    let safe = forbidden.length === 0;
    for (const item of ledger)
      if (
        item.created &&
        !isDeepStrictEqual((await item.ref.get()).data(), item.baseline)
      )
        safe = false;
    expect(safe, "Preserve owned record evidence on mutation/drift").toBe(true);
    if (safe) {
      for (const item of ledger)
        if (item.created) {
          await item.ref.delete();
          expect((await item.ref.get()).exists).toBe(false);
        }
      if (authCreated) {
        await authClient.deleteUser(uid);
        await expect(authClient.getUser(uid)).rejects.toMatchObject({
          code: "auth/user-not-found",
        });
      }
    }
  }
}

for (const name of contexts)
  for (const mode of modes) {
    test(`CRM031 ${name} ${mode} keyboard and browser zoom`, async ({
      browserName,
    }, info) => {
      if (
        [
          "studio-dashboard",
          "studio-editor",
          "studio-preview",
          "studio-comments",
        ].includes(name)
      ) {
        await studioProbe(name, mode);
        return;
      }
      if (
        [
          "overview",
          "settings",
          "shipping-rates",
          "studio-settings",
          "studio-account",
        ].includes(name)
      ) {
        await staticProbe(name, mode);
        info.annotations.push({
          type: "scope",
          description:
            "Static labels and keyboard controls only; singleton values and aggregate data unowned and not captured",
        });
        return;
      }
      if (
        [
          "documents",
          "changes",
          "support",
          "content",
          "activity",
          "customers",
          "follow-ups",
          "staff",
          "shipping",
        ].includes(name)
      ) {
        await recordsProbe(name, mode);
        return;
      }
      expect(browserName).toBe("chromium");
      const orderLike = ["orders", "purchasing", "warehouse"].includes(name);
      const start = performance.now();
      const id =
        name === "membership"
          ? `0-crm031-plan-${randomUUID()}`
          : `crm031-${randomUUID()}`;
      // Immutable exact ledger exists before creation; no prefix query cleanup.
      const collection =
        name === "returns"
          ? "orderReturns"
          : name === "refunds"
            ? "refunds"
            : name === "finance"
              ? "paymentExceptions"
              : name === "campaigns"
                ? "campaigns"
                : name === "membership"
                  ? "membershipPlans"
                  : "orders";
      const path = `${collection}/${id}`;
      const ref = db.doc(path);
      const noticeRef =
        name === "finance" ? db.doc(`transferReviews/${id}`) : undefined;
      let noticeCreated = false,
        noticeBaseline: unknown;
      let created = false,
        unchanged = false,
        baseline: unknown;
      let profile: string | undefined, context: BrowserContext | undefined;
      const forbidden: { endpoint: string; action: string }[] = [];
      let primaryFailure: unknown;
      try {
        const data =
          name === "campaigns"
            ? {
                title: id,
                caption: "Synthetic CRM031 caption",
                path: "/posts/synthetic031",
                source: "fixture",
                medium: "manual",
                campaign: "synthetic031",
                status: "draft",
                socialPosting: "disabled",
                version: 1,
              }
            : name === "membership"
              ? {
                  name: "PLUS",
                  price: 100000,
                  periodDays: 7,
                  serviceDiscountBps: 500,
                  discountCap: 10000,
                  status: "draft",
                  version: 1,
                }
              : name === "returns"
                ? {
                    id,
                    orderId: id,
                    version: 1,
                    state: "receiving",
                    lines: [
                      {
                        line: 0,
                        name: "Synthetic CRM031 return",
                        authorized: 4,
                        received: 3,
                        accepted: 2,
                        damaged: 1,
                      },
                    ],
                  }
                : name === "refunds"
                  ? {
                      id,
                      orderId: id,
                      amount: 240000,
                      reason: "Synthetic CRM031 pending request",
                      state: "pending",
                    }
                  : name === "finance"
                    ? {
                        id,
                        amount: 240000,
                        state: "open",
                        reason: "Synthetic CRM031 unverified exception",
                        inboundVerified: false,
                      }
                    : createCatalogOrder(
                        {
                          title: `Synthetic CRM031 ${id}`,
                          slug: id,
                          status: "published",
                          market: "US",
                          version: 1,
                          orderable: true,
                          listedPrice: 240000,
                          termsVersion: "synthetic-crm031",
                        },
                        { productId: id, productVersion: 1, quantity: 1 },
                        { id, ownerId: operator, now: Date.now() },
                      );
        if (name === "purchasing") Object.assign(data, { collected: 240000 });
        if (name === "warehouse")
          Object.assign(data, {
            stage: "ORIGIN_RECEIVED",
            collected: 240000,
            purchasedQuantity: 1,
            receivedQuantity: 1,
          });
        await trackedCreate(ref, data);
        created = true;
        baseline = (await ref.get()).data();
        if (noticeRef) {
          await trackedCreate(noticeRef, {
            reference: "Synthetic CRM031 local notice",
            amount: 240000,
            ownerId: operator,
            orderId: id,
            status: "pending",
            createdAt: Date.now(),
          });
          noticeCreated = true;
          noticeBaseline = (await noticeRef.get()).data();
        }
        profile = await mkdtemp(join(tmpdir(), "crm031-"));
        context = await chromium.launchPersistentContext(profile, {
          channel: "chromium",
          headless: true,
          viewport: { width: mode === "native200" ? 1440 : mode, height: 1000 },
        });
        const page = await context.newPage();
        const requestGeneration = generation();
        page.on("request", (request) => {
          observeActualRead(request, requestGeneration);
          const url = new URL(request.url());
          if (
            request.method() === "POST" &&
            url.pathname.includes("demo-satsunicgo/") &&
            url.pathname.endsWith("/currentAskConversation")
          ) {
            observeGuardedAsk(request, requestGeneration);
            return;
          }
          if (
            request.method() !== "POST" ||
            !url.pathname.includes("demo-satsunicgo/")
          )
            return;
          // App functions emulator URLs contain the demo project and region.
          if (!url.pathname.includes("demo-satsunicgo/")) return;
          const endpoint = url.pathname.split("/").pop() ?? "unknown";
          if (endpoint === "membershipReminderPolicy" && provenRead(request))
            return;
          if (!orderReads.has(endpoint)) {
            let action = "unclassified";
            try {
              action = String(request.postDataJSON()?.data?.action ?? action);
            } catch {
              /* no raw payload logging */
            }
            preserveGeneration();
            forbidden.push({ endpoint, action });
          }
        });
        await page.goto("chrome://settings/appearance");
        await page
          .locator("select#zoomLevel")
          .selectOption({ label: mode === "native200" ? "200%" : "100%" });
        await page.goto("http://127.0.0.1:5187/account");
        await page
          .getByRole("combobox", { name: "Vai trò thử", exact: true })
          .selectOption("owner");
        await page
          .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: /Tài khoản của/ }),
        ).toBeVisible();
        await verifyGuardedAsk();
        await page.goto(
          `http://127.0.0.1:5187/crm/${name}${orderLike ? `?order=${id}` : ""}`,
        );
        const readyLabel =
          name === "returns" || name === "refunds"
            ? "Tải lại"
            : name === "campaigns"
              ? "Tải lại danh sách"
              : name === "membership"
                ? undefined
                : name === "finance"
                  ? "Ngoại lệ"
                  : undefined;
        await waitActualRead(page, "listWork", collection, 0, readyLabel);
        if (name === "membership") {
          await waitActualRead(page, "membershipReminderPolicy", "read");
          await expect(
            page.getByText("Đang tải gói thành viên…", { exact: true }),
          ).toBeHidden();
        }
        if (name === "finance")
          await page
            .getByRole("group", { name: "Nhóm đối soát", exact: true })
            .getByRole("button", { name: "Ngoại lệ", exact: true })
            .click();
        const detail = orderLike
          ? page.locator(".crmWorkbenchDetail028")
          : name === "finance"
            ? page
                .getByRole("heading", {
                  name: "Ngoại lệ thanh toán",
                  exact: true,
                })
                .locator("xpath=parent::section")
                .locator("article.crmItem")
                .filter({ hasText: id })
            : page.locator("article.crmItem").filter({ hasText: id });
        if (orderLike)
          await expect(detail.locator("h2")).toHaveText(
            `Synthetic CRM031 ${id}`,
          );
        else {
          const next = page.getByRole("button", {
            name:
              name === "finance"
                ? "Trang ngoại lệ tiếp theo"
                : "Trang tiếp theo",
            exact: true,
          });
          for (let n = 0; n < 20 && (await detail.count()) === 0; n++) {
            if (!(await next.isVisible())) break;
            const before = readCount("listWork", collection);
            await next.click();
            await waitActualRead(
              page,
              "listWork",
              collection,
              before,
              readyLabel,
            );
          }
          await expect(detail).toBeVisible();
          if (["campaigns", "membership"].includes(name)) {
            await detail
              .getByRole("button", {
                name: name === "campaigns" ? "Chỉnh sửa" : "Chỉnh sửa gói",
                exact: true,
              })
              .click();
            await expect(
              page.locator("summary").filter({
                hasText:
                  name === "campaigns"
                    ? "Chỉnh sửa chiến dịch"
                    : "Chỉnh sửa gói",
              }),
            ).toBeFocused();
          } else {
            if (name === "returns") {
              await detail
                .getByText("Thông tin hồ sơ", { exact: true })
                .click();
              await expect(
                detail.locator("code").filter({ hasText: id }),
              ).toHaveCount(2);
              await detail
                .getByText("Chi tiết số lượng", { exact: true })
                .click();
              await expect(detail).toContainText("3 / 4");
              await expect(detail).toContainText("3 / 3");
            }
            const label =
              name === "returns"
                ? "Xử lý hàng trả"
                : name === "refunds"
                  ? "Xử lý yêu cầu"
                  : "Đối soát ngoại lệ";
            await detail.getByText(label, { exact: true }).click();
            await expect(detail.locator("form")).toBeVisible();
          }
        }
        const dimensions = await page.evaluate(() => ({
          width: innerWidth,
          ratio: devicePixelRatio,
        }));
        expect(dimensions.width).toBeGreaterThanOrEqual(
          mode === "native200" ? 719 : mode,
        );
        expect(dimensions.width).toBeLessThanOrEqual(
          mode === "native200" ? 721 : mode,
        );
        expect(dimensions.ratio).toBeCloseTo(mode === "native200" ? 2 : 1, 1);
        if (name === "orders") {
          await expect(
            detail.getByRole("button", {
              name: "Nhận việc mua hàng",
              exact: true,
            }),
          ).toBeDisabled();
          await expect(
            detail.getByText(
              "Chưa đủ tiền để mua hàng. Đơn niêm yết cần thanh toán toàn bộ.",
              { exact: true },
            ),
          ).toBeVisible();
        }
        if (name === "refunds") {
          await expect(detail).toContainText(
            "Chờ hoàn · tiền chưa được xác nhận ra",
          );
          await expect(detail).toContainText("240.000");
        }
        if (name === "finance") {
          await expect(
            detail.locator('select[name="action"] option'),
          ).toHaveCount(1);
          await expect(
            detail.locator('[name="orderId"], [name="amount"], [name="bank"]'),
          ).toHaveCount(0);
        }
        const action =
          name === "campaigns"
            ? page.getByRole("textbox", { name: "Caption", exact: true })
            : name === "membership"
              ? page.getByLabel("Giá trả trước (₫)", { exact: true })
              : orderLike
                ? detail.getByRole("combobox", {
                    name: "Thao tác",
                    exact: true,
                  })
                : detail.locator(
                    `form [name="${name === "returns" ? "evidence" : name === "refunds" ? "bank" : "reason"}"]`,
                  );
        await action.focus();
        await expect(action).toBeFocused();
        await page.keyboard.press("Tab");
        expect(
          await page.evaluate(() => {
            const el = document.activeElement;
            if (!(el instanceof HTMLElement)) return false;
            const r = el.getBoundingClientRect();
            return (
              r.width > 0 &&
              r.height > 0 &&
              r.left >= 0 &&
              r.right <= innerWidth + 1 &&
              r.top >= 0 &&
              r.bottom <= innerHeight + 1
            );
          }),
        ).toBe(true);
        await page.keyboard.press("Shift+Tab");
        await expect(action).toBeFocused();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
        expect(
          await detail.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        ).toBe(true);
        if (name === "finance") {
          await page
            .getByRole("group", { name: "Nhóm đối soát", exact: true })
            .getByRole("button", { name: "Chuyển khoản", exact: true })
            .click();
          const notice = page
            .getByRole("heading", {
              name: "Thông báo chuyển khoản",
              exact: true,
            })
            .locator("xpath=parent::section")
            .locator("article.crmItem")
            .filter({ hasText: id });
          for (let n = 0; n < 20 && (await notice.count()) === 0; n++) {
            const next = page.getByRole("button", {
              name: "Trang chuyển khoản tiếp theo",
              exact: true,
            });
            if (!(await next.isVisible())) break;
            const before = readCount("listWork", "transferReviews");
            await next.click();
            await waitActualRead(
              page,
              "listWork",
              "transferReviews",
              before,
              "Chuyển khoản",
            );
          }
          await expect(notice).toContainText(
            "Thông báo chưa phải tiền đã xác nhận.",
          );
          await notice
            .getByText("Đối chiếu giao dịch ngân hàng", { exact: true })
            .click();
          const bank = notice.locator('input[name="bank"]');
          await bank.focus();
          await page.keyboard.press("Tab");
          await expect(
            notice.locator('textarea[name="evidence"]'),
          ).toBeFocused();
          await page.keyboard.press("Shift+Tab");
          await expect(bank).toBeFocused();
          expect(
            await notice.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          ).toBe(true);
        }
        await verifyGuardedAsk();
        await context.close();
        context = undefined;
        expect(
          forbidden,
          "Unclassified or consequential callable observed",
        ).toEqual([]);
        expect((await ref.get()).data()).toEqual(baseline);
        if (noticeCreated && noticeRef)
          expect((await noticeRef.get()).data()).toEqual(noticeBaseline);
        unchanged = true;
        info.annotations.push({
          type: "evidence",
          description:
            "Owned orders only; actual local reads, keyboard traversal and genuine zoom. No screenshot or screen reader certification.",
        });
      } catch (error) {
        primaryFailure = error;
        throw error;
      } finally {
        try {
          await context?.close();
        } finally {
          if (profile) await rm(profile, { recursive: true, force: true });
        }
        await verifyGuardedAsk(primaryFailure);
        if (created && forbidden.length === 0) {
          const current = await ref.get();
          if (
            baseline !== undefined &&
            isDeepStrictEqual(current.data(), baseline) &&
            (!noticeCreated ||
              (noticeRef &&
                isDeepStrictEqual(
                  (await noticeRef.get()).data(),
                  noticeBaseline,
                )))
          ) {
            unchanged = true;
            await ref.delete();
            expect((await ref.get()).exists).toBe(false);
            if (noticeCreated && noticeRef) {
              await noticeRef.delete();
              expect((await noticeRef.get()).exists).toBe(false);
            }
          }
        }
        if (created && !unchanged)
          expect(
            unchanged,
            "CRM031 owned evidence preserved: mutation or drift; cleanup incomplete",
          ).toBe(true);
        console.info(
          JSON.stringify({
            diagnostic: "CRM031",
            context: name,
            mode,
            elapsedMs: Math.round(performance.now() - start),
            forbiddenCalls: forbidden.length,
            cleanupComplete: unchanged,
          }),
        );
      }
    });
  }
