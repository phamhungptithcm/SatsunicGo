/* global fetch, AbortSignal, console */
import process from "node:process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("Explicit owned shared emulator fixture only");
const app = initializeApp({ projectId: "demo-satsunicgo" }),
  db = getFirestore(),
  adminAuth = getAuth();
const file = "test-results/tracking-real/fixture.json",
  privateFile = "/private/tmp/tracking-real-private.json";
async function post(url, data, token) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(30000),
  });
  const body = await r.json();
  if (body.error) throw Error(body.error.status ?? body.error.message);
  return body.result ?? body;
}
const call = (token, name, data) =>
  post(
    "http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/" + name,
    { data },
    token,
  );
try {
  if (process.argv.includes("--cleanup")) {
    const f = JSON.parse(readFileSync(file));
    if (
      !f.orderId.startsWith("SG-QA-") ||
      !f.staff.sub.startsWith("tracking-qa-") ||
      !f.owner.sub.startsWith("tracking-qa-")
    )
      throw Error("Ownership guard");
    for (const actor of [f.owner, f.staff]) {
      const identity = await adminAuth.getUser(actor.uid);
      if (
        identity.email !== actor.email ||
        !identity.providerData.some(
          (p) => p.providerId === "google.com" && p.uid === actor.sub,
        )
      )
        throw Error("Synthetic Auth ownership mismatch");
    }
    const initial = await db.doc(`orders/${f.orderId}`).get();
    if (initial.exists && initial.get("ownerId") !== f.owner.uid)
      throw Error("Synthetic order ownership mismatch");
    // Discover by the newly-created synthetic owner, including partially failed
    // checkouts whose response was lost before the test could record their IDs.
    const orders = await db
      .collection("orders")
      .where("ownerId", "==", f.owner.uid)
      .get();
    const orderIds = new Set([f.orderId, ...orders.docs.map((d) => d.id)]);
    const parcelIds = new Set([f.parcelId]);
    for (const orderId of orderIds) {
      const allocation = (
        await db.doc(`packageAllocations/${orderId}`).get()
      ).data();
      for (const id of allocation?.parcelIds ?? []) parcelIds.add(id);
    }
    const checkouts = await db
      .collection("purchaseCheckouts")
      .where("ownerId", "==", f.owner.uid)
      .get();
    const previews = await db
      .collection("purchasePreviews")
      .where("ownerId", "==", f.owner.uid)
      .get();
    const identities = [
      f.owner.uid,
      f.staff.uid,
      ...orderIds,
      ...parcelIds,
      ...checkouts.docs.map((d) => d.id),
      ...previews.docs.map((d) => d.id),
    ];
    const ownedPaths = [
      ...[...orderIds].flatMap((id) => [
        `orders/${id}`,
        `packageAllocations/${id}`,
        `orderRecipients/${id}`,
        `orderOperations/${id}`,
        `orderMediaCounters/${id}`,
        `guestTrackingAccess/${id}`,
      ]),
      ...[...parcelIds].flatMap((id) => [
        `packages/${id}`,
        `customerShipments/${f.owner.uid}-${id}`,
      ]),
      `carts/${f.owner.uid}`,
      `users/${f.owner.uid}`,
      `users/${f.staff.uid}`,
      `staffAccess/${f.staff.uid}`,
    ];
    // A fixed allow-list excludes all shared settings, quotas and counters.
    const collections = [
      "purchaseDrafts",
      "purchasePreviews",
      "purchaseCheckouts",
      "purchasePaymentEvidence",
      "purchaseReceipts",
      "purchaseReceiptJobs",
      "financialEntries",
      "orderMedia",
      "idempotencyKeys",
      "guestTrackingOperations",
      "auditLogs",
      "auditEvents",
      "analyticsJobs",
      "outboxJobs",
      "guestTrackingCodes",
    ];
    const discovered = [];
    for (const collection of collections) {
      const docs = await db.collection(collection).get();
      for (const d of docs.docs) {
        const serialized = JSON.stringify(d.data());
        if (
          identities.some((id) => d.id.includes(id) || serialized.includes(id))
        )
          discovered.push(d.ref.path);
      }
    }
    const businessPath = "test-results/tracking-real/business.json";
    try {
      const business = JSON.parse(readFileSync(businessPath));
      // Reject metadata from a different test session instead of deleting it.
      if (business.ownerId === f.owner.uid) {
        for (const id of business.productIds ?? []) {
          if (!id.startsWith("tracking-qa-product-"))
            throw Error("Synthetic product ownership guard");
          discovered.push(`products/${id}`);
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    ownedPaths.push(...discovered);
    for (const path of new Set(ownedPaths))
      await db.recursiveDelete(db.doc(path));
    for (const a of [f.owner, f.staff]) await adminAuth.deleteUser(a.uid);
    const remaining = (
      await Promise.all(ownedPaths.map((path) => db.doc(path).get()))
    ).filter((snapshot) => snapshot.exists).length;
    if (remaining) throw Error("Owned cleanup readback failed");
    for (const actor of [f.owner, f.staff]) {
      try {
        await adminAuth.getUser(actor.uid);
        throw Error("Owned auth cleanup failed");
      } catch (error) {
        if (error.code !== "auth/user-not-found") throw error;
      }
    }
    console.log(
      JSON.stringify({
        cleanup: "PASSED",
        ownedOrder: f.orderId,
        remainingOwnedDocuments: remaining,
        sharedQuotaBuckets: "Preserved; normal TTL",
        sharedConfiguration:
          "Cleanup excludes settings; pricing restored separately by compare-and-set",
        deletedOwnedPaths: new Set(ownedPaths).size,
      }),
    );
  } else {
    if (existsSync(file)) {
      const previous = JSON.parse(readFileSync(file));
      if (
        !previous.owner?.sub?.startsWith("tracking-qa-owner-") ||
        !previous.staff?.sub?.startsWith("tracking-qa-staff-")
      )
        throw Error("Existing fixture metadata ownership guard");
      for (const actor of [previous.owner, previous.staff]) {
        if ((await db.doc(`users/${actor.uid}`).get()).exists)
          throw Error("Existing fixture is active; preserve it");
        try {
          await adminAuth.getUser(actor.uid);
          throw Error("Existing fixture Auth is active; preserve it");
        } catch (error) {
          if (error.code !== "auth/user-not-found") throw error;
        }
      }
    }
    const suffix = randomUUID().slice(0, 8);
    async function identity(role) {
      const sub = `tracking-qa-${role}-${suffix}`,
        email = sub + "@satsunicgo.example.invalid";
      const a = await post(
        "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo",
        {
          requestUri: "http://localhost",
          returnSecureToken: true,
          postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub, email, email_verified: true }))}&providerId=google.com`,
        },
      );
      return { actor: { sub, email, uid: a.localId }, token: a.idToken };
    }
    const owner = await identity("owner"),
      staff = await identity("staff");
    const f = {
      orderId: "SG-QA-" + suffix,
      parcelId: "tracking-qa-parcel-" + suffix,
      owner: owner.actor,
      staff: staff.actor,
    };
    mkdirSync("test-results/tracking-real", { recursive: true });
    writeFileSync(file, JSON.stringify(f));
    const allocation = { orderId: f.orderId, line: 0, quantity: 1 },
      parcel = {
        id: f.parcelId,
        version: 1,
        state: "in_transit",
        allocations: [allocation],
        route: "US-VN",
        warehouse: "Synthetic warehouse",
        weightGrams: 500,
      };
    const b = db.batch();
    b.create(db.doc(`users/${f.owner.uid}`), { locked: false });
    b.create(db.doc(`users/${f.staff.uid}`), { locked: false });
    b.create(db.doc(`staffAccess/${f.staff.uid}`), {
      active: true,
      roles: ["OWNER"],
    });
    b.create(db.doc(`orders/${f.orderId}`), {
      id: f.orderId,
      ownerId: f.owner.uid,
      version: 1,
      market: "US",
      stage: "IN_TRANSIT",
      purchaseKind: "catalog",
      items: [{ name: "Synthetic item", quantity: 1 }],
      collected: 240000,
      refunded: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    b.create(db.doc(`packages/${f.parcelId}`), parcel);
    b.create(db.doc(`packageAllocations/${f.orderId}`), {
      parcelIds: [f.parcelId],
      allocations: [allocation],
    });
    b.create(db.doc(`customerShipments/${f.owner.uid}-${f.parcelId}`), {
      ...parcel,
      ownerId: f.owner.uid,
    });
    await b.commit();
    const capability = await call(owner.token, "managePublicTrackingCode", {
      action: "issue",
      orderId: f.orderId,
      expectedVersion: 1,
      operationId: randomUUID(),
    });
    writeFileSync(privateFile, JSON.stringify({ code: capability.code }), {
      mode: 0o600,
    });
    const value = await call(owner.token, "customerOrderTracking", {
      orderId: f.orderId,
    });
    if (value.version !== 1) throw Error("Callable baseline mismatch");
    console.log(
      JSON.stringify({
        fixture: "READY",
        orderId: f.orderId,
        transport: "real HTTP emulator",
        version: value.version,
      }),
    );
  }
} finally {
  await deleteApp(app);
}
