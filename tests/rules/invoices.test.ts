import { initializeApp, deleteApp, getApp } from "firebase-admin/app";
import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
let api: typeof import("../../functions/src/invoices"),
  share: typeof import("../../functions/src/invoice-share").invoiceShare,
  db: ReturnType<typeof getFirestore>;
const prefix = `invoice021-${randomUUID()}`,
  owner = `${prefix}-finance`,
  customer = `${prefix}-customer`,
  other = `${prefix}-other`,
  orderId = `${prefix}-order`;
function req(uid: string, data: unknown) {
  return {
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
    rawRequest: { ip: prefix },
  } as unknown as CallableRequest;
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-invoice-${randomUUID().slice(0, 8)}`,
  });
  api = await import("../../functions/src/invoices");
  ({ invoiceShare: share } = await import("../../functions/src/invoice-share"));
  db = getFirestore();
  await db
    .doc(`staffAccess/${owner}`)
    .set({ active: true, roles: ["OWNER", "FINANCE"] });
  await db
    .doc(`users/${customer}`)
    .set({ displayName: "Private synthetic buyer" });
  await db.doc(`orders/${orderId}`).set(
    createCatalogOrder(
      {
        title: "Fixture product",
        slug: "invoice-fixture",
        status: "published",
        market: "US",
        version: 1,
        orderable: true,
        listedPrice: 120000,
        termsVersion: "fixture-v1",
      },
      { productId: "fixture", productVersion: 1, quantity: 1, variant: "" },
      { id: orderId, ownerId: customer, now: Date.now() },
    ),
  );
});
it("issues once under retries, server snapshots stay immutable, ownership and stale source are enforced", async () => {
  const before = await db.doc("settings/invoiceSeller").get();
  try {
    await api.invoiceCommand.run(
      req(owner, {
        action: "configure",
        operationId: randomUUID(),
        seller: {
          name: "Synthetic seller",
          address: "Synthetic address",
          contact: "example.invalid",
        },
        ...(before.exists ? { expectedVersion: before.data()!.version } : {}),
      }),
    );
    const input = { action: "createDraft", orderId, operationId: randomUUID() };
    await expect(
      api.invoiceCommand.run(req(customer, input)),
    ).rejects.toMatchObject({ code: "permission-denied" });
    const [draft, replay] = await Promise.all([
      api.invoiceCommand.run(req(owner, input)),
      api.invoiceCommand.run(req(owner, input)),
    ]);
    expect(draft).toEqual(replay);
    const id = String(draft.id);
    await expect(
      api.invoiceDetail.run(req(customer, { id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await db.doc(`orders/${orderId}`).update({ version: 2 });
    await expect(
      api.invoiceCommand.run(
        req(owner, {
          action: "issue",
          id,
          expectedVersion: 1,
          operationId: randomUUID(),
        }),
      ),
    ).rejects.toMatchObject({ code: "aborted" });
    const refreshed = await api.invoiceCommand.run(
      req(owner, {
        action: "refreshDraft",
        id,
        expectedVersion: 1,
        operationId: randomUUID(),
      }),
    );
    const issue = {
      action: "issue",
      id,
      expectedVersion: refreshed.version,
      operationId: randomUUID(),
    };
    const issued = await api.invoiceCommand.run(req(owner, issue));
    expect(await api.invoiceCommand.run(req(owner, issue))).toEqual(issued);
    const document = await api.invoiceDetail.run(req(customer, { id }));
    expect(document).toMatchObject({
      total: 120000,
      collected: 0,
      state: "issued",
      sourceVersion: 2,
    });
    await expect(
      api.invoiceDetail.run(req(other, { id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect((await db.doc(`orders/${orderId}`).get()).data()).toMatchObject({
      version: 2,
      collected: 0,
      refunded: 0,
    });
    expect(
      (
        await db
          .collection("financialEntries")
          .where("orderId", "==", orderId)
          .get()
      ).size,
    ).toBe(0);
    const shared = await api.invoiceCommand.run(
      req(owner, {
        action: "createShare",
        id,
        expectedVersion: issued.version,
        operationId: randomUUID(),
      }),
    );
    const visible = await share.run({
      data: { token: shared.token },
      rawRequest: { ip: prefix },
    } as unknown as CallableRequest);
    expect(visible).not.toHaveProperty("buyerName");
    expect(visible).not.toHaveProperty("ownerId");
    const stored = await db
      .doc(`idempotencyKeys/${owner}-${issue.operationId}`)
      .get();
    expect(stored.data()?.result).not.toHaveProperty("token");
    const revoked = await api.invoiceCommand.run(
      req(owner, {
        action: "revokeShare",
        id,
        expectedVersion: shared.version,
        operationId: randomUUID(),
      }),
    );
    await expect(
      share.run({
        data: { token: shared.token },
        rawRequest: { ip: prefix },
      } as unknown as CallableRequest),
    ).rejects.toMatchObject({ code: "not-found" });
    await api.invoiceCommand.run(
      req(owner, {
        action: "void",
        id,
        expectedVersion: revoked.version,
        operationId: randomUUID(),
        reason: "Synthetic cancellation",
      }),
    );
    expect((await api.invoiceDetail.run(req(customer, { id }))).state).toBe(
      "void",
    );
    const replacement = await api.invoiceCommand.run(
      req(owner, {
        action: "createDraft",
        orderId,
        replacesId: id,
        operationId: randomUUID(),
      }),
    );
    expect(
      (await api.invoiceDetail.run(req(owner, { id: replacement.id })))
        .replacesId,
    ).toBe(id);
    expect((await api.invoiceDetail.run(req(customer, { id }))).state).toBe(
      "void",
    );
    await expect(
      api.invoiceCommand.run(
        req(owner, {
          action: "createDraft",
          orderId,
          replacesId: String(replacement.id),
          operationId: randomUUID(),
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  } finally {
    if (before.exists)
      await db.doc("settings/invoiceSeller").set(before.data()!);
    else await db.doc("settings/invoiceSeller").delete();
  }
});

afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});
