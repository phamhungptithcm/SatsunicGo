import { test, expect, type Page, type Request } from "@playwright/test";
import { z } from "zod";
import { OwnedAskFixture } from "./ask-integration-owned049";
import { closeFixtures, db } from "./fixtures";
import { artifactDirectory } from "./artifact-path";

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
function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((r, fail) => {
    resolve = r;
    reject = fail;
  });
  void promise.catch(() => {}); // Immediate handler; consumers still receive the actual rejection.
  return { promise, resolve, reject };
}
async function holdRealTracking(page: Page, fixture: OwnedAskFixture) {
  const fetched = deferred(),
    release = deferred(),
    finished = deferred();
  let held = false;
  await page.route("**/customerOrderTracking", async (route) => {
    if (route.request().method() !== "POST" || held) {
      await route.continue();
      return;
    }
    held = true;
    try {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      fetched.resolve();
      await release.promise;
      await route.fulfill({ response });
      finished.resolve();
    } catch (error) {
      fetched.reject(error);
      // This exact endpoint is source-verified pure read. Completion is settlement,
      // not success: fetched still rejects and the journal records failed delivery.
      finished.resolve();
    }
  });
  let removal: Promise<void> | null = null;
  const drain = () => {
    if (removal) return removal;
    removal = (async () => {
      release.resolve();
      if (held) await withinDeadline(finished.promise, 5000);
      // Closing the page is not proof of upstream cancellation. Settlement was awaited above.
      if (!page.isClosed()) await page.unroute("**/customerOrderTracking");
    })();
    void removal.catch(() => {});
    return removal;
  };
  fixture.registerDrain(drain);
  return { fetched, release, finished, drain };
}
for (const width of [390, 768, 1440])
  test(`ASK049 owned tracking, catalog and fees retained in one turn at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const { fixture, product } = await setup();
    const dialog = await open(page, fixture);
    const before = await fixture.fingerprint();
    const calls = capture(page);
    try {
      await send(
        page,
        `mã đơn ${fixture.orderId} đến đâu rồi, tìm ${fixture.keyword} và phí gửi từ Mỹ về Việt Nam`,
      );
      await expect(
        dialog.getByRole("region", { name: "Theo dõi đơn hàng", exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("link", { name: product.title, exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("region", {
          name: "Tính cước trong chat",
          exact: true,
        }),
      ).toBeVisible();
      expect(await fixture.fingerprint()).toEqual(before);
      expect(calls.writes).toEqual([]);
      expect(calls.ask).toEqual([]);
      expect(
        await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      ).toBe(true);
      await page.screenshot({
        path: `${artifactDirectory}/ask049-mixed-${width}.png`,
      });
    } finally {
      calls.stop();
    }
  });
test("ASK049 composing Enter waits; completed Enter sends one owned lookup", async ({
  page,
}) => {
  const { fixture } = await setup();
  const dialog = await open(page, fixture),
    calls = capture(page),
    input = textbox(page);
  const before = await fixture.fingerprint();
  const raw = `ma don ${fixture.orderId}.`;
  try {
    await input.fill(raw);
    await input.dispatchEvent("compositionstart", { data: "đ" });
    await input.dispatchEvent("keydown", {
      key: "Enter",
      code: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    await expect(input).toHaveValue(raw);
    expect(
      calls.reads.filter((x) => x === "customerOrderTracking"),
    ).toHaveLength(0);
    await input.dispatchEvent("compositionend", { data: "đ" });
    await input.press("Enter");
    await expect(page.getByRole("dialog", { name: "SatsunicGo", exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("region", { name: "Theo dõi đơn hàng", exact: true }),
    ).toBeVisible();
    expect(
      calls.reads.filter((x) => x === "customerOrderTracking"),
    ).toHaveLength(1);
    expect(calls.writes).toEqual([]);
    expect(calls.ask).toEqual([]);
    expect(await fixture.fingerprint()).toEqual(before);
  } finally {
    calls.stop();
  }
});
test("ASK049 busy Enter sends new draft and late previous lookup cannot take over", async ({
  page,
}) => {
  const { fixture, product } = await setup();
  const dialog = await open(page, fixture),
    gate = await holdRealTracking(page, fixture),
    calls = capture(page);
  const before = await fixture.fingerprint();
  try {
    await send(page, `mã đơn ${fixture.orderId}`);
    await gate.fetched.promise;
    await send(page, `tìm ${fixture.keyword}`);
    await expect(
      dialog.getByRole("link", { name: product.title, exact: true }),
    ).toBeVisible();
    gate.release.resolve();
    await gate.finished.promise;
    await expect(
      dialog.getByRole("region", { name: "Theo dõi đơn hàng", exact: true }),
    ).toHaveCount(0);
    await expect(textbox(page)).toHaveValue("");
    expect(calls.writes).toEqual([]);
    expect(calls.ask).toEqual([]);
    expect(await fixture.fingerprint()).toEqual(before);
  } finally {
    calls.stop();
    await gate.drain();
  }
});
test("ASK049 explicit Stop suppresses late actual tracking and preserves next draft", async ({
  page,
}) => {
  const { fixture } = await setup();
  const dialog = await open(page, fixture),
    gate = await holdRealTracking(page, fixture),
    calls = capture(page);
  const before = await fixture.fingerprint();
  try {
    await send(page, `mã đơn ${fixture.orderId}`);
    await gate.fetched.promise;
    await dialog
      .getByRole("button", { name: "Dừng câu trả lời", exact: true })
      .click();
    await textbox(page).fill("tìm kem dưỡng ẩm");
    gate.release.resolve();
    await gate.finished.promise;
    await expect(textbox(page)).toHaveValue("tìm kem dưỡng ẩm");
    await expect(
      dialog.getByRole("region", { name: "Theo dõi đơn hàng", exact: true }),
    ).toHaveCount(0);
    expect(calls.writes).toEqual([]);
    expect(calls.ask).toEqual([]);
    expect(await fixture.fingerprint()).toEqual(before);
  } finally {
    calls.stop();
    await gate.drain();
  }
});
test("ASK049 A→B→A account switches reject late A lookup and keep owned contexts", async ({
  page,
}) => {
  const a = await setup(),
    b = await setup();
  await open(page, a.fixture);
  const beforeA = await a.fixture.fingerprint(),
    beforeB = await b.fixture.fingerprint();
  const gate = await holdRealTracking(page, a.fixture),
    calls = capture(page);
  try {
    await send(page, `mã đơn ${a.fixture.orderId}`);
    await gate.fetched.promise;
    calls.pause();
    const dialogB = await open(page, b.fixture);
    calls.resume();
    gate.release.resolve();
    await gate.finished.promise;
    await expect(dialogB).not.toContainText(a.fixture.orderId);
    await expect(
      dialogB.getByRole("link", { name: "Mở đơn đang tra cứu", exact: true }),
    ).toHaveCount(0);
    await send(page, `mã đơn ${b.fixture.orderId}`);
    await expect(
      dialogB.getByRole("link", { name: "Mở đơn đang tra cứu", exact: true }),
    ).toHaveAttribute("href", `/account/orders/${b.fixture.orderId}`);
    calls.pause();
    const dialogA = await open(page, a.fixture);
    calls.resume();
    await expect(dialogA).not.toContainText(b.fixture.orderId);
    await send(page, `mã đơn ${a.fixture.orderId}`);
    await expect(
      dialogA.getByRole("link", { name: "Mở đơn đang tra cứu", exact: true }),
    ).toHaveAttribute("href", `/account/orders/${a.fixture.orderId}`);
    expect(await a.fixture.fingerprint()).toEqual(beforeA);
    expect(await b.fixture.fingerprint()).toEqual(beforeB);
    expect(calls.writes).toEqual([]);
    expect(calls.ask).toEqual([]);
    expect(
      (await db.doc(`askCurrent/${b.fixture.uid}`).get()).data()
        ?.conversationId,
    ).toBe(b.fixture.conversationId);
  } finally {
    calls.stop();
    await gate.drain();
  }
});
// Browser composition dispatch tests handler mechanics; actual OS/device IME remains NOT_RUN separately.

for (const goal of ["tracking", "catalog", "fees"] as const)
  test(`ASK049 standalone owned ${goal} read has no command or Ask-provider transport`, async ({
    page,
  }) => {
    const { fixture, product } = await setup();
    const dialog = await open(page, fixture);
    const before = await fixture.fingerprint(),
      calls = capture(page);
    try {
      if (goal === "tracking") {
        await send(page, `ma don ${fixture.orderId}.`);
        await expect(
          dialog.getByRole("link", {
            name: "Mở đơn đang tra cứu",
            exact: true,
          }),
        ).toHaveAttribute("href", `/account/orders/${fixture.orderId}`);
      }
      if (goal === "catalog") {
        await send(page, `tìm ${fixture.keyword}`);
        await expect(
          dialog.getByRole("link", { name: product.title, exact: true }),
        ).toBeVisible();
        await expect(
          dialog.getByRole("listitem").filter({
            has: page.getByRole("link", {
              name: product.title,
              exact: true,
            }),
          }),
        ).toContainText("120.000");
      }
      if (goal === "fees") {
        await send(page, "giá gửi hàng từ Việt Nam sang Mỹ 1kg");
        const calculator = dialog.getByRole("region", {
          name: "Tính cước trong chat",
          exact: true,
        });
        await expect(calculator).toBeVisible();
        await expect(
          calculator.getByRole("spinbutton", {
            name: "Khối lượng tính cước (kg)",
            exact: true,
          }),
        ).toHaveValue("1");
        await expect(calculator).toContainText("Việt Nam → Mỹ");
      }
      expect(await fixture.fingerprint()).toEqual(before);
      expect(calls.writes).toEqual([]);
      expect(calls.ask).toEqual([]);
    } finally {
      calls.stop();
    }
  });

test("ASK049 failed real fee transport preserves independent product result and offers retry", async ({
  page,
}) => {
  const { fixture, product } = await setup();
  const dialog = await open(page, fixture),
    before = await fixture.fingerprint(),
    calls = capture(page);
  let faults = 0;
  await page.route("**/shippingRatesPublic", async (route) => {
    if (route.request().method() === "POST") {
      faults++;
      await route.abort("failed");
    } else await route.continue();
  });
  const drain = async () => {
    if (!page.isClosed()) await page.unroute("**/shippingRatesPublic");
  };
  fixture.registerDrain(drain);
  try {
    await send(page, `tìm ${fixture.keyword} và phí gửi từ Mỹ về Việt Nam`);
    await expect(
      dialog.getByRole("link", { name: product.title, exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Tra cứu lại các thông tin", exact: true }),
    ).toBeVisible();
    expect(faults, "fee transport fault must actually execute").toBeGreaterThan(
      0,
    );
    await drain();
    await dialog.getByRole("button", { name: "Tra cứu lại các thông tin", exact: true }).click();
    const recovered = dialog.getByRole("region", {
      name: `tìm ${fixture.keyword} và phí gửi từ Mỹ về Việt Nam`, exact: true,
    }).last();
    await expect(recovered.getByRole("link", { name: product.title, exact: true })).toBeVisible();
    await expect(recovered.getByRole("region", { name: "Tính cước trong chat", exact: true })).toBeVisible();
    await expect(recovered.getByRole("alert")).toHaveCount(0);
    expect(await fixture.fingerprint()).toEqual(before);
    expect(calls.writes).toEqual([]);
    expect(calls.ask).toEqual([]);
  } finally {
    calls.stop();
    await drain();
  }
});

/** Private candidate. Unknown/write RPC outcomes preserve the fixture. Source-verified pure reads may fail without mutation uncertainty. */
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
async function withinDeadline<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw Error("INVALID_DEADLINE");
  const handled = handledOperation(operation);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const outcome = await Promise.race([
      handled,
      new Promise<Outcome<T>>((resolve) => {
        timer = setTimeout(() => resolve({status: "failed", error: Error("OPERATION_DEADLINE_UNCERTAIN")}), milliseconds);
      }),
    ]);
    if (outcome.status === "failed") throw outcome.error;
    return outcome.value;
  } finally { if (timer !== undefined) clearTimeout(timer); }
}

test("ASK054 actual SDK A→B→A changes fence a held read without closing Ask", async ({ page }, info) => {
  const a = await setup(), b = await setup();
  await open(page, a.fixture);
  const beforeA = await a.fixture.fingerprint(), beforeB = await b.fixture.fingerprint();
  const gate = await holdRealTracking(page, a.fixture), calls = capture(page);
  const identityReceipts: Array<Awaited<ReturnType<OwnedAskFixture["switchActorWithoutClosingAsk"]>>> = [];
  const switchTo = async (fixture: OwnedAskFixture) => {
    calls.pause();
    const restored = handledOperation(page.waitForResponse(async (response) => {
      if (response.request().method() !== "POST" ||
          !new URL(response.url()).pathname.endsWith("/currentAskConversation")) return false;
      try {
        const body = await response.json();
        return (body.result ?? body.data)?.conversationId === fixture.conversationId;
      } catch { return false; }
    }));
    const receipt = await fixture.switchActorWithoutClosingAsk(page);
    identityReceipts.push(receipt);
    expect(receipt.uid).toBe(fixture.uid);
    expect(receipt.provider).toBe("google.com");
    expect(receipt.emailVerified).toBe(true);
    expect(receipt.states).toContain(null);
    expect(receipt.states.at(-1)).toBe(fixture.uid);
    expect(receipt.after).toEqual(receipt.before);
    expect((await requireAcknowledged(restored)).ok()).toBe(true);
    await expect(page.getByRole("button", {name: `Tài khoản của Owned Ask fixture ${fixture.runId}`, exact: true})).toBeVisible();
    // App keys Ask by UID and remounts collapsed on /account. Normal reopening
    // does not invoke close/Stop or mutate React identity; the original response remains held.
    if (!(await textbox(page).isVisible()))
      await page.getByRole("button", {name:"Hỏi SatsunicGo",exact:true}).click();
    await expect(textbox(page)).toBeEnabled();
    calls.resume();
  };
  try {
    await send(page, `mã đơn ${a.fixture.orderId}`);
    await gate.fetched.promise;
    await textbox(page).fill("bản nháp chỉ của A");
    await switchTo(b.fixture);
    await expect(textbox(page)).toHaveValue("");
    const container = page.getByRole("dialog", {name:"SatsunicGo",exact:true})
      .or(page.getByRole("complementary", {name:"Hỏi SatsunicGo",exact:true})).filter({visible:true}).first();
    await expect(container).not.toContainText(a.fixture.orderId);
    await expect(container.getByRole("link", {name:"Mở đơn đang tra cứu",exact:true})).toHaveCount(0);
    await send(page, `mã đơn ${b.fixture.orderId}`);
    await expect(container.getByRole("link", {name:"Mở đơn đang tra cứu",exact:true})).toHaveAttribute("href",`/account/orders/${b.fixture.orderId}`);
    await textbox(page).fill("bản nháp chỉ của B");
    await switchTo(a.fixture);
    await expect(textbox(page)).toHaveValue("");
    await expect(container).not.toContainText(b.fixture.orderId);
    const freshQuestion = `ma don ${a.fixture.orderId}.`;
    await send(page, freshQuestion);
    await expect(container.getByRole("link", {name:"Mở đơn đang tra cứu",exact:true})).toHaveAttribute("href",`/account/orders/${a.fixture.orderId}`);
    await textbox(page).fill("bản nháp mới của A");
    // Return to the SAME UID/CID before oldA settles; identity equality alone cannot be a fence.
    gate.release.resolve();
    await gate.finished.promise;
    await expect(container.getByRole("region", {name:`mã đơn ${a.fixture.orderId}`,exact:true})).toHaveCount(0);
    await expect(container.getByRole("region", {name:freshQuestion,exact:true})).toBeVisible();
    await expect(container.getByRole("link", {name:"Mở đơn đang tra cứu",exact:true})).toHaveCount(1);
    await expect(textbox(page)).toHaveValue("bản nháp mới của A");
    expect(identityReceipts[0].states[0]).toBe(a.fixture.uid);
    expect(identityReceipts[1].states[0]).toBe(b.fixture.uid);
    expect(identityReceipts[0].before).toEqual(identityReceipts[1].after);
    expect(await a.fixture.fingerprint()).toEqual(beforeA);
    expect(await b.fixture.fingerprint()).toEqual(beforeB);
    expect(calls.writes).toEqual([]);
    expect(calls.ask).toEqual([]);
  } catch (error) {
    for (const fixture of owned) fixture.preserve();
    throw error;
  } finally {
    await info.attach("actual-auth-emulator-state-receipts", {body:JSON.stringify(identityReceipts),contentType:"application/json"});
    calls.stop();
    await gate.drain();
  }
});
