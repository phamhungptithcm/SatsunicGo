import { chromium } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test, expect, type Page, type Request, type BrowserContext } from "@playwright/test";
import { z } from "zod";
import { OwnedAskFixture } from "./ask-integration-owned049";
import { closeFixtures } from "./fixtures";

let owned: OwnedAskFixture[] = [];
const observers = new WeakMap<Page, ReturnType<typeof createCapture>>();
function capture(page: Page) {
  let observer = observers.get(page);
  if (!observer) { observer = createCapture(page); observers.set(page, observer); }
  observer.registerFixtures();
  return observer;
}
test.afterEach(async ({ page }, info) => {
  try {
    if (!page.isClosed())
      await info.attach("final-render", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
  } finally {
    try {
      if (!page.isClosed()) await page.close();
    } finally {
      const receipts = [];
      for (const fixture of owned) {
        try {
          receipts.push({
            ...(await fixture.cleanup()),
            runId: fixture.runId,
            uid: fixture.uid,
          });
        } catch {
          receipts.push({
            status: "BLOCKED",
            failures: ["CLEANUP_RECEIPT_UNAVAILABLE"],
            runId: fixture.runId,
            uid: fixture.uid,
            productId: fixture.productId,
            orderId: fixture.orderId,
            conversationId: fixture.conversationId,
          });
        }
      }
      owned = [];
      await info.attach("owned-cleanup", {
        body: JSON.stringify(receipts),
        contentType: "application/json",
      });
      expect(
        receipts.every((r) => r.status === "PASSED"),
        "owned cleanup must complete",
      ).toBe(true);
    }
  }
});
test.afterAll(closeFixtures);
async function setup() {
  const fixture = new OwnedAskFixture();
  owned.push(fixture);
  const product = await fixture.setup();
  return { fixture, product };
}
async function open(page: Page, fixture: OwnedAskFixture) {
  const observer = capture(page);
  observer.pause();
  const restored = handledOperation(page.waitForResponse(async (r) => {
    if (
      r.request().method() !== "POST" ||
      !new URL(r.url()).pathname.endsWith("/currentAskConversation")
    )
      return false;
    try {
      const body = await r.json();
      return (
        (body.result ?? body.data)?.conversationId === fixture.conversationId
      );
    } catch {
      return false;
    }
  }));
  await fixture.login(page);
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  const response = await requireAcknowledged(restored);
  expect(response.ok()).toBe(true);
  const envelope = await response.json();
  expect((envelope.result ?? envelope.data)?.conversationId).toBe(
    fixture.conversationId,
  );
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  const dock = page.getByRole("complementary", { name: "Hỏi SatsunicGo", exact: true });
  const launcher = page.getByRole("button", { name: "Hỏi SatsunicGo", exact: true });
  await expect(dialog.or(dock).or(launcher).filter({ visible: true }).first()).toBeVisible();
  if (!(await dialog.isVisible()) && !(await dock.isVisible())) await launcher.click();
  await expect(dialog.or(dock).filter({ visible: true }).first()).toBeVisible();
  const resume = page.getByRole("button", { name: "Tiếp tục hội thoại", exact: true });
  if (await resume.isVisible()) await resume.click();
  await expect(textbox(page)).toBeEnabled();
  observer.resume();
  return dialog.or(dock).filter({ visible: true }).first();
}
function createCapture(page: Page) {
  let observing = true;
  const setupCalls: string[] = [];
  const reads: string[] = [],
    writes: string[] = [],
    ask: string[] = [];
  const listener = (r: Request) => {
    if (r.method() !== "POST") return;
    const endpoint = new URL(r.url()).pathname.split("/").at(-1)!;
    if (!observing) {
      setupCalls.push(endpoint);
      return;
    }
    if (
      [
        "customerOrderTracking",
        "shippingRatesPublic",
        "currentAskConversation",
        "listAskConversations",
      ].includes(endpoint)
    )
      reads.push(endpoint);
    if (
      [
        "askWorkflow",
        "command",
        "catalogCheckout",
        "createPayment",
        "createPaymentLink",
        "confirmPayment",
        "payosCreatePayment",
        "shippingRatesAdmin",
        "studioCommand",
      ].includes(endpoint)
    )
      writes.push(endpoint);
    if (endpoint === "ask" || /generateContent|countTokens/i.test(endpoint))
      ask.push(endpoint);
  };
  const journal = new RpcJournal();
  const outcomeListener = (request: Request) => {
    if (request.method() !== "POST") return;
    const url = new URL(request.url());
    const firestoreWrite = /\/google\.firestore\.v1\.Firestore\/Write\/channel|:commit$|:batchWrite$/.test(url.pathname);
    const externalFunction = url.hostname.endsWith(".cloudfunctions.net") || /generateContent|countTokens/i.test(url.pathname);
    if (url.origin !== "http://127.0.0.1:5107" &&
        !url.pathname.startsWith("/demo-satsunicgo/") && !firestoreWrite && !externalFunction) return;
    const endpoint = url.pathname.split("/").at(-1)!;
    let data: Record<string, unknown> | null = null;
    try {
      const payload = request.postDataJSON();
      if (payload && typeof payload === "object" && Object.keys(payload).length === 1 &&
          payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) data = payload.data;
    } catch { /* Unknown request remains forbidden. */ }
    const exactTarget = url.origin === "http://127.0.0.1:5107" &&
      url.pathname === `/demo-satsunicgo/asia-southeast1/${endpoint}`;
    const scopedOrder = data && endpoint === "customerOrderTracking" &&
      Object.keys(data).length === 1 && owned.some((fixture) => fixture.orderId === data!.orderId);
    const empty = data && Object.keys(data).length === 0;
    const resume = endpoint === "askWorkflow" && z.object({
      conversationId: z.string().uuid(), operationId: z.string().uuid(),
      expectedVersion: z.literal(1), action: z.literal("resume"), payload: z.object({}).strict(),
    }).strict().safeParse(data).success && owned.some((fixture) => fixture.conversationId === data?.conversationId);
    const candidate = exactTarget && (scopedOrder || resume || (empty && ["shippingRatesPublic", "currentAskConversation"].includes(endpoint)));
    // currentAsk can bootstrap-write: only a matching owned, precreated pointer ACK can pass.
    const classification = candidate ? ["currentAskConversation", "askWorkflow"].includes(endpoint) ? "approved-turn" : "read" : "forbidden";
    const actualResponse = handledOperation(request.response());
    journal.observe(endpoint, classification, actualResponse.then(async (outcome) => {
      const response = outcome.status === "acknowledged" ? outcome.value : null;
      if (classification === "forbidden") return false;
      let actor: OwnedAskFixture | undefined;
      if (endpoint !== "shippingRatesPublic") {
        const authorization = request.headers().authorization;
        if (!authorization?.startsWith("Bearer ")) throw Error("UNBOUND_READ_ACTOR");
        for (const fixture of owned) if (await fixture.verifyActorToken(authorization.slice(7))) { actor = fixture; break; }
        if (!actor || (endpoint === "customerOrderTracking" && data?.orderId !== actor.orderId) ||
            (endpoint === "askWorkflow" && data?.conversationId !== actor.conversationId))
          throw Error("UNBOUND_READ_SCOPE");
      }
      if (!response || !response.ok()) return false;
      const parsed = await handledOperation(response.json());
      if (parsed.status === "failed") return false;
      const envelope: unknown = parsed.value;
      if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) return false;
      const body = envelope as Record<string, unknown>;
      if (body.error || !("result" in body || "data" in body)) return false;
      if (endpoint === "currentAskConversation" && !z.object({conversationId: z.literal(actor!.conversationId)}).strict().safeParse(body.result ?? body.data).success)
        throw Error("BOOTSTRAP_POINTER_MISMATCH");
      if (endpoint === "askWorkflow" && !z.object({version: z.literal(1), outcome: z.literal("no_operation")}).strict().safeParse(body.result ?? body.data).success)
        throw Error("RESUME_OUTCOME_MISMATCH");
      return true;
    }).catch((error: unknown) => {
      // Classification/scope errors are stronger than an ordinary pure-read transport failure.
      for (const fixture of owned) fixture.preserve();
      throw error;
    }));
    if (classification === "forbidden") for (const fixture of owned) fixture.preserve();
  };
  page.on("request", listener);
  page.on("request", outcomeListener);
  const registered = new Set<OwnedAskFixture>();
  const registerFixtures = () => {
    for (const fixture of owned) if (!registered.has(fixture)) {
      registered.add(fixture);
      fixture.registerDrain(async () => {
        const receipt = await journal.drain(5000);
        if (receipt.preserved) { fixture.preserve(); throw Error("RPC_OUTCOME_UNCERTAIN"); }
        page.off("request", listener);
        page.off("request", outcomeListener);
      });
    }
  };
  registerFixtures();
  return {
    registerFixtures,
    reads,
    writes,
    ask,
    setupCalls,
    pause: () => {
      observing = false;
    },
    resume: () => {
      observing = true;
    },
    stop: () => {}, // Observer intentionally survives test-body completion and page close.
  };
}
function textbox(page: Page) {
  return page.getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true }).filter({ visible: true });
}
async function send(page: Page, text: string) {
  await textbox(page).fill(text);
  await textbox(page).press("Enter");
  await expect(page.getByRole("dialog", { name: "SatsunicGo", exact: true })).toBeVisible();
}
type RpcReceipt = {
  endpoint: string;
  classification: "read" | "approved-turn" | "forbidden";
  outcome: "pending" | "acknowledged" | "failed";
};
class RpcJournal {
  private readonly records: RpcReceipt[] = [];
  private readonly pending = new Set<Promise<void>>();
  private sealed = false;
  private unsafe = false;
  observe(endpoint: string, classification: RpcReceipt["classification"], response: Promise<boolean>) {
    if (this.sealed) this.unsafe = true;
    const record: RpcReceipt = { endpoint, classification, outcome: "pending" };
    this.records.push(record);
    if (classification === "forbidden") this.unsafe = true;
    // Both branches attached immediately; a rejected request never escapes as an unhandled rejection.
    const handled = response.then(
      (acknowledged) => {
        record.outcome = acknowledged ? "acknowledged" : "failed";
        if (!acknowledged && classification !== "read") this.unsafe = true;
      },
      () => { record.outcome = "failed"; if (classification !== "read") this.unsafe = true; },
    );
    this.pending.add(handled);
    void handled.then(() => this.pending.delete(handled));
  }
  /** Call only after page close, while the request observer remains attached. */
  async drain(deadlineMs: number) {
    if (!Number.isFinite(deadlineMs) || deadlineMs <= 0) throw Error("INVALID_DRAIN_DEADLINE");
    const deadline = Date.now() + deadlineMs;
    while (this.pending.size) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) { this.unsafe = true; break; }
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = await Promise.race([
        Promise.all([...this.pending]).then(() => false),
        new Promise<boolean>((resolve) => { timer = setTimeout(() => resolve(true), remaining); }),
      ]);
      if (timer !== undefined) clearTimeout(timer);
      if (timedOut) { this.unsafe = true; break; }
    }
    this.sealed = true;
    return this.snapshot();
  }
  snapshot() {
    return {
      preserved: this.unsafe || this.pending.size > 0,
      pending: this.pending.size,
      receipts: this.records.map((record) => ({ ...record })),
    };
  }
}

/** Attach a failure handler at construction time; never treat finally as ACK. */
type Outcome<T> = { status: "acknowledged"; value: T } | { status: "failed"; error: unknown };
function handledOperation<T>(operation: Promise<T>): Promise<Outcome<T>> {
  return operation.then(
    (value) => ({ status: "acknowledged" as const, value }),
    (error: unknown) => ({ status: "failed" as const, error }),
  );
}
async function requireAcknowledged<T>(operation: Promise<Outcome<T>>): Promise<T> {
  const outcome = await operation;
  if (outcome.status === "failed") throw outcome.error;
  return outcome.value;
}
function englishQuestion(fixture: OwnedAskFixture) {
  return `track order ${fixture.orderId}, find ${fixture.keyword} and shipping from USA to Vietnam 1kg`;
}
async function assertEnglishPanels(page: Page, title: string) {
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  await expect(dialog.getByRole("heading", { name: "Your requested information", exact: true })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Order tracking", exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: title, exact: true })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Shipping calculator in chat", exact: true })).toBeVisible();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
}
function noEffects(calls: ReturnType<typeof capture>) {
  expect(calls.writes).toEqual([]);
  expect(calls.ask).toEqual([]);
}
for (const width of [390, 768, 1440]) {
  test(`ASK057 English mixed real panels at ${width}`, async ({ page }, info) => {
    const { fixture, product } = await setup();
    await page.setViewportSize({ width, height: 1000 });
    await open(page, fixture);
    const calls = capture(page), before = await fixture.fingerprint();
    await send(page, englishQuestion(fixture));
    await assertEnglishPanels(page, product.title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    noEffects(calls);
    expect(await fixture.fingerprint()).toEqual(before);
    await info.attach("english-render", { body: await page.screenshot(), contentType: "image/png" });
  });
}

test("ASK057 English native200 zoom reduced motion and keyboard", async ({ page: _defaultPage }, info) => {
  const { fixture, product } = await setup();
  let profile: string | undefined;
  let context: BrowserContext | undefined;
  try {
    profile = await mkdtemp(join(tmpdir(), "ask057-zoom-"));
    context = await chromium.launchPersistentContext(profile, {
      channel: "chromium", headless: true, baseURL: "http://127.0.0.1:5187", viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("chrome://settings/appearance");
    await page.locator("select#zoomLevel").selectOption({ label: "200%" });
    await open(page, fixture);
    const calls = capture(page), before = await fixture.fingerprint();
    await textbox(page).focus();
    await expect(textbox(page)).toBeFocused();
    await textbox(page).press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BUTTON");
    await page.keyboard.press("Shift+Tab");
    await expect(textbox(page)).toBeFocused();
    await send(page, englishQuestion(fixture));
    await assertEnglishPanels(page, product.title);
    const dimensions = await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio, motion: matchMedia("(prefers-reduced-motion: reduce)").matches, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    expect(dimensions.width).toBeGreaterThanOrEqual(719);
    expect(dimensions.width).toBeLessThanOrEqual(721);
    expect(dimensions.ratio).toBeCloseTo(2, 1);
    expect(dimensions.motion).toBe(true);
    expect(dimensions.overflow).toBe(false);
    const productLink = page.getByRole("dialog", { name: "SatsunicGo", exact: true }).getByRole("link", { name: product.title, exact: true });
    await productLink.focus();
    await expect(productLink).toBeFocused();
    noEffects(calls);
    expect(await fixture.fingerprint()).toEqual(before);
    await info.attach("native-zoom-render", { body: await page.screenshot(), contentType: "image/png" });
  } finally {
    try { if (context) await context.close(); }
    finally { if (profile) await rm(profile, { recursive: true, force: true }); }
  }
});

test("ASK057 English declared fee read failure and real retry", async ({ page }) => {
  const { fixture, product } = await setup();
  await open(page, fixture);
  const calls = capture(page), before = await fixture.fingerprint();
  let faults = 0;
  await page.route("**/shippingRatesPublic", async route => {
    if (route.request().method() === "POST") { faults++; await route.abort("failed"); }
    else await route.continue();
  });
  const drain = async () => { if (!page.isClosed()) await page.unroute("**/shippingRatesPublic"); };
  fixture.registerDrain(drain);
  try {
    await send(page, englishQuestion(fixture));
    const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
    await expect(dialog.getByRole("link", { name: product.title, exact: true })).toBeVisible();
    await expect(dialog.getByRole("alert")).toContainText("Shipping rates are unavailable. Freight cannot be confirmed yet.");
    const retry = dialog.getByRole("button", { name: "Retry these lookups", exact: true });
    await expect(retry).toBeEnabled();
    expect(faults).toBeGreaterThan(0);
    await drain();
    await retry.click();
    const latest = dialog.getByRole("region", { name: englishQuestion(fixture), exact: true }).last();
    await expect(latest.getByRole("region", { name: "Shipping calculator in chat", exact: true })).toBeVisible();
    await expect(latest.getByRole("link", { name: product.title, exact: true })).toBeVisible();
    await expect(latest.getByRole("alert")).toHaveCount(0);
    noEffects(calls);
    expect(await fixture.fingerprint()).toEqual(before);
  } finally { await drain(); }
});

test("ASK057 actual offline to online owned read recovery", async ({ page, context }) => {
  const { fixture, product } = await setup();
  await open(page, fixture);
  const calls = capture(page), before = await fixture.fingerprint();
  // Warm actual public product read; callService must reject offline BEFORE private callable dispatch.
  await send(page, `find ${fixture.keyword}`);
  await expect(page.getByRole("link", { name: product.title, exact: true })).toBeVisible();
  const trackingBefore = calls.reads.filter(endpoint => endpoint === "customerOrderTracking").length;
  try {
    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    await send(page, englishQuestion(fixture));
    const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
    await expect(dialog.getByRole("alert").filter({ hasText: "Order tracking is unavailable." })).toBeVisible();
    expect(calls.reads.filter(endpoint => endpoint === "customerOrderTracking").length, "offline guard must prevent new owned tracking RPC").toBe(trackingBefore);
    await expect(dialog.getByRole("button", { name: "Retry these lookups", exact: true })).toBeEnabled();
    await context.setOffline(false);
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
    const acknowledgedTracking = handledOperation(page.waitForResponse(response =>
      response.request().method() === "POST" && response.url().endsWith("/customerOrderTracking") &&
      response.request().postDataJSON()?.data?.orderId === fixture.orderId));
    await dialog.getByRole("button", { name: "Retry these lookups", exact: true }).click();
    const trackingResponse = await requireAcknowledged(acknowledgedTracking);
    expect(trackingResponse.ok()).toBe(true);
    const trackingEnvelope = await trackingResponse.json();
    expect(trackingEnvelope.error).toBeUndefined();
    expect(trackingEnvelope.result ?? trackingEnvelope.data).toBeTruthy();
    expect(calls.reads.filter(endpoint => endpoint === "customerOrderTracking").length).toBe(trackingBefore + 1);
    const latest = dialog.getByRole("region", { name: englishQuestion(fixture), exact: true }).last();
    await expect(latest.getByRole("region", { name: "Order tracking", exact: true })).toBeVisible();
    await expect(latest.getByRole("region", { name: "Shipping calculator in chat", exact: true })).toBeVisible();
    await expect(latest.getByRole("alert")).toHaveCount(0);
    noEffects(calls);
    expect(await fixture.fingerprint()).toEqual(before);
  } finally { await context.setOffline(false); }
});

test("ASK057 signedout mixed keeps public reads and explains private tracking", async ({ page }) => {
  const { fixture, product } = await setup();
  await open(page, fixture);
  const before = await fixture.fingerprint(), calls = capture(page);
  // Normal application logout; never overwrite Auth/currentUser or inject callbacks.
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  if (await dialog.isVisible()) await dialog.getByRole("button", { name: "Đóng hội thoại", exact: true }).click();
  await page.getByRole("button", { name: /^Tài khoản của / }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Tài khoản của / })).toHaveCount(0);
  const launcher = page.getByRole("button", { name: "Hỏi SatsunicGo", exact: true });
  if (await launcher.isVisible()) await launcher.click();
  await send(page, englishQuestion(fixture));
  await expect(dialog.getByText("Sign in with the account that placed the order to track it.", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: product.title, exact: true })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Shipping calculator in chat", exact: true })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Order tracking", exact: true })).toHaveCount(0);
  expect(calls.reads.filter(endpoint => endpoint === "customerOrderTracking")).toEqual([]);
  noEffects(calls);
  expect(await fixture.fingerprint()).toEqual(before);
});
