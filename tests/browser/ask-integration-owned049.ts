// Owned demo-emulator fixture; native execution belongs to integration root.
// Existing fixtures import enforces demo project and exact emulator hosts.
import { db } from "./fixtures";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { randomUUID, createHash } from "node:crypto";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
import { shippingRateConfigSchema } from "../../packages/domain/shipping-rates";
import type { Page } from "@playwright/test";

export class OwnedAskFixture {
  readonly runId = randomUUID();
  readonly keyword =
    "askfixture" +
    this.runId.replace(/-/g, "").replace(/\d/g, (d) => "ghijklmnop"[Number(d)]);
  readonly identity = `customer-${this.runId}`;
  readonly uid = `e2e005-${this.identity}`;
  readonly productId = `ask049-product-${this.runId}`;
  readonly orderId = `ask049-order-${this.runId}`;
  readonly conversationId = randomUUID();
  private readonly docs: string[] = [];
  private actorCreated = false;
  private preserved = false;
  private readonly baselines = new Map<string, string>();
  private actor: OwnedActorProtocol | null = null;
  preserve() { this.preserved = true; }
  async verifyActorToken(token: string) {
    this.assertTarget();
    const decoded = await getAuth(getApp("release021-browser")).verifyIdToken(token);
    return decoded.uid === this.uid && decoded.email_verified === true &&
      decoded.firebase?.sign_in_provider === "google.com";
  }
  private assertTarget() {
    const app = getApp("release021-browser");
    if (app.name !== "release021-browser" || app.options.projectId !== "demo-satsunicgo" ||
        process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
        process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187" ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9197" ||
        process.env.FUNCTIONS_EMULATOR !== "true") throw Error("UNSAFE_FIXTURE_TARGET");
  }
  private before: Awaited<ReturnType<OwnedAskFixture["fingerprint"]>> | null =
    null;
  private readonly drains: Array<() => Promise<void>> = [];
  private closed = false;
  private readonly permitted = new Set<string>();
  constructor() {
    for (const p of [
      `users/${this.uid}`,
      `products/${this.productId}`,
      `orders/${this.orderId}`,
      `askCurrent/${this.uid}`,
      `askConversations/${this.uid}-${this.conversationId}`,
    ])
      this.permitted.add(p);
  }
  private async create(path: string, data: Record<string, unknown>) {
    this.assertTarget();
    if (this.closed || !this.permitted.has(path))
      throw Error("UNOWNED_FIXTURE_PATH");
    // Register before I/O: a rejected/unknown create must be audited during cleanup.
    if ((await db.doc(path).get()).exists) throw Error("FIXTURE_COLLISION");
    this.docs.push(path);
    try {
      await db.doc(path).create({ ...data, __fixtureRunId: this.runId });
      const readback = await db.doc(path).get();
      if (!readback.exists || hash(readback.data()) !== hash({ ...data, __fixtureRunId: this.runId }))
        throw Error("CREATE_READBACK_MISMATCH");
      this.baselines.set(path, hash(readback.data()));
    } catch (error) { this.preserve(); throw error; }
  }
  async setup() {
    const rates = await db.doc("shippingRatePublic/current").get();
    const pricing = await db.doc("settings/pricing").get();
    const payments = await db.doc("settings/payments").get();
    if (
      !rates.exists ||
      !shippingRateConfigSchema.safeParse(rates.data()?.config).success ||
      pricing.data()?.termsVersion !== "synthetic-sanity-v1" ||
      payments.data()?.payosEnabled !== false
    )
      throw Error("BLOCKED_SHARED_PREREQUISITE");
    this.assertTarget();
    const auth = getAuth(getApp("release021-browser"));
    const expected = { uid: this.uid, displayName: `Owned Ask fixture ${this.runId}`,
      email: `${this.identity}@satsunicgo.example.invalid` };
    this.actor = new OwnedActorProtocol(expected, {
      get: async (uid) => { this.assertTarget(); return auth.getUser(uid); },
      create: async (data) => { this.assertTarget(); return auth.createUser(data); },
      link: async (uid) => { this.assertTarget(); await auth.updateUser(uid, {
        providerToLink: { providerId: "google.com", uid, email: expected.email },
      }); },
      remove: async (uid) => { this.assertTarget(); await auth.deleteUser(uid); },
    });
    try { await this.actor.create(); this.actorCreated = true; }
    catch (error) { this.preserve(); throw error; }
    await this.create(`users/${this.uid}`, {
      ownerId: this.uid,
      locked: false,
      version: 1,
    });
    const product = {
      id: this.productId,
      title: `Kem dưỡng ẩm ${this.keyword}`,
      slug: this.productId,
      body: "Synthetic owned native fixture only",
      functions: "Dưỡng ẩm cho da khô",
      status: "published",
      market: "US",
      version: 1,
      orderable: true,
      listedPrice: 120000,
      termsVersion: "synthetic-sanity-v1",
      catalogOptions: ["Large"],
    };
    await this.create(`products/${this.productId}`, product);
    const order = createCatalogOrder(
      product,
      {
        productId: this.productId,
        productVersion: 1,
        quantity: 1,
        variant: "Large",
      },
      { id: this.orderId, ownerId: this.uid, now: Date.now() },
    );
    await this.create(`orders/${this.orderId}`, {
      ...order,
      stage: "IN_TRANSIT",
    });
    await this.create(`askConversations/${this.uid}-${this.conversationId}`, {
      ownerId: this.uid,
      version: 1,
      updatedAt: Date.now(),
      turns: [],
      draft: {},
    });
    await this.create(`askCurrent/${this.uid}`, {
      conversationId: this.conversationId,
    });
    this.before = await this.fingerprint();
    return product;
  }
  async switchActorWithoutClosingAsk(page: Page) {
    this.assertTarget();
    if (this.actor?.state !== "acknowledged" || this.preserved) throw Error("UNACKNOWLEDGED_AUTH_FIXTURE");
    return page.evaluate(async (expected) => {
      if (location.origin !== "http://127.0.0.1:5187") throw Error("UNSAFE_BROWSER_AUTH_ORIGIN");
      const sharedPath = "/src/shared/firebase.ts";
      const sdkPath = "/node_modules/.vite/deps/firebase_auth.js";
      const shared = await import(sharedPath) as { auth: import("firebase/auth").Auth | null; emulatorMode: boolean };
      const sdk = await import(sdkPath) as typeof import("firebase/auth");
      const auth = shared.auth;
      if (location.origin !== "http://127.0.0.1:5187" || !shared.emulatorMode ||
          !auth || auth.app.options.projectId !== "demo-satsunicgo" ||
          auth.emulatorConfig?.protocol !== "http" || auth.emulatorConfig.host !== "127.0.0.1" ||
          auth.emulatorConfig.port !== 9197) throw Error("UNSAFE_BROWSER_AUTH_TARGET");
      const before = { url: location.href, timeOrigin: performance.timeOrigin };
      const states: Array<string | null> = [];
      let unsubscribe = () => {};
      try {
        await new Promise<void>((resolve) => {
          unsubscribe = sdk.onAuthStateChanged(auth, (user) => {
            states.push(user?.uid ?? null);
            resolve();
          });
        });
        await sdk.signOut(auth);
        if (auth.currentUser !== null) throw Error("SIGNOUT_NOT_ACKNOWLEDGED");
        const credential = sdk.GoogleAuthProvider.credential(JSON.stringify({
          sub: expected.uid, email: expected.email, email_verified: true,
        }));
        const session = await sdk.signInWithCredential(auth, credential);
        const token = await session.user.getIdTokenResult();
        if (session.user.uid !== expected.uid || token.signInProvider !== "google.com" ||
            token.claims.email_verified !== true || sdk.getAuth(auth.app).currentUser?.uid !== expected.uid)
          throw Error("EMULATOR_AUTH_RECEIPT_MISMATCH");
        if (before.timeOrigin !== performance.timeOrigin || before.url !== location.href)
          throw Error("AUTH_SWITCH_RELOADED_OR_NAVIGATED");
        return { uid: session.user.uid, provider: token.signInProvider,
          emailVerified: token.claims.email_verified === true, states,
          before, after: { url: location.href, timeOrigin: performance.timeOrigin } };
      } finally { unsubscribe(); }
    }, { uid: this.uid, email: `${this.identity}@satsunicgo.example.invalid` });
  }
  async login(page: Page) {
    if (new URL(page.url()).pathname !== "/account") await page.goto("/account");
    const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
    if (await dialog.isVisible()) {
      await dialog.getByRole("button", { name: "Đóng hội thoại", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
    }
    const account = page.getByRole("button", { name: /^Tài khoản của / });
    if (await account.isVisible()) {
      await account.click();
      await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    }
    const select = page.getByRole("combobox", {
      name: "Vai trò thử",
      exact: true,
    });
    await select.evaluate((element, value) => {
      (element as HTMLSelectElement).add(
        new Option("Synthetic isolated Ask customer", value),
      );
    }, this.identity);
    await select.selectOption(this.identity);
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
  }
  registerDrain(drain: () => Promise<void>) {
    if (this.closed) throw Error("FIXTURE_CLOSED");
    this.drains.push(drain);
  }
  async fingerprint() {
    const orders = await db
      .collection("orders")
      .where("ownerId", "==", this.uid)
      .limit(20)
      .get();
    if (orders.size >= 20) throw Error("PARTIAL_FIXTURE_INVENTORY");
    const entries = orders.docs
      .map((d) => ({ id: d.id, hash: hash(d.data()) }))
      .sort((a, b) => a.id.localeCompare(b.id));
    const scope = [
      db.doc(`orders/${this.orderId}`).collection("timeline"),
      db.doc(`orders/${this.orderId}`).collection("operations"),
      db.collection("financialEntries").where("orderId", "==", this.orderId),
      db.collection("paymentRequests").where("orderId", "==", this.orderId),
      db.collection("auditEvents").where("resourceId", "==", this.orderId),
      db.collection("outboxJobs").where("ownerId", "==", this.uid),
    ];
    const ledger = [];
    for (const query of scope) {
      const result = await query.limit(20).get();
      if (result.size >= 20) throw Error("PARTIAL_FIXTURE_LEDGER");
      ledger.push(
        result.docs
          .map((d) => ({ path: d.ref.path, hash: hash(d.data()) }))
          .sort((a, b) => a.path.localeCompare(b.path)),
      );
    }
    return { count: entries.length, entries, ledger };
  }
  async cleanup() {
    this.closed = true;
    const failures: string[] = [];
    for (const drain of this.drains) {
      try {
        await withinDeadline(drain(), 5000);
      } catch {
        failures.push("PENDING_WORK_NOT_DRAINED");
      }
    }
    // Never delete while a route/callback can recreate owned records.
    if (failures.length || this.preserved)
      return { status: "BLOCKED", failures: failures.length ? failures : ["FORENSIC_PRESERVATION_LATCHED"],
        retainedPaths: [...this.docs], actorState: this.actor?.state ?? "unattempted",
        actorRetained: this.actor !== null && this.actor.state !== "removed" };
    const after = await this.fingerprint();
    const unchanged =
      this.before === null ||
      JSON.stringify(after) === JSON.stringify(this.before);
    if (!unchanged)
      return {
        status: "BLOCKED",
        failures: ["READ_ONLY_ORDER_OR_LEDGER_MUTATED"],
        beforeFingerprint: this.before,
        afterFingerprint: after,
        retainedPaths: [...this.docs],
        actorRetained: this.actorCreated,
      };
    const unknown = (
      await db.collection("orders").where("ownerId", "==", this.uid).get()
    ).docs.filter((d) => !this.docs.includes(d.ref.path));
    if (unknown.length)
      return {
        status: "BLOCKED",
        failures: ["UNEXPECTED_ORDER_CREATED"],
        retainedPaths: [...this.docs],
        unexpectedOrders: unknown.map((d) => d.id),
      };
    try {
      this.assertTarget();
      await db.runTransaction(async (tx) => {
        const refs = this.docs.map((path) => db.doc(path));
        const snapshots = refs.length ? await tx.getAll(...refs) : [];
        for (const snap of snapshots) {
          if (!snap.exists || !this.baselines.has(snap.ref.path) ||
              hash(snap.data()) !== this.baselines.get(snap.ref.path) ||
              snap.data()?.__fixtureRunId !== this.runId) throw Error("OWNED_BASELINE_CHANGED");
          if ((snap.ref.path.startsWith("orders/") || snap.ref.path.startsWith("users/") ||
              snap.ref.path.startsWith("askConversations/")) && snap.data()?.ownerId !== this.uid)
            throw Error("OWNERSHIP_CHANGED");
        }
        for (const ref of refs) tx.delete(ref);
      });
      for (const path of this.docs) if ((await db.doc(path).get()).exists) throw Error("DELETE_NOT_CONFIRMED");
    } catch { this.preserve(); failures.push("ATOMIC_DOCUMENT_CLEANUP_UNCONFIRMED"); }
    if (!this.preserved && !failures.length && this.actor) {
      try { if (await this.actor.cleanup() === "PRESERVED") throw Error("ACTOR_PRESERVED"); }
      catch { this.preserve(); failures.push("ACTOR_CLEANUP_UNCONFIRMED"); }
    }
    return {
      status: failures.length || !unchanged ? "BLOCKED" : "PASSED",
      readOnlyOrdersUnchanged: this.before === null ? "NOT_RUN" : unchanged,
      beforeFingerprint: this.before,
      afterFingerprint: after,
      actorRetained: this.actorCreated && failures.length > 0,
      failures,
      ownedPaths: this.docs.length,
      unexpectedOrders: unknown.map((d) => d.id),
    };
  }
}
function hash(value: unknown): string {
  // Canonical key ordering keeps field-order-only differences out of synthetic receipts.
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, x]) => [k, canonical(x)]),
          )
        : v;
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}

/** Private pure ownership protocol. Port adapter must enforce emulator host/app before I/O. */
type ActorRecord={uid:string;email?:string;displayName?:string};
type ActorPort={get:(uid:string)=>Promise<ActorRecord>;create:(data:ActorRecord&{emailVerified:boolean})=>Promise<ActorRecord>;link:(uid:string)=>Promise<void>;remove:(uid:string)=>Promise<void>};
type ActorState='unattempted'|'attempted'|'acknowledged'|'collision'|'unknown'|'removed';
const code=(error:unknown)=>error&&typeof error==='object'&&'code'in error?error.code:null;
class OwnedActorProtocol {
 state:ActorState='unattempted';
 preserved=false;
 readonly expected:Readonly<ActorRecord>;
 constructor(expected:ActorRecord,private readonly port:ActorPort){this.expected=Object.freeze({...expected});}
 async create(){
  if(this.state!=='unattempted')throw Error('INVALID_ACTOR_STATE');
  try{await this.port.get(this.expected.uid);this.state='collision';throw Error('ACTOR_COLLISION');}
  catch(error){if(this.state==='collision')throw error;if(code(error)!=='auth/user-not-found'){this.state='unknown';this.preserved=true;throw error;}}
  this.state='attempted';
  try{
   const record=await this.port.create({...this.expected,emailVerified:true});
   if(record.uid!==this.expected.uid)throw Error('CREATE_ACK_ID_MISMATCH');
   this.state='acknowledged';
  }catch(error){this.state=code(error)==='auth/uid-already-exists'?'collision':'unknown';this.preserved=true;throw error;}
  try{await this.port.link(this.expected.uid);}catch(error){this.preserved=true;throw error;}
 }
 async cleanup():Promise<'REMOVED'|'PRESERVED'|'UNOWNED'>{
  if(this.preserved||this.state==='unknown'||this.state==='attempted')return 'PRESERVED';
  if(this.state!=='acknowledged')return 'UNOWNED';
  try{
   const current=await this.port.get(this.expected.uid);
   if(current.uid!==this.expected.uid||current.email!==this.expected.email||current.displayName!==this.expected.displayName)throw Error('ACTOR_PROVENANCE_CHANGED');
   await this.port.remove(this.expected.uid);
   try{await this.port.get(this.expected.uid);throw Error('DELETE_NOT_CONFIRMED');}
   catch(error){if(code(error)!=='auth/user-not-found')throw error;}
   this.state='removed';return 'REMOVED';
  }catch(error){this.state='unknown';this.preserved=true;throw error;}
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
