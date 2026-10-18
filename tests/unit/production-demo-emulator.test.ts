import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { handleProductionDemo as payment } from "../../functions/src/production-demo-payment";
import { handleProductionDemoCommand as command } from "../../functions/src/production-demo-commands";
import { customerOrderTracking } from "../../functions/src/customer-order-tracking";
import { listWork } from "../../functions/src/workspace";
import { purchaseReceipt } from "../../functions/src/purchase-receipts";
import { assertDemoTestEnvironment } from "../helpers/demo-environment";

// Opt-in only: never clear shared emulator data or replace shared settings/rules.
const enabled = process.env.PRODUCTION_DEMO_EMULATOR_TEST === "1";
describe.skipIf(!enabled)(
  "production demo against shared Firestore and Storage",
  () => {
    const uid = `demo-validation-${randomUUID()}`,
      runId = randomUUID(),
      productId = `demo-validation-${randomUUID()}`;
    let app: ReturnType<typeof initializeApp>,
      db: ReturnType<typeof getFirestore>;
    const req = (data: unknown, owner = uid, mfa = true) =>
      ({
        data,
        auth: {
          uid: owner,
          token: {
            email_verified: true,
            auth_time: Math.floor(Date.now() / 1000),
            firebase: {
              sign_in_provider: "google.com",
              ...(mfa ? { sign_in_second_factor: "totp" } : {}),
            },
          },
        },
      }) as CallableRequest;
    const call = (data: Record<string, unknown>) =>
      payment(req({ runId, ...data }));
    const read = async (path: string) => (await db.doc(path).get()).data();
    let preview: { id: string; previewHash: string }, orderId: string;
    const oldId = "e281d439-eac6-4f3f-beb5-14c088ecaba4";
    let old: unknown;
    beforeAll(async () => {
      assertDemoTestEnvironment(process.env);
      if (process.env.FIREBASE_STORAGE_EMULATOR_HOST !== "127.0.0.1:19208")
        throw Error("SHARED_STORAGE_REQUIRED");
      app = initializeApp({
        projectId: "demo-satsunicgo",
        storageBucket: "demo-satsunicgo.appspot.com",
      });
      db = getFirestore();
      old = await read(`purchaseCheckouts/${oldId}`);
      await db
        .doc(`staffAccess/${uid}`)
        .create({ active: true, roles: ["OWNER"] });
      await db.doc(`users/${uid}`).create({ ownerId: uid, locked: false });
      await db.doc(`products/${productId}`).create({
        title: "Demo validation item",
        slug: productId,
        status: "published",
        market: "US",
        version: 1,
        orderable: true,
        listedPrice: 100000,
        termsVersion: "demo-v1",
        catalogOptions: [],
      });
      await db.doc(`carts/${uid}`).create({
        ownerId: uid,
        revision: 77,
        items: [],
        activeCheckoutId: oldId,
        updatedAt: 0,
      });
    });
    afterAll(async () => {
      // Retain test audit/history, but do not leave published catalog fixtures or active staff sessions in the shared runtime.
      if (db) {
        const batch = db.batch();
        batch.set(
          db.doc(`products/${productId}`),
          { status: "draft" },
          { merge: true },
        );
        batch.set(
          db.doc(`staffAccess/${uid}`),
          { active: false },
          { merge: true },
        );
        batch.set(db.doc(`users/${uid}`), { locked: true }, { merge: true });
        if ((await db.doc(`productionDemoSessions/${runId}`).get()).exists)
          batch.update(db.doc(`productionDemoSessions/${runId}`), {
            enabled: false,
          });
        await batch.commit();
      }
      if (app) await deleteApp(app);
    });
    it("denies guest, non-owner and missing MFA before any session write", async () => {
      await expect(
        payment({ data: { action: "activate", runId } } as CallableRequest),
      ).rejects.toMatchObject({ code: "unauthenticated" });
      await expect(
        payment(req({ action: "activate", runId }, "other")),
      ).rejects.toMatchObject({ code: "permission-denied" });
      await expect(
        payment(req({ action: "activate", runId }, uid, false)),
      ).rejects.toMatchObject({ code: "failed-precondition" });
      expect(await read(`productionDemoSessions/${runId}`)).toBeUndefined();
    });
    it("activates idempotently; isolates regular cart and rejects another concurrent run", async () => {
      const result = await call({ action: "activate" });
      expect(await call({ action: "activate" })).toEqual(result);
      await expect(
        call({ action: "activate", runId: randomUUID() }),
      ).rejects.toMatchObject({ code: "failed-precondition" });
      expect(await payment(req({ action: "current" }))).toEqual({ runId });
      expect(await read(`carts/${uid}`)).toMatchObject({
        revision: 77,
        activeCheckoutId: oldId,
      });
    });
    it("rejects old SePay, injected state/amount, cross-run and empty preview", async () => {
      await expect(
        call({ action: "simulate", checkoutId: oldId }),
      ).rejects.toMatchObject({ code: "permission-denied" });
      await expect(
        call({
          action: "simulate",
          checkoutId: randomUUID(),
          amount: 1,
          state: "paid",
        }),
      ).rejects.toMatchObject({ code: "invalid-argument" });
      await expect(
        call({ action: "status", runId: randomUUID() }),
      ).rejects.toMatchObject({ code: "permission-denied" });
      await expect(
        call({
          action: "preview",
          operationId: randomUUID(),
          expectedRevision: 0,
        }),
      ).rejects.toMatchObject({ code: "failed-precondition" });
    });
    it("validates quantity/revision and freezes server catalog totals", async () => {
      await expect(
        call({
          action: "select",
          operationId: randomUUID(),
          expectedRevision: 0,
          productId,
          quantity: 6,
          variant: "",
        }),
      ).rejects.toMatchObject({ code: "invalid-argument" });
      const select = {
        action: "select",
        operationId: randomUUID(),
        expectedRevision: 0,
        productId,
        quantity: 2,
        variant: "",
      };
      expect(await call(select)).toEqual({ revision: 1 });
      expect(await call(select)).toEqual({ revision: 1 });
      await expect(call({ ...select, quantity: 1 })).rejects.toMatchObject({
        code: "already-exists",
      });
      await expect(
        call({ ...select, operationId: randomUUID() }),
      ).rejects.toMatchObject({ code: "aborted" });
      preview = (await call({
        action: "preview",
        operationId: randomUUID(),
        expectedRevision: 1,
      })) as typeof preview;
      expect(preview).toMatchObject({
        total: 200000,
        provider: "production_demo",
        testRunId: runId,
      });
    });
    it("rejects stale product and wrong hash then commits exactly once", async () => {
      const commit = {
        action: "commit",
        operationId: randomUUID(),
        previewId: preview.id,
        previewHash: preview.previewHash,
        confirmed: true,
      };
      await expect(
        call({ ...commit, previewHash: "0".repeat(64) }),
      ).rejects.toMatchObject({ code: "failed-precondition" });
      await db.doc(`products/${productId}`).update({ version: 2 });
      await expect(call(commit)).rejects.toMatchObject({
        code: "failed-precondition",
      });
      await db.doc(`products/${productId}`).update({ version: 1 });
      const results = await Promise.all([call(commit), call(commit)]);
      expect(results[0]).toEqual(results[1]);
      expect(await read(`productionDemoSessions/${runId}`)).toMatchObject({
        checkoutIds: [preview.id],
      });
      expect(await read(`purchaseCheckouts/${preview.id}`)).toMatchObject({
        state: "pending",
        receiptEmail: null,
      });
    });
    it("simulates concurrently with one test allocation and ready downloadable private PDF", async () => {
      const results = await Promise.all(
        Array.from({ length: 4 }, () =>
          call({ action: "simulate", checkoutId: preview.id }),
        ),
      );
      for (const result of results)
        expect(result).toMatchObject({ state: "paid", receiptId: preview.id });
      const checkout = await read(`purchaseCheckouts/${preview.id}`);
      const evidence = await read(`productionDemoEvidence/${preview.id}`);
      expect(evidence!.paidAt).toBeLessThan(checkout!.expiresAt);
      expect(evidence!.paidAt).toBeLessThan(
        (await read(`productionDemoSessions/${runId}`))!.expiresAt,
      );
      orderId = checkout!.lines[0].orderId;
      expect(checkout).toMatchObject({
        state: "paid",
        version: 2,
        paymentReference: `PRODUCTION-DEMO-${preview.id}`,
      });
      expect(await read(`orders/${orderId}`)).toMatchObject({
        stage: "QUOTE_ACCEPTED",
        paymentProvider: "production_demo",
        testRunId: runId,
        collected: 200000,
      });
      const pdf = await purchaseReceipt.run(
        req({ id: preview.id, download: true }),
      );
      expect(pdf.state).toBe("ready");
      expect(Buffer.from(pdf.base64!, "base64").subarray(0, 5).toString()).toBe(
        "%PDF-",
      );
      expect(await read(`purchaseEmailOutbox/${preview.id}`)).toMatchObject({
        to: null,
        customerSenderEnabled: false,
        transport: "unconfigured",
      });
      await expect(
        purchaseReceipt.run(req({ id: preview.id, download: true }, "other")),
      ).rejects.toMatchObject({ code: "permission-denied" });
      expect(
        (
          await db
            .collection("purchaseTestFinancialEntries")
            .where("testRunId", "==", runId)
            .get()
        ).size,
      ).toBe(1);
      for (const collection of [
        "financialEntries",
        "purchaseSePayIntents",
        "purchaseSePayEvidence",
        "stockMovements",
        "customerEmailJobs",
        "membershipHistory",
      ])
        expect(
          (
            await db
              .collection(collection)
              .where("testRunId", "==", runId)
              .get()
          ).size,
        ).toBe(0);
    });
    it("runs actual domain lifecycle with version fencing, invalid transitions and replay", async () => {
      const send = async (action: string, payload: unknown, extra = {}) => {
        const order = await read(`orders/${orderId}`);
        return command(
          req({
            runId,
            orderId,
            operationId: randomUUID(),
            expectedVersion: order!.version,
            action,
            payload,
            ...extra,
          }),
        );
      };
      await expect(send("dispatch", {})).rejects.toMatchObject({
        code: "failed-precondition",
      });
      await send("claimPurchase", {});
      await expect(
        send("recordPurchase", {
          quantity: 3,
          lines: [{ line: 0, quantity: 3 }],
          supplierOrder: "DEMO",
          evidence: "Simulation only",
          actualSourceMinor: 0,
        }),
      ).rejects.toMatchObject({ code: "failed-precondition" });
      const op = {
        runId,
        orderId,
        operationId: randomUUID(),
        expectedVersion: 2,
        action: "recordPurchase",
        payload: {
          quantity: 2,
          lines: [{ line: 0, quantity: 2 }],
          supplierOrder: "DEMO",
          evidence: "Simulation only",
          actualSourceMinor: 0,
        },
      };
      const purchased = await command(req(op));
      expect(await command(req(op))).toEqual(purchased);
      await expect(
        send(
          "receive",
          {
            quantity: 2,
            lines: [{ line: 0, quantity: 2 }],
            condition: "good",
            shelf: "DEMO",
            evidence: "Simulation only",
          },
          { expectedVersion: 1 },
        ),
      ).rejects.toMatchObject({ code: "aborted" });
      await send("receive", {
        quantity: 2,
        lines: [{ line: 0, quantity: 2 }],
        condition: "good",
        shelf: "DEMO",
        evidence: "Simulation only",
      });
      await send("pack", {
        weightGrams: 1000,
        dimensionsCm: [10, 10, 10],
        evidence: "Simulation only",
        checklist: true,
      });
      expect(await read(`orders/${orderId}`)).toMatchObject({
        stage: "READY_TO_SHIP",
      });
      await send("dispatch", {});
      await send("track", { tracking: "DEMO-TEST", delivered: true });
      await send("confirmReceipt", { received: true });
      expect(await read(`orders/${orderId}`)).toMatchObject({
        stage: "COMPLETED",
        version: 8,
      });
      expect(
        (await db.doc(`orders/${orderId}`).collection("timeline").get()).size,
      ).toBe(8);
      expect(await customerOrderTracking.run(req({ orderId }))).toMatchObject({
        stage: "COMPLETED",
        version: 8,
        shipments: [],
        timelinePartial: false,
      });
      const crm = await listWork.run(req({ kind: "orders", id: orderId }));
      expect(crm.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: orderId,
            stage: "COMPLETED",
            paymentProvider: "production_demo",
            testRunId: runId,
          }),
        ]),
      );
      await expect(send("refund", { amount: 200000 })).rejects.toMatchObject({
        code: "invalid-argument",
      });
    });
    it("rules deny direct private demo reads/writes even for owner", async () => {
      const { initializeTestEnvironment, assertFails } =
        await import("@firebase/rules-unit-testing");
      const { doc, getDoc, setDoc } = await import("firebase/firestore");
      const env = await initializeTestEnvironment({
        projectId: "demo-satsunicgo",
        firestore: { host: "127.0.0.1", port: 18207 },
      });
      try {
        const client = env
          .authenticatedContext(uid, {
            email_verified: true,
            firebase: { sign_in_provider: "google.com" },
          })
          .firestore();
        for (const collection of [
          "productionDemoSessions",
          "productionDemoOwners",
          "productionDemoCarts",
          "productionDemoEvidence",
          "productionDemoOperations",
          "productionDemoPreviews",
          "productionDemoFulfillment",
        ]) {
          await assertFails(getDoc(doc(client, collection, runId)));
          await assertFails(
            setDoc(doc(client, collection, runId), {
              ownerId: uid,
              state: "paid",
            }),
          );
        }
      } finally {
        await env.cleanup();
      }
    });
    it("expiry fences new work; cancelled unpaid attempts release only the demo cart and cap remains five", async () => {
      const session = await read(`productionDemoSessions/${runId}`);
      await db
        .doc(`productionDemoSessions/${runId}`)
        .update({ createdAt: Date.now() - 1000, expiresAt: Date.now() - 1 });
      await expect(
        call({
          action: "select",
          operationId: randomUUID(),
          expectedRevision: 3,
          productId,
          quantity: 1,
          variant: "",
        }),
      ).rejects.toMatchObject({ code: "failed-precondition" });
      await db.doc(`productionDemoSessions/${runId}`).set(session!);
      for (let i = 0; i < 4; i++) {
        const cart = await read(`productionDemoCarts/${runId}`);
        await call({
          action: "select",
          operationId: randomUUID(),
          expectedRevision: cart!.revision,
          productId,
          quantity: 1,
          variant: "",
        });
        const p = (await call({
          action: "preview",
          operationId: randomUUID(),
          expectedRevision: cart!.revision + 1,
        })) as { id: string; previewHash: string };
        await call({
          action: "commit",
          operationId: randomUUID(),
          previewId: p.id,
          previewHash: p.previewHash,
          confirmed: true,
        });
        expect(await call({ action: "reconcile", checkoutId: p.id })).toEqual({
          state: "pending",
        });
        expect(await call({ action: "cancel", checkoutId: p.id })).toEqual({
          state: "cancelled",
        });
        expect(await call({ action: "cancel", checkoutId: p.id })).toEqual({
          state: "cancelled",
        });
        await expect(
          call({ action: "simulate", checkoutId: p.id }),
        ).rejects.toMatchObject({ code: "failed-precondition" });
        expect(await read(`productionDemoEvidence/${p.id}`)).toBeUndefined();
      }
      const cart = await read(`productionDemoCarts/${runId}`);
      await expect(
        call({
          action: "preview",
          operationId: randomUUID(),
          expectedRevision: cart!.revision,
        }),
      ).rejects.toMatchObject({ code: "resource-exhausted" });
      expect(
        (await read(`productionDemoSessions/${runId}`))!.checkoutIds,
      ).toHaveLength(5);
    });
    it("revocation preserves readback/reconcile and original SePay/cart while blocking new writes", async () => {
      await call({ action: "disable" });
      await expect(
        call({ action: "simulate", checkoutId: preview.id }),
      ).rejects.toMatchObject({ code: "failed-precondition" });
      expect(
        await call({ action: "reconcile", checkoutId: preview.id }),
      ).toMatchObject({ state: "paid" });
      expect(await call({ action: "status" })).toMatchObject({
        session: { enabled: false },
        orders: [{ stage: "COMPLETED" }],
      });
      expect(await read(`purchaseCheckouts/${oldId}`)).toEqual(old);
      expect(await read(`carts/${uid}`)).toEqual({
        ownerId: uid,
        revision: 77,
        items: [],
        activeCheckoutId: oldId,
        updatedAt: 0,
      });
      await db.doc(`users/${uid}`).update({ locked: true });
      await expect(call({ action: "status" })).rejects.toMatchObject({
        code: "permission-denied",
      });
    });
  },
);
