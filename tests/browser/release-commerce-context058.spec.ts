import { deflateSync } from "node:zlib";
import { test, expect, type Page, type Request } from "@playwright/test";
import { z } from "zod";
import { OwnedCommerceFixture058 } from "./owned-commerce058";
import { closeFixtures } from "./fixtures";

let owned: OwnedCommerceFixture058[] = [];
function preserveCohort() { for (const fixture of owned) fixture.preserve(); }
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
      // Finish ALL preflight checks before any document/Auth cleanup starts.
      for (const fixture of owned) {
        try { await fixture.cleanupPreflight(); } catch { preserveCohort(); }
      }
      const receipts = [];
      for (const fixture of owned) {
        try {
          receipts.push({
            ...(await fixture.cleanup()),
            runId: fixture.runId,
            uid: fixture.uid,
            manifest: fixture.manifest(),
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
async function setup(bound = true) {
  const fixture = new OwnedCommerceFixture058(bound, preserveCohort);
  owned.push(fixture);
  try {
    const product = await fixture.setup();
    return { fixture, product };
  } catch (error) { preserveCohort(); throw error; }
}
async function open(page: Page, fixture: OwnedCommerceFixture058) {
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
        "uploadOrderImage",
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
      let actor: OwnedCommerceFixture058 | undefined;
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
  const registered = new Set<OwnedCommerceFixture058>();
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

async function showOwnedRecipient(page: Page, fixture: OwnedCommerceFixture058) {
  await send(page, `mã đơn ${fixture.orderId}`);
  await expect(page.getByText(`Giao đến · ${fixture.recipientName}`, { exact: true })).toBeVisible();
}
async function switchAndReopen(page: Page, fixture: OwnedCommerceFixture058) {
  const restored = handledOperation(page.waitForResponse(response => response.request().method() === "POST" && response.url().endsWith("/currentAskConversation") && response.json().then(body => (body.result ?? body.data)?.conversationId === fixture.conversationId).catch(() => false)));
  await fixture.switchActorWithoutClosingAsk(page);
  const response = await requireAcknowledged(restored); expect(response.ok()).toBe(true);
  const dock = page.getByRole("complementary", { name: "Hỏi SatsunicGo", exact: true });
  const launcher = page.getByRole("button", { name: "Hỏi SatsunicGo", exact: true });
  await expect(dock.or(launcher).filter({ visible: true }).first()).toBeVisible();
  if (!(await dock.isVisible())) await launcher.click();
  await expect(textbox(page)).toBeEnabled();
  await showOwnedRecipient(page, fixture);
}
test("COMMERCE058 actual A B A identity changes replace owned delivery projection", async ({ page }) => {
  const a = await setup(), b = await setup();
  await open(page, a.fixture);
  await showOwnedRecipient(page, a.fixture);
  const beforeA = await a.fixture.fingerprint(), beforeB = await b.fixture.fingerprint(), calls = capture(page);
  await switchAndReopen(page, b.fixture);
  await expect(page.getByText(`Giao đến · ${b.fixture.recipientName}`, { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "SatsunicGo", exact: true })).not.toContainText(a.fixture.recipientName);
  await page.getByText(`Giao đến · ${b.fixture.recipientName}`, { exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra / sửa địa chỉ", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Dùng địa chỉ đã lưu", exact: true }).getByRole("option", { name: new RegExp(b.fixture.recipientName) })).toHaveCount(1);
  await switchAndReopen(page, a.fixture);
  await expect(page.getByText(`Giao đến · ${a.fixture.recipientName}`, { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "SatsunicGo", exact: true })).not.toContainText(b.fixture.recipientName);
  expect(calls.writes).toEqual([]); expect(calls.ask).toEqual([]);
  expect(await a.fixture.fingerprint()).toEqual(beforeA); expect(await b.fixture.fingerprint()).toEqual(beforeB);
});
test("COMMERCE058 owned version-only change resets unsaved recipient fields", async ({ page }, info) => {
  const { fixture } = await setup(); await open(page, fixture); await showOwnedRecipient(page, fixture);
  const calls = capture(page);
  await page.getByText(`Giao đến · ${fixture.recipientName}`, { exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra / sửa địa chỉ", exact: true }).click();
  const unsaved = `Unsaved ${fixture.runId}`;
  await page.getByRole("textbox", { name: "Người nhận", exact: true }).fill(unsaved);
  await expect(page.getByRole("textbox", { name: "Người nhận", exact: true })).toHaveValue(unsaved);
  expect(await fixture.advanceOwnedOrderVersion()).toBe(2);
  await expect(page.getByRole("textbox", { name: "Người nhận", exact: true })).toHaveCount(0);
  await expect(page.getByText(`Giao đến · ${fixture.recipientName}`, { exact: true })).toBeVisible();
  await page.getByText(`Giao đến · ${fixture.recipientName}`, { exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra / sửa địa chỉ", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Người nhận", exact: true })).toHaveValue(fixture.recipientName);
  expect(calls.writes).toEqual([]); expect(calls.ask).toEqual([]);
  await info.attach("declared-version-custody", { body: JSON.stringify(fixture.custody), contentType: "application/json" });
});
function ownedPng059() {
  const chunk = (type: string, data: Buffer) => {
    const name = Buffer.from(type, "ascii"), payload = Buffer.concat([name, data]);
    let crc = 0xffffffff;
    for (const byte of payload) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const length = Buffer.alloc(4), checksum = Buffer.alloc(4);
    length.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, payload, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6; // PNG RGBA8, standard compression/filter, non-interlaced.
  const scanline = Buffer.from([0, 22, 60, 255, 255]); // Filter0 + one opaque royal-blue pixel.
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(scanline)), chunk("IEND", Buffer.alloc(0))]);
}
test("COMMERCE058 no-order local image clears on actual account change without upload", async ({ page }) => {
  const a = await setup(false), b = await setup(false); await open(page, a.fixture);
  const calls = capture(page), beforeA = await a.fixture.fingerprint(), beforeB = await b.fixture.fingerprint();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Thêm ảnh sản phẩm", exact: true }).filter({ visible: true }).click();
  await (await chooser).setFiles({ name: "owned-reference.png", mimeType: "image/png", buffer: ownedPng059() });
  await expect(page.getByRole("img", { name: "Ảnh sản phẩm đã chọn", exact: true })).toBeVisible();
  await b.fixture.switchActorWithoutClosingAsk(page);
  await expect(page.getByRole("img", { name: "Ảnh sản phẩm đã chọn", exact: true })).toHaveCount(0);
  expect(calls.writes).toEqual([]); expect(calls.ask).toEqual([]);
  expect(await a.fixture.fingerprint()).toEqual(beforeA); expect(await b.fixture.fingerprint()).toEqual(beforeB);
});
