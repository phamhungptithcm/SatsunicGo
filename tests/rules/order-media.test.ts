import { beforeAll, it, expect, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { CallableRequest } from "firebase-functions/v2/https";
let media: typeof import("../../functions/src/order-media"),
  db: ReturnType<typeof getFirestore>;
const prefix = `media-${randomUUID()}`,
  customer = `${prefix}-a`,
  other = `${prefix}-b`,
  warehouse = `${prefix}-warehouse`;
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const req = (uid: string, data: unknown) =>
  ({
    auth: {
      uid,
      token: {
        uid,
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;
beforeAll(async () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  process.env.GCLOUD_PROJECT = "demo-satsunicgo";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8181";
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: "demo-satsunicgo",
    storageBucket: "demo-satsunicgo.appspot.com",
  });
  await import("../../functions/src/index");
  media = await import("../../functions/src/order-media");
  db = getFirestore();
  await db.doc(`orders/${prefix}`).set({ ownerId: customer, version: 1 });
  await db
    .doc(`staffAccess/${warehouse}`)
    .set({ active: true, roles: ["WAREHOUSE"] });
});
it("private media refuses customer crossover, warehouse receipts and active content before storage I/O", async () => {
  const body = {
    orderId: prefix,
    kind: "request",
    operationId: randomUUID(),
    mime: "image/png",
    base64: png,
    description: "Fixture image",
  };
  await expect(
    media.uploadOrderImage.run(req(other, body)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    media.uploadOrderImage.run(req(warehouse, { ...body, kind: "receipt" })),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    media.uploadOrderImage.run(
      req(customer, {
        ...body,
        base64: Buffer.from("<svg onload='attack'></svg>").toString("base64"),
      }),
    ),
  ).rejects.toMatchObject({ code: "invalid-argument" });
});
it.runIf(
  ["127.0.0.1:9298", "127.0.0.1:9297"].includes(
    process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "",
  ),
)(
  "private image upload is bounded and replay safe, and rechecks current access on every read",
  async () => {
    const body = {
      orderId: prefix,
      kind: "receipt",
      operationId: randomUUID(),
      mime: "image/png",
      base64: png,
      description: "Fixture bank proof",
    };
    const concurrent = await Promise.all(
      Array.from({ length: 3 }, () =>
        media.uploadOrderImage.run(req(customer, body)),
      ),
    );
    const result = concurrent[0];
    expect(concurrent).toEqual([result, result, result]);
    expect(await media.uploadOrderImage.run(req(customer, body))).toEqual(
      result,
    );
    expect(
      (await db.doc(`orderMediaCounters/${prefix}`).get()).data()?.count,
    ).toBe(1);
    const audits = await db
      .collection("auditEvents")
      .where("resourceId", "==", prefix)
      .limit(20)
      .get();
    expect(
      audits.docs.filter((row) => row.data().action === "uploadOrderImage"),
    ).toHaveLength(1);
    expect(
      await media.readOrderImage.run(req(customer, { id: result.id })),
    ).toMatchObject({ mime: "image/png", base64: png });
    await expect(
      media.uploadOrderImage.run(
        req(customer, { ...body, description: "Different proof" }),
      ),
    ).rejects.toMatchObject({ code: "already-exists" });
    await expect(
      media.readOrderImage.run(req(other, { id: result.id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      media.readOrderImage.run(req(warehouse, { id: result.id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(
      (await media.listOrderImages.run(req(warehouse, { orderId: prefix })))
        .rows,
    ).toEqual([]);
    await db.doc(`orderMediaCounters/${prefix}`).set({ count: 20 });
    await expect(
      media.uploadOrderImage.run(
        req(customer, { ...body, operationId: randomUUID() }),
      ),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
    await db.doc(`users/${customer}`).set({ ownerId: customer, locked: true });
    await expect(
      media.readOrderImage.run(req(customer, { id: result.id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);

it("mixed media roles compose grants consistently without granting bank receipts", async () => {
  const id = `${prefix}-mixed`,
    mixedWarehouse = `${prefix}-mixed-warehouse`,
    mixedSupport = `${prefix}-mixed-support`,
    unassigned = `${prefix}-unassigned`;
  await db.doc(`orders/${id}`).set({ ownerId: customer });
  await db
    .doc(`staffAccess/${mixedWarehouse}`)
    .set({ active: true, roles: ["BUYER", "WAREHOUSE"], orderIds: [id] });
  await db
    .doc(`staffAccess/${mixedSupport}`)
    .set({ active: true, roles: ["BUYER", "SUPPORT"], orderIds: [id] });
  await db
    .doc(`staffAccess/${unassigned}`)
    .set({ active: true, roles: ["BUYER"], orderIds: [] });
  const images = new Map<string, string>();
  for (const imageKind of ["request", "purchase", "warehouse", "receipt"]) {
    const mediaId = createHash("sha256")
      .update(`${id}-${imageKind}`)
      .digest("hex");
    images.set(imageKind, mediaId);
    await db.doc(`orderMedia/${mediaId}`).set({
      orderId: id,
      kind: imageKind,
      state: "ready",
      objectPath: `private-orders/${id}/${mediaId}`,
      mime: "image/png",
      description: "Role fixture",
    });
  }
  const download = vi
    .spyOn(
      getStorage().bucket().file("fixture").constructor.prototype,
      "download",
    )
    .mockResolvedValue([Buffer.from(png, "base64")]);
  try {
    for (const uid of [mixedWarehouse, mixedSupport]) {
      const listed = await media.listOrderImages.run(req(uid, { orderId: id }));
      expect(listed.rows.map((row) => row.kind).sort()).toEqual([
        "purchase",
        "request",
        "warehouse",
      ]);
      for (const row of listed.rows) {
        expect(
          await media.readOrderImage.run(req(uid, { id: row.id })),
        ).toMatchObject({ base64: png });
      }
      await expect(
        media.readOrderImage.run(req(uid, { id: images.get("receipt") })),
      ).rejects.toMatchObject({ code: "permission-denied" });
    }
    await expect(
      media.listOrderImages.run(req(unassigned, { orderId: id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await db.doc(`staffAccess/${mixedWarehouse}`).update({ orderIds: [] });
    expect(
      (
        await media.listOrderImages.run(req(mixedWarehouse, { orderId: id }))
      ).rows
        .map((row) => row.kind)
        .sort(),
    ).toEqual(["request", "warehouse"]);
    await expect(
      media.readOrderImage.run(
        req(mixedWarehouse, { id: images.get("purchase") }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await db.doc(`staffAccess/${mixedSupport}`).update({ active: false });
    await expect(
      media.listOrderImages.run(req(mixedSupport, { orderId: id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await db.doc(`staffAccess/${mixedWarehouse}`).update({ locked: true });
    await expect(
      media.readOrderImage.run(
        req(mixedWarehouse, { id: images.get("warehouse") }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(download).toHaveBeenCalledTimes(6);
  } finally {
    download.mockRestore();
  }
});

it("private read refuses access revoked while image bytes are downloading", async () => {
  const id = `${prefix}-io`,
    uid = `${prefix}-io-owner`,
    mediaId = createHash("sha256").update(id).digest("hex");
  await db.doc(`orders/${id}`).set({ ownerId: uid });
  await db.doc(`orderMedia/${mediaId}`).set({
    orderId: id,
    kind: "request",
    state: "ready",
    objectPath: `private-orders/${id}/${mediaId}`,
    mime: "image/png",
    description: "I/O revocation fixture",
  });
  const download = vi
    .spyOn(
      getStorage().bucket().file("fixture").constructor.prototype,
      "download",
    )
    .mockImplementationOnce(async () => {
      // First authorization has completed; revoke before the pending I/O resolves.
      await db.doc(`users/${uid}`).set({ locked: true });
      return [Buffer.from(png, "base64")];
    });
  try {
    await expect(
      media.readOrderImage.run(req(uid, { id: mediaId })),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(download).toHaveBeenCalledTimes(1);
  } finally {
    download.mockRestore();
  }
});

// Corrupted staff metadata must not widen private-image access.
it.each([
  { label: "truthy inactive", active: "false", roles: ["OWNER"], orderIds: [] },
  { label: "string roles", active: true, roles: "NOT_OWNER", orderIds: [] },
  { label: "object roles", active: true, roles: {}, orderIds: [] },
  {
    label: "substring assignment",
    active: true,
    roles: ["BUYER"],
    orderIds: `prefix-${prefix}-suffix`,
  },
])(
  "MEDIA025 rejects malformed $label grants before private listing",
  async ({ label, ...access }) => {
    const uid = `${prefix}-malformed-${label.replaceAll(" ", "-")}`;
    await db.doc(`staffAccess/${uid}`).set(access);
    await expect(
      media.listOrderImages.run(req(uid, { orderId: prefix })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);
