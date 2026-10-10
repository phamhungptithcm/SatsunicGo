/* global fetch, AbortSignal, console */
import process from "node:process";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("Owned demo only");
const fixture = JSON.parse(
    readFileSync("test-results/tracking-real/fixture.json"),
  ),
  app = initializeApp({ projectId: "demo-satsunicgo" }),
  db = getFirestore();
const result = {
  ownerId: fixture.owner.uid,
  environment:
    "real HTTP local Auth/Functions/Firestore; no external payment/provider",
  scenarios: [],
  orderIds: [],
  parcelIds: [],
  checkoutIds: [],
  productIds: [],
};
async function post(url, data, token) {
  const r = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(data),
  });
  const b = await r.json();
  if (b.error)
    throw Object.assign(Error(b.error.status + ": " + b.error.message), {
      code: b.error.status,
    });
  return b.result ?? b;
}
async function identity(a) {
  return (
    await post(
      "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo",
      {
        requestUri: "http://localhost",
        returnSecureToken: true,
        postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub: a.sub, email: a.email, email_verified: true }))}&providerId=google.com`,
      },
    )
  ).idToken;
}
const call = (token, name, data) =>
  post(
    "http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/" + name,
    { data },
    token,
  );
function save() {
  writeFileSync(
    "test-results/tracking-real/business.json",
    JSON.stringify(result, null, 2),
  );
}
try {
  const owner = await identity(fixture.owner),
    staff = await identity(fixture.staff);
  const setup = await call(owner, "purchaseCheckoutSetup", {});
  assert.ok(
    setup.pricing,
    "Existing approved checkout pricing must be current; never overwrite shared settings",
  );
  const province = setup.regions[0],
    commune = province.communes[0];
  const recipient = {
    recipient: "Synthetic tracking customer",
    phone: "0900000000",
    country: "VN",
    provinceCode: province.code,
    province: province.name,
    communeCode: commune.code,
    commune: commune.name,
    street: "Synthetic tracking test address",
    note: "",
  };
  for (const kind of ["custom", "catalog"]) {
    let revision =
      (await db.doc("carts/" + fixture.owner.uid).get()).get("revision") ?? 0;
    if (kind === "custom") {
      const r = await call(owner, "purchaseCheckout", {
        action: "addRequest",
        operationId: randomUUID(),
        expectedRevision: revision,
        request: {
          market: "US",
          notes: "Synthetic tracking lifecycle",
          items: [
            {
              name: "Synthetic custom item",
              variant: "",
              quantity: 2,
              unitSourceMinor: 100,
            },
          ],
        },
      });
      revision = r.cart.revision;
    } else {
      const productId = "tracking-qa-product-" + randomUUID();
      result.productIds.push(productId);
      save();
      await db.doc("products/" + productId).create({
        title: "Synthetic catalog item",
        slug: productId,
        status: "published",
        market: "US",
        version: 1,
        orderable: true,
        listedPrice: 100000,
        termsVersion: "synthetic-v1",
        catalogOptions: [],
      });
      const r = await call(owner, "cartCommand", {
        action: "merge",
        operationId: randomUUID(),
        expectedRevision: revision,
        items: [{ lineId: randomUUID(), productId, variant: "", quantity: 2 }],
      });
      revision = r.revision ?? r.cart?.revision;
    }
    const preview = await call(owner, "purchaseCheckout", {
      action: "preview",
      operationId: randomUUID(),
      expectedRevision: revision,
      recipient,
    });
    result.checkoutIds.push(preview.id);
    result.orderIds.push(...preview.lines.map((l) => l.orderId));
    save();
    await call(owner, "purchaseCheckout", {
      action: "commit",
      operationId: randomUUID(),
      previewId: preview.id,
      previewHash: preview.previewHash,
      confirmed: true,
      paymentMethod: "BANK_TRANSFER",
    });
    await call(owner, "purchaseDemoPayment", {
      id: preview.id,
      outcome: "paid",
    });
    const id = preview.lines[0].orderId;
    const before = (await db.doc("orders/" + id).get()).data();
    assert.equal(before.collected, preview.total);
    const business = async (action, payload, actor = staff) =>
      call(actor, "command", {
        action,
        orderId: id,
        expectedVersion: (await db.doc("orders/" + id).get()).get("version"),
        operationId: randomUUID(),
        payload,
      });
    await business("claimPurchase", {});
    await business("recordPurchase", {
      quantity: 2,
      supplierOrder: "SYNTHETIC",
      actualSourceMinor: 200,
      evidence: "Synthetic purchase evidence",
    });
    await business("receive", {
      quantity: 2,
      condition: "good",
      evidence: "Synthetic receiving evidence",
    });
    await business("pack", {
      weightGrams: 1000,
      dimensionsCm: [10, 20, 30],
      checklist: true,
      evidence: "Synthetic packing evidence",
    });
    if (kind === "custom") {
      await business("finalize", {
        total: preview.total,
        reason: "Synthetic final total, no extra charge",
      });
      await business("approveFinal", {}, owner);
    }
    const packed = await call(staff, "shippingCommand", {
      action: "packParcel",
      operationId: randomUUID(),
      orderVersions: {
        [id]: (await db.doc("orders/" + id).get()).get("version"),
      },
      payload: {
        allocations: [{ orderId: id, line: 0, quantity: 2 }],
        weightGrams: 1000,
        dimensionsCm: [10, 20, 30],
        warehouse: "Synthetic warehouse",
        route: "US-VN",
        checklist: true,
        evidence: "Synthetic parcel evidence",
      },
    });
    const parcelId = packed.id;
    result.parcelIds.push(parcelId);
    save();
    const shipping = async (action, payload) =>
      call(staff, "shippingCommand", {
        action,
        parcelId,
        expectedVersion: (await db.doc("packages/" + parcelId).get()).get(
          "version",
        ),
        orderVersions: {
          [id]: (await db.doc("orders/" + id).get()).get("version"),
        },
        operationId: randomUUID(),
        payload,
      });
    await shipping("dispatchParcel", {
      carrier: "Synthetic carrier",
      tracking: "SYNTHETIC-TRACKING",
      handoffEvidence: "Synthetic dispatch evidence",
    });
    const dispatched = await call(owner, "customerOrderTracking", {
      orderId: id,
    });
    const dispatchAt = dispatched.timeline.find(
      (e) => e.action === "parcelDispatch",
    ).createdAt;
    await shipping("setDeliveryEstimate", {
      estimate: { startAt: Date.now() + 3600000, endAt: Date.now() + 7200000 },
      evidence: "Synthetic ETA evidence",
    });
    const estimated = await call(owner, "customerOrderTracking", {
      orderId: id,
    });
    assert.ok(estimated.estimate);
    assert.equal(
      estimated.timeline.find((e) => e.action === "parcelDispatch").createdAt,
      dispatchAt,
    );
    await shipping("setDeliveryEstimate", {
      estimate: null,
      evidence: "Synthetic estimate withdrawal",
    });
    assert.equal(
      (await call(owner, "customerOrderTracking", { orderId: id })).estimate,
      null,
    );
    await shipping("trackParcel", {
      state: "delivered",
      event: "Synthetic recipient delivery",
    });
    const delivered = await call(owner, "customerOrderTracking", {
      orderId: id,
    });
    assert.equal(delivered.stage, "DELIVERED");
    assert.ok(delivered.timeline.find((e) => e.action === "parcelDelivered"));
    await business("confirmReceipt", { received: true }, owner);
    const complete = await call(owner, "customerOrderTracking", {
        orderId: id,
      }),
      after = (await db.doc("orders/" + id).get()).data();
    assert.equal(complete.stage, "COMPLETED");
    assert.equal(after.collected, before.collected);
    assert.equal(after.refunded, before.refunded);
    assert.equal(after.tracking, undefined);
    assert.ok(complete.timeline.some((e) => e.action === "confirmReceipt"));
    const financial = await db
      .collection("financialEntries")
      .where("orderId", "==", id)
      .get();
    assert.equal(financial.size, 1);
    assert.ok(!JSON.stringify(complete).includes(recipient.street));
    assert.ok(!JSON.stringify(complete).includes(recipient.phone));
    result.scenarios.push({
      id: kind === "custom" ? "H01" : "H02",
      status: "PASSED",
      orderId: id,
      stage: complete.stage,
      historyEvents: complete.timeline.length,
      financialEntries: financial.size,
      fullPayment: after.collected,
      transport:
        "real HTTP emulator checkout → simulated paid → purchase → receive → pack → parcel dispatch → ETA set/remove → delivered → owner receipt",
    });
    save();
  }
} catch (e) {
  result.error = { code: e.code ?? "assertion", message: e.message };
  save();
  throw e;
} finally {
  await deleteApp(app);
  console.log(
    JSON.stringify({
      scenarios: result.scenarios,
      error: result.error ?? null,
    }),
  );
}
