import process from "node:process";
import console from "node:console";
const { fetch } = globalThis;
import assert from "node:assert/strict";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
if (
  process.env.GCLOUD_PROJECT &&
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
)
  throw Error("Demo project only");
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST,
  firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
if (authHost !== "127.0.0.1:9198" || firestoreHost !== "127.0.0.1:8181")
  throw Error("Dedicated emulators required");
const endpoint =
  "http://127.0.0.1:5101/demo-satsunicgo/asia-southeast1/command";
async function signup() {
  const response = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-only`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: `fixture-${randomUUID()}@example.invalid`,
        password: "Emulator-fixture-only-123!",
        returnSecureToken: true,
      }),
    },
  );
  assert.equal(response.status, 200);
  return response.json();
}
async function command(token, data) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ data }),
  });
  return { status: response.status, body: await response.json() };
}
const a = await signup(),
  b = await signup();
const payload = {
  market: "US",
  items: [{ name: "HTTP fixture", quantity: 1, variant: "fixture", url: "" }],
  notes: "Emulator only",
};
const input = { action: "submitRequest", operationId: randomUUID(), payload };
const anonymous = await command(null, input);
assert.equal(anonymous.body.error?.status, "UNAUTHENTICATED");
const forged = await command("invalid-token", input);
assert.equal(forged.body.error?.status, "UNAUTHENTICATED");
const created = await command(a.idToken, input);
assert.equal(created.status, 200);
assert.ok(created.body.result.id);
const duplicate = await command(a.idToken, input);
assert.deepEqual(duplicate.body.result, created.body.result);
const forbidden = await command(b.idToken, {
  action: "acceptQuote",
  operationId: randomUUID(),
  orderId: created.body.result.id,
  expectedVersion: created.body.result.version,
  payload: { quoteVersion: 1 },
});
assert.equal(forbidden.body.error?.status, "PERMISSION_DENIED");
initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore(),
  slug = `http-${randomUUID()}`;
await db
  .doc(`posts/${slug}`)
  .set({
    status: "published",
    slug,
    title: "HTTP public fixture",
    body: "Readable fixture <script>unsafe()</script>",
    seoTitle: "Fixture search title",
    seoDescription: "Fixture search description",
  });
await db
  .doc(`posts/draft-${slug}`)
  .set({
    status: "draft",
    slug: `draft-${slug}`,
    title: "Private draft",
    body: "PRIVATE_DRAFT_FIXTURE",
  });
const publicEndpoint =
  "http://127.0.0.1:5101/demo-satsunicgo/asia-southeast1/publicPage";
const published = await fetch(`${publicEndpoint}/posts/${slug}`),
  html = await published.text();
assert.equal(published.status, 200);
assert.ok(html.includes("Readable fixture &lt;script&gt;"));
assert.ok(html.includes("<title>Fixture search title · SatsunicGo</title>"));
assert.ok(html.includes("Fixture search description"));
assert.ok(html.includes('id="root"'));
assert.ok(/type="module" src="\/assets\/[a-zA-Z0-9._-]+\.js"/.test(html));
assert.ok(!html.includes("<script>unsafe()</script>"));
const draft = await fetch(`${publicEndpoint}/posts/draft-${slug}`);
assert.equal(draft.status, 404);
assert.ok(!(await draft.text()).includes("PRIVATE_DRAFT_FIXTURE"));
await db.terminate();
console.log(
  "PASS: callable HTTP emulator authentication, invalid-token denial, persistence, idempotency, cross-customer denial; public HTML/SEO/client entry and private-draft denial. Hosting, App Check and real Google login NOT_TESTED.",
);
