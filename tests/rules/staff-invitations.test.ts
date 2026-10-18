import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, afterAll, expect, test } from "vitest";
const sharedDemo =
  process.env.FIRESTORE_EMULATOR_HOST === "127.0.0.1:18207" &&
  process.env.FIREBASE_AUTH_EMULATOR_HOST === "127.0.0.1:19207";
const isolatedCi =
  process.env.GITHUB_ACTIONS === "true" &&
  process.env.SATSUNICGO_RULES_GROUP === "baseline" &&
  process.env.FUNCTIONS_EMULATOR === "true" &&
  process.env.FIRESTORE_EMULATOR_HOST === "127.0.0.1:8181" &&
  process.env.FIREBASE_AUTH_EMULATOR_HOST === "127.0.0.1:9199";
if (
  (!sharedDemo && !isolatedCi) ||
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
)
  throw Error("Only shared demo or isolated CI demo emulators allowed");
const id = randomUUID(),
  app = initializeApp({ projectId: "demo-satsunicgo" }, `staff-rules-${id}`),
  db = getFirestore(app);
let token: string, uid: string;
const collections = ["staffInvitations", "staffInvitationMailJobs"];
beforeAll(async () => {
  const response = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestUri: "http://127.0.0.1:5207",
        postBody: new URLSearchParams({
          providerId: "google.com",
          id_token: JSON.stringify({
            sub: `staff-rules-${id}`,
            email: `${id}@example.invalid`,
            email_verified: true,
          }),
        }).toString(),
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();
  expect(response.status).toBe(200);
  token = data.idToken;
  uid = data.localId;
  await db
    .doc(`staffAccess/${uid}`)
    .set({ roles: ["OWNER"], active: true, locked: false });
  for (const collection of collections)
    await db.doc(`${collection}/${id}`).set({ state: "pending" });
});
afterAll(async () => {
  for (const collection of collections)
    await db.doc(`${collection}/${id}`).delete();
  if (uid) {
    await db.doc(`staffAccess/${uid}`).delete();
    await getAuth(app).deleteUser(uid);
  }
  await db.terminate();
  await deleteApp(app);
});
for (const collection of collections)
  test(`${collection} denies direct reads, listing and writes even to verified owner`, async () => {
    const base = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-satsunicgo/databases/(default)/documents/${collection}`;
    for (const authorization of ["", `Bearer ${token}`]) {
      const headers = {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      };
      expect((await fetch(`${base}/${id}`, { headers })).status).toBe(403);
      expect((await fetch(base, { headers })).status).toBe(403);
      expect(
        (
          await fetch(`${base}/${id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              fields: { state: { stringValue: "accepted" } },
            }),
          })
        ).status,
      ).toBe(403);
    }
  });
