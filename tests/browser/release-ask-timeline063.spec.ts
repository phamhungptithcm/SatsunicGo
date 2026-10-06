/** PRIVATE candidate only. Root owns native execution. Source-bound057 capture/cleanup helpers unchanged. */
import { chromium } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test, expect, type Page, type Request, type BrowserContext, type Locator } from "@playwright/test";
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
const fixtureOperations=new WeakMap<OwnedAskFixture,CapturedFixtureOperations>();
async function setup() {
  const fixture = new OwnedAskFixture();
  owned.push(fixture);
  const cohort=[...owned];
  const operations=new CapturedFixtureOperations(()=>{for(const member of cohort)member.preserve();});
  fixtureOperations.set(fixture,operations);
  // Drain registered synchronously before deferred setup can issue any SDK I/O.
  fixture.registerDrain(async()=>{await operations.drain();});
  const product = await operations.capture("fixture setup",()=>fixture.setup());
  return { fixture, product, operations };
}
async function open(page: Page, fixture: OwnedAskFixture, diagnoseComposer?: () => Promise<void>) {
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
  let readinessFailed = false;
  let readinessError: unknown;
  try {
    await expect(textbox(page)).toBeEnabled();
  } catch (error) {
    readinessFailed = true;
    readinessError = error;
  }
  let diagnosticFailed = false;
  let diagnosticError: unknown;
  if (diagnoseComposer) {
    try { await diagnoseComposer(); }
    catch (error) { diagnosticFailed = true; diagnosticError = error; }
  }
  if (readinessFailed) throw readinessError;
  if (diagnosticFailed) throw diagnosticError;
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
function noEffects(calls: ReturnType<typeof capture>) {
  expect(calls.writes).toEqual([]);
  expect(calls.ask).toEqual([]);
}

async function assertTimelineGeometry(timeline: Locator, language: "vi" | "en", info: import("@playwright/test").TestInfo) {
  const expectedLabels = language === "en"
    ? ["Request", "Full payment", "Purchase", "Warehouse & packing", "Shipping", "Delivery"]
    : ["Yêu cầu", "Thanh toán toàn bộ", "Mua hàng", "Kho & đóng gói", "Vận chuyển", "Giao hàng"];
  const statuses = language === "en"
    ? ["Previous step", "Previous step", "Previous step", "Previous step", "Current step", "Upcoming"]
    : ["Đã qua bước này", "Đã qua bước này", "Đã qua bước này", "Đã qua bước này", "Bước hiện tại", "Chưa đến bước này"];
  const list = timeline.getByRole("list", { name: language === "en" ? "Processing steps" : "Các bước xử lý", exact: true });
  await expect(list).toBeVisible();
  const rows = list.getByRole("listitem");
  await expect(rows).toHaveCount(6);
  await expect(rows.locator(".orderTrackingStepLabel")).toHaveText(expectedLabels);
  await expect(rows.locator(".orderTrackingStepStatus")).toHaveText(statuses);
  await expect(list.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(list.locator('[aria-current="step"] .orderTrackingStepLabel')).toHaveText(expectedLabels[4]);
  await expect(list.locator('[aria-current="step"] .orderTrackingStepStatus')).toHaveText(statuses[4]);
  await expect(list.locator('[aria-current="step"]')).toHaveAttribute("data-state", "current");
  await expect(timeline.getByText(language === "en"
    ? "No confirmed delivery estimate is available." : "Chưa có thời gian giao dự kiến được xác nhận.", { exact: true })).toBeVisible();
  // Real layout/font completion, not a sleep or CSS-only approximation.
  await list.evaluate(async () => { await document.fonts.ready; await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); });
  const measurements = [];
  for (let index = 0; index < 6; index++) {
    const row = rows.nth(index);
    await row.scrollIntoViewIfNeeded();
    await row.evaluate(async element=>{
      element.scrollIntoView({block:"center",inline:"nearest",behavior:"instant"});
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    });
    const fit=await row.evaluate(element=>{
      const measure=(node:Element)=>{
        const r=node.getBoundingClientRect(),style=getComputedStyle(node);
        return {tag:node.tagName,role:node.getAttribute("role"),rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right},clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,overflowX:style.overflowX,overflowY:style.overflowY,paddingTop:style.paddingTop,paddingBottom:style.paddingBottom,paddingInlineStart:style.paddingInlineStart,paddingInlineEnd:style.paddingInlineEnd,fontSize:style.fontSize,lineHeight:style.lineHeight};
      };
      const ancestors=[];let parent=element.parentElement;
      for(let depth=0;parent&&depth<10;depth++,parent=parent.parentElement)ancestors.push(measure(parent));
      const dialog=element.closest('[role="dialog"]');
      return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},card:measure(element),ancestors,dialog:dialog?measure(dialog):null,dialogFirstChild:dialog?.firstElementChild?measure(dialog.firstElementChild):null,dialogLastChild:dialog?.lastElementChild?measure(dialog.lastElementChild):null};
    });
    await info.attach(`actual-card-fit-before-ratio-${index}`,{body:JSON.stringify(fit),contentType:"application/json"});
    await expect(row).toBeInViewport({ ratio: 1 });
    const metrics = await row.evaluate((element) => {
      const icon = element.querySelector<HTMLElement>(".orderTrackingStepIcon");
      const content = element.querySelector<HTMLElement>(".orderTrackingStepContent");
      const label = element.querySelector<HTMLElement>(".orderTrackingStepLabel");
      const status = element.querySelector<HTMLElement>(".orderTrackingStepStatus");
      const panel = element.closest<HTMLElement>(".orderTracking");
      if (!icon || !content || !label || !status || !panel) throw Error("MISSING_TIMELINE_HIERARCHY");
      const rect = (node: Element) => { const b = node.getBoundingClientRect(); return { left:b.left, right:b.right, top:b.top, bottom:b.bottom, width:b.width, height:b.height }; };
      const textRects = (node: HTMLElement) => { const range = document.createRange(); range.selectNodeContents(node); return [...range.getClientRects()].map(b => ({left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height})); };
      return { card:rect(element), panel:rect(panel), icon:rect(icon), content:rect(content), label:rect(label), status:rect(status), labelText:label.textContent, statusText:status.textContent, spokenText:(element as HTMLElement).innerText, labelRects:textRects(label), statusRects:textRects(status), iconHidden:icon.getAttribute("aria-hidden"), focusables:element.querySelectorAll('a,button,input,select,textarea,[tabindex]').length, labelStyle:{overflow:getComputedStyle(label).overflow,textOverflow:getComputedStyle(label).textOverflow,whiteSpace:getComputedStyle(label).whiteSpace}, statusStyle:{overflow:getComputedStyle(status).overflow,textOverflow:getComputedStyle(status).textOverflow,whiteSpace:getComputedStyle(status).whiteSpace} };
    });
    expect(metrics.labelText).toBe(expectedLabels[index]);
    expect(metrics.statusText).toBe(statuses[index]);
    expect(metrics.iconHidden).toBe("true");
    expect(metrics.focusables).toBe(0);
    expect(metrics.card.width).toBeGreaterThan(0);
    expect(metrics.label.height).toBeGreaterThan(0);
    expect(metrics.status.height).toBeGreaterThan(0);
    expect(metrics.card.left).toBeGreaterThanOrEqual(metrics.panel.left - 1);
    expect(metrics.card.right).toBeLessThanOrEqual(metrics.panel.right + 1);
    expect(metrics.icon.right + 7).toBeLessThanOrEqual(metrics.content.left + 1);
    expect(metrics.status.top).toBeGreaterThanOrEqual(metrics.label.bottom - 1);
    expect(metrics.spokenText).toContain(expectedLabels[index] + "\n" + statuses[index]);
    expect(metrics.labelRects.length).toBeGreaterThan(0);
    expect(metrics.statusRects.length).toBeGreaterThan(0);
    for (const b of [...metrics.labelRects, ...metrics.statusRects]) {
      expect(b.left).toBeGreaterThanOrEqual(metrics.card.left - 1);
      expect(b.right).toBeLessThanOrEqual(metrics.card.right + 1);
      expect(b.top).toBeGreaterThanOrEqual(metrics.card.top - 1);
      expect(b.bottom).toBeLessThanOrEqual(metrics.card.bottom + 1);
    }
    for (const style of [metrics.labelStyle, metrics.statusStyle]) {
      expect(style.textOverflow).not.toBe("ellipsis");
      expect(style.whiteSpace).not.toBe("nowrap");
      expect(style.overflow).not.toBe("hidden");
    }
    measurements.push(metrics);
  }
  const cards = await rows.evaluateAll(nodes => nodes.map(node => { const b=node.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}; }));
  for (let i=0;i<cards.length;i++) for (let j=i+1;j<cards.length;j++) {
    const a=cards[i],b=cards[j];
    expect(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1).toBe(true);
  }
  await expect(timeline.locator("code").first()).toBeVisible();
  return measurements;
}

for (const width of [390, 768, 1440]) for (const language of ["vi", "en"] as const) for(const zoom of [100,200]) {
  test(`ASK063 timeline ${language} at ${width} native${zoom}`, async ({ page: _defaultPage }, info) => {
    const start=Date.now();
    const history:Array<{phase:string;outcome:"started"|"completed"|"failed";elapsedMs:number}> = [];
    const phase=async <T,>(name:string,operation:()=>Promise<T>):Promise<T>=>{
      history.push({phase:name,outcome:"started",elapsedMs:Date.now()-start});
      try {const value=await test.step(name,operation);history.push({phase:name,outcome:"completed",elapsedMs:Date.now()-start});return value;}
      catch(error){history.push({phase:name,outcome:"failed",elapsedMs:Date.now()-start});throw error;}
    };
    let profile:string|undefined,context:BrowserContext|undefined,operations:CapturedFixtureOperations|undefined;
    try {
      const prepared=await phase("owned fixture setup ACK",()=>setup());
      const {fixture,product}=prepared;operations=prepared.operations;
      profile=await phase("new profile",()=>mkdtemp(join(tmpdir(),"ask063-zoom-")));
      context=await phase("launch native Chromium",()=>chromium.launchPersistentContext(profile!,{channel:"chromium",headless:true,baseURL:"http://127.0.0.1:5187",viewport:{width,height:1000},reducedMotion:"reduce"}));
      const page=await phase("new actual page",()=>context!.newPage());
      const before=await phase("initial owned fingerprint ACK",()=>operations!.capture("initial fingerprint",()=>fixture.fingerprint()));
      const question=language==="en"?englishQuestion(fixture):`mã đơn ${fixture.orderId}, tìm ${fixture.keyword} và phí gửi từ Mỹ về Việt Nam 1kg`;
      await phase(`Chrome native zoom ${zoom}`,async()=>{
        await page.goto("chrome://settings/appearance");
        await page.locator("select#zoomLevel").selectOption({label:`${zoom}%`});
      });
      await phase("actual auth and owned conversation ACK",()=>open(page,fixture,async()=>{
        const geometry=await page.getByRole("textbox").evaluateAll(elements=>{
          const measure=(element:Element)=>{
            const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
            return {rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},display:style.display,visibility:style.visibility,width:style.width,minWidth:style.minWidth,maxWidth:style.maxWidth,flex:style.flex,gap:style.gap,paddingInlineStart:style.paddingInlineStart,paddingInlineEnd:style.paddingInlineEnd,overflowX:style.overflowX};
          };
          return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},textboxes:elements.map(element=>{
            const form=element.closest("form");
            const surface=element.closest('[role="dialog"],aside,[role="complementary"]');
            return {input:measure(element),composer:form?measure(form):null,surface:surface?measure(surface):null,controls:form?Array.from(form.querySelectorAll(":scope > button")).map(measure):[]};
          })};
        });
        await info.attach("actual-composer-geometry-before-readiness-result",{body:JSON.stringify(geometry),contentType:"application/json"});
      }));
      await phase("actual composer containment and DOM keyboard route",async()=>{
        const input=textbox(page);
        const form=input.locator("xpath=..");
        const measured=await form.evaluate(element=>{
          const rect=(node:Element)=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
          const field=element.querySelector('input:not([type="file"])');
          if(!field)throw Error("COMPOSER_INPUT_UNAVAILABLE");
          return {viewport:{width:innerWidth,height:innerHeight},form:rect(element),input:rect(field),controls:Array.from(element.querySelectorAll(":scope > button")).map(rect)};
        });
        expect(measured.input.width).toBeGreaterThanOrEqual(80);
        expect(measured.input.height).toBeGreaterThanOrEqual(44);
        expect(measured.controls).toHaveLength(3);
        expect(measured.form.y).toBeGreaterThanOrEqual(0);
        expect(measured.form.bottom).toBeLessThanOrEqual(measured.viewport.height);
        const boxes=[measured.input,...measured.controls];
        for(const box of boxes){
          expect(box.x).toBeGreaterThanOrEqual(measured.form.x);
          expect(box.right).toBeLessThanOrEqual(measured.form.right);
          expect(box.y).toBeGreaterThanOrEqual(measured.form.y);
          expect(box.bottom).toBeLessThanOrEqual(measured.form.bottom);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.bottom).toBeLessThanOrEqual(measured.viewport.height);
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.right).toBeLessThanOrEqual(measured.viewport.width);
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
        for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
          const a=boxes[i],b=boxes[j];
          expect(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y).toBe(true);
        }
        const attach=form.getByRole("button",{name:"Thêm ảnh sản phẩm",exact:true});
        const close=form.getByRole("button",{name:"Thu gọn Ask SatsunicGo",exact:true});
        await expect(attach).toBeEnabled();
        await expect(close).toBeEnabled();
        await input.focus();await expect(input).toBeFocused();
        await page.keyboard.press("Shift+Tab");await expect(attach).toBeFocused();
        await page.keyboard.press("Tab");await expect(input).toBeFocused();
        await page.keyboard.press("Tab");await expect(close).toBeFocused();
        await page.keyboard.press("Shift+Tab");await expect(input).toBeFocused();
        await info.attach("actual-composer-containment-and-keyboard",{body:JSON.stringify(measured),contentType:"application/json"});
      });
      await phase("send actual mixed question",()=>send(page,question));
      const dialog=page.getByRole("dialog",{name:"SatsunicGo",exact:true});
      const turn=dialog.getByRole("region",{name:question,exact:true}).last();
      const timeline=turn.getByRole("region",{name:language==="en"?"Order tracking":"Theo dõi đơn hàng",exact:true});
      await phase("three actual panels and exact owned ID",async()=>{
        await expect(turn.getByRole("heading",{name:language==="en"?"Your requested information":"Thông tin anh/chị cần",exact:true})).toBeVisible();
        await expect(timeline).toBeVisible();
        await expect(timeline.locator("code").first()).toHaveText(fixture.orderId);
        await expect(turn.getByRole("link",{name:product.title,exact:true})).toBeVisible();
        await expect(turn.getByRole("region",{name:language==="en"?"Shipping calculator in chat":"Tính cước trong chat",exact:true})).toBeVisible();
        await expect(turn.getByRole("alert")).toHaveCount(0);
      });
      const dimensions=await phase("measured native zoom and overflow",async()=>{
        const actual=await page.evaluate(()=>({width:innerWidth,ratio:devicePixelRatio,motion:matchMedia("(prefers-reduced-motion: reduce)").matches,overflow:document.documentElement.scrollWidth>innerWidth+1}));
        expect(actual.width).toBeGreaterThanOrEqual(width/(zoom/100)-1);
        expect(actual.width).toBeLessThanOrEqual(width/(zoom/100)+1);
        expect(actual.ratio).toBeCloseTo(zoom/100,1);
        expect(actual.motion).toBe(true);
        expect(actual.overflow).toBe(false);
        return actual;
      });
      const measured=await phase("six cards complete geometry",()=>assertTimelineGeometry(timeline,language,info));
      const accessibility=await phase("actual Chrome AX tree",()=>assertTimelineAX(page,language));
      await phase("actual keyboard and owned detail URL",async()=>{
        const detail=timeline.getByRole("link",{name:language==="en"?"Open the tracked order":"Mở đơn đang tra cứu",exact:true});
        await detail.focus();
        await expect(detail).toBeFocused();
        await page.keyboard.press("Tab");
        expect(await page.evaluate(()=>Boolean(document.activeElement?.closest(".orderTrackingSteps")))).toBe(false);
        await page.keyboard.press("Shift+Tab");
        await expect(detail).toBeFocused();
        await expect(detail).toHaveAttribute("href",`/account/orders/${encodeURIComponent(fixture.orderId)}`);
      });
      await phase("zero command/provider and final fingerprint ACK",async()=>{
        noEffects(capture(page));
        expect(await operations!.capture("final fingerprint",()=>fixture.fingerprint())).toEqual(before);
      });
      await info.attach(`timeline-${language}-${width}-native${zoom}-geometry`,{body:JSON.stringify({language,width,zoom,dimensions,measured,accessibility,realProvider:"NOT_RUN",actualVoiceOver:"NOT_RUN"}),contentType:"application/json"});
      await phase("first and current full-card screenshots",()=>listFirstCurrentSnapshot(timeline,page,info,`${language}-${width}-${zoom}`));
    } finally {
      operations??=owned.length===1?fixtureOperations.get(owned[0]):undefined;
      const ownedOperations=operations?.snapshot()??{setupAcceptance:"UNKNOWN; inspect pending setup phase and fixture drain receipt"};
      try {
        await info.attach("exact-phase-history-before-close",{body:JSON.stringify({width,language,zoom,history,ownedOperations}),contentType:"application/json"});
      } finally {
      try {
        history.push({phase:"actual profile context close",outcome:"started",elapsedMs:Date.now()-start});
        if(context)await context.close();
        history.push({phase:"actual profile context close",outcome:"completed",elapsedMs:Date.now()-start});
      } finally {
        try {if(profile)await rm(profile,{recursive:true,force:true});}
        finally {await info.attach("exact-phase-history-final",{body:JSON.stringify({width,language,zoom,history,ownedOperations:operations?.snapshot()??null}),contentType:"application/json"});}
      }
      }
    }
  });
}
async function listFirstCurrentSnapshot(timeline:Locator,page:Page,info:import("@playwright/test").TestInfo,label:string){
  for(const [name,row] of [["first",timeline.locator(".orderTrackingSteps > li").first()],["current",timeline.locator('[aria-current="step"]')]] as const){await row.scrollIntoViewIfNeeded();await row.evaluate(async element=>{element.scrollIntoView({block:"center",inline:"nearest",behavior:"instant"});await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});await expect(row).toBeInViewport({ratio:1});await info.attach(`timeline-${label}-${name}`,{body:await page.screenshot(),contentType:"image/png"});}
}

async function assertTimelineAX(page:Page,language:"vi"|"en") {
  // Actual Chrome public DevTools Accessibility tree; not VoiceOver speech proof.
  await expect(page.locator(".orderTrackingSteps")).toHaveCount(1);
  const session=await page.context().newCDPSession(page);
  try {
    const document=await session.send("DOM.getDocument");
    const listDOM=await session.send("DOM.querySelector",{nodeId:document.root.nodeId,selector:".orderTrackingSteps"});
    const currentDOM=await session.send("DOM.querySelector",{nodeId:document.root.nodeId,selector:'.orderTrackingSteps > li[aria-current="step"]'});
    expect(listDOM.nodeId).toBeGreaterThan(0);
    expect(currentDOM.nodeId).toBeGreaterThan(0);
    const listDescription=await session.send("DOM.describeNode",{nodeId:listDOM.nodeId});
    const currentDescription=await session.send("DOM.describeNode",{nodeId:currentDOM.nodeId});
    const tree=await session.send("Accessibility.getFullAXTree");
    type AXNode={nodeId:string;childIds?:string[];backendDOMNodeId?:number;ignored:boolean;role?:{value?:unknown};name?:{value?:unknown};properties?:Array<{name:string;value:{value?:unknown}}>};
    const nodes=tree.nodes as AXNode[];
    const byId=new Map(nodes.map(n=>[n.nodeId,n]));
    const descendants=(node:AXNode):AXNode[]=>{const result:AXNode[]=[];const seen=new Set<string>();const visit=(n:AXNode)=>{if(seen.has(n.nodeId))throw Error("AX_TREE_CYCLE");seen.add(n.nodeId);result.push(n);for(const id of n.childIds??[]){const child=byId.get(id);if(!child)throw Error("AX_CHILD_UNAVAILABLE");visit(child);}};visit(node);return result;};
    const list=nodes.find(n=>n.backendDOMNodeId===listDescription.node.backendNodeId);
    expect(list).toBeDefined();
    if(!list)throw Error("AX_LIST_UNAVAILABLE");
    expect(list.ignored).toBe(false);
    expect(list.role?.value).toBe("list");
    expect(list.name?.value).toBe(language==="en"?"Processing steps":"Các bước xử lý");
    const listNodes=descendants(list);
    const items=listNodes.filter(n=>!n.ignored&&n.role?.value==="listitem");
    expect(items).toHaveLength(6);
    const labels=language==="en"?["Request","Full payment","Purchase","Warehouse & packing","Shipping","Delivery"]:["Yêu cầu","Thanh toán toàn bộ","Mua hàng","Kho & đóng gói","Vận chuyển","Giao hàng"];
    const previous=language==="en"?"Previous step":"Đã qua bước này",currentText=language==="en"?"Current step":"Bước hiện tại",upcoming=language==="en"?"Upcoming":"Chưa đến bước này";
    const expectedStatuses=[previous,previous,previous,previous,currentText,upcoming];
    const exposed=items.map(item=>descendants(item).filter(n=>!n.ignored&&n.role?.value==="StaticText").map(n=>String(n.name?.value??"")).filter(text=>text.trim()));
    for(let index=0;index<6;index++)expect(exposed[index]).toEqual([labels[index],expectedStatuses[index]]);
    expect(listNodes.some(n=>!n.ignored&&["✓","●","○"].includes(String(n.name?.value??"")))).toBe(false);
    const current=items.find(n=>n.backendDOMNodeId===currentDescription.node.backendNodeId);
    expect(current).toBeDefined();
    expect(current?.nodeId).toBe(items[4].nodeId);
    const browserCurrentProperties=current?.properties?.filter(property=>/current/i.test(property.name))??[];
    for(const property of browserCurrentProperties)expect(["step",true]).toContain(property.value.value);
    return {role:list.role?.value,name:list.name?.value,itemCount:items.length,orderedText:exposed,currentItemIndex:4,currentDOMBackendNodeBound:true,browserCurrentProperties,currentPropertyExposure:browserCurrentProperties.length?"OBSERVED":"NOT_EXPOSED_BY_CDP; exact DOM aria-current=step plus current AX item/text verified",decorativeGlyphsExposed:false,actualVoiceOver:"NOT_RUN"};
  } finally {await session.detach();}
}

/** Pure SDK-operation journal. Cleanup uncertainty always preserves the entire owned cohort. */
class CapturedFixtureOperations {
  private readonly pending=new Set<Promise<Outcome<unknown>>>();
  private readonly records:Array<{label:string;outcome:"pending"|"acknowledged"|"failed"}> = [];
  private sealed=false;
  private preserved=false;
  constructor(private readonly preserveCohort:()=>void){}
  private quarantine(){this.preserved=true;this.preserveCohort();}
  capture<T>(label:string,operation:()=>Promise<T>):Promise<T>{
    if(this.sealed){this.quarantine();return Promise.reject(Error("SDK_JOURNAL_SEALED"));}
    const record={label,outcome:"pending" as "pending"|"acknowledged"|"failed"};
    this.records.push(record);
    const actual=handledOperation(Promise.resolve().then(()=>{
      if(this.sealed){this.quarantine();throw Error("SDK_JOURNAL_SEALED_BEFORE_START");}
      return operation();
    }));
    this.pending.add(actual);
    void actual.then(outcome=>{record.outcome=outcome.status;this.pending.delete(actual);if(outcome.status==="failed")this.quarantine();});
    return requireAcknowledged(actual);
  }
  async drain(){
    this.sealed=true;
    const captured=[...this.pending];
    if(captured.length)this.quarantine();
    await Promise.all(captured);
    if(this.preserved||this.pending.size)throw Error("SDK_WORK_QUARANTINED");
    return this.snapshot();
  }
  snapshot(){return {sealed:this.sealed,preserved:this.preserved,pending:this.pending.size,records:this.records.map(record=>({...record}))};}
}
